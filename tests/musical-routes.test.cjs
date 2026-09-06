const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),crypto=require('node:crypto');
function load(file,extra={}){const c={window:{},...extra};vm.runInNewContext(fs.readFileSync(file,'utf8'),c);return c;}
test('soundtrack atlas matches shipped audio, with bounded real events',()=>{
 const {window:w}=load('data/soundtrack-analysis.js');
 for(const [name,t] of Object.entries(w.PathfindrSoundtrackAnalysis.tracks)){
  assert.equal(t.sha256,crypto.createHash('sha256').update(fs.readFileSync('Music/'+name)).digest('hex'));
  assert.ok(t.events.length>10);assert.ok(t.bands.length>10);
  t.events.forEach((e,i)=>{assert.ok(e[0]>=0&&e[0]<t.duration);assert.ok(e[1]>0&&e[1]<=1);if(i)assert.ok(e[0]-t.events[i-1][0]>=.379);});
 }
});
test('distance sampling is independent of node density and preserves corners',()=>{
 const api=load('engine/musical-routes.js').window.PathfindrMusicalRoutes;
 const a=api.metric([{x:0,y:0},{x:100,y:0},{x:100,y:100}],'a');
 const b=api.metric([{x:0,y:0},{x:10,y:0},{x:100,y:0},{x:100,y:100}],'b');
 assert.equal(api.locate(a,.75).y,50);assert.equal(api.locate(b,.75).y,50);
 assert.ok(api.profile(2).gain<api.profile(1).gain);
});
test('history gets stronger musical dynamics, bounded for many rounds and active searches',()=>{
 const api=load('engine/musical-routes.js').window.PathfindrMusicalRoutes;
 const audio={active:true,bass:.8,musicTime:1,packets:[{time:.85,strength:1}]};
 const one=api.historyIntensity(.3,.4,audio,1,false);
 assert.ok(one>.4);assert.ok(one>api.historyIntensity(.3,.4,audio,5,false));
 assert.ok(one>api.historyIntensity(.3,.4,audio,1,true));
 assert.equal(api.historyIntensity(.3,.4,{active:false},1,false),.12);
 assert.ok(api.historyIntensity(1,1,audio)<=.9);
});
test('branching conserves squared charge and tree distance follows graph',()=>{
 const api=load('engine/musical-routes.js').window.PathfindrMusicalRoutes;
 const nodes=new Map([[1,{lat:0,lng:0}],[2,{lat:1,lng:0}],[3,{lat:0,lng:1}],[4,{lat:2,lng:0}]]);
 const tree=api.tree(new Map([[2,1],[3,1],[4,2]]),1,nodes,(a,b,c,d)=>Math.hypot(a-c,b-d));
 assert.equal(tree.max,2);assert.ok(Math.abs(tree.segments[0].gain**2+tree.segments[1].gain**2-1)<1e-9);
 assert.equal(tree.segments[2].start,1);
});
test('real playback clock emits atlas onsets; mute, seeks and reduced motion clear charges',()=>{
 let reduced=false;const c=load('engine/audio-reactivity.js',{localStorage:{getItem(){},setItem(){}},document:{hidden:false},matchMedia:()=>({matches:reduced})});
 c.window.PathfindrSoundtrackAnalysis={tracks:{'test.mp3':{offset:0,step:.1,bands:Array(100).fill([120,100,80]),events:[[.2,.8,0],[.8,.7,1],[2,.9,2]]}}};
 const analyser={frequencyBinCount:1024,connect(){},getByteFrequencyData:b=>b.fill(0)};
 const player={paused:false,muted:false,volume:1,currentTime:0,src:'Music/test.mp3'},ctx={state:'running',sampleRate:48000,destination:{},createAnalyser:()=>analyser,createMediaElementSource:()=>({connect(){}})};
 const api=c.window.PathfindrAudio;api.attach(player,ctx);api.update(16);
 player.currentTime=.21;api.update(16);assert.equal(api.state.packets.length,1);assert.equal(api.state.source,'soundtrack');
 api.update(16,true);assert.equal(api.state.packets.length,0);
 player.currentTime=.81;api.update(16);assert.equal(api.state.packets.length,1);
 player.currentTime=3;api.update(16);assert.equal(api.state.packets.length,0);
 reduced=true;api.update(16);assert.equal(api.state.active,false);
});
