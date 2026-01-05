/**
 * pathfindr
 * A maze game using real-world maps
 * Blade Runner Edition - Web Audio synthesis + optimized visualization
 */

// =============================================================================
// CONFIGURATION
// =============================================================================

const CONFIG = {
    defaultLocation: {
        lat: 47.6062,
        lng: -122.3321,
        zoom: 15,
        name: "Seattle, WA"
    },

    // US Cities for random selection
    usCities: [
        { lat: 40.7128, lng: -74.0060, name: "New York, NY", zoom: 15 },
        { lat: 34.0522, lng: -118.2437, name: "Los Angeles, CA", zoom: 15 },
        { lat: 41.8781, lng: -87.6298, name: "Chicago, IL", zoom: 15 },
        { lat: 29.7604, lng: -95.3698, name: "Houston, TX", zoom: 15 },
        { lat: 33.4484, lng: -112.0740, name: "Phoenix, AZ", zoom: 15 },
        { lat: 39.9526, lng: -75.1652, name: "Philadelphia, PA", zoom: 15 },
        { lat: 29.4241, lng: -98.4936, name: "San Antonio, TX", zoom: 15 },
        { lat: 32.7767, lng: -96.7970, name: "Dallas, TX", zoom: 15 },
        { lat: 37.3382, lng: -121.8863, name: "San Jose, CA", zoom: 15 },
        { lat: 30.2672, lng: -97.7431, name: "Austin, TX", zoom: 15 },
        { lat: 37.7749, lng: -122.4194, name: "San Francisco, CA", zoom: 15 },
        { lat: 47.6062, lng: -122.3321, name: "Seattle, WA", zoom: 15 },
        { lat: 39.7392, lng: -104.9903, name: "Denver, CO", zoom: 15 },
        { lat: 42.3601, lng: -71.0589, name: "Boston, MA", zoom: 15 },
        { lat: 33.7490, lng: -84.3880, name: "Atlanta, GA", zoom: 15 },
        { lat: 25.7617, lng: -80.1918, name: "Miami, FL", zoom: 15 },
        { lat: 38.9072, lng: -77.0369, name: "Washington, DC", zoom: 15 },
        { lat: 36.1627, lng: -86.7816, name: "Nashville, TN", zoom: 15 },
        { lat: 45.5152, lng: -122.6784, name: "Portland, OR", zoom: 15 },
        { lat: 35.2271, lng: -80.8431, name: "Charlotte, NC", zoom: 15 },
        { lat: 32.7157, lng: -117.1611, name: "San Diego, CA", zoom: 15 },
        { lat: 44.9778, lng: -93.2650, name: "Minneapolis, MN", zoom: 15 },
        { lat: 39.0997, lng: -94.5786, name: "Kansas City, MO", zoom: 15 },
        { lat: 36.1699, lng: -115.1398, name: "Las Vegas, NV", zoom: 15 },
        { lat: 43.0389, lng: -87.9065, name: "Milwaukee, WI", zoom: 15 },
    ],

    // Global Cities for random selection
    globalCities: [
        { lat: 51.5074, lng: -0.1278, name: "London, UK", zoom: 15 },
        { lat: 48.8566, lng: 2.3522, name: "Paris, France", zoom: 15 },
        { lat: 35.6762, lng: 139.6503, name: "Tokyo, Japan", zoom: 15 },
        { lat: 52.5200, lng: 13.4050, name: "Berlin, Germany", zoom: 15 },
        { lat: 55.7558, lng: 37.6173, name: "Moscow, Russia", zoom: 15 },
        { lat: 39.9042, lng: 116.4074, name: "Beijing, China", zoom: 15 },
        { lat: -33.8688, lng: 151.2093, name: "Sydney, Australia", zoom: 15 },
        { lat: 19.4326, lng: -99.1332, name: "Mexico City, Mexico", zoom: 15 },
        { lat: -23.5505, lng: -46.6333, name: "São Paulo, Brazil", zoom: 15 },
        { lat: 28.6139, lng: 77.2090, name: "New Delhi, India", zoom: 15 },
        { lat: 31.2304, lng: 121.4737, name: "Shanghai, China", zoom: 15 },
        { lat: 41.9028, lng: 12.4964, name: "Rome, Italy", zoom: 15 },
        { lat: 40.4168, lng: -3.7038, name: "Madrid, Spain", zoom: 15 },
        { lat: 52.3676, lng: 4.9041, name: "Amsterdam, Netherlands", zoom: 15 },
        { lat: 59.3293, lng: 18.0686, name: "Stockholm, Sweden", zoom: 15 },
        { lat: 50.0755, lng: 14.4378, name: "Prague, Czechia", zoom: 15 },
        { lat: 47.4979, lng: 19.0402, name: "Budapest, Hungary", zoom: 15 },
        { lat: 41.0082, lng: 28.9784, name: "Istanbul, Turkey", zoom: 15 },
        { lat: 1.3521, lng: 103.8198, name: "Singapore", zoom: 15 },
        { lat: 22.3193, lng: 114.1694, name: "Hong Kong", zoom: 15 },
        { lat: 37.5665, lng: 126.9780, name: "Seoul, South Korea", zoom: 15 },
        { lat: -34.6037, lng: -58.3816, name: "Buenos Aires, Argentina", zoom: 15 },
        { lat: 6.5244, lng: 3.3792, name: "Lagos, Nigeria", zoom: 15 },
        { lat: -33.9249, lng: 18.4241, name: "Cape Town, South Africa", zoom: 15 },
        { lat: 35.6892, lng: 51.3890, name: "Tehran, Iran", zoom: 15 },
    ],

    tileUrl: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    totalRounds: 5,
    minRoutePoints: 2,

    // Visualization settings - OPTIMIZED for performance
    viz: {
        explorationDelay: 8,        // ms between exploration batches
        batchSize: 4,               // nodes per batch (increased)
        nodeGlowRadius: 14,         // base glow radius (reduced)
        edgeWidth: 3,               // base edge width (reduced)
        heatDecay: 0.992,           // slower decay - explored edges persist longer
        heatFloor: 0.15,            // minimum heat - explored edges never fully fade
        pulseSpeed: 0.05,           // pulse animation speed
        particleCount: 25,          // reduced particle count
        pathTraceSpeed: 15,         // ms per path segment
        maxParticles: 80,           // cap total particles
    },

    // Blade Runner color palette (from hot to cold)
    heatColors: [
        { r: 255, g: 255, b: 255 },  // White hot
        { r: 0, g: 240, b: 255 },    // Neon cyan
        { r: 184, g: 41, b: 221 },   // Neon purple
        { r: 255, g: 42, b: 109 },   // Neon pink
        { r: 100, g: 20, b: 80 },    // Dark magenta
        { r: 30, g: 10, b: 40 },     // Very dark
    ],

    colors: {
        userRoute: '#ff6b35',       // Neon orange
        optimal: '#00f0ff',         // Neon cyan
        optimalGlow: '#00f0ff',
        start: '#39ff14',           // Neon green
        end: '#ff2a6d'              // Neon pink
    },

    // Round-specific colors for persistent visualization
    roundColors: [
        { r: 0, g: 240, b: 255, hex: '#00F0FF' },    // Round 1: Cyan
        { r: 255, g: 42, b: 109, hex: '#FF2A6D' },   // Round 2: Magenta
        { r: 184, g: 41, b: 221, hex: '#B829DD' },   // Round 3: Purple
        { r: 77, g: 159, b: 255, hex: '#4D9FFF' },   // Round 4: Blue
        { r: 255, g: 215, b: 0, hex: '#FFD700' },    // Round 5: Gold
    ],

    // Electricity effect settings
    electricity: {
        pulseCount: 8,              // traveling pulses per path
        pulseSpeed: 0.003,          // pulse travel speed
        flickerIntensity: 0.15,     // line flicker amount
        arcFrequency: 0.02,         // chance of arc spark per frame
        wobbleAmount: 1.5,          // pixel wobble from noise
        idleIntensity: 0.35,        // brightness of idle rounds
        activeIntensity: 1.0,       // brightness of active round
    },

    maxScore: 1000,
    overpassUrl: 'https://overpass-api.de/api/interpreter',
    nominatimUrl: 'https://nominatim.openstreetmap.org/search',
};

// =============================================================================
// SOUND ENGINE - Pure Web Audio API Synthesis
// =============================================================================

const SoundEngine = {
    ctx: null,
    masterGain: null,
    muted: false,
    initialized: false,
    ambientNodes: null,

    // Audio file buffers
    buffers: {
        scanning: null,
        found: null,
    },

    // Active audio sources (so we can stop them)
    activeSources: {
        scanning: null,
    },

    // Initialize AudioContext on first user interaction
    init() {
        if (this.initialized) return;

        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        this.masterGain = this.ctx.createGain();
        this.masterGain.connect(this.ctx.destination);
        this.masterGain.gain.value = 1.0;  // Full volume

        // Load mute preference
        this.muted = localStorage.getItem('pathfindr_muted') === 'true';
        if (this.muted) this.masterGain.gain.value = 0;

        // Load audio files
        this.loadAudioFiles();

        this.initialized = true;
    },

    // Load external audio files
    async loadAudioFiles() {
        try {
            const [scanningResponse, foundResponse] = await Promise.all([
                fetch('Scanning1.wav'),
                fetch('Found1.wav')
            ]);

            const [scanningData, foundData] = await Promise.all([
                scanningResponse.arrayBuffer(),
                foundResponse.arrayBuffer()
            ]);

            this.buffers.scanning = await this.ctx.decodeAudioData(scanningData);
            this.buffers.found = await this.ctx.decodeAudioData(foundData);

            console.log('Audio files loaded successfully');
        } catch (e) {
            console.warn('Could not load audio files:', e);
        }
    },

    // Play scanning sound (for A* exploration)
    scanning() {
        if (!this.initialized || this.muted || !this.buffers.scanning) return;

        // Stop any existing scanning sound first
        this.stopScanning();

        const source = this.ctx.createBufferSource();
        source.buffer = this.buffers.scanning;
        source.loop = false;  // Ensure no looping

        // Full volume - no attenuation
        source.connect(this.masterGain);
        source.start();

        // Track so we can stop it
        this.activeSources.scanning = { source };

        // Auto-cleanup when done
        source.onended = () => {
            this.activeSources.scanning = null;
        };
    },

    // Stop scanning sound
    stopScanning() {
        if (this.activeSources.scanning) {
            try {
                this.activeSources.scanning.source.stop();
            } catch (e) { /* already stopped */ }
            this.activeSources.scanning = null;
        }
    },

    // Play path found sound
    pathFound() {
        if (!this.initialized || this.muted || !this.buffers.found) return;

        // Stop scanning sound when path is found
        this.stopScanning();

        const source = this.ctx.createBufferSource();
        source.buffer = this.buffers.found;
        source.loop = false;  // Ensure no looping

        // Full volume - no attenuation
        source.connect(this.masterGain);
        source.start();
    },

    // Tiny crackle for electricity arcs
    crackle() {
        if (!this.initialized || this.muted) return;

        const now = this.ctx.currentTime;

        const noise = this.ctx.createBufferSource();
        noise.buffer = this.createNoiseBuffer(0.03);

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.value = 3000 + Math.random() * 2000;

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialDecayTo = 0.001;
        gain.gain.setTargetAtTime(0.001, now + 0.01, 0.005);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);

        noise.start(now);
        noise.stop(now + 0.03);
    },

    // Toggle mute state
    toggleMute() {
        this.muted = !this.muted;
        localStorage.setItem('pathfindr_muted', this.muted);

        if (this.initialized) {
            this.masterGain.gain.setTargetAtTime(
                this.muted ? 0 : 1.0,
                this.ctx.currentTime,
                0.1
            );
        }
        return this.muted;
    },

    // Create white noise buffer
    createNoiseBuffer(duration = 1) {
        const sampleRate = this.ctx.sampleRate;
        const buffer = this.ctx.createBuffer(1, sampleRate * duration, sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < data.length; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        return buffer;
    },

    // 1. TICK - Typewriter/CRT click for score counting
    tick() {
        if (!this.initialized || this.muted) return;

        const now = this.ctx.currentTime;

        // Noise burst
        const noise = this.ctx.createBufferSource();
        noise.buffer = this.createNoiseBuffer(0.05);

        // Bandpass filter for click character
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 2500 + Math.random() * 1500;
        filter.Q.value = 2;

        // Envelope
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialDecayTo = 0.01;
        gain.gain.setTargetAtTime(0.001, now + 0.015, 0.01);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);

        noise.start(now);
        noise.stop(now + 0.04);
    },

    // 2. CLICK - UI button click
    click() {
        if (!this.initialized || this.muted) return;

        const now = this.ctx.currentTime;

        // Low square wave blip
        const osc = this.ctx.createOscillator();
        osc.type = 'square';
        osc.frequency.setValueAtTime(100, now);
        osc.frequency.setTargetAtTime(60, now + 0.05, 0.03);

        // Lowpass filter
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(800, now);
        filter.frequency.setTargetAtTime(200, now + 0.08, 0.05);

        // Envelope
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.setTargetAtTime(0.001, now + 0.08, 0.03);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);

        osc.start(now);
        osc.stop(now + 0.12);
    },

    // 3. HOVER - Subtle button hover
    hover() {
        if (!this.initialized || this.muted) return;

        const now = this.ctx.currentTime;

        const osc = this.ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.value = 1800 + Math.random() * 400;

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0, now);
        gain.gain.setTargetAtTime(0.06, now, 0.01);
        gain.gain.setTargetAtTime(0.001, now + 0.03, 0.02);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(now);
        osc.stop(now + 0.08);
    },

    // 4. SUBMIT - Satisfying confirm sound
    submit() {
        if (!this.initialized || this.muted) return;

        const now = this.ctx.currentTime;

        // Low sine foundation
        const osc1 = this.ctx.createOscillator();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(80, now);
        osc1.frequency.setTargetAtTime(120, now + 0.1, 0.08);

        // Mid square texture
        const osc2 = this.ctx.createOscillator();
        osc2.type = 'square';
        osc2.frequency.setValueAtTime(200, now);
        osc2.frequency.setTargetAtTime(180, now + 0.15, 0.1);

        // Noise texture
        const noise = this.ctx.createBufferSource();
        noise.buffer = this.createNoiseBuffer(0.3);

        const noiseFilter = this.ctx.createBiquadFilter();
        noiseFilter.type = 'bandpass';
        noiseFilter.frequency.value = 1000;

        const noiseGain = this.ctx.createGain();
        noiseGain.gain.setValueAtTime(0.1, now);
        noiseGain.gain.setTargetAtTime(0.001, now + 0.15, 0.05);

        // Oscillator gains
        const gain1 = this.ctx.createGain();
        gain1.gain.setValueAtTime(0.25, now);
        gain1.gain.setTargetAtTime(0.001, now + 0.25, 0.08);

        const gain2 = this.ctx.createGain();
        gain2.gain.setValueAtTime(0.08, now);
        gain2.gain.setTargetAtTime(0.001, now + 0.2, 0.06);

        osc1.connect(gain1);
        osc2.connect(gain2);
        noise.connect(noiseFilter);
        noiseFilter.connect(noiseGain);

        gain1.connect(this.masterGain);
        gain2.connect(this.masterGain);
        noiseGain.connect(this.masterGain);

        osc1.start(now);
        osc2.start(now);
        noise.start(now);
        osc1.stop(now + 0.3);
        osc2.stop(now + 0.25);
        noise.stop(now + 0.2);
    },

    // 5. PING - Node discovery sonar
    ping(pitchOffset = 0) {
        if (!this.initialized || this.muted) return;

        const now = this.ctx.currentTime;
        const baseFreq = 900 + Math.random() * 400 + pitchOffset;

        const osc = this.ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(baseFreq, now);
        osc.frequency.setTargetAtTime(baseFreq * 0.7, now + 0.15, 0.1);

        // Delay for reverb effect
        const delay = this.ctx.createDelay();
        delay.delayTime.value = 0.1;

        const delayGain = this.ctx.createGain();
        delayGain.gain.value = 0.3;

        const mainGain = this.ctx.createGain();
        mainGain.gain.setValueAtTime(0.15, now);
        mainGain.gain.setTargetAtTime(0.001, now + 0.25, 0.08);

        osc.connect(mainGain);
        mainGain.connect(this.masterGain);
        mainGain.connect(delay);
        delay.connect(delayGain);
        delayGain.connect(this.masterGain);

        osc.start(now);
        osc.stop(now + 0.35);
    },

    // 6. TRACE - Continuous path tracing tone
    traceNode: null,
    startTrace() {
        if (!this.initialized || this.muted) return;
        if (this.traceNode) this.stopTrace();

        const now = this.ctx.currentTime;

        const osc = this.ctx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.value = 150;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 400;
        filter.Q.value = 8;

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0, now);
        gain.gain.setTargetAtTime(0.12, now, 0.3);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);

        osc.start(now);

        this.traceNode = { osc, filter, gain };
    },

    updateTrace(progress) {
        if (!this.traceNode) return;

        // Pitch rises as path progresses
        const freq = 150 + progress * 150;
        this.traceNode.osc.frequency.setTargetAtTime(freq, this.ctx.currentTime, 0.1);
        this.traceNode.filter.frequency.setTargetAtTime(400 + progress * 600, this.ctx.currentTime, 0.1);
    },

    stopTrace() {
        if (!this.traceNode) return;

        const now = this.ctx.currentTime;
        this.traceNode.gain.gain.setTargetAtTime(0.001, now, 0.1);

        const node = this.traceNode;
        setTimeout(() => {
            node.osc.stop();
        }, 300);

        this.traceNode = null;
    },

    // 7. RESOLVE - Path complete chime (A major chord)
    resolve() {
        if (!this.initialized || this.muted) return;

        const now = this.ctx.currentTime;
        const freqs = [440, 554, 659]; // A, C#, E

        freqs.forEach((freq, i) => {
            const osc = this.ctx.createOscillator();
            osc.type = 'sine';
            osc.frequency.value = freq;

            const gain = this.ctx.createGain();
            const startTime = now + i * 0.05; // Stagger
            gain.gain.setValueAtTime(0, startTime);
            gain.gain.setTargetAtTime(0.15, startTime, 0.05);
            gain.gain.setTargetAtTime(0.001, startTime + 0.5, 0.3);

            osc.connect(gain);
            gain.connect(this.masterGain);

            osc.start(startTime);
            osc.stop(startTime + 1.2);
        });

        // Add shimmer with high harmonics
        const shimmer = this.ctx.createOscillator();
        shimmer.type = 'sine';
        shimmer.frequency.value = 1760; // High A

        const shimmerGain = this.ctx.createGain();
        shimmerGain.gain.setValueAtTime(0, now + 0.1);
        shimmerGain.gain.setTargetAtTime(0.04, now + 0.1, 0.05);
        shimmerGain.gain.setTargetAtTime(0.001, now + 0.6, 0.4);

        shimmer.connect(shimmerGain);
        shimmerGain.connect(this.masterGain);
        shimmer.start(now + 0.1);
        shimmer.stop(now + 1.5);
    },

    // 8. SLIDE - Panel whoosh
    slide() {
        if (!this.initialized || this.muted) return;

        const now = this.ctx.currentTime;

        const noise = this.ctx.createBufferSource();
        noise.buffer = this.createNoiseBuffer(0.3);

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(200, now);
        filter.frequency.setTargetAtTime(2000, now + 0.15, 0.08);
        filter.Q.value = 1;

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.setTargetAtTime(0.001, now + 0.2, 0.08);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);

        noise.start(now);
        noise.stop(now + 0.3);
    },

    // 9. AMBIENT - Background drone
    startAmbient() {
        if (!this.initialized || this.muted) return;
        if (this.ambientNodes) return;

        const now = this.ctx.currentTime;

        // Low drone
        const drone = this.ctx.createOscillator();
        drone.type = 'sine';
        drone.frequency.value = 45;

        // LFO for subtle wobble
        const lfo = this.ctx.createOscillator();
        lfo.type = 'sine';
        lfo.frequency.value = 0.1;

        const lfoGain = this.ctx.createGain();
        lfoGain.gain.value = 3;

        lfo.connect(lfoGain);
        lfoGain.connect(drone.frequency);

        // Filtered noise for texture
        const noise = this.ctx.createBufferSource();
        noise.buffer = this.createNoiseBuffer(30);
        noise.loop = true;

        const noiseFilter = this.ctx.createBiquadFilter();
        noiseFilter.type = 'lowpass';
        noiseFilter.frequency.value = 200;

        // Gains
        const droneGain = this.ctx.createGain();
        droneGain.gain.setValueAtTime(0, now);
        droneGain.gain.setTargetAtTime(0.08, now, 2);

        const noiseGain = this.ctx.createGain();
        noiseGain.gain.setValueAtTime(0, now);
        noiseGain.gain.setTargetAtTime(0.03, now, 2);

        drone.connect(droneGain);
        noise.connect(noiseFilter);
        noiseFilter.connect(noiseGain);

        droneGain.connect(this.masterGain);
        noiseGain.connect(this.masterGain);

        drone.start(now);
        lfo.start(now);
        noise.start(now);

        this.ambientNodes = { drone, lfo, noise, droneGain, noiseGain, noiseFilter };
    },

    // Modulate ambient sound based on visual system state
    updateAmbient() {
        if (!this.ambientNodes || !this.initialized || this.muted) return;

        const params = AmbientViz.audioParams;
        const now = this.ctx.currentTime;

        // Modulate drone pitch based on player speed (subtle)
        const basePitch = 45;
        const pitchMod = params.playerSpeed * 8; // Up to 8Hz higher when drawing fast
        this.ambientNodes.drone.frequency.setTargetAtTime(basePitch + pitchMod, now, 0.3);

        // Modulate LFO speed based on energy
        const baseLfoSpeed = 0.1;
        const lfoMod = params.energy * 0.2; // Faster wobble with more particles
        this.ambientNodes.lfo.frequency.setTargetAtTime(baseLfoSpeed + lfoMod, now, 0.3);

        // Modulate noise filter based on proximity to end
        const baseFilter = 200;
        const filterMod = params.proximityToEnd * 400; // Brighter as you get closer
        this.ambientNodes.noiseFilter.frequency.setTargetAtTime(baseFilter + filterMod, now, 0.3);
    },

    stopAmbient() {
        if (!this.ambientNodes) return;

        const now = this.ctx.currentTime;
        this.ambientNodes.droneGain.gain.setTargetAtTime(0.001, now, 1);
        this.ambientNodes.noiseGain.gain.setTargetAtTime(0.001, now, 1);

        const nodes = this.ambientNodes;
        setTimeout(() => {
            nodes.drone.stop();
            nodes.lfo.stop();
            nodes.noise.stop();
        }, 3000);

        this.ambientNodes = null;
    }
};

