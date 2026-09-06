/* Mobile shell: move existing controls, preserving their listeners and state. */
(() => {
    function init(){
        const media=matchMedia('(max-width: 700px)');
        const hud=document.getElementById('gameplay-hud');
        const trigger=document.createElement('button');
        trigger.id='mobile-options';trigger.type='button';trigger.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16"/></svg><span>Menu</span>';
        trigger.setAttribute('aria-label','Map menu');
        trigger.setAttribute('aria-haspopup','dialog');hud.append(trigger);
        const sheet=document.createElement('dialog');sheet.id='mobile-options-sheet';
        sheet.setAttribute('aria-labelledby','mobile-options-title');
        sheet.innerHTML='<header><small>PATHFINDR</small><h2 id="mobile-options-title">Map menu</h2></header><button type="button" data-close autofocus><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m8 4 13 8-13 8Z" fill="currentColor"/></svg><span>Resume map</span></button><div class="instrument-scroll"><div class="mobile-settings-grid"></div><details class="instrument-more"><summary>More controls</summary><div class="instrument-secondary"></div></details></div><footer><p id="lobby-exit-warning" role="status" hidden>Leave this run? Your current route and run score will reset.</p><div class="lobby-exit-actions"><button type="button" id="mobile-stay" hidden>Keep playing</button><button type="button" id="mobile-lobby"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="m3 10 9-7 9 7M5 9v12h5v-7h4v7h5V9"/></svg><span>Back to lobby</span><span aria-hidden="true">→</span></button></div></footer>';
        document.body.append(sheet);
        const record=document.createElement('div');record.className='survey-heading';record.innerHTML='<span>Route survey</span><small>FIELD RECORD</small>';
        document.querySelector('#results-panel .results-content').prepend(record);
        const cancelCity=document.createElement('button');cancelCity.type='button';cancelCity.id='cancel-city-transition';cancelCity.textContent='Back to lobby';cancelCity.onclick=()=>exitToMenu();
        document.querySelector('.city-transition-content').append(cancelCity);
        const lobby=sheet.querySelector('#mobile-lobby'),stay=sheet.querySelector('#mobile-stay'),warning=sheet.querySelector('#lobby-exit-warning');
        const resetExit=()=>{warning.hidden=true;stay.hidden=true;lobby.querySelector('span').textContent='Back to lobby';sheet.classList.remove('confirming-exit');};
        trigger.onclick=()=>{resetExit();sheet.showModal();trigger.setAttribute('aria-expanded','true');};
        sheet.addEventListener('close',()=>{resetExit();trigger.setAttribute('aria-expanded','false');});
        trigger.setAttribute('aria-controls',sheet.id);trigger.setAttribute('aria-expanded','false');
        sheet.querySelector('[data-close]').onclick=()=>sheet.close();
        sheet.addEventListener('click',e=>{if(e.target===sheet)sheet.close();});
        stay.onclick=()=>{resetExit();sheet.close();};
        lobby.onclick=()=>{
            const hasProgress=typeof GameState!=='undefined'&&['competitive','challenge'].includes(GameState.gameMode)&&
                ((GameState.userPathNodes?.length||0)>1||(GameState.roundScores?.length||0)>0||GameState.totalScore>0);
            if(hasProgress&&warning.hidden){warning.hidden=false;stay.hidden=false;sheet.classList.add('confirming-exit');lobby.querySelector('span').textContent='Leave run';stay.focus();return;}
            sheet.close();document.getElementById('menu-exit').click();
        };
        const grid=sheet.querySelector('.mobile-settings-grid');
        const secondary=sheet.querySelector('.instrument-secondary');
        sheet.classList.add('instrument-menu');
        const camera=document.createElement('button');camera.id='camera-motion-btn';camera.type='button';camera.textContent='Camera motion';camera.setAttribute('aria-pressed','true');
        camera.onclick=()=>window.PathfindrVisualizerCamera?.toggle();grid.append(camera);
        const ids=['fullscreen-btn','city-depth-btn','audio-motion-btn','mute-btn','clear-btn','user-btn','discoveries-btn','mode-exit-btn','mobile-compass-btn','graphics-panel'];
        const primaryIds=['mute-btn','audio-motion-btn','city-depth-btn','fullscreen-btn'];
        camera.classList.add('instrument-action');
        const moved=[];
        for(const id of ids){
            const node=document.getElementById(id);if(!node)continue;
            if(primaryIds.includes(id))node.classList.add('instrument-action');
            if(id==='mobile-compass-btn')node.insertAdjacentHTML('afterbegin','<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="m12 3 6 16-6-4-6 4 6-16ZM12 8v7"/></svg>');
            if(id==='city-depth-btn'||id==='audio-motion-btn')node.insertAdjacentHTML('afterbegin',`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="${id==='city-depth-btn'?'m4 9 8-5 8 5v10l-8 3-8-3V9Zm0 0 8 4 8-4M12 13v9':'M3 12h3l2-7 4 14 3-10 2 3h4'}"/></svg>`);
            const marker=document.createComment(`home:${id}`);node.before(marker);moved.push({node,marker});
            if(['fullscreen-btn','mute-btn','clear-btn','user-btn','mode-exit-btn','mobile-compass-btn'].includes(id)){
                const label=document.createElement('span');label.className='mobile-control-label';
                label.textContent={ 'fullscreen-btn':'Fullscreen','mute-btn':'Sound','clear-btn':'Clear route','user-btn':'Account','mode-exit-btn':'Exit mode','mobile-compass-btn':'Reset north'}[id];node.append(label);
            }
            if(['user-btn','discoveries-btn','clear-btn','mode-exit-btn'].includes(id))node.addEventListener('click',()=>sheet.close());
        }
        const recenter=document.getElementById('route-recenter-btn');
        // The sound engine replaces the icon markup on toggle. Keep its text label.
        const mute=document.getElementById('mute-btn');
        if(mute){
            const labelMute=()=>{if(!mute.querySelector('.mobile-control-label')){const label=document.createElement('span');label.className='mobile-control-label';label.textContent='Sound';mute.append(label);}};
            new MutationObserver(labelMute).observe(mute,{childList:true});labelMute();
        }
        const recenterHome=document.createComment('recenter-home');recenter.before(recenterHome);
        const sync=()=>{
            sheet.close();
            for(const {node} of moved)secondary.append(node);
            for(const id of primaryIds){const node=document.getElementById(id);if(node)grid.append(node);}
            if(!recenter.closest('#route-wheel')){if(media.matches)document.querySelector('.route-tool-row').append(recenter);else recenterHome.after(recenter);}
        };
        media.addEventListener('change',sync);sync();
        // Close sheets on game/lobby transitions, preserving native focus restoration.
        new MutationObserver(()=>sheet.close()).observe(document.body,{attributes:true,attributeFilter:['data-game-phase']});
    }
    if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
