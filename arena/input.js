/* Classic's gesture lifecycle, backtracking, guidance and edge pan, adapted to
 * the local match authority. No queued travel or input timer. */
function PathfindrArenaInput(api){
 'use strict';
 const T=window.PathfindrTrace,A=window.PathfindrArena,keys=new Set();
 let checkpointGoal=0,edgeVelocity={x:0,y:0},keyBudget=0,heading=null,steeredKey=null,turnMs=0,keySpeed=0,keyStroke=false,keyBlocked=false,road=null,turnTravel=0;
 const player=()=>api.match()?.state.players[0];
 const canDraw=()=>api.ready()&&api.match()?.state.status==='playing'&&player().assignment!==null&&!(player().revealUntil>api.match().state.time)&&player().finishedAt===null;
 const project=id=>api.screen(api.graph().nodes.get(id));
 const gap=p=>{const s=project(player().node);return Math.hypot(p.x-s.x,p.y-s.y);};
 const map={project:([lng,lat])=>api.screen(api.graph().project([lng,lat]))};
 function candidate(point){
  const graph=api.graph(),p=player(),pos=api.world(point),node=graph.nearest(pos.x,pos.y,24/api.view.scale);
  if(node===null||node===p.node)return null;
  const route=api.match().route(p.node,node);if(!route||route.meters>A.RULES.maxPlanMeters)return null;
  const anchor=graph.nodes.get(p.node),target=graph.nodes.get(node),coords=route.path.map(id=>graph.nodes.get(id));
  if(!PathfindrRouteInput.followsGesture(coords,map,anchor,target,22))return null;
  if(!PathfindrTraceGuide.allows(p.path.slice(-30).map(project),route.path.map(project),point,T.pointerType==='touch'))return null;
  return node;
 }
 function commit(point){
  if(!canDraw())return false;
  const p=player(),copy=[...p.path];
  if(T.backtrack(point,copy,project)){api.send('rewind',{length:copy.length});return true;}
  const target=api.match().target(p),tip=project(p.node),end=target!==undefined?project(target):null;
  if(p.path.length>1&&end&&Math.hypot(point.x-end.x,point.y-end.y)<(T.pointerType==='touch'?56:42)&&Math.hypot(tip.x-end.x,tip.y-end.y)<65){
   const r=api.match().route(p.node,target);if(r&&r.meters<=80){api.send('plan',{node:target});return true;}
  }
  const node=candidate(point);if(node===null)return false;api.send('plan',{node});return player().node===node||player().goal!==checkpointGoal;
 }
 T.init({surface:api.canvas,canDraw,
  nearTip:(p,r)=>gap(p)<=r,
  canResume:(p,r)=>gap(p)<=r&&candidate(p)!==null,
  snapshot:()=>({length:player().path.length,goal:player().goal,assignment:player().assignment}),
  changed:s=>s.length!==player().path.length||s.goal!==player().goal,
  restore:s=>{if(s.goal===player().goal&&s.assignment===player().assignment)api.send('undo');},
  begin(){checkpointGoal=player().goal;edgeVelocity={x:0,y:0};api.send('beginStroke');},commit,
  isFinished:()=>player().goal!==checkpointGoal,
  end(){edgeVelocity={x:0,y:0};api.send('endStroke');},
  progressKey:()=>`${player().node}:${player().path.length}`,
  tipGap:gap,warn:()=>{navigator.vibrate?.([35,45,35]);api.message('Trail stopped — retrace to a junction.',true);},
  pan(point,dt){
   if(document.elementFromPoint(point.x,point.y)?.closest('button,a,dialog,.console'))return false;
   const rect=api.canvas.getBoundingClientRect(),mobile=T.pointerType==='touch'||rect.width<=700;
   const focus=PathfindrEdgePan.focus(point,project(player().node));
   const top=document.querySelector('#standings').getBoundingClientRect().bottom+15,bottom=rect.bottom-document.querySelector('.console').getBoundingClientRect().top+15;
   const v=PathfindrEdgePan.velocity(focus,rect,{top,bottom},undefined,{mobile}),alpha=1-Math.exp(-dt/.09);
   edgeVelocity.x+=(v.x-edgeVelocity.x)*alpha;edgeVelocity.y+=(v.y-edgeVelocity.y)*alpha;
   const dx=edgeVelocity.x*dt/api.view.scale,dy=edgeVelocity.y*dt/api.view.scale;
   if(Math.hypot(dx,dy)<.05)return false;
   api.view.x+=dx;api.view.y+=dy;api.view.targetX=api.view.x;api.view.targetY=api.view.y;api.dirty();return true;
  }
 });
 const directions={ArrowUp:[0,-1],KeyW:[0,-1],ArrowDown:[0,1],KeyS:[0,1],ArrowLeft:[-1,0],KeyA:[-1,0],ArrowRight:[1,0],KeyD:[1,0]};
 document.addEventListener('keydown',e=>{
  if(!directions[e.code]||e.ctrlKey||e.metaKey||e.altKey||!canDraw()||e.target.closest('input,textarea,select,dialog'))return;
  e.preventDefault();if(keys.has(e.code))return; // OS repeat never changes turn priority.
  if(!keys.size){keyBudget=4;keySpeed=70;const p=player(),g=api.graph(),a=g.nodes.get(p.path.at(-2)),b=g.nodes.get(p.node);
   if(a){const length=Math.hypot(b.x-a.x,b.y-a.y)||1;heading={x:(b.x-a.x)/length,y:(b.y-a.y)/length};road=g.adj.get(a.id)?.find(edge=>edge.id===b.id)?.road||null;const d=directions[e.code];if(d[0]*heading.x+d[1]*heading.y>.55)steeredKey=e.code;}
   api.send('beginStroke');keyStroke=true;}
  keys.add(e.code);turnMs=600;turnTravel=0;keyBlocked=false;
 });
 function endKeyboard(){if(keyStroke){api.send('endStroke');keyStroke=false;}}
 document.addEventListener('keyup',e=>{if(directions[e.code]){keys.delete(e.code);e.preventDefault();if(!keys.size){endKeyboard();keyBudget=0;keySpeed=0;heading=null;steeredKey=null;turnMs=0;}}});
 const clear=()=>{endKeyboard();keys.clear();keyBudget=0;keySpeed=0;heading=null;steeredKey=null;turnMs=0;};window.addEventListener('blur',clear);document.addEventListener('visibilitychange',clear);
 return {tick(dt){
  if(!canDraw()){clear();return;}if(!keys.size||T.active)return;
  const key=[...keys].at(-1),[x,y]=directions[key];
  const nearJunction=(api.graph().adj.get(player().node)||[]).length>2,targetSpeed=nearJunction?110:170;
  keySpeed+=(targetSpeed-keySpeed)*(1-Math.exp(-dt/90));keyBudget=Math.min(16,keyBudget+dt*keySpeed/1000);turnMs=Math.max(0,turnMs-dt);
  const p=player(),graph=api.graph(),goal=p.goal;
  for(let count=0;count<16&&keyBudget>0;count++){
   const at=graph.nodes.get(p.node),previous=p.path.at(-2),target=graph.nodes.get(api.match().target(p)),following=steeredKey===key;
   let choice=PathfindrKeyboard.choose(graph,p.node,previous,{x,y},heading,api.view.scale,{followRoad:following,road,target}),buffered=false;
   if(!choice&&heading&&steeredKey!==key&&turnMs>0&&turnTravel<65){choice=PathfindrKeyboard.choose(graph,p.node,previous,heading,heading,api.view.scale,{followRoad:true,road,target});buffered=!!choice;}
   if(!choice){keyBudget=0;if(!keyBlocked){api.message('No clear turn — change direction or tap a street.');keyBlocked=true;}break;}keyBlocked=false;const best=choice.edge;
   if(p.path.at(-2)===best.id)api.send('rewind',{length:p.path.length-1});else api.send('plan',{node:best.id});
   if(p.node===at.id){keyBudget=0;break;}const pixels=best.meters*api.view.scale;keyBudget-=pixels;heading=choice.vector;road=best.road||null;if(!buffered)steeredKey=key;else turnTravel+=pixels;
   if(p.goal!==goal){clear();break;}
  }
 },direction:()=>keys.size?{vector:directions[[...keys].at(-1)],buffered:steeredKey!==[...keys].at(-1)&&turnMs>0}:null};
}
