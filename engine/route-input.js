/* Screen-space corridor checks shared by candidate selection and tracing. */
(() => {
    function followsGesture(coords,map,anchor,target,tolerance=22){
        const a=map.project([anchor.lng,anchor.lat]),b=map.project([target.lng,target.lat]);
        const dx=b.x-a.x,dy=b.y-a.y,length=dx*dx+dy*dy;
        return coords.every(p=>{
            const s=map.project([p.lng,p.lat]);
            const t=length?Math.max(0,Math.min(1,((s.x-a.x)*dx+(s.y-a.y)*dy)/length)):0;
            return Math.hypot(s.x-a.x-dx*t,s.y-a.y-dy*t)<=tolerance;
        });
    }
    function targetPixels(zoom, touch=false){
        return Math.min(touch?44:34,(touch?28:20)+Math.max(0,15-zoom)*3);
    }
    window.PathfindrRouteInput={followsGesture,targetPixels};
})();
