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
            const library=tags.amenity==='library';
            if(burger || landmark || library) pois.push({id:`${e.type}/${e.id}`,pos,type:library?'library':burger?'burger':'landmark',name:String(tags.name|| (library?'Library':burger?'Burger stop':'Monument')).slice(0,100),tags});
        }
        return {surfaces:surfaces.slice(0,450),flows:flows.slice(0,200),pois:pois.slice(0,120),trees:trees.slice(0,600)};
    }
    // OSM relations may describe an entire sea even when queried around a city.
    // Clip before triangulation. D3's planar stream rejoins split concave rings;
    // sorting by containment then restores separate exteriors and island holes.
    const signedArea=ring=>{let area=0;for(let i=1;i<ring.length;i++)area+=ring[i-1][0]*ring[i][1]-ring[i][0]*ring[i-1][1];return area/2;};
    function clipSurface(surface,bounds){
        const output=[];let ring;
        const sink={polygonStart(){},polygonEnd(){},lineStart(){ring=[];},point(x,y){ring.push([x,y]);},lineEnd(){
            if(ring.length<3)return;if(!equal(ring[0],ring.at(-1)))ring.push(ring[0].slice());
            if(Math.abs(signedArea(ring))>1e-14)output.push(ring);
        }};
        const stream=d3.geoClipRectangle(...bounds)(sink);stream.polygonStart();
        surface.rings.forEach((input,index)=>{
            // Exterior clockwise, holes counterclockwise in planar coordinates.
            const points=(signedArea(input)>0)===(index===0)?input.slice().reverse():input;
            stream.lineStart();const end=equal(points[0],points.at(-1))?points.length-1:points.length;
            for(let i=0;i<end;i++)stream.point(points[i][0],points[i][1]);stream.lineEnd();
        });stream.polygonEnd();
        const rings=output.map(points=>({points,area:Math.abs(signedArea(points)),parent:null,depth:0})).sort((a,b)=>b.area-a.area);
        const result=[];
        for(let i=0;i<rings.length;i++){
            const current=rings[i];
            for(let j=i-1;j>=0;j--)if(contains(current.points[0],rings[j].points)){current.parent=rings[j];current.depth=rings[j].depth+1;break;}
            if(current.depth%2===0){current.surface={...surface,rings:[current.points]};result.push(current.surface);}
            else current.parent.surface.rings.push(current.points);
        }
        return result;
    }
    function clip(data,location,edges=[]){
        const radius=Math.max(3000,2700*Math.pow(2,15-(location.zoom||15))),dy=radius/111320,dx=dy/Math.max(.1,Math.cos(location.lat*Math.PI/180));
        const bounds=[location.lng-dx,location.lat-dy,location.lng+dx,location.lat+dy];
        for(const edge of edges)for(const p of [edge.fromPos,edge.toPos]){
            bounds[0]=Math.min(bounds[0],p.lng-dx*.15);bounds[1]=Math.min(bounds[1],p.lat-dy*.15);
            bounds[2]=Math.max(bounds[2],p.lng+dx*.15);bounds[3]=Math.max(bounds[3],p.lat+dy*.15);
        }
        return {...data,surfaces:data.surfaces.flatMap(surface=>clipSurface(surface,bounds))};
    }
    window.PathfindrWorldData={convert,contains,join,clip,clipSurface};
})();
