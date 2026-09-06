const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');

test('shared live/pack label extraction handles names, relations and road nodes',()=>{
    const {api}=environment('place-data.js');
    const raw={elements:[{type:'node',id:1,lon:1,lat:2,tags:{place:'neighbourhood',name:'District'}},
        {type:'node',id:2,lon:2,lat:3},{type:'way',id:3,nodes:[1,2],tags:{highway:'residential',name:'Main Street'}},
        {type:'relation',id:4,tags:{natural:'water',name:'Lake'},members:[{role:'outer',geometry:[{lon:1,lat:2},{lon:2,lat:3}]}]},
        {type:'node',id:5,lon:1,lat:2,tags:{place:'neighbourhood',name:'District'}}]};
    const labels=api.PathfindrPlaceData.labels(raw);
    assert.equal(labels.length,3);assert.equal(labels[0].type,'district');
    assert.ok(labels.some(l=>l.name==='Main Street'&&l.pos[0]===2));
    assert.equal(api.PathfindrPlaceData.labels(raw,[10,10,11,11]).length,0);
});

test('city preparation deduplicates downloads, caches details, and never changes active map',async()=>{
    let count=0;const {api}=environment('city-scene.js',{
        AbortController,URLSearchParams,setTimeout,clearTimeout,
        fetch:async()=>{count++;return{ok:true,json:async()=>({elements:[]})};},
        PathfindrWorldData:{convert:()=>({surfaces:[],pois:[]})},PathfindrPlaceData:{labels:()=>[{name:'Park',type:'park',pos:[0,0]}]}
    });
    const city={lat:1,lng:2};const [a,b]=await Promise.all([api.PathfindrCity.prepare(city),api.PathfindrCity.prepare(city)]);
    assert.equal(a,b);assert.equal(count,1);assert.equal(a.labels[0].name,'Park');
    await api.PathfindrCity.prepare(city);assert.equal(count,1);assert.equal(api.PathfindrCity.state.buildings,0);
});

test('city detail failure retries another server and restored complete scenes avoid downloads',async()=>{
    let count=0;const {api}=environment('city-scene.js',{
        AbortController,URLSearchParams,setTimeout,clearTimeout,
        fetch:async()=>{count++;if(count===1)throw Error('offline');return{ok:true,json:async()=>({elements:[]})};},
        PathfindrWorldData:{convert:()=>({surfaces:[],pois:[]})},PathfindrPlaceData:{labels:()=>[]}
    });
    const scene=await api.PathfindrCity.prepare({lat:1,lng:2});assert.equal(count,2);
    api.PathfindrCity.prime({lat:3,lng:4},scene);
    assert.equal(await api.PathfindrCity.prepare({lat:3,lng:4}),scene);assert.equal(count,2);
});

test('place labels project on map render, not on a trailing animation frame',()=>{
    const events={},element=()=>({style:{},append(){},replaceChildren(){},setAttribute(){},addEventListener(){}});
    let projections=0,frames=0;const container={...element(),clientWidth:800,clientHeight:700};
    const map={getContainer:()=>container,on:(event,fn)=>events[event]=fn,triggerRepaint(){},getZoom:()=>17,project:()=>{projections++;return{x:200,y:200};}};
    const {api}=environment('map-labels.js',{document:{createElement:element},requestAnimationFrame(){frames++;}});
    api.PathfindrMapLabels.set(map,[{name:'Miami River',type:'water',pos:[-80.2,25.77]}]);
    events.render();assert.equal(projections,1);events.render();assert.equal(projections,1);
    events.move();assert.equal(projections,1);events.render();assert.equal(projections,2);assert.equal(frames,0);
});

test('Miami pack has self-contained bounded roads and real-world labels',()=>{
    const sandbox={window:{}};vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../data/cities/miami.js'),'utf8'),sandbox);
    const pack=sandbox.window.PathfindrCityPacks.miami;
    const ids=new Set(pack.roads.elements.filter(e=>e.type==='node').map(e=>e.id));
    assert.ok(ids.size>1000);
    for(const e of pack.roads.elements){if(e.type==='way')assert.ok(e.nodes.every(id=>ids.has(id)));else{
        assert.ok(e.lon>=pack.bounds[0]&&e.lon<=pack.bounds[2]&&e.lat>=pack.bounds[1]&&e.lat<=pack.bounds[3]);
    }}
    for(const name of ['Downtown Miami','Brickell','Miami River'])assert.ok(pack.labels.some(l=>l.name===name));
    assert.match(pack.sourceSha256,/^[a-f0-9]{64}$/);
});

