/* Mobile shell: move existing controls, preserving their listeners and state. */
(() => {
    function init(){
        const media=matchMedia('(max-width: 700px)');
        const hud=document.getElementById('gameplay-hud');
        const trigger=document.createElement('button');
        trigger.id='mobile-options';trigger.type='button';trigger.textContent='Menu';
        trigger.setAttribute('aria-haspopup','dialog');hud.append(trigger);
        const sheet=document.createElement('dialog');sheet.id='mobile-options-sheet';
        sheet.setAttribute('aria-labelledby','mobile-options-title');
        sheet.innerHTML='<header><div><small>PATHFINDR</small><h2 id="mobile-options-title">Map & game</h2></div><button type="button" data-close>Done</button></header><p class="sheet-help">Follow connected streets. Crossings at different heights are not junctions. Travel either direction.</p><div class="mobile-settings-grid"></div><button type="button" id="mobile-lobby">Back to lobby</button>';
        document.body.append(sheet);
        trigger.onclick=()=>sheet.showModal();
        sheet.querySelector('[data-close]').onclick=()=>sheet.close();
        sheet.addEventListener('click',e=>{if(e.target===sheet)sheet.close();});
        sheet.querySelector('#mobile-lobby').onclick=()=>{sheet.close();document.getElementById('hud-menu-btn').click();};
        const grid=sheet.querySelector('.mobile-settings-grid');
        const ids=['city-depth-btn','audio-motion-btn','mute-btn','clear-btn','user-btn','discoveries-btn','mode-exit-btn','mobile-compass-btn','graphics-panel'];
        const moved=[];
        for(const id of ids){
            const node=document.getElementById(id);if(!node)continue;
            const marker=document.createComment(`home:${id}`);node.before(marker);moved.push({node,marker});
            if(['mute-btn','clear-btn','user-btn','mode-exit-btn','mobile-compass-btn'].includes(id)){
                const label=document.createElement('span');label.className='mobile-control-label';
                label.textContent={ 'mute-btn':'Sound','clear-btn':'Clear route','user-btn':'Account','mode-exit-btn':'Exit mode','mobile-compass-btn':'Reset north'}[id];node.append(label);
            }
            if(['user-btn','discoveries-btn','clear-btn','mode-exit-btn'].includes(id))node.addEventListener('click',()=>sheet.close());
        }
        const recenter=document.getElementById('route-recenter-btn');
        const recenterHome=document.createComment('recenter-home');recenter.before(recenterHome);
        const sync=()=>{
            sheet.close();
            for(const {node,marker} of moved)if(media.matches)grid.append(node);else marker.after(node);
            if(media.matches)document.querySelector('.route-tool-row').append(recenter);else recenterHome.after(recenter);
        };
        media.addEventListener('change',sync);sync();
        // Close sheets on game/lobby transitions, preserving native focus restoration.
        new MutationObserver(()=>sheet.close()).observe(document.body,{attributes:true,attributeFilter:['data-game-phase']});
    }
    if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
