const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
test('screen target grows when zooming out, with bounded coarse-pointer allowance',()=>{
 const c={window:{}};vm.runInNewContext(fs.readFileSync('engine/route-input.js','utf8'),c);
 const radius=c.window.PathfindrRouteInput.targetPixels;
 assert.ok(radius(11,true)>radius(16,true));assert.ok(radius(11,true)>radius(11,false));
 assert.equal(radius(0,true),44);assert.equal(radius(0,false),34);
});
test('diagnostic queue excludes account data, retains failed reports, and retries idempotently',async()=>{
 const storage=new Map();let fail=true,sent;
 const c={window:{},crypto:{randomUUID:()=> 'fixture-1'},localStorage:{getItem:k=>storage.get(k),setItem:(k,v)=>storage.set(k,v)},setInterval(){},addEventListener(){},PathfindrAuth:{client:{rpc:async(name,args)=>{sent=args;return {error:fail?{}:null};}}}};
 vm.runInNewContext(fs.readFileSync('engine/route-reports.js','utf8'),c);
 const api=c.window.PathfindrRouteReports;
 api.record({city:'Miami',build:'test',input:'tap',mode:'competitive',zoom:12,anchor:{lat:25.123456,lng:-80.123456},reason:'assisted_finish',email:'secret@example.com',user_id:'private'});
 await new Promise(r=>setImmediate(r));assert.equal(api.pending(),1);
 assert.equal(sent.reports[0].email,undefined);assert.equal(sent.reports[0].user_id,undefined);
 assert.equal(sent.reports[0].anchor.lat,25.12346);
 fail=false;await api.flush();assert.equal(api.pending(),0);
});
test('assisted completion preserves manual prefix and uses graph tail, never a straight shortcut',async()=>{
 const source=fs.readFileSync('game.js','utf8');
 const start=source.indexOf('async function finishRouteAssisted()'),end=source.indexOf('function getCanonicalEdgeKey',start);
 let tail=[2,3,4],submitted=0,reported=0;
 const c={shouldHandlePathInput:()=>true,PathfindrTrace:{cancel(){},mode:'tap'},getActivePathAnchorNode:()=>2,findShortestPathBetween:()=>tail,window:{PathfindrRouteReports:{record:()=>reported++}},PathfindrConfig:{app:{buildId:'test'}},GameState:{userPathNodes:[1,2],endNode:4,nodes:new Map(),map:{getZoom:()=>12}},recalculateUserDistance(){},updateAllDistanceDisplays(){},redrawUserPath(){},submitRoute:async()=>submitted++};
 vm.runInNewContext(source.slice(start,end),c);
 assert.equal(await c.finishRouteAssisted(),true);assert.deepEqual(c.GameState.userPathNodes,[1,2,3,4]);assert.equal(submitted,1);assert.equal(reported,1);
 assert.equal(await c.finishRouteAssisted(),false);assert.equal(submitted,1);
 c.GameState.assistedRound=false;tail=[];assert.equal(await c.finishRouteAssisted(),false);assert.equal(submitted,1);assert.equal(reported,2);
});
