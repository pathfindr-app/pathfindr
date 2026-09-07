/* Narrow bridge to the legacy game. New engine modules do not own game rules. */
function createRouteRevealCamera(path){
    const graph=GameState.roadGraphVersion,round=GameState.currentRound,mode=GameState.gameMode;
    const start=GameState.nodes.get(GameState.startNode);
    const points=[...GameState.userPathNodes,...path].map(id=>GameState.nodes.get(id)).filter(Boolean);
    if(!start||points.length<2)return {begin:async()=>{},update(){},dispose(){}};
    return PathfindrRevealCamera.create({map:GameState.map,start,points,padding:getRouteCameraPadding(),motion:PathfindrMotion,
        valid:()=>GameState.roadGraphVersion===graph&&GameState.currentRound===round&&GameState.gameMode===mode&&
            [GamePhase.PLAYING,GamePhase.VISUALIZING].includes(GameController.phase)});
}

function nudgeRouteHeadIntoView(){
    const map=GameState.map,node=GameState.nodes.get(getActivePathAnchorNode());if(!node)return;
    const rect=map.getCanvas().getBoundingClientRect(),tip=map.project([node.lng,node.lat]);
    const pad=getRouteCameraPadding();
    const mobile=matchMedia('(pointer: coarse)').matches||rect.width<=700;
    const zone=PathfindrEdgePan.zones(rect,{top:pad.top,bottom:pad.bottom},mobile);
    let x=Math.max(zone.x,Math.min(rect.width-zone.x,tip.x));
    let y=Math.max(pad.top+zone.y,Math.min(rect.height-pad.bottom-zone.y,tip.y));
    if(Math.hypot(tip.x-x,tip.y-y)<1)return;
    if(mobile){x=rect.width/2;y=(pad.top+rect.height-pad.bottom)/2;}
    const center=map.project(map.getCenter());
    const distance=Math.hypot(tip.x-x,tip.y-y);
    map.easeTo({center:map.unproject([center.x+tip.x-x,center.y+tip.y-y]),
        duration:matchMedia('(prefers-reduced-motion: reduce)').matches?0:Math.min(mobile?480:600,280+distance*.8),
        easing:t=>1-Math.pow(1-t,3)});
}
function getRouteCameraPadding() {
    const height = GameState.map.getContainer().clientHeight;
    const recap = document.getElementById('results-panel');
    const bottom = GameController.phase === GamePhase.RESULTS && recap.classList.contains('visible')
        ? Math.min(recap.getBoundingClientRect().height + 24, height * 0.58)
        : Math.min(window.innerWidth <= 700 ? 86 : 135, height * 0.3);
    const hud=document.getElementById('gameplay-hud');
    const hudHeight=hud?.getBoundingClientRect().height || (window.innerWidth<=700?78:85);
    return { top: Math.min(hudHeight+12, height * 0.25), bottom, left: 35, right: 35 };
}

