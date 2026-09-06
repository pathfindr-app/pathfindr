/* Personal coverage derived from saved completed routes, never animation/A* activity. */
(() => {
    const valid=p=>Array.isArray(p)&&p.length===2&&Number.isFinite(p[0])&&Number.isFinite(p[1])&&Math.abs(p[0])<=180&&Math.abs(p[1])<=90;
    const key=p=>p.map(v=>v.toFixed(6)).join(',');
    function miles(a,b){
        const rad=Math.PI/180,dLat=(b[1]-a[1])*rad,dLon=(b[0]-a[0])*rad;
        const h=Math.sin(dLat/2)**2+Math.cos(a[1]*rad)*Math.cos(b[1]*rad)*Math.sin(dLon/2)**2;
        return 3958.7613*2*Math.asin(Math.sqrt(Math.min(1,h)));
    }
    function summarize(records){
        const edges=new Set(),cities=new Set(),runs=new Set();let mapped=0,rounds=0;
        for(const run of records){
            if(!run.id||runs.has(run.id)||run.payload?.kind!=='result')continue;runs.add(run.id);
            for(const round of run.payload.rounds||[]){
                if(!round||round.assisted||!Array.isArray(round.userPath)||round.userPath.length<2||!round.userPath.every(valid))continue;
                rounds++;
                const location=run.payload.maps?.[round.map]?.location;
                if(location?.name)cities.add(location.name.trim().toLowerCase());
                for(let i=1;i<round.userPath.length;i++){
                    const a=round.userPath[i-1],b=round.userPath[i],ka=key(a),kb=key(b),id=[ka,kb].sort().join('|');
                    if(ka===kb||edges.has(id))continue;edges.add(id);mapped+=miles(a,b);
                }
            }
        }
        const target=[10,25,50,100,250,500,1000].find(n=>n>mapped)||Math.ceil((mapped+1)/1000)*1000;
        return {miles:mapped,cities:cities.size,rounds,segments:edges.size,target,percent:Math.min(100,mapped/target*100)};
    }
    let revision=0;
    async function refresh(){
        const panel=document.getElementById('mapping-progress');if(!panel||!window.PathfindrArchive)return;
        const current=++revision;
        try{
            const records=await PathfindrArchive.list({localOnly:true});if(current!==revision)return;
            const stats=summarize(records),set=(id,value)=>document.getElementById(id).textContent=value;
            set('mapped-miles',stats.miles.toLocaleString(undefined,{maximumFractionDigits:2}));
            set('mapped-cities',stats.cities.toLocaleString());set('mapped-rounds',stats.rounds.toLocaleString());
            set('mapping-milestone',`${stats.miles.toFixed(2)} / ${stats.target.toLocaleString()} mi`);
            const bar=document.getElementById('mapping-meter');bar.max=stats.target;bar.value=stats.miles;
            set('mapping-note',PathfindrArchive.state().error?'Saved progress may be incomplete: storage is unavailable.':stats.rounds?'On this device · completed, unassisted routes. Repeat segments count once.':'Your first completed route starts your atlas. Saved on this device.');
        }catch{document.getElementById('mapping-note').textContent='Could not read saved progress. Your next route is still ready to play.';}
    }
    function init(){refresh();new MutationObserver(()=>{if(!document.getElementById('splash-screen').classList.contains('hidden'))refresh();}).observe(document.getElementById('splash-screen'),{attributes:true,attributeFilter:['class','data-lobby-panel']});}
    window.PathfindrMappingProgress={summarize,refresh};
    if(typeof document!=='undefined'){if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();}
})();
