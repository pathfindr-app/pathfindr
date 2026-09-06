/* Seven-segment readout; original live text remains the accessible source of truth. */
(() => {
    const segments=['abcedf','bc','abged','abgcd','fgbc','afgcd','afgecd','abc','abcdefg','abfgcd'];
    const paths={a:'M3 1h8l-2 2H5Z',b:'m12 2 1 1v6l-2 1V4Z',c:'m11 12 2 1v6l-1 1-1-2Z',d:'m3 21 2-2h4l2 2Z',e:'m1 13 2-1v6l-1 2-1-1Z',f:'m1 3 1-1 1 2v6L1 9Z',g:'m3 11 2-1h4l2 1-2 1H5Z'};
    function markup(text){
        return [...text].map(char=>{
            if(/\d/.test(char))return `<svg class="lcd-digit" viewBox="0 0 14 22" aria-hidden="true">${Object.entries(paths).map(([key,d])=>`<path d="${d}" class="${segments[Number(char)].includes(key)?'lit':'unlit'}"/>`).join('')}</svg>`;
            if(char==='.')return '<svg class="lcd-dot" viewBox="0 0 4 22" aria-hidden="true"><circle cx="2" cy="20" r="1.3" fill="currentColor"/></svg>';
            if(char==='/')return '<svg class="lcd-slash" viewBox="0 0 8 22" aria-hidden="true"><path d="m1 21 6-20" stroke="currentColor" stroke-width="1.2"/></svg>';
            // Units only; never interpolate arbitrary source text into markup.
            return char==='k'||char==='m'?`<span class="lcd-unit">${char}</span>`:'';
        }).join('');
    }
    function init(){
        document.querySelectorAll('#gameplay-hud .hud-stat > .hud-value').forEach(source=>{
            const display=document.createElement('span');display.className='lcd-numerals';display.setAttribute('aria-hidden','true');source.after(display);source.classList.add('lcd-source');
            let last='';const sync=()=>{const text=source.textContent.trim();if(text===last)return;last=text;display.innerHTML=markup(text);};
            new MutationObserver(sync).observe(source,{childList:true,subtree:true,characterData:true});sync();
        });
    }
    window.PathfindrLCD={markup};
    if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
