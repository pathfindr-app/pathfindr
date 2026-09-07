const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),A=require('../arena/core.js');
function fixture(){
 const elements=[];for(let y=0;y<8;y++)for(let x=0;x<8;x++)elements.push({type:'node',id:y*8+x,lon:x*.0001,lat:-y*.0001});
 for(let y=0;y<8;y++)elements.push({type:'way',nodes:Array.from({length:8},(_,x)=>y*8+x)});for(let x=0;x<8;x++)elements.push({type:'way',nodes:Array.from({length:8},(_,y)=>y*8+x)});
 const graph=A.makeGraph({location:{lat:0,lng:0},roads:{elements},roadsSha256:'input-grid'}),match=A.create(graph,{bots:false,course:{starts:[0,7,56,63],goals:[63,56,7,6,55]}});match.start();const transport=A.localTransport(match),events={};
 const doc={addEventListener:(name,fn)=>events[name]=fn},win={PathfindrArena:A,addEventListener:()=>{}};
 const ctx={window:win,document:doc,navigator:{},console,Math};vm.createContext(ctx);
 for(const f of ['trace-input','trace-guide','route-input'])vm.runInContext(fs.readFileSync(`${__dirname}/../engine/${f}.js`,'utf8'),ctx);
 let adapter;win.PathfindrTrace.init=a=>{adapter=a;};Object.assign(ctx,{PathfindrTraceGuide:win.PathfindrTraceGuide,PathfindrRouteInput:win.PathfindrRouteInput,PathfindrKeyboard:require('../arena/keyboard.js')});
 vm.runInContext(fs.readFileSync(`${__dirname}/../arena/input.js`,'utf8'),ctx);
 const input=ctx.PathfindrArenaInput({canvas:{},graph:()=>graph,match:()=>match,send:(t,f)=>transport.send(t,f),screen:p=>p,world:p=>p,view:{scale:1},ready:()=>true,message:()=>{}});
 const key=(code,down=true)=>events[down?'keydown':'keyup']({code,target:{closest:()=>null},preventDefault:()=>{}});
 return {graph,match,input,key,adapter,transport};
}
test('WASD and arrows both draw immediately and reverse to erase on existing roads',()=>{
 for(const [forward,back] of [['KeyD','KeyA'],['ArrowRight','ArrowLeft'],['KeyS','KeyW'],['ArrowDown','ArrowUp']]){
  const {match,input,key}=fixture(),p=match.state.players[0];key(forward);input.tick(16);key(forward,false);assert.notEqual(p.node,0);assert.equal(match.state.time,0);assert.equal(p.queue.length,0);
  key(back);input.tick(50);key(back,false);assert.equal(p.node,0);assert.equal(p.path.length,1);
 }
});
test('released keys and paused matches cannot keep drawing',()=>{const {match,input,key}=fixture(),p=match.state.players[0];key('KeyD');input.tick(16);key('KeyD',false);const at=p.node;input.tick(100);assert.equal(p.node,at);match.pause();key('KeyS');input.tick(100);assert.equal(p.node,at);});
test('newest held direction wins; OS repeats cannot override it and keyboard strokes undo together',()=>{
 const {match,input,key,transport}=fixture(),p=match.state.players[0];key('KeyD');input.tick(16);const col=p.node;key('KeyS');key('KeyD');for(let i=0;i<8;i++)input.tick(16);key('KeyD',false);key('KeyS',false);assert.equal(p.node%8,col%8);assert.ok(p.node>=8);transport.send('undo');assert.equal(p.node,0);
});
test('a slightly early turn is buffered to the next real junction, never a diagonal connection',()=>{
 const {match,graph,input,key}=fixture(),p=match.state.players[0];graph.adj.set(1,graph.adj.get(1).filter(e=>e.id!==9));graph.adj.set(9,graph.adj.get(9).filter(e=>e.id!==1));
 key('KeyD');input.tick(16);assert.equal(p.node,1);key('KeyS');for(let i=0;i<14;i++)input.tick(16);key('KeyS',false);key('KeyD',false);
 assert.equal(p.node%8,2);assert.ok(p.node>=10);assert.ok(p.path.includes(2));assert.ok(!p.path.includes(9));
});
test('a missing early turn expires instead of continuing along the old road forever',()=>{
 const {match,graph,input,key}=fixture(),p=match.state.players[0];for(let x=1;x<=7;x++){graph.adj.set(x,graph.adj.get(x).filter(e=>e.id!==x+8));graph.adj.set(x+8,graph.adj.get(x+8).filter(e=>e.id!==x));}
 key('KeyD');input.tick(16);key('KeyS');for(let i=0;i<40;i++)input.tick(16);const stop=p.node;assert.ok(stop<=7);for(let i=0;i<40;i++)input.tick(16);assert.equal(p.node,stop);key('KeyS',false);key('KeyD',false);
});
test('trace commits synchronously, retracing erases, and undo restores an erased stroke',()=>{
 const {match,graph,adapter,transport}=fixture(),p=match.state.players[0];adapter.begin();assert.ok(adapter.commit(graph.nodes.get(2)));adapter.end();assert.equal(p.node,2);
 const before=p.path.length;adapter.begin();assert.ok(adapter.commit(graph.nodes.get(0)));adapter.end();assert.equal(p.node,0);transport.send('undo');assert.equal(p.node,2);assert.equal(p.path.length,before);
});