function environment(module, extra = {}) {
    const frames = new Map();
    let id = 0;
    const context = vm.createContext({
        window: {}, document: { hidden: false }, performance: { now: () => 0 },
        matchMedia: () => ({ matches: false }), console,
        requestAnimationFrame: fn => { frames.set(++id, fn); return id; },
        cancelAnimationFrame: id => frames.delete(id), ...extra
    });
    vm.runInContext(fs.readFileSync(path.join(__dirname, '../engine', module), 'utf8'), context);
    return { api: context.window, tick(now) { const callbacks = [...frames.values()]; frames.clear(); callbacks.forEach(fn => fn(now)); }, context };
}

test('route reveal travels by distance, not node count', () => {
    const { api } = environment('motion.js');
    const motion = api.PathfindrMotion;
    const nodes = new Map([[1, {lat: 0,lng: 0}], [2, {lat: 0,lng: 1}], [3, {lat: 0,lng: 10}]]);
    const lengths = motion.distances([1,2,3], nodes, (a,b,c,d) => Math.abs(d-b));
    assert.deepEqual(Array.from(lengths), [0,1,10]);
    assert.equal(motion.indexAt(lengths, 0), 0);
    assert.equal(motion.indexAt(lengths, 0.1), 1);
    assert.equal(motion.indexAt(lengths, 0.55), 1.5);
    assert.equal(motion.indexAt(lengths, 1), 2);
});

test('motion cancels stale scenes and completes reduced motion in one frame', async () => {
    const env = environment('motion.js');
    let updates = 0;
    const cancelled = env.api.PathfindrMotion.animate(1000, () => updates++, () => false);
    env.tick(16);
    assert.equal(await cancelled, false);
    assert.equal(updates, 0);
    env.context.matchMedia = () => ({ matches: true });
    const completed = env.api.PathfindrMotion.animate(1000, p => { assert.equal(p, 1); updates++; });
    env.tick(32);
    assert.equal(await completed, true);
    assert.equal(updates, 1);
});

test('building conversion rejects open ways and bounds heights', () => {
    const { api } = environment('city-scene.js');
    const ring = [{lat:1,lon:1},{lat:1,lon:2},{lat:2,lon:2},{lat:1,lon:1}];
    const data = api.PathfindrCity.convert({elements: [
        {type:'way',id:1,tags:{building:'yes',height:'900'},geometry:ring},
        {type:'way',id:2,tags:{building:'yes','building:levels':'3'},geometry:ring},
        {type:'way',id:3,tags:{building:'yes'},geometry:ring.slice(0,3)},
        {type:'way',id:4,tags:{highway:'residential'},geometry:ring}
    ]});
    assert.equal(data.features.length, 2);
    assert.equal(data.features[0].properties.height, 100);
    assert.ok(Math.abs(data.features[1].properties.height - 9.6) < 1e-9);
});

test('camera reserves room for both controls and the visible recap', () => {
    const env = environment('game-adapter.js', {
        window: {innerWidth:390},
        GameState: {map: {getContainer: () => ({clientHeight:800})}},
        GameController: {phase:'playing'}, GamePhase: {RESULTS:'results'},
        document: {getElementById: () => ({classList:{contains:()=>true},getBoundingClientRect:()=>({height:380})})}
    });
    assert.equal(env.context.getRouteCameraPadding().bottom,86);
    env.context.GameController.phase = 'results';
    const recap = env.context.getRouteCameraPadding();
    assert.equal(recap.bottom,404);
    assert.ok(recap.top + recap.bottom < 800);
});

