const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const source=fs.readFileSync('game.js','utf8');
test('round-five handoff holds the lock until the asynchronous city transition finishes',async()=>{
 let finish,calls=0;const env={GameState:{currentRound:5,continuousPlay:{enabled:true}},CONFIG:{totalRounds:5},window:{},
 GameController:{enterPhase(){}},GamePhase:{IDLE:'idle'},hideResults(){},transitionToNextCity(){calls++;return new Promise(r=>finish=r);},console};
 vm.runInNewContext(source.slice(source.indexOf('async function nextRound()'),source.indexOf('function playAgain()')),env);
 const pending=env.nextRound();assert.equal(env.GameState.roundTransitionInFlight,true);await env.nextRound();assert.equal(calls,1);
 finish();await pending;assert.equal(env.GameState.roundTransitionInFlight,false);
});
function transitionFixture(){
 const classes=new Set(['hidden']),city={name:'Old city'},next={name:'Next city',lat:1,lng:2};let taken=0,processed=0;
 const element={textContent:'',classList:{add:x=>classes.add(x),remove:x=>classes.delete(x)},style:{}};
 const GameState={roadGraphVersion:1,currentRound:5,totalScore:2000,roundScores:[1],locationMode:'us',currentCity:city,
 continuousPlay:{enabled:true,cityScores:[],citiesCompleted:0,preloadedCity:next,preloadedData:{elements:[{type:'way',nodes:[1,2]}]},preloadDetails:'loading',preloadRequestId:0},map:{stop(){},jumpTo(){},resize(){}}};
 const env={GameState,GameController:{phase:'idle',enterPhase(p){this.phase=p;}},GamePhase:{IDLE:'idle',PLAYING:'playing'},document:{getElementById:()=>element},
 PathfindrMotion:{reduced:()=>true},CityFacts:{stopTicker(){},showFactInTransition(){},startTicker(){}},RoundHistory:{clear(){}},setTimeout,clearTimeout,
 getLobbyCityPreparation(){taken++;throw Error('Scenery must not block ready roads');},processRoadData(){processed++;},shouldUseLegacyMobileSync:()=>false};
 for(const name of ['updateScoreDisplay','updateRoundDisplay','clearRoundLegend','clearVisualization','clearUserPath','scheduleMapPresentationRefresh','updateLocationDisplay','updateContinuousHUD','selectRandomEndpoints','enableDrawing','scheduleNextRoundEndpointPrecompute','preloadNextCity'])env[name]=()=>{};
 vm.runInNewContext(source.slice(source.indexOf('async function transitionToNextCity()'),source.indexOf('async function loadRoadNetworkForContinuous(')),env);
 return {env,classes,city,next,taken:()=>taken,processed:()=>processed};
}
test('ready roads enter round one even when optional scenery is still loading',async()=>{
 const x=transitionFixture();await x.env.transitionToNextCity();assert.equal(x.taken(),0);assert.equal(x.processed(),1);
 assert.equal(x.env.GameState.currentCity,x.next);assert.equal(x.env.GameState.currentRound,1);assert.equal(x.env.GameController.phase,'playing');assert.equal(x.env.GameState.continuousPlay.cityScores.length,1);
});
test('loading feedback is immediate; cancellation prevents late reserve from changing map',async()=>{
 const x=transitionFixture();let finish;x.env.GameState.continuousPlay.preloadedData=null;
 x.env.takeReadyCity=()=>new Promise(r=>finish=r);
 const pending=x.env.transitionToNextCity();assert.equal(x.classes.has('hidden'),false);assert.equal(x.env.GameState.currentRound,5);
 x.env.GameState.cityTransitionId++;finish({city:x.next,data:{elements:[]}});await pending;
 assert.equal(x.env.GameState.currentCity,x.city);assert.equal(x.processed(),0);assert.equal(x.classes.has('hidden'),true);
});
test('failed preparation preserves score and city for retry',async()=>{
 const x=transitionFixture();x.env.GameState.continuousPlay.preloadedData=null;
 x.env.takeReadyCity=async()=>{throw Error('offline');};
 await assert.rejects(x.env.transitionToNextCity(),/offline/);assert.equal(x.env.GameState.currentRound,5);assert.equal(x.env.GameState.totalScore,2000);assert.equal(x.env.GameState.continuousPlay.cityScores.length,0);
});
