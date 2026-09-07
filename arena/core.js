/* Deterministic local authority. No DOM, wall clock, network, or renderer state. */
(function(root,factory){const api=factory();if(typeof module==='object')module.exports=api;else root.PathfindrArena=api;})(typeof window==='object'?window:this,()=>{
 'use strict';
 const RULES=Object.freeze({tickMs:50,speed:180,botSpeed:110,barrierCost:3,barrierRadius:100,barrierMs:10000,cutCost:4,shortcutCost:5,shortcutMeters:220,maxPlanMeters:950,collectRadius:180,matchMs:480000,finishGraceMs:25000});
 const edgeKey=(a,b)=>a<b?`${a}:${b}`:`${b}:${a}`;
 const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
 class Heap{constructor(){this.a=[];}push(v){let i=this.a.length;this.a.push(v);while(i){const p=(i-1)>>1;if(this.a[p][0]<=v[0])break;this.a[i]=this.a[p];i=p;}this.a[i]=v;}pop(){const first=this.a[0],last=this.a.pop();if(this.a.length){let i=0;while(i*2+1<this.a.length){let c=i*2+1;if(c+1<this.a.length&&this.a[c+1][0]<this.a[c][0])c++;if(this.a[c][0]>=last[0])break;this.a[i]=this.a[c];i=c;}this.a[i]=last;}return first;}}
 function makeGraph(pack){
  const origin=pack.location,scaleX=111320*Math.cos(origin.lat*Math.PI/180),nodes=new Map(),adj=new Map(),edges=[],grid=new Map();
  const project=([lng,lat])=>({x:(lng-origin.lng)*scaleX,y:(origin.lat-lat)*111320});
  for(const n of pack.roads.elements)if(n.type==='node')nodes.set(n.id,{id:n.id,lng:n.lon,lat:n.lat,...project([n.lon,n.lat])});
  const seen=new Set();for(const way of pack.roads.elements)if(way.type==='way')for(let i=1;i<way.nodes.length;i++){
   const a=way.nodes[i-1],b=way.nodes[i];if(a===b||!nodes.has(a)||!nodes.has(b))continue;const key=edgeKey(a,b);if(seen.has(key))continue;seen.add(key);
   const meters=distance(nodes.get(a),nodes.get(b));if(!meters)continue;const e={a,b,meters,key};edges.push(e);
   if(!adj.has(a))adj.set(a,[]);if(!adj.has(b))adj.set(b,[]);adj.get(a).push({id:b,meters,key});adj.get(b).push({id:a,meters,key});
  }
  const visited=new Set();let component=[];for(const id of adj.keys()){if(visited.has(id))continue;const list=[id];visited.add(id);for(let i=0;i<list.length;i++)for(const e of adj.get(list[i]))if(!visited.has(e.id)){visited.add(e.id);list.push(e.id);}if(list.length>component.length)component=list;}
  const playable=new Set(component);for(const id of component){const n=nodes.get(id),key=`${Math.floor(n.x/100)},${Math.floor(n.y/100)}`;if(!grid.has(key))grid.set(key,[]);grid.get(key).push(id);}
  function nearest(x,y,max=Infinity){let result=null,best=max;const radius=Number.isFinite(max)?Math.ceil(max/100):4,cx=Math.floor(x/100),cy=Math.floor(y/100);
   for(let a=cx-radius;a<=cx+radius;a++)for(let b=cy-radius;b<=cy+radius;b++)for(const id of grid.get(`${a},${b}`)||[]){const d=distance({x,y},nodes.get(id));if(d<best){best=d;result=id;}}
   if(result===null&&!Number.isFinite(max))for(const id of component){const d=distance({x,y},nodes.get(id));if(d<best){best=d;result=id;}}return result;
  }
  return {nodes,adj,edges,component,playable,nearest,project,origin,hash:pack.roadsSha256};
 }
 function route(graph,start,end,blocked=new Set()){
  if(!graph.nodes.has(start)||!graph.nodes.has(end))return null;if(start===end)return {path:[start],meters:0};
  const heap=new Heap(),cost=new Map([[start,0]]),from=new Map();heap.push([0,start,0]);
  while(heap.a.length){const [,id,g]=heap.pop();if(g!==cost.get(id))continue;if(id===end){const path=[end];let n=end;while(n!==start){n=from.get(n);path.push(n);}return {path:path.reverse(),meters:g};}
   for(const e of graph.adj.get(id)||[]){if(blocked.has(e.key))continue;const next=g+e.meters;if(next>=(cost.get(e.id)??Infinity))continue;cost.set(e.id,next);from.set(e.id,id);heap.push([next+distance(graph.nodes.get(e.id),graph.nodes.get(end)),e.id,next]);}
  }return null;
 }
 function segmentDistance(p,a,b){const dx=b.x-a.x,dy=b.y-a.y,t=Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/(dx*dx+dy*dy||1)));return Math.hypot(p.x-a.x-t*dx,p.y-a.y-t*dy);}
 function makeCourse(graph){
  const points=[[-800,-600],[1200,500],[-1200,1200],[900,-1200],[0,200]],goals=points.map(([x,y])=>graph.nearest(x,y));
  if(new Set(goals).size!==5)throw Error('Map too small for five distinct objectives');
  const first=graph.nodes.get(goals[0]),starts=[];
  // Equal travel-distance bands around checkpoint one, not equal straight-line distance.
  for(let player=0;player<4;player++){let best=null,score=Infinity;const angle=player*Math.PI/2;
   for(const id of graph.component.filter((_,i)=>i%17===0)){if(starts.includes(id)||goals.includes(id))continue;const n=graph.nodes.get(id),d=distance(n,first);if(d<350||d>850)continue;
    const candidate=route(graph,id,goals[0]);if(!candidate)continue;const s=Math.abs(candidate.meters-800)+Math.abs(Math.atan2(n.y-first.y,n.x-first.x)-angle)*35;
    if(s<score){score=s;best=id;}}
   if(best===null)throw Error('Could not find fair player starts');starts.push(best);
  }return {goals,starts};
 }
 function create(graph,{seed=731,course=makeCourse(graph),bots=true}={}){
  let randomSeed=seed>>>0;const random=()=>{randomSeed=(Math.imul(randomSeed,1664525)+1013904223)>>>0;return randomSeed/4294967296;};
  const state={version:1,graphHash:graph.hash,seed,time:0,status:'ready',goals:course.goals,players:course.starts.map((node,i)=>({id:i,name:['YOU','KITE','REED','FLINT'][i],bot:i>0&&bots,node,legStart:node,goal:0,path:[node],travel:0,meters:0,legMeters:0,score:0,credits:3,queue:[],repair:null,finishedAt:null,thinkAt:2500+i*1700,protectedUntil:0,shortcut:null,lastSeq:0})),barriers:[],pickups:[],events:[],firstFinish:null,winner:null};
  let commands=[],blocked=new Set(),eventId=0;
  const emit=(type,player,message)=>{state.events.push({id:++eventId,time:state.time,type,player,message});if(state.events.length>40)state.events.shift();};
  const position=p=>{const a=graph.nodes.get(p.node),b=graph.nodes.get(p.queue[0]);if(!b)return {...a};const t=Math.min(1,p.travel/(distance(a,b)||1));return {x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t};};
  const target=p=>p.repair?.to??state.goals[p.goal];
  function refreshBlocked(){blocked=new Set(state.barriers.flatMap(b=>b.edges));}
  function plan(p,node){
   if(!graph.playable.has(node))return 'Tap a connected street.';
   const start=p.queue.length?p.queue.at(-1):p.node,r=route(graph,start,node,blocked);if(!r)return 'That street is blocked. Try another connection.';
   if(r.meters>RULES.maxPlanMeters)return 'Plan a shorter section—follow the streets toward the beacon.';
   if(p.queue.length+r.path.length>2000)return 'Your route queue is full.';
   p.queue.push(...r.path.slice(1));return null;
  }
  function validBarrier(center){
   if(state.goals.some(id=>distance(center,graph.nodes.get(id))<RULES.barrierRadius+180))return null;
   if(state.players.some(p=>distance(center,position(p))<RULES.barrierRadius+40))return null;
   const edges=graph.edges.filter(e=>segmentDistance(center,graph.nodes.get(e.a),graph.nodes.get(e.b))<RULES.barrierRadius).map(e=>e.key);if(!edges.length)return null;
   const combined=new Set([...blocked,...edges]);
   for(const p of state.players){if(p.finishedAt!==null)continue;let from=p.node;const remaining=[...(p.repair?[p.repair.to]:[]),...state.goals.slice(p.goal)];for(const end of remaining){if(!route(graph,from,end,combined))return null;from=end;}}
   return edges;
  }
  function apply(cmd){
   const p=state.players[cmd.player];if(!p||!Number.isSafeInteger(cmd.seq)||cmd.seq<=p.lastSeq)return;p.lastSeq=cmd.seq;
   if(state.status!=='playing'||p.finishedAt!==null)return;
   let error=null;
   if(cmd.type==='plan')error=plan(p,cmd.node);
   else if(cmd.type==='undo'){p.queue=[];p.travel=0;}
   else if(cmd.type==='collect'){
    const item=state.pickups.find(i=>i.id===cmd.item);if(!item||item.claimedBy!==null)error='Already collected.';
    else if(distance(position(p),graph.nodes.get(item.node))>RULES.collectRadius)error='Move closer to collect this charge.';
    else{item.claimedBy=p.id;p.credits+=2;emit('collect',p.id,'+2 charge');}
   }else if(cmd.type==='barrier'){
    const center=graph.nodes.get(cmd.node);if(p.credits<RULES.barrierCost)error='Barrier needs 3 charge.';
    else if(!center||state.barriers.length>=3)error='Wait for an active barrier to expire.';
    else{const edges=validBarrier(center);if(!edges)error='Unsafe barrier: keep all destinations and escape routes open.';
     else{p.credits-=RULES.barrierCost;state.barriers.push({id:eventId+1,owner:p.id,node:cmd.node,until:state.time+RULES.barrierMs,edges});refreshBlocked();emit('barrier',p.id,'Barrier active · 10 seconds');}}
   }else if(cmd.type==='cut'){
    const victim=state.players[cmd.victim];
    if(p.credits<RULES.cutCost)error='Route cut needs 4 charge.';
    else if(!victim||victim.id===p.id||victim.finishedAt!==null||victim.repair||victim.protectedUntil>state.time||victim.path.length<7)error='No exposed route to cut yet.';
    else{const to=victim.node;let i=victim.path.length-2,meters=0;while(i>0&&meters<140){meters+=distance(graph.nodes.get(victim.path[i]),graph.nodes.get(victim.path[i+1]));i--;}
     const from=victim.path[i];if(!route(graph,from,to,blocked))error='That cut would leave no repair path.';
     else{p.credits-=RULES.cutCost;victim.repair={from,to,cutBy:p.id};victim.node=from;victim.path=victim.path.slice(0,i+1);victim.queue=[];victim.travel=0;victim.shortcut=null;victim.thinkAt=state.time+1800;emit('cut',victim.id,'Route severed. Reconnect the red socket.');emit('attack',p.id,`${victim.name}'s route cut. They must reconnect.`);}}
   }else if(cmd.type==='shortcut'){
    const node=graph.nodes.get(cmd.node),a=graph.nodes.get(p.node),meters=node?distance(a,node):Infinity;
    if(p.credits<RULES.shortcutCost)error='Shortcut needs 5 charge.';
    else if(p.repair)error='Repair your route before using a shortcut.';
    else if(!graph.playable.has(cmd.node)||meters<10||meters>RULES.shortcutMeters)error='Shortcut must land on a street within 220 meters.';
    else if(state.barriers.some(b=>segmentDistance(graph.nodes.get(b.node),a,node)<RULES.barrierRadius))error='Shortcuts cannot cross a barrier.';
    else{p.credits-=RULES.shortcutCost;p.queue=[cmd.node];p.travel=0;p.shortcut={from:p.node,to:cmd.node};emit('shortcut',p.id,'Shortcut engaged');}
   }else error='Unknown command.';
   if(error)emit('rejected',p.id,error);
  }
  function reached(p){
   if(p.repair&&p.node===p.repair.to){p.repair=null;p.protectedUntil=state.time+12000;emit('repair',p.id,'Connection restored · shielded for 12 seconds');}
   if(!p.repair&&p.node===state.goals[p.goal]){
    const optimal=route(graph,p.legStart,p.node)?.meters||1;p.score+=Math.round(1000*Math.min(1,optimal/Math.max(1,p.legMeters)));p.credits+=2;p.goal++;p.legStart=p.node;p.legMeters=0;p.queue=[];p.thinkAt=state.time+1800+random()*1500;emit('checkpoint',p.id,`Destination ${p.goal}/5 linked · +2 charge`);
    if(p.goal===state.goals.length){p.finishedAt=state.time;state.firstFinish??=state.time;emit('finish',p.id,'All five destinations linked');}
   }
  }
  function bot(p){
   if(state.time<p.thinkAt)return;
   // Bots share the same command boundary and prices, with modest reaction delays.
   const item=state.pickups.find(i=>i.claimedBy===null&&distance(position(p),graph.nodes.get(i.node))<RULES.collectRadius);
   if(item)apply({player:p.id,seq:p.lastSeq+1,type:'collect',item:item.id});
   if(!p.queue.length){const r=route(graph,p.node,target(p),blocked);if(r){let m=0,index=1;for(;index<r.path.length;index++){m+=distance(graph.nodes.get(r.path[index-1]),graph.nodes.get(r.path[index]));if(m>650)break;}apply({player:p.id,seq:p.lastSeq+1,type:'plan',node:r.path[Math.max(1,Math.min(index-1,r.path.length-1))]??p.node});}}
   if(p.credits>=RULES.cutCost&&random()<.07){const choices=state.players.filter(v=>v.id!==p.id&&v.finishedAt===null&&v.goal>=p.goal);if(choices.length)apply({player:p.id,seq:p.lastSeq+1,type:'cut',victim:choices[Math.floor(random()*choices.length)].id});}
   p.thinkAt=state.time+900+random()*1200;
  }
  function ranking(){return [...state.players].sort((a,b)=>b.goal-a.goal||(a.finishedAt??Infinity)-(b.finishedAt??Infinity)||b.score-a.score||a.id-b.id).map(p=>p.id);}
  function step(){if(state.status!=='playing')return;state.time+=RULES.tickMs;
   const remaining=state.barriers.filter(b=>b.until>state.time);if(remaining.length!==state.barriers.length){state.barriers=remaining;refreshBlocked();}
   const batch=commands;commands=[];for(const cmd of batch)apply(cmd);
   for(const p of state.players){if(p.finishedAt!==null)continue;if(p.bot)bot(p);let budget=(p.bot?RULES.botSpeed:RULES.speed)*RULES.tickMs/1000;
    while(budget>0&&p.queue.length){const next=p.queue[0],key=edgeKey(p.node,next);if(blocked.has(key)&&!p.shortcut){p.queue=[];p.travel=0;p.thinkAt=state.time+700;emit('blocked',p.id,'Barrier ahead—reroute or wait.');break;}
     const length=distance(graph.nodes.get(p.node),graph.nodes.get(next)),move=Math.min(budget,length-p.travel);p.travel+=move;p.meters+=move;p.legMeters+=move;budget-=move;
     if(p.travel>=length-1e-6){p.node=next;p.path.push(next);p.queue.shift();p.travel=0;p.shortcut=null;reached(p);}
    }
   }
   if(state.time>=RULES.matchMs||state.players.every(p=>p.finishedAt!==null)||(state.firstFinish!==null&&state.time-state.firstFinish>=RULES.finishGraceMs)){state.status='finished';state.winner=ranking()[0];emit('match',state.winner,'Match complete');}
  }
  // Charges follow real connected roads, including an immediately reachable one for each player.
  const placed=new Set();function pickup(node){if(placed.has(node))return;placed.add(node);state.pickups.push({id:`charge-${node}`,node,claimedBy:null});}
  for(const start of course.starts)pickup(start);
  for(let i=0;i<course.goals.length;i++){const r=route(graph,i?course.goals[i-1]:course.starts[0],course.goals[i]);if(!r)throw Error('Disconnected course');let meters=0;for(let n=1;n<r.path.length;n++){meters+=distance(graph.nodes.get(r.path[n-1]),graph.nodes.get(r.path[n]));if(meters>330){pickup(r.path[n]);meters=0;}}}
  return {state,start(){if(state.status==='ready')state.status='playing';},pause(){if(state.status==='playing')state.status='paused';},resume(){if(state.status==='paused')state.status='playing';},step,position,target,ranking,
   command(command){if(commands.length>=256)return false;commands.push(JSON.parse(JSON.stringify(command)));return true;},
   snapshot:()=>JSON.parse(JSON.stringify({...state,randomSeed,eventId})),
   restore(snapshot){if(snapshot.version!==1||snapshot.graphHash!==graph.hash)throw Error('Incompatible snapshot');for(const key of Object.keys(state))state[key]=JSON.parse(JSON.stringify(snapshot[key]));randomSeed=snapshot.randomSeed;eventId=snapshot.eventId;commands=[];refreshBlocked();},
   route:(a,b)=>route(graph,a,b,blocked),validBarrier,
  };
 }
 // Replace this adapter with an authoritative network transport later. The UI
 // never mutates match state and commands are deduplicated by per-player sequence.
 function localTransport(match){let seq=match.state.players[0].lastSeq,accumulator=0;return {send(type,fields={}){return match.command({...fields,type,player:0,seq:++seq});},advance(ms){accumulator+=Math.max(0,Math.min(ms,250));while(accumulator>=RULES.tickMs){match.step();accumulator-=RULES.tickMs;}},snapshot:()=>match.snapshot()};}
 return {RULES,makeGraph,makeCourse,create,route,distance,segmentDistance,edgeKey,localTransport};
});
