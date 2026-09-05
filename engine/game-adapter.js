/* Narrow bridge to the legacy game. New engine modules do not own game rules. */
function getRouteCameraPadding() {
    const height = GameState.map.getContainer().clientHeight;
    const recap = document.getElementById('results-panel');
    const bottom = GameController.phase === GamePhase.RESULTS && recap.classList.contains('visible')
        ? Math.min(recap.getBoundingClientRect().height + 24, height * 0.58)
        : Math.min(window.innerWidth <= 700 ? 86 : 135, height * 0.3);
    return { top: Math.min(window.innerWidth<=700?96:105, height * 0.2), bottom, left: 35, right: 35 };
}

function initCityControls() {
    const map = GameState.map;
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
    PathfindrTrace.init({
        surface, canDraw: shouldHandlePathInput,
        nearTip(p, radius) {
            const node = GameState.nodes.get(getActivePathAnchorNode());
            if (!node) return false;
            const tip = map.project([node.lng, node.lat]), local = position(p);
            return Math.hypot(tip.x - local.x, tip.y - local.y) <= radius;
        },
        snapshot: () => ({ nodes: [...GameState.userPathNodes], points: [...GameState.userDrawnPoints], graph: GameState.roadGraphVersion }),
        changed: saved => GameState.userPathNodes.length !== saved.nodes.length || GameState.userPathNodes.some((id,i)=>id!==saved.nodes[i]),
        restore(saved) {
            if (saved.graph !== GameState.roadGraphVersion) return;
            GameState.userPathNodes = [...saved.nodes];
            GameState.userDrawnPoints = [...saved.points];
            recalculateUserDistance(); updateAllDistanceDisplays(); clearSnapPreview(); redrawUserPath();
        },
        begin() {
            panWasEnabled = map.dragPan.isEnabled(); map.dragPan.disable(); map.stop(); clearSnapPreview();
            GameState.suppressNextMapClickUntil = Date.now() + 1000;
            if (GameState.gameMode === 'challenge' && !GameState.challengeState.startTime) GameState.challengeState.startTime = Date.now();
        },
        commit(p) {
            const local = position(p), geo = map.unproject([local.x, local.y]);
            if (PathfindrTrace.backtrack(local, GameState.userPathNodes, id => {
                const n=GameState.nodes.get(id);return n?map.project([n.lng,n.lat]):null;
            })) {
                recalculateUserDistance();updateAllDistanceDisplays();clearSnapPreview();redrawUserPath();return true;
            }
            const anchorId = getActivePathAnchorNode(), anchor = GameState.nodes.get(anchorId);
            const target = findSnapTarget(geo.lat, geo.lng);
            if (!anchor || !target) return false;
            const coords = buildPreviewPathCoords(anchorId, target);
            if (coords.length < 2) return false;
            const snap = coords.at(-1), tip = map.project([snap.lng, snap.lat]);
            if (Math.hypot(tip.x - local.x, tip.y - local.y) > 20) return false;
            // Reject computed detours outside the player's actual gesture corridor.
            if (!PathfindrRouteInput.followsGesture(coords,map,anchor,geo,22)) return false;
            return commitPathPoint(geo.lat, geo.lng, { quiet: true });
        },
        end(submit) {
            if (panWasEnabled) map.dragPan.enable();
            GameState.suppressNextMapClickUntil = Date.now() + 500;
            if (!submit || !shouldHandlePathInput()) return;
            const last = GameState.nodes.get(GameState.userPathNodes.at(-1)), end = GameState.nodes.get(GameState.endNode);
            if (last && end && GameState.userPathNodes.length >= CONFIG.minRoutePoints && haversineDistance(last.lat, last.lng, end.lat, end.lng) < 0.03) {
                // Completion is deliberately deferred until the stroke is released.
                if (GameState.userPathNodes.at(-1) === GameState.endNode) {
                    if (GameState.gameMode === 'explorer') showExplorerComparison(); else submitRoute();
                } else commitPathPoint(end.lat, end.lng, { quiet: true });
            }
        }
    });
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
        const enabled = e.currentTarget.getAttribute('aria-pressed') !== 'true';
        e.currentTarget.setAttribute('aria-pressed', String(enabled));
        map.easeTo({ pitch: enabled ? 38 : 0, duration: matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 700 });
    });
    map.on('pitchend', () => document.getElementById('city-depth-btn').setAttribute('aria-pressed', String(map.getPitch() > 1)));
    window.render_game_to_text = () => JSON.stringify({
        build: PathfindrConfig.app.buildId, phase: GameController.phase, mode: GameState.gameMode,
        coordinates: 'Screen pixels, origin top left, x right, y down', input: PathfindrTrace.mode, tracing: PathfindrTrace.active,
        city: GameState.currentCity?.name, cityScene: PathfindrCity.state, world:PathfindrWorldRenderer.state, emission:PathfindrEmission.state, collections:PathfindrCollections.state(),audio: PathfindrAudio.state,
        assisted:!!GameState.assistedRound, pendingReports:window.PathfindrRouteReports?.pending()||0,
        round: GameState.currentRound, distanceKm: GameState.userDistance, pathNodes: GameState.userPathNodes.length,
        sharing:{archive:window.PathfindrArchive?.state(),friendChallenge:window.PathfindrSharedGame?.active(),rounds:window.PathfindrSharedGame?.roundCount()||null},
        preparation:{rounds:[...GameState.endpointSelection.preparedRounds.keys()],nextCity:GameState.continuousPlay.preloadedCity?.name||null,roadsReady:!!GameState.continuousPlay.preloadedData,details:GameState.continuousPlay.preloadDetails||'idle'},
        lobbyPreparation:lobbyCityPreparation?.state()||{},
        start: projectNode(GameState.startNode), end: projectNode(GameState.endNode)
    });
    function projectNode(id) { const p = GameState.nodes.get(id); return p ? map.project([p.lng, p.lat]) : null; }
}
