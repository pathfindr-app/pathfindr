/* Tap once to reveal an exit; the running visualizer has no persistent chrome. */
(() => {
    function init(){
        const map=document.getElementById('map-container'),exit=document.createElement('button');
        exit.id='visualizer-exit';exit.type='button';exit.textContent='Back to lobby';map.append(exit);
        let timer;
        function reveal(){if(!document.body.classList.contains('mode-visualizer'))return;exit.classList.add('revealed');clearTimeout(timer);timer=setTimeout(()=>exit.classList.remove('revealed'),3500);}
        map.addEventListener('pointerup',reveal);
        document.addEventListener('keydown',e=>{if(document.body.classList.contains('mode-visualizer')&&e.key==='Escape'&&!document.querySelector('dialog[open]')){e.preventDefault();exitToMenu();}});
        exit.onclick=e=>{e.stopPropagation();clearTimeout(timer);exit.classList.remove('revealed');exitToMenu();};
    }
    if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
