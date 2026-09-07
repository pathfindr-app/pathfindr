/* Discovery/time ledger. Classic route scores never read the bonus total. */
(() => {
    const values=Object.freeze(Object.assign(Object.create(null),{burger:25,library:40,landmark:60}));
    let key=null,started=null,stopped=null,claims=new Map(),lastText='';
    const now=()=>performance.now();
    function points(items){const unique=new Map();for(const item of items||[])if(item?.key&&values[item.type])unique.set(item.key,item);return [...unique.values()].reduce((n,item)=>n+values[item.type],0);}
    function score(efficiency,collectionPoints,elapsedMs,assisted=false){
        const route=assisted?0:Math.round(Math.max(0,Math.min(100,Number(efficiency)||0))*10);
        const collection=assisted?0:Math.min(200,Math.max(0,Math.floor(Number(collectionPoints)||0)));
        const speed=assisted||!Number.isFinite(elapsedMs)||elapsedMs<=0?0:Math.round(100/(1+elapsedMs/60000));
        return {version:2,route,collection,speed,total:route+collection+speed};
    }
    function format(ms){const s=Math.floor(Math.max(0,ms)/1000);return `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`;}
    function snapshot(){return {elapsedMs:started===null?0:Math.max(0,(stopped??now())-started),collectionPoints:points([...claims.values()]),collectibles:[...claims.values()]};}
    function start(){if(key!==null&&started===null&&stopped===null)started=now();}
    function stop(){if(stopped===null)stopped=now();}
    function update(){const data=snapshot(),text=`${format(data.elapsedMs)} · ${data.collectionPoints}`;if(text===lastText)return;lastText=text;
        const clock=document.getElementById('round-clock'),count=document.getElementById('collection-points');
        if(clock)clock.textContent=format(data.elapsedMs);if(count)count.textContent=data.collectionPoints;
    }
    window.PathfindrRoundMetrics={values,points,score,format,start,stop,snapshot,update,
        begin(next){if(key===next)return;key=next;started=null;stopped=null;claims=new Map();lastText='';update();},
        claim(item){start();if(values[item.type]&&!claims.has(item.key))claims.set(item.key,{key:item.key,type:item.type,name:item.name,pos:item.pos});update();},
        clear(){key=null;started=null;stopped=null;claims=new Map();lastText='';update();}
    };
})();
