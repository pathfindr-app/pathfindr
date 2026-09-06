/* Camera choreography shares the route's clock; no independent animation loop. */
(() => {
    const ease=t=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t);};
    function create({map,points,padding,valid,motion}) {
        const bounds=points.reduce((b,p)=>[[Math.min(b[0][0],p.lng),Math.min(b[0][1],p.lat)],
            [Math.max(b[1][0],p.lng),Math.max(b[1][1],p.lat)]],[[Infinity,Infinity],[-Infinity,-Infinity]]);
        const bearing=map.getBearing();
        const fit=map.cameraForBounds(bounds,{padding,maxZoom:16,bearing});
        if(!fit)return {begin:async()=>{},update(){},dispose(){}};
        const target={lng:fit.center.lng,lat:fit.center.lat,zoom:Math.min(map.getZoom(),Math.max(map.getMinZoom?.()||0,fit.zoom-.35))};
        let cancelled=false;
        const dispose=()=>{cancelled=true;map.off('dragstart',interrupt);map.off('zoomstart',interrupt);map.off('rotatestart',interrupt);map.off('pitchstart',interrupt);};
        const interrupt=e=>{if(e.originalEvent)dispose();};
        for(const event of ['dragstart','zoomstart','rotatestart','pitchstart'])map.on(event,interrupt);
        const active=()=>{if(!valid())dispose();return !cancelled;};
        const interpolate=(a,b,t)=>{
            const lngDelta=((b.lng-a.lng+540)%360)-180;
            return [a.lng+lngDelta*t,a.lat+(b.lat-a.lat)*t];
        };
        return {
            async begin(){
                if(!active())return;
                map.stop();
                if(motion.reduced()){
                    map.jumpTo({center:[target.lng,target.lat],zoom:target.zoom,pitch:0,bearing});
                    dispose();return;
                }
                const from=map.getCenter(),zoom=map.getZoom(),pitch=map.getPitch();
                // Start at the player's finish view. Pull out to include the start
                // and all detours, then hand a settled frame to the search.
                await motion.animate(1100,t=>{
                    const k=ease(t);
                    map.jumpTo({center:interpolate(from,target,k),zoom:zoom+(target.zoom-zoom)*k,pitch:pitch*(1-k),bearing});
                },active);
                dispose();
            },
            update(){},
            dispose
        };
    }
    window.PathfindrRevealCamera={create,ease};
})();
