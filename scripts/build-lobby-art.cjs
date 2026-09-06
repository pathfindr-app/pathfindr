// A lightweight first-paint poster made from our actual bundled Miami geometry.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.join(__dirname,'..'),env={window:{}};
vm.runInNewContext(fs.readFileSync(path.join(root,'data/cities/miami.js'),'utf8'),env);
const pack=env.window.PathfindrCityPacks.miami,bounds=[-80.201,25.762,-80.178,25.789];
const project=p=>[(p[0]-bounds[0])/(bounds[2]-bounds[0])*720,(bounds[3]-p[1])/(bounds[3]-bounds[1])*800];
const inside=p=>p[0]>=bounds[0]&&p[0]<=bounds[2]&&p[1]>=bounds[1]&&p[1]<=bounds[3];
const line=points=>points.map((p,i)=>`${i?'L':'M'}${project(p).map(v=>v.toFixed(1)).join(',')}`).join('');
const nodes=new Map(pack.roads.elements.filter(e=>e.type==='node').map(e=>[e.id,[e.lon,e.lat]]));
const ways=pack.roads.elements.filter(e=>e.type==='way'&&e.nodes),graph=new Map();
for(const w of ways)for(let i=1;i<w.nodes.length;i++){
 const a=w.nodes[i-1],b=w.nodes[i];if(!nodes.has(a)||!nodes.has(b))continue;
 for(const [from,to] of [[a,b],[b,a]]){if(!graph.has(from))graph.set(from,[]);graph.get(from).push(to);}
}
const nearest=pos=>[...nodes.keys()].filter(id=>graph.has(id)).reduce((best,id)=>Math.hypot(...nodes.get(id).map((v,i)=>v-pos[i]))<Math.hypot(...nodes.get(best).map((v,i)=>v-pos[i]))?id:best);
function route(start,end){const a=nearest(start),b=nearest(end),queue=[a],parents=new Map([[a,null]]);
 for(let i=0;i<queue.length&&!parents.has(b);i++)for(const n of graph.get(queue[i])||[])if(!parents.has(n)){parents.set(n,queue[i]);queue.push(n);}
 if(!parents.has(b))throw Error('Lobby art route disconnected');const result=[];for(let p=b;p!==null;p=parents.get(p))result.push(nodes.get(p));return result.reverse();}
const routes=[route([-80.196,25.766],[-80.187,25.783]),route([-80.196,25.766],[-80.190,25.784])];
let svg='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 720 800"><rect width="720" height="800" fill="#111b28"/>';
for(const s of pack.world.surfaces.filter(s=>s.rings.some(r=>r.some(inside))))svg+=`<path d="${s.rings.map(r=>line(r)+'Z').join('')}" fill="${s.kind==='water'?'#153d48':'#213832'}" fill-rule="evenodd"/>`;
for(const f of pack.buildings.features){const r=f.geometry.coordinates[0];if(!r.some(inside))continue;svg+=`<path d="${line(r)}Z" fill="#67505d" opacity=".35"/>`;}
for(const w of ways){const points=w.nodes.map(id=>nodes.get(id)).filter(Boolean);if(!points.some(inside))continue;svg+=`<path d="${line(points)}" fill="none" stroke="#57717a" stroke-opacity=".38" stroke-width="${/trunk|primary|motorway/.test(w.tags?.highway)?2:1}"/>`;}
for(const [i,r] of routes.entries()){const color=i?'#61ebea':'#ffbd7d';for(const [width,opacity] of [[16,.04],[8,.12],[2,1]])svg+=`<path d="${line(r)}" fill="none" stroke="${color}" stroke-width="${width}" opacity="${opacity}" stroke-linecap="round" stroke-linejoin="round"/>`;}
svg+='</svg>';
fs.writeFileSync(path.join(root,'engine/lobby-map.svg'),svg);
fs.writeFileSync(path.join(root,'engine/lobby-map-data.js'),'window.PathfindrLobbyRoutes='+JSON.stringify(routes.map(r=>r.map(project)))+';\n');
