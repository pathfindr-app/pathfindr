/* Versioned, portable records. No accounts, renderer objects, or executable imports. */
(() => {
    const MAX_BYTES=4_000_000, MAX_CODE=5_500_000;
    const clone=x=>JSON.parse(JSON.stringify(x));
    const fail=()=>{throw Error('This is not a supported Pathfindr share.');};
    const string=(s,n=160)=>typeof s==='string'&&s.length<=n?s:fail();
    const number=(n,min,max)=>Number.isFinite(n)&&n>=min&&n<=max?n:fail();
    const point=p=>Array.isArray(p)&&p.length===2?[number(p[0],-180,180),number(p[1],-90,90)]:fail();
    const array=(a,max)=>Array.isArray(a)&&a.length<=max?a:fail();
    function pickup(p){return {key:string(p.key),type:['spark','burger','landmark'].includes(p.type)?p.type:fail(),name:string(p.name),pos:point(p.pos),collectedAt:p.collectedAt?number(p.collectedAt,0,1e14):null};}
    function validate(value){
        if(!value||value.v!==1||!['result','challenge'].includes(value.kind))fail();
        const maps=array(value.maps,5).map(m=>{
            const location={name:string(m.location.name),lng:number(m.location.lng,-180,180),lat:number(m.location.lat,-90,90),zoom:15};
            if(m.packId)return {packId:string(m.packId,60),version:string(m.version,100),location:{...location,packId:m.packId}};
            const nodes=array(m.nodes,40000).map(point),edges=array(m.edges,100000).map(e=>{
                if(!Array.isArray(e)||e.length!==2||!e.every(n=>Number.isInteger(n)&&n>=0&&n<nodes.length))fail();return [...e];
            });
            if(!nodes.length||!edges.length)fail();return {location,nodes,edges};
        });
        const rounds=array(value.rounds,5).map(r=>{
            if(!Number.isInteger(r.map)||!maps[r.map]||!['easy','medium','hard'].includes(r.difficulty))fail();
            const result={map:r.map,start:point(r.start),end:point(r.end),difficulty:r.difficulty,pickups:array(r.pickups,250).map(pickup)};
            if(value.kind==='result')Object.assign(result,{assisted:r.assisted===true,score:r.assisted===true?0:number(r.score,0,1000),userDistance:number(r.userDistance,0,10000),optimalDistance:number(r.optimalDistance,0,10000),userPath:array(r.userPath,30000).map(point),optimalPath:array(r.optimalPath,30000).map(point),collected:array(r.collected,250).map(pickup)});
            return result;
        });
        if(!rounds.length)fail();return {v:1,kind:value.kind,title:string(value.title,100),maps,rounds};
    }
    function challenge(payload){const p=clone(payload);p.kind='challenge';for(const r of p.rounds)for(const item of r.pickups)item.collectedAt=null;return validate(p);}
    async function encode(payload){
        const bytes=new TextEncoder().encode(JSON.stringify(validate(payload)));if(bytes.length>MAX_BYTES)throw Error('This run is too large to share. Try one round.');
        let data=bytes,prefix='PF1.';
        if(typeof CompressionStream!=='undefined'){data=new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(new CompressionStream('gzip'))).arrayBuffer());prefix='PF1z.';}
        let binary='';for(let i=0;i<data.length;i+=8192)binary+=String.fromCharCode(...data.subarray(i,i+8192));
        return prefix+btoa(binary).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
    }
    async function decode(input){
        let code=input.trim();if(code.length>MAX_CODE)throw Error('Share exceeds the import size limit.');
        if(code.includes('#pf='))code=code.slice(code.indexOf('#pf=')+4);
        if(!/^PF1z?\.[A-Za-z0-9_-]+$/.test(code))fail();
        const compressed=code.startsWith('PF1z.'),raw=atob(code.split('.')[1].replace(/-/g,'+').replace(/_/g,'/'));
        let bytes=Uint8Array.from(raw,c=>c.charCodeAt(0));
        if(compressed){
            if(typeof DecompressionStream==='undefined')throw Error('Open this share in an up-to-date browser.');
            const reader=new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip')).getReader();let size=0;const chunks=[];
            while(true){const {value,done}=await reader.read();if(done)break;size+=value.length;if(size>MAX_BYTES){await reader.cancel();throw Error('Share exceeds the import size limit.');}chunks.push(value);}
            bytes=new Uint8Array(size);let offset=0;for(const c of chunks){bytes.set(c,offset);offset+=c.length;}
        }
        if(bytes.length>MAX_BYTES)fail();return validate(JSON.parse(new TextDecoder().decode(bytes)));
    }
    function roads(map){
        if(map.packId){const pack=window.PathfindrCityPacks?.[map.packId];if(!pack||pack.roadsSha256!==map.version)throw Error('This challenge needs a different city-pack version. Its map cannot be substituted fairly.');return pack.roads;}
        return {elements:[...map.nodes.map((p,id)=>({type:'node',id:id+1,lon:p[0],lat:p[1]})),...map.edges.map(([a,b],id)=>({type:'way',id,nodes:[a+1,b+1]}))]};
    }
    // Check exact endpoint identity and reachability before changing the active game.
    function resolve(map,round){
        const data=roads(map),nodes=new Map(data.elements.filter(e=>e.type==='node').map(n=>[n.id,n])),adj=new Map();
        let start,end;for(const n of nodes.values()){if(Math.abs(n.lon-round.start[0])<1e-7&&Math.abs(n.lat-round.start[1])<1e-7)start=n.id;if(Math.abs(n.lon-round.end[0])<1e-7&&Math.abs(n.lat-round.end[1])<1e-7)end=n.id;}
        if(start===undefined||end===undefined||start===end)throw Error('The challenge endpoints do not match its saved road map.');
        for(const w of data.elements){if(w.type!=='way')continue;for(let i=1;i<w.nodes.length;i++){const a=w.nodes[i-1],b=w.nodes[i];if(!nodes.has(a)||!nodes.has(b))continue;if(!adj.has(a))adj.set(a,[]);if(!adj.has(b))adj.set(b,[]);adj.get(a).push(b);adj.get(b).push(a);}}
        const seen=new Set([start]),queue=[start];for(let i=0;i<queue.length&&!seen.has(end);i++)for(const n of adj.get(queue[i])||[])if(!seen.has(n)){seen.add(n);queue.push(n);}
        if(!seen.has(end))throw Error('These endpoints are not connected by the saved roads.');return {data,start,end};
    }
    window.PathfindrShareData={validate,challenge,encode,decode,resolve,clone,MAX_CODE};
})();
