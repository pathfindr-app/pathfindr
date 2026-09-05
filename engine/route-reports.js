/* Bounded, retryable map diagnostics. No account ID, GPS, email or full trail. */
(() => {
    const key='pathfindr-route-reports-v1';let busy=false,queue=[];
    try{queue=JSON.parse(localStorage.getItem(key)||'[]');if(!Array.isArray(queue))queue=[];}catch{}
    const persist=()=>{try{localStorage.setItem(key,JSON.stringify(queue.slice(-30)));}catch{}};
    const point=p=>p&&Number.isFinite(p.lat)&&Number.isFinite(p.lng)?{lat:+p.lat.toFixed(5),lng:+p.lng.toFixed(5)}:null;
    async function flush(){
        if(busy||!queue.length||typeof PathfindrAuth==='undefined'||!PathfindrAuth.client||window.ytgame)return;
        busy=true;
        try{
            const batch=queue.slice(0,10);
            const {error}=await PathfindrAuth.client.rpc('report_route_issues',{reports:batch});
            if(!error){const ids=new Set(batch.map(r=>r.id));queue=queue.filter(r=>!ids.has(r.id));persist();}
        }catch{}finally{busy=false;}
    }
    window.PathfindrRouteReports={record(data){
        const report={id:crypto.randomUUID(),build:String(data.build).slice(0,80),city:String(data.city).slice(0,120),mode:String(data.mode).slice(0,30),input:data.input==='trace'?'trace':'tap',zoom:+Number(data.zoom).toFixed(2),anchor:point(data.anchor),end:point(data.end),reason:data.reason,createdAt:new Date().toISOString()};
        queue.push(report);queue=queue.slice(-30);persist();void flush();
    },flush,pending:()=>queue.length};
    setInterval(flush,60000);addEventListener('online',flush);
})();
