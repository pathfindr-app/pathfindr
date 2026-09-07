/* Reuse Classic's route cinema, optical scaling and search cooling. */
window.PathfindrAudio={state:{enabled:false,bass:0}};
function drawSmoothPath(ctx,points){
 if(points.length<2)return;ctx.beginPath();ctx.moveTo(points[0].x,points[0].y);
 if(points.length===2){ctx.lineTo(points[1].x,points[1].y);return;}
 for(let i=0;i<points.length-1;i++){
  const a=points[i],b=points[i+1];
  if(i===0)ctx.lineTo((a.x+b.x)/2,(a.y+b.y)/2);
  else if(i===points.length-2)ctx.quadraticCurveTo(a.x,a.y,b.x,b.y);
  else{const c=points[i+2];ctx.quadraticCurveTo(b.x,b.y,(b.x+c.x)/2,(b.y+c.y)/2);}
 }
}
function PathfindrArenaPresentation({ctx,graph,view,screen,colors}){
 const cache=new Map(),projected=new WeakMap(),rgb=colors.map(c=>({r:parseInt(c.slice(1,3),16),g:parseInt(c.slice(3,5),16),b:parseInt(c.slice(5,7),16)}));let signature='',version=0;
 PathfindrFidelity.current=()=>PathfindrFidelity.atZoom(15+Math.log2(view.scale/.75));
 function route(ids,player,time,optimal=false,history=false){
  const origin=screen({x:0,y:0}),key=`${origin.x}:${origin.y}:${view.scale}`;if(signature!==key){signature=key;version++;}
  let saved=projected.get(ids);if(!saved||saved.version!==version||saved.length!==ids.length||saved.tail!==ids.at(-1)){saved={version,length:ids.length,tail:ids.at(-1),points:ids.map(id=>screen(graph().nodes.get(id)))};projected.set(ids,saved);}
  PathfindrRouteCinema.route(ctx,saved.points,rgb[player],time,optimal,history);
 }
 function search(analysis,archive,player,time){
  let batches=cache.get(analysis);if(!batches){
   batches=Array.from({length:32},()=>new Path2D());batches.full=new Path2D();const stride=Math.max(1,Math.ceil(analysis.explored.length/3000));analysis.explored.forEach((edge,i)=>{if(i%stride)return;const a=graph().nodes.get(edge.from),b=graph().nodes.get(edge.to),path=batches[Math.min(31,Math.floor(i/analysis.explored.length*32))];path.moveTo(a.x,a.y);path.lineTo(b.x,b.y);batches.full.moveTo(a.x,a.y);batches.full.lineTo(b.x,b.y);});cache.set(analysis,batches);
  }
  const age=Math.max(0,time-archive.at),reduced=PathfindrMotion.reduced(),progress=reduced?1:Math.min(1,age/1900),count=Math.ceil(progress*32),cool=PathfindrSearchAfterglow.gain(Math.max(0,age-1900),reduced),optics=PathfindrFidelity.current();
  ctx.save();const origin=screen({x:0,y:0});ctx.translate(origin.x,origin.y);ctx.scale(view.scale,view.scale);ctx.strokeStyle=colors[player];ctx.lineCap='round';
  for(let i=0;i<(progress===1?1:count);i++){
   const frontier=progress<1?Math.exp(-Math.pow((count-1-i)/2,2)):0;
   const path=progress===1?batches.full:batches[i];ctx.globalAlpha=(.025+.035*frontier)*cool;ctx.lineWidth=9*optics.halo/view.scale;ctx.stroke(path);
   ctx.globalAlpha=(.16+.65*frontier)*cool;ctx.lineWidth=(.8+frontier*.8)/view.scale;ctx.stroke(path);
  }
  // A packet travels along real expanded tree edges, never a radial ring.
  if(!reduced&&analysis.explored.length){
   ctx.fillStyle=colors[player];
   for(let i=0;i<Math.min(24,count*2);i++){
    const rank=Math.max(0,Math.min(analysis.explored.length-1,Math.floor(progress*analysis.explored.length)-1-i*7)),edge=analysis.explored[rank],a=graph().nodes.get(edge.from),b=graph().nodes.get(edge.to),packet=PathfindrSearchAfterglow.packet(age,i);
    ctx.globalAlpha=packet.alpha*cool;ctx.beginPath();ctx.arc(a.x+(b.x-a.x)*packet.position,a.y+(b.y-a.y)*packet.position,1.8/view.scale,0,Math.PI*2);ctx.fill();
   }
  }
  ctx.restore();
  const reveal=reduced?1:Math.max(0,Math.min(1,(age-1650)/1100));
  if(reveal>0){const points=reveal===1?analysis.path:analysis.path.slice(0,Math.max(2,Math.ceil(analysis.path.length*reveal)));route(points,player,time/1000,true,age>3200);}
 }
 function marker(point,player,label,time,head=false,small=false){
  const reduced=PathfindrMotion.reduced(),r=head?16:small?15:19,color=colors[player],t=reduced?0:time;
  ctx.save();ctx.translate(point.x,point.y);
  const glow=ctx.createRadialGradient(0,0,r*.5,0,0,r+22);glow.addColorStop(0,color+'60');glow.addColorStop(1,color+'00');ctx.fillStyle=glow;ctx.beginPath();ctx.arc(0,0,r+22,0,Math.PI*2);ctx.fill();
  ctx.fillStyle=head?'#111725':color;ctx.strokeStyle=head?color:'#effcff';ctx.lineWidth=2.2;ctx.beginPath();ctx.arc(0,0,r,0,Math.PI*2);ctx.fill();ctx.stroke();
  ctx.strokeStyle=color;ctx.globalAlpha=.65;ctx.lineWidth=1.5;
  for(let i=0;i<2;i++){ctx.beginPath();ctx.arc(0,0,r+7+i*5,t*(i?-.6:.75)+i*2.5,t*(i?-.6:.75)+i*2.5+1.9);ctx.stroke();}ctx.globalAlpha=1;
  if(head){ctx.fillStyle=color;ctx.beginPath();if(player===0){ctx.moveTo(0,-10);ctx.lineTo(8,8);ctx.lineTo(0,4);ctx.lineTo(-8,8);}else if(player===1){ctx.moveTo(0,-9);ctx.lineTo(8,0);ctx.lineTo(0,9);ctx.lineTo(-8,0);}else if(player===2){ctx.rect(-6,-6,12,12);}else ctx.arc(0,0,7,0,Math.PI*2);ctx.closePath();ctx.fill();}
  else{ctx.fillStyle='#111725';ctx.font='bold 16px "Space Mono",monospace';ctx.textAlign='center';ctx.fillText(label,0,5);}
  ctx.restore();
 }
 return {route,search,marker};
}
