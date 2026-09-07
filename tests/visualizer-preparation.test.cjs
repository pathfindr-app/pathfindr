const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
function create(deps){const window={};vm.runInNewContext(fs.readFileSync('engine/visualizer-preparation.js','utf8'),{window});return window.PathfindrVisualizerPreparation.create(deps);}
test('one pending selection feeds a cached search; take permits a new route',async()=>{
 let calls=0;const queue=create({version:()=>1,active:()=>true,now:()=>0,select:function*(){calls++;yield;return {preparedRoute:{path:[1,2]}};}});
 const a=queue.warm(),b=queue.warm();assert.equal(a,b);assert.ok((await queue.take()).preparedRoute);assert.equal(calls,1);
 await queue.take();assert.equal(calls,2);
});
test('graph replacement and cancellation discard unfinished look-ahead',async()=>{
 let version=1,t=0,resume;
 const queue=create({version:()=>version,active:()=>true,now:()=>t+=3,yieldWork:()=>new Promise(r=>resume=r),select:function*(){yield;return {preparedRoute:{path:[1,2]}};}});
 const task=queue.warm();version=2;resume();assert.equal(await task,null);
 queue.clear();assert.equal(queue.state().ready,false);
});
test('Visualizer marker arrival overlaps search and reuses the prepared A* result',()=>{
 const src=fs.readFileSync('game.js','utf8'),intro=src.slice(src.indexOf('async playHeroIntro('),src.indexOf('function startVisualizerMode()'));
 assert.doesNotMatch(intro,/await sleep|await this.waitForMapSettle/);
 assert.match(intro,/VisualizerPreparedRoutes.warm/);
 assert.match(src,/const result = cached\|\|step.value/);
 assert.ok(src.includes("if(GameState.gameMode==='visualizer'&&GameState.visualizerState.paused)return;"),'Pause must not tick even reduced-motion jobs');
});
