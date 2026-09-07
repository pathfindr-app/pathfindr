/* New Cairo client: canvas presentation + input; rules live in core.js. */
(()=>{'use strict';
 const A=PathfindrArena,$=id=>document.getElementById(id),canvas=$('map'),ctx=canvas.getContext('2d'),colors=['#70e7ed','#ffaabb','#efd076','#9cd8ac'];
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches,view={x:0,y:0,scale:.12,targetX:0,targetY:0,targetScale:.12};
 let graph,pack,match,transport,snapshot,base,baseCtx,roads,buildings,parks,water,w=0,h=0,dpr=1,mode='draw',armed=null,ready=false,drag=null,last=0,lastUi=0,lastEvent=0,noticeUntil=0,dirty=true,panUntil=0,ended=false,audio,runVersion=0;
 const pointers=new Map();let pinch=null,input,presentation,followedNode=null;
 function resize(){w=innerWidth;h=innerHeight;dpr=Math.min(devicePixelRatio||1,1.75);canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);base=document.createElement('canvas');base.width=canvas.width;base.height=canvas.height;baseCtx=base.getContext('2d');dirty=true;}
 const screen=p=>({x:(p.x-view.x)*view.scale+w/2,y:(p.y-view.y)*view.scale+h/2});
 const world=p=>({x:(p.x-w/2)/view.scale+view.x,y:(p.y-h/2)/view.scale+view.y});
 const head=()=>match.position(match.state.players[0]);
 function message(text,error=false){$('notice').textContent=text;$('notice').className='visible'+(error?' error':'');noticeUntil=performance.now()+3200;}
 function sound(type){try{audio??=new (window.AudioContext||window.webkitAudioContext)();audio.resume().catch(()=>{});const o=audio.createOscillator(),gain=audio.createGain();o.type=type==='cut'?'sawtooth':'sine';const t=audio.currentTime;
  const frequencies={collect:[520,1040],checkpoint:[350,740],cut:[180,70],repair:[240,650],shortcut:[220,1200],barrier:[100,210]};const [a,b]=frequencies[type]||[210,160];o.frequency.setValueAtTime(a,t);o.frequency.exponentialRampToValueAtTime(b,t+.19);gain.gain.setValueAtTime(.0001,t);gain.gain.exponentialRampToValueAtTime(.06,t+.015);gain.gain.exponentialRampToValueAtTime(.0001,t+.25);o.connect(gain);gain.connect(audio.destination);o.start(t);o.stop(t+.27);}catch{}}
 function pathRings(path,rings){for(const ring of rings){if(!ring.length)continue;ring.forEach((v,i)=>{const p=graph.project(v);i?path.lineTo(p.x,p.y):path.moveTo(p.x,p.y);});path.closePath();}}
 function prepareArt(){roads=new Path2D();for(const e of graph.edges){const a=graph.nodes.get(e.a),b=graph.nodes.get(e.b);roads.moveTo(a.x,a.y);roads.lineTo(b.x,b.y);}buildings=new Path2D();
  for(const f of pack.buildings.features){if(f.geometry.type==='Polygon')pathRings(buildings,f.geometry.coordinates);else if(f.geometry.type==='MultiPolygon')for(const p of f.geometry.coordinates)pathRings(buildings,p);}
  parks=new Path2D();water=new Path2D();for(const s of pack.world.surfaces||[])pathRings(s.kind==='water'?water:parks,s.rings);
 }
 function drawBase(){const c=baseCtx;c.setTransform(dpr,0,0,dpr,0,0);c.fillStyle='#111522';c.fillRect(0,0,w,h);c.save();c.translate(w/2,h/2);c.scale(view.scale,view.scale);c.translate(-view.x,-view.y);
  c.fillStyle='#193630';c.fill(parks,'evenodd');c.fillStyle='#173842';c.fill(water,'evenodd');const roofs=c.createLinearGradient(-3000,-3000,3000,3000);roofs.addColorStop(0,'#273a44');roofs.addColorStop(.5,'#242e3d');roofs.addColorStop(1,'#343341');c.fillStyle=roofs;c.fill(buildings,'evenodd');c.strokeStyle='#73949b35';c.lineWidth=.6/view.scale;c.stroke(buildings);c.lineWidth=1.8/view.scale;c.strokeStyle='#283744';c.stroke(roads);c.lineWidth=.55/view.scale;c.strokeStyle='#526d7766';c.stroke(roads);c.restore();
  c.font='10px monospace';c.fillStyle='#758d9a';for(const label of pack.labels){if(label.type==='street'||label.name.length>32)continue;const p=screen(graph.project(label.pos));if(p.x>30&&p.x<w-80&&p.y>200&&p.y<h-230)c.fillText(label.name,p.x,p.y);}
  // Marginal graticule: framing marks only, never fake street connections.
  c.strokeStyle='#71929b44';c.lineWidth=1;for(let x=25;x<w;x+=80){c.beginPath();c.moveTo(x,0);c.lineTo(x,6);c.moveTo(x,h);c.lineTo(x,h-6);c.stroke();}for(let y=30;y<h;y+=80){c.beginPath();c.moveTo(0,y);c.lineTo(6,y);c.moveTo(w,y);c.lineTo(w-6,y);c.stroke();}dirty=false;
 }
 function line(points,color,width,dashes=[]){if(points.length<2)return;ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.strokeStyle=color;ctx.lineWidth=width;ctx.setLineDash(dashes);ctx.stroke();ctx.setLineDash([]);}
 function nodeScreen(id){return screen(graph.nodes.get(id));}
 function draw(now){if(!graph||!match)return;ctx.setTransform(dpr,0,0,dpr,0,0);if(dirty)drawBase();ctx.drawImage(base,0,0,w,h);const state=match.state,t=reduced?0:state.time/1000;ctx.lineCap='round';ctx.lineJoin='round';
  for(const b of state.barriers){const p=nodeScreen(b.node),radius=A.RULES.barrierRadius*view.scale;ctx.beginPath();ctx.arc(p.x,p.y,radius,0,Math.PI*2);ctx.fillStyle='#ed527724';ctx.fill();ctx.strokeStyle='#f27893';ctx.lineWidth=1.4;ctx.setLineDash([5,5]);ctx.lineDashOffset=-t*10;ctx.stroke();ctx.setLineDash([]);ctx.font='10px monospace';ctx.fillStyle='#ffb4c3';ctx.textAlign='center';ctx.fillText(`${Math.ceil((b.until-state.time)/1000)}s`,p.x,p.y+3);}
  for(const item of state.pickups){if(item.claimedBy!==null)continue;const p=nodeScreen(item.node);if(p.x<-20||p.x>w+20||p.y<0||p.y>h)continue;const nearby=A.distance(head(),graph.nodes.get(item.node))<=A.RULES.collectRadius;
   ctx.save();ctx.translate(p.x,p.y);ctx.rotate(Math.PI/4);ctx.fillStyle=nearby?'#f4d29b':'#7f7968';ctx.shadowColor='#efc687';ctx.shadowBlur=nearby&&!reduced?10:0;const s=nearby?5.5+Math.sin(t*3)*.5:3;ctx.fillRect(-s,-s,s*2,s*2);ctx.restore();}
  for(const p of state.players)for(const archive of p.archives){presentation.route(archive.path,p.id,t,false,true);presentation.search(match.analyses[archive.route],archive,p.id,state.time);}
  for(const p of state.players){const color=colors[p.id],pos=screen(match.position(p));
   if(!(p.revealUntil>state.time)&&p.assignment!==null)presentation.route(p.path,p.id,t);
   if(p.id===0&&p.queue.length){const future=[pos,...p.queue.map(nodeScreen)];ctx.globalAlpha=.6;line(future,color,1.5,[3,7]);ctx.globalAlpha=1;}
   presentation.marker(pos,p.id,'',t,true);ctx.font='bold 12px "Space Mono",monospace';ctx.textAlign='center';ctx.fillStyle=color;ctx.fillText(p.name,pos.x,pos.y-37);
   if(p.repair){const socket=nodeScreen(p.repair.to);line([pos,socket],'#fa7596',1,[3,4]);ctx.strokeStyle='#fa7596';ctx.strokeRect(socket.x-9,socket.y-9,18,18);ctx.fillStyle='#ffb9c9';ctx.fillText('RECONNECT',socket.x,socket.y-18);}
  }
  for(const player of state.players){if(player.assignment===null)continue;const pair=state.routes[player.assignment];
   for(const [letter,id] of [['S',pair.start],['E',pair.end]]){const p=nodeScreen(id),active=player.id===0;
    presentation.marker(p,player.id,letter,t,false,!active);ctx.fillStyle=colors[player.id];ctx.textAlign='center';ctx.font='11px "Space Mono",monospace';ctx.fillText(`${player.name} · R${player.assignment+1}`,p.x,p.y+40);
   }
  }
  if(PathfindrTrace.active&&PathfindrTrace.focus){const f=PathfindrTrace.focus;ctx.beginPath();ctx.arc(f.x,f.y,22,0,Math.PI*2);ctx.strokeStyle=PathfindrTrace.stalled?'#ff7595':'#82edf066';ctx.lineWidth=1;ctx.stroke();}
  const steering=input?.direction();if(steering){const p=screen(head()),[dx,dy]=steering.vector;ctx.save();ctx.translate(p.x+dx*39,p.y+dy*39);ctx.rotate(Math.atan2(dy,dx));ctx.strokeStyle=steering.buffered?'#efcc8e':colors[0];ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-5,-5);ctx.lineTo(1,0);ctx.lineTo(-5,5);ctx.stroke();ctx.restore();}
  if(armed==='shortcut'){const p=screen(head());ctx.beginPath();ctx.arc(p.x,p.y,A.RULES.shortcutMeters*view.scale,0,Math.PI*2);ctx.strokeStyle='#eccd85';ctx.lineWidth=1;ctx.setLineDash([4,7]);ctx.stroke();ctx.setLineDash([]);}
 }
 function frame(){if(!match)return;const p=match.state.players[0],a=p.revealUntil>match.state.time?graph.nodes.get(p.legStart):match.position(p),b=graph.nodes.get(match.target(p))||a,top=190,bottom=$('console')?.getBoundingClientRect().top||document.querySelector('.console').getBoundingClientRect().top-35,usableW=w-85,usableH=Math.max(160,bottom-top);
  view.targetScale=Math.max(.025,Math.min(.75,usableW/(Math.abs(a.x-b.x)+220),usableH/(Math.abs(a.y-b.y)+220)));view.targetX=(a.x+b.x)/2;view.targetY=(a.y+b.y)/2-((top+bottom)/2-h/2)/view.targetScale;panUntil=performance.now()+800;followedNode=p.node;}
 function camera(dt,now){if(!match)return;const player=match.state.players[0],p=screen(head()),changed=player.node!==followedNode;followedNode=player.node;if(changed&&!(player.revealUntil>match.state.time)&&now>panUntil&&!drag&&!PathfindrTrace.active){const top=190,bottom=document.querySelector('.console').getBoundingClientRect().top-25,cy=(top+bottom)/2;
   if(p.x<w*.3||p.x>w*.7||p.y<top+(bottom-top)*.3||p.y>bottom-(bottom-top)*.3){view.targetX+=(p.x-w/2)/view.scale;view.targetY+=(p.y-cy)/view.scale;}}
  const alpha=reduced?1:1-Math.exp(-dt/160),before=[view.x,view.y,view.scale];view.x+=(view.targetX-view.x)*alpha;view.y+=(view.targetY-view.y)*alpha;view.scale+=(view.targetScale-view.scale)*alpha;if(Math.abs(view.x-before[0])+Math.abs(view.y-before[1])+Math.abs(view.scale-before[2])*1000>.05)dirty=true;
 }
 function updateUi(){snapshot=match.state;const p=snapshot.players[0];$('clock').textContent=`${String(Math.floor(snapshot.time/60000)).padStart(2,'0')}:${String(Math.floor(snapshot.time/1000)%60).padStart(2,'0')}`;
  const recap=p.archives.at(-1);$('objective').textContent=p.repair?'REPAIR / RECONNECT THE RED SOCKET':p.revealUntil>snapshot.time?`A* · YOUR ${(recap.meters/1000).toFixed(2)} km / OPTIMAL ${(recap.optimal/1000).toFixed(2)} km · ${recap.points} PTS`:p.finishedAt!==null?'ALL FIVE ROUTES COMPLETE':p.assignment===null?'WAITING FOR A FREE ROUTE':`ROUTE ${p.assignment+1} · ${p.goal}/5 COMPLETE · ${(p.legMeters/1000).toFixed(2)} km`;$('credits').textContent=`${p.credits} CHARGE`;
  for(const player of snapshot.players){const el=$('racer-'+player.id);el.dataset.repair=!!player.repair;el.querySelector('span').textContent=`${player.goal}/5 · ${player.score}`;}
  $('collect').disabled=!snapshot.pickups.some(i=>i.claimedBy===null&&A.distance(head(),graph.nodes.get(i.node))<=A.RULES.collectRadius)||snapshot.status!=='playing';
  for(const [id,cost]of [['barrier',3],['cut',4],['shortcut',5]])$(id).disabled=p.credits<cost||snapshot.status!=='playing'||p.finishedAt!==null;
  for(const event of snapshot.events)if(event.id>lastEvent){lastEvent=event.id;if(event.player===0||event.type==='finish'){message(event.message,event.type==='rejected'||event.type==='cut');if(event.type!=='rejected')sound(event.type);if(event.player===0&&['checkpoint','assignment','cut','repair'].includes(event.type)){PathfindrTrace.cancel?.();frame();}if(event.type==='cut'&&event.player===0){navigator.vibrate?.([50,40,50]);$('arena').classList.remove('repair-flash');void $('arena').offsetWidth;$('arena').classList.add('repair-flash');}}}
  $('pause').disabled=snapshot.status==='finished';
  if(snapshot.status==='finished'&&!ended){ended=true;$('winner').textContent=snapshot.winner===0?'You own the circuit.':`${snapshot.players[snapshot.winner].name} takes the circuit.`;$('final-scores').replaceChildren();for(const id of match.ranking()){const player=snapshot.players[id],li=document.createElement('li'),name=document.createElement('b'),score=document.createElement('span');name.textContent=player.name;name.style.color=colors[id];const finish=player.finishedAt===null?'unfinished':`${Math.floor(player.finishedAt/60000)}:${String(Math.floor(player.finishedAt/1000)%60).padStart(2,'0')}`;score.textContent=`${player.goal}/5 · ${finish} · ${player.score} pts`;li.append(name,score);$('final-scores').append(li);}$('results').showModal();}
 }
 function setMode(next){mode=next;armed=null;PathfindrTrace.setMode(next==='trace'?'trace':'tap');for(const id of ['draw','trace']){$(id).classList.toggle('selected',id===next);$(id).setAttribute('aria-pressed',String(id===next));}for(const id of ['barrier','cut','shortcut'])$(id).classList.remove('armed');$('hint').textContent=next==='trace'?'Trace to draw. Retrace to erase. Drag away from your head to pan.':'Tap streets to draw. Drag to pan. WASD / arrows also trace.';}
 function arm(type){if(armed===type){setMode(mode);return;}armed=type;for(const id of ['barrier','cut','shortcut'])$(id).classList.toggle('armed',id===type);$('hint').textContent={barrier:'Tap a street to place a safe 100 m barrier.',cut:'Tap a rival signal or its standing above to cut its route.',shortcut:'Tap a street inside the amber 220 m ring.'}[type];}
 function action(x,y){if(!match||match.state.status!=='playing')return;const p=world({x,y});
  if(armed==='cut'){let victim=null,best=36;for(const v of match.state.players.slice(1)){const s=screen(match.position(v)),d=Math.hypot(s.x-x,s.y-y);if(d<best){best=d;victim=v.id;}}if(victim!==null){transport.send('cut',{victim});setMode(mode);}else message('Tap a rival signal, or its name in the standings.',true);return;}
  if(!armed){const item=match.state.pickups.filter(i=>i.claimedBy===null).find(i=>{const s=nodeScreen(i.node);return Math.hypot(s.x-x,s.y-y)<16&&A.distance(head(),graph.nodes.get(i.node))<=A.RULES.collectRadius;});if(item){transport.send('collect',{item:item.id});return;}}
  const zoom=15+Math.log2(view.scale/.75),radius=PathfindrRouteInput.targetPixels(zoom,matchMedia('(pointer:coarse)').matches);
  const node=graph.nearest(p.x,p.y,radius/view.scale);if(node===null){message('Follow the visible street network.',true);return;}
  transport.send(armed||'plan',{node});if(armed)setMode(mode);
 }
 canvas.addEventListener('pointerdown',e=>{if(!ready||match.state.status!=='playing')return;canvas.setPointerCapture(e.pointerId);pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
  if(pointers.size===2){const [a,b]=[...pointers.values()];pinch={distance:Math.hypot(a.x-b.x,a.y-b.y),scale:view.targetScale};drag=null;return;}
  drag={x:e.clientX,y:e.clientY,lastX:e.clientX,lastY:e.clientY,time:performance.now(),pan:false,moved:false};
 });
 canvas.addEventListener('pointermove',e=>{if(!pointers.has(e.pointerId))return;pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});if(pinch&&pointers.size===2){const [a,b]=[...pointers.values()];view.targetScale=Math.max(.07,Math.min(1.6,pinch.scale*Math.hypot(a.x-b.x,a.y-b.y)/pinch.distance));panUntil=performance.now()+2000;return;}if(!drag)return;
  const dx=e.clientX-drag.lastX,dy=e.clientY-drag.lastY;drag.moved||=Math.hypot(e.clientX-drag.x,e.clientY-drag.y)>8;
  if(drag.moved){drag.pan=true;view.targetX-=dx/view.scale;view.targetY-=dy/view.scale;panUntil=performance.now()+2000;}
  drag.lastX=e.clientX;drag.lastY=e.clientY;
 });
 function release(e){pointers.delete(e.pointerId);if(drag&&!drag.pan&&!drag.moved&&e.type!=='pointercancel')action(e.clientX,e.clientY);drag=null;if(pointers.size<2)pinch=null;}
 canvas.addEventListener('pointerup',release);canvas.addEventListener('pointercancel',release);canvas.addEventListener('contextmenu',e=>e.preventDefault());
 canvas.addEventListener('wheel',e=>{e.preventDefault();view.targetScale=Math.max(.07,Math.min(1.6,view.targetScale*Math.exp(-e.deltaY*.001)));panUntil=performance.now()+2000;},{passive:false});
 $('draw').onclick=()=>setMode('draw');$('trace').onclick=()=>setMode('trace');$('undo').onclick=()=>{PathfindrTrace.cancel?.();if(!PathfindrTrace.undo())transport?.send('undo');};for(const id of ['barrier','cut','shortcut'])$(id).onclick=()=>arm(id);
 $('collect').onclick=()=>{const item=match.state.pickups.find(i=>i.claimedBy===null&&A.distance(head(),graph.nodes.get(i.node))<=A.RULES.collectRadius);if(item)transport.send('collect',{item:item.id});};
 $('focus').onclick=frame;$('zoom-in').onclick=()=>view.targetScale=Math.min(1.6,view.targetScale*1.3);$('zoom-out').onclick=()=>view.targetScale=Math.max(.07,view.targetScale/1.3);
 function pause(){if(!match)return;if(match.state.status==='playing'){match.pause();$('pause').textContent='Play';}else if(match.state.status==='paused'){match.resume();$('pause').textContent='Pause';}}
 $('pause').onclick=pause;$('help').onclick=()=>{if($('briefing').open)return;if(match?.state.status==='playing')pause();$('briefing').showModal();$('start').textContent=ready?'Resume circuit':'Preparing New Cairo…';};
 $('briefing').addEventListener('cancel',e=>{if(!ready||match.state.status==='ready')e.preventDefault();});
 $('start').onclick=()=>{if(!ready){load();return;}$('briefing').close();match.start();match.resume();$('pause').textContent='Pause';frame();sound('checkpoint');};
 $('restart').onclick=()=>{$('results').close();newMatch();match.start();frame();};
 document.addEventListener('keydown',e=>{if(e.target.closest('button,a,input,dialog')||!ready)return;if(e.code==='Space'){e.preventDefault();pause();}if(e.key.toLowerCase()==='f'){if(document.fullscreenElement)document.exitFullscreen();else $('arena').requestFullscreen?.().catch(()=>{});}if(e.key==='Escape')setMode('draw');});
 document.addEventListener('visibilitychange',()=>{if(document.hidden&&match?.state.status==='playing')pause();});
 function newMatch(){match=A.create(graph);transport=A.localTransport(match);lastEvent=0;ended=false;armed=null;const standings=$('standings');standings.replaceChildren();for(const p of match.state.players){const el=document.createElement('button');el.className='racer';el.id='racer-'+p.id;el.style.setProperty('--signal',colors[p.id]);el.setAttribute('aria-label',p.id?`${p.name} rival`:'Your signal');const strong=document.createElement('strong'),span=document.createElement('span');strong.textContent=p.name;el.append(strong,span);el.onclick=()=>{if(armed==='cut'&&p.id){transport.send('cut',{victim:p.id});setMode(mode);}else{const target=match.position(p);view.targetX=target.x;view.targetY=target.y;panUntil=performance.now()+3000;}};standings.append(el);}setMode('draw');updateUi();frame();}
 async function load(){const version=++runVersion;$('start').disabled=true;$('load-error').textContent='';try{const response=await fetch('../data/cities/fallback/new-cairo.json');if(!response.ok)throw Error('City pack unavailable');pack=await response.json();if(version!==runVersion)return;
   await new Promise(requestAnimationFrame);graph=A.makeGraph(pack);await new Promise(requestAnimationFrame);prepareArt();presentation=PathfindrArenaPresentation({ctx,graph:()=>graph,view,screen,colors});newMatch();ready=true;$('start').disabled=false;$('start').textContent='Start circuit';$('pause').disabled=false;dirty=true;
  }catch(error){$('load-error').textContent='New Cairo could not load. Check your connection and retry.';$('start').disabled=false;$('start').textContent='Retry city download';console.error('[Arena]',error);}}
 function loop(now){const dt=Math.min(100,now-(last||now));last=now;if(ready){transport.advance(dt);input.tick(dt);camera(dt,now);draw(now);if(now-lastUi>100){lastUi=now;updateUi();}if(now>noticeUntil)$('notice').classList.remove('visible');}requestAnimationFrame(loop);}
 window.render_game_to_text=()=>JSON.stringify({mode:'new-cairo-circuit',status:match?.state.status||'loading',coordinates:'Screen pixels: origin top left, x right, y down. World distances in meters.',clock:match?.state.time||0,view,players:match?.state.players.map(p=>({id:p.id,name:p.name,screen:screen(match.position(p)),goal:p.goal,credits:p.credits,score:p.score,repair:p.repair,queued:p.queue.length,finished:p.finishedAt})),target:match&&graph.nodes.get(match.target(match.state.players[0]))?nodeScreen(match.target(match.state.players[0])):null,abilities:armed,barriers:match?.state.barriers.map(b=>({screen:nodeScreen(b.node),until:b.until})),pickups:match?.state.pickups.filter(i=>i.claimedBy===null).map(i=>({id:i.id,screen:nodeScreen(i.node)})),winner:match?.state.winner,notice:$('notice').textContent});
 window.advanceTime=ms=>{if(!ready)return;for(let t=0;t<ms;t+=50){const dt=Math.min(50,ms-t);transport.advance(dt);input.tick(dt);}camera(Math.min(ms,100),performance.now());draw(performance.now());updateUi();};
 input=PathfindrArenaInput({canvas,graph:()=>graph,match:()=>match,send:(type,data)=>transport.send(type,data),screen,world,view,ready:()=>ready&&!armed&&!$('briefing').open&&!$('results').open,message,dirty:()=>{dirty=true;},frame});
 addEventListener('resize',resize);resize();requestAnimationFrame(loop);load();
})();