test('trace owns only tip-started strokes, batches movement, and undoes whole strokes', () => {
    const handlers = {}, captures = new Set(), buttons = [];
    const surface = {
        style: {},
        addEventListener: (name, fn) => handlers[name] = fn,
        setPointerCapture: id => captures.add(id), hasPointerCapture: id => captures.has(id),
        releasePointerCapture: id => captures.delete(id)
    };
    const env = environment('trace-input.js', {
        window: { addEventListener() {} }, localStorage: {getItem: () => 'trace', setItem() {}},
        document: {addEventListener(){},querySelectorAll: () => buttons, getElementById: () => ({textContent:''})}
    });
    let nodes = 0, ends = [], starts = 0;
    const trace = env.api.PathfindrTrace;
    trace.init({surface, canDraw: () => true, nearTip: p => p.x === 10,canResume:p=>p.x===60,
        snapshot: () => nodes, changed: saved => nodes !== saved,
        restore: saved => nodes = saved, begin: () => starts++, commit: () => { nodes++; return true; }, end: ok => ends.push(ok)});
    const event = (x, pointerId = 1) => ({clientX:x,clientY:10,button:0,pointerId,pointerType:'touch',preventDefault(){},stopImmediatePropagation(){}});
    handlers.pointerdown(event(100));
    assert.equal(trace.active, false);
    handlers.pointerdown(event(10));
    assert.equal(trace.active, true);
    assert.equal(starts, 1);
    handlers.pointermove(event(20)); handlers.pointermove(event(30));
    assert.equal(nodes, 0);
    env.tick(16);
    assert.equal(nodes, 1);
    handlers.pointerup(event(40));
    assert.equal(nodes, 2);
    assert.equal(trace.active, false);
    assert.equal(captures.size, 0);
    assert.deepEqual(ends, [true]);
    assert.equal(trace.undo(), true);
    assert.equal(nodes, 0);
    handlers.pointerdown(event(10));
    handlers.pointerdown(event(10, 2));
    assert.equal(trace.active, false);
    assert.deepEqual(ends, [true,false]);
    handlers.pointerdown(event(60));assert.equal(trace.active,true);assert.equal(nodes,1);
    handlers.pointerup(event(60));assert.equal(trace.undo(),true);assert.equal(nodes,0);
});

test('assisted trace completion releases capture and ends once before pointer-up',()=>{
    const handlers={},captures=new Set();let ended=0,done=false;
    const env=environment('trace-input.js',{window:{addEventListener(){}},localStorage:{getItem:()=> 'trace'},
        document:{addEventListener(){},querySelectorAll:()=>[],getElementById:()=>({textContent:''})}});
    const surface={style:{},addEventListener:(k,f)=>handlers[k]=f,setPointerCapture:id=>captures.add(id),hasPointerCapture:id=>captures.has(id),releasePointerCapture:id=>captures.delete(id)};
    const trace=env.api.PathfindrTrace;
    trace.init({surface,canDraw:()=>true,nearTip:()=>true,snapshot:()=>0,changed:()=>true,begin(){},
        commit(){done=true;return true;},tryFinish(){done=true;return true;},isFinished:()=>done,end(){ended++;}});
    const event=x=>({clientX:x,clientY:0,button:0,pointerId:1,pointerType:'touch',preventDefault(){},stopImmediatePropagation(){}});
    handlers.pointerdown(event(0));handlers.pointermove(event(2));env.tick(16);
    assert.equal(trace.active,false);assert.equal(captures.size,0);assert.equal(ended,1);
    handlers.pointerup(event(25));assert.equal(ended,1);
});

test('soundtrack attaches once, responds to real bins, and decays when muted', () => {
    let connections = 0;
    const analyser = {frequencyBinCount:256,connect(){},getByteFrequencyData: bins => bins.fill(255)};
    const ctx = {state:'running',sampleRate:44100,destination:{},
        createMediaElementSource: () => { connections++; return {connect(){}}; }, createAnalyser: () => analyser};
    const {api} = environment('audio-reactivity.js', {localStorage:{getItem:()=>null,setItem(){}}});
    const audio = api.PathfindrAudio, player = {paused:false,muted:false,volume:1};
    audio.attach(player,ctx); audio.attach(player,ctx);
    assert.equal(connections,1);
    audio.update(100,false);
    assert.ok(audio.state.energy > 0.5);
    assert.equal(audio.state.status, 'Listening');
    const energy = audio.state.energy;
    audio.update(100,true);
    assert.equal(audio.state.status, 'Muted');
    assert.ok(audio.state.energy < energy);
    audio.setEnabled(false);
    for(let i=0;i<30;i++) audio.update(100,false);
    assert.ok(audio.state.energy < 0.0001);
});

