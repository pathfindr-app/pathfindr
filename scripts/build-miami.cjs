// Build-time conversion only. Runtime Miami never requests OSM services.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto');
const root=path.join(__dirname,'..'),source=fs.readFileSync(path.join(root,'data/cities/miami-source.json'));
const raw=JSON.parse(source);if(raw.remark||!raw.elements?.length)throw Error('Incomplete Miami source');
const sandbox={window:{}};vm.runInNewContext(fs.readFileSync(path.join(root,'engine/world-data.js'),'utf8'),sandbox);
const world=sandbox.window.PathfindrWorldData.convert(raw);
vm.runInNewContext(fs.readFileSync(path.join(root,'engine/place-data.js'),'utf8'),sandbox);
const bounds=[-80.210,25.755,-80.175,25.797];
const inside=p=>p&&p[0]>=bounds[0]&&p[0]<=bounds[2]&&p[1]>=bounds[1]&&p[1]<=bounds[3];
const allowed=new Set(['primary','primary_link','secondary','secondary_link','tertiary','tertiary_link','residential','service','unclassified','living_street','pedestrian']);
const nodes=new Map(),ways=[],labels=sandbox.window.PathfindrPlaceData.labels(raw,bounds);
for(const e of raw.elements){
    const tags=e.tags||{},g=e.geometry;
    if(e.type==='way'&&allowed.has(tags.highway)&&tags.access!=='private'&&g?.length===e.nodes?.length){
        // Split ways at the pack boundary; never create cross-boundary shortcuts.
        let run=[];const flush=()=>{if(run.length>1)ways.push({type:'way',id:e.id,nodes:run,tags:{name:tags.name,highway:tags.highway}});run=[];};
        g.forEach((p,i)=>{if(!inside([p.lon,p.lat])){flush();return;}nodes.set(e.nodes[i],{type:'node',id:e.nodes[i],lat:p.lat,lon:p.lon});run.push(e.nodes[i]);});flush();
    }
}
const buildings={type:'FeatureCollection',features:raw.elements.filter(e=>e.type==='way'&&e.tags?.building&&e.geometry?.length>=4&&e.geometry[0].lat===e.geometry.at(-1).lat&&e.geometry[0].lon===e.geometry.at(-1).lon).slice(0,4000).map(e=>({type:'Feature',id:e.id,properties:{height:Math.min(100,Math.max(4,parseFloat(e.tags.height)||parseFloat(e.tags['building:levels'])*3.2||9))},geometry:{type:'Polygon',coordinates:[e.geometry.map(p=>[p.lon,p.lat])]}}))};
const pack={id:'miami-downtown-v1',name:'Miami · Downtown & Brickell',location:{lat:25.775,lng:-80.193,name:'Miami · Downtown & Brickell',zoom:15,packId:'miami'},bounds,attribution:'© OpenStreetMap contributors · ODbL 1.0',sourceTimestamp:raw.osm3s?.timestamp_osm_base,sourceSha256:crypto.createHash('sha256').update(source).digest('hex'),roads:{elements:[...nodes.values(),...ways]},buildings,world,labels};
pack.roadsSha256=crypto.createHash('sha256').update(JSON.stringify(pack.roads)).digest('hex');
fs.writeFileSync(path.join(root,'data/cities/miami.js'),'window.PathfindrCityPacks = {miami:'+JSON.stringify(pack)+'};\n');
console.log(`Miami: ${nodes.size} nodes, ${ways.length} ways, ${buildings.features.length} buildings, ${labels.length} labels`);
