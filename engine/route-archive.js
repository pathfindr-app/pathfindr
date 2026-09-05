/* IndexedDB owns durable run records; the render history remains disposable. */
(() => {
    let database,queue=Promise.resolve(),current=null,mapSnapshot=null,lastRound=0;
    const memory=new Map();let error='';
    function open(){if(database)return database;database=new Promise((resolve,reject)=>{
        const request=indexedDB.open('pathfindr-route-library',1);
        request.onupgradeneeded=()=>request.result.createObjectStore('runs',{keyPath:'id'});
        request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);request.onblocked=()=>reject(Error('Close another Pathfindr tab to unlock saved routes.'));
    });return database;}
    async function write(record){memory.set(record.id,record);try{const db=await open();await new Promise((resolve,reject)=>{const tx=db.transaction('runs','readwrite');tx.objectStore('runs').put(record);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error);});error='';}catch(e){error='Storage unavailable: export this run before closing.';}
        if(record.ownerId&&record.ownerId===window.PathfindrShareCloud?.userId())try{await PathfindrShareCloud.save(record);}catch(e){error=`${error} ${e.message}`.trim();}}
    function persist(){if(!current)return;const record=PathfindrShareData.clone(current);queue=queue.then(()=>write(record));}
    function graph(data,location){
        const pack=window.PathfindrCityPacks?.[location?.packId];
        if(pack)mapSnapshot={packId:location.packId,version:pack.roadsSha256,location:{...pack.location}};
        else{const nodes=data.elements.filter(e=>e.type==='node'),index=new Map(nodes.map((n,i)=>[n.id,i]));const edges=[];
            for(const w of data.elements){if(w.type!=='way')continue;for(let i=1;i<w.nodes.length;i++)if(index.has(w.nodes[i-1])&&index.has(w.nodes[i]))edges.push([index.get(w.nodes[i-1]),index.get(w.nodes[i])]);}
            mapSnapshot={location:{name:location?.name||'Saved city',lat:location.lat,lng:location.lng},nodes:nodes.map(n=>[n.lon,n.lat]),edges};}
    }
    function begin(round){if(round===1||!current){current={id:crypto.randomUUID(),ownerId:window.PathfindrShareCloud?.userId()||null,createdAt:Date.now(),pinned:false,payload:{v:1,kind:'result',title:`${mapSnapshot?.location.name||'Pathfindr'} run`,maps:[],rounds:[]}};}lastRound=round;}
    function capture(record){if(!mapSnapshot)return;if(!current)begin(1);
        let map=current.payload.maps.findIndex(m=>JSON.stringify(m.location)===JSON.stringify(mapSnapshot.location));
        if(map<0){map=current.payload.maps.length;current.payload.maps.push(mapSnapshot);}
        current.payload.rounds[lastRound-1]={...record,map};persist();
    }
    function discoveries(items){const round=current?.payload.rounds[lastRound-1];if(!round)return;round.collected=items;persist();}
    async function list(){await queue;try{const db=await open();const saved=await new Promise((resolve,reject)=>{const r=db.transaction('runs').objectStore('runs').getAll();r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});for(const r of saved)if(!memory.has(r.id))memory.set(r.id,r);}catch{}
        try{for(const r of await window.PathfindrShareCloud?.list()||[])if(!memory.has(r.id))memory.set(r.id,r);}catch(e){error=e.message;}
        return [...memory.values()].filter(r=>!r.ownerId||r.ownerId===window.PathfindrShareCloud?.userId()).sort((a,b)=>b.createdAt-a.createdAt);}
    async function pin(id){const records=await list(),record=records.find(r=>r.id===id);if(!record)throw Error('Run not found.');record.pinned=true;record.ownerId=record.ownerId||window.PathfindrShareCloud?.userId()||null;await write(record);if(current?.id===id){current.pinned=true;current.ownerId=record.ownerId;}if(error)throw Error(error);}
    function selected(index=null){if(!current?.payload.rounds.length)throw Error('Finish a round first.');return select(current.payload,index);}
    function select(payload,index){const p=PathfindrShareData.clone(payload);if(index!==null){const r=p.rounds[index];p.maps=[p.maps[r.map]];r.map=0;p.rounds=[r];p.title=`${p.maps[0].location.name} · Round ${index+1}`;}return PathfindrShareData.validate(p);}
    window.PathfindrArchive={graph,begin,capture,discoveries,list,pin,selected,select,current:()=>current,state:()=>({error,runs:memory.size})};
})();
