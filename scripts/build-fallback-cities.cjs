/* Build-time public OSM acquisition; no production API credentials or writes. */
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),out=path.join(root,'data/cities/fallback');
const catalog=[
 ['new-cairo','New Cairo, Egypt',30.027,31.477,'EG',14.25],
 ['washington','Washington, DC',38.897,-77.036,'US'],['paris','Paris, France',48.8566,2.3522,'FR'],
 ['boston','Boston, MA',42.3601,-71.0589,'US'],['chicago','Chicago, IL',41.883,-87.632,'US'],
 ['new-york','New York, NY',40.735,-73.991,'US'],['seattle','Seattle, WA',47.6062,-122.3321,'US'],
 ['portland','Portland, OR',45.520,-122.676,'US'],['san-francisco','San Francisco, CA',37.785,-122.411,'US'],
 ['los-angeles','Los Angeles, CA',34.049,-118.25,'US'],['san-diego','San Diego, CA',32.717,-117.161,'US'],
 ['austin','Austin, TX',30.2672,-97.7431,'US'],['denver','Denver, CO',39.748,-104.996,'US'],
 ['philadelphia','Philadelphia, PA',39.9526,-75.1652,'US'],['savannah','Savannah, GA',32.075,-81.093,'US'],
 ['new-orleans','New Orleans, LA',29.958,-90.067,'US'],['charleston','Charleston, SC',32.782,-79.932,'US'],
 ['honolulu','Honolulu, HI',21.309,-157.858,'US'],['minneapolis','Minneapolis, MN',44.9778,-93.265,'US'],
 ['london','London, UK',51.513,-0.122,'GB'],['amsterdam','Amsterdam, Netherlands',52.37,4.895,'NL'],
 ['barcelona','Barcelona, Spain',41.391,2.164,'ES'],['lisbon','Lisbon, Portugal',38.717,-9.14,'PT'],
 ['rome','Rome, Italy',41.898,12.482,'IT'],['berlin','Berlin, Germany',52.52,13.405,'DE'],
 ['prague','Prague, Czechia',50.087,14.421,'CZ'],['copenhagen','Copenhagen, Denmark',55.676,12.568,'DK'],
 ['stockholm','Stockholm, Sweden',59.332,18.064,'SE'],['tokyo','Tokyo, Japan',35.681,139.767,'JP'],
 ['kyoto','Kyoto, Japan',35.009,135.768,'JP'],['singapore','Singapore',1.294,103.851,'SG'],
 ['sydney','Sydney, Australia',-33.871,151.208,'AU'],['melbourne','Melbourne, Australia',-37.813,144.963,'AU'],
 ['montreal','Montreal, Canada',45.507,-73.565,'CA'],['buenos-aires','Buenos Aires, Argentina',-34.604,-58.382,'AR'],
 ['cape-town','Cape Town, South Africa',-33.925,18.424,'ZA']
].map(([id,name,lat,lng,countryCode,zoom=15.4])=>({id,name,lat,lng,countryCode,zoom}));
const hash=v=>crypto.createHash('sha256').update(JSON.stringify(v)).digest('hex');
function connected(roads){
 const nodes=new Set(roads.elements.filter(e=>e.type==='node').map(e=>e.id)),adj=new Map();
 for(const e of roads.elements)if(e.type==='way')for(let i=1;i<e.nodes.length;i++){
  const a=e.nodes[i-1],b=e.nodes[i];if(!nodes.has(a)||!nodes.has(b))throw Error('Missing road node');
  if(!adj.has(a))adj.set(a,[]);if(!adj.has(b))adj.set(b,[]);adj.get(a).push(b);adj.get(b).push(a);
 }
 const seen=new Set();let largest=0;
 for(const id of adj.keys()){if(seen.has(id))continue;const stack=[id];seen.add(id);let count=0;
  while(stack.length){const n=stack.pop();count++;for(const next of adj.get(n)||[])if(!seen.has(next)){seen.add(next);stack.push(next);}}
  largest=Math.max(largest,count);
 }return {nodes:nodes.size,largestComponent:largest,ways:roads.elements.filter(e=>e.type==='way').length};
}
async function main(){
 fs.mkdirSync(out,{recursive:true});
 const provider='https://maps.mail.ru/osm/tools/overpass/api/interpreter';let sourceTimestamp=null;
 // Larger packs are built offline, not under the interactive app's 22s budget.
 const acquire=async(_url,options)=>{const body=String(options.body).replace(/timeout%3A18/g,'timeout%3A90').replace(/timeout:18/g,'timeout:90');
  const response=await fetch(provider,{...options,body,signal:AbortSignal.timeout(120000),headers:{'User-Agent':'Pathfindr city-pack builder (https://www.pathfindr.world)'}});
  return {ok:response.ok,status:response.status,json:async()=>{const raw=await response.json();sourceTimestamp=raw.osm3s?.timestamp_osm_base;return raw;}};};
 const env={fetch:acquire,AbortController,URLSearchParams,setTimeout,clearTimeout};env.window=env;vm.createContext(env);
 for(const f of ['engine/world-data.js','engine/place-data.js','engine/city-scene.js'])vm.runInContext(fs.readFileSync(path.join(root,f),'utf8'),env);
 function manifest(){const entries=[];for(const city of catalog){const file=path.join(out,city.id+'.json');if(!fs.existsSync(file))continue;
  const p=JSON.parse(fs.readFileSync(file));entries.push({...city,packId:'fallback-'+city.id,bytes:fs.statSync(file).size,roadsSha256:p.roadsSha256,stats:p.stats});}
  fs.writeFileSync(path.join(out,'manifest.json'),JSON.stringify({version:1,attribution:'© OpenStreetMap contributors · ODbL 1.0',cities:entries},null,2));return entries;
 }
 for(let pass=0;pass<3;pass++)for(const city of catalog){
  const file=path.join(out,city.id+'.json');if(fs.existsSync(file))continue;
  try{const start=Date.now(),scene=await env.PathfindrCity.prepare(city),stats=connected(scene.roads);
   if(stats.largestComponent<100||stats.ways<25)throw Error('Insufficient connected streets');
   const radius=Math.min(4800,1800*2**(15-city.zoom)),dy=radius/111320,dx=dy/Math.cos(city.lat*Math.PI/180);
   const pack={...scene,id:'fallback-'+city.id,name:city.name,location:{...city,packId:'fallback-'+city.id},
    bounds:[city.lng-dx,city.lat-dy,city.lng+dx,city.lat+dy],attribution:'© OpenStreetMap contributors · ODbL 1.0',
    source:'https://www.openstreetmap.org',provider,sourceTimestamp,acquiredAt:new Date().toISOString(),roadsSha256:hash(scene.roads),stats};
   fs.writeFileSync(file,JSON.stringify(pack));const done=manifest();console.log(JSON.stringify({city:city.id,done:done.length,ms:Date.now()-start,...stats}));
  }catch(e){console.log(JSON.stringify({city:city.id,pass,error:e.message}));}
  // Serial, paced build job. Runtime never needs to hit this provider for packs.
  await new Promise(r=>setTimeout(r,15000));
 }
 const entries=manifest();if(entries.length<30)throw Error(`Only ${entries.length} valid cities; 30 required`);
 console.log(JSON.stringify({complete:true,cities:entries.length}));
}
if(require.main===module)main().catch(e=>{console.error(e);process.exitCode=1;});
module.exports={catalog,connected};
