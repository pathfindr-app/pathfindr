const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
function setup(reduced=false,interrupt=false){
 const window={};vm.runInNewContext(fs.readFileSync('engine/reveal-camera.js','utf8'),{window});
 const calls=[],listeners=new Map();let active=true,animated=0;
 const map={getBearing:()=>20,getZoom:()=>17,getPitch:()=>40,getCenter:()=>({lng:3,lat:4}),
 cameraForBounds:()=>({center:{lng:1,lat:2},zoom:14}),stop(){},
 on:(k,v)=>listeners.set(k,v),off:k=>listeners.delete(k),jumpTo:o=>calls.push(o)};
 const camera=window.PathfindrRevealCamera.create({map,start:{lng:0,lat:0},points:[{lng:0,lat:0},{lng:3,lat:4}],padding:{},valid:()=>active,
 motion:{reduced:()=>reduced,animate:async(ms,draw,valid)=>{animated++;for(const t of [0,.5,1]){if(valid())draw(t);if(t===.5&&interrupt)listeners.get('dragstart')?.({originalEvent:{}});}}}});
 return {camera,calls,listeners,stop:()=>active=false,animated:()=>animated};
}
test('finish pulls out from current end view before search, never flies back to start',async()=>{
 const {camera,calls,listeners}=setup();await camera.begin();
 assert.equal(calls[0].center.join(','),'3,4');assert.equal(calls.at(-1).pitch,0);
 assert.ok(calls[1].zoom<calls[0].zoom);assert.equal(calls.at(-1).zoom,13.65);
 const count=calls.length;camera.update(.5);assert.equal(calls.length,count);
 assert.equal(calls.at(-1).center.join(','),'1,2');assert.equal(listeners.size,0);
});
test('manual camera gesture cancels automatic pullback without stale camera updates',async()=>{
 const {camera,calls,listeners}=setup(false,true);await camera.begin();assert.equal(calls.length,2);
 const count=calls.length;camera.update(.5);assert.equal(calls.length,count);assert.equal(listeners.size,0);
});
test('leaving the round cancels camera work and reduced motion skips both stages',async()=>{
 const x=setup();x.stop();await x.camera.begin();assert.equal(x.calls.length,0);assert.equal(x.listeners.size,0);
 const y=setup(true);await y.camera.begin();y.camera.update(.5);assert.equal(y.animated(),0);assert.equal(y.calls.length,1);assert.equal(y.calls[0].zoom,13.65);
});
