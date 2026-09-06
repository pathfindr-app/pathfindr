/* Curated geographic anchors. Artistic model scale/heading, not survey geometry.
 * Sources and asset ownership: LANDMARKS.md. No runtime geocoding or third-party assets. */
(() => {
    const root = new URL('../', document.currentScript.src);
    const entries = [
        ['us-capitol','U.S. Capitol',-77.009062,38.889809,230,90],
        ['white-house','White House',-77.03655,38.89770,55,180],
        ['washington-monument','Washington Monument',-77.035237,38.889463,169,0,'height'],
        ['lincoln-memorial','Lincoln Memorial',-77.050176,38.889269,60,90],
        ['jefferson-memorial','Jefferson Memorial',-77.036508,38.881387,52,0],
        ['smithsonian-castle','Smithsonian Castle',-77.026003,38.888755,130,0],
        ['national-cathedral','National Cathedral',-77.07056,38.93061,150,270],
        ['wwii-memorial','World War II Memorial',-77.040553,38.889413,100,90],
        ['vietnam-veterans-memorial','Vietnam Veterans Memorial',-77.047626,38.891112,110,135],
        ['mlk-memorial','Martin Luther King Jr. Memorial',-77.044415,38.886298,32,135]
    ].map(([assetId,name,lng,lat,meters,heading,axis='footprint']) => ({
        id:`dc-${assetId}`,assetId,type:'landmark',name,pos:[lng,lat],meters,heading,axis
    }));
    const distance=(a,b)=>Math.hypot((a[0]-b[0])*86600,(a[1]-b[1])*111320);
    function forCity(location) {
        return distance([location.lng,location.lat],[-77.0353,38.8895])<10000 ? entries : [];
    }
    function enrich(data,location) {
        const curated=forCity(location);
        if(!curated.length)return data;
        return {...data,pois:[...curated,...(data.pois||[]).filter(p=>!curated.some(c=>
            p.type==='landmark' && (p.id===c.id || distance(p.pos,c.pos)<Math.max(65,c.meters*.6))))]};
    }
    function buildings(data,location) {
        const curated=forCity(location);
        if(!curated.length)return data;
        return {...data,features:data.features.filter(f=>!curated.some(p=> {
            const polygons=f.geometry.type==='Polygon'?[f.geometry.coordinates]:f.geometry.type==='MultiPolygon'?f.geometry.coordinates:[];
            return polygons.some(rings=>PathfindrWorldData.contains(p.pos,rings[0]) && !rings.slice(1).some(r=>PathfindrWorldData.contains(p.pos,r)));
        }))};
    }
    function pickupPoint(map,item){
        const entry=entries.find(p=>item.key===`landmark:${p.id}`);
        if(!entry)return null;
        const p=map.project(item.pos),radius=entry.axis==='height'?20:entry.meters*.55;
        const lng=radius/86600,lat=radius/111320;
        // Screen-bottom of the ground footprint, including rotated cameras.
        const points=[[lng,0],[-lng,0],[0,lat],[0,-lat]].map(([x,y])=>map.project([item.pos[0]+x,item.pos[1]+y]));
        return {x:p.x,y:Math.max(p.y,...points.map(q=>q.y))+26};
    }
    // Two concurrent decodes. Ten immutable templates retained for this session;
    // instances share GPU resources and renderer teardown must not dispose them.
    const cache=new Map(),queue=[];let active=0,loaderPromise;
    function pump(){while(active<2&&queue.length){const job=queue.shift();active++;
        job().finally(()=>{active--;pump();});}}
    function load(assetId) {
        if(!entries.some(p=>p.assetId===assetId))return Promise.reject(Error('Unknown landmark asset'));
        if(cache.has(assetId))return cache.get(assetId);
        const task=new Promise((resolve,reject)=>{queue.push(async()=>{
            try {
                loaderPromise ||= import(new URL('vendor/GLTFLoader.js',root).href).catch(error=>{loaderPromise=null;throw error;});
                const {GLTFLoader}=await loaderPromise;
                const gltf=await new GLTFLoader().loadAsync(new URL(`assets/landmarks/washington-dc/models/${assetId}.glb`,root).href);
                gltf.scene.traverse(o=>{if(o.isMesh)o.userData.sharedLandmark=true;});
                resolve(gltf.scene);
            }catch(error){cache.delete(assetId);reject(error);}
        });pump();});
        cache.set(assetId,task);return task;
    }
    window.PathfindrLandmarks={entries,forCity,enrich,buildings,pickupPoint,load};
})();
