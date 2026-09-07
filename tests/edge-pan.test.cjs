const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const window={};vm.runInNewContext(fs.readFileSync('engine/edge-pan.js','utf8'),{window});const velocity=window.PathfindrEdgePan.velocity;
const rect={left:0,top:0,right:390,bottom:844},pad={top:96,bottom:86};
test('edge pan has a quiet center and points toward every edge',()=>{
 assert.equal(velocity({x:195,y:400},rect,pad).x,0);assert.equal(velocity({x:195,y:400},rect,pad).y,0);
 assert.ok(velocity({x:5,y:400},rect,pad).x<0);assert.ok(velocity({x:385,y:400},rect,pad).x>0);
 assert.ok(velocity({x:195,y:110},rect,pad).y<0);assert.ok(velocity({x:195,y:750},rect,pad).y>0);
});
test('edge pan eases in, caps diagonal speed, and stops outside the map',()=>{
 assert.ok(velocity({x:385,y:400},rect,pad).x>velocity({x:340,y:400},rect,pad).x);
 const corner=velocity({x:389,y:843},rect,pad);assert.ok(Math.hypot(corner.x,corner.y)<=180.001);
 assert.equal(velocity({x:-1,y:100},rect,pad).x,0);
});
test('camera assistance starts before the old 64px edge band and scales to desktop',()=>{
 assert.ok(velocity({x:300,y:400},rect,pad).x>0);
 const desktop={left:0,top:0,right:1200,bottom:900};
 assert.ok(velocity({x:1000,y:400},desktop,pad).x>0);
 assert.equal(velocity({x:600,y:400},desktop,pad).x,0);
 const nearStart=velocity({x:250,y:400},rect,pad).x;
 assert.ok(nearStart>=0&&nearStart<1);
});
test('mobile follows close to the center and is strong halfway toward the edge',()=>{
 const mobile=p=>velocity(p,rect,pad,undefined,{mobile:true});
 assert.equal(mobile({x:195,y:427}).x,0);
 assert.ok(mobile({x:240,y:427}).x>12);
 assert.ok(mobile({x:292,y:427}).x>140);
 assert.ok(Math.hypot(...Object.values(mobile({x:389,y:843})))<=420.001);
});
test('fast connected finger motion leads the camera; a disconnected finger cannot drag it away',()=>{
 const focus=window.PathfindrEdgePan.focus,head={x:195,y:427};
 assert.ok(focus({x:240,y:427},head,{x:500,y:0}).x>focus({x:240,y:427},head).x);
 const stopped=focus({x:389,y:427},head,{x:900,y:0});assert.equal(stopped.x,195);
 assert.equal(velocity(stopped,rect,pad,undefined,{mobile:true}).x,0);
});
test('mobile tracking converges into central padding without overshoot at different frame rates',()=>{
 for(const hz of [30,60,120]){let x=340;
  for(let i=0;i<hz*4;i++){const v=velocity({x,y:427},rect,pad,undefined,{mobile:true});x-=v.x/hz;assert.ok(x>=195);}
  assert.ok(x<230,`head at ${x} for ${hz}Hz`);
 }
});
test('route patterns move with the clock and freeze for reduced motion',()=>{
 let reduced=false;const calls=[];
 const ctx={save(){},restore(){},setLineDash(v){calls.push([...v]);},stroke(){}};
 const env={window:{},PathfindrMotion:{reduced:()=>reduced},PathfindrAudio:{state:{enabled:false}},drawSmoothPath(){}};
 vm.runInNewContext(fs.readFileSync('engine/route-cinema.js','utf8'),env);
 const route=env.window.PathfindrRouteCinema.route,points=[{x:0,y:0},{x:100,y:0}];
 route(ctx,points,{r:1,g:2,b:3},1,false);assert.ok(calls.some(a=>a.join(',')==='20,9,2,9'));assert.equal(ctx.lineDashOffset,-34);
 calls.length=0;route(ctx,points,{r:1,g:2,b:3},1,true);assert.ok(calls.some(a=>a.join(',')==='8,10'));assert.equal(ctx.lineDashOffset,-8);
 reduced=true;route(ctx,points,{r:1,g:2,b:3},2,true);assert.equal(ctx.lineDashOffset,0);
});
test('trace diagnostics are bounded and never enter the server report queue',()=>{
 const store=new Map(),window={};
 vm.runInNewContext(fs.readFileSync('engine/route-reports.js','utf8'),{window,localStorage:{getItem:k=>store.get(k),setItem:(k,v)=>store.set(k,v)},setInterval(){},addEventListener(){}});
 for(let i=0;i<40;i++)window.PathfindrRouteReports.recordTrace({attempts:i});
 const saved=JSON.parse(store.get('pathfindr-trace-diagnostics-v1'));assert.equal(saved.length,30);assert.equal(saved[0].attempts,10);assert.equal(window.PathfindrRouteReports.pending(),0);
});
