/* Six stable positions; disclosure buttons retain their original game listeners. */
(() => {
    function init(){
        const wheel=document.createElement('section');wheel.id='route-wheel';wheel.setAttribute('aria-label','Route actions');
        wheel.innerHTML='<svg class="route-orbit-grid" viewBox="0 0 300 260" aria-hidden="true"><path class="orbit-track" d="M31 212V128L108 48h84l77 80v84"/><path class="orbit-ticks" d="M26 190h10m-10-40h10m40-68 8 8m36-46v10m60-10v10m44 28-8 8m48 60h10m-10 40h10"/><path class="orbit-link" d="m42 220 108 22 108-22M150 242V66"/></svg><div class="route-orbit" id="route-orbit" inert></div><button type="button" id="route-wheel-toggle" aria-label="Route actions" aria-expanded="false" aria-controls="route-orbit"><svg viewBox="0 0 32 32" aria-hidden="true"><path d="m16 4 10 23-10-6-10 6Z"/><path d="M16 10v11"/><circle cx="16" cy="16" r="14" stroke-dasharray="2 9"/></svg><span>Route</span></button><p id="route-wheel-status" role="status"></p>';
        document.body.append(wheel);
        const orbit=wheel.querySelector('.route-orbit'),toggle=wheel.querySelector('#route-wheel-toggle'),status=wheel.querySelector('[role=status]');
        const skip=document.createElement('button');skip.id='route-finish-btn';skip.type='button';skip.textContent='Finish';
        const settings=document.createElement('button');settings.type='button';settings.textContent='Settings';settings.onclick=()=>document.getElementById('mobile-options').click();
        const actions=[document.querySelector('[data-input-mode="tap"]'),document.querySelector('[data-input-mode="trace"]'),document.getElementById('route-undo-btn'),skip,document.getElementById('route-recenter-btn'),settings];
        const icons=['M9 19V9a2 2 0 014 0v5l3-2 4 3-3 7H11z','M4 19c0-14 6-16 7-7s5 10 9-7','M8 5L3 10l5 5M3 10h10a6 6 0 010 12','M5 5v16M5 5h14l-3 5 3 5H5','M12 3v4m0 10v4M3 12h4m10 0h4M8 12a4 4 0 108 0 4 4 0 00-8 0','M4 7h16M4 12h16M4 17h16M8 5v4m8 1v4m-6 1v4'];
        let armedUntil=0,timer,busy=false;
        const disarm=()=>{armedUntil=0;clearTimeout(timer);skip.querySelector('span').textContent='Finish';skip.classList.remove('confirm');};
        function setOpen(open,focus=false){wheel.classList.toggle('open',open);toggle.setAttribute('aria-expanded',String(open));orbit.inert=!open;if(!open){disarm();status.textContent='';if(focus)toggle.focus();}}
        actions.forEach((button,i)=>{
            const label=button.textContent.trim();button.replaceChildren();
            button.innerHTML=`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${icons[i]}"/></svg><span></span>`;
            button.querySelector('span').textContent=label;
            button.classList.add('orbit-action');button.style.setProperty('--pair',[2,1,0,0,1,2][i]);orbit.append(button);
            if(button!==skip)button.addEventListener('click',()=>{setOpen(false,true);});
        });
        toggle.onclick=()=>setOpen(!wheel.classList.contains('open'));
        wheel.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();setOpen(false,true);}});
        document.addEventListener('pointerdown',e=>{if(!wheel.contains(e.target))setOpen(false);});
        skip.onclick=async()=>{
            if(busy)return;
            if(Date.now()>armedUntil){armedUntil=Date.now()+5000;skip.querySelector('span').textContent='Confirm';skip.classList.add('confirm');status.textContent='Finish automatically? Unranked · 0 points. Confirmation queues a map issue report without account details.';timer=setTimeout(()=>{disarm();status.textContent='';},5000);return;}
            disarm();busy=true;skip.disabled=true;status.textContent='Finding connected streets…';
            try{const done=await finishRouteAssisted();if(done)setOpen(false);else status.textContent='No connected route. Problem recorded; try Undo or a different street.';}
            catch{status.textContent='Unable to finish. Your route is preserved; try again.';}
            finally{busy=false;skip.disabled=false;}
        };
        new MutationObserver(()=>{setOpen(false);}).observe(document.body,{attributes:true,attributeFilter:['data-game-phase']});
    }
    if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
