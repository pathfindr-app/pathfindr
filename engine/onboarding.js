/* An isolated practice street grid. Never writes game routes, scores or purchases. */
(() => {
    const nodes=[[35,135],[115,135],[115,55],[215,55],[295,55],[215,135],[295,135]];
    const edges=[[0,1],[1,2],[2,3],[3,4],[1,5],[5,6],[6,4],[3,5]];
    let path=[0],dragging=false;
    function init(){
        const root=document.querySelector('#instructions-overlay .instructions');if(!root)return;
        const start=document.getElementById('start-game-btn');
        root.replaceChildren();root.classList.add('route-primer');
        const title=document.createElement('h2');title.textContent='Trust your street instinct.';
        const lead=document.createElement('p');lead.textContent='Connect S to E in the fewest metres. Try this tiny practice map—or jump straight in.';
        const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 330 190');svg.setAttribute('aria-label','Practice streets. Tap connected junctions from start to end.');svg.classList.add('primer-map');
        const make=(tag,attrs)=>{const n=document.createElementNS(svg.namespaceURI,tag);for(const [k,v] of Object.entries(attrs))n.setAttribute(k,v);return n;};
        for(const [a,b] of edges)svg.append(make('line',{x1:nodes[a][0],y1:nodes[a][1],x2:nodes[b][0],y2:nodes[b][1],class:'primer-road'}));
        const trail=make('polyline',{class:'primer-trail',fill:'none'});svg.append(trail);
        const status=document.createElement('p');status.className='primer-status';status.setAttribute('role','status');
        function render(){trail.setAttribute('points',path.map(i=>nodes[i].join(',')).join(' '));
            const complete=path.at(-1)===4;status.textContent=complete?'Nice. In the real game, cyan A* dashes reveal the shortest route. Shorter detours = a higher score.':path.length>1?'Keep going. Drag back along your amber line to erase.':'Tap the next junction, or drag from S. Lifting your finger pauses tracing.';
        }
        function visit(i){const last=path.at(-1),previous=path.indexOf(i);if(previous>=0)path=path.slice(0,previous+1);else if(edges.some(([a,b])=>a===last&&b===i||b===last&&a===i))path.push(i);render();}
        nodes.forEach(([x,y],i)=>{
            const g=make('g',{role:'button',tabindex:'0','aria-label':i===0?'Start':i===4?'End':`Junction ${i}`,class:'primer-node'});
            g.append(make('circle',{cx:x,cy:y,r:22,class:'primer-hit'}),make('circle',{cx:x,cy:y,r:i===0||i===4?13:5,class:i===0?'primer-start':i===4?'primer-end':'primer-dot'}));
            if(i===0||i===4){const label=make('text',{x,y:y+4,'text-anchor':'middle'});label.textContent=i===0?'S':'E';g.append(label);}
            g.addEventListener('click',()=>visit(i));g.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();visit(i);}});svg.append(g);
        });
        function sample(e){const p=svg.createSVGPoint();p.x=e.clientX;p.y=e.clientY;const local=p.matrixTransform(svg.getScreenCTM().inverse());let best=-1,d=24;nodes.forEach(([x,y],i)=>{const n=Math.hypot(x-local.x,y-local.y);if(n<d){d=n;best=i;}});if(best>=0)visit(best);}
        svg.addEventListener('pointerdown',e=>{dragging=true;svg.setPointerCapture(e.pointerId);sample(e);});
        svg.addEventListener('pointermove',e=>{if(dragging)sample(e);});
        for(const event of ['pointerup','pointercancel'])svg.addEventListener(event,()=>dragging=false);
        const reset=document.createElement('button');reset.type='button';reset.className='primer-reset';reset.textContent='Reset practice';reset.onclick=()=>{path=[0];render();};
        const note=document.createElement('p');note.className='primer-note';note.textContent='Pickups are a separate tap. The Route button holds Undo, Tap / Trace and the map menu. Bridges only connect where streets really meet.';
        root.append(title,lead,svg,status,reset,note,start);render();
    }
    document.addEventListener('DOMContentLoaded',init);
})();
