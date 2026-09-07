const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),crypto=require('node:crypto');
const {connected}=require('../scripts/build-fallback-cities.cjs');
test('packaged fallback library has at least 30 distinct real connected OSM cities',()=>{
 const manifest=JSON.parse(fs.readFileSync('data/cities/fallback/manifest.json'));
 assert.ok(manifest.cities.length>=30&&manifest.cities.length<=50);
 assert.equal(new Set(manifest.cities.map(c=>`${c.lat},${c.lng}`)).size,manifest.cities.length);
 for(const entry of manifest.cities){
  const bytes=fs.readFileSync(`data/cities/fallback/${entry.id}.json`),pack=JSON.parse(bytes);
  assert.equal(bytes.length,entry.bytes);assert.ok(bytes.length<20*1024*1024,`${entry.id} exceeds pack budget`);
  assert.equal(crypto.createHash('sha256').update(JSON.stringify(pack.roads)).digest('hex'),entry.roadsSha256);
  assert.ok(connected(pack.roads).largestComponent>=100);assert.equal(pack.location.packId,entry.packId);
  assert.ok(pack.sourceTimestamp&&pack.attribution.includes('OpenStreetMap'));
  assert.ok(pack.buildings&&pack.world&&pack.labels);
 }
});
function runtime(){
 const catalog=JSON.parse(fs.readFileSync('data/cities/fallback/manifest.json')).cities;
 const window={PathfindrFallbackCatalog:catalog,PathfindrCityPacks:{}};
 for(const id of ['washington','paris'])window.PathfindrCityPacks['fallback-'+id]=JSON.parse(fs.readFileSync(`data/cities/fallback/${id}.json`));
 let requests=0;
 vm.runInNewContext(fs.readFileSync('engine/fallback-cities.js','utf8'),{window,AbortSignal,fetch:async()=>{requests++;throw Error('disconnected');}});
 return {api:window.PathfindrFallbackCities,requests:()=>requests};
}
test('US and global start from complete local scenes even when all fetches fail',async()=>{
 const {api}=runtime(),us=await api.take('us'),global=await api.take('global');
 assert.equal(us.city.countryCode,'US');assert.notEqual(global.city.countryCode,'US');
 assert.equal(us.scene.location.name,us.city.name);assert.equal(global.scene.location.name,global.city.name);
 assert.ok(us.data.elements.length>100);assert.ok(global.data.elements.length>100);
});
test('authored challenges match exact location only, never a nearest-city substitute',()=>{
 const {api}=runtime();assert.equal(api.match({lat:0,lng:0}),undefined);
 assert.equal(api.match({lat:38.897,lng:-77.036}).id,'washington');
});
