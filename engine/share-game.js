/* Friend attempts use the ordinary game rules, but never submit ranked scores. */
(() => {
    let active=null,index=0;
    async function start(payload){
        const checked=PathfindrShareData.validate(payload);
        const resolved=checked.rounds.map(r=>PathfindrShareData.resolve(checked.maps[r.map],r));
        active={payload:checked,resolved};index=0;await load();
    }
    async function load(){
        const r=active.payload.rounds[index],m=active.payload.maps[r.map],prepared=active.resolved[index];
        disableContinuousPlay();cancelEndpointPrecompute();hideModeSelector();hideInstructions();hideResults();hideGameOver();
        GameController.enterPhase(GamePhase.IDLE);clearVisualization();clearUserPath();
        if(index===0||active.payload.rounds[index-1].map!==r.map)RoundHistory.clear();
        if(index===0){GameState.totalScore=0;GameState.roundScores=[];}
        GameState.gameMode='competitive';GameState.currentRound=index+1;GameState.currentCity={...m.location};GameState.locationMode='shared';
        GameState.map.setMaxBounds(null);GameState.map.jumpTo({center:[m.location.lng,m.location.lat],zoom:15});
        processRoadData(prepared.data);GameState.startNode=prepared.start;GameState.endNode=prepared.end;
        setDifficulty(r.difficulty);placeMarkers();GameState.gameStarted=true;GameState.userPathNodes=[prepared.start];GameState.userDistance=0;
        PathfindrCollections.setChallenge(r.pickups);
        setHUDMode('competitive');document.getElementById('current-location').textContent=`${m.location.name} · Friend challenge`;
        updateRoundDisplay();updateScoreDisplay();GameController.startLoop();AmbientViz.start();enableDrawing();GameController.enterPhase(GamePhase.PLAYING);redrawUserPath();centerOnRoute();
    }
    async function next(){if(!active)return false;index++;if(index<active.payload.rounds.length)await load();else{hideResults();GameController.enterPhase(GamePhase.IDLE);await showGameOver();}return true;}
    function capture(score){
        const coords=ids=>ids.map(id=>GameState.nodes.get(id)).filter(Boolean).map(n=>[n.lng,n.lat]);
        const collections=PathfindrCollections.state(),collected=collections.round.items.filter(p=>p.pos);
        const pickups=[...collections.available.map((p,i)=>({key:p.key||`target:${i}`,type:p.type,name:p.name,pos:p.pos})),...collected].slice(0,250);
        PathfindrArchive.capture({...score,difficulty:GameState.difficulty,start:coords([GameState.startNode])[0],end:coords([GameState.endNode])[0],userPath:coords(GameState.userPathNodes),optimalPath:coords(GameState.optimalPath),pickups,collected});
    }
    window.PathfindrSharedGame={start,next,capture,active:()=>!!active,clear:()=>{active=null;PathfindrCollections.clearChallenge();},roundCount:()=>active?.payload.rounds.length};
})();
