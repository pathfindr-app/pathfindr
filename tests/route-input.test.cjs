const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const src=fs.readFileSync('game.js','utf8');
test('tracing follows a bridge segment but rejects a crossing-road detour',()=>{
    const c={window:{}};vm.runInNewContext(fs.readFileSync('engine/route-input.js','utf8'),c);
    const p=(x,y)=>({lng:x,lat:y}),map={project:([x,y])=>({x,y})};
    assert.equal(c.window.PathfindrRouteInput.followsGesture([p(0,0),p(40,0)],map,p(0,0),p(40,0)),true);
    assert.equal(c.window.PathfindrRouteInput.followsGesture([p(0,0),p(0,100),p(40,0)],map,p(0,0),p(40,0)),false);
});
test('a nearby disconnected node cannot steal a valid bridge-edge snap',()=>{
    const c={getSnapRadiusMeters:()=>30,getAnchorSnapContext:()=>({anchorNodeId:1,anchorPos:{lat:0,lng:0}}),
        findNearestNodeWithDist:()=>({nodeId:99,distance:0}),findNearestEdgePoint:()=>[{fromNode:1,toNode:2,point:{lat:0,lng:.01},score:1}],
        buildPreviewPathCoords:(id,t)=>t.type==='node'?[]:[{lat:0,lng:0},t.point],haversineDistance:()=>.01,
        calculateCoordPathDistance:()=>.01,getMaxRoutedSegmentDistanceKm:()=>1,getRouteReachKm:()=>1,
        CONFIG:{segmentDistance:{medium:1}},GameState:{difficulty:'medium',gameMode:'competitive'},PathfindrTrace:{active:false}};
    vm.runInNewContext(src.slice(src.indexOf('function findSnapTarget('),src.indexOf('function createVirtualNode(')),c);
    assert.equal(c.findSnapTarget(0,.01).type,'edge');
    c.buildPreviewPathCoords=()=>[];assert.equal(c.findSnapTarget(0,.01),null);
});
test('snap continuity cannot lock the pointer onto an old edge far behind it',()=>{
    const c={getCanonicalEdgeKey:(a,b)=>`${a}:${b}`,getEdgeStructureSignature:()=> 'bridge:1',getHighwaySnapPenalty:()=>0};
    vm.runInNewContext(src.slice(src.indexOf('function scoreSnapEdgeCandidate('),src.indexOf('function getSnapEdgeMeta(')),c);
    const edge={from:1,to:2,name:'Bridge',highway:'primary'};
    const context={edge,edgeKey:'1:2',structure:'bridge:1'};
    assert.ok(c.scoreSnapEdgeCandidate(edge,30,null,context)>c.scoreSnapEdgeCandidate({...edge,from:2,to:3},1,null,context));
});
test('disconnected routes are rejected rather than drawn as straight shortcuts',()=>{
    const add=src.slice(src.indexOf('function addPointToUserPath('),src.indexOf('function showDistanceRejectionFeedback('));
    assert.match(add,/if \(microPath.length === 0\)[\s\S]*?return false/);
    assert.doesNotMatch(add,/No path found - fall back to direct add/);
});
test('Miami retains bridge layers and highway links, matching live road coverage',()=>{
    const c={window:{}};vm.runInNewContext(fs.readFileSync('data/cities/miami.js','utf8'),c);
    const ways=c.window.PathfindrCityPacks.miami.roads.elements.filter(e=>e.type==='way');
    assert.ok(ways.some(w=>w.tags.bridge&&Number(w.tags.layer)>0));
    assert.ok(ways.some(w=>w.tags.highway==='motorway'));
    assert.match(src,/PLAYABLE_HIGHWAY_REGEX = '\^\(motorway\|/);
});
test('active-game place labels cannot intercept tap or trace at road endpoints',()=>{
    assert.match(fs.readFileSync('engine/mobile-ui.css','utf8'),/body\[data-game-phase="playing"\] \.map-label-text \{ pointer-events:none;/);
});
