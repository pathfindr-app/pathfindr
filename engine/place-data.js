/* Shared name extraction for downloaded scenes and offline city packs. */
(() => {
    function labels(data,bounds=null){
        const result=[],seen=new Set(),elements=(data.elements||[]).slice(0,30000);
        const nodes=new Map(elements.filter(e=>e.type==='node').map(e=>[e.id,[e.lon,e.lat]]));
        for(const e of elements){
            const t=e.tags||{};if(!t.name)continue;
            const type=['suburb','neighbourhood','quarter','city_district'].includes(t.place)?'district':
                t.waterway||['water','bay','strait'].includes(t.natural)?'water':
                ['park','garden','golf_course'].includes(t.leisure)?'park':t.highway?'street':null;
            if(!type||seen.has(type+t.name))continue;
            const g=e.geometry||e.members?.find(m=>m.role!=='inner'&&m.geometry?.length)?.geometry;
            const mid=g?.[Math.floor(g.length/2)];
            const p=e.type==='node'?[e.lon,e.lat]:e.center?[e.center.lon,e.center.lat]:mid?[mid.lon,mid.lat]:nodes.get(e.nodes?.[Math.floor(e.nodes.length/2)]);
            if(!p?.every(Number.isFinite)||bounds&&(p[0]<bounds[0]||p[0]>bounds[2]||p[1]<bounds[1]||p[1]>bounds[3]))continue;
            seen.add(type+t.name);result.push({name:String(t.name).slice(0,120),type,pos:p});
        }
        const priority={district:0,water:1,park:2,street:3};
        return result.sort((a,b)=>priority[a.type]-priority[b.type]).slice(0,300);
    }
    window.PathfindrPlaceData={labels};
})();
