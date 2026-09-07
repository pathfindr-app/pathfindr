/* Same-origin, versioned OSM packs. Random fallback never mislabels a city. */
(() => {
    const pending=new Map(),recent={us:[],global:[]};let cursor={us:0,global:0};
    const catalog=()=>window.PathfindrFallbackCatalog||[];
    const modeCities=mode=>catalog().filter(c=>mode==='us'?c.countryCode==='US':c.countryCode!=='US');
    const registered=()=>window.PathfindrCityPacks ||= {};
    function load(id){
        const entry=catalog().find(c=>c.id===id||c.packId===id);if(!entry)return Promise.reject(Error('Unknown offline city'));
        if(registered()[entry.packId])return Promise.resolve(registered()[entry.packId]);
        if(pending.has(entry.id))return pending.get(entry.id);
        const task=fetch(`data/cities/fallback/${entry.id}.json?v=${entry.roadsSha256.slice(0,12)}`,{signal:AbortSignal.timeout(6000)})
            .then(r=>{if(!r.ok)throw Error('City pack unavailable');return r.json();})
            .then(pack=>{if(pack.roadsSha256!==entry.roadsSha256||!pack.roads?.elements?.length||!pack.world||!pack.buildings)throw Error('Invalid city pack');
                registered()[entry.packId]=pack;
                const dynamic=Object.keys(registered()).filter(k=>k.startsWith('fallback-')&&!['fallback-washington','fallback-paris'].includes(k));
                while(dynamic.length>6)delete registered()[dynamic.shift()];return pack;})
            .finally(()=>pending.delete(entry.id));
        pending.set(entry.id,task);return task;
    }
    function warm(mode){const list=modeCities(mode);if(!list.length)return;
        for(let i=0;i<2;i++){const entry=list[(cursor[mode]++)%list.length];void load(entry.id).catch(()=>{});}}
    async function take(mode='us',exclude){
        mode=mode==='global'?'global':'us';const list=modeCities(mode);
        const available=list.filter(c=>registered()[c.packId]&&c.name!==exclude);
        const unseen=available.filter(c=>!recent[mode].includes(c.id));
        const pool=unseen.length?unseen:available.length?available:list.filter(c=>registered()[c.packId]);
        const selected=pool[Math.floor(Math.random()*pool.length)]||list[0];
        if(!selected)throw Error('Offline city library not installed');
        const pack=await load(selected.id);recent[mode]=[...recent[mode].slice(-5),selected.id];warm(mode);
        return {city:{...pack.location},data:pack.roads,scene:pack};
    }
    window.PathfindrFallbackCities={load,take,warm:()=>{warm('us');warm('global');},catalog,
        // Exact identity only for authored/shared challenges; never swap city silently.
        match:location=>catalog().find(c=>Math.abs(c.lat-location.lat)<.0001&&Math.abs(c.lng-location.lng)<.0001),
        state:()=>({cities:catalog().length,ready:Object.keys(registered()).filter(k=>k.startsWith('fallback-')).length,pending:pending.size})};
})();