test('road particles preserve meters per second and reverse-edge continuity', () => {
    const {api}=environment('road-motion.js');
    const edges=[{from:1,to:2,fromPos:{lat:0,lng:0},toPos:{lat:0,lng:10}},
        {from:3,to:2,fromPos:{lat:0,lng:30},toPos:{lat:0,lng:10}}];
    api.PathfindrRoadMotion.build(edges,(a,b,c,d)=>Math.abs(d-b)/1000);
    const p={active:true,edgeIndex:0,edgeProgress:.9,reverse:false,speed:20};
    api.PathfindrRoadMotion.advance(p,.1,()=>0);
    assert.equal(p.edgeIndex,1);assert.equal(p.reverse,true);
    assert.ok(Math.abs(p.edgeProgress-.05)<1e-8); // one meter past the shared junction
    api.PathfindrRoadMotion.advance(p,.1,()=>0);
    assert.ok(Math.abs(p.edgeProgress-.15)<1e-8); // exactly two meters farther
});

test('trace backtracking removes only a nearby contiguous tail', () => {
    const {api}=environment('trace-input.js');
    const path=[0,1,2],project=id=>({x:id*30,y:0});
    assert.equal(api.PathfindrTrace.backtrack({x:40,y:25},path,project),false);
    assert.equal(path.length,3);
    assert.equal(api.PathfindrTrace.backtrack({x:40,y:2},path,project),true);
    assert.deepEqual(path,[0,1]);
    assert.equal(api.PathfindrTrace.backtrack({x:34,y:0},path,project),false);
});

test('touch retracing erases a wider contiguous tail and can retain a partial road',()=>{
    const {api}=environment('trace-input.js');const trace=api.PathfindrTrace;trace.pointerType='touch';
    const path=[0,1,2,3,4],project=id=>({x:id*50,y:0});let fraction;
    assert.equal(trace.backtrack({x:75,y:14},path,project,(a,b,t)=>{fraction=t;return 'partial';}),true);
    assert.deepEqual(path,[0,1,'partial']);assert.equal(fraction,.5);
    const remote=[0,1,2,3,4,5,6,7,8];assert.equal(trace.backtrack({x:0,y:0},remote,project),false);
});

test('OSM multipolygons join reversed segments and preserve islands as holes', () => {
    const {api}=environment('world-data.js');
    const geom=coords=>coords.map(([lon,lat])=>({lon,lat}));
    const result=api.PathfindrWorldData.convert({elements:[{type:'relation',id:5,tags:{natural:'water'},members:[
        {type:'way',ref:1,role:'outer',geometry:geom([[0,0],[4,0],[4,4]])},
        {type:'way',ref:2,role:'outer',geometry:geom([[0,0],[0,4],[4,4]])},
        {type:'way',ref:3,role:'inner',geometry:geom([[1,1],[2,1],[2,2],[1,1]])}
    ]}]});
    assert.equal(result.surfaces.length,1);assert.equal(result.surfaces[0].rings.length,2);
    assert.equal(api.PathfindrWorldData.contains([1.5,1.2],result.surfaces[0].rings[1]),true);
});

test('POIs use cuisine tags and tidal water does not get invented flow direction', () => {
    const {api}=environment('world-data.js');
    const result=api.PathfindrWorldData.convert({elements:[
        {type:'node',id:1,lat:10,lon:20,tags:{amenity:'fast_food',cuisine:'burger;ice_cream',name:'Example'}},
        {type:'node',id:2,lat:10,lon:20,tags:{amenity:'restaurant',name:'Burger in name only'}},
        {type:'way',id:3,tags:{waterway:'river',tidal:'yes'},geometry:[{lat:0,lon:0},{lat:1,lon:1}]}
    ]});
    assert.equal(result.pois.length,1);assert.equal(result.pois[0].type,'burger');assert.equal(result.flows.length,0);
});

test('managed animation advances on the game clock with no extra RAF loop', async () => {
    const env=environment('motion.js'),motion=env.api.PathfindrMotion;
    motion.managed=true;let latest=0;
    const job=motion.animate(100,p=>latest=p);
    env.tick(1000);assert.equal(latest,0);
    motion.tick(50);assert.equal(latest,.5);
    motion.tick(50);assert.equal(await job,true);assert.equal(latest,1);
});

test('collection is unique, persists locally, and never requires route mutation', () => {
    const status={textContent:''};let written=null;
    const {api}=environment('collections.js',{
        localStorage:{getItem:()=>null,setItem:(key,value)=>written=JSON.parse(value)},
        document:{body:{dataset:{gamePhase:'playing'}},getElementById:id=>id==='discovery-status'?status:null}
    });
    const item={key:'burger:node/123',type:'burger',name:'Example'};
    assert.equal(api.PathfindrCollections.claim(item),true);
    assert.equal(api.PathfindrCollections.claim(item),false);
    assert.equal(api.PathfindrCollections.state().counts.burger,1);
    assert.equal(written.counts.burger,1);
    assert.match(status.textContent,/collected/);
    assert.equal(api.PathfindrCollections.state().round.items.length,1);
});

