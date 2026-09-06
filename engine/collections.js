/* Optional map discovery. Collection taps are not route waypoints or score inputs. */
(() => {
    const icons={
        spark:'<path d="M14 2 5 14h7l-2 10 10-14h-7z" fill="currentColor"/>',
        burger:'<path d="M3 11a9 9 0 0 1 18 0z" fill="#efbc70"/><path d="m3 13 4 2 4-2 4 2 6-2" stroke="#9cd18a" stroke-width="3" fill="none"/><rect x="3" y="16" width="18" height="3" rx="1.5" fill="#9b5943"/><path d="M3 20h18q0 4-4 4H7q-4 0-4-4" fill="#efbc70"/><path d="m8 7 1-1m5 0 1 1" stroke="#fff4d7"/>',
        landmark:'<path d="M3 22h18M6 19h12M9 17V7l3-5 3 5v10z" stroke="currentColor" stroke-width="2" fill="none"/>',
        library:'<path d="M12 7Q7 3 2 6v15q5-3 10 1 5-4 10-1V6q-5-3-10 1Z" fill="currentColor" fill-opacity=".18" stroke="currentColor" stroke-width="1.7"/><path d="M12 7v15M5 10l4 1M5 14l4 1m6-4 4-1m-4 5 4-1" fill="none" stroke="currentColor" stroke-width="1.4"/>'
    };
    let map,layer,panel,items=[],cityKey='',lastRender=0;
    let roundKey=null,roundItems=[],challengeClaims=null;
    const claimed=item=>challengeClaims?challengeClaims.has(item.key):!!saved.claimed[item.key];
    const typeNames={spark:'Street Spark',burger:'Burger stop',landmark:'Landmark',library:'Library'};
    const collectionAllowed=phase=>(typeof GameState==='undefined'||GameState.gameMode!=='visualizer')&&['playing','visualizing','idle'].includes(phase);
    function beginRound(number,force=false){
        const next=`${cityKey}:${number}`;
        if(!force&&roundKey===next)return;
        roundKey=next;roundItems=[];renderRoundSummary();
        const status=document.getElementById('discovery-status');if(status)status.textContent='';
    }
    function renderRoundSummary(){
        const root=document.getElementById('round-discoveries');if(!root)return;
        root.replaceChildren();
        const heading=document.createElement('span');heading.className='round-discoveries-heading';
        heading.textContent=`Collected this round · ${roundItems.length}`;root.append(heading);
        const list=document.createElement('div');list.className='round-discoveries-list';
        if(!roundItems.length){const empty=document.createElement('span');empty.className='round-discoveries-empty';empty.textContent='No discoveries yet — tap pickups on the map.';list.append(empty);}
        const groups=new Map();
        for(const item of roundItems){const id=`${item.type}:${item.name}`;const group=groups.get(id);if(group)group.count++;else groups.set(id,{...item,count:1});}
        for(const item of groups.values()){
            const chip=document.createElement('span');chip.className=`round-discovery pickup-${item.type}`;chip.innerHTML=svg(item.type);
            const name=document.createElement('span');name.textContent=`${item.name}${item.count>1?` ×${item.count}`:''}`;chip.append(name);list.append(chip);
        }
        root.append(list);
    }
    const key='pathfindr_discovery_v1';
    let saved={claimed:{},counts:{spark:0,burger:0,landmark:0,library:0}};
    try{const data=JSON.parse(localStorage.getItem(key));if(data?.claimed && data?.counts){saved.claimed=data.claimed;for(const type of Object.keys(saved.counts))saved.counts[type]=Math.max(0,Math.floor(Number(data.counts[type])||0));}}catch{}
    function persist(){try{localStorage.setItem(key,JSON.stringify(saved));return true;}catch{return false;}}
    function svg(type){return `<svg viewBox="0 0 24 26" aria-hidden="true">${icons[type]}</svg>`;}
    function renderPanel(){if(!panel)return;panel.replaceChildren();
        const title=document.createElement('strong');title.textContent='City discoveries';panel.append(title);
        const sub=document.createElement('p');sub.textContent='Tap pickups on the map. Routes and scores stay separate. Saved on this device.';panel.append(sub);
        for(const [type,goal,name] of [['library',5,'Library trail'],['burger',10,'Burger tour'],['landmark',5,'World monuments']]){
            const row=document.createElement('div');row.className='discovery-progress';const label=document.createElement('span');label.textContent=`${name} · ${saved.counts[type]}${type==='spark'?'':` / ${goal}`}`;
            const progress=document.createElement('progress');progress.max=goal;progress.value=Math.min(goal,saved.counts[type]);row.append(label,progress);panel.append(row);
        }
        const close=document.createElement('button');close.type='button';close.textContent='Back to map';close.addEventListener('click',()=>panel.hidden=true);panel.append(close);
        const badge=document.getElementById('discoveries-btn');if(badge)badge.textContent=`Discoveries · ${['library','burger','landmark'].reduce((sum,type)=>sum+saved.counts[type],0)}`;
    }
    function sound(type){
        if(typeof SoundEngine==='undefined')return;SoundEngine.init();if(SoundEngine.muted||!SoundEngine.ctx)return;
        const ctx=SoundEngine.ctx,now=ctx.currentTime;
        // Burger: warm springy pop. Library: plucked glass dyad. Monument: bell fifths.
        // At most eight short voices, all routed through the existing mute/master bus.
        const notes=type==='library'?[783.99,1174.66]:type==='burger'?[196,293.66,392]:[392,587.33,783.99];
        notes.forEach((frequency,i)=>{
            const duration=type==='landmark'?.72:type==='library'?.42:.22;
            for(let partial=0;partial<2;partial++){
                const osc=ctx.createOscillator(),gain=ctx.createGain(),start=now+i*.055;
                osc.type=type==='burger'?'triangle':'sine';
                const pitch=frequency*(partial?type==='library'?2.003:2.76:1);
                osc.frequency.setValueAtTime(pitch*(type==='burger'?1.35:1),start);
                osc.frequency.exponentialRampToValueAtTime(pitch,start+.065);
                gain.gain.setValueAtTime(0,start);gain.gain.linearRampToValueAtTime(partial?.018:.055,start+.006);
                gain.gain.exponentialRampToValueAtTime(.0001,start+duration);
                osc.connect(gain);gain.connect(SoundEngine.masterGain);osc.start(start);osc.stop(start+duration+.01);
                osc.onended=()=>{osc.disconnect();gain.disconnect();};
            }
        });
    }
    function celebrate(item){
        const button=item.element;if(!button)return;
        button.disabled=true;button.style.pointerEvents='none';
        const reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
        const glyph=button.querySelector('svg');
        if(reduced||!glyph?.animate){button.remove();return;}
        const animation=glyph.animate([
            {transform:'scale(1)',opacity:1},
            {transform:'scale(1.3) translateY(-3px)',opacity:1,offset:.25},
            {transform:'scale(.45) translateY(-42px)',opacity:0}
        ],{duration:420,easing:'cubic-bezier(.2,.7,.2,1)',fill:'forwards'});
        button.classList.add('is-collected');
        animation.finished.then(()=>button.remove(),()=>button.remove());
    }
    function claim(item){
        if(claimed(item)||!collectionAllowed(document.body.dataset.gamePhase))return false;
        const collectedAt=Date.now();
        if(challengeClaims)challengeClaims.add(item.key);else{saved.claimed[item.key]=collectedAt;saved.counts[item.type]++;}
        roundItems.push({key:item.key,type:item.type,name:item.name,pos:item.pos?[...item.pos]:null,collectedAt});renderRoundSummary();
        window.PathfindrArchive?.discoveries(roundItems.filter(p=>p.pos).map(p=>({...p,pos:[...p.pos]})));
        const stored=challengeClaims?true:persist();sound(item.type);celebrate(item);renderPanel();
        const toast=document.getElementById('discovery-status');toast.textContent=`${item.name} collected${stored?'':' · storage unavailable; this session only'}`;
        return true;
    }
    function mount(){if(!layer)return;layer.replaceChildren();
        for(const item of items){if(claimed(item))continue;
            const button=document.createElement('button');button.type='button';button.className=`map-pickup pickup-${item.type}`;button.innerHTML=svg(item.type);
            button.setAttribute('aria-label',`Collect ${item.name}`);
            const tip=document.createElement('span');tip.className='pickup-tooltip';tip.id=`pickup-tip-${items.indexOf(item)}`;tip.setAttribute('role','tooltip');
            const name=document.createElement('strong');name.textContent=item.name;
            const hint=document.createElement('span');hint.textContent=`${typeNames[item.type]} · Tap to collect`;tip.append(name,hint);button.append(tip);
            button.setAttribute('aria-describedby',tip.id);
            button.addEventListener('pointerenter',()=>button.classList.remove('tooltip-dismissed'));
            button.addEventListener('focus',()=>button.classList.remove('tooltip-dismissed'));
            button.addEventListener('keydown',e=>{if(e.key==='Escape'){e.stopPropagation();button.classList.add('tooltip-dismissed');}});
            let start=null;
            button.addEventListener('pointerdown',e=>{e.stopPropagation();start={x:e.clientX,y:e.clientY};});
            button.addEventListener('pointerup',e=>{e.stopPropagation();if(start&&Math.hypot(e.clientX-start.x,e.clientY-start.y)>8)start=null;});
            button.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();if(e.detail===0||start)claim(item);start=null;});
            button.addEventListener('pointercancel',()=>start=null);
            item.element=button;layer.append(button);
        }
        update(true);
    }
    function update(force=false){
        if(!map||!layer||(!force&&performance.now()-lastRender<65))return;lastRender=performance.now();
        const w=map.getContainer().clientWidth,h=map.getContainer().clientHeight,phase=document.body.dataset.gamePhase;
        layer.hidden=!collectionAllowed(phase);
        if(layer.hidden){if(panel)panel.hidden=true;return;}
        let visible=0;const placed=[];
        const priority={landmark:0,library:1,burger:2};
        const endpoints=typeof GameState!=='undefined'?[GameState.startNode,GameState.endNode].map(id=>GameState.nodes.get(id)).filter(Boolean).map(n=>map.project([n.lng,n.lat])):[];
        for(const item of [...items].sort((a,b)=>priority[a.type]-priority[b.type])){const e=item.element;if(!e||!e.isConnected)continue;const p=window.PathfindrLandmarks?.pickupPoint(map,item)||map.project(item.pos);
            // Keep route markers and controls clear; close zoom reveals POI detail.
            const nearRoute=endpoints.some(n=>Math.hypot(n.x-p.x,n.y-p.y)<46);
            const shown=p.x>30&&p.x<w-30&&p.y>115&&p.y<h-165&&!nearRoute&&visible<12&&!placed.some(q=>Math.hypot(q.x-p.x,q.y-p.y)<60);
            e.hidden=!shown;if(shown){visible++;placed.push(p);e.dataset.tooltipAlign=p.x<130?'left':p.x>w-130?'right':'center';e.style.transform=`translate3d(${p.x-21}px,${p.y-24}px,0)`;}
        }
    }
    window.PathfindrCollections={
        init(instance){map=instance;layer=document.getElementById('collectibles-layer');panel=document.getElementById('discovery-panel');
            document.getElementById('discoveries-btn').addEventListener('click',()=>{panel.hidden=!panel.hidden;renderPanel();});
            map.on('move',()=>update(true));renderPanel();mount();
        },
        setCity(location,edges){cityKey=`${location.lat.toFixed(3)},${location.lng.toFixed(3)}`;items=[];
            challengeClaims=null;
            roundKey=null;roundItems=[];renderRoundSummary();
            // Discoveries now come only from real POIs. Preserve historical claims on disk.
            if(panel)panel.hidden=true;mount();
        },
        setChallenge(pickups){challengeClaims=new Set();items=pickups.filter(p=>p.type!=='spark').map(p=>({...p,pos:[...p.pos]}));mount();},
        clearChallenge(){challengeClaims=null;},
        addPOIs(pois){if(challengeClaims)return;const seen=new Set(items.map(p=>p.key));for(const poi of pois){if(poi.type==='spark')continue;const key=`${poi.type}:${poi.id}`;
            const duplicate=items.some(item=>item.type===poi.type&&item.name===poi.name&&Math.hypot(item.pos[0]-poi.pos[0],item.pos[1]-poi.pos[1])<0.0002);
            if(!seen.has(key)&&!duplicate){seen.add(key);items.push({...poi,key});}}mount();},
        update,claim,beginRound,renderRoundSummary,
        state:()=>({counts:{...saved.counts},round:{key:roundKey,items:roundItems.map(i=>({...i,pos:i.pos?[...i.pos]:null}))},available:items.filter(i=>!claimed(i)).map(i=>({key:i.key,type:i.type,name:i.name,pos:i.pos}))})
    };
})();
