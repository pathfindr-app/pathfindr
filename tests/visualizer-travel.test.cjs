const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync(require('node:path').join(__dirname,'../engine/immersive.js'),'utf8');
function setup(saved='[]',blocked=false){
    let stored=saved;
    const context={window:{},document:{readyState:'loading',addEventListener(){}},localStorage:{getItem(){if(blocked)throw Error('blocked');return stored;},setItem(k,v){if(blocked)throw Error('blocked');stored=v;}}};
    vm.runInNewContext(source,context);
    return {ui:context.window.PathfindrVisualizerUI,records:()=>JSON.parse(stored)};
}
test('travel log records real completed scans, merges cities and survives reload',()=>{
    let app=setup();const paris={name:'Paris, France',lat:48.857,lng:2.352};
    app.ui.scanned(paris);app.ui.scanned(paris);
    assert.equal(app.records().length,1);assert.equal(app.records()[0].scans,2);
    app=setup(JSON.stringify(app.records()));app.ui.scanned({name:'London, UK',lat:51.513,lng:-.122});
    assert.deepEqual(app.records().map(v=>v.name),['London, UK','Paris, France']);
    assert.equal(app.records()[1].scans,2);
});
test('travel storage is bounded and rejects invalid coordinates and corrupt counts',()=>{
    const app=setup(JSON.stringify([{name:'City',lat:10,lng:20,scans:'999'},null,{name:'Invalid',lat:200,lng:0}]));
    app.ui.scanned({name:'City',lat:10,lng:20});assert.equal(app.records()[0].scans,1);
    app.ui.scanned({name:'Invalid',lat:NaN,lng:0});assert.equal(app.records().length,1);
    for(let i=0;i<110;i++)app.ui.scanned({name:`City ${i}`,lat:0,lng:i});
    assert.equal(app.records().length,100);
});
test('unavailable storage does not interrupt visualizer playback',()=>{
    assert.doesNotThrow(()=>setup('[]',true).ui.scanned({name:'Paris',lat:48,lng:2}));
    assert.doesNotThrow(()=>setup('broken JSON').ui.scanned({name:'Paris',lat:48,lng:2}));
});
