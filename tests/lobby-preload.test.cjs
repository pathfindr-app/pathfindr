const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const data={elements:[{type:'way',nodes:[1,2]}]};
function create(deps){const c={window:{}};vm.runInNewContext(fs.readFileSync('engine/lobby-preload.js','utf8'),c);return c.window.PathfindrLobbyPreload.create(deps);}
test('lobby prepares one distinct slot for US and Global; repeated warming deduplicates',async()=>{
    const selected=[],loaded=[];const p=create({city:async mode=>{selected.push(mode);return{name:mode};},roads:async city=>{loaded.push(city.name);return data;},details:async()=>{}});
    p.warm();p.warm();const [us,global]=await Promise.all([p.take('us'),p.take('global')]);
    assert.deepEqual(selected,['us','global','us','global']);assert.equal(loaded.length,4);assert.equal(us.city.name,'us');assert.equal(global.city.name,'global');assert.equal(us.data,data);
});
test('unseeded early click joins the complete city request',async()=>{
    const finish={};let calls=0;
    const p=create({city:async mode=>({name:mode}),roads:city=>{calls++;return new Promise(r=>finish[city.name]=r);},details:async()=>{}});
    p.warm();await new Promise(setImmediate);const request=p.take('us');finish.us(data);finish.global(data);
    assert.equal((await request).data,data);assert.equal(calls,2);
});
test('failed or incomplete preload preserves city for normal loading fallback',async()=>{
    const p=create({city:async()=>({name:'Paris'}),roads:async()=>({remark:'timeout',elements:[]}),details:async()=>assert.fail('must not prepare failed roads')});
    const result=await p.take('global');assert.equal(result.city.name,'Paris');assert.equal(result.data,null);
});
test('consumed city is replenished immediately without a lobby visit, unused city is retained',async()=>{
    let calls=0;const p=create({city:async mode=>({name:mode+(++calls)}),roads:async()=>data,details:async()=>{}});
    p.warm();const first=await p.take('us');assert.equal(calls,3);const second=await p.take('us');assert.notEqual(first.city.name,second.city.name);assert.equal(calls,4);
});
test('restored random reserve is single-use while its fresh replacement loads',async()=>{
    let finish,calls=0;const p=create({restore:()=>({city:{name:'Seattle'},data}),city:()=>{calls++;return new Promise(r=>finish=r);},roads:async()=>data,details:async()=>{}});
    p.warm();await new Promise(setImmediate);
    assert.equal((await p.take('global')).city.name,'Seattle');
    let returned=false;const next=p.take('global').then(value=>{returned=true;return value;});
    await new Promise(setImmediate);assert.equal(returned,false);
    finish({name:'Paris'});assert.equal((await next).city.name,'Paris');
    assert.equal(calls,3);
});
test('persisted reserve restores on reload and fresh preparation is saved',async()=>{
    const saved=[];let finish;
    const p=create({restore:async()=>({city:{name:'London'},data}),save:(mode,value)=>saved.push(value.city.name),city:()=>new Promise(r=>finish=r),roads:async()=>data,details:async()=>{}});
    p.warm();await new Promise(setImmediate);assert.equal(p.state().global.city,'London');
    finish({name:'Paris'});await new Promise(setImmediate);assert.deepEqual(saved,['Paris']);
});
test('optional scenery failure keeps the chosen city, never substitutes Miami',async()=>{
    const p=create({city:async()=>({name:'Denver'}),roads:async()=>data,details:async()=>{throw Error('offline');}});
    const result=await p.take('us');assert.equal(result.city.name,'Denver');assert.equal(result.data,data);assert.equal(result.scene,null);
});
test('production random modes have no Miami seed or legacy pack reserve',()=>{
    const src=fs.readFileSync('game.js','utf8').split('function getLobbyCityPreparation(){')[1].split('function scheduleLobbyCityPreparation')[0];
    assert.doesNotMatch(src,/seed:|CityPacks/);assert.match(src,/lobby-reserve-v3/);assert.match(src,/saved.city\?\.packId/);
});
test('failed replacement cannot replay an already consumed restored city',async()=>{
    let fail;const p=create({restore:async()=>({city:{name:'Seattle'},data}),city:async()=>({name:'Denver'}),roads:()=>new Promise((resolve,reject)=>fail=reject),details:async()=>{}});
    p.warm();await new Promise(setImmediate);
    assert.equal((await p.take('global')).city.name,'Seattle');
    const replacement=p.take('global');fail(Error('offline'));
    const next=await replacement;assert.equal(next.city.name,'Denver');assert.equal(next.data,null);
});
test('mode entry paths use the shared scene loader and visualizer consumes reserves',()=>{
    const src=fs.readFileSync('game.js','utf8');
    assert.match(src,/PathfindrCity\.load\(GameState.currentCity, GameState.edgeList, data\)/);
    const visualizer=src.slice(src.indexOf('async function getNextVisualizerCity()'),src.indexOf('const GamePhase ='));
    assert.match(visualizer,/getLobbyCityPreparation\(\)\.take\(mode\)/);
    assert.match(visualizer,/preparedLocationRoads\.set/);
    assert.match(src,/getLobbyCityPreparation\(\)\.take\(mode\)\.then\(\(\{city,data,scene\}\)/);
});
