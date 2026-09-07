/* Quiet cartographic identity and explicit playback; no gameplay HUD. */
(() => {
    let heading,coordinates,toggle,logList,logCount,cover;
    const logKey='pathfindr-visualizer-travel-v1';let visits=[];
    const validCity=v=>v&&typeof v.name==='string'&&v.name.trim()&&Number.isFinite(v.lat)&&Math.abs(v.lat)<=90&&Number.isFinite(v.lng)&&Math.abs(v.lng)<=180;
    const cityKey=v=>`${v.lat.toFixed(3)},${v.lng.toFixed(3)}`;
    const scanCount=n=>Number.isSafeInteger(n)&&n>0?Math.min(n,999999):0;
    try{const saved=JSON.parse(localStorage.getItem(logKey)||'[]');if(Array.isArray(saved))visits=saved.filter(validCity).slice(0,100).map(v=>({...v,key:cityKey(v),name:v.name.slice(0,100),scans:scanCount(v.scans)}));}catch{}
    function drawLog(){if(!logList)return;logList.replaceChildren();logCount.textContent=String(visits.length).padStart(2,'0');
        if(!visits.length){const row=document.createElement('li');row.textContent='Your first scan starts the log.';row.className='travel-empty';logList.append(row);}
        visits.forEach((visit,i)=>{const row=document.createElement('li'),number=document.createElement('span'),name=document.createElement('strong'),scans=document.createElement('small');
            number.textContent=String(i+1).padStart(2,'0');name.textContent=visit.name;scans.textContent=`${visit.scans} ${visit.scans===1?'SCAN':'SCANS'}`;
            const location=document.createElement('span'),position=document.createElement('small');location.className='travel-place';position.className='travel-position';
            position.textContent=`${Math.abs(visit.lat).toFixed(2)}°${visit.lat<0?'S':'N'} / ${Math.abs(visit.lng).toFixed(2)}°${visit.lng<0?'W':'E'}`;
            location.append(name,position);row.append(number,location,scans);logList.append(row);});
    }
    window.PathfindrVisualizerUI={
        async cover(map){
            this.uncover(true);
            const container=map.getContainer(),rect=container.getBoundingClientRect(),canvas=document.createElement('canvas');
            canvas.className='visualizer-city-cover';const scale=Math.min(devicePixelRatio||1,1.5);
            canvas.width=Math.round(rect.width*scale);canvas.height=Math.round(rect.height*scale);
            const ctx=canvas.getContext('2d');ctx.scale(scale,scale);
            // Capture on the map render event, while its GL buffer is still valid.
            await new Promise(resolve=>{let done=false;const capture=()=>{if(done)return;done=true;clearTimeout(timer);map.off('render',capture);
                for(const layer of container.querySelectorAll('canvas')){const r=layer.getBoundingClientRect();if(!r.width||!r.height)continue;
                    try{ctx.drawImage(layer,r.left-rect.left,r.top-rect.top,r.width,r.height);}catch{}}
                resolve();};const timer=setTimeout(capture,160);map.once('render',capture);map.triggerRepaint();});
            container.append(canvas);cover=canvas;
        },
        uncover(immediate=false){if(!cover)return;const old=cover;cover=null;if(immediate){old.remove();return;}
            old.classList.add('leaving');setTimeout(()=>old.remove(),600);},
        city(city){if(!heading||!city)return;heading.textContent=city.name;
            coordinates.textContent=`${Math.abs(city.lat).toFixed(3)}° ${city.lat<0?'S':'N'}  /  ${Math.abs(city.lng).toFixed(3)}° ${city.lng<0?'W':'E'}`;},
        paused(value){if(!toggle)return;toggle.textContent=value?'Play':'Pause';toggle.setAttribute('aria-label',value?'Play visualizer':'Pause visualizer');toggle.setAttribute('aria-pressed',String(value));},
        scanned(city){if(!validCity(city))return;const key=cityKey(city),old=visits.find(v=>v.key===key);
            visits=[{key,name:city.name.slice(0,100),lat:city.lat,lng:city.lng,scans:scanCount(scanCount(old?.scans)+1),seenAt:Date.now()},...visits.filter(v=>v.key!==key)].slice(0,100);
            try{localStorage.setItem(logKey,JSON.stringify(visits));}catch{}drawLog();}
    };
    function init(){
        const map=document.getElementById('map-container'),exit=document.createElement('button');
        exit.id='visualizer-exit';exit.type='button';exit.textContent='Back to lobby';map.append(exit);
        const identity=document.createElement('header');identity.id='visualizer-identity';
        const label=document.createElement('span');label.textContent='PATHFINDR / LIVE ATLAS';
        heading=document.createElement('h1');coordinates=document.createElement('p');identity.append(label,heading,coordinates);map.append(identity);
        const log=document.createElement('details');log.id='visualizer-travel';
        const summary=document.createElement('summary'),title=document.createElement('span');title.textContent='Places visited';logCount=document.createElement('b');summary.append(title,logCount);
        const drawer=document.createElement('section');drawer.setAttribute('aria-label','Visualizer travel log');
        const legend=document.createElement('p');legend.textContent='FIELD RECORD / STORED ON THIS DEVICE';logList=document.createElement('ol');
        drawer.append(legend,logList);log.append(summary,drawer);identity.append(log);drawLog();
        log.addEventListener('pointerdown',e=>e.stopPropagation());log.addEventListener('pointerup',e=>e.stopPropagation());
        log.addEventListener('wheel',e=>e.stopPropagation(),{passive:true});
        log.addEventListener('keydown',e=>{if(e.key==='Escape'&&log.open){e.preventDefault();e.stopPropagation();log.open=false;summary.focus();}else if(e.code==='Space'||e.key==='Enter')e.stopPropagation();});
        toggle=document.createElement('button');toggle.id='visualizer-playback';toggle.type='button';map.append(toggle);
        PathfindrVisualizerUI.paused(false);
        toggle.onclick=e=>{e.stopPropagation();toggleVisualizerPlayback();};
        let timer;
        function reveal(){if(!document.body.classList.contains('mode-visualizer'))return;exit.classList.add('revealed');clearTimeout(timer);timer=setTimeout(()=>exit.classList.remove('revealed'),3500);}
        map.addEventListener('pointerup',reveal);
        document.addEventListener('keydown',e=>{if(!document.body.classList.contains('mode-visualizer')||e.target?.closest('input,textarea,select,button,[contenteditable]')||document.querySelector('dialog[open]'))return;
            if(e.key==='Escape'){e.preventDefault();exitToMenu();}
            if(e.code==='Space'&&!e.repeat){e.preventDefault();toggleVisualizerPlayback();}
        });
        exit.onclick=e=>{e.stopPropagation();clearTimeout(timer);exit.classList.remove('revealed');PathfindrVisualizerUI.uncover(true);exitToMenu();};
    }
    if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
