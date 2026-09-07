const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync('game.js','utf8');
const code=source.slice(source.indexOf('async function loadRoadNetwork('),source.indexOf('// Uniform geographic grid'));
for(const mode of ['competitive','explorer','visualizer','challenge'])test(`${mode} installs its exact bundled graph without calling map providers`,async()=>{
 const pack=JSON.parse(fs.readFileSync('data/cities/fallback/washington.json'));
 const city={...pack.location},state={gameMode:mode,roadLoadRequestId:0};let installed;
 const env={GameState:state,window:{PathfindrCityPacks:{[city.packId]:pack}},preparedLocationRoads:new WeakMap(),
  completeRoadNetworkLoad:(roads,location,origin)=>{installed={roads,location,origin};},fetch:()=>{throw Error('External fetch forbidden');}};
 vm.createContext(env);vm.runInContext(code,env);await env.loadRoadNetwork(city);
 assert.equal(installed.roads,pack.roads);assert.equal(installed.location,city);assert.equal(installed.origin,'bundled');assert.equal(state.roadLoadRequestId,1);
});
test('prepared exact-location reserve is consumed once, not reused for a different object',async()=>{
 const city={name:'Pinned challenge city'},roads={elements:[{type:'way',nodes:[1,2]}]},preparedLocationRoads=new WeakMap([[city,roads]]);let installed;
 const env={GameState:{roadLoadRequestId:7},window:{},preparedLocationRoads,completeRoadNetworkLoad:(data,location)=>installed={data,location}};
 vm.createContext(env);vm.runInContext(code,env);await env.loadRoadNetwork(city);
 assert.equal(installed.data,roads);assert.equal(installed.location,city);assert.equal(preparedLocationRoads.has(city),false);assert.equal(env.GameState.roadLoadRequestId,8);
});
