const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const env={window:{}};vm.createContext(env);
for(const file of ['vendor/d3-array.min.js','vendor/d3-geo.min.js','engine/world-data.js'])vm.runInContext(fs.readFileSync(file,'utf8'),env);
const {clip,clipSurface,contains}=env.window.PathfindrWorldData;
const box=(x0,y0,x1,y1)=>[[x0,y0],[x1,y0],[x1,y1],[x0,y1],[x0,y0]];
const wet=(p,surfaces)=>surfaces.some(s=>contains(p,s.rings[0])&&!s.rings.slice(1).some(r=>contains(p,r)));
test('clipping a surrounding sea preserves local water and its island hole',()=>{
 const surface={kind:'water',tags:{},rings:[box(-100,-100,100,100),box(-1,-1,1,1)]};
 const result=clipSurface(surface,[-2,-2,2,2]);assert.ok(wet([1.5,0],result));assert.equal(wet([0,0],result),false);
 assert.ok(result.flatMap(s=>s.rings.flat()).every(([x,y])=>Math.abs(x)<=2&&Math.abs(y)<=2));
 assert.equal(surface.rings[0][0][0],-100);
});
test('clipping concave coastline preserves disconnected arms rather than bridging land',()=>{
 const shape={kind:'water',tags:{},rings:[[[-3,-3],[3,-3],[3,3],[1,3],[1,-1],[-1,-1],[-1,3],[-3,3],[-3,-3]]]};
 const result=clipSurface(shape,[-2,0,2,2]);assert.ok(wet([-1.5,1],result));assert.ok(wet([1.5,1],result));assert.equal(wet([0,1],result),false);
});
test('Boston sea relation is bounded before triangulation, without changing the road graph',()=>{
 const pack=JSON.parse(fs.readFileSync('data/cities/fallback/boston.json')),before=JSON.stringify(pack.roads);
 const raw=pack.world.surfaces.reduce((n,s)=>n+s.rings.reduce((a,r)=>a+r.length,0),0);
 const bounded=clip(pack.world,pack.location),after=bounded.surfaces.reduce((n,s)=>n+s.rings.reduce((a,r)=>a+r.length,0),0);
 assert.ok((pack.worldClip?.originalPoints||raw)>400000);assert.ok(after<20000,`still ${after} points`);assert.ok(after>1000,'coastline detail lost');
 assert.equal(JSON.stringify(pack.roads),before);assert.ok(wet([-71.03,42.36],bounded.surfaces.filter(s=>s.kind==='water')));
});
test('a huge off-city ring clips to a small local surface before triangulation',()=>{
 const ring=[];for(let i=0;i<50000;i++){const a=i/50000*Math.PI*2;ring.push([100*Math.cos(a),100*Math.sin(a)]);}ring.push(ring[0]);
 const result=clipSurface({kind:'water',tags:{},rings:[ring]},[-1,-1,1,1]);
 assert.ok(wet([0,0],result));assert.ok(result.reduce((n,s)=>n+s.rings.reduce((n,r)=>n+r.length,0),0)<20);
});
