/* Optional map discovery. Collection taps are not route waypoints or score inputs. */
(() => {
    const icons={
        spark:'<path d="M14 2 5 14h7l-2 10 10-14h-7z" fill="currentColor"/>',
        burger:'<path d="M3 11a9 9 0 0 1 18 0z" fill="#efbc70"/><path d="m3 13 4 2 4-2 4 2 6-2" stroke="#9cd18a" stroke-width="3" fill="none"/><rect x="3" y="16" width="18" height="3" rx="1.5" fill="#9b5943"/><path d="M3 20h18q0 4-4 4H7q-4 0-4-4" fill="#efbc70"/><path d="m8 7 1-1m5 0 1 1" stroke="#fff4d7"/>',
        landmark:'<path d="M3 22h18M6 19h12M9 17V7l3-5 3 5v10z" stroke="currentColor" stroke-width="2" fill="none"/>',
        library:'<path d="M12 7Q7 3 2 6v15q5-3 10 1 5-4 10-1V6q-5-3-10 1Z" fill="currentColor" fill-opacity=".18" stroke="currentColor" stroke-width="1.7"/><path d="M12 7v15M5 10l4 1M5 14l4 1m6-4 4-1m-4 5 4-1" fill="none" stroke="currentColor" stroke-width="1.4"/>'
    };
    let map,layer,panel,items=[],cityKey='',lastRender=0;
    let roundKey=null,roundItems=[],challengeClaims=null,dailyClaims=null;
    const claimed=item=>(challengeClaims||dailyClaims)?(challengeClaims||dailyClaims).has(item.key):!!saved.claimed[item.key];
    const typeNames={spark:'Street Spark',burger:'Burger stop',landmark:'Landmark',library:'Library'};
    const collectionAllowed=phase=>(typeof GameState==='undefined'||GameState.gameMode!=='visualizer')&&['playing','visualizing','idle'].includes(phase);
    function beginRound(number,force=false){
        const next=`${cityKey}:${number}`;
        if(!force&&roundKey===next)return;
        roundKey=next;roundItems=[];window.PathfindrRoundMetrics?.begin(`${next}:${force?Date.now():''}`);renderRoundSummary();
        const status=document.getElementById('discovery-status');if(status)status.textContent='';
    }
    function renderRoundSummary(){
        const root=document.getElementById('round-discoveries');if(!root)return;
        root.replaceChildren();
        const heading=document.createElement('span');heading.className='round-discoveries-heading';
        const metrics=window.PathfindrRoundMetrics?.snapshot();
        heading.textContent=`Collected · ${roundItems.length} · ${metrics?.collectionPoints||0} pts · ${window.PathfindrRoundMetrics?.format(metrics?.elapsedMs||0)||'0:00'}`;root.append(heading);
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
    const emblems={
        burger:'<ellipse cx="32" cy="54" rx="20" ry="4" fill="#070f19" opacity=".65"/><g class="pickup-food"><path d="M10 44h44v6q-2 7-22 7T10 50Z" fill="#b96d38"/><path d="M10 43h44v5H10" fill="#ffcd7d"/><path d="m11 37 8-4 8 4 9-4 8 4 9-3v8H11Z" fill="#74cfa8"/><path d="m12 32 40 1v5H12Z" fill="#663848"/><path d="m15 30 17 9 16-9" fill="#ffde89"/><g class="pickup-bun"><path d="M9 29C10 6 54 6 55 29Z" fill="#eea658"/><path d="M13 25C16 10 45 9 51 25" fill="none" stroke="#ffe1a2" stroke-width="2"/><path d="m23 17 2-2m8 0 2 2m7 1 2-1" stroke="#fff1c9" stroke-width="2" stroke-linecap="round"/></g></g>',
        library:'<ellipse cx="32" cy="54" rx="21" ry="4" fill="#070f19" opacity=".65"/><path d="m7 20 25 9 25-9v28l-25 9-25-9Z" fill="#235365" stroke="#80dbde" stroke-width="1.5"/><path d="m32 29 25-9v24l-25 9Z" fill="#357780"/><g class="pickup-pages"><path d="M32 26Q21 14 10 18v25q12-3 22 8 10-11 22-8V18q-11-4-22 8Z" fill="#c1f1de"/><path d="M32 26v25q10-11 22-8V18q-11-4-22 8Z" fill="#74c9be"/><path d="m15 25 11 5m-11 2 11 5m12-7 11-5m-11 12 11-5" stroke="#327a80" stroke-width="1.5"/><path d="M32 26v25" stroke="#ebfff3" stroke-width="1.5"/></g><path d="M43 19v16l3-3 3 1V17" fill="#ffc97e"/>',
        landmark:'<ellipse class="pickup-orbit" cx="32" cy="47" rx="26" ry="9" fill="none" stroke="#ca9cfa" stroke-width="1" stroke-dasharray="20 8 4 8"/><path d="m12 47 20-7 20 7v6l-20 7-20-7Z" fill="#684f87"/><path d="m12 47 20-7 20 7-20 7Z" fill="#b49bda"/><g class="pickup-monument"><path d="M24 45V19l8-14 8 14v26l-8 4Z" fill="#c5c3f5"/><path d="m32 5 8 14v26l-8 4Z" fill="#7979b8"/><path d="M32 5v44M24 19h16" stroke="#ece3ff" stroke-width="1.5"/><path d="M27 23v17" stroke="#f7eeff" stroke-width="2"/></g>'
    };
    function svg(type){return `<svg viewBox="${emblems[type]?'0 0 64 64':'0 0 24 26'}" aria-hidden="true">${emblems[type]||icons[type]||icons.landmark}</svg>`;}
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
        const ctx=SoundEngine.ctx,now=ctx.currentTime;SoundEngine.duckMusic?.(.8);
        // A brief tactile layer distinguishes paper, food and stone even under music.
        if(SoundEngine.createNoiseBuffer){
            const noise=ctx.createBufferSource(),filter=ctx.createBiquadFilter(),gain=ctx.createGain();
            noise.buffer=SoundEngine.createNoiseBuffer(.12);filter.type='bandpass';
            filter.frequency.value=type==='library'?3400:type==='burger'?480:1500;
            filter.Q.value=type==='landmark'?8:.7;
            gain.gain.setValueAtTime(type==='library'?.09:.055,now);gain.gain.exponentialRampToValueAtTime(.0001,now+.11);
            noise.connect(filter);filter.connect(gain);gain.connect(SoundEngine.masterGain);noise.start(now);noise.stop(now+.12);
            noise.onended=()=>{noise.disconnect();filter.disconnect();gain.disconnect();};
        }
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
        const tilt=item.type==='burger'?-12:item.type==='library'?14:0;
        const animation=glyph.animate([
            {transform:'scale(1)',opacity:1},
            {transform:`scale(1.35) translateY(-5px) rotate(${tilt}deg)`,opacity:1,offset:.3},
            {transform:`scale(.3) translateY(-55px) rotate(${tilt*2}deg)`,opacity:0}
        ],{duration:item.type==='landmark'?650:item.type==='library'?560:440,easing:'cubic-bezier(.2,.7,.2,1)',fill:'forwards'});
        button.classList.add('is-collected');
        animation.finished.then(()=>button.remove(),()=>button.remove());
    }
    function claim(item){
        if(claimed(item)||!collectionAllowed(document.body.dataset.gamePhase))return false;
        const collectedAt=Date.now();
        if(challengeClaims||dailyClaims)(challengeClaims||dailyClaims).add(item.key);else{saved.claimed[item.key]=collectedAt;saved.counts[item.type]++;}
        roundItems.push({key:item.key,type:item.type,name:item.name,pos:item.pos?[...item.pos]:null,collectedAt});window.PathfindrRoundMetrics?.claim(item);renderRoundSummary();
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
            const hint=document.createElement('span');hint.textContent=`${typeNames[item.type]} · +${window.PathfindrRoundMetrics?.values[item.type]||0} pts`;tip.append(name,hint);button.append(tip);
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
            challengeClaims=null;dailyClaims=typeof GameState!=='undefined'&&GameState.gameMode==='challenge'?new Set():null;
            roundKey=null;roundItems=[];window.PathfindrRoundMetrics?.clear();renderRoundSummary();
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
