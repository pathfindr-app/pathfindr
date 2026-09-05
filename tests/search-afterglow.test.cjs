const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const env={window:{}};vm.runInNewContext(fs.readFileSync('engine/search-afterglow.js','utf8'),env);const fx=env.window.PathfindrSearchAfterglow;
test('summary handoff retains nearly all search energy, then cools to a visible floor',()=>{
    assert.equal(fx.gain(0),1);assert.ok(fx.gain(120)>.97);
    let previous=1;for(let ms=0;ms<60000;ms+=16){const value=fx.gain(ms);assert.ok(value<=previous&&value>=.22);previous=value;}
    assert.ok(fx.gain(8000)>.35);assert.ok(fx.gain(60000)<.221);
});
test('cooling is frame-rate independent and reduced motion stays static',()=>{
    for(const hz of [30,60,120])assert.ok(Math.abs(fx.gain((hz*5)*(1000/hz))-fx.gain(5000))<1e-12);
    assert.equal(fx.gain(0,true),fx.gain(60000,true));
});
test('street packets stay on their segments and diminish with age',()=>{
    for(let i=0;i<24;i++)for(let t=0;t<18000;t+=137){const p=fx.packet(t,i);assert.ok(p.position>=0&&p.position<1);assert.ok(p.alpha>=0&&p.alpha<=1);}
    assert.ok(fx.packet(18000,0).alpha<fx.packet(0,0).alpha*.1);
});
test('results render live search; next-round cleanup clears its transient packet references',()=>{
    const src=fs.readFileSync('game.js','utf8');const render=src.slice(src.indexOf('renderCurrentPhaseFrame(ctx'),src.indexOf('_renderAmbientFrame(ctx, width'));
    assert.match(render,/case GamePhase.RESULTS:[\s\S]*?renderVisualization\(\{ advanceState \}\)/);
    const cleanup=src.slice(src.indexOf('function clearVisualizationState()'),src.indexOf('function clearVisualization()'));
    assert.match(cleanup,/viz.coolingEdges=\[\]/);assert.match(cleanup,/viz.edgeHeat.clear\(\)/);
});
