const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
test('Miami coastal water fills the bay but excludes parks and islands',()=>{
 const env={window:{}};vm.runInNewContext(fs.readFileSync('engine/world-data.js','utf8'),env);
 const data=JSON.parse(fs.readFileSync('data/cities/miami-coastal-water.json','utf8'));
 const polys=data.geometry.type==='Polygon'?[data.geometry.coordinates]:data.geometry.coordinates;
 const inside=p=>polys.some(rings=>env.window.PathfindrWorldData.contains(p,rings[0])&&!rings.slice(1).some(r=>env.window.PathfindrWorldData.contains(p,r)));
 assert.equal(inside([-80.181,25.773]),true);
 assert.equal(inside([-80.1865,25.775]),false);
 assert.equal(inside([-80.186,25.766]),false);
 assert.equal(inside([-80.19,25.766]),false);
 for(const rings of polys)for(const r of rings){assert.deepEqual(r[0],r.at(-1));assert.ok(r.length>=4);}
});
test('packed coastline is tidal and leaves route graph identity intact',()=>{
 const env={window:{}};vm.runInNewContext(fs.readFileSync('data/cities/miami.js','utf8'),env);
 const pack=env.window.PathfindrCityPacks.miami,coast=pack.world.surfaces.filter(s=>s.id.startsWith('miami-coast/'));
 assert.ok(coast.length);assert.ok(coast.every(s=>s.tags.tidal==='yes'&&s.kind==='water'));
 assert.equal(pack.roads.elements.filter(e=>e.type==='node').length,14619);
});