// =============================================================================
// AMBIENT VISUALIZATION SYSTEM - Energy Flow
// =============================================================================

const AmbientViz = {
    // State
    active: false,
    animationId: null,
    lastTime: 0,

    // Pre-rendered sprite canvases
    sprites: {
        glowCyan: null,
        glowPink: null,
        glowPurple: null,
        glowGreen: null,
        glowWhite: null,
    },
    spriteSize: 64,

    // Particle pool (fixed size, recycled)
    particles: [],
    maxParticles: 16,

    // Trail afterglow
    trailPoints: [],
    maxTrailPoints: 50,

    // Audio sync parameters (0-1 range, read by SoundEngine)
    audioParams: {
        energy: 0,          // Overall system energy
        playerSpeed: 0,     // How fast player is drawing
        proximityToEnd: 0,  // Distance to end goal (1 = close)
        networkDensity: 0,  // Local edge density
    },

    // Marker pulse state
    markerPulse: 0,

    // Initialize sprite system
    init() {
        this.createSprites();
        this.initParticlePool();
    },

    // Pre-render glow sprites (no shadowBlur at runtime!)
    createSprites() {
        const size = this.spriteSize;
        const colors = {
            glowCyan: { r: 0, g: 240, b: 255 },
            glowPink: { r: 255, g: 42, b: 109 },
            glowPurple: { r: 184, g: 41, b: 221 },
            glowGreen: { r: 57, g: 255, b: 20 },
            glowWhite: { r: 255, g: 255, b: 255 },
        };

        for (const [name, color] of Object.entries(colors)) {
            const canvas = document.createElement('canvas');
            canvas.width = size;
            canvas.height = size;
            const ctx = canvas.getContext('2d');

            const center = size / 2;
            const gradient = ctx.createRadialGradient(center, center, 0, center, center, center);
            gradient.addColorStop(0, `rgba(${color.r}, ${color.g}, ${color.b}, 0.9)`);
            gradient.addColorStop(0.2, `rgba(${color.r}, ${color.g}, ${color.b}, 0.5)`);
            gradient.addColorStop(0.5, `rgba(${color.r}, ${color.g}, ${color.b}, 0.15)`);
            gradient.addColorStop(1, `rgba(${color.r}, ${color.g}, ${color.b}, 0)`);

            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, size, size);

            this.sprites[name] = canvas;
        }
    },

    // Initialize particle pool
    initParticlePool() {
        this.particles = [];
        for (let i = 0; i < this.maxParticles; i++) {
            this.particles.push({
                active: false,
                x: 0, y: 0,
                edgeIndex: -1,
                edgeProgress: 0,   // 0-1 along current edge
                speed: 0,
                color: 'glowCyan',
                alpha: 0,
                size: 1,
            });
        }
    },

    // Spawn a particle on a random edge
    spawnParticle() {
        if (GameState.edgeList.length === 0) return;

        // Find inactive particle
        const particle = this.particles.find(p => !p.active);
        if (!particle) return;

        // Pick random edge
        const edgeIndex = Math.floor(Math.random() * GameState.edgeList.length);
        const edge = GameState.edgeList[edgeIndex];

        // Pick color based on location (cyan near start, pink near end, purple elsewhere)
        const colors = ['glowCyan', 'glowCyan', 'glowPink', 'glowPurple'];
        const colorIndex = Math.floor(Math.random() * colors.length);

        particle.active = true;
        particle.edgeIndex = edgeIndex;
        particle.edgeProgress = Math.random();
        particle.speed = 0.002 + Math.random() * 0.004; // Progress per frame
        particle.color = colors[colorIndex];
        particle.alpha = 0;
        particle.size = 0.5 + Math.random() * 0.5;
        particle.fadeIn = true;
    },

    // Update particle positions
    updateParticles(deltaTime) {
        const dt = Math.min(deltaTime / 16.67, 3); // Normalize to ~60fps, cap at 3x

        for (const particle of this.particles) {
            if (!particle.active) continue;

            // Fade in/out
            if (particle.fadeIn) {
                particle.alpha = Math.min(1, particle.alpha + 0.05 * dt);
                if (particle.alpha >= 1) particle.fadeIn = false;
            }

            // Move along edge
            particle.edgeProgress += particle.speed * dt;

            // When reaching end of edge, jump to connected edge or die
            if (particle.edgeProgress >= 1) {
                const edge = GameState.edgeList[particle.edgeIndex];
                if (!edge) {
                    particle.active = false;
                    continue;
                }

                // Find connected edges
                const neighbors = GameState.edges.get(edge.to);
                if (neighbors && neighbors.length > 0) {
                    // Pick random neighbor edge
                    const nextNeighbor = neighbors[Math.floor(Math.random() * neighbors.length)];
                    // Find the edge in edgeList
                    const nextEdgeIndex = GameState.edgeList.findIndex(e =>
                        (e.from === edge.to && e.to === nextNeighbor.neighbor) ||
                        (e.to === edge.to && e.from === nextNeighbor.neighbor)
                    );

                    if (nextEdgeIndex >= 0) {
                        particle.edgeIndex = nextEdgeIndex;
                        particle.edgeProgress = 0;
                        // Small chance to die anyway for variety
                        if (Math.random() < 0.1) {
                            particle.active = false;
                        }
                    } else {
                        particle.active = false;
                    }
                } else {
                    particle.active = false;
                }
            }

            // Calculate screen position
            if (particle.active) {
                const edge = GameState.edgeList[particle.edgeIndex];
                if (edge) {
                    const lat = edge.fromPos.lat + (edge.toPos.lat - edge.fromPos.lat) * particle.edgeProgress;
                    const lng = edge.fromPos.lng + (edge.toPos.lng - edge.fromPos.lng) * particle.edgeProgress;
                    const screen = GameState.map.latLngToContainerPoint([lat, lng]);
                    particle.x = screen.x;
                    particle.y = screen.y;
                }
            }
        }

        // Maintain particle count
        const activeCount = this.particles.filter(p => p.active).length;
        if (activeCount < this.maxParticles * 0.7) {
            this.spawnParticle();
        }
    },

    // Add point to trail afterglow
    addTrailPoint(lat, lng) {
        this.trailPoints.push({
            lat, lng,
            alpha: 1,
            time: performance.now()
        });

        // Limit trail length
        if (this.trailPoints.length > this.maxTrailPoints) {
            this.trailPoints.shift();
        }

        // Update audio params
        this.audioParams.playerSpeed = Math.min(1, this.trailPoints.length / 20);
    },

    // Update trail fade
    updateTrail(deltaTime) {
        const fadeRate = 0.015 * (deltaTime / 16.67);

        for (let i = this.trailPoints.length - 1; i >= 0; i--) {
            this.trailPoints[i].alpha -= fadeRate;
            if (this.trailPoints[i].alpha <= 0) {
                this.trailPoints.splice(i, 1);
            }
        }
    },

    // Clear trail
    clearTrail() {
        this.trailPoints = [];
    },

    // Main render function
    render(ctx, width, height, deltaTime) {
        // Update systems
        this.updateParticles(deltaTime);
        this.updateTrail(deltaTime);
        this.markerPulse += 0.03 * (deltaTime / 16.67);

        // Update energy audio param
        const activeParticles = this.particles.filter(p => p.active).length;
        this.audioParams.energy = activeParticles / this.maxParticles;

        // Draw particles using sprites (no shadowBlur!)
        ctx.globalCompositeOperation = 'lighter';

        for (const particle of this.particles) {
            if (!particle.active) continue;

            const sprite = this.sprites[particle.color];
            if (!sprite) continue;

            const size = this.spriteSize * particle.size;
            ctx.globalAlpha = particle.alpha * 0.6;
            ctx.drawImage(
                sprite,
                particle.x - size / 2,
                particle.y - size / 2,
                size,
                size
            );
        }

        // Draw trail afterglow
        this.renderTrail(ctx);

        // Draw marker auras
        this.renderMarkerAuras(ctx);

        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = 1;
    },

    // Render player trail with afterglow
    renderTrail(ctx) {
        if (this.trailPoints.length < 2) return;

        const sprite = this.sprites.glowCyan;

        for (let i = 0; i < this.trailPoints.length; i++) {
            const point = this.trailPoints[i];
            const screen = GameState.map.latLngToContainerPoint([point.lat, point.lng]);

            const size = this.spriteSize * 0.4 * point.alpha;
            ctx.globalAlpha = point.alpha * 0.4;
            ctx.drawImage(
                sprite,
                screen.x - size / 2,
                screen.y - size / 2,
                size,
                size
            );
        }
    },

    // Render pulsing auras around start/end markers
    renderMarkerAuras(ctx) {
        const pulse = 0.6 + 0.4 * Math.sin(this.markerPulse);
        const slowPulse = 0.7 + 0.3 * Math.sin(this.markerPulse * 0.5);

        // Start marker aura (green)
        if (GameState.startNode) {
            const pos = GameState.nodes.get(GameState.startNode);
            if (pos) {
                const screen = GameState.map.latLngToContainerPoint([pos.lat, pos.lng]);
                const sprite = this.sprites.glowGreen;
                const size = this.spriteSize * 1.5 * pulse;

                ctx.globalAlpha = 0.3 * slowPulse;
                ctx.drawImage(sprite, screen.x - size / 2, screen.y - size / 2, size, size);
            }
        }

        // End marker aura (pink)
        if (GameState.endNode) {
            const pos = GameState.nodes.get(GameState.endNode);
            if (pos) {
                const screen = GameState.map.latLngToContainerPoint([pos.lat, pos.lng]);
                const sprite = this.sprites.glowPink;
                const size = this.spriteSize * 1.5 * pulse;

                ctx.globalAlpha = 0.35 * slowPulse;
                ctx.drawImage(sprite, screen.x - size / 2, screen.y - size / 2, size, size);
            }
        }
    },

    // Start ambient loop
    start() {
        if (this.active) return;
        this.active = true;
        this.lastTime = performance.now();

        // Spawn initial particles
        for (let i = 0; i < this.maxParticles * 0.5; i++) {
            this.spawnParticle();
        }

        this.loop();
    },

    // Main animation loop - unified render for all visual systems
    loop() {
        if (!this.active) return;

        const now = performance.now();
        const deltaTime = now - this.lastTime;
        this.lastTime = now;

        const ctx = GameState.vizCtx;
        const width = GameState.vizCanvas.width;
        const height = GameState.vizCanvas.height;

        // Update systems
        this.updateProximityToEnd();
        RoundHistory.update(deltaTime);
        ElectricitySystem.update(deltaTime);

        // Clear canvas
        ctx.clearRect(0, 0, width, height);

        // Layer 1: Orange road network (always visible, CRT style)
        if (GameState.showCustomRoads) {
            drawRoadNetwork(ctx);
        }

        // Layer 2: Round history (persistent visualization from previous rounds)
        // Always render - previous rounds should persist during new visualizations
        this.renderRoundHistory(ctx, deltaTime, GameState.vizState.active);

        // Layer 3: Current A* exploration OR ambient particles
        if (GameState.vizState.active) {
            // A* visualization is running - let renderVisualization handle it
            // (it's called from its own loop)
        } else {
            // Ambient gameplay - particles and marker auras
            this.render(ctx, width, height, deltaTime);
        }

        // Layer 4: Arc sparks (always render on top)
        ElectricitySystem.renderArcs(ctx);

        // Layer 5: Trace animation for user path clicks
        renderTraceAnimation(ctx);

        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = 1;

        this.animationId = requestAnimationFrame(() => this.loop());
    },

    // Render persisted rounds with electricity effects
    renderRoundHistory(ctx, deltaTime, isVizActive = false) {
        const rounds = RoundHistory.getRounds();

        // During active visualization, dim previous rounds to 40% to not compete
        const vizDimFactor = isVizActive ? 0.4 : 1.0;

        for (const round of rounds) {
            // Convert explored edges to screen coordinates (O(1) lookup via edgeLookup)
            const screenEdges = [];
            for (const edgeKey of round.exploredEdges) {
                const edge = GameState.edgeLookup.get(edgeKey);

                if (edge) {
                    const from = GameState.map.latLngToContainerPoint([edge.fromPos.lat, edge.fromPos.lng]);
                    const to = GameState.map.latLngToContainerPoint([edge.toPos.lat, edge.toPos.lng]);
                    screenEdges.push({ from, to });
                }
            }

            // Render explored edges with electricity (dimmed during active viz)
            const isActive = round.state === 'surging' && !isVizActive;
            const effectiveIntensity = round.intensity * vizDimFactor;
            ElectricitySystem.renderElectrifiedEdges(ctx, screenEdges, round.color, effectiveIntensity, isActive);

            // Render optimal path (dimmed during active viz)
            if (round.optimalPath.length > 1) {
                const optimalPoints = round.optimalPath.map(nodeId => {
                    const pos = GameState.nodes.get(nodeId);
                    if (pos) return GameState.map.latLngToContainerPoint([pos.lat, pos.lng]);
                    return null;
                }).filter(p => p !== null);

                if (optimalPoints.length > 1) {
                    // Initialize pulses for this path if not exists
                    if (!round.optimalPulses) {
                        round.optimalPulses = ElectricitySystem.createPulses(optimalPoints, round.color, 6);
                    }
                    this.renderOptimalPathWithElectricity(ctx, optimalPoints, round.color, effectiveIntensity, round.optimalPulses);
                }
            }

            // Render user path with distinct electricity (dimmed during active viz)
            if (round.userPath.length > 1) {
                const userPoints = round.userPath.map(nodeId => {
                    const pos = GameState.nodes.get(nodeId);
                    if (pos) return GameState.map.latLngToContainerPoint([pos.lat, pos.lng]);
                    return null;
                }).filter(p => p !== null);

                if (userPoints.length > 1) {
                    ElectricitySystem.renderUserPathElectricity(ctx, userPoints, effectiveIntensity);
                }
            }
        }
    },

    // Render optimal path with flowing electricity
    renderOptimalPathWithElectricity(ctx, points, color, intensity, pulses) {
        if (points.length < 2) return;

        const flicker = ElectricitySystem.getFlicker();
        const effectiveIntensity = intensity * flicker;

        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.globalCompositeOperation = 'lighter';

        // Outer glow
        ctx.strokeStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${0.15 * effectiveIntensity})`;
        ctx.lineWidth = 16;
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
            ctx.lineTo(points[i].x, points[i].y);
        }
        ctx.stroke();

        // Mid glow
        ctx.strokeStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${0.4 * effectiveIntensity})`;
        ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
            ctx.lineTo(points[i].x, points[i].y);
        }
        ctx.stroke();

        // Core
        ctx.strokeStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${0.9 * effectiveIntensity})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
            ctx.lineTo(points[i].x, points[i].y);
        }
        ctx.stroke();

        // White hot center
        ctx.strokeStyle = `rgba(255, 255, 255, ${0.7 * effectiveIntensity})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
            ctx.lineTo(points[i].x, points[i].y);
        }
        ctx.stroke();

        // Traveling pulses
        ElectricitySystem.renderPulses(ctx, points, color, intensity, pulses);

        ctx.globalCompositeOperation = 'source-over';
    },

    // Calculate how close the user is to the end marker
    updateProximityToEnd() {
        if (!GameState.endNode || GameState.userPathNodes.length < 2) {
            this.audioParams.proximityToEnd = 0;
            return;
        }

        const endPos = GameState.nodes.get(GameState.endNode);
        const lastNodeId = GameState.userPathNodes[GameState.userPathNodes.length - 1];
        const lastPos = GameState.nodes.get(lastNodeId);

        if (!endPos || !lastPos) {
            this.audioParams.proximityToEnd = 0;
            return;
        }

        // Calculate distance in km
        const dist = haversineDistance(lastPos.lat, lastPos.lng, endPos.lat, endPos.lng);

        // Map distance to 0-1 (1 = very close, 0 = far)
        // Within 100m is "close"
        this.audioParams.proximityToEnd = Math.max(0, 1 - (dist / 0.3));
    },

    // Stop ambient loop
    stop() {
        this.active = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    },

    // Reset for new round
    reset() {
        this.clearTrail();
        this.initParticlePool();
        this.markerPulse = 0;
    }
};

// =============================================================================
// ROUND HISTORY - Persistent Visualization Data
// =============================================================================

const RoundHistory = {
    rounds: [],  // Array of completed round data

    // Add completed round to history
    addRound(roundNumber, exploredEdges, optimalPath, userPath) {
        const color = CONFIG.roundColors[(roundNumber - 1) % CONFIG.roundColors.length];

        this.rounds.push({
            roundNumber,
            exploredEdges: new Set(exploredEdges),  // Set of edge keys
            optimalPath: [...optimalPath],           // Array of node IDs
            userPath: [...userPath],                 // Array of node IDs
            color,
            state: 'surging',                        // 'surging' | 'settling' | 'idle'
            intensity: 1.0,
            surgeStartTime: performance.now(),
        });
    },

    // Update all round states
    update(deltaTime) {
        const now = performance.now();

        for (const round of this.rounds) {
            if (round.state === 'surging') {
                const elapsed = now - round.surgeStartTime;
                if (elapsed > 800) {  // Surge for 800ms
                    round.state = 'settling';
                    round.settleStartTime = now;
                }
            } else if (round.state === 'settling') {
                const elapsed = now - round.settleStartTime;
                const settleProgress = Math.min(1, elapsed / 1000);  // 1s settle
                round.intensity = 1.0 - (settleProgress * (1 - CONFIG.electricity.idleIntensity));

                if (settleProgress >= 1) {
                    round.state = 'idle';
                    round.intensity = CONFIG.electricity.idleIntensity;
                }
            }
        }
    },

    // Clear all history (for new game)
    clear() {
        this.rounds = [];
    },

    // Get all rounds for rendering
    getRounds() {
        return this.rounds;
    }
};

// =============================================================================
// ELECTRICITY SYSTEM - Organic Electric Effects
// =============================================================================

const ElectricitySystem = {
    time: 0,
    pulses: [],        // Traveling pulses along paths
    arcs: [],          // Active arc sparks
    lastCrackle: 0,

    // Simple noise function for organic movement
    noise(x, y, t) {
        return Math.sin(x * 0.1 + t) * Math.cos(y * 0.1 + t * 0.7) * 0.5 +
               Math.sin(x * 0.05 - t * 0.5) * 0.3 +
               Math.cos(y * 0.08 + t * 0.3) * 0.2;
    },

    // Initialize pulses for a path
    createPulses(pathPoints, color, count = 8) {
        const pulses = [];
        for (let i = 0; i < count; i++) {
            pulses.push({
                progress: i / count,  // 0-1 along path
                speed: CONFIG.electricity.pulseSpeed * (0.8 + Math.random() * 0.4),
                brightness: 0.6 + Math.random() * 0.4,
                size: 0.8 + Math.random() * 0.4,
            });
        }
        return pulses;
    },

    // Create arc spark between two points
    createArc(x1, y1, x2, y2, color) {
        this.arcs.push({
            x1, y1, x2, y2,
            color,
            life: 1.0,
            decay: 0.15 + Math.random() * 0.1,
            segments: this.generateLightningPath(x1, y1, x2, y2),
        });

        // Play crackle sound (throttled)
        if (performance.now() - this.lastCrackle > 100) {
            SoundEngine.crackle();
            this.lastCrackle = performance.now();
        }
    },

    // Generate jagged lightning path between two points
    generateLightningPath(x1, y1, x2, y2) {
        const segments = [];
        const steps = 4 + Math.floor(Math.random() * 3);
        const dx = (x2 - x1) / steps;
        const dy = (y2 - y1) / steps;

        let px = x1, py = y1;
        segments.push({ x: px, y: py });

        for (let i = 1; i < steps; i++) {
            const jitter = 8 + Math.random() * 12;
            px = x1 + dx * i + (Math.random() - 0.5) * jitter;
            py = y1 + dy * i + (Math.random() - 0.5) * jitter;
            segments.push({ x: px, y: py });
        }
        segments.push({ x: x2, y: y2 });

        return segments;
    },

    // Update system
    update(deltaTime) {
        this.time += deltaTime * 0.001;

        // Update arcs
        for (let i = this.arcs.length - 1; i >= 0; i--) {
            this.arcs[i].life -= this.arcs[i].decay;
            if (this.arcs[i].life <= 0) {
                this.arcs.splice(i, 1);
            }
        }
    },

    // Get flicker multiplier for organic pulsing
    getFlicker() {
        const base = Math.sin(this.time * 15) * 0.05;
        const fast = Math.sin(this.time * 47) * 0.03;
        const random = (Math.random() - 0.5) * CONFIG.electricity.flickerIntensity;
        return 1 + base + fast + random;
    },

    // Get wobble offset for a point
    getWobble(x, y) {
        const wx = this.noise(x, y, this.time * 2) * CONFIG.electricity.wobbleAmount;
        const wy = this.noise(x + 100, y + 100, this.time * 2) * CONFIG.electricity.wobbleAmount;
        return { wx, wy };
    },

    // Render electricity effects for edges
    renderElectrifiedEdges(ctx, edges, color, intensity, isActive) {
        if (edges.length === 0) return;

        const flicker = this.getFlicker();
        const effectiveIntensity = intensity * flicker;

        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        // Outer glow
        ctx.globalCompositeOperation = 'lighter';
        ctx.strokeStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${0.2 * effectiveIntensity})`;
        ctx.lineWidth = isActive ? 14 : 10;

        ctx.beginPath();
        for (const edge of edges) {
            const w1 = this.getWobble(edge.from.x, edge.from.y);
            const w2 = this.getWobble(edge.to.x, edge.to.y);
            ctx.moveTo(edge.from.x + w1.wx, edge.from.y + w1.wy);
            ctx.lineTo(edge.to.x + w2.wx, edge.to.y + w2.wy);
        }
        ctx.stroke();

        // Mid glow
        ctx.strokeStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${0.5 * effectiveIntensity})`;
        ctx.lineWidth = isActive ? 6 : 4;
        ctx.beginPath();
        for (const edge of edges) {
            const w1 = this.getWobble(edge.from.x, edge.from.y);
            const w2 = this.getWobble(edge.to.x, edge.to.y);
            ctx.moveTo(edge.from.x + w1.wx, edge.from.y + w1.wy);
            ctx.lineTo(edge.to.x + w2.wx, edge.to.y + w2.wy);
        }
        ctx.stroke();

        // Core
        ctx.strokeStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${0.9 * effectiveIntensity})`;
        ctx.lineWidth = isActive ? 2 : 1.5;
        ctx.beginPath();
        for (const edge of edges) {
            const w1 = this.getWobble(edge.from.x, edge.from.y);
            const w2 = this.getWobble(edge.to.x, edge.to.y);
            ctx.moveTo(edge.from.x + w1.wx, edge.from.y + w1.wy);
            ctx.lineTo(edge.to.x + w2.wx, edge.to.y + w2.wy);
        }
        ctx.stroke();

        // Random arc sparks for active rounds
        if (isActive && Math.random() < CONFIG.electricity.arcFrequency && edges.length > 0) {
            const edge = edges[Math.floor(Math.random() * edges.length)];
            // Find nearby edge for arc
            const nearbyEdge = edges.find(e =>
                e !== edge &&
                Math.abs(e.from.x - edge.to.x) < 50 &&
                Math.abs(e.from.y - edge.to.y) < 50
            );
            if (nearbyEdge) {
                this.createArc(edge.to.x, edge.to.y, nearbyEdge.from.x, nearbyEdge.from.y, color);
            }
        }
    },

    // Render traveling pulses along a path
    renderPulses(ctx, pathPoints, color, intensity, pulses) {
        if (pathPoints.length < 2 || !pulses) return;

        ctx.globalCompositeOperation = 'lighter';
        const sprite = AmbientViz.sprites.glowWhite;

        for (const pulse of pulses) {
            // Update pulse position
            pulse.progress += pulse.speed;
            if (pulse.progress > 1) pulse.progress -= 1;

            // Find position along path
            const totalSegments = pathPoints.length - 1;
            const segmentFloat = pulse.progress * totalSegments;
            const segmentIndex = Math.floor(segmentFloat);
            const segmentProgress = segmentFloat - segmentIndex;

            if (segmentIndex < pathPoints.length - 1) {
                const p1 = pathPoints[segmentIndex];
                const p2 = pathPoints[segmentIndex + 1];
                const x = p1.x + (p2.x - p1.x) * segmentProgress;
                const y = p1.y + (p2.y - p1.y) * segmentProgress;

                const size = AmbientViz.spriteSize * 0.4 * pulse.size;
                ctx.globalAlpha = pulse.brightness * intensity * this.getFlicker();
                ctx.drawImage(sprite, x - size / 2, y - size / 2, size, size);
            }
        }
        ctx.globalAlpha = 1;
    },

    // Render arc sparks
    renderArcs(ctx) {
        ctx.globalCompositeOperation = 'lighter';

        for (const arc of this.arcs) {
            const { color, life, segments } = arc;

            ctx.strokeStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${life})`;
            ctx.lineWidth = 2 * life;

            ctx.beginPath();
            ctx.moveTo(segments[0].x, segments[0].y);
            for (let i = 1; i < segments.length; i++) {
                ctx.lineTo(segments[i].x, segments[i].y);
            }
            ctx.stroke();

            // White core
            ctx.strokeStyle = `rgba(255, 255, 255, ${life * 0.8})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(segments[0].x, segments[0].y);
            for (let i = 1; i < segments.length; i++) {
                ctx.lineTo(segments[i].x, segments[i].y);
            }
            ctx.stroke();
        }
    },

    // Render user path with distinct electricity (more chaotic, orange/yellow)
    renderUserPathElectricity(ctx, pathPoints, intensity) {
        if (pathPoints.length < 2) return;

        const color = { r: 255, g: 140, b: 50 };  // Orange
        const flicker = this.getFlicker() * (1 + Math.random() * 0.2);  // More chaotic
        const effectiveIntensity = intensity * flicker;

        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.globalCompositeOperation = 'lighter';

        // Outer chaotic glow
        ctx.strokeStyle = `rgba(255, 100, 30, ${0.25 * effectiveIntensity})`;
        ctx.lineWidth = 16;
        ctx.beginPath();
        ctx.moveTo(pathPoints[0].x, pathPoints[0].y);
        for (let i = 1; i < pathPoints.length; i++) {
            const w = this.getWobble(pathPoints[i].x, pathPoints[i].y);
            ctx.lineTo(pathPoints[i].x + w.wx * 1.5, pathPoints[i].y + w.wy * 1.5);
        }
        ctx.stroke();

        // Mid glow
        ctx.strokeStyle = `rgba(255, 140, 50, ${0.5 * effectiveIntensity})`;
        ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.moveTo(pathPoints[0].x, pathPoints[0].y);
        for (let i = 1; i < pathPoints.length; i++) {
            const w = this.getWobble(pathPoints[i].x, pathPoints[i].y);
            ctx.lineTo(pathPoints[i].x + w.wx, pathPoints[i].y + w.wy);
        }
        ctx.stroke();

        // Yellow-white core
        ctx.strokeStyle = `rgba(255, 220, 150, ${0.9 * effectiveIntensity})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(pathPoints[0].x, pathPoints[0].y);
        for (let i = 1; i < pathPoints.length; i++) {
            ctx.lineTo(pathPoints[i].x, pathPoints[i].y);
        }
        ctx.stroke();

        ctx.globalCompositeOperation = 'source-over';
    }
};

// =============================================================================
// SCREEN COORDINATE CACHE - Avoid recalculating every frame
// =============================================================================

const ScreenCoordCache = {
    edges: [],           // Array of {from: {x,y}, to: {x,y}} for each edge
    dirty: true,         // Needs refresh when map moves/zooms
    lastRefresh: 0,      // Timestamp of last refresh

    // Refresh all edge screen coordinates
    refresh() {
        if (!GameState.map || !GameState.edgeList || GameState.edgeList.length === 0) {
            this.edges = [];
            return;
        }

        const map = GameState.map;
        this.edges = new Array(GameState.edgeList.length);

        for (let i = 0; i < GameState.edgeList.length; i++) {
            const edge = GameState.edgeList[i];
            const fromScreen = map.latLngToContainerPoint([edge.fromPos.lat, edge.fromPos.lng]);
            const toScreen = map.latLngToContainerPoint([edge.toPos.lat, edge.toPos.lng]);
            this.edges[i] = {
                from: { x: fromScreen.x, y: fromScreen.y },
                to: { x: toScreen.x, y: toScreen.y },
                edgeKey: `${Math.min(edge.from, edge.to)}-${Math.max(edge.from, edge.to)}`
            };
        }

        this.dirty = false;
        this.lastRefresh = performance.now();
    },

    // Mark cache as needing refresh
    invalidate() {
        this.dirty = true;
    },

    // Get cached coordinates, refresh if needed
    getEdges() {
        if (this.dirty || this.edges.length === 0) {
            this.refresh();
        }
        return this.edges;
    }
};

// =============================================================================
// GAME STATE
// =============================================================================

const GameState = {
    map: null,
    tileLayer: null,        // Reference to Leaflet tile layer for toggle
    showCustomRoads: true,  // Toggle state for custom road view
    drawCanvas: null,
    drawCtx: null,
    vizCanvas: null,
    vizCtx: null,

    // Road network
    nodes: new Map(),
    edges: new Map(),
    edgeList: [],
    edgeLookup: new Map(),  // Fast lookup: edgeKey -> edge object

    // Debug state
    debug: {
        enabled: false,
        showGraph: false,
        snapFailures: 0,
        snapSuccesses: 0,
        lastSnapDetails: [],
        graphComponents: 0,
        largestComponent: 0,
    },

    // Game state
    startNode: null,
    endNode: null,
    startMarker: null,
    endMarker: null,
    startLabel: null,
    endLabel: null,

    // User drawing - SINGLE SOURCE OF TRUTH
    isDrawing: false,
    userPathNodes: [],      // Array of node IDs (snapped to road network)
    userDrawnPoints: [],    // Raw lat/lng points (actual mouse path for distance calc)
    userDistance: 0,        // Distance in km (single value used everywhere)
    userPathLayer: null,

    // Electric trace animation for new path segments
    traceAnimation: {
        active: false,
        segments: [],       // Array of {from, to} screen coords to animate
        progress: 0,        // 0-1 animation progress
        startTime: 0,
        duration: 150,      // ms per segment
    },

    // A* results
    exploredNodes: [],
    optimalPath: [],

    // Replay state
    replaySpeed: 1,
    isReplaying: false,

    // Visualization state
    vizState: {
        active: false,
        exploredSet: new Set(),
        nodeHeat: new Map(),
        edgeHeat: new Map(),
        discoveryTime: new Map(),
        particles: [],
        animationId: null,
        phase: 'idle',
        pathProgress: 0,
        pulsePhase: 0,
    },

    // Layers
    exploredLayer: null,
    optimalLayer: null,

    // Game progress
    currentRound: 1,
    totalScore: 0,
    isLoading: true,
    gameStarted: false,
    canDraw: false,

    // Location settings
    locationMode: 'us',  // 'local', 'us', or 'global'
    currentCity: null    // Current city object
};

// =============================================================================
// INITIALIZATION
// =============================================================================

document.addEventListener('DOMContentLoaded', () => {
    initMap();
    initCanvases();
    AmbientViz.init();  // Initialize glow sprites
    initEventListeners();
    initSoundListeners();
    initLocationSelector();
    // Show location selector instead of loading immediately
    showLocationSelector();
});

// Initialize sound on first user interaction
function initSoundListeners() {
    // Add hover/click sounds to all buttons
    document.querySelectorAll('.btn, .speed-btn, .replay-btn, .location-option').forEach(btn => {
        btn.addEventListener('mouseenter', () => {
            SoundEngine.init();
            SoundEngine.hover();
        });
        btn.addEventListener('click', () => {
            SoundEngine.init();
            SoundEngine.click();
        });
    });

    // Keyboard shortcut for mute
    document.addEventListener('keydown', (e) => {
        if (e.key === 'm' || e.key === 'M') {
            SoundEngine.init();
            const muted = SoundEngine.toggleMute();
            updateMuteButton(muted);
        }
        // Debug mode toggle
        if (e.key === 'd' || e.key === 'D') {
            toggleDebugMode();
        }
        // View toggle
        if (e.key === 'v' || e.key === 'V') {
            toggleMapView();
        }
    });

    // View toggle button
    document.getElementById('toggle-view-btn').addEventListener('click', toggleMapView);
}

function initMap() {
    GameState.map = L.map('map', {
        center: [CONFIG.defaultLocation.lat, CONFIG.defaultLocation.lng],
        zoom: CONFIG.defaultLocation.zoom,
        zoomControl: true,
        scrollWheelZoom: true,
        doubleClickZoom: true,
        dragging: true
    });

    // Store tile layer reference for toggle functionality
    GameState.tileLayer = L.tileLayer(CONFIG.tileUrl, {
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(GameState.map);

    // Start with custom road view mode if enabled
    if (GameState.showCustomRoads) {
        document.getElementById('map-container').classList.add('custom-roads-mode');
    }

    GameState.exploredLayer = L.layerGroup().addTo(GameState.map);
    GameState.optimalLayer = L.layerGroup().addTo(GameState.map);
    GameState.userPathLayer = L.layerGroup().addTo(GameState.map);

    GameState.map.on('move', () => {
        ScreenCoordCache.invalidate();  // Invalidate coordinate cache
        redrawUserPath();
        if (GameState.showCustomRoads && !GameState.vizState.active) drawRoadNetwork();
        if (GameState.vizState.active) renderVisualization();
    });
    GameState.map.on('zoom', () => {
        ScreenCoordCache.invalidate();  // Invalidate coordinate cache
        redrawUserPath();
        if (GameState.showCustomRoads && !GameState.vizState.active) drawRoadNetwork();
        if (GameState.vizState.active) renderVisualization();
    });
}

function initCanvases() {
    GameState.drawCanvas = document.getElementById('draw-canvas');
    GameState.drawCtx = GameState.drawCanvas.getContext('2d');

    GameState.vizCanvas = document.getElementById('viz-canvas');
    GameState.vizCtx = GameState.vizCanvas.getContext('2d');

    resizeCanvases();
    window.addEventListener('resize', resizeCanvases);
}

function resizeCanvases() {
    const container = document.getElementById('map-container');
    const width = container.offsetWidth;
    const height = container.offsetHeight;

    GameState.drawCanvas.width = width;
    GameState.drawCanvas.height = height;
    GameState.vizCanvas.width = width;
    GameState.vizCanvas.height = height;

    redrawUserPath();
}

function initEventListeners() {
    // Drawing
    GameState.drawCanvas.addEventListener('mousedown', startDrawing);
    GameState.drawCanvas.addEventListener('mousemove', draw);
    GameState.drawCanvas.addEventListener('mouseup', stopDrawing);
    GameState.drawCanvas.addEventListener('mouseleave', stopDrawing);

    // Touch
    GameState.drawCanvas.addEventListener('touchstart', handleTouchStart);
    GameState.drawCanvas.addEventListener('touchmove', handleTouchMove);
    GameState.drawCanvas.addEventListener('touchend', stopDrawing);

    // Buttons
    document.getElementById('start-game-btn').addEventListener('click', startGame);
    document.getElementById('clear-btn').addEventListener('click', clearUserPath);
    document.getElementById('undo-btn').addEventListener('click', undoLastSegment);
    document.getElementById('submit-btn').addEventListener('click', submitRoute);
    document.getElementById('next-round-btn').addEventListener('click', nextRound);
    document.getElementById('play-again-btn').addEventListener('click', playAgain);
    document.getElementById('mute-btn').addEventListener('click', toggleMute);

    // Optional controls (may be hidden in new UI)
    const searchBtn = document.getElementById('search-btn');
    if (searchBtn) searchBtn.addEventListener('click', searchLocation);

    const centerBtn = document.getElementById('center-btn');
    if (centerBtn) centerBtn.addEventListener('click', centerOnRoute);

    const replayBtn = document.getElementById('replay-btn');
    if (replayBtn) replayBtn.addEventListener('click', replayVisualization);

    // Speed buttons (optional, may not exist in new UI)
    document.querySelectorAll('.speed-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.speed-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            GameState.replaySpeed = parseFloat(e.target.dataset.speed);
        });
    });

    const locationSearch = document.getElementById('location-search');
    if (locationSearch) {
        locationSearch.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') searchLocation();
        });
    }

    // Wheel zoom passthrough
    GameState.drawCanvas.addEventListener('wheel', (e) => {
        const mapContainer = document.getElementById('map');
        const wheelEvent = new WheelEvent('wheel', {
            deltaY: e.deltaY,
            deltaX: e.deltaX,
            clientX: e.clientX,
            clientY: e.clientY,
            bubbles: true
        });
        mapContainer.dispatchEvent(wheelEvent);
    }, { passive: true });

    // Middle mouse button panning
    let middleMousePanning = false;
    let panStart = { x: 0, y: 0 };

    GameState.drawCanvas.addEventListener('mousedown', (e) => {
        if (e.button === 1) {
            e.preventDefault();
            middleMousePanning = true;
            panStart = { x: e.clientX, y: e.clientY };
            GameState.drawCanvas.style.cursor = 'grabbing';
        }
    });

    GameState.drawCanvas.addEventListener('mousemove', (e) => {
        if (middleMousePanning) {
            const dx = e.clientX - panStart.x;
            const dy = e.clientY - panStart.y;
            GameState.map.panBy([-dx, -dy], { animate: false });
            panStart = { x: e.clientX, y: e.clientY };
        }
    });

    GameState.drawCanvas.addEventListener('mouseup', (e) => {
        if (e.button === 1) {
            middleMousePanning = false;
            GameState.drawCanvas.style.cursor = '';
        }
    });

    GameState.drawCanvas.addEventListener('contextmenu', (e) => {
        e.preventDefault();
    });
}

// =============================================================================
// ROAD NETWORK LOADING
// =============================================================================

async function loadRoadNetwork(location, retryCount = 0) {
    const maxRetries = 3;
    const baseDelay = 1500; // 1.5 seconds base delay

    if (retryCount === 0) {
        showLoading('Loading road network...');
    } else {
        showLoading(`Retrying... (attempt ${retryCount + 1}/${maxRetries + 1})`);
    }

    try {
        const bounds = GameState.map.getBounds();
        const query = `
            [out:json][timeout:30];
            (
                way["highway"]["highway"!~"footway|path|steps|pedestrian|cycleway|track"]
                (${bounds.getSouth()},${bounds.getWest()},${bounds.getNorth()},${bounds.getEast()});
            );
            out body;
            >;
            out skel qt;
        `;

        const response = await fetch(CONFIG.overpassUrl, {
            method: 'POST',
            body: `data=${encodeURIComponent(query)}`,
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });

        if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);

        const data = await response.json();

        // Validate we got actual data
        if (!data.elements || data.elements.length === 0) {
            throw new Error('No road data returned');
        }

        processRoadData(data);

        document.getElementById('current-location').textContent = location.name;
        hideLoading();
        showInstructions();

    } catch (error) {
        console.error(`Error loading road network (attempt ${retryCount + 1}):`, error);

        if (retryCount < maxRetries) {
            // Exponential backoff: 1.5s, 3s, 6s
            const delay = baseDelay * Math.pow(2, retryCount);
            showLoading(`Connection failed. Retrying in ${(delay / 1000).toFixed(1)}s...`);

            await new Promise(resolve => setTimeout(resolve, delay));
            return loadRoadNetwork(location, retryCount + 1);
        } else {
            // Max retries exceeded - show error with retry button
            showLoading(`Failed to load road data after ${maxRetries + 1} attempts. <button onclick="loadRoadNetwork(GameState.currentCity)" style="margin-left: 10px; padding: 5px 15px; cursor: pointer;">Retry</button>`);
        }
    }
}

function processRoadData(data) {
    GameState.nodes.clear();
    GameState.edges.clear();
    GameState.edgeList = [];
    GameState.edgeLookup.clear();

    const nodeMap = new Map();
    for (const element of data.elements) {
        if (element.type === 'node') {
            nodeMap.set(element.id, { lat: element.lat, lng: element.lon });
        }
    }

    // Track edges to prevent duplicates
    const edgeSet = new Set();

    for (const element of data.elements) {
        if (element.type === 'way' && element.nodes) {
            for (let i = 0; i < element.nodes.length - 1; i++) {
                const nodeA = element.nodes[i];
                const nodeB = element.nodes[i + 1];

                if (!nodeMap.has(nodeA) || !nodeMap.has(nodeB)) continue;

                // Create canonical edge key for deduplication
                const edgeKey = nodeA < nodeB ? `${nodeA}-${nodeB}` : `${nodeB}-${nodeA}`;
                if (edgeSet.has(edgeKey)) continue;
                edgeSet.add(edgeKey);

                if (!GameState.nodes.has(nodeA)) GameState.nodes.set(nodeA, nodeMap.get(nodeA));
                if (!GameState.nodes.has(nodeB)) GameState.nodes.set(nodeB, nodeMap.get(nodeB));

                const posA = nodeMap.get(nodeA);
                const posB = nodeMap.get(nodeB);
                const weight = haversineDistance(posA.lat, posA.lng, posB.lat, posB.lng);

                if (!GameState.edges.has(nodeA)) GameState.edges.set(nodeA, []);
                if (!GameState.edges.has(nodeB)) GameState.edges.set(nodeB, []);

                GameState.edges.get(nodeA).push({ neighbor: nodeB, weight });
                GameState.edges.get(nodeB).push({ neighbor: nodeA, weight });

                const edgeObj = {
                    from: nodeA,
                    to: nodeB,
                    fromPos: posA,
                    toPos: posB
                };
                GameState.edgeList.push(edgeObj);
                GameState.edgeLookup.set(edgeKey, edgeObj);
            }
        }
    }

    // Analyze graph connectivity
    analyzeGraphConnectivity();

    // Invalidate coordinate cache - new road data loaded
    ScreenCoordCache.invalidate();

    // Draw road network if custom view is enabled
    if (GameState.showCustomRoads) {
        drawRoadNetwork();
    }
}

// =============================================================================
// GAME FLOW
// =============================================================================

function startGame() {
    SoundEngine.init();
    // Old ambient drone removed - using wav files now
    hideInstructions();
    GameState.gameStarted = true;
    enableDrawing();
    selectRandomEndpoints();

    // Start ambient visual system
    AmbientViz.start();
}

function nextRound() {
    hideResults();
    clearVisualization();
    clearUserPath();

    // Reset comparison bars for next round
    const userBar = document.getElementById('user-bar');
    const optimalBar = document.getElementById('optimal-bar');
    if (userBar) userBar.style.width = '0%';
    if (optimalBar) optimalBar.style.width = '0%';

    // Reset round score display
    const roundScore = document.getElementById('round-score');
    if (roundScore) roundScore.textContent = '0';

    // Reset ambient visuals for new round
    AmbientViz.reset();

    if (GameState.currentRound < CONFIG.totalRounds) {
        GameState.currentRound++;
        updateRoundDisplay();

        // Stay in same city, just pick new endpoints with increased distance
        selectRandomEndpoints();
        enableDrawing();
    } else {
        showGameOver();
        AmbientViz.stop();
    }
}

function playAgain() {
    hideGameOver();
    GameState.currentRound = 1;
    GameState.totalScore = 0;
    GameState.roundScores = []; // Reset round history
    GameState.gameStarted = false;
    updateScoreDisplay();
    updateRoundDisplay();
    clearVisualization();
    clearUserPath();

    // Reset comparison bars
    const userBar = document.getElementById('user-bar');
    const optimalBar = document.getElementById('optimal-bar');
    if (userBar) userBar.style.width = '0%';
    if (optimalBar) optimalBar.style.width = '0%';

    // Reset ambient visuals
    AmbientViz.stop();
    AmbientViz.reset();

    // Clear persistent round history
    RoundHistory.clear();

    // Show location selector for new game
    showLocationSelector();
}

function selectRandomEndpoints() {
    // Only use nodes from the largest connected component to ensure paths exist
    const largestComponentNodes = GameState.debug.largestComponentNodes;
    let nodeIds;

    if (largestComponentNodes && largestComponentNodes.size > 0) {
        nodeIds = Array.from(largestComponentNodes);
    } else {
        nodeIds = Array.from(GameState.nodes.keys());
    }

    if (nodeIds.length < 2) {
        console.error('Not enough nodes!');
        return;
    }

    const mapBounds = GameState.map.getBounds();
    const centerLat = mapBounds.getCenter().lat;
    const centerLng = mapBounds.getCenter().lng;
    const boundsWidth = mapBounds.getEast() - mapBounds.getWest();
    const boundsHeight = mapBounds.getNorth() - mapBounds.getSouth();

    const eligibleNodes = nodeIds.filter(nodeId => {
        const pos = GameState.nodes.get(nodeId);
        if (!pos) return false;
        const latDiff = Math.abs(pos.lat - centerLat);
        const lngDiff = Math.abs(pos.lng - centerLng);
        return latDiff < boundsHeight * 0.35 && lngDiff < boundsWidth * 0.35;
    });

    const nodesToUse = eligibleNodes.length >= 20 ? eligibleNodes : nodeIds;

    // Scale distance based on round number (round 1 = short, round 5 = long)
    const round = GameState.currentRound || 1;
    const distanceScales = [
        { min: 0.15, max: 0.4 },  // Round 1: short
        { min: 0.25, max: 0.55 }, // Round 2
        { min: 0.35, max: 0.7 },  // Round 3
        { min: 0.45, max: 0.9 },  // Round 4
        { min: 0.6, max: 1.2 }    // Round 5: longest
    ];
    const scale = distanceScales[Math.min(round - 1, 4)];

    let attempts = 0;
    let minDistance = scale.min;
    let maxDistance = scale.max;

    do {
        const startIdx = Math.floor(Math.random() * nodesToUse.length);
        let endIdx;
        do {
            endIdx = Math.floor(Math.random() * nodesToUse.length);
        } while (endIdx === startIdx);

        GameState.startNode = nodesToUse[startIdx];
        GameState.endNode = nodesToUse[endIdx];

        const startPos = GameState.nodes.get(GameState.startNode);
        const endPos = GameState.nodes.get(GameState.endNode);
        const dist = haversineDistance(startPos.lat, startPos.lng, endPos.lat, endPos.lng);

        if (dist >= minDistance && dist <= maxDistance) break;

        attempts++;
        if (attempts > 100) {
            minDistance *= 0.7;
            maxDistance *= 1.2;
            attempts = 0;
        }
    } while (true);

    const startPos = GameState.nodes.get(GameState.startNode);
    const endPos = GameState.nodes.get(GameState.endNode);

    const bounds = L.latLngBounds(
        [startPos.lat, startPos.lng],
        [endPos.lat, endPos.lng]
    );

    GameState.map.fitBounds(bounds, {
        padding: [80, 80],
        maxZoom: 16
    });

    setTimeout(() => {
        placeMarkers();
    }, 100);
}

function centerOnRoute() {
    if (!GameState.startNode || !GameState.endNode) return;

    const startPos = GameState.nodes.get(GameState.startNode);
    const endPos = GameState.nodes.get(GameState.endNode);

    if (!startPos || !endPos) return;

    const bounds = L.latLngBounds(
        [startPos.lat, startPos.lng],
        [endPos.lat, endPos.lng]
    );

    GameState.map.fitBounds(bounds, {
        padding: [80, 80],
        maxZoom: 16
    });
}

function placeMarkers() {
    if (GameState.startMarker) {
        GameState.map.removeLayer(GameState.startMarker);
        GameState.startMarker = null;
    }
    if (GameState.endMarker) {
        GameState.map.removeLayer(GameState.endMarker);
        GameState.endMarker = null;
    }
    if (GameState.startLabel) {
        GameState.map.removeLayer(GameState.startLabel);
        GameState.startLabel = null;
    }
    if (GameState.endLabel) {
        GameState.map.removeLayer(GameState.endLabel);
        GameState.endLabel = null;
    }

    const startPos = GameState.nodes.get(GameState.startNode);
    const endPos = GameState.nodes.get(GameState.endNode);

    if (!startPos || !endPos) {
        console.error('Invalid start or end position!', startPos, endPos);
        return;
    }

    GameState.startMarker = L.circleMarker([startPos.lat, startPos.lng], {
        radius: 18,
        fillColor: CONFIG.colors.start,
        color: '#ffffff',
        weight: 3,
        opacity: 1,
        fillOpacity: 1
    }).addTo(GameState.map);

    GameState.endMarker = L.circleMarker([endPos.lat, endPos.lng], {
        radius: 18,
        fillColor: CONFIG.colors.end,
        color: '#ffffff',
        weight: 3,
        opacity: 1,
        fillOpacity: 1
    }).addTo(GameState.map);

    const startLabel = L.marker([startPos.lat, startPos.lng], {
        icon: L.divIcon({
            className: 'marker-label',
            html: '<span style="font-family:Orbitron,monospace;font-weight:bold;font-size:14px;color:#000;text-shadow:0 0 3px #fff;">S</span>',
            iconSize: [20, 20],
            iconAnchor: [10, 10]
        })
    }).addTo(GameState.map);

    const endLabel = L.marker([endPos.lat, endPos.lng], {
        icon: L.divIcon({
            className: 'marker-label',
            html: '<span style="font-family:Orbitron,monospace;font-weight:bold;font-size:14px;color:#fff;text-shadow:0 0 3px #000;">E</span>',
            iconSize: [20, 20],
            iconAnchor: [10, 10]
        })
    }).addTo(GameState.map);

    GameState.startLabel = startLabel;
    GameState.endLabel = endLabel;
}

// =============================================================================
// DRAWING
// =============================================================================

function enableDrawing() {
    GameState.drawCanvas.classList.add('drawing-ready');
    GameState.drawCanvas.classList.remove('drawing-active');
    const submitBtn = document.getElementById('submit-btn');
    if (submitBtn) submitBtn.disabled = true;
    GameState.canDraw = true;
}

function disableDrawing() {
    GameState.drawCanvas.classList.remove('drawing-ready');
    GameState.drawCanvas.classList.remove('drawing-active');
    GameState.canDraw = false;
}

/**
 * Handle click to add waypoint - uses micro A* routing to connect to last point.
 * This is the primary interaction method (no dragging needed).
 */
function handlePathClick(e) {
    if (e.button !== undefined && e.button !== 0) return;
    if (!GameState.gameStarted || !GameState.canDraw) return;
    if (GameState.vizState.active) return; // Don't allow clicks during A* visualization

    // Initialize path from start node on first click
    if (GameState.userPathNodes.length === 0) {
        GameState.userPathNodes.push(GameState.startNode);
        const startPos = GameState.nodes.get(GameState.startNode);
        if (startPos) {
            GameState.userDrawnPoints.push({ lat: startPos.lat, lng: startPos.lng });
        }
        recalculateUserDistance();
        updateAllDistanceDisplays();
    }

    // Add the clicked point (micro A* routing happens inside addPointToUserPath)
    const point = getLatLngFromEvent(e);
    GameState.userDrawnPoints.push({ lat: point.lat, lng: point.lng });

    if (addPointToUserPath(point.lat, point.lng)) {
        redrawUserPath();
        // Quick visual feedback
        GameState.drawCanvas.classList.add('click-feedback');
        setTimeout(() => GameState.drawCanvas.classList.remove('click-feedback'), 100);
    }
}

/**
 * Handle touch tap to add waypoint.
 */
function handleTouchTap(e) {
    e.preventDefault();
    // Only handle single taps, not multi-touch gestures
    if (e.touches.length === 1) {
        handlePathClick({ clientX: e.touches[0].clientX, clientY: e.touches[0].clientY });
    }
}

// Legacy functions kept for compatibility but simplified
function startDrawing(e) {
    handlePathClick(e);
}

function draw(e) {
    // No-op: dragging is disabled, we use click-only
}

function stopDrawing() {
    // No-op: no continuous drawing state to manage
}

function handleTouchStart(e) {
    handleTouchTap(e);
}

function handleTouchMove(e) {
    // No-op: dragging is disabled on touch
    e.preventDefault();
}

function getLatLngFromEvent(e) {
    const rect = GameState.drawCanvas.getBoundingClientRect();
    const containerPoint = L.point(e.clientX - rect.left, e.clientY - rect.top);
    const latLng = GameState.map.containerPointToLatLng(containerPoint);
    return { lat: latLng.lat, lng: latLng.lng };
}

function redrawUserPath() {
    const ctx = GameState.drawCtx;
    ctx.clearRect(0, 0, GameState.drawCanvas.width, GameState.drawCanvas.height);

    if (GameState.userPathNodes.length < 2) return;

    const points = [];
    for (let i = 0; i < GameState.userPathNodes.length; i++) {
        const nodeId = GameState.userPathNodes[i];
        const pos = GameState.nodes.get(nodeId);
        if (!pos) continue;
        points.push(GameState.map.latLngToContainerPoint([pos.lat, pos.lng]));
    }

    if (points.length < 2) return;

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Use lighter composite for glow (no shadowBlur!)
    ctx.globalCompositeOperation = 'lighter';

    // Glow layers
    ctx.strokeStyle = 'rgba(255, 107, 53, 0.2)';
    ctx.lineWidth = 12;
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.stroke();

    ctx.strokeStyle = 'rgba(255, 107, 53, 0.5)';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.stroke();

    ctx.globalCompositeOperation = 'source-over';

    // Core line
    ctx.strokeStyle = CONFIG.colors.userRoute;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.stroke();
}

function clearUserPath() {
    resetUserPath();
}

function undoLastSegment() {
    if (GameState.userPathNodes.length > 1) {
        // Remove last few nodes
        GameState.userPathNodes.splice(-Math.min(5, GameState.userPathNodes.length - 1));
        recalculateUserDistance();
        updateAllDistanceDisplays();
        redrawUserPath();
        if (GameState.userPathNodes.length < CONFIG.minRoutePoints) {
            const submitBtn = document.getElementById('submit-btn');
            if (submitBtn) submitBtn.disabled = true;
        }
    }
}

// updateRouteInfo() removed - replaced by updateAllDistanceDisplays()

// =============================================================================
// A* ALGORITHM
// =============================================================================

function runAStar(startNode, endNode) {
    const openSet = new MinHeap();
    const closedSet = new Set();
    const cameFrom = new Map();
    const gScore = new Map();
    const fScore = new Map();
    const exploredOrder = [];

    gScore.set(startNode, 0);
    const endPos = GameState.nodes.get(endNode);
    fScore.set(startNode, heuristic(GameState.nodes.get(startNode), endPos));
    openSet.insert({ node: startNode, priority: fScore.get(startNode) });

    while (!openSet.isEmpty()) {
        const current = openSet.extractMin().node;

        if (current === endNode) {
            const path = [current];
            let node = current;
            while (cameFrom.has(node)) {
                node = cameFrom.get(node);
                path.unshift(node);
            }
            return { path, explored: exploredOrder };
        }

        if (closedSet.has(current)) continue;
        closedSet.add(current);
        exploredOrder.push(current);

        for (const { neighbor, weight } of (GameState.edges.get(current) || [])) {
            if (closedSet.has(neighbor)) continue;

            const tentativeG = gScore.get(current) + weight;
            if (!gScore.has(neighbor) || tentativeG < gScore.get(neighbor)) {
                cameFrom.set(neighbor, current);
                gScore.set(neighbor, tentativeG);
                const f = tentativeG + heuristic(GameState.nodes.get(neighbor), endPos);
                fScore.set(neighbor, f);
                openSet.insert({ node: neighbor, priority: f });
            }
        }
    }

    return { path: [], explored: exploredOrder };
}

function heuristic(posA, posB) {
    return haversineDistance(posA.lat, posA.lng, posB.lat, posB.lng);
}

class MinHeap {
    constructor() { this.heap = []; }

    insert(item) {
        this.heap.push(item);
        this.bubbleUp(this.heap.length - 1);
    }

    extractMin() {
        if (this.heap.length === 0) return null;
        const min = this.heap[0];
        const last = this.heap.pop();
        if (this.heap.length > 0) {
            this.heap[0] = last;
            this.bubbleDown(0);
        }
        return min;
    }

    isEmpty() { return this.heap.length === 0; }

    bubbleUp(index) {
        while (index > 0) {
            const parent = Math.floor((index - 1) / 2);
            if (this.heap[parent].priority <= this.heap[index].priority) break;
            [this.heap[parent], this.heap[index]] = [this.heap[index], this.heap[parent]];
            index = parent;
        }
    }

    bubbleDown(index) {
        while (true) {
            const left = 2 * index + 1;
            const right = 2 * index + 2;
            let smallest = index;
            if (left < this.heap.length && this.heap[left].priority < this.heap[smallest].priority) smallest = left;
            if (right < this.heap.length && this.heap[right].priority < this.heap[smallest].priority) smallest = right;
            if (smallest === index) break;
            [this.heap[smallest], this.heap[index]] = [this.heap[index], this.heap[smallest]];
            index = smallest;
        }
    }
}

// =============================================================================
// OPTIMIZED VISUALIZATION
// =============================================================================

async function submitRoute() {
    SoundEngine.submit();
    disableDrawing();
    const submitBtn = document.getElementById('submit-btn');
    if (submitBtn) submitBtn.disabled = true;

    // Keep user path as line on map (convert node IDs to lat/lng)
    const userLatLngs = GameState.userPathNodes
        .map(nodeId => GameState.nodes.get(nodeId))
        .filter(pos => pos !== undefined)
        .map(pos => [pos.lat, pos.lng]);

    L.polyline(userLatLngs, {
        color: CONFIG.colors.userRoute,
        weight: 4,
        opacity: 0.7
    }).addTo(GameState.userPathLayer);

    GameState.drawCtx.clearRect(0, 0, GameState.drawCanvas.width, GameState.drawCanvas.height);

    // Run A*
    const { path, explored } = runAStar(GameState.startNode, GameState.endNode);
    GameState.optimalPath = path;
    GameState.exploredNodes = explored;

    // Start visualization
    await runEpicVisualization(explored, path);

    calculateAndShowScore();
}

async function runEpicVisualization(explored, path) {
    const viz = GameState.vizState;
    const speed = GameState.replaySpeed;

    // Reset visualization state
    viz.active = true;
    viz.exploredSet.clear();
    viz.nodeHeat.clear();
    viz.edgeHeat.clear();
    viz.discoveryTime.clear();
    viz.particles = [];
    viz.phase = 'exploring';
    viz.pathProgress = 0;
    viz.pulsePhase = 0;

    startRenderLoop();

    // Play scanning sound when A* exploration begins
    SoundEngine.scanning();

    const startTime = performance.now();
    const explorationDelay = CONFIG.viz.explorationDelay / speed;

    // Animate exploration
    for (let i = 0; i < explored.length; i++) {
        const nodeId = explored[i];
        viz.exploredSet.add(nodeId);
        viz.nodeHeat.set(nodeId, 1.0);
        viz.discoveryTime.set(nodeId, performance.now() - startTime);

        const neighbors = GameState.edges.get(nodeId) || [];
        for (const { neighbor } of neighbors) {
            if (viz.exploredSet.has(neighbor)) {
                const edgeKey = `${Math.min(nodeId, neighbor)}-${Math.max(nodeId, neighbor)}`;
                viz.edgeHeat.set(edgeKey, 1.0);
            }
        }

        // Reduced particles - only spawn occasionally
        if (i % 3 === 0 && viz.particles.length < CONFIG.viz.maxParticles) {
            const pos = GameState.nodes.get(nodeId);
            if (pos) {
                viz.particles.push(createParticle(pos, 'explore'));
            }
        }

        // Ping sound every 5th node (throttled)
        if (i % 5 === 0) {
            SoundEngine.ping(i * 2);
        }

        if (i % CONFIG.viz.batchSize === 0) {
            await sleep(explorationDelay);
        }
    }

    await sleep(400 / speed);

    // Animate optimal path - BATCHED for performance
    viz.phase = 'path';

    // Target ~1.5 seconds for path animation regardless of path length
    const targetDuration = 1500 / speed;
    const frameTime = 16; // ~60fps
    const totalFrames = Math.ceil(targetDuration / frameTime);
    const nodesPerFrame = Math.max(1, Math.ceil(path.length / totalFrames));

    for (let i = 0; i < path.length - 1; i += nodesPerFrame) {
        viz.pathProgress = Math.min(i, path.length - 2);

        // Spawn path particles occasionally
        if (viz.particles.length < CONFIG.viz.maxParticles) {
            const pos = GameState.nodes.get(path[i]);
            if (pos) {
                viz.particles.push(createParticle(pos, 'path'));
            }
        }

        await sleep(frameTime);
    }

    viz.pathProgress = path.length - 1;
    viz.phase = 'complete';

    // Final burst - limited
    const endPos = GameState.nodes.get(path[path.length - 1]);
    if (endPos) {
        for (let p = 0; p < 10; p++) {
            viz.particles.push(createParticle(endPos, 'finale'));
        }
    }

    await sleep(800 / speed);
}

async function replayVisualization() {
    if (GameState.isReplaying || GameState.exploredNodes.length === 0) return;

    GameState.isReplaying = true;

    // Clear current visualization
    clearVisualizationState();

    // Replay with stored data
    await runEpicVisualization(GameState.exploredNodes, GameState.optimalPath);

    GameState.isReplaying = false;
}

function createParticle(pos, type) {
    const angle = Math.random() * Math.PI * 2;
    const speed = type === 'finale' ? 1.5 + Math.random() * 2 : 0.4 + Math.random() * 1;

    return {
        lat: pos.lat,
        lng: pos.lng,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1.0,
        decay: type === 'finale' ? 0.02 : 0.025 + Math.random() * 0.02,
        size: type === 'finale' ? 3 + Math.random() * 3 : 2 + Math.random() * 2,
        type: type
    };
}

function startRenderLoop() {
    function render() {
        if (!GameState.vizState.active) return;

        renderVisualization();
        GameState.vizState.animationId = requestAnimationFrame(render);
    }
    render();
}

// Ambient road network with warm radial glow - visible during A* visualization
function drawAmbientRoads(ctx, time, width, height) {
    const edges = ScreenCoordCache.getEdges();
    if (edges.length === 0) return;

    const centerX = width / 2;
    const centerY = height / 2;

    // Gentle breathing pulse
    const breathe = 0.85 + 0.15 * Math.sin(time * 0.6);

    // Create radial gradient for warm center falloff
    const maxRadius = Math.sqrt(centerX * centerX + centerY * centerY);
    const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, maxRadius);

    // Warm amber/orange at center fading to deep purple at edges
    gradient.addColorStop(0, `rgba(180, 100, 60, ${0.35 * breathe})`);
    gradient.addColorStop(0.3, `rgba(140, 60, 90, ${0.28 * breathe})`);
    gradient.addColorStop(0.6, `rgba(100, 40, 120, ${0.20 * breathe})`);
    gradient.addColorStop(1, `rgba(60, 20, 80, ${0.10 * breathe})`);

    ctx.globalCompositeOperation = 'source-over';
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Outer warm glow layer
    ctx.strokeStyle = gradient;
    ctx.lineWidth = 6;
    ctx.beginPath();
    for (let i = 0; i < edges.length; i++) {
        const edge = edges[i];
        ctx.moveTo(edge.from.x, edge.from.y);
        ctx.lineTo(edge.to.x, edge.to.y);
    }
    ctx.stroke();

    // Mid glow layer - slightly brighter
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (let i = 0; i < edges.length; i++) {
        const edge = edges[i];
        ctx.moveTo(edge.from.x, edge.from.y);
        ctx.lineTo(edge.to.x, edge.to.y);
    }
    ctx.stroke();

    // Core roads - warm white/amber core
    const coreGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, maxRadius);
    coreGradient.addColorStop(0, `rgba(255, 200, 150, ${0.25 * breathe})`);
    coreGradient.addColorStop(0.4, `rgba(200, 120, 100, ${0.18 * breathe})`);
    coreGradient.addColorStop(1, `rgba(120, 60, 100, ${0.08 * breathe})`);

    ctx.strokeStyle = coreGradient;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let i = 0; i < edges.length; i++) {
        const edge = edges[i];
        ctx.moveTo(edge.from.x, edge.from.y);
        ctx.lineTo(edge.to.x, edge.to.y);
    }
    ctx.stroke();
}

function renderVisualization() {
    const ctx = GameState.vizCtx;
    const viz = GameState.vizState;
    const width = GameState.vizCanvas.width;
    const height = GameState.vizCanvas.height;

    ctx.clearRect(0, 0, width, height);

    viz.pulsePhase += CONFIG.viz.pulseSpeed;

    const time = performance.now() * 0.001;
    const flicker = 0.85 + Math.sin(time * 30) * 0.02 + Math.sin(time * 7) * 0.03 + (Math.random() - 0.5) * 0.05;

    // Draw ambient road network underneath - warm breathing effect
    drawAmbientRoads(ctx, time, width, height);

    // Use lighter composite for glow effect (no shadowBlur!)
    ctx.globalCompositeOperation = 'lighter';
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Batch render explored edges - simple 3-band system using cached coordinates
    const edgesByHeat = { high: [], medium: [], low: [] };
    const cachedEdges = ScreenCoordCache.getEdges();

    for (let i = 0; i < cachedEdges.length; i++) {
        const cached = cachedEdges[i];
        const heat = viz.edgeHeat.get(cached.edgeKey) || 0;

        if (heat < 0.03) continue;

        if (heat > 0.7) {
            edgesByHeat.high.push(cached);
        } else if (heat > 0.3) {
            edgesByHeat.medium.push(cached);
        } else {
            edgesByHeat.low.push(cached);
        }
    }

    // Decay heat values with floor - explored edges never fully fade
    const heatFloor = CONFIG.viz.heatFloor;
    for (const [nodeId, heat] of viz.nodeHeat) {
        const newHeat = heat * CONFIG.viz.heatDecay;
        viz.nodeHeat.set(nodeId, Math.max(newHeat, heatFloor));
    }
    for (const [edgeKey, heat] of viz.edgeHeat) {
        const newHeat = heat * CONFIG.viz.heatDecay;
        viz.edgeHeat.set(edgeKey, Math.max(newHeat, heatFloor));
    }

    // High heat - bright cyan with glow
    if (edgesByHeat.high.length > 0) {
        ctx.strokeStyle = 'rgba(0, 240, 255, 0.3)';
        ctx.lineWidth = 12;
        ctx.beginPath();
        for (const edge of edgesByHeat.high) {
            ctx.moveTo(edge.from.x, edge.from.y);
            ctx.lineTo(edge.to.x, edge.to.y);
        }
        ctx.stroke();

        ctx.strokeStyle = 'rgba(0, 240, 255, 0.9)';
        ctx.lineWidth = 4;
        ctx.beginPath();
        for (const edge of edgesByHeat.high) {
            ctx.moveTo(edge.from.x, edge.from.y);
            ctx.lineTo(edge.to.x, edge.to.y);
        }
        ctx.stroke();
    }

    // Medium heat - purple
    if (edgesByHeat.medium.length > 0) {
        ctx.strokeStyle = 'rgba(184, 41, 221, 0.25)';
        ctx.lineWidth = 10;
        ctx.beginPath();
        for (const edge of edgesByHeat.medium) {
            ctx.moveTo(edge.from.x, edge.from.y);
            ctx.lineTo(edge.to.x, edge.to.y);
        }
        ctx.stroke();

        ctx.strokeStyle = 'rgba(184, 41, 221, 0.8)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        for (const edge of edgesByHeat.medium) {
            ctx.moveTo(edge.from.x, edge.from.y);
            ctx.lineTo(edge.to.x, edge.to.y);
        }
        ctx.stroke();
    }

    // Low heat - pink fading
    if (edgesByHeat.low.length > 0) {
        ctx.strokeStyle = 'rgba(255, 42, 109, 0.4)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (const edge of edgesByHeat.low) {
            ctx.moveTo(edge.from.x, edge.from.y);
            ctx.lineTo(edge.to.x, edge.to.y);
        }
        ctx.stroke();
    }

    // Draw frontier nodes using sprites
    const sprite = AmbientViz.sprites.glowCyan;
    const spriteSize = AmbientViz.spriteSize;

    for (const [nodeId, heat] of viz.nodeHeat) {
        if (heat < 0.4) continue;

        const pos = GameState.nodes.get(nodeId);
        if (!pos) continue;

        const screen = GameState.map.latLngToContainerPoint([pos.lat, pos.lng]);
        const size = spriteSize * heat * 0.8;
        const spriteToUse = heat > 0.8 ? AmbientViz.sprites.glowWhite :
                           heat > 0.5 ? AmbientViz.sprites.glowCyan :
                           AmbientViz.sprites.glowPurple;

        ctx.globalAlpha = heat * flicker * 0.8;
        ctx.drawImage(spriteToUse, screen.x - size / 2, screen.y - size / 2, size, size);
    }

    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';

    // Draw optimal path
    if (viz.phase === 'path' || viz.phase === 'complete') {
        drawOptimalPath(ctx);
    }

    // Update and draw particles
    updateParticles();
    drawParticles(ctx);
}

function getHeatColor(heat) {
    const colors = CONFIG.heatColors;
    const idx = (1 - heat) * (colors.length - 1);
    const lower = Math.floor(idx);
    const upper = Math.min(lower + 1, colors.length - 1);
    const t = idx - lower;

    return {
        r: Math.round(colors[lower].r + (colors[upper].r - colors[lower].r) * t),
        g: Math.round(colors[lower].g + (colors[upper].g - colors[lower].g) * t),
        b: Math.round(colors[lower].b + (colors[upper].b - colors[lower].b) * t)
    };
}

function drawOptimalPath(ctx) {
    const path = GameState.optimalPath;
    const progress = GameState.vizState.pathProgress;
    const viz = GameState.vizState;

    if (path.length < 2) return;

    const drawTo = Math.min(progress + 1, path.length - 1);

    const points = [];
    for (let i = 0; i <= drawTo; i++) {
        const pos = GameState.nodes.get(path[i]);
        if (!pos) continue;
        points.push(GameState.map.latLngToContainerPoint([pos.lat, pos.lng]));
    }

    if (points.length < 2) return;

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Use lighter composite for glow effect (NO shadowBlur!)
    ctx.globalCompositeOperation = 'lighter';

    // Draw glow layers - wider and more transparent first
    const layers = [
        { color: 'rgba(0, 240, 255, 0.15)', width: 16 },
        { color: 'rgba(0, 240, 255, 0.3)', width: 10 },
        { color: 'rgba(0, 240, 255, 0.5)', width: 6 },
        { color: 'rgba(150, 255, 255, 0.8)', width: 3 },
    ];

    for (const layer of layers) {
        ctx.strokeStyle = layer.color;
        ctx.lineWidth = layer.width;
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
            ctx.lineTo(points[i].x, points[i].y);
        }
        ctx.stroke();
    }

    ctx.globalCompositeOperation = 'source-over';

    // Bright white core
    ctx.strokeStyle = 'rgba(255, 255, 255, 1)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.stroke();

    // Energy pulses along completed path using sprites
    if (viz.phase === 'complete' && points.length > 1) {
        ctx.globalCompositeOperation = 'lighter';
        const sprite = AmbientViz.sprites.glowWhite;
        const spriteSize = AmbientViz.spriteSize;

        const numPulses = 2;
        for (let p = 0; p < numPulses; p++) {
            const t = ((viz.pulsePhase * 0.25 + p / numPulses) % 1);
            const totalLen = points.length - 1;
            const idx = Math.floor(t * totalLen);
            const frac = (t * totalLen) - idx;

            if (idx < points.length - 1) {
                const x = points[idx].x + (points[idx + 1].x - points[idx].x) * frac;
                const y = points[idx].y + (points[idx + 1].y - points[idx].y) * frac;

                const size = spriteSize * 0.6;
                ctx.globalAlpha = 0.8;
                ctx.drawImage(sprite, x - size / 2, y - size / 2, size, size);
            }
        }
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = 'source-over';
    }

    // Leading point glow
    if (progress < path.length - 1 && points.length > 0) {
        const leadPoint = points[points.length - 1];
        const pulse = 0.5 + 0.5 * Math.sin(viz.pulsePhase * 3);
        const radius = 25 * pulse + 20;

        const gradient = ctx.createRadialGradient(leadPoint.x, leadPoint.y, 0, leadPoint.x, leadPoint.y, radius);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
        gradient.addColorStop(0.3, 'rgba(0, 240, 255, 0.7)');
        gradient.addColorStop(1, 'rgba(0, 240, 255, 0)');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(leadPoint.x, leadPoint.y, radius, 0, Math.PI * 2);
        ctx.fill();
    }
}

function updateParticles() {
    const particles = GameState.vizState.particles;

    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];

        p.lat += p.vy * 0.00001;
        p.lng += p.vx * 0.00001;

        p.life -= p.decay;
        p.vx *= 0.97;
        p.vy *= 0.97;

        if (p.life <= 0) {
            particles.splice(i, 1);
        }
    }
}

function drawParticles(ctx) {
    if (GameState.vizState.particles.length === 0) return;

    // Use sprites for particles (no shadowBlur!)
    ctx.globalCompositeOperation = 'lighter';
    const sprites = AmbientViz.sprites;
    const spriteSize = AmbientViz.spriteSize;

    for (const p of GameState.vizState.particles) {
        const screen = GameState.map.latLngToContainerPoint([p.lat, p.lng]);

        // Pick sprite based on particle type
        let sprite;
        if (p.type === 'explore') {
            sprite = p.life > 0.5 ? sprites.glowCyan : sprites.glowPurple;
        } else if (p.type === 'path') {
            sprite = sprites.glowCyan;
        } else {
            sprite = sprites.glowWhite;
        }

        const size = spriteSize * p.size * p.life * 0.5;
        ctx.globalAlpha = p.life * 0.7;
        ctx.drawImage(sprite, screen.x - size / 2, screen.y - size / 2, size, size);
    }

    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
}

function clearVisualizationState() {
    const viz = GameState.vizState;

    viz.exploredSet.clear();
    viz.nodeHeat.clear();
    viz.edgeHeat.clear();
    viz.discoveryTime.clear();
    viz.particles = [];
    viz.phase = 'idle';
    viz.pathProgress = 0;

    GameState.vizCtx.clearRect(0, 0, GameState.vizCanvas.width, GameState.vizCanvas.height);
}

function clearVisualization() {
    const viz = GameState.vizState;

    viz.active = false;
    if (viz.animationId) {
        cancelAnimationFrame(viz.animationId);
        viz.animationId = null;
    }

    clearVisualizationState();

    GameState.exploredLayer.clearLayers();
    GameState.optimalLayer.clearLayers();
    GameState.userPathLayer.clearLayers();

    // Redraw road network if custom view is enabled
    if (GameState.showCustomRoads) {
        drawRoadNetwork();
    }
}

// =============================================================================
// PATH DISTANCE SYSTEM - Single Source of Truth
// =============================================================================

/**
 * Add a point to the user's path using micro A* routing.
 * Finds the shortest path from the last node to the clicked location.
 * This ensures the path always follows valid roads.
 */
function addPointToUserPath(lat, lng) {
    const targetNode = findNearestNode(lat, lng);
    if (targetNode === null) return false;

    const lastNode = GameState.userPathNodes[GameState.userPathNodes.length - 1];

    // Avoid duplicate consecutive nodes
    if (targetNode === lastNode) return false;

    // Use micro A* to find the path along roads
    const microPath = findShortestPathBetween(lastNode, targetNode);

    if (microPath.length === 0) {
        // No path found - fall back to direct add (shouldn't happen often)
        GameState.userPathNodes.push(targetNode);
    } else {
        // Add all nodes from the micro path (skip first since it's already in path)
        const newNodes = microPath.slice(1);

        // Start trace animation for visual feedback
        startTraceAnimation(microPath);

        // Add all intermediate nodes
        for (const nodeId of newNodes) {
            GameState.userPathNodes.push(nodeId);
        }
    }

    recalculateUserDistance();
    updateAllDistanceDisplays();

    // Auto-complete: if user reached (or is very close to) the end node
    if (GameState.userPathNodes.length >= CONFIG.minRoutePoints) {
        const endPos = GameState.nodes.get(GameState.endNode);
        const lastAddedNode = GameState.userPathNodes[GameState.userPathNodes.length - 1];
        const nodePos = GameState.nodes.get(lastAddedNode);

        // Check if exact match OR within 30 meters of end node
        const isAtEnd = lastAddedNode === GameState.endNode ||
            (endPos && nodePos && haversineDistance(nodePos.lat, nodePos.lng, endPos.lat, endPos.lng) < 0.03);

        if (isAtEnd) {
            // If close but not exactly at end, add endNode to complete the path
            if (lastAddedNode !== GameState.endNode) {
                const finalPath = findShortestPathBetween(lastAddedNode, GameState.endNode);
                if (finalPath.length > 1) {
                    for (const nodeId of finalPath.slice(1)) {
                        GameState.userPathNodes.push(nodeId);
                    }
                } else {
                    GameState.userPathNodes.push(GameState.endNode);
                }
                recalculateUserDistance();
                updateAllDistanceDisplays();
            }
            // Delay for trace animation to complete, then auto-submit
            setTimeout(() => {
                if (!GameState.vizState.active) {
                    submitRoute();
                }
            }, 300);
        }
    }

    return true;
}

/**
 * Start the electric trace animation for a new path segment.
 */
function startTraceAnimation(pathNodes) {
    if (pathNodes.length < 2) return;

    // Convert path nodes to screen coordinates
    const segments = [];
    for (let i = 0; i < pathNodes.length - 1; i++) {
        const fromPos = GameState.nodes.get(pathNodes[i]);
        const toPos = GameState.nodes.get(pathNodes[i + 1]);
        if (fromPos && toPos) {
            segments.push({
                fromLat: fromPos.lat, fromLng: fromPos.lng,
                toLat: toPos.lat, toLng: toPos.lng
            });
        }
    }

    GameState.traceAnimation = {
        active: true,
        segments,
        progress: 0,
        startTime: performance.now(),
        duration: Math.min(150, 50 + segments.length * 15), // Scale with path length, max 150ms
    };
}

/**
 * Render the electric trace animation.
 * Called from the ambient render loop.
 */
function renderTraceAnimation(ctx) {
    const trace = GameState.traceAnimation;
    if (!trace.active || trace.segments.length === 0) return;

    const elapsed = performance.now() - trace.startTime;
    const totalDuration = trace.duration;
    trace.progress = Math.min(1, elapsed / totalDuration);

    // Calculate how many segments to show and the progress within the current segment
    const totalSegments = trace.segments.length;
    const overallProgress = trace.progress * totalSegments;
    const completedSegments = Math.floor(overallProgress);
    const currentSegmentProgress = overallProgress - completedSegments;

    ctx.globalCompositeOperation = 'lighter';
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Draw completed segments (full glow)
    for (let i = 0; i < completedSegments && i < totalSegments; i++) {
        const seg = trace.segments[i];
        const from = GameState.map.latLngToContainerPoint([seg.fromLat, seg.fromLng]);
        const to = GameState.map.latLngToContainerPoint([seg.toLat, seg.toLng]);

        // Glow
        ctx.strokeStyle = 'rgba(0, 240, 255, 0.4)';
        ctx.lineWidth = 12;
        ctx.beginPath();
        ctx.moveTo(from.x, from.y);
        ctx.lineTo(to.x, to.y);
        ctx.stroke();

        // Core
        ctx.strokeStyle = 'rgba(0, 240, 255, 0.9)';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(from.x, from.y);
        ctx.lineTo(to.x, to.y);
        ctx.stroke();
    }

    // Draw current segment (partial, with bright leading edge)
    if (completedSegments < totalSegments) {
        const seg = trace.segments[completedSegments];
        const from = GameState.map.latLngToContainerPoint([seg.fromLat, seg.fromLng]);
        const to = GameState.map.latLngToContainerPoint([seg.toLat, seg.toLng]);

        // Interpolate position
        const currentX = from.x + (to.x - from.x) * currentSegmentProgress;
        const currentY = from.y + (to.y - from.y) * currentSegmentProgress;

        // Trail glow
        ctx.strokeStyle = 'rgba(0, 240, 255, 0.3)';
        ctx.lineWidth = 10;
        ctx.beginPath();
        ctx.moveTo(from.x, from.y);
        ctx.lineTo(currentX, currentY);
        ctx.stroke();

        // Trail core
        ctx.strokeStyle = 'rgba(0, 240, 255, 0.8)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(from.x, from.y);
        ctx.lineTo(currentX, currentY);
        ctx.stroke();

        // Bright leading edge (white hot)
        const sprite = AmbientViz.sprites.glowWhite;
        if (sprite) {
            const size = 40;
            ctx.globalAlpha = 0.9;
            ctx.drawImage(sprite, currentX - size/2, currentY - size/2, size, size);
            ctx.globalAlpha = 1;
        }
    }

    // End animation when complete
    if (trace.progress >= 1) {
        trace.active = false;
    }

    ctx.globalCompositeOperation = 'source-over';
}

/**
 * Recalculate the user's path distance from raw drawn points.
 * This measures the actual line the user drew, not snapped nodes.
 */
function recalculateUserDistance() {
    // With click-based routing, calculate distance from the actual snapped path
    GameState.userDistance = calculateNodePathDistance(GameState.userPathNodes);
}

/**
 * Calculate the total distance of a path defined by node IDs.
 * Used for A* optimal path calculation.
 */
function calculateNodePathDistance(nodeIds) {
    if (!nodeIds || nodeIds.length < 2) return 0;

    let total = 0;
    for (let i = 0; i < nodeIds.length - 1; i++) {
        const posA = GameState.nodes.get(nodeIds[i]);
        const posB = GameState.nodes.get(nodeIds[i + 1]);
        if (posA && posB) {
            total += haversineDistance(posA.lat, posA.lng, posB.lat, posB.lng);
        }
    }
    return total;
}

/**
 * Update ALL distance displays from the single source of truth.
 * This ensures consistency across the entire UI.
 */
function updateAllDistanceDisplays() {
    const distStr = GameState.userDistance.toFixed(2);

    // HUD display (new floating bar) - has nested km unit
    const hudDist = document.getElementById('drawn-distance');
    if (hudDist) {
        hudDist.innerHTML = `${distStr}<span class="hud-unit">km</span>`;
    }

    // Bottom bar display (results panel)
    const bottomDist = document.getElementById('user-distance');
    if (bottomDist) bottomDist.textContent = `${distStr} km`;

    // Debug panel (if visible)
    const debugDist = document.getElementById('debug-user-dist');
    if (debugDist) debugDist.textContent = `${distStr} km`;

    // Points count
    const pointsEl = document.getElementById('drawn-points');
    if (pointsEl) pointsEl.textContent = GameState.userPathNodes.length;
}

/**
 * Clear the user's path completely.
 */
function resetUserPath() {
    GameState.userPathNodes = [];
    GameState.userDrawnPoints = [];  // Reset raw drawn points
    GameState.userDistance = 0;
    GameState.drawCtx.clearRect(0, 0, GameState.drawCanvas.width, GameState.drawCanvas.height);
    GameState.userPathLayer.clearLayers();

    // Handle hidden submit button gracefully
    const submitBtn = document.getElementById('submit-btn');
    if (submitBtn) submitBtn.disabled = true;

    const distLabel = document.getElementById('distance-label');
    if (distLabel) distLabel.textContent = 'Distance';

    updateAllDistanceDisplays();
}

// =============================================================================
// SCORING
// =============================================================================

function calculateAndShowScore() {
    // User distance comes from the SINGLE SOURCE OF TRUTH
    const userDistance = GameState.userDistance;

    // Calculate optimal distance using the same function
    const optimalDistance = calculateNodePathDistance(GameState.optimalPath);

    let efficiency;
    if (optimalDistance === 0 || userDistance === 0) {
        efficiency = 0;
    } else {
        efficiency = Math.min(100, (optimalDistance / userDistance) * 100);
    }

    const roundScore = Math.round((efficiency / 100) * CONFIG.maxScore);
    GameState.totalScore += roundScore;

    // Store round data for game-over summary
    if (!GameState.roundScores) GameState.roundScores = [];
    GameState.roundScores.push({
        round: GameState.currentRound,
        score: roundScore,
        efficiency: efficiency,
        userDistance: userDistance,
        optimalDistance: optimalDistance
    });

    // Save round to persistent history for visualization
    const exploredEdgeKeys = Array.from(GameState.vizState.edgeHeat.keys());
    RoundHistory.addRound(
        GameState.currentRound,
        exploredEdgeKeys,
        GameState.optimalPath,
        GameState.userPathNodes
    );

    // Play the path found sound
    SoundEngine.pathFound();

    // Update displays - user distance already shown via updateAllDistanceDisplays()
    document.getElementById('optimal-distance').textContent = `${optimalDistance.toFixed(2)} km`;
    document.getElementById('efficiency').textContent = `${efficiency.toFixed(0)}%`;

    // Update result meta (round and total)
    const resultRound = document.getElementById('result-round');
    if (resultRound) resultRound.textContent = GameState.currentRound;

    const resultTotal = document.getElementById('result-total');
    if (resultTotal) resultTotal.textContent = GameState.totalScore;

    // Update comparison bars (animate width based on distances)
    const maxDist = Math.max(userDistance, optimalDistance);
    const userBar = document.getElementById('user-bar');
    const optimalBar = document.getElementById('optimal-bar');

    if (userBar && optimalBar && maxDist > 0) {
        // Delay bar animation for visual effect
        setTimeout(() => {
            userBar.style.width = `${(userDistance / maxDist) * 100}%`;
            optimalBar.style.width = `${(optimalDistance / maxDist) * 100}%`;
        }, 100);
    }

    // Update debug panel optimal distance
    const debugOptimal = document.getElementById('debug-optimal-dist');
    if (debugOptimal) debugOptimal.textContent = `${optimalDistance.toFixed(3)} km`;

    // Update next button text
    const nextBtn = document.getElementById('next-round-btn');
    if (nextBtn) {
        if (GameState.currentRound >= CONFIG.totalRounds) {
            nextBtn.innerHTML = `<span>See Final Score</span>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>`;
        } else {
            nextBtn.innerHTML = `<span>Next Round</span>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>`;
        }
    }

    showResults();

    // Animate score count-up with ticks
    animateScoreCountUp(roundScore, efficiency);
}

async function animateScoreCountUp(targetScore, targetEfficiency) {
    const scoreEl = document.getElementById('round-score');
    const headerScoreEl = document.getElementById('current-score');
    const efficiencyEl = document.getElementById('efficiency');
    const previousTotal = GameState.totalScore - targetScore;

    let currentScore = 0;
    let currentEfficiency = 0;
    const scoreIncrement = Math.max(1, Math.ceil(targetScore / 30)); // ~30 ticks
    const efficiencyIncrement = targetEfficiency / 30;
    const delay = 35; // ms between ticks

    while (currentScore < targetScore) {
        currentScore = Math.min(currentScore + scoreIncrement, targetScore);
        currentEfficiency = Math.min(currentEfficiency + efficiencyIncrement, targetEfficiency);

        scoreEl.textContent = currentScore;
        headerScoreEl.textContent = previousTotal + currentScore;
        if (efficiencyEl) efficiencyEl.textContent = `${Math.round(currentEfficiency)}%`;

        SoundEngine.tick();
        await sleep(delay);
    }

    // Final values
    scoreEl.textContent = targetScore;
    headerScoreEl.textContent = GameState.totalScore;
    if (efficiencyEl) efficiencyEl.textContent = `${Math.round(targetEfficiency)}%`;
}

// snapPathToRoads() removed - snapping now happens in real-time via addPointToUserPath()

function findNearestNode(lat, lng) {
    let nearestNode = null;
    let nearestDist = Infinity;

    // Only search within the largest connected component to avoid disconnected nodes
    const validNodes = GameState.debug.largestComponentNodes || GameState.nodes;

    for (const [nodeId, pos] of GameState.nodes) {
        // Skip nodes not in the largest component
        if (validNodes instanceof Set && !validNodes.has(nodeId)) continue;

        const dist = haversineDistance(lat, lng, pos.lat, pos.lng);
        if (dist < nearestDist) {
            nearestDist = dist;
            nearestNode = nodeId;
        }
    }

    return nearestNode;
}

/**
 * Find a direct edge between two nodes if one exists.
 * Returns the edge object { neighbor, weight } or null.
 */
function findEdgeBetween(nodeA, nodeB) {
    const edges = GameState.edges.get(nodeA);
    if (!edges) return null;
    return edges.find(e => e.neighbor === nodeB) || null;
}

function findShortestPathBetween(startNode, endNode) {
    if (startNode === endNode) return [startNode];

    // Quick check for direct neighbors
    const neighbors = GameState.edges.get(startNode) || [];
    for (const { neighbor } of neighbors) {
        if (neighbor === endNode) {
            return [startNode, endNode];
        }
    }

    const openSet = new MinHeap();
    const closedSet = new Set();
    const cameFrom = new Map();
    const gScore = new Map();

    gScore.set(startNode, 0);
    const endPos = GameState.nodes.get(endNode);
    if (!endPos) {
        GameState.debug.snapFailures++;
        return []; // Invalid end node
    }

    openSet.insert({
        node: startNode,
        priority: heuristic(GameState.nodes.get(startNode), endPos)
    });

    // No arbitrary iteration limit - let A* complete properly
    while (!openSet.isEmpty()) {
        const current = openSet.extractMin().node;

        if (current === endNode) {
            const path = [current];
            let node = current;
            while (cameFrom.has(node)) {
                node = cameFrom.get(node);
                path.unshift(node);
            }
            GameState.debug.snapSuccesses++;
            return path;
        }

        if (closedSet.has(current)) continue;
        closedSet.add(current);

        for (const { neighbor, weight } of (GameState.edges.get(current) || [])) {
            if (closedSet.has(neighbor)) continue;

            const tentativeG = gScore.get(current) + weight;
            if (!gScore.has(neighbor) || tentativeG < gScore.get(neighbor)) {
                cameFrom.set(neighbor, current);
                gScore.set(neighbor, tentativeG);
                const f = tentativeG + heuristic(GameState.nodes.get(neighbor), endPos);
                openSet.insert({ node: neighbor, priority: f });
            }
        }
    }

    // No path found - nodes are disconnected in the graph
    GameState.debug.snapFailures++;
    return []; // Return empty array, NOT a fake path
}

// Old distance functions removed - replaced by calculateNodePathDistance() in PATH DISTANCE SYSTEM section

// =============================================================================
// LOCATION SEARCH
// =============================================================================

async function searchLocation() {
    const query = document.getElementById('location-search').value.trim();
    if (!query) return;

    showLoading('Searching location...');

    try {
        const response = await fetch(
            `${CONFIG.nominatimUrl}?format=json&q=${encodeURIComponent(query)}&limit=1`,
            { headers: { 'User-Agent': 'AStarPathfindingGame/1.0' } }
        );

        if (!response.ok) throw new Error('Search failed');
        const data = await response.json();

        if (data.length === 0) {
            hideLoading();
            alert('Location not found.');
            return;
        }

        const result = data[0];
        const lat = parseFloat(result.lat);
        const lng = parseFloat(result.lon);
        const name = result.display_name.split(',').slice(0, 2).join(', ');

        GameState.map.setView([lat, lng], 15);
        clearVisualization();
        clearUserPath();
        if (GameState.startMarker) GameState.map.removeLayer(GameState.startMarker);
        if (GameState.endMarker) GameState.map.removeLayer(GameState.endMarker);
        if (GameState.startLabel) GameState.map.removeLayer(GameState.startLabel);
        if (GameState.endLabel) GameState.map.removeLayer(GameState.endLabel);

        GameState.gameStarted = false;
        GameState.currentRound = 1;
        GameState.totalScore = 0;
        updateScoreDisplay();
        updateRoundDisplay();

        await loadRoadNetwork({ lat, lng, name });

    } catch (error) {
        console.error('Search error:', error);
        hideLoading();
        alert('Error searching location.');
    }
}

// =============================================================================
// UI HELPERS
// =============================================================================

function showLoading(text, allowHtml = false) {
    const loadingText = document.getElementById('loading-text');
    if (allowHtml || text.includes('<')) {
        loadingText.innerHTML = text;
    } else {
        loadingText.textContent = text;
    }
    document.getElementById('loading-overlay').classList.remove('hidden');
}

function hideLoading() {
    document.getElementById('loading-overlay').classList.add('hidden');
}

// =============================================================================
// LOCATION SELECTOR
// =============================================================================

function initLocationSelector() {
    // Add click handlers for location options
    document.querySelectorAll('.location-option').forEach(btn => {
        btn.addEventListener('click', () => {
            const mode = btn.dataset.mode;
            selectLocationMode(mode);
        });
    });
}

function showLocationSelector() {
    // Hide loading overlay first
    document.getElementById('loading-overlay').classList.add('hidden');
    document.getElementById('location-selector').classList.remove('hidden');
}

function hideLocationSelector() {
    document.getElementById('location-selector').classList.add('hidden');
}

function selectLocationMode(mode) {
    GameState.locationMode = mode;
    hideLocationSelector();

    // Show loading overlay
    document.getElementById('loading-overlay').classList.remove('hidden');
    document.getElementById('loading-text').textContent = 'Finding location...';

    if (mode === 'local') {
        // Use browser geolocation
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const location = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                        zoom: 15,
                        name: 'Your Location'
                    };
                    // Try to get city name via reverse geocoding
                    reverseGeocode(location.lat, location.lng).then(name => {
                        location.name = name || 'Your Location';
                        startGameWithLocation(location);
                    });
                },
                (error) => {
                    console.warn('Geolocation failed:', error);
                    // Fall back to random US city
                    const fallback = getRandomCity('us');
                    startGameWithLocation(fallback);
                },
                { timeout: 10000, enableHighAccuracy: false }
            );
        } else {
            // Geolocation not supported, fall back
            const fallback = getRandomCity('us');
            startGameWithLocation(fallback);
        }
    } else if (mode === 'us') {
        const city = getRandomCity('us');
        startGameWithLocation(city);
    } else if (mode === 'global') {
        const city = getRandomCity('global');
        startGameWithLocation(city);
    }
}

function getRandomCity(mode) {
    const cities = mode === 'us' ? CONFIG.usCities : CONFIG.globalCities;
    return cities[Math.floor(Math.random() * cities.length)];
}

async function reverseGeocode(lat, lng) {
    try {
        const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
            { headers: { 'User-Agent': 'pathfindr-game' } }
        );
        const data = await response.json();
        if (data.address) {
            const city = data.address.city || data.address.town || data.address.village || data.address.municipality;
            const state = data.address.state;
            const country = data.address.country_code?.toUpperCase();
            if (city && state && country === 'US') {
                return `${city}, ${state}`;
            } else if (city && country) {
                return `${city}, ${country}`;
            } else if (city) {
                return city;
            }
        }
        return null;
    } catch (e) {
        console.warn('Reverse geocoding failed:', e);
        return null;
    }
}

function startGameWithLocation(location) {
    GameState.currentCity = location;
    updateLocationDisplay(location.name);
    document.getElementById('loading-text').textContent = 'Loading road network...';
    loadRoadNetwork(location);
}

function updateLocationDisplay(name) {
    const el = document.getElementById('current-location');
    if (el) el.textContent = name;
}

function showInstructions() {
    document.getElementById('instructions-overlay').classList.remove('hidden');
}

function hideInstructions() {
    document.getElementById('instructions-overlay').classList.add('hidden');
}

function showResults() {
    SoundEngine.slide();
    document.getElementById('results-panel').classList.add('visible');
}

function hideResults() {
    document.getElementById('results-panel').classList.remove('visible');
}

function showGameOver() {
    // Animate the final score count-up
    const finalScoreEl = document.getElementById('final-score');
    animateFinalScore(GameState.totalScore, finalScoreEl);

    const maxPossible = CONFIG.totalRounds * CONFIG.maxScore;
    const percentage = (GameState.totalScore / maxPossible) * 100;

    let message;
    if (percentage >= 90) message = "Pathfinding mastery achieved. Impressive.";
    else if (percentage >= 75) message = "Excellent navigation instincts.";
    else if (percentage >= 60) message = "Solid performance. Room to optimize.";
    else if (percentage >= 40) message = "Not bad. Keep calibrating.";
    else message = "The optimal path remains elusive.";

    document.getElementById('rank-message').textContent = message;

    // Generate round summary
    const summaryContainer = document.getElementById('rounds-summary');
    if (summaryContainer && GameState.roundScores) {
        summaryContainer.innerHTML = GameState.roundScores.map(r => `
            <div class="round-row">
                <span class="round-row-label">Round ${r.round}</span>
                <span class="round-row-efficiency">${r.efficiency.toFixed(0)}%</span>
                <span class="round-row-score">${r.score}</span>
            </div>
        `).join('');
    }

    document.getElementById('gameover-overlay').classList.remove('hidden');
}

async function animateFinalScore(targetScore, element) {
    let currentScore = 0;
    const increment = Math.max(1, Math.ceil(targetScore / 40));
    const delay = 30;

    while (currentScore < targetScore) {
        currentScore = Math.min(currentScore + increment, targetScore);
        element.textContent = currentScore;
        SoundEngine.tick();
        await sleep(delay);
    }

    element.textContent = targetScore;
}

function hideGameOver() {
    document.getElementById('gameover-overlay').classList.add('hidden');
}

function updateScoreDisplay() {
    document.getElementById('current-score').textContent = GameState.totalScore;
}

function updateRoundDisplay() {
    document.getElementById('current-round').textContent = GameState.currentRound;
}

function updateMuteButton(muted) {
    const btn = document.getElementById('mute-btn');
    if (!btn) return;

    if (muted) {
        btn.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M11 5L6 9H2v6h4l5 4V5z"/>
                <line x1="23" y1="9" x2="17" y2="15"/>
                <line x1="17" y1="9" x2="23" y2="15"/>
            </svg>
        `;
        btn.classList.add('muted');
        btn.title = 'Sound Off (M)';
    } else {
        btn.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
                <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
            </svg>
        `;
        btn.classList.remove('muted');
        btn.title = 'Sound On (M)';
    }
}

function toggleMute() {
    SoundEngine.init();
    const muted = SoundEngine.toggleMute();
    updateMuteButton(muted);
}

// =============================================================================
// UTILITIES
// =============================================================================

function haversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function toRad(deg) {
    return deg * (Math.PI / 180);
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// =============================================================================
// CUSTOM ROAD NETWORK RENDERING
// =============================================================================

/**
 * Draw the road network with cyberpunk CRT aesthetic.
 * Always visible as the base layer - the "canvas" for pathfinding.
 * Includes subtle CRT flicker and breathing effects.
 */
function drawRoadNetwork(ctx) {
    // Use passed context or default to vizCtx
    ctx = ctx || GameState.vizCtx;
    const width = GameState.vizCanvas.width;
    const height = GameState.vizCanvas.height;

    if (GameState.edgeList.length === 0) return;

    // CRT flicker effect
    const time = performance.now() * 0.001;
    const flicker = 0.85 + Math.sin(time * 30) * 0.02 + Math.sin(time * 7) * 0.03 + (Math.random() - 0.5) * 0.05;
    const breathing = 0.95 + Math.sin(time * 0.5) * 0.05;
    const crtIntensity = flicker * breathing;

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Build visible edges array first
    const visibleEdges = [];
    for (const edge of GameState.edgeList) {
        const from = GameState.map.latLngToContainerPoint([edge.fromPos.lat, edge.fromPos.lng]);
        const to = GameState.map.latLngToContainerPoint([edge.toPos.lat, edge.toPos.lng]);

        // Skip edges completely off-screen
        if (from.x < -100 && to.x < -100) continue;
        if (from.x > width + 100 && to.x > width + 100) continue;
        if (from.y < -100 && to.y < -100) continue;
        if (from.y > height + 100 && to.y > height + 100) continue;

        visibleEdges.push({ from, to });
    }

    // Use lighter composite for glow effect
    ctx.globalCompositeOperation = 'lighter';

    // Outer glow layer
    ctx.strokeStyle = `rgba(255, 140, 50, ${0.08 * crtIntensity})`;
    ctx.lineWidth = 6;
    ctx.beginPath();
    for (const edge of visibleEdges) {
        ctx.moveTo(edge.from.x, edge.from.y);
        ctx.lineTo(edge.to.x, edge.to.y);
    }
    ctx.stroke();

    // Mid glow layer
    ctx.strokeStyle = `rgba(255, 140, 50, ${0.15 * crtIntensity})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (const edge of visibleEdges) {
        ctx.moveTo(edge.from.x, edge.from.y);
        ctx.lineTo(edge.to.x, edge.to.y);
    }
    ctx.stroke();

    ctx.globalCompositeOperation = 'source-over';

    // Core line
    ctx.strokeStyle = `rgba(255, 140, 50, ${0.5 * crtIntensity})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (const edge of visibleEdges) {
        ctx.moveTo(edge.from.x, edge.from.y);
        ctx.lineTo(edge.to.x, edge.to.y);
    }
    ctx.stroke();
}

/**
 * Draw road network with soft ambient glow during A* visualization.
 * Simple, performant, warm effect - BATCHED rendering for performance.
 */
function drawRoadNetworkScanning(ctx, time, pulsePhase) {
    ctx = ctx || GameState.vizCtx;
    const width = GameState.vizCanvas.width;
    const height = GameState.vizCanvas.height;

    if (GameState.edgeList.length === 0) return;

    // Soft breathing - very slow, gentle pulse
    const breathe = 0.9 + Math.sin(time * 0.7) * 0.1;

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Build visible edges array (BATCHED - no per-edge calculations)
    const visibleEdges = [];
    for (const edge of GameState.edgeList) {
        const from = GameState.map.latLngToContainerPoint([edge.fromPos.lat, edge.fromPos.lng]);
        const to = GameState.map.latLngToContainerPoint([edge.toPos.lat, edge.toPos.lng]);

        // Skip edges completely off-screen
        if (from.x < -100 && to.x < -100) continue;
        if (from.x > width + 100 && to.x > width + 100) continue;
        if (from.y < -100 && to.y < -100) continue;
        if (from.y > height + 100 && to.y > height + 100) continue;

        visibleEdges.push({ from, to });
    }

    // Soft outer glow - SINGLE batched draw call
    ctx.globalCompositeOperation = 'lighter';
    ctx.strokeStyle = `rgba(255, 140, 50, ${0.08 * breathe})`;
    ctx.lineWidth = 5;
    ctx.beginPath();
    for (const edge of visibleEdges) {
        ctx.moveTo(edge.from.x, edge.from.y);
        ctx.lineTo(edge.to.x, edge.to.y);
    }
    ctx.stroke();

    // Core lines - SINGLE batched draw call
    ctx.globalCompositeOperation = 'source-over';
    ctx.strokeStyle = `rgba(255, 140, 50, ${0.35 * breathe})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (const edge of visibleEdges) {
        ctx.moveTo(edge.from.x, edge.from.y);
        ctx.lineTo(edge.to.x, edge.to.y);
    }
    ctx.stroke();
}

