// Regenerate derived scenery only. Road identities/hashes remain immutable.
const fs=require('node:fs'),vm=require('node:vm'),crypto=require('node:crypto');
const env={window:{}};vm.createContext(env);
for(const f of ['vendor/d3-array.min.js','vendor/d3-geo.min.js','engine/world-data.js'])vm.runInContext(fs.readFileSync(f,'utf8'),env);
const manifest=JSON.parse(fs.readFileSync('data/cities/fallback/manifest.json'));
const count=world=>world.surfaces.reduce((n,s)=>n+s.rings.reduce((n,r)=>n+r.length,0),0);
for(const entry of manifest.cities){
 const file=`data/cities/fallback/${entry.id}.json`,pack=JSON.parse(fs.readFileSync(file));
 if(!pack.worldClip){
  const hash=crypto.createHash('sha256').update(JSON.stringify(pack.roads)).digest('hex');
  const nodes=new Map(pack.roads.elements.filter(e=>e.type==='node').map(e=>[e.id,{lng:e.lon,lat:e.lat}])),edges=[];
  for(const way of pack.roads.elements.filter(e=>e.type==='way'))for(let i=1;i<way.nodes.length;i++){
   const fromPos=nodes.get(way.nodes[i-1]),toPos=nodes.get(way.nodes[i]);if(fromPos&&toPos)edges.push({fromPos,toPos});
  }
  const originalPoints=count(pack.world);pack.world=env.window.PathfindrWorldData.clip(pack.world,pack.location,edges);
  pack.worldClip={version:1,originalPoints,points:count(pack.world),method:'D3 planar rectangle clip; playable road extent plus scenery margin'};
  if(crypto.createHash('sha256').update(JSON.stringify(pack.roads)).digest('hex')!==hash||hash!==pack.roadsSha256)throw Error('Road graph changed: '+entry.id);
  fs.writeFileSync(file,JSON.stringify(pack));
 }
 entry.bytes=fs.statSync(file).size;entry.sceneVersion=pack.worldClip.version;console.log(entry.id,pack.worldClip.originalPoints,pack.worldClip.points,entry.bytes);
}
fs.writeFileSync('data/cities/fallback/manifest.json',JSON.stringify(manifest,null,2));
