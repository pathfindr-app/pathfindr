/* Soundtrack analysis only: no microphone access, no synthetic beat animation. */
(() => {
    const sources = new WeakMap();
    const state = { bass: 0, mid: 0, high: 0, energy: 0, enabled: true, connected: false, status: 'Waiting for music' };
    let analyser, bins, player, context;
    const preference = (() => { try { return localStorage.getItem('pathfindr_audio_motion'); } catch { return null; } })();
    state.enabled = preference !== 'off';
    window.PathfindrAudio = {
        state,
        attach(audio, ctx) {
            if (!audio || !ctx || sources.has(audio)) return;
            // Connect to the existing audio context exactly once. Music retains its
            // own element volume/mute controls and never passes through SFX gain.
            try {
                const source = ctx.createMediaElementSource(audio);
                analyser = ctx.createAnalyser();
                analyser.fftSize = 512;
                analyser.smoothingTimeConstant = 0.45;
                analyser.minDecibels = -85;
                analyser.maxDecibels = -20;
                source.connect(analyser);
                analyser.connect(ctx.destination);
                sources.set(audio, source);
                bins = new Uint8Array(analyser.frequencyBinCount);
                player = audio;
                context = ctx;
                state.connected = true;
            } catch (error) { console.warn('[Audio motion] Analysis unavailable:', error.message); }
        },
        setEnabled(enabled) {
            state.enabled = !!enabled;
            try { localStorage.setItem('pathfindr_audio_motion', enabled ? 'on' : 'off'); } catch {}
        },
        update(deltaMs, muted = false) {
            const active = state.enabled && analyser && !muted && !player.paused &&
                !player.muted && player.volume > 0 && context.state === 'running' &&
                !document.hidden && !matchMedia('(prefers-reduced-motion: reduce)').matches;
            if (active) analyser.getByteFrequencyData(bins);
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
            const targets = { bass: band(40, 250), mid: band(250, 2200), high: band(2200, 9000) };
            targets.energy = targets.bass * 0.55 + targets.mid * 0.35 + targets.high * 0.1;
            for (const key of Object.keys(targets)) {
                const tau = targets[key] > state[key] ? 65 : 260;
                state[key] += (targets[key] - state[key]) * (1 - Math.exp(-Math.min(deltaMs, 100) / tau));
            }
            return state;
        }
    };
})();
