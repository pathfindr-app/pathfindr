const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const source=fs.readFileSync('game.js','utf8');
test('cooperative A* yields bounded node batches without changing the route or discovery tree',()=>{
 const nodes=new Map(),edges=new Map();
 for(let i=0;i<600;i++){nodes.set(i,{lat:0,lng:i});edges.set(i,i<599?[{neighbor:i+1,weight:1}]:[]);}
 const env={GameState:{nodes,edges},haversineDistance:()=>0};
 const text=source.slice(source.indexOf('const AStarFrontiers ='),source.indexOf('// OPTIMIZED VISUALIZATION'));
 vm.runInNewContext(text+';globalThis.search=createAStarSearch;globalThis.sync=runAStar;globalThis.frontiers=AStarFrontiers;',env);
 const iterator=env.search(0,599);let next,yields=0;
 do{next=iterator.next();if(!next.done)yields++;}while(!next.done);
 assert.ok(yields>=4);assert.equal(JSON.stringify(next.value),JSON.stringify(env.sync(0,599)));
 assert.equal(next.value.path.length,600);assert.ok(env.frontiers.get(next.value.explored).size>0);
});
test('visualizer heat smoothly reaches zero; Classic retains its independent cooling curve',()=>{
 const env={performance:{now:()=>100},GameState:{gameMode:'visualizer',vizState:{phase:'settling',settleStartTime:100,settleDuration:2200}},PathfindrMotion:{reduced:()=>false},PathfindrSearchAfterglow:{gain:()=>.42}};
 vm.runInNewContext(source.slice(source.indexOf('function getSearchCoolingGain('),source.indexOf('function renderSearchEmbers(')),env);
 assert.equal(env.getSearchCoolingGain(100),1);assert.equal(env.getSearchCoolingGain(2300),0);
 assert.equal(env.getSearchCoolingGain(1200),.5);
 env.GameState.gameMode='classic';assert.equal(env.getSearchCoolingGain(1200),.42);
});
test('ambient street overlay fades with pitch and restores when returning top-down',()=>{
 let pitch=0;const env={window:{PathfindrCity:{state:{enabled:true}}},GameState:{map:{getPitch:()=>pitch}}};
 vm.runInNewContext(source.slice(source.indexOf('function getAmbientRoadVisibility('),source.indexOf('function drawRoadNetwork(ctx)')),env);
 assert.equal(env.getAmbientRoadVisibility(),1);pitch=14;assert.equal(env.getAmbientRoadVisibility(),.5);
 pitch=40;assert.equal(env.getAmbientRoadVisibility(),0);pitch=0;assert.equal(env.getAmbientRoadVisibility(),1);
});
