/* Forgiving input, not score correction: retain topology and require turn intent. */
(() => {
    function allows(tail,candidate,pointer,touch=false){
        if(tail.length<2||candidate.length<2)return true;
        const head=tail.at(-1);let previous=head,length=0,origin=head;
        for(let i=tail.length-2;i>=0;i--){const p=tail[i];length+=Math.hypot(previous.x-p.x,previous.y-p.y);origin=p;previous=p;if(length>=24)break;}
        const dx=head.x-origin.x,dy=head.y-origin.y,n=Math.hypot(dx,dy);
        if(n<8)return true;
        const lateral=Math.abs((pointer.x-head.x)*dy-(pointer.y-head.y)*dx)/n;
        if(lateral>=(touch?16:12))return true; // Deliberate turns always unlock.
        // Ignore tiny segments caused by dense virtual nodes, not actual corners.
        const end=candidate.at(-1);let a=candidate[0];
        for(let i=candidate.length-2;i>=0;i--){a=candidate[i];if(Math.hypot(end.x-a.x,end.y-a.y)>=6)break;}
        const vx=end.x-a.x,vy=end.y-a.y,m=Math.hypot(vx,vy);
        if(m<3)return true;
        const alignment=(vx*dx+vy*dy)/(m*n);
        return alignment>.55; // Small drift can't select a side branch or reversal.
    }
    function finishPath({start,end,edges,nodes,project,pointer,distance,touch=false}){
        const a=nodes.get(start),b=nodes.get(end);if(!a||!b||!pointer)return null;
        const ap=project(a),bp=project(b),radius=touch?56:42;
        if(Math.hypot(pointer.x-bp.x,pointer.y-bp.y)>radius||Math.hypot(ap.x-bp.x,ap.y-bp.y)>radius*1.4)return null;
        if(start===end)return [start];
        const direct=distance(a,b);if(direct>0.06)return null;
        const budget=Math.min(.08,Math.max(.018,direct*1.6));
        const costs=new Map([[start,0]]),parents=new Map(),open=new Set([start]);
        for(let visit=0;open.size&&visit<160;visit++){
            let current=null,cost=Infinity;
            for(const id of open)if(costs.get(id)<cost){current=id;cost=costs.get(id);}
            open.delete(current);
            if(current===end){const path=[end];while(parents.has(path[0]))path.unshift(parents.get(path[0]));return path;}
            for(const {neighbor,weight} of edges.get(current)||[]){
                const next=cost+weight;
                if(!Number.isFinite(weight)||weight<0||next>budget||next>=(costs.get(neighbor)??Infinity))continue;
                costs.set(neighbor,next);parents.set(neighbor,current);open.add(neighbor);
            }
        }
        return null;
    }
    window.PathfindrTraceGuide={allows,finishPath};
})();
