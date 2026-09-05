(() => {
    let edges=[],junctions=new Map();
    window.PathfindrRoadMotion={
        build(network,distance){edges=network;junctions=new Map();
            edges.forEach((e,i)=>{e.motionMeters=Math.max(0.1,distance(e.fromPos.lat,e.fromPos.lng,e.toPos.lat,e.toPos.lng)*1000);
                for(const [node,reverse] of [[e.from,false],[e.to,true]]){if(!junctions.has(node))junctions.set(node,[]);junctions.get(node).push({index:i,reverse});}});
        },
        advance(p,seconds,random=Math.random){
            let budget=Math.min(0.1,Math.max(0,seconds))*p.speed;
            for(let transitions=0;transitions<16;transitions++){
                const edge=edges[p.edgeIndex];if(!edge){p.active=false;return;}
                const remaining=(1-p.edgeProgress)*edge.motionMeters;
                if(budget<remaining){p.edgeProgress+=budget/edge.motionMeters;return;}
                budget-=remaining;const end=p.reverse?edge.from:edge.to;
                const options=(junctions.get(end)||[]).filter(e=>e.index!==p.edgeIndex);
                const next=options[Math.floor(random()*options.length)];
                if(!next){p.reverse=!p.reverse;p.edgeProgress=0;continue;}
                p.edgeIndex=next.index;p.reverse=next.reverse;p.edgeProgress=0;
            }
        }
    };
})();
