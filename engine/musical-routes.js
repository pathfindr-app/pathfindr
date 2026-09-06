/* Distance-parametrized musical charges. No new clock, context or per-node timers. */
(() => {
    const caches=new Map();
    function metric(points,key){
        let entry=caches.get(key);
        if(entry&&entry.points.length===points.length&&points.every((p,i)=>p.x===entry.points[i].x&&p.y===entry.points[i].y))return entry;
        const distances=[0];for(let i=1;i<points.length;i++)distances.push(distances[i-1]+Math.hypot(points[i].x-points[i-1].x,points[i].y-points[i-1].y));
        entry={points:points.map(p=>({x:p.x,y:p.y})),distances,total:distances.at(-1)};
        if(caches.size>=20)caches.delete(caches.keys().next().value);caches.set(key,entry);return entry;
    }
    function locate(m,t){
        const d=Math.max(0,Math.min(1,t))*m.total;let lo=0,hi=m.distances.length-1;
        while(lo<hi){const mid=(lo+hi)>>1;if(m.distances[mid]<d)lo=mid+1;else hi=mid;}
        const i=Math.max(1,lo),a=m.points[i-1],b=m.points[i],f=(d-m.distances[i-1])/(m.distances[i]-m.distances[i-1]||1);
        return {x:a.x+(b.x-a.x)*f,y:a.y+(b.y-a.y)*f,index:i};
    }
    function range(ctx,m,a,b){
        if(b<=0||a>=1||a>=b)return false;
        const start=locate(m,a),end=locate(m,b);ctx.beginPath();ctx.moveTo(start.x,start.y);
        for(let i=start.index;i<end.index;i++)ctx.lineTo(m.points[i].x,m.points[i].y);
        ctx.lineTo(end.x,end.y);return true;
    }
    function profile(age){return {head:age*.42,gain:Math.exp(-age/2.1)};}
    function historyEnergy(audio){
        if(!audio?.active)return 0;
        let attack=0;for(const p of audio.packets){const age=Math.max(0,audio.musicTime-p.time);attack=Math.max(attack,p.strength*(1-Math.exp(-age/.07))*Math.exp(-age/.42));}
        return Math.min(1,audio.bass*.55+attack*.65);
    }
    function historyIntensity(base,dim,audio,count=1,searching=false){
        return Math.min(.9,base*dim+historyEnergy(audio)*(searching?.22:.55)/Math.sqrt(Math.max(1,count)));
    }
    function draw(ctx,points,color,key='route',focusTip=false,boost=1){
        const audio=window.PathfindrAudio?.state;
        if(!audio?.active||!points||points.length<2)return;
        const m=metric(points,key);if(m.total<2)return;
        const rgb=`${color.r},${color.g},${color.b}`;
        const hot=[color.r,color.g,color.b].map(c=>Math.round(c+(255-c)*.65)).join(',');
        ctx.save();ctx.shadowBlur=0;ctx.globalCompositeOperation='source-over';ctx.setLineDash([]);ctx.lineCap='round';ctx.lineJoin='round';
        for(const packet of audio.packets){
            const age=audio.musicTime-packet.time;if(age<0)continue;
            const {head,gain}=profile(age),strength=Math.min(1.2,packet.strength*gain*boost);
            // While drawing, charge the final portion leading into the user's tip.
            const shift=focusTip?.65:0,scale=focusTip?.35:1;
            const widths=packet.kind===0?[18,8,2.5]:[12,5,1.5];
            const spans=[.32,.14,.045],alphas=[.10,.28,.75];
            for(let layer=0;layer<3;layer++)if(range(ctx,m,shift+(head-spans[layer])*scale,shift+head*scale)){
                ctx.lineWidth=widths[layer];ctx.strokeStyle=`rgba(${layer===2?hot:rgb},${alphas[layer]*strength})`;ctx.stroke();
            }
            if(head>=0&&head<=1){const p=locate(m,shift+head*scale);ctx.fillStyle=`rgba(${hot},${strength*.85})`;ctx.beginPath();ctx.arc(p.x,p.y,packet.kind===0?2.8:1.8,0,Math.PI*2);ctx.fill();}
            if(packet.kind===2&&head>=0&&head<=1){const p=locate(m,shift+head*scale);ctx.strokeStyle=`rgba(${rgb},${strength*.8})`;ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(p.x-3,p.y);ctx.lineTo(p.x+3,p.y);ctx.moveTo(p.x,p.y-3);ctx.lineTo(p.x,p.y+3);ctx.stroke();}
        }
        ctx.restore();
    }
    function tree(parents,root,nodes,distance){
        const children=new Map();for(const [child,parent] of parents){if(!children.has(parent))children.set(parent,[]);children.get(parent).push(child);}
        const queue=[{id:root,d:0,gain:1}],seen=new Set([root]),segments=[];let max=0;
        for(let i=0;i<queue.length;i++){
            const node=queue[i],next=children.get(node.id)||[],gain=node.gain/Math.sqrt(Math.max(1,next.length));
            for(const id of next){if(seen.has(id))continue;seen.add(id);const a=nodes.get(node.id),b=nodes.get(id);if(!a||!b)continue;
                const d=node.d+distance(a.lat,a.lng,b.lat,b.lng);max=Math.max(max,d);
                segments.push({from:node.id,to:id,a,b,start:node.d,end:d,gain});queue.push({id,d,gain});
            }
        }
        // Bound rendering work without affecting the algorithm or its search result.
        const stride=Math.max(1,Math.ceil(segments.length/360));return {max,segments:segments.filter((_,i)=>i%stride===0)};
    }
    function network(ctx,tree,map,visible,color,cooling=1,budget=360){
        const audio=window.PathfindrAudio?.state;if(!audio?.active||!tree?.max||!audio.packets.length)return;
        const groups=[[],[],[]];
        const stride=Math.max(1,Math.ceil(tree.segments.length/Math.max(1,budget)));
        for(let index=0;index<tree.segments.length;index+=stride){const e=tree.segments[index];if(!visible(e.from,e.to))continue;
            let heat=0;for(const p of audio.packets){const arrival=audio.musicTime-p.time-e.start/tree.max*2.1;if(arrival>=0)heat+=p.strength*Math.exp(-arrival/.7)*e.gain;}
            heat=Math.min(.8,heat)*cooling;if(heat<.025)continue;
            const a=map.project([e.a.lng,e.a.lat]),b=map.project([e.b.lng,e.b.lat]);
            if(Math.hypot(a.x-b.x,a.y-b.y)>3000)continue;
            groups[heat>.35?2:heat>.12?1:0].push({a,b});
        }
        ctx.save();ctx.shadowBlur=0;ctx.globalCompositeOperation='source-over';ctx.setLineDash([]);ctx.lineCap='round';
        const rgb=`${color.r},${color.g},${color.b}`;
        for(let i=0;i<3;i++)for(const [width,alpha] of [[11,.04],[4,.15],[1,.38]]){
            if(!groups[i].length)continue;
            ctx.beginPath();for(const {a,b} of groups[i]){ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);}ctx.lineWidth=width;ctx.strokeStyle=`rgba(${rgb},${alpha*(i+1)/3})`;ctx.stroke();
        }
        ctx.restore();
    }
    window.PathfindrMusicalRoutes={draw,tree,network,profile,metric,locate,historyEnergy,historyIntensity};
})();
