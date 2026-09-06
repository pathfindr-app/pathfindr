/* Soundtrack analysis only: no microphone access, no synthetic beat animation. */
(() => {
    const sources = new WeakMap();
    const state = { bass: 0, mid: 0, high: 0, energy: 0, packets:[], musicTime:0, source:'live', active:false, enabled: true, connected: false, status: 'Waiting for music' };
    let analyser, bins, player, context;
    let track='',previousTime=0,validAfter=0,eventIndex=0,previousBins,fluxMean=0,lastAttack=-10;
    const preference = (() => { try { return localStorage.getItem('pathfindr_audio_motion'); } catch { return null; } })();
    state.enabled = preference !== 'off';
    const clearCharges=()=>{state.packets=[];state.active=false;};
    matchMedia('(prefers-reduced-motion: reduce)').addEventListener?.('change',e=>{if(e.matches)clearCharges();});
    document.addEventListener?.('visibilitychange',()=>{if(document.hidden)clearCharges();});
    window.PathfindrAudio = {
        state,
        attach(audio, ctx) {
            if (!audio || !ctx || sources.has(audio)) return;
            // Connect to the existing audio context exactly once. Music retains its
            // own element volume/mute controls and never passes through SFX gain.
            try {
                const source = ctx.createMediaElementSource(audio);
                analyser = ctx.createAnalyser();
                analyser.fftSize = 2048;
                analyser.smoothingTimeConstant = 0.15;
                analyser.minDecibels = -85;
                analyser.maxDecibels = -20;
                source.connect(analyser);
                analyser.connect(ctx.destination);
                sources.set(audio, source);
                bins = new Uint8Array(analyser.frequencyBinCount);
                previousBins = new Float32Array(analyser.frequencyBinCount);
                player = audio;
                context = ctx;
                state.connected = true;
            } catch (error) { console.warn('[Audio motion] Analysis unavailable:', error.message); }
        },
        setEnabled(enabled) {
            state.enabled = !!enabled;
            if(!enabled)clearCharges();
            try { localStorage.setItem('pathfindr_audio_motion', enabled ? 'on' : 'off'); } catch {}
        },
        update(deltaMs, muted = false) {
            const active = state.enabled && analyser && !muted && !player.paused &&
                !player.muted && player.volume > 0 && context.state === 'running' &&
                !document.hidden && !matchMedia('(prefers-reduced-motion: reduce)').matches;
            state.active=!!active;
            const clock=Number(player?.currentTime)||0;
            let name='';try{name=decodeURIComponent((player?.currentSrc||player?.src||'').split('/').at(-1));}catch{}
            const analysis=window.PathfindrSoundtrackAnalysis?.tracks[name];
            // Bundled tracks already have exact-time spectral analysis. Avoid a
            // redundant FFT readback every frame; retain live analysis for new audio.
            if (active && !analysis) analyser.getByteFrequencyData(bins);
            if(name!==track||clock<previousTime||clock-previousTime>1){
                track=name;validAfter=clock;eventIndex=0;state.packets=[];lastAttack=clock;previousBins?.fill(0);fluxMean=0;
                if(analysis)while(eventIndex<analysis.events.length&&analysis.events[eventIndex][0]<clock)eventIndex++;
            }
            previousTime=clock;state.musicTime=clock;state.source=analysis?'soundtrack':'live';
            if(!active){state.packets=[];validAfter=clock;}
            state.status = !state.enabled ? 'Off' : muted ? 'Muted' : !analyser ? 'Waiting for music' : player.paused ? 'Music paused' : context.state !== 'running' ? 'Audio suspended' : active ? 'Listening' : 'Motion paused';
            const band = (lo, hi) => {
                if (!active) return 0;
                const resolution = context.sampleRate / analyser.fftSize;
                const start = Math.max(1, Math.floor(lo / resolution));
                const end = Math.min(bins.length, Math.max(start + 1, Math.ceil(hi / resolution)));
                let sum = 0;
                for (let i = start; i < end; i++) sum += bins[i] / 255;
                return Math.min(1, sum / Math.max(1, end - start) * 1.65);
            };
            const targets = active&&analysis ? {bass:0,mid:0,high:0} : { bass: band(40, 250), mid: band(250, 2200), high: band(2200, 9000) };
            if(active&&analysis){
                const position=Math.max(0,(clock-analysis.offset)/analysis.step),i=Math.min(analysis.bands.length-1,Math.floor(position)),f=position-Math.floor(position);
                const a=analysis.bands[i],b=analysis.bands[Math.min(i+1,analysis.bands.length-1)];
                ['bass','mid','high'].forEach((key,k)=>targets[key]=(a[k]*(1-f)+b[k]*f)/255);
                while(eventIndex<analysis.events.length&&analysis.events[eventIndex][0]<=clock){
                    const [time,strength,kind]=analysis.events[eventIndex++];
                    if(time>=validAfter&&clock-time<.25)state.packets.push({time,strength,kind});
                }
            }else if(active){
                let flux=0;for(let i=1;i<bins.length;i++){const value=Math.log1p(bins[i]/32);flux+=Math.max(0,value-previousBins[i]);previousBins[i]=value;}
                flux/=bins.length;fluxMean+=(flux-fluxMean)*.08;
                if(flux>Math.max(.025,fluxMean*1.6)&&clock-lastAttack>.38){state.packets.push({time:clock,strength:Math.min(1,flux*5),kind:targets.bass>targets.high?0:2});lastAttack=clock;}
            }
            state.packets=state.packets.filter(p=>clock-p.time<4).slice(-8);
            targets.energy = targets.bass * 0.55 + targets.mid * 0.35 + targets.high * 0.1;
            for (const key of Object.keys(targets)) {
                const tau = targets[key] > state[key] ? 65 : 260;
                state[key] += (targets[key] - state[key]) * (1 - Math.exp(-Math.min(deltaMs, 100) / tau));
            }
            return state;
        }
    };
})();