/**
 * Clear the road network canvas.
 */
function clearRoadNetwork() {
    const ctx = GameState.vizCtx;
    ctx.clearRect(0, 0, GameState.vizCanvas.width, GameState.vizCanvas.height);
}

/**
 * Toggle between custom road view and standard map view.
 */
function toggleMapView() {
    GameState.showCustomRoads = !GameState.showCustomRoads;

    const btn = document.getElementById('toggle-view-btn');
    const text = document.getElementById('view-mode-text');
    const mapContainer = document.getElementById('map-container');

    if (GameState.showCustomRoads) {
        mapContainer.classList.add('custom-roads-mode');
        drawRoadNetwork();
        if (text) text.textContent = 'Map View';
        if (btn) btn.classList.add('active');
    } else {
        mapContainer.classList.remove('custom-roads-mode');
        clearRoadNetwork();
        if (text) text.textContent = 'Road View';
        if (btn) btn.classList.remove('active');
    }
}

// =============================================================================
// DEBUG SYSTEM
// =============================================================================

function analyzeGraphConnectivity() {
    const visited = new Set();
    const components = [];

    for (const nodeId of GameState.nodes.keys()) {
        if (visited.has(nodeId)) continue;

        // BFS to find all nodes in this component
        const component = [];
        const queue = [nodeId];

        while (queue.length > 0) {
            const current = queue.shift();
            if (visited.has(current)) continue;
            visited.add(current);
            component.push(current);

            const neighbors = GameState.edges.get(current) || [];
            for (const { neighbor } of neighbors) {
                if (!visited.has(neighbor)) {
                    queue.push(neighbor);
                }
            }
        }

        components.push(component);
    }

    // Sort by size descending
    components.sort((a, b) => b.length - a.length);

    GameState.debug.graphComponents = components.length;
    GameState.debug.largestComponent = components.length > 0 ? components[0].length : 0;
    GameState.debug.componentSizes = components.map(c => c.length);

    // Store the largest component's nodes for potential use
    GameState.debug.largestComponentNodes = components.length > 0 ? new Set(components[0]) : new Set();
}

