/* Geographic edge readouts, not a second map renderer. No idle RAF or network work. */
(() => {
    const NS='http://www.w3.org/2000/svg';
    function format(value,axis){
        if(!Number.isFinite(value))return '';
        if(axis==='lng')value=((value+180)%360+360)%360-180;
        if(axis==='lat'&&Math.abs(value)>90)return '';
        const hemisphere=axis==='lng'?(value<0?'W':'E'):(value<0?'S':'N');
        return `${Math.abs(value).toFixed(3)}°${hemisphere}`;
    }
    function positions(width,height){
        const points=[],pad=width<600?7:12;
        // Fixed screen graduations read the actual ground coordinate at each tick,
        // including camera rotation and perspective. These are edge samples, not a north-up grid.
        for(const edge of ['top','bottom','left','right']){
            const horizontal=edge==='top'||edge==='bottom',length=horizontal?width:height;
            const count=Math.max(2,Math.min(10,Math.floor(length/(horizontal?130:145))));
            const stops=edge==='bottom'&&width<600?[55]:Array.from({length:count-1},(_,i)=>length*(i+1)/count);
            for(const p of stops){
                // Keep the bottom route hub / attribution and top HUD corners clear.
                if(edge==='bottom'&&Math.abs(p-width/2)<(width<600?80:170))continue;
                if(!horizontal&&(p<120||p>height-100))continue;
                points.push({edge,axis:horizontal?'lng':'lat',x:horizontal?p:edge==='left'?pad:width-pad,y:horizontal?(edge==='top'?pad:height-pad-(width<600?0:24)):p});
            }
        }
        return points;
    }
    let instance=null;
    function init(map){
        instance?.destroy();
        const host=map.getContainer().parentElement,svg=document.createElementNS(NS,'svg');
        svg.id='map-coordinate-frame';svg.setAttribute('aria-hidden','true');host.append(svg);
        let width=0,height=0,labels=[],dirty=true,updates=0;
        function node(tag,attributes){const n=document.createElementNS(NS,tag);for(const [k,v] of Object.entries(attributes))n.setAttribute(k,String(v));svg.append(n);return n;}
        function layout(w,h){
            width=w;height=h;svg.replaceChildren();svg.setAttribute('viewBox',`0 0 ${w} ${h}`);
            const pad=w<600?7:12;
            node('path',{class:'coordinate-corners',d:`M${pad} 38V${pad}H38M${w-38} ${pad}H${w-pad}V38M${pad} ${h-38}V${h-pad}H38M${w-38} ${h-pad}H${w-pad}V${h-38}`});
            let ticks='';
            for(let x=pad+18;x<w-pad-12;x+=18){if(Math.abs(x-w/2)>80)ticks+=`M${x} ${h-pad-(w<600?0:24)}v-3`;ticks+=`M${x} ${pad}v3`;}
            for(let y=pad+18;y<h-pad-12;y+=18){ticks+=`M${pad} ${y}h3M${w-pad} ${y}h-3`;}
            node('path',{class:'coordinate-minor',d:ticks});
            labels=positions(w,h).map(p=>{
                const {x,y,edge}=p,horizontal=p.axis==='lng',direction=edge==='bottom'||edge==='right'?-1:1;
                node('path',{class:'coordinate-major',d:`M${x} ${y}${horizontal?`v${direction*7}`:`h${direction*7}`}`});
                const tx=horizontal?x:x+direction*15,ty=horizontal?y+direction*17:y;
                const text=node('text',{x:tx,y:ty,'text-anchor':'middle','dominant-baseline':'middle',...(horizontal?{}:{transform:`rotate(${edge==='left'?-90:90} ${tx} ${ty})`})});
                return {...p,text};
            });
        }
        function update(){
            if(!dirty||document.hidden)return;
            const phase=document.body.dataset.gamePhase;
            if(['menu','loading'].includes(phase))return;
            const el=map.getContainer(),w=el.clientWidth,h=el.clientHeight;
            if(!w||!h)return;
            if(w!==width||h!==height)layout(w,h);
            for(const p of labels){const coordinate=map.unproject([p.x,p.y]);const value=format(coordinate[p.axis],p.axis);if(p.text.textContent!==value)p.text.textContent=value;}
            dirty=false;updates++;
        }
        const invalidate=()=>{dirty=true;};
        map.on('move',invalidate);map.on('resize',invalidate);map.on('render',update);
        const observer=new MutationObserver(invalidate);observer.observe(document.body,{attributes:true,attributeFilter:['data-game-phase']});
        document.addEventListener('visibilitychange',invalidate);
        const destroy=()=>{map.off('move',invalidate);map.off('resize',invalidate);map.off('render',update);observer.disconnect();document.removeEventListener('visibilitychange',invalidate);svg.remove();};
        instance={destroy,state:()=>({width,height,updates,labels:labels.map(p=>({edge:p.edge,x:p.x,y:p.y,text:p.text.textContent}))})};
        update();
    }
    window.PathfindrMapFrame={init,format,positions,state:()=>instance?.state()||null};
})();