test('library discovery uses real OSM features; sparks no longer spawn',()=>{
    const {api}=environment('world-data.js');
    const world=api.PathfindrWorldData.convert({elements:[{type:'node',id:42,lat:25,lon:-80,tags:{amenity:'library',name:'Main Library'}}]});
    assert.equal(world.pois[0].type,'library');assert.equal(world.pois[0].name,'Main Library');
    const {api:c}=environment('collections.js',{localStorage:{getItem:()=>null,setItem(){}},document:{body:{dataset:{gamePhase:'visualizing'}},getElementById:id=>id==='discovery-status'?{}:null}});
    c.PathfindrCollections.setCity({lat:25,lng:-80},[{from:1,fromPos:{lat:25,lng:-80}}]);
    assert.equal(c.PathfindrCollections.state().available.length,0);
    c.PathfindrCollections.addPOIs(world.pois);
    assert.equal(c.PathfindrCollections.state().available[0].type,'library');
    c.PathfindrCollections.claim({...world.pois[0],key:'library:node/42'});
    assert.equal(c.PathfindrCollections.state().counts.library,1);
    assert.equal(c.PathfindrCollections.state().round.items[0].name,'Main Library');
    c.PathfindrCollections.setChallenge([{key:'spark:old',type:'spark',pos:[-80,25]}]);
    assert.equal(c.PathfindrCollections.state().available.length,0);
});

test('Visualizer blocks claims while Classic A* and Explorer retain pickups',()=>{
    const GameState={gameMode:'visualizer'};
    const {api}=environment('collections.js',{GameState,localStorage:{getItem:()=>null,setItem(){}},document:{body:{dataset:{gamePhase:'visualizing'}},getElementById:id=>id==='discovery-status'?{}:null}});
    const c=api.PathfindrCollections,item={key:'library:mode',type:'library',name:'Library'};
    assert.equal(c.claim(item),false);assert.equal(c.state().counts.library,0);
    GameState.gameMode='competitive';assert.equal(c.claim(item),true);
    GameState.gameMode='explorer';assert.equal(c.claim({...item,key:'library:explorer'}),true);
});

test('A* pickups survive into results, remain unique, and loading cannot collect',()=>{
    const body={dataset:{gamePhase:'visualizing'}};
    const {api}=environment('collections.js',{localStorage:{getItem:()=>null,setItem(){}},document:{body,getElementById:id=>id==='discovery-status'?{}:null}});
    const c=api.PathfindrCollections,item={key:'spark:astar',type:'spark',name:'A* Spark'};c.beginRound(1);
    assert.equal(c.claim(item),true);assert.equal(c.claim(item),false);
    body.dataset.gamePhase='results';assert.equal(c.state().round.items.length,1);
    body.dataset.gamePhase='loading';assert.equal(c.claim({...item,key:'spark:loading'}),false);
    assert.equal(c.state().counts.spark,1);
});

test('round discoveries reset without changing lifetime totals; results pickups belong to current round',()=>{
    const body={dataset:{gamePhase:'playing'}};
    const {api}=environment('collections.js',{localStorage:{getItem:()=>null,setItem:()=>{}},document:{body,getElementById:id=>id==='discovery-status'?{}:null}});
    const c=api.PathfindrCollections;c.beginRound(1);
    c.claim({key:'landmark:a',type:'landmark',name:'Freedom Tower'});
    c.beginRound(1);assert.equal(c.state().round.items.length,1);
    body.dataset.gamePhase='results';c.claim({key:'spark:a',type:'spark',name:'Street Spark'});
    assert.equal(c.state().round.items.length,2);
    c.beginRound(2);assert.equal(c.state().round.items.length,0);assert.equal(c.state().counts.landmark,1);
    c.claim({key:'spark:b',type:'spark',name:'Street Spark'});c.beginRound(2,true);
    assert.equal(c.state().round.items.length,0);assert.equal(c.state().counts.spark,2);
    c.setCity({lat:25,lng:-80},[]);assert.equal(c.state().round.key,null);
});
