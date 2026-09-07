/* Two bounded first-city slots. Preparation must never mutate the active map. */
(() => {
    function create(deps){
        const slots=new Map(),restored=new Set();
        function ensure(mode){
            if(!['us','global'].includes(mode))throw Error('Unsupported lobby mode');
            let slot=slots.get(mode);
            if(slot&&(slot.pending||slot.fresh||Date.now()-slot.createdAt<15000))return slot;
            slot={mode,city:null,data:null,scene:null,roads:'selecting',details:'waiting',createdAt:Date.now(),pending:true};slots.set(mode,slot);
            const restore=!restored.has(mode);restored.add(mode);
            slot.restoration=Promise.resolve().then(()=>restore?deps.restore?.(mode):null).then(saved=>{
                if(saved?.data&&!slot.fresh&&!slot.consumed){slot.city=saved.city;slot.data=saved.data;slot.scene=saved.scene;}
                return saved;
            }).catch(()=>{});
            slot.task=(async()=>{
                let selectedCity=null;
                try{
                    const city=await deps.city(mode);selectedCity=city;slot.roads='loading';
                    if(!slot.data)slot.city=city;
                    // Start scenery beside roads, not after a long road download.
                    const scenery=Promise.resolve().then(()=>deps.details(city)).catch(()=>null);
                    const data=await deps.roads(city);
                    if(data.remark||!data.elements?.some(e=>e.type==='way'&&e.nodes?.length>1))throw Error('Incomplete roads');
                    slot.details='loading';
                    const scene=await scenery;
                    // Publish atomically: never replace a complete reserve with bare roads.
                    slot.city=city;slot.data=data;slot.scene=scene;slot.fresh=true;
                    slot.consumed=false;slot.roads='ready';slot.details=scene?'ready':'unavailable';
                    Promise.resolve().then(()=>deps.save?.(mode,{city,data,scene})).catch(()=>{});
                }catch(error){if(slot.consumed||!slot.data)slot.city=selectedCity;slot.roads='unavailable';slot.details='unavailable';}
                finally{slot.pending=false;}
                return {city:slot.city,data:slot.data,scene:slot.scene};
            })();return slot;
        }
        return {
            warm(){ensure('us');ensure('global');},
            async take(mode){
                const slot=ensure(mode),result=slot.data?{city:slot.city,data:slot.data,scene:slot.scene}:await Promise.race([
                    slot.task,slot.restoration.then(saved=>saved?.data&&!slot.consumed?saved:slot.task)
                ]);
                slot.consumed=true;
                // A restored reserve is single-use, even while its replacement is loading.
                slot.data=null;slot.scene=null;slot.fresh=false;
                if(!slot.pending&&slots.get(mode)===slot){slots.delete(mode);ensure(mode);}
                return result;
            },
            state:()=>Object.fromEntries([...slots].map(([mode,s])=>[mode,{city:s.city?.name||null,roads:s.data?'ready':s.roads,details:s.scene?'ready':s.details,replenishing:s.pending}]))
        };
    }
    window.PathfindrLobbyPreload={create};
})();
