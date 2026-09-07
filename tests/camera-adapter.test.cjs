const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');

// Exercise the actual adapter callbacks with an affine map, not a second copy
// of the controller. Geography remains fixed as the camera projection moves.
function rig(){
 let center={lng:195,lat:422},trace,blocked=false,eases=[];
 const rect={left:0,top:0,right:390,bottom:844,width:390,height:844};
 const element={addEventListener(){},setAttribute(){},classList:{contains:()=>false},getBoundingClientRect:()=>({height:78})};
 const map={on(){},getContainer:()=>({clientHeight:844}),getCanvas:()=>({getBoundingClientRect:()=>rect}),getCanvasContainer:()=>element,
  project(p){const lng=Array.isArray(p)?p[0]:p.lng,lat=Array.isArray(p)?p[1]:p.lat;return{x:lng-center.lng+195,y:lat-center.lat+422};},
  unproject:p=>({lng:p[0]+center.lng-195,lat:p[1]+center.lat-422}),getCenter:()=>center,
  jumpTo:o=>{center=o.center;},easeTo:o=>{eases.push(o);center=o.center;},stop(){},getZoom:()=>15,getPitch:()=>0,
  dragPan:{isEnabled:()=>true,disable(){},enable(){}}};
 const window={innerWidth:390},state={map,nodes:new Map([[1,{lng:195,lat:424}]]),userPathNodes:[1],currentCity:{name:'Camera test'},gameMode:'competitive'};
 const context={window,innerWidth:390,innerHeight:844,matchMedia:()=>({matches:false}),
  document:{getElementById:()=>element,querySelectorAll:()=>[],addEventListener(){},elementFromPoint:()=>({closest:()=>blocked})},
  GameState:state,GamePhase:{PLAYING:'playing',RESULTS:'results'},GameController:{phase:'playing'},
  getActivePathAnchorNode:()=>1,PathfindrCollections:{init(){}},PathfindrAudio:{state:{enabled:false}},
  PathfindrTrace:{pointerType:'touch',init:c=>{trace=c;}},PathfindrConfig:{app:{buildId:'test'}},
  shouldHandlePathInput:()=>true,clearSnapPreview(){},centerOnRoute(){},CONFIG:{minRoutePoints:2},Date};
 vm.createContext(context);vm.runInContext(fs.readFileSync('engine/edge-pan.js','utf8'),context);
 context.PathfindrEdgePan=window.PathfindrEdgePan;
 vm.runInContext(fs.readFileSync('engine/game-adapter.js','utf8'),context);context.initCityControls();
 return {context,state,map,trace,eases,block:()=>{blocked=true;}};
}
test('tap adapter centers an accepted head just outside central padding, with bounded easing',()=>{
 const r=rig();r.state.nodes.get(1).lng=240;r.context.nudgeRouteHeadIntoView();
 assert.equal(r.eases.length,1);const head=r.map.project([240,424]);
 assert.equal(head.x,195);assert.equal(head.y,424);assert.ok(r.eases[0].duration>=280&&r.eases[0].duration<=480);
 assert.equal(r.eases[0].easing(0),0);assert.equal(r.eases[0].easing(1),1);
 assert.deepEqual(r.state.userPathNodes,[1]);
});
test('actual trace adapter follows before the edge, damps velocity and never edits route geometry',()=>{
 const r=rig();r.state.nodes.get(1).lng=270;r.trace.begin();
 r.trace.pan({x:270,y:424},1/60);const first=r.map.getCenter().lng-195;assert.ok(first>0&&first<3);
 for(let i=0;i<12;i++)r.trace.pan({x:270,y:424},1/60);
 assert.ok(r.map.getCenter().lng>200);assert.deepEqual(r.state.userPathNodes,[1]);
});
test('disconnected finger recenters a displaced head but cannot pan a centered dead end away',()=>{
 const r=rig();r.trace.begin();for(let i=0;i<120;i++)r.trace.pan({x:389,y:424},1/60);
 assert.equal(r.map.getCenter().lng,195);
 r.state.nodes.get(1).lng=140;for(let i=0;i<240;i++)r.trace.pan({x:389,y:424},1/60);
 const head=r.map.project([140,424]);assert.ok(head.x>165&&head.x<195);
 assert.deepEqual(r.state.userPathNodes,[1]);
});
test('controls above the map immediately stop trace panning',()=>{
 const r=rig();r.state.nodes.get(1).lng=270;r.trace.begin();r.trace.pan({x:270,y:424},1/60);
 const before=r.map.getCenter().lng;r.block();for(let i=0;i<10;i++)r.trace.pan({x:270,y:424},1/60);
 assert.equal(r.map.getCenter().lng,before);
});
test('normal mobile stroke release settles the head, while cancellation preserves manual camera ownership',()=>{
 const r=rig();r.trace.tryFinish=()=>false;r.state.nodes.get(1).lat=510;
 r.trace.end(false,{x:195,y:510});assert.equal(r.eases.length,0);
 r.trace.end(true,{x:195,y:510});assert.equal(r.eases.length,1);
 assert.equal(r.map.project([195,510]).y,424);assert.deepEqual(r.state.userPathNodes,[1]);
});
