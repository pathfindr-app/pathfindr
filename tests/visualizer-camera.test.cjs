const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
function fixture(reduced=false){
 const calls=[],listeners=new Map(),window={},document={hidden:false,getElementById:()=>null};
 const state={center:{lng:0,lat:0},zoom:16,pitch:0,bearing:0};
 const map={getCanvas:()=>({clientWidth:390}),cameraForBounds:()=>({center:{lng:1,lat:1},zoom:14}),getCenter:()=>state.center,getZoom:()=>state.zoom,getPitch:()=>state.pitch,getBearing:()=>state.bearing,
 on:(e,f)=>listeners.set(e,f),off:e=>listeners.delete(e),jumpTo(o){calls.push(o);Object.assign(state,o,{center:{lng:o.center[0],lat:o.center[1]}});}};
 vm.runInNewContext(fs.readFileSync('engine/visualizer-camera.js','utf8'),{window,document,PathfindrMotion:{reduced:()=>reduced}});
 const camera=window.PathfindrVisualizerCamera,nodes=new Map([[0,{lng:0,lat:0}],[1,{lng:1,lat:1}],[2,{lng:2,lat:2}]]);
 camera.follow(map,[0,1,2],[0,1,2],nodes);
 const viz={active:true,phase:'exploring',exploredSet:new Set([0,1]),pathProgress:0};
 return {camera,map,nodes,viz,calls,listeners,state,document};
}
test('director eases into shallow 3D and bounds per-frame camera motion',()=>{
 const x=fixture();for(let i=0;i<360;i++)x.camera.tick(16,x.viz);
 assert.ok(x.state.pitch>27&&x.state.pitch<33);assert.equal(x.state.zoom,13.65);
 for(let i=1;i<x.calls.length;i++){assert.ok(Math.abs(x.calls[i].pitch-x.calls[i-1].pitch)<.22);assert.ok(Math.abs(x.calls[i].bearing-x.calls[i-1].bearing)<.1);}
 const before=x.calls.at(-1);x.camera.follow(x.map,[2,1,0],[],x.nodes);assert.equal(x.calls.at(-1),before);
});
test('wheel takeover persists through city disposal until resume or a fresh mode session',()=>{
 const x=fixture();x.listeners.get('wheel')({originalEvent:{}});x.camera.stop();x.camera.follow(x.map,[0,2],[],x.nodes);
 x.camera.tick(16,x.viz);assert.equal(x.calls.length,0);assert.equal(x.camera.state().paused,true);
 x.camera.startSession();x.camera.follow(x.map,[0,2],[],x.nodes);x.camera.tick(16,x.viz);assert.equal(x.calls.length,1);
});
test('orbit stays centered regardless of frontier or route-head progress',()=>{
 const x=fixture();x.viz.phase='path';x.viz.pathProgress=0;
 for(let i=0;i<500;i++)x.camera.tick(16,x.viz);const before=x.state.center.lng;
 x.viz.pathProgress=2;x.camera.tick(16,x.viz);assert.ok(x.state.center.lng-before<.02);
 for(let i=0;i<500;i++)x.camera.tick(16,x.viz);assert.equal(x.state.center.lng,before);
});
test('manual gestures hold camera until explicitly resumed; cleanup removes listeners',()=>{
 const x=fixture();x.listeners.get('dragstart')({originalEvent:{}});x.camera.tick(16,x.viz);assert.equal(x.calls.length,0);
 x.camera.follow(x.map,[0,2],[],x.nodes);x.camera.tick(16,x.viz);assert.equal(x.calls.length,0);
 x.camera.toggle();x.camera.tick(16,x.viz);assert.equal(x.calls.length,1);
 x.camera.stop();assert.equal(x.listeners.size,0);x.camera.tick(16,x.viz);assert.equal(x.calls.length,1);
});
test('reduced motion, hidden document and disabled camera never move the map',()=>{
 const x=fixture(true);x.camera.tick(16,x.viz);assert.equal(x.calls.length,0);
 const y=fixture();y.document.hidden=true;y.camera.tick(16,y.viz);assert.equal(y.calls.length,0);
 y.document.hidden=false;y.camera.toggle();y.camera.tick(16,y.viz);assert.equal(y.calls.length,0);
});
test('screen-space guard zooms out for endpoints obscured by HUD or rotation',()=>{
 const x=fixture();x.map.getCanvas=()=>({clientWidth:390,clientHeight:844});
 x.map.project=()=>({x:195,y:x.state.zoom>13?70:300});
 x.camera.tick(16,x.viz);assert.ok(x.state.zoom<=13);
 const safe=x.state.zoom;x.camera.tick(16,x.viz);assert.equal(x.state.zoom,safe);
});
