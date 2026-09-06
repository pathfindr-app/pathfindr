/* Small, isolated lobby motion; no new WebGL context or map requests. */
(() => {
 function init(){
    const root=document.getElementById('splash-screen'),canvas=document.getElementById('lobby-route-motion');
    if(!root||!canvas)return;
    document.querySelectorAll('[data-lobby-city]').forEach(button=>button.addEventListener('click',()=>{
        document.querySelector('.mode-classic').click();
        document.querySelector(`.location-option[data-mode="${button.dataset.lobbyCity}"]`).click();
    }));
    document.querySelector('.lobby-wordmark').addEventListener('click',e=>{e.preventDefault();document.querySelector('.mobile-lobby-tab[data-mobile-panel="overview"]').click();});
    const tabs=[...document.querySelectorAll('.mobile-lobby-tab')];
    tabs.forEach((tab,index)=>tab.addEventListener('keydown',e=>{let next;
        if(e.key==='ArrowRight')next=(index+1)%tabs.length;if(e.key==='ArrowLeft')next=(index+tabs.length-1)%tabs.length;
        if(e.key==='Home')next=0;if(e.key==='End')next=tabs.length-1;
        if(next!==undefined){e.preventDefault();tabs[next].focus();tabs[next].click();}
    }));
    const routes=(window.PathfindrLobbyRoutes||[]).map(points=>{let length=0;const segments=points.slice(1).map((b,i)=>{const a=points[i],d=Math.hypot(b[0]-a[0],b[1]-a[1]);const s={a,b,start:length,d};length+=d;return s;});return{segments,length};});
    const ctx=canvas.getContext('2d'),reduced=matchMedia('(prefers-reduced-motion: reduce)');
    if(!ctx)return;
    let frame=0,last=0,time=0,onScreen=true;
    const visible=()=>!document.hidden&&!root.classList.contains('hidden')&&root.dataset.lobbyPanel==='overview'&&onScreen&&!reduced.matches;
    function draw(now){frame=0;if(!visible())return;frame=requestAnimationFrame(draw);if(now-last<33)return;
        time+=Math.min(70,now-last)/1000;last=now;
        const rect=canvas.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,1.5),w=Math.round(rect.width*dpr),h=Math.round(rect.height*dpr);
        if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}
        ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,w,h);
        const scale=Math.max(w/720,h/800);ctx.setTransform(scale,0,0,scale,(w-720*scale)/2,(h-800*scale)/2);
        routes.forEach((route,i)=>{const distance=((time*.075+i*.38)%1)*route.length;const s=route.segments.find(s=>distance<=s.start+s.d);if(!s||!s.d)return;
            const t=(distance-s.start)/s.d,x=s.a[0]+(s.b[0]-s.a[0])*t,y=s.a[1]+(s.b[1]-s.a[1])*t;
            const color=i?'97,235,234':'255,189,125';const glow=ctx.createRadialGradient(x,y,0,x,y,20);glow.addColorStop(0,`rgba(${color},.8)`);glow.addColorStop(1,`rgba(${color},0)`);
            ctx.fillStyle=glow;ctx.fillRect(x-20,y-20,40,40);ctx.fillStyle='#f3ffec';ctx.beginPath();ctx.arc(x,y,2,0,Math.PI*2);ctx.fill();
        });
    }
    const sync=()=>{if(frame)cancelAnimationFrame(frame);frame=0;ctx.clearRect(0,0,canvas.width,canvas.height);last=performance.now();if(visible())frame=requestAnimationFrame(draw);};
    new MutationObserver(sync).observe(root,{attributes:true,attributeFilter:['class','data-lobby-panel']});
    new IntersectionObserver(entries=>{onScreen=entries[0].isIntersecting;sync();}).observe(canvas);
    document.addEventListener('visibilitychange',sync);reduced.addEventListener('change',sync);sync();
    window.PathfindrLobby={state:()=>({panel:root.dataset.lobbyPanel,motion:visible()&&!!frame})};
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
