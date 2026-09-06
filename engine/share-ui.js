/* Local-first route library and explicit, user-initiated sharing. */
(() => {
    let dialog,content,status,activePayload=null,busy=false;
    const el=(tag,text,className)=>{const n=document.createElement(tag);if(text)n.textContent=text;if(className)n.className=className;return n;};
    const button=(label,fn)=>{const b=el('button',label);b.type='button';b.addEventListener('click',()=>Promise.resolve().then(fn).catch(report));return b;};
    function report(e){status.textContent=e.message||'Something went wrong. Please try again.';}
    function shell(title){if(!dialog){dialog=el('dialog',null,'route-share-dialog');dialog.setAttribute('aria-labelledby','route-share-title');document.body.append(dialog);}
        dialog.replaceChildren();const header=el('header'),h=el('h2',title);h.id='route-share-title';header.append(h,button('Close',()=>dialog.close()));content=el('div',null,'route-share-body');status=el('p',null,'route-share-status');status.setAttribute('role','status');dialog.append(header,content,status);if(!dialog.open)dialog.showModal();return content;}
    function publicURL(code,key='pf'){
        const url=new URL(location.protocol==='https:'?location.href:'https://www.pathfindr.world/');
        url.search='';url.hash=`${key}=${code}`;return url.href.length<=1500?url.href:'';
    }
    function preview(round){
        const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 600 230');svg.setAttribute('role','img');svg.setAttribute('aria-label','Your route in amber; shortest route in dashed cyan');
        const points=[...round.userPath,...round.optimalPath];if(!points.length)return svg;
        const xs=points.map(p=>p[0]),ys=points.map(p=>p[1]),minX=Math.min(...xs),minY=Math.min(...ys),width=Math.max(...xs)-minX,height=Math.max(...ys)-minY;
        const lat=(Math.min(...ys)+Math.max(...ys))/2,aspect=Math.cos(lat*Math.PI/180),scale=Math.min(550/Math.max(width*aspect,1e-8),180/Math.max(height,1e-8));
        for(const [path,color,dash] of [[round.userPath,'#f6be79',''],[round.optimalPath,'#75e4ee','8 5']]){const line=document.createElementNS(svg.namespaceURI,'polyline');line.setAttribute('points',path.map(p=>`${300+(p[0]-minX-width/2)*aspect*scale},${115-(p[1]-minY-height/2)*scale}`).join(' '));line.setAttribute('fill','none');line.setAttribute('stroke',color);line.setAttribute('stroke-width','4');line.setAttribute('stroke-linecap','round');if(dash)line.setAttribute('stroke-dasharray',dash);svg.append(line);}return svg;
    }
    async function show(payload){
        activePayload=PathfindrShareData.validate(payload);const selected=activePayload;const root=shell(selected.kind==='challenge'?'Friend challenge':'Route replay');
        root.append(el('h3',selected.title),el('p',`${selected.rounds.length} round${selected.rounds.length===1?'':'s'} · ${selected.kind==='challenge'?'Solution withheld · Practice, not ranked':'Recorded results · Scores are not verified'}`));
        selected.rounds.forEach((r,i)=>{const section=el('section',null,'shared-round');section.append(el('h4',`Round ${i+1} · ${selected.maps[r.map].location.name}`));
            if(selected.kind==='result'){section.append(preview(r),el('p',`${r.score} points · Your route ${r.userDistance.toFixed(2)} km · Shortest ${r.optimalDistance.toFixed(2)} km`),el('p',`Collected: ${r.collected.map(p=>p.name).join(', ')||'None'}`));}else section.append(el('p',`${r.difficulty} precision · ${r.pickups.length} collectible targets`));root.append(section);});
        const actions=el('div',null,'share-actions');
        actions.append(button('Play this challenge',async()=>{if(busy)return;busy=true;try{await PathfindrSharedGame.start(PathfindrShareData.challenge(selected));dialog.close();}finally{busy=false;}}));
        if(selected.kind==='result')actions.append(button('Share result',()=>prepare(selected)),button('Challenge a friend',()=>prepare(PathfindrShareData.challenge(selected))));
        else actions.append(button('Share challenge',()=>prepare(selected)));
        root.append(actions);
    }
    async function prepare(payload){
        const root=shell(payload.kind==='challenge'?'Share challenge':payload.rounds.length===1?'Share round':'Share run'),message=status;
        root.append(el('h3',payload.title),el('p',payload.kind==='challenge'?'Send this link to a friend to play the same challenge.':'Send this link to share your route and results.'));
        message.textContent='Creating link…';
        try{
            let url;
            try{const id=await PathfindrShareCloud.publish(payload,crypto.randomUUID());url=publicURL(id,'share');}
            catch(error){console.warn('[Share] Hosted link unavailable:',error.message);}
            if(!url){
                const code=await PathfindrShareData.encode(payload);url=publicURL(code);
                if(!url)throw Error('Hosted challenge links are temporarily unavailable. Your route is saved; try sharing again later.');
            }
            if(!root.isConnected||!dialog.open)return;
            const field=el('input');field.type='url';field.readOnly=true;field.value=url;field.setAttribute('aria-label','Share link');field.addEventListener('click',()=>field.select());root.append(field);
            const actions=el('div',null,'share-actions');
            actions.append(button('Copy link',async()=>{
                try{await navigator.clipboard.writeText(url);message.textContent='Link copied! Send it to a friend.';}
                catch{field.focus();field.select();message.textContent='Copy the selected link to send it to a friend.';}
            }));
            if(navigator.share)actions.append(button('Share…',async()=>{
                try{await navigator.share({title:payload.title,text:payload.kind==='challenge'?'Try this challenge in Pathfindr':'My route in Pathfindr',url});message.textContent='';}
                catch(e){if(e.name!=='AbortError')message.textContent='Sharing is unavailable. Use Copy link instead.';}
            }));
            root.append(actions);message.textContent='Anyone with the link can open it. No account needed.';
        }catch(e){if(root.isConnected&&dialog.open)message.textContent=e.message||'Could not create a link. Please try Share again.';}
    }
    async function library(){const root=shell('Saved routes');const actions=el('div',null,'share-actions');actions.append(button('Create a challenge',creator),button('Open share',importer));root.append(actions,el('p','Signed-in runs sync privately to your account. Guests keep a device copy. Save marks a run as a favorite; publishing is always a separate action.'));
        status.textContent='Loading routes…';const records=await PathfindrArchive.list();if(!root.isConnected)return;status.textContent=PathfindrArchive.state().error;
        if(!records.length)root.append(el('p','Your first finished round will appear here. Or create a challenge in Miami now.'));
        for(const record of records){const row=el('section',null,'saved-run');row.append(el('h3',record.payload.title),el('p',`${new Date(record.createdAt).toLocaleDateString()} · ${record.payload.rounds.length} rounds${record.pinned?' · Saved':''}`));
            const buttons=el('div',null,'share-actions');buttons.append(button('View full run',()=>show(record.payload)),button(record.pinned?'Saved':'Save run',async()=>{await PathfindrArchive.pin(record.id);await library();}));
            record.payload.rounds.forEach((r,i)=>buttons.append(button(`Round ${i+1}`,()=>show(PathfindrArchive.select(record.payload,i)))));row.append(buttons);root.append(row);}
    }
    async function openInput(input){const value=input.trim(),match=value.match(/(?:#share=|^share:)([0-9a-f-]{36})$/i);return match?PathfindrShareCloud.get(match[1]):PathfindrShareData.decode(value);}
    function importer(){const root=shell('Open a shared route'),field=el('textarea');field.setAttribute('aria-label','Paste Pathfindr link or code');field.placeholder='Paste a Pathfindr link, share ID, or PF1 code';root.append(field,button('Open route',async()=>show(await openInput(field.value))));
        const label=el('label','Or choose a .pathfindr file'),file=el('input');file.type='file';file.accept='.pathfindr,text/plain';label.append(file);root.append(label);file.addEventListener('change',async()=>{try{const f=file.files[0];if(!f)return;if(f.size>PathfindrShareData.MAX_CODE)throw Error('File is too large.');await show(await PathfindrShareData.decode(await f.text()));}catch(e){report(e);}});
    }
    function creator(){
        const root=shell('Create a Miami challenge');root.append(el('p','Choose two named places or streets in Downtown & Brickell. Points snap to the nearest road node. Other cities can be shared from completed rounds.'));
        const pack=window.PathfindrCityPacks.miami,choices=new Map(pack.labels.map(p=>[p.name,p.pos]));const list=el('datalist');list.id='share-place-options';for(const name of choices.keys()){const option=el('option');option.value=name;list.append(option);}root.append(list);
        const inputs=[];for(const text of ['Start place or street','End place or street']){const label=el('label',text),input=el('input');input.setAttribute('list',list.id);label.append(input);root.append(label);inputs.push(input);}
        root.append(button('Preview challenge',async()=>{
            const nodes=pack.roads.elements.filter(e=>e.type==='node');const nearest=name=>{const p=choices.get(name);if(!p)throw Error('Choose a place from each suggested list.');let best=null,distance=Infinity;for(const n of nodes){const d=(n.lon-p[0])**2+(n.lat-p[1])**2;if(d<distance){best=n;distance=d;}}return [best.lon,best.lat];};
            const map={packId:'miami',version:pack.roadsSha256,location:pack.location},round={map:0,start:nearest(inputs[0].value),end:nearest(inputs[1].value),difficulty:'medium',pickups:[]};
            PathfindrShareData.resolve(map,round);await show({v:1,kind:'challenge',title:`${inputs[0].value} → ${inputs[1].value}`.slice(0,100),maps:[map],rounds:[round]});
        }));
    }
    function init(){
        document.getElementById('saved-routes-btn').addEventListener('click',()=>library().catch(report));
        document.getElementById('create-route-btn').addEventListener('click',creator);
        document.getElementById('share-round-btn').addEventListener('click',()=>{try{prepare(PathfindrArchive.selected(GameState.currentRound-1)).catch(report);}catch(e){shell('Share route');report(e);}});
        document.getElementById('save-round-btn').addEventListener('click',async e=>{const b=e.currentTarget;try{const run=PathfindrArchive.current();if(!run)throw Error('Finish a round first.');await PathfindrArchive.pin(run.id);b.textContent='Saved';}catch(err){shell('Save route');report(err);}});
        document.getElementById('share-run-btn').addEventListener('click',()=>{try{prepare(PathfindrArchive.selected()).catch(report);}catch(e){shell('Share run');report(e);}});
        const openHash=()=>{if(location.hash.startsWith('#pf=')||location.hash.startsWith('#share=')){importer();openInput(location.hash).then(show).catch(report);}};
        openHash();window.addEventListener('hashchange',openHash);
    }
    window.PathfindrShareUI={library,show,prepare,creator,init};
    document.addEventListener('DOMContentLoaded',init);
})();