function toggleDebugMode() {
    GameState.debug.enabled = !GameState.debug.enabled;

    if (GameState.debug.enabled) {
        createDebugPanel();
        updateDebugPanel();
    } else {
        removeDebugPanel();
        clearDebugOverlay();
    }
}

function createDebugPanel() {
    // Remove existing panel if any
    removeDebugPanel();

    const panel = document.createElement('div');
    panel.id = 'debug-panel';
    panel.style.cssText = `
        position: fixed;
        top: 60px;
        left: 10px;
        width: 280px;
        background: rgba(0, 0, 0, 0.9);
        border: 1px solid #00f0ff;
        border-radius: 8px;
        padding: 15px;
        font-family: 'Courier New', monospace;
        font-size: 12px;
        color: #00f0ff;
        z-index: 10000;
        max-height: 80vh;
        overflow-y: auto;
    `;

    panel.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; border-bottom: 1px solid #00f0ff; padding-bottom: 8px;">
            <strong style="color: #fff;">DEBUG MODE</strong>
            <span style="color: #666; font-size: 10px;">Press D to close</span>
        </div>
        <div id="debug-content">Loading...</div>
        <div style="margin-top: 15px; border-top: 1px solid #333; padding-top: 10px;">
            <button id="debug-show-graph" style="
                background: #1a1a2e;
                border: 1px solid #00f0ff;
                color: #00f0ff;
                padding: 8px 12px;
                cursor: pointer;
                font-family: inherit;
                font-size: 11px;
                border-radius: 4px;
                margin-right: 5px;
            ">Toggle Graph Overlay</button>
            <button id="debug-test-astar" style="
                background: #1a1a2e;
                border: 1px solid #ff6b35;
                color: #ff6b35;
                padding: 8px 12px;
                cursor: pointer;
                font-family: inherit;
                font-size: 11px;
                border-radius: 4px;
            ">Test A* Path</button>
        </div>
    `;

    document.body.appendChild(panel);

    // Add event listeners
    document.getElementById('debug-show-graph').addEventListener('click', toggleGraphOverlay);
    document.getElementById('debug-test-astar').addEventListener('click', testAStarPath);
}

function removeDebugPanel() {
    const panel = document.getElementById('debug-panel');
    if (panel) panel.remove();
}

function updateDebugPanel() {
    const content = document.getElementById('debug-content');
    if (!content) return;

    const debug = GameState.debug;
    const totalNodes = GameState.nodes.size;
    const totalEdges = GameState.edgeList.length;

    // Check if start/end are in the same component
    let startEndConnected = 'N/A';
    if (GameState.startNode && GameState.endNode && debug.largestComponentNodes) {
        const startInLargest = debug.largestComponentNodes.has(GameState.startNode);
        const endInLargest = debug.largestComponentNodes.has(GameState.endNode);
        if (startInLargest && endInLargest) {
            startEndConnected = '<span style="color: #39ff14;">YES (same component)</span>';
        } else {
            startEndConnected = '<span style="color: #ff2a6d;">NO (different components!)</span>';
        }
    }

    content.innerHTML = `
        <div style="margin-bottom: 12px;">
            <div style="color: #888; font-size: 10px; margin-bottom: 4px;">GRAPH STATS</div>
            <div>Nodes: <strong>${totalNodes.toLocaleString()}</strong></div>
            <div>Edges: <strong>${totalEdges.toLocaleString()}</strong></div>
            <div>Components: <strong style="color: ${debug.graphComponents > 1 ? '#ff6b35' : '#39ff14'}">${debug.graphComponents}</strong></div>
            <div>Largest: <strong>${debug.largestComponent.toLocaleString()}</strong> nodes (${((debug.largestComponent / totalNodes) * 100).toFixed(1)}%)</div>
        </div>

        <div style="margin-bottom: 12px;">
            <div style="color: #888; font-size: 10px; margin-bottom: 4px;">CURRENT ROUND</div>
            <div>Start Node: <strong>${GameState.startNode || 'None'}</strong></div>
            <div>End Node: <strong>${GameState.endNode || 'None'}</strong></div>
            <div>Connected: ${startEndConnected}</div>
        </div>

        <div style="margin-bottom: 12px;">
            <div style="color: #888; font-size: 10px; margin-bottom: 4px;">LAST SNAP OPERATION</div>
            <div>Successes: <strong style="color: #39ff14;">${debug.snapSuccesses}</strong></div>
            <div>Failures: <strong style="color: ${debug.snapFailures > 0 ? '#ff2a6d' : '#39ff14'};">${debug.snapFailures}</strong></div>
            ${debug.lastSnapDetails.length > 0 ? `
                <div style="color: #ff6b35; font-size: 10px; margin-top: 5px;">
                    Disconnected segments: ${debug.lastSnapDetails.length}
                </div>
            ` : ''}
        </div>

        <div>
            <div style="color: #888; font-size: 10px; margin-bottom: 4px;">DISTANCES</div>
            <div>User Path (snapped): <strong id="debug-user-dist">-</strong></div>
            <div>Optimal Path: <strong id="debug-optimal-dist">-</strong></div>
        </div>
    `;
}

function toggleGraphOverlay() {
    GameState.debug.showGraph = !GameState.debug.showGraph;

    const btn = document.getElementById('debug-show-graph');
    if (btn) {
        btn.style.background = GameState.debug.showGraph ? '#00f0ff' : '#1a1a2e';
        btn.style.color = GameState.debug.showGraph ? '#000' : '#00f0ff';
    }

    if (GameState.debug.showGraph) {
        drawGraphOverlay();
    } else {
        clearDebugOverlay();
    }
}

function drawGraphOverlay() {
    // Use the viz canvas for debug overlay
    const ctx = GameState.vizCtx;
    const width = GameState.vizCanvas.width;
    const height = GameState.vizCanvas.height;

    // Don't clear if visualization is active
    if (GameState.vizState.active) return;

    ctx.clearRect(0, 0, width, height);

    // Draw all edges
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.3)';
    ctx.lineWidth = 1;

    for (const edge of GameState.edgeList) {
        const fromScreen = GameState.map.latLngToContainerPoint([edge.fromPos.lat, edge.fromPos.lng]);
        const toScreen = GameState.map.latLngToContainerPoint([edge.toPos.lat, edge.toPos.lng]);

        // Check if edge is on screen
        if (fromScreen.x < -50 || fromScreen.x > width + 50 ||
            fromScreen.y < -50 || fromScreen.y > height + 50) continue;

        ctx.beginPath();
        ctx.moveTo(fromScreen.x, fromScreen.y);
        ctx.lineTo(toScreen.x, toScreen.y);
        ctx.stroke();
    }

    // Draw nodes in largest component vs others
    const largestNodes = GameState.debug.largestComponentNodes || new Set();

    for (const [nodeId, pos] of GameState.nodes) {
        const screen = GameState.map.latLngToContainerPoint([pos.lat, pos.lng]);

        if (screen.x < -10 || screen.x > width + 10 ||
            screen.y < -10 || screen.y > height + 10) continue;

        const inLargest = largestNodes.has(nodeId);
        ctx.fillStyle = inLargest ? 'rgba(0, 240, 255, 0.5)' : 'rgba(255, 107, 53, 0.8)';

        ctx.beginPath();
        ctx.arc(screen.x, screen.y, inLargest ? 2 : 3, 0, Math.PI * 2);
        ctx.fill();
    }

    // Draw disconnected segment indicators if any
    if (GameState.debug.lastSnapDetails.length > 0) {
        ctx.strokeStyle = '#ff2a6d';
        ctx.lineWidth = 3;
        ctx.setLineDash([5, 5]);

        for (const detail of GameState.debug.lastSnapDetails) {
            const fromPos = GameState.nodes.get(detail.from);
            const toPos = GameState.nodes.get(detail.to);
            if (!fromPos || !toPos) continue;

            const fromScreen = GameState.map.latLngToContainerPoint([fromPos.lat, fromPos.lng]);
            const toScreen = GameState.map.latLngToContainerPoint([toPos.lat, toPos.lng]);

            ctx.beginPath();
            ctx.moveTo(fromScreen.x, fromScreen.y);
            ctx.lineTo(toScreen.x, toScreen.y);
            ctx.stroke();
        }

        ctx.setLineDash([]);
    }
}

function clearDebugOverlay() {
    if (!GameState.vizState.active) {
        GameState.vizCtx.clearRect(0, 0, GameState.vizCanvas.width, GameState.vizCanvas.height);
    }
}

function testAStarPath() {
    if (!GameState.startNode || !GameState.endNode) {
        alert('No start/end nodes selected. Start a game first.');
        return;
    }

    // Run A* and show results
    const startTime = performance.now();
    const { path, explored } = runAStar(GameState.startNode, GameState.endNode);
    const endTime = performance.now();

    const distance = calculateNodePathDistance(path);

    let message = `A* Test Results:\n\n`;
    message += `Time: ${(endTime - startTime).toFixed(2)}ms\n`;
    message += `Nodes explored: ${explored.length}\n`;
    message += `Path length: ${path.length} nodes\n`;
    message += `Distance: ${distance.toFixed(3)} km\n\n`;

    if (path.length === 0) {
        message += `WARNING: No path found!\n`;
        message += `Start and end nodes may be in different graph components.`;
    } else {
        message += `Path found successfully.`;
    }

    alert(message);

    // Update debug distances
    const optimalDist = document.getElementById('debug-optimal-dist');
    if (optimalDist) {
        optimalDist.textContent = `${distance.toFixed(3)} km`;
    }
}

// Redraw graph overlay on map move if enabled
const originalOnMove = GameState.map ? GameState.map.on : null;
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        if (GameState.map) {
            GameState.map.on('move', () => {
                if (GameState.debug.enabled && GameState.debug.showGraph && !GameState.vizState.active) {
                    drawGraphOverlay();
                }
            });
            GameState.map.on('zoom', () => {
                if (GameState.debug.enabled && GameState.debug.showGraph && !GameState.vizState.active) {
                    drawGraphOverlay();
                }
            });
        }
    }, 1000);
});
