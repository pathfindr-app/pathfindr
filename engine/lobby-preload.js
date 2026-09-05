/* Two bounded first-city slots. Preparation must never mutate the active map. */
(() => {
    function create(deps){
        const slots=new Map();
        function ensure(mode){
            if(!['us','global'].includes(mode))throw Error('Unsupported lobby mode');
            let slot=slots.get(mode);
            if(slot&&(slot.pending||slot.fresh||Date.now()-slot.createdAt<15000))return slot;
            const seed=slot?.data?{city:slot.city,data:slot.data,scene:slot.scene}:deps.seed?.(mode);
            slot={mode,city:seed?.city||null,data:seed?.data||null,scene:seed?.scene,roads:'selecting',details:'waiting',createdAt:Date.now(),pending:true};slots.set(mode,slot);
            Promise.resolve().then(()=>deps.restore?.(mode)).then(saved=>{
                if(saved?.data&&!slot.fresh&&!slot.consumed){slot.city=saved.city;slot.data=saved.data;slot.scene=saved.scene;}
            }).catch(()=>{});
            slot.task=(async()=>{
                try{
                    const city=await deps.city(mode);slot.roads='loading';
                    if(!slot.data)slot.city=city;
                    const data=await deps.roads(city);
                    if(data.remark||!data.elements?.some(e=>e.type==='way'&&e.nodes?.length>1))throw Error('Incomplete roads');
                    slot.details='loading';
                    const scene=await deps.details(city);
                    // Publish atomically: never replace a complete reserve with bare roads.
                    slot.city=city;slot.data=data;slot.scene=scene;slot.fresh=true;
                    slot.roads='ready';slot.details='ready';
                    Promise.resolve().then(()=>deps.save?.(mode,{city,data,scene})).catch(()=>{});
                }catch(error){slot.roads='unavailable';slot.details='unavailable';}
                finally{slot.pending=false;}
                return {city:slot.city,data:slot.data,scene:slot.scene};
            })();return slot;
        }
        return {
            warm(){ensure('us');ensure('global');},
            async take(mode){
                const slot=ensure(mode),result=slot.data?{city:slot.city,data:slot.data,scene:slot.scene}:await slot.task;
                slot.consumed=true;
                if(!slot.pending&&slots.get(mode)===slot){slots.delete(mode);ensure(mode);}
                return result;
            },
            state:()=>Object.fromEntries([...slots].map(([mode,s])=>[mode,{city:s.city?.name||null,roads:s.data?'ready':s.roads,details:s.details,replenishing:s.pending}]))
        };
    }
    window.PathfindrLobbyPreload={create};
})();