function initCityControls() {
    const map = GameState.map;
    let resultResizeFrame=0;
    map.on('resize',()=>{
        cancelAnimationFrame(resultResizeFrame);
        if(GameController.phase===GamePhase.RESULTS)resultResizeFrame=requestAnimationFrame(()=>{
            if(GameController.phase===GamePhase.RESULTS)centerOnRoute();
        });
    });
    const surface = map.getCanvasContainer();
    PathfindrCollections.init(map);
    document.getElementById('graphics-quality').addEventListener('change',e=>PathfindrWorldRenderer.setQuality(e.target.value));
    document.getElementById('route-undo-btn').addEventListener('click',()=>{if(shouldHandlePathInput())undoLastSegment();});
    document.addEventListener('keydown',e=>{
        if(e.target?.closest?.('input,textarea,select,[contenteditable="true"]'))return;
        if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z'&&!e.shiftKey&&shouldHandlePathInput()){
            e.preventDefault();PathfindrTrace.cancel?.();undoLastSegment();
        }
    });
    document.getElementById('route-recenter-btn').addEventListener('click', centerOnRoute);
    const position = p => {
        const rect = map.getCanvas().getBoundingClientRect();
        return { x: p.x - rect.left, y: p.y - rect.top };
    };
    let panWasEnabled = true;
    let edgeVelocity={x:0,y:0},edgeTravel=0,traceReport=null,panPointer=null,pointerVelocity={x:0,y:0};
    PathfindrTrace.init({
        surface, canDraw: shouldHandlePathInput,
        nearTip(p, radius) {
            const node = GameState.nodes.get(getActivePathAnchorNode());
            if (!node) return false;
            const tip = map.project([node.lng, node.lat]), local = position(p);
            return Math.hypot(tip.x - local.x, tip.y - local.y) <= radius;
        },
        snapshot: () => ({ nodes: [...GameState.userPathNodes], points: [...GameState.userDrawnPoints], graph: GameState.roadGraphVersion }),
        canResume(p,radius){
            if(!this.nearTip(p,radius))return false;
            const local=position(p),geo=map.unproject([local.x,local.y]);
            const anchorId=getActivePathAnchorNode(),anchor=GameState.nodes.get(anchorId),target=findSnapTarget(geo.lat,geo.lng);
            if(!anchor||!target)return false;
            const coords=buildPreviewPathCoords(anchorId,target),end=coords.at(-1);
            if(!end||coords.length<2)return false;
            const snap=map.project([end.lng,end.lat]);
            return Math.hypot(snap.x-local.x,snap.y-local.y)<=24&&PathfindrRouteInput.followsGesture(coords,map,anchor,geo,22);
        },
        changed: saved => GameState.userPathNodes.length !== saved.nodes.length || GameState.userPathNodes.some((id,i)=>id!==saved.nodes[i]),
        restore(saved) {
            if (saved.graph !== GameState.roadGraphVersion) return;
            GameState.userPathNodes = [...saved.nodes];
            GameState.userDrawnPoints = [...saved.points];
            recalculateUserDistance(); updateAllDistanceDisplays(); clearSnapPreview(); redrawUserPath();
        },
        begin() {
            traceReport={build:PathfindrConfig.app.buildId,city:GameState.currentCity?.name,mode:GameState.gameMode,pointer:PathfindrTrace.pointerType,zoom:map.getZoom(),pitch:map.getPitch(),viewport:[innerWidth,innerHeight],attempts:0,accepted:0,rejected:0,resumed:false,lastMismatch:null};
            edgeVelocity={x:0,y:0};edgeTravel=0;panPointer=null;pointerVelocity={x:0,y:0};
            panWasEnabled = map.dragPan.isEnabled(); map.dragPan.disable(); map.stop(); clearSnapPreview();
            GameState.suppressNextMapClickUntil = Date.now() + 1000;
            if (GameState.gameMode === 'challenge' && !GameState.challengeState.startTime) GameState.challengeState.startTime = Date.now();
        },
        pan(p,dt) {
            const hit=document.elementFromPoint(p.x,p.y);
            if(hit?.closest('button,a,input,select,.route-wheel,.collection-marker')){edgeVelocity={x:0,y:0};return false;}
            const rect=map.getCanvas().getBoundingClientRect();
            const node=GameState.nodes.get(getActivePathAnchorNode());
            if(!node)return false;
            const tip=map.project([node.lng,node.lat]);
            const mobile=PathfindrTrace.pointerType==='touch'||rect.width<=700;
            if(!mobile&&Math.hypot(p.x-rect.left-tip.x,p.y-rect.top-tip.y)>120){edgeVelocity={x:0,y:0};return false;}
            const blendMotion=1-Math.exp(-dt/.09);
            const vx=panPointer?(p.x-panPointer.x)/Math.max(.008,dt):0,vy=panPointer?(p.y-panPointer.y)/Math.max(.008,dt):0;
            pointerVelocity.x+=(vx-pointerVelocity.x)*blendMotion;pointerVelocity.y+=(vy-pointerVelocity.y)*blendMotion;panPointer={...p};
            const padding=getRouteCameraPadding();padding.left=0;padding.right=0;
            const focus=mobile?PathfindrEdgePan.focus(p,{x:tip.x+rect.left,y:tip.y+rect.top},pointerVelocity):p;
            if(p.x<rect.left||p.x>rect.right||p.y<rect.top||p.y>rect.bottom)return false;
            focus.x=Math.max(rect.left+.01,Math.min(rect.right-.01,focus.x));focus.y=Math.max(rect.top+.01,Math.min(rect.bottom-.01,focus.y));
            const target=PathfindrEdgePan.velocity(focus,rect,padding,undefined,{mobile});
            const stopping=!target.x&&!target.y;
            const blend=1-Math.exp(-dt/(stopping?.12:mobile?.09:.16));
            edgeVelocity.x+=(target.x-edgeVelocity.x)*blend;edgeVelocity.y+=(target.y-edgeVelocity.y)*blend;
            const dx=edgeVelocity.x*dt,dy=edgeVelocity.y*dt;
            if(Math.hypot(dx,dy)<.05)return false;
            const center=map.project(map.getCenter());
            map.jumpTo({center:map.unproject([center.x+dx,center.y+dy])});
            edgeTravel+=Math.hypot(dx,dy);if(edgeTravel<7)return false;edgeTravel=0;return true;
        },
        commit(p) {
            if(document.elementFromPoint(p.x,p.y)?.closest('button,a,input,select,#route-wheel'))return false;
            const local = position(p), geo = map.unproject([local.x, local.y]);
            if (PathfindrTrace.backtrack(local, GameState.userPathNodes, id => {
                const n=GameState.nodes.get(id);return n?map.project([n.lng,n.lat]):null;
            },(from,to,t)=>{
                if(t<.02)return from;if(t>.98)return to;
                const a=GameState.nodes.get(from),b=GameState.nodes.get(to);
                const screenA=map.project([a.lng,a.lat]),screenB=map.project([b.lng,b.lat]);
                const p=map.unproject([screenA.x+(screenB.x-screenA.x)*t,screenA.y+(screenB.y-screenA.y)*t]);
                // Split the actual connected segment, not a nearby parallel street.
                const base=a.virtual?a:b.virtual?b:null;
                return createVirtualNode({lng:p.lng,lat:p.lat},base?.fromNode??from,base?.toNode??to);
            })) {
                recalculateUserDistance();updateAllDistanceDisplays();clearSnapPreview();redrawUserPath();return true;
            }
            if(this.tryFinish(p))return true;
            const anchorId = getActivePathAnchorNode(), anchor = GameState.nodes.get(anchorId);
            const target = findSnapTarget(geo.lat, geo.lng);
            if (!anchor || !target) return false;
            const coords = buildPreviewPathCoords(anchorId, target);
            if (coords.length < 2) return false;
            const snap = coords.at(-1), tip = map.project([snap.lng, snap.lat]);
            if (Math.hypot(tip.x - local.x, tip.y - local.y) > 20) return false;
            // Reject computed detours outside the player's actual gesture corridor.
            if (!PathfindrRouteInput.followsGesture(coords,map,anchor,geo,22)) return false;
            const accepted=commitPathPoint(geo.lat, geo.lng, { quiet: true });
            if(accepted)this.tryFinish(p);
            return accepted;
        },
        isFinished:()=>GameState.userPathNodes.at(-1)===GameState.endNode,
        tryFinish(p){
            if(!p||!shouldHandlePathInput()||GameState.userPathNodes.length<CONFIG.minRoutePoints)return false;
            if(document.elementFromPoint(p.x,p.y)?.closest('button,a,input,select,#route-wheel,.collection-marker'))return false;
            const path=PathfindrTraceGuide.finishPath({start:getActivePathAnchorNode(),end:GameState.endNode,
                edges:GameState.edges,nodes:GameState.nodes,pointer:position(p),touch:PathfindrTrace.pointerType==='touch',
                project:n=>map.project([n.lng,n.lat]),distance:(a,b)=>haversineDistance(a.lat,a.lng,b.lat,b.lng)});
            if(!path)return false;
            GameState.userPathNodes.push(...path.slice(1));
            if(traceReport)traceReport.finishAssisted ||= path.length>1;
            recalculateUserDistance();updateAllDistanceDisplays();clearSnapPreview();redrawUserPath();
            return true;
        },
        end(submit,p) {
            if(submit)this.tryFinish(p);
            if(traceReport){traceReport.interrupted=!submit;window.PathfindrRouteReports?.recordTrace(traceReport);traceReport=null;}
            edgeVelocity={x:0,y:0};
            if (panWasEnabled) map.dragPan.enable();
            GameState.suppressNextMapClickUntil = Date.now() + 500;
            if (!submit || !shouldHandlePathInput()) return;
            if (GameState.userPathNodes.length >= CONFIG.minRoutePoints && GameState.userPathNodes.at(-1) === GameState.endNode) {
                GameHaptics.pathComplete();
                if (GameState.gameMode === 'explorer') showExplorerComparison(); else submitRoute();
            }
        },
        progressKey:()=>`${GameState.userPathNodes.length}:${getActivePathAnchorNode()}:${GameState.userDistance}`,
        tipGap(p){
            const node=GameState.nodes.get(getActivePathAnchorNode());if(!node)return 0;
            const tip=map.project([node.lng,node.lat]),local=position(p);
            return Math.hypot(tip.x-local.x,tip.y-local.y);
        },
        warn(){
            if(traceReport)traceReport.stallWarnings=(traceReport.stallWarnings||0)+1;
            if(GameHaptics.Haptics)GameHaptics.warning();
            else if(typeof navigator.vibrate==='function')navigator.vibrate([35,45,35]);
        },
        diagnose(p,accepted,resumed=false){
            if(!traceReport)return;traceReport.attempts++;traceReport[accepted?'accepted':'rejected']++;traceReport.resumed ||= resumed;
            const local=position(p),requested=map.unproject([local.x,local.y]),node=GameState.nodes.get(getActivePathAnchorNode());
            if(!node)return;const snapped=map.project([node.lng,node.lat]);
            const gap=Math.hypot(snapped.x-local.x,snapped.y-local.y);
            if(!accepted||gap>12)traceReport.lastMismatch={accepted,gapPx:Math.round(gap),requested:[+requested.lng.toFixed(5),+requested.lat.toFixed(5)],head:[+node.lng.toFixed(5),+node.lat.toFixed(5)]};
        }
    });
    document.getElementById('export-trace-diagnostics').addEventListener('click',()=>PathfindrRouteReports.exportTraces());
    for (const type of ['touchstart', 'touchmove']) surface.addEventListener(type, e => {
        if (PathfindrTrace.active) { e.preventDefault(); e.stopImmediatePropagation(); }
    }, { capture: true, passive: false });
    document.querySelectorAll('[data-input-mode]').forEach(button => button.addEventListener('click', () => PathfindrTrace.setMode(button.dataset.inputMode)));
    document.getElementById('audio-motion-btn').setAttribute('aria-pressed', String(PathfindrAudio.state.enabled));
    document.getElementById('audio-motion-btn').addEventListener('click', e => {
        PathfindrAudio.setEnabled(!PathfindrAudio.state.enabled);
        e.currentTarget.setAttribute('aria-pressed', String(PathfindrAudio.state.enabled));
    });
    document.getElementById('city-depth-btn').addEventListener('click', e => {
        window.PathfindrVisualizerCamera?.hold();
        const enabled = e.currentTarget.getAttribute('aria-pressed') !== 'true';
        e.currentTarget.setAttribute('aria-pressed', String(enabled));
        map.easeTo({ pitch: enabled ? 38 : 0, duration: matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 700 });
    });
    map.on('pitchend', () => document.getElementById('city-depth-btn').setAttribute('aria-pressed', String(map.getPitch() > 1)));
    window.render_game_to_text = () => JSON.stringify({
        build: PathfindrConfig.app.buildId, phase: GameController.phase, mode: GameState.gameMode,
        coordinates: 'Screen pixels, origin top left, x right, y down', input: PathfindrTrace.mode, tracing: PathfindrTrace.active, traceStalled:!!PathfindrTrace.stalled,
        city: GameState.currentCity?.name, cityScene: PathfindrCity.state, world:PathfindrWorldRenderer.state, emission:PathfindrEmission.state, collections:PathfindrCollections.state(),audio: PathfindrAudio.state,
        musicalNetworkEdges:GameState.vizState.musicalTree?.segments.length||0,
        historyRounds:RoundHistory.rounds.length,historyAudioDrive:window.PathfindrMusicalRoutes?.historyEnergy(PathfindrAudio.state)||0,
        assisted:!!GameState.assistedRound, pendingReports:window.PathfindrRouteReports?.pending()||0,
        round: GameState.currentRound, distanceKm: GameState.userDistance, pathNodes: GameState.userPathNodes.length,
        sharing:{archive:window.PathfindrArchive?.state(),friendChallenge:window.PathfindrSharedGame?.active(),rounds:window.PathfindrSharedGame?.roundCount()||null},
        preparation:{rounds:[...GameState.endpointSelection.preparedRounds.keys()],nextCity:GameState.continuousPlay.preloadedCity?.name||null,roadsReady:!!GameState.continuousPlay.preloadedData,details:GameState.continuousPlay.preloadDetails||'idle'},
        lobbyPreparation:lobbyCityPreparation?.state()||{},
        coordinateFrame:window.PathfindrMapFrame?.state(),
        camera:window.PathfindrVisualizerCamera?.state(),
        start: projectNode(GameState.startNode), end: projectNode(GameState.endNode)
    });
    function projectNode(id) { const p = GameState.nodes.get(id); return p ? map.project([p.lng, p.lat]) : null; }
}
