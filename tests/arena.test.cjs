const test=require('node:test'),assert=require('node:assert/strict'),A=require('../arena/core.js');
function grid(){const elements=[];for(let y=0;y<15;y++)for(let x=0;x<15;x++)elements.push({type:'node',id:y*15+x,lat:-y*.00045,lon:x*.00045});let way=1000;for(let y=0;y<15;y++)elements.push({type:'way',id:way++,nodes:Array.from({length:15},(_,x)=>y*15+x)});for(let x=0;x<15;x++)elements.push({type:'way',id:way++,nodes:Array.from({length:15},(_,y)=>y*15+x)});return A.makeGraph({location:{lat:0,lng:0},roads:{elements},roadsSha256:'test-grid'});}
const course={starts:[0,14,210,224],goals:[7,217,112,104,120]};
function fixture(){const graph=grid(),m=A.create(graph,{course,bots:false});m.start();return {graph,m};}
function command(m,player,type,fields={}){m.command({player,type,seq:m.state.players[player].lastSeq+1,...fields});m.step();}
test('four distinct starts, five shared goals and deterministic road traversal',()=>{const {m}=fixture();assert.equal(m.state.players.length,4);assert.equal(new Set(m.state.players.map(p=>p.node)).size,4);command(m,0,'plan',{node:7});for(let i=0;i<80;i++)m.step();assert.equal(m.state.players[0].goal,1);assert.equal(m.state.players[0].credits,5);assert.equal(m.state.players[0].score,1000);});
test('duplicate commands cannot mint charge; range and ownership are validated',()=>{const {m}=fixture(),id=m.state.pickups.find(i=>i.node===0).id;const c={player:0,seq:1,type:'collect',item:id};m.command(c);m.command(c);m.step();assert.equal(m.state.players[0].credits,5);command(m,1,'collect',{item:id});assert.equal(m.state.players[1].credits,3);});
test('endpoint barriers and trapping cuts are rejected without charging',()=>{const {m}=fixture();command(m,0,'barrier',{node:7});assert.equal(m.state.barriers.length,0);assert.equal(m.state.players[0].credits,3);command(m,0,'cut',{victim:1});assert.equal(m.state.players[0].credits,3);});
test('safe barriers block edges, preserve all remaining objectives and expire',()=>{const graph=grid(),m=A.create(graph,{course:{starts:[15,16,17,18],goals:[0,1,2,3,4]},bots:false});m.start();const safe=graph.component.find(id=>m.validBarrier(graph.nodes.get(id)));assert.notEqual(safe,undefined);command(m,0,'barrier',{node:safe});assert.equal(m.state.barriers.length,1);assert.equal(m.state.players[0].credits,0);for(const p of m.state.players)assert.ok(m.route(p.node,m.state.goals[p.goal]));for(let i=0;i<201;i++)m.step();assert.equal(m.state.barriers.length,0);});
test('cut makes a real repair task; repair clears it and grants repeat-hit protection',()=>{const {m}=fixture();m.state.players[0].credits=10;command(m,1,'plan',{node:7});for(let i=0;i<80;i++)m.step();command(m,1,'plan',{node:97});for(let i=0;i<60;i++)m.step();const before=m.state.players[1].node;command(m,0,'cut',{victim:1});const p=m.state.players[1];assert.ok(p.repair);assert.notEqual(p.node,before);assert.equal(p.repair.to,before);command(m,1,'plan',{node:p.repair.to});for(let i=0;i<80;i++)m.step();assert.equal(p.repair,null);assert.ok(p.protectedUntil>m.state.time);command(m,0,'cut',{victim:1});assert.equal(p.repair,null);});
test('shortcut is meter-bounded, spends currency and draws immediately',()=>{const {m}=fixture();m.state.players[0].credits=10;command(m,0,'shortcut',{node:224});assert.equal(m.state.players[0].credits,10);command(m,0,'shortcut',{node:32});assert.equal(m.state.players[0].credits,5);assert.equal(m.state.players[0].node,32);assert.equal(m.state.players[0].queue.length,0);});
test('pause freezes authority, snapshots restore deterministic continuation',()=>{const {m,graph}=fixture();command(m,0,'plan',{node:7});m.pause();const t=m.state.time;m.step();assert.equal(m.state.time,t);m.resume();const clone=A.create(graph,{course,bots:false});clone.restore(m.snapshot());for(let i=0;i<100;i++){m.step();clone.step();}assert.deepEqual(m.snapshot(),clone.snapshot());});
test('an idle human cannot stop the match timeout and coherent bot standings',()=>{const graph=grid(),m=A.create(graph,{course,bots:true});m.start();for(let i=0;i<10000&&m.state.status!=='finished';i++)m.step();assert.equal(m.state.status,'finished');assert.ok(m.state.players[m.state.winner].goal>=4);assert.notEqual(m.state.winner,0);});
test('real New Cairo is a substantial connected graph with a playable five-destination course',()=>{const pack=require('../data/cities/fallback/new-cairo.json'),graph=A.makeGraph(pack),course=A.makeCourse(graph);assert.ok(graph.component.length>30000);assert.equal(new Set(course.starts).size,4);assert.equal(new Set(course.goals).size,5);for(const start of course.starts)assert.ok(A.route(graph,start,course.goals[0]));});
test('a human command stream can complete all five real Cairo destinations against the bots',()=>{
 const graph=A.makeGraph(require('../data/cities/fallback/new-cairo.json')),m=A.create(graph);m.start();
 for(let t=0;t<10000&&m.state.status!=='finished';t++){
  const p=m.state.players[0];if(p.finishedAt===null&&p.assignment!==null&&!(p.revealUntil>m.state.time)){const r=m.route(p.node,m.target(p));assert.ok(r);let meters=0,last=p.node;for(let i=1;i<r.path.length;i++){meters+=A.distance(graph.nodes.get(r.path[i-1]),graph.nodes.get(r.path[i]));if(meters>900)break;last=r.path[i];}assert.notEqual(last,p.node);m.command({player:0,seq:p.lastSeq+1,type:'plan',node:last});}
  m.step();
 }
 assert.equal(m.state.status,'finished');assert.equal(m.state.players[0].goal,5);assert.equal(m.state.winner,0);assert.ok(m.state.players[0].score<=5000);
});
test('local input edits the head synchronously without ticking or queued movement',()=>{
 const {m}=fixture(),t=A.localTransport(m),p=m.state.players[0];t.send('plan',{node:3});assert.equal(p.node,3);assert.equal(m.state.time,0);assert.equal(p.queue.length,0);
 const distance=p.legMeters;assert.ok(distance>0);t.send('undo');assert.equal(p.node,0);assert.ok(Math.abs(p.legMeters)<1e-6);
 t.send('plan',{node:4});const n=p.path.length;t.send('rewind',{length:n-2});assert.equal(p.path.length,n-2);assert.equal(p.node,p.path.at(-1));
 const stable=p.node;t.advance(200);assert.equal(p.node,stable);
});
test('real Cairo has five fixed pairs and four widely separated starts AND ends',()=>{
 const g=A.makeGraph(require('../data/cities/fallback/new-cairo.json')),c=A.makeCourse(g),m=A.create(g,{course:c,bots:false});assert.equal(c.routes.length,5);
 assert.equal(new Set(m.state.players.map(p=>m.target(p))).size,4);
 for(let i=0;i<4;i++)for(let j=0;j<i;j++){assert.ok(A.distance(g.nodes.get(m.state.players[i].node),g.nodes.get(m.state.players[j].node))>=1200);assert.ok(A.distance(g.nodes.get(m.target(m.state.players[i])),g.nodes.get(m.target(m.state.players[j])))>700);}
});
test('all players complete the same five fixed pairs without duplicate active assignments or fabricated connecting lines',()=>{
 const {m}=fixture();
 for(let step=0;step<200&&m.state.status!=='finished';step++){
  const active=m.state.players.filter(p=>p.assignment!==null);assert.equal(new Set(active.map(p=>p.assignment)).size,active.length);
  for(const p of active){const before=p.assignment,pair=m.state.routes[before];assert.equal(p.path[0],pair.start);const r=m.route(p.node,pair.end);let meters=0,next=p.node;for(let i=1;i<r.path.length;i++){meters+=A.distance(m.position({...p,node:r.path[i-1]}),m.position({...p,node:r.path[i]}));if(meters>900)break;next=r.path[i];}command(m,p.id,'plan',{node:next});}
  m.step();
 }
 for(const p of m.state.players){assert.equal(p.goal,5);assert.equal(new Set(p.completed).size,5);for(const archive of p.archives){assert.equal(archive.path[0],m.state.routes[archive.route].start);assert.equal(archive.path.at(-1),m.state.routes[archive.route].end);}}
});
test('comparison replays actual A* expansion, measures the same shortest path, and holds endpoints through reveal',()=>{
 const {m,graph}=fixture(),p=m.state.players[0],analysis=m.analyses[0];assert.ok(analysis.explored.length>0);assert.equal(analysis.meters,A.route(graph,m.state.routes[0].start,m.state.routes[0].end).meters);
 for(const edge of analysis.explored)assert.ok(graph.adj.get(edge.from).some(e=>e.id===edge.to));
 command(m,0,'plan',{node:m.target(p)});const archive=p.archives[0];assert.equal(archive.optimal,analysis.meters);assert.equal(archive.points,1000);assert.equal(p.assignment,0);assert.equal(p.node,m.state.routes[0].end);
 command(m,0,'plan',{node:3});assert.equal(p.node,m.state.routes[0].end);for(let i=0;i<65;i++)m.step();assert.notEqual(p.assignment,0);assert.equal(p.node,m.state.routes[p.assignment].start);
});
