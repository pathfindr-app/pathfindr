const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
test('combined city response preserves shared OSM junction IDs and excludes railways',()=>{
    const c={window:{}};vm.runInNewContext(fs.readFileSync('engine/city-scene.js','utf8'),c);
    const way=(id,nodes,highway)=>({type:'way',id,nodes,tags:{highway},geometry:nodes.map(id=>({lat:id,lon:id+10}))});
    const result=c.window.PathfindrCity.roadsFromGeometry({elements:[way(1,[1,2],'primary'),way(2,[2,3],'residential'),way(3,[4,5],undefined),way(4,[6,7],'footway')]});
    assert.equal(result.elements.filter(e=>e.type==='way').length,2);
    assert.equal(result.elements.filter(e=>e.type==='node').length,3);
    assert.equal(result.elements.find(e=>e.type==='node'&&e.id===2).lon,12);
});
test('ads are disabled at configuration and SDK entry points',()=>{
    const config=fs.readFileSync('config.js','utf8'),ads=fs.readFileSync('ads.js','utf8'),html=fs.readFileSync('index.html','utf8');
    assert.match(config,/enabled: false/);assert.match(ads,/ads\?\.enabled\s*===\s*false/);
    assert.doesNotMatch(html,/pagead2\.googlesyndication\.com/);
    assert.doesNotMatch(html,/pathfindr<span>↗/);
});
test('Visualizer waits for scenery and its worker presentation before starting',()=>{
    const game=fs.readFileSync('game.js','utf8');
    assert.equal((game.match(/await GameState.citySceneTask/g)||[]).length,2);
    assert.equal((game.match(/await PathfindrCity.presented\(\)/g)||[]).length,2);
});
test('terrain feathering marks the polygon perimeter, not internal triangulation seams',()=>{
    const src=fs.readFileSync('engine/world-renderer.js','utf8');
    const fn=src.slice(src.indexOf('function triangles('),src.indexOf('function pointIn('));
    class Geometry{constructor(){this.attributes={};}setAttribute(k,v){this.attributes[k]=v;}computeVertexNormals(){}}
    const ctx={THREE:{BufferGeometry:Geometry,Float32BufferAttribute:class{constructor(array){this.array=array;}}},local:p=>p,earcut:()=>[0,1,2,0,2,3]};
    vm.runInNewContext(fn+';result=triangles([[[0,0],[1,0],[1,1],[0,1],[0,0]]]);',ctx);
    const flags=ctx.result.attributes.aBoundary.array;
    assert.equal(flags.length,18);
    for(let i=0;i<18;i+=3)assert.equal(flags[i]+flags[i+1]+flags[i+2],2);
});
test('concurrent scene and road preparation shares a single provider request',async()=>{
    let calls=0;
    const c={AbortController,URLSearchParams,setTimeout,clearTimeout,PathfindrWorldData:{convert:()=>({surfaces:[]})},PathfindrPlaceData:{labels:()=>[]},fetch:async()=>{calls++;return {ok:true,json:async()=>({elements:[]})};}};
    c.window=c;vm.runInNewContext(fs.readFileSync('engine/city-scene.js','utf8'),c);
    const city={lat:30,lng:-97,zoom:15};
    const [a,b]=await Promise.all([c.PathfindrCity.prepare(city),c.PathfindrCity.prepare(city)]);
    assert.equal(calls,1);assert.equal(a,b);
    await c.PathfindrCity.prepare({...city,zoom:14});assert.equal(calls,2);
});
