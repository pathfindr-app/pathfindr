const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync('game.js','utf8');
const code=source.slice(source.indexOf('async function beginChallengeGame('),source.indexOf('async function submitChallengeEntry('));
function setup(loader){
 const notices=[],calls={nearest:0,lobby:0};
 const state={challengeState:{},loadedRoadCity:{name:'Previous city'},map:{stop(){},setMaxBounds(){},jumpTo(){}}};
 const env={window:{},GameState:state,CityFacts:{stopTicker(){}},RoundHistory:{clear(){}},console:{log(){},error(){}},
  loadRoadNetwork:location=>loader(state,location),findNearestNode:()=>{calls.nearest++;return null;},
  showToast:message=>notices.push(message),showModeSelector:()=>calls.lobby++};
 for(const name of ['disableContinuousPlay','clearVisualization','clearUserPath','setDifficulty','hideModeSelector','showLoading','hideLoading'])env[name]=()=>{};
 vm.createContext(env);vm.runInContext(code,env);
 return{state,calls,notices,start:()=>env.beginChallengeGame({id:'daily-test',city_name:'Exact city',center_lat:38,center_lng:-77,zoom_level:15})};
}
test('exhausted map loader cannot start a ranked challenge on a stale graph',async()=>{
 const r=setup(async()=>{});await r.start();assert.equal(r.calls.nearest,0);assert.equal(r.calls.lobby,1);
 assert.match(r.notices[0],/map is unavailable/);assert.equal(r.state.challengeState.activeChallenge,null);
});
test('late challenge load cannot overwrite or hide a newer game session',async()=>{
 let finish;const r=setup(()=>new Promise(resolve=>finish=resolve));const pending=r.start();
 r.state.currentCity={name:'New session'};r.state.gameMode='competitive';finish();await pending;
 assert.equal(r.calls.nearest,0);assert.equal(r.calls.lobby,0);assert.equal(r.notices.length,0);
});
test('exact loaded city proceeds to endpoint validation',async()=>{
 const r=setup(async(state,location)=>{state.loadedRoadCity=location;});await r.start();
 assert.equal(r.calls.nearest,2);assert.match(r.notices[0],/valid route points/);
});
