/* Bounded OSM JSON conversion. Never parses XML or executes provider text. */
(() => {
    const point = p => [p.lon, p.lat];
    const equal = (a,b) => a && b && a[0] === b[0] && a[1] === b[1];
    function join(parts) {
        const remaining = parts.map(p => p.slice()), rings = [];
        while (remaining.length) {
            let ring = remaining.pop(), changed = true;
            while (!equal(ring[0],ring.at(-1)) && changed) {
                changed = false;
                for (let i=0;i<remaining.length;i++) {
                    const next = remaining[i];
                    if (equal(ring.at(-1),next[0])) ring.push(...next.slice(1));
                    else if (equal(ring.at(-1),next.at(-1))) ring.push(...next.slice(0,-1).reverse());
                    else if (equal(ring[0],next.at(-1))) ring = [...next.slice(0,-1),...ring];
                    else if (equal(ring[0],next[0])) ring = [...next.slice(1).reverse(),...ring];
                    else continue;
                    remaining.splice(i,1); changed=true; break;
                }
            }
            if (ring.length>=4 && equal(ring[0],ring.at(-1))) rings.push(ring);
        }
        return rings;
    }
    function contains(p, ring) {
        let inside=false;
        for(let i=0,j=ring.length-1;i<ring.length;j=i++) {
            const a=ring[i],b=ring[j];
            if ((a[1]>p[1]) !== (b[1]>p[1]) && p[0] < (b[0]-a[0])*(p[1]-a[1])/(b[1]-a[1])+a[0]) inside=!inside;
        }
        return inside;
    }
    function kind(tags) {
        if (['water','bay','strait'].includes(tags.natural) || tags.waterway==='riverbank' || tags.landuse==='reservoir') return 'water';
        if (tags.natural==='wood' || tags.landuse==='forest') return 'forest';
        if (['park','garden','recreation_ground','golf_course'].includes(tags.leisure) || ['grass','meadow','village_green'].includes(tags.landuse)) return 'park';
        return null;
    }
    function convert(data) {
        const surfaces=[], flows=[], pois=[], trees=[], used=new Set();
        const elements=(data.elements||[]).slice(0,20000);
        for(const e of elements) {
            const tags=e.tags||{}, type=kind(tags);
            if(e.type==='relation' && type) {
                const members=(e.members||[]).filter(m=>m.type==='way' && m.geometry?.length>1);
                const outer=join(members.filter(m=>m.role!=='inner').map(m=>m.geometry.map(point)));
                const inner=join(members.filter(m=>m.role==='inner').map(m=>m.geometry.map(point)));
                for(const ring of outer) surfaces.push({id:`relation/${e.id}`,kind:type,tags,rings:[ring,...inner.filter(h=>contains(h[0],ring))]});
                if(outer.length) members.forEach(m=>used.add(m.ref));
            }
        }
        for(const e of elements) {
            const tags=e.tags||{}, type=kind(tags), geometry=e.geometry?.map(point);
            if(e.type==='way' && !used.has(e.id) && type && geometry?.length>=4 && equal(geometry[0],geometry.at(-1))) surfaces.push({id:`way/${e.id}`,kind:type,tags,rings:[geometry]});
            if(e.type==='way' && ['river','stream','canal'].includes(tags.waterway) && tags.tidal!=='yes' && geometry?.length>1) flows.push({points:geometry,id:e.id});
            const pos = e.type==='node' ? [e.lon,e.lat] : e.center ? [e.center.lon,e.center.lat] : geometry?.[0];
            if(!pos || !pos.every(Number.isFinite)) continue;
            if(tags.natural==='tree') trees.push({pos,tags,id:e.id});
            const burger=(tags.cuisine||'').split(';').map(s=>s.trim()).includes('burger') && ['fast_food','restaurant'].includes(tags.amenity);
            const landmark=tags.historic==='monument' || tags.tourism==='attraction' && /tower|monument/i.test(tags.name||'');
            if(burger || landmark) pois.push({id:`${e.type}/${e.id}`,pos,type:burger?'burger':'landmark',name:String(tags.name|| (burger?'Burger stop':'Monument')).slice(0,100),tags});
        }
        return {surfaces:surfaces.slice(0,450),flows:flows.slice(0,200),pois:pois.slice(0,120),trees:trees.slice(0,600)};
    }
    window.PathfindrWorldData={convert,contains,join};
})();
