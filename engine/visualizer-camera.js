/* A single, damped camera director on the game's clock. No per-node flyTo jobs. */
(() => {
    const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
    const mix=(a,b,t)=>a+(b-a)*t;
    let shot=null,enabled=true,paused=false,clock=0;
    const gestures=['dragstart','zoomstart','rotatestart','pitchstart','wheel'];
    function sync(){
        const button=document.getElementById('camera-motion-btn');
        if(!button)return;
        button.textContent=paused?'Resume camera':'Camera motion';
        button.setAttribute('aria-pressed',String(enabled&&!paused));
    }
    function stop(){
        if(shot)for(const e of gestures)shot.map.off(e,interrupt);
        shot=null;
    }
    function interrupt(e){if(e.originalEvent){paused=true;sync();}}
    function frame(map,points){
        const bounds=points.reduce((b,p)=>[[Math.min(b[0][0],p.lng),Math.min(b[0][1],p.lat)],
            [Math.max(b[1][0],p.lng),Math.max(b[1][1],p.lat)]],[[Infinity,Infinity],[-Infinity,-Infinity]]);
        const canvas=map.getCanvas(),small=canvas.clientWidth<700;
        return map.cameraForBounds(bounds,{padding:{top:small?120:110,bottom:small?110:80,left:45,right:45},maxZoom:16});
    }
    function follow(map,path,explored,nodes){
        // A stable endpoint composition: never chase individual frontier nodes.
        const points=[nodes.get(path[0]),nodes.get(path[path.length-1])].filter(Boolean);
        if(!points.length)return;
        const key=points.map(p=>`${p.lng},${p.lat}`).sort().join('|');
        if(shot?.map===map&&shot.key===key)return;
        const fit=frame(map,points);if(!fit)return;
        if(!shot||shot.map!==map){stop();clock=0;
            shot={map,bearing:map.getBearing()};
            for(const e of gestures)map.on(e,interrupt);
        }
        Object.assign(shot,{key,points,center:fit.center,zoom:Math.min(fit.zoom-.35,16),needsFrame:true});
        if(enabled&&!paused&&!PathfindrMotion.reduced()&&map.easeTo){
            shot.intro=true;
            map.easeTo({center:fit.center,zoom:shot.zoom,pitch:32,duration:550});
        }
        sync();
    }
    function tick(delta,viz){
        if(!shot||!enabled||paused||document.hidden||document.getElementById('mobile-options-sheet')?.open||PathfindrMotion.reduced())return;
        if(shot.intro&&shot.map.isMoving?.())return;
        shot.intro=false;
        const dt=clamp(delta,0,64);clock+=dt;
        const {map,center,zoom}=shot;
        const attitude=1-Math.exp(-dt/2800);
        map.jumpTo({center:[center.lng,center.lat],
            zoom:shot.needsFrame?zoom:Math.min(map.getZoom(),zoom),
            pitch:mix(map.getPitch(),32,attitude),bearing:map.getBearing()+dt*.0015});
        shot.needsFrame=false;
        // Screen-space guard includes perspective, rotation and responsive HUD space.
        // Only zoom outward; no breathing/pumping as the orbit turns.
        if(map.project){
            const canvas=map.getCanvas(),w=canvas.clientWidth,h=canvas.clientHeight;
            const marginX=Math.min(52,w*.16),top=Math.min(130,h*.22),bottom=Math.min(110,h*.20);
            for(let i=0;i<12;i++){
                const ratio=Math.max(...shot.points.map(p=>{
                    const q=map.project([p.lng,p.lat]);
                    return Math.max(Math.abs(q.x-w/2)/(w/2-marginX),
                        (h/2-q.y)/(h/2-top),(q.y-h/2)/(h/2-bottom));
                }));
                if(ratio<=1)break;
                map.jumpTo({center:[center.lng,center.lat],zoom:map.getZoom()-Math.max(.005,Math.log2(ratio)+.005)});
            }
        }
    }
    window.PathfindrVisualizerCamera={follow,tick,stop,startSession(){stop();enabled=true;paused=false;clock=0;sync();},hold(){if(shot){paused=true;sync();}},toggle(){if(paused){paused=false;enabled=true;}else enabled=!enabled;sync();},
        state:()=>({active:!!shot,enabled,paused,framing:!!shot?.intro,clock,targetZoom:shot?.zoom??null})};
})();
