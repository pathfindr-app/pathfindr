/* Three deliberate layers: atmospheric halo, saturated filament, moving charge.
 * Shared game clock; no timers, no per-edge shadow blur, no route mutation. */
(() => {
    function route(ctx, points, color, time, optimal=false) {
        if(points.length<2)return;
        const reduced=PathfindrMotion.reduced(), audio=PathfindrAudio.state;
        const charge=audio.enabled ? audio.bass : 0;
        const rgb=`${color.r},${color.g},${color.b}`;
        ctx.save();ctx.lineCap='round';ctx.lineJoin='round';
        const stroke=(width,alpha)=>{ctx.lineWidth=width;ctx.strokeStyle=`rgba(${rgb},${alpha})`;drawSmoothPath(ctx,points);ctx.stroke();};
        // Source-over preserves hue at shared streets instead of adding to white.
        ctx.globalCompositeOperation='source-over';
        ctx.strokeStyle='rgba(8,14,24,.85)';ctx.lineWidth=11;drawSmoothPath(ctx,points);ctx.stroke();
        stroke(24+charge*6,.045);stroke(14,.11);
        ctx.setLineDash(optimal?[11,7]:[]);stroke(optimal?5:7,.88);ctx.setLineDash([]);
        ctx.setLineDash(optimal?[12,75]:[3,24]);
        ctx.lineDashOffset=reduced?0:-time*(optimal?34:22);
        stroke(1.5,.9);ctx.setLineDash([]);
        if(!reduced) for(let i=0;i<2;i++){
            const p=getPointAlongPolyline(points,(time*.055+i*.5)%1);
            if(!p)continue;
            const r=8+charge*5,g=ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,r);
            g.addColorStop(0,`rgba(${rgb},.65)`);g.addColorStop(1,`rgba(${rgb},0)`);
            ctx.fillStyle=g;ctx.beginPath();ctx.arc(p.x,p.y,r,0,Math.PI*2);ctx.fill();
            ctx.fillStyle='rgba(230,255,252,.9)';ctx.beginPath();ctx.arc(p.x,p.y,1.4,0,Math.PI*2);ctx.fill();
        }
        ctx.restore();
    }
    function shock(ctx,viz,map,color){
        if(PathfindrMotion.reduced()||!viz.shockOrigin||!viz.sequenceMs)return;
        const center=map.project([viz.shockOrigin.lng,viz.shockOrigin.lat]);
        const edge=map.project([viz.shockOrigin.lng+viz.shockRadiusLng,viz.shockOrigin.lat]);
        const extent=Math.hypot(edge.x-center.x,edge.y-center.y);
        const t=viz.sequenceMs/1000,rgb=`${color.r},${color.g},${color.b}`;
        ctx.save();ctx.globalCompositeOperation='source-over';
        for(let i=0;i<3;i++){
            const age=t-i*.85;if(age<0||age>5.5)continue;
            const progress=age/5.5,r=extent*progress;
            const alpha=Math.sin(Math.PI*progress)*.23;
            ctx.strokeStyle=`rgba(${rgb},${alpha*.23})`;ctx.lineWidth=22;
            ctx.beginPath();ctx.arc(center.x,center.y,r,0,Math.PI*2);ctx.stroke();
            ctx.strokeStyle=`rgba(${rgb},${alpha})`;ctx.lineWidth=1.2;ctx.stroke();
        }
        ctx.restore();
    }
    function tag(ctx,points,text,color,at=.5){
        if(points.length<2)return;const p=getPointAlongPolyline(points,at);if(!p)return;
        // Offscreen history must not stack misleading tags against viewport edges.
        if(p.x<20||p.x>ctx.canvas.width-20||p.y<120||p.y>ctx.canvas.height-150)return;
        ctx.save();ctx.font='600 11px monospace';const w=ctx.measureText(text).width+20;
        const x=Math.max(8,Math.min(ctx.canvas.width-w-8,p.x-w/2)),y=Math.max(100,Math.min(ctx.canvas.height-150,p.y-28));
        ctx.globalCompositeOperation='source-over';ctx.fillStyle='#253147';ctx.fillRect(x,y,w,23);
        ctx.strokeStyle=color;ctx.lineWidth=1;ctx.strokeRect(x,y,w,23);ctx.fillStyle='#f4f7fb';ctx.fillText(text,x+10,y+15);ctx.restore();
    }
    window.PathfindrRouteCinema={route,tag,shock};
})();
