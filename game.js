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
        heatDecay: 0.988,           // faster decay for performance
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

    // Initialize AudioContext on first user interaction
    init() {
        if (this.initialized) return;

        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        this.masterGain = this.ctx.createGain();
        this.masterGain.connect(this.ctx.destination);
        this.masterGain.gain.value = 0.5;

        // Load mute preference
        this.muted = localStorage.getItem('pathfindr_muted') === 'true';
        if (this.muted) this.masterGain.gain.value = 0;

        this.initialized = true;
    },

    // Toggle mute state
    toggleMute() {
        this.muted = !this.muted;
        localStorage.setItem('pathfindr_muted', this.muted);

        if (this.initialized) {
            this.masterGain.gain.setTargetAtTime(
                this.muted ? 0 : 0.5,
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

        this.ambientNodes = { drone, lfo, noise, droneGain, noiseGain };
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
        redrawUserPath();
        if (GameState.showCustomRoads && !GameState.vizState.active) drawRoadNetwork();
        if (GameState.vizState.active) renderVisualization();
    });
    GameState.map.on('zoom', () => {
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

async function loadRoadNetwork(location) {
    showLoading('Loading road network...');

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

        if (!response.ok) throw new Error('Failed to fetch road data');

        const data = await response.json();
        processRoadData(data);

        document.getElementById('current-location').textContent = location.name;
        hideLoading();
        showInstructions();

    } catch (error) {
        console.error('Error loading road network:', error);
        showLoading('Error loading data. Please try again.');
    }
}

function processRoadData(data) {
    GameState.nodes.clear();
    GameState.edges.clear();
    GameState.edgeList = [];

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

                GameState.edgeList.push({
                    from: nodeA,
                    to: nodeB,
                    fromPos: posA,
                    toPos: posB
                });
            }
        }
    }

    // Analyze graph connectivity
    analyzeGraphConnectivity();

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
    SoundEngine.startAmbient();
    hideInstructions();
    GameState.gameStarted = true;
    enableDrawing();
    selectRandomEndpoints();
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

    if (GameState.currentRound < CONFIG.totalRounds) {
        GameState.currentRound++;
        updateRoundDisplay();

        // Get a new random city for the next round (same mode)
        if (GameState.locationMode !== 'local') {
            const newCity = getRandomCity(GameState.locationMode);
            GameState.currentCity = newCity;
            updateLocationDisplay(newCity.name);
            document.getElementById('loading-overlay').classList.remove('hidden');
            document.getElementById('loading-text').textContent = 'Loading new area...';
            loadRoadNetwork(newCity);
        } else {
            // For local mode, just pick new endpoints in same area
            selectRandomEndpoints();
            enableDrawing();
        }
    } else {
        showGameOver();
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

    let attempts = 0;
    let minDistance = 0.15;
    let maxDistance = 0.8;

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

function startDrawing(e) {
    if (e.button !== undefined && e.button !== 0) return;
    if (!GameState.gameStarted || !GameState.canDraw) return;

    GameState.isDrawing = true;
    GameState.drawCanvas.classList.add('drawing-active');
    GameState.map.dragging.disable();

    // Always start from the start node
    if (GameState.userPathNodes.length === 0) {
        GameState.userPathNodes.push(GameState.startNode);
        // Add start node position as first raw point
        const startPos = GameState.nodes.get(GameState.startNode);
        if (startPos) {
            GameState.userDrawnPoints.push({ lat: startPos.lat, lng: startPos.lng });
        }
        recalculateUserDistance();
        updateAllDistanceDisplays();
    }

    // Add the clicked point (raw + snapped)
    const point = getLatLngFromEvent(e);
    GameState.userDrawnPoints.push({ lat: point.lat, lng: point.lng });
    addPointToUserPath(point.lat, point.lng);
    redrawUserPath();
}

function draw(e) {
    if (!GameState.isDrawing) return;

    const point = getLatLngFromEvent(e);

    // Store raw point for distance calculation
    GameState.userDrawnPoints.push({ lat: point.lat, lng: point.lng });

    // Add point to path (addPointToUserPath handles deduplication)
    if (addPointToUserPath(point.lat, point.lng)) {
        redrawUserPath();
    }

    // Update distance from raw drawn points
    recalculateUserDistance();
    updateAllDistanceDisplays();
}

function stopDrawing() {
    if (GameState.isDrawing) {
        GameState.isDrawing = false;
        GameState.drawCanvas.classList.remove('drawing-active');
        GameState.map.dragging.enable();
    }

    // Enable submit button if enough points (for fallback, auto-submit handles most cases)
    if (GameState.userPathNodes.length >= CONFIG.minRoutePoints) {
        const submitBtn = document.getElementById('submit-btn');
        if (submitBtn) submitBtn.disabled = false;
    }
}

function handleTouchStart(e) {
    e.preventDefault();
    startDrawing({ clientX: e.touches[0].clientX, clientY: e.touches[0].clientY });
}

function handleTouchMove(e) {
    e.preventDefault();
    draw({ clientX: e.touches[0].clientX, clientY: e.touches[0].clientY });
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

    ctx.shadowColor = CONFIG.colors.userRoute;
    ctx.shadowBlur = 12;
    ctx.strokeStyle = CONFIG.colors.userRoute;
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    for (let i = 0; i < GameState.userPathNodes.length; i++) {
        const nodeId = GameState.userPathNodes[i];
        const pos = GameState.nodes.get(nodeId);
        if (!pos) continue;

        const screenPoint = GameState.map.latLngToContainerPoint([pos.lat, pos.lng]);
        if (i === 0) ctx.moveTo(screenPoint.x, screenPoint.y);
        else ctx.lineTo(screenPoint.x, screenPoint.y);
    }
    ctx.stroke();

    ctx.shadowBlur = 0;
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

    // Animate optimal path - start trace sound
    SoundEngine.startTrace();
    viz.phase = 'path';
    const pathDelay = CONFIG.viz.pathTraceSpeed / speed;

    for (let i = 0; i < path.length - 1; i++) {
        viz.pathProgress = i;

        // Update trace sound pitch based on progress
        SoundEngine.updateTrace(i / path.length);

        // Spawn path particles occasionally
        if (i % 2 === 0 && viz.particles.length < CONFIG.viz.maxParticles) {
            const pos = GameState.nodes.get(path[i]);
            if (pos) {
                viz.particles.push(createParticle(pos, 'path'));
            }
        }

        await sleep(pathDelay);
    }

    viz.pathProgress = path.length - 1;
    viz.phase = 'complete';

    // Stop trace sound and play resolve chime
    SoundEngine.stopTrace();
    SoundEngine.resolve();

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

function renderVisualization() {
    const ctx = GameState.vizCtx;
    const viz = GameState.vizState;
    const width = GameState.vizCanvas.width;
    const height = GameState.vizCanvas.height;

    ctx.clearRect(0, 0, width, height);

    viz.pulsePhase += CONFIG.viz.pulseSpeed;

    // Decay heat values
    for (const [nodeId, heat] of viz.nodeHeat) {
        viz.nodeHeat.set(nodeId, heat * CONFIG.viz.heatDecay);
    }
    for (const [edgeKey, heat] of viz.edgeHeat) {
        viz.edgeHeat.set(edgeKey, heat * CONFIG.viz.heatDecay);
    }

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Draw explored edges - OPTIMIZED (fewer glow layers)
    for (const edge of GameState.edgeList) {
        const edgeKey = `${Math.min(edge.from, edge.to)}-${Math.max(edge.from, edge.to)}`;
        const heat = viz.edgeHeat.get(edgeKey) || 0;

        if (heat > 0.03) {
            const fromScreen = GameState.map.latLngToContainerPoint([edge.fromPos.lat, edge.fromPos.lng]);
            const toScreen = GameState.map.latLngToContainerPoint([edge.toPos.lat, edge.toPos.lng]);

            const color = getHeatColor(heat);

            // Simplified glow - just 2 layers instead of 4
            ctx.shadowColor = `rgba(${color.r}, ${color.g}, ${color.b}, 1)`;
            ctx.shadowBlur = 15 * heat;
            ctx.strokeStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${0.6 * heat})`;
            ctx.lineWidth = 6 * heat;

            ctx.beginPath();
            ctx.moveTo(fromScreen.x, fromScreen.y);
            ctx.lineTo(toScreen.x, toScreen.y);
            ctx.stroke();

            // Core line
            ctx.shadowBlur = 0;
            ctx.strokeStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${0.9 * heat})`;
            ctx.lineWidth = 2 * heat;
            ctx.beginPath();
            ctx.moveTo(fromScreen.x, fromScreen.y);
            ctx.lineTo(toScreen.x, toScreen.y);
            ctx.stroke();
        }
    }

    ctx.shadowBlur = 0;

    // Draw explored nodes - OPTIMIZED (simpler glow)
    for (const [nodeId, heat] of viz.nodeHeat) {
        if (heat < 0.05) continue;

        const pos = GameState.nodes.get(nodeId);
        if (!pos) continue;

        const screen = GameState.map.latLngToContainerPoint([pos.lat, pos.lng]);
        const color = getHeatColor(heat);

        const pulse = 0.7 + 0.3 * Math.sin(viz.pulsePhase * 2 + nodeId * 0.001);
        const radius = CONFIG.viz.nodeGlowRadius * heat * pulse;

        // Simple radial gradient
        const gradient = ctx.createRadialGradient(
            screen.x, screen.y, 0,
            screen.x, screen.y, radius
        );
        gradient.addColorStop(0, `rgba(${color.r}, ${color.g}, ${color.b}, ${heat * 0.9})`);
        gradient.addColorStop(0.5, `rgba(${color.r}, ${color.g}, ${color.b}, ${heat * 0.3})`);
        gradient.addColorStop(1, `rgba(${color.r}, ${color.g}, ${color.b}, 0)`);

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(screen.x, screen.y, radius, 0, Math.PI * 2);
        ctx.fill();
    }

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

    // Simplified neon glow - 3 layers instead of 5
    const glowLayers = [
        { color: '0, 240, 255', blur: 25, width: 14, alpha: 0.2 },
        { color: '0, 240, 255', blur: 12, width: 8, alpha: 0.5 },
        { color: '150, 255, 255', blur: 4, width: 4, alpha: 0.9 },
    ];

    for (const layer of glowLayers) {
        ctx.shadowColor = `rgba(${layer.color}, 1)`;
        ctx.shadowBlur = layer.blur;
        ctx.strokeStyle = `rgba(${layer.color}, ${layer.alpha})`;
        ctx.lineWidth = layer.width;

        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
            ctx.lineTo(points[i].x, points[i].y);
        }
        ctx.stroke();
    }

    // Bright white core
    ctx.shadowBlur = 0;
    ctx.strokeStyle = 'rgba(255, 255, 255, 1)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.stroke();

    // Energy pulses along completed path
    if (viz.phase === 'complete' && points.length > 1) {
        const numPulses = 2; // Reduced from 3
        for (let p = 0; p < numPulses; p++) {
            const t = ((viz.pulsePhase * 0.25 + p / numPulses) % 1);
            const totalLen = points.length - 1;
            const idx = Math.floor(t * totalLen);
            const frac = (t * totalLen) - idx;

            if (idx < points.length - 1) {
                const x = points[idx].x + (points[idx + 1].x - points[idx].x) * frac;
                const y = points[idx].y + (points[idx + 1].y - points[idx].y) * frac;

                const pulseGrad = ctx.createRadialGradient(x, y, 0, x, y, 18);
                pulseGrad.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
                pulseGrad.addColorStop(0.4, 'rgba(0, 240, 255, 0.5)');
                pulseGrad.addColorStop(1, 'rgba(0, 240, 255, 0)');

                ctx.fillStyle = pulseGrad;
                ctx.beginPath();
                ctx.arc(x, y, 18, 0, Math.PI * 2);
                ctx.fill();
            }
        }
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
    for (const p of GameState.vizState.particles) {
        const screen = GameState.map.latLngToContainerPoint([p.lat, p.lng]);

        let color;
        if (p.type === 'explore') {
            color = getHeatColor(p.life);
        } else if (p.type === 'path') {
            color = { r: 0, g: 240, b: 255 };
        } else {
            color = { r: 255, g: 255, b: 255 };
        }

        const radius = p.size * p.life;

        // Simple glow
        ctx.shadowColor = `rgba(${color.r}, ${color.g}, ${color.b}, 0.8)`;
        ctx.shadowBlur = radius;

        ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${p.life * 0.8})`;
        ctx.beginPath();
        ctx.arc(screen.x, screen.y, radius, 0, Math.PI * 2);
        ctx.fill();
    }

    ctx.shadowBlur = 0;
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
 * Add a point to the user's path by snapping to nearest road node.
 * This is the ONLY way points should be added to the user path.
 */
function addPointToUserPath(lat, lng) {
    const nodeId = findNearestNode(lat, lng);
    if (nodeId === null) return false;

    // Avoid duplicate consecutive nodes
    const lastNode = GameState.userPathNodes[GameState.userPathNodes.length - 1];
    if (nodeId === lastNode) return false;

    GameState.userPathNodes.push(nodeId);
    recalculateUserDistance();
    updateAllDistanceDisplays();

    // Auto-complete: if user reached (or is very close to) the end node
    if (GameState.userPathNodes.length >= CONFIG.minRoutePoints) {
        const endPos = GameState.nodes.get(GameState.endNode);
        const nodePos = GameState.nodes.get(nodeId);

        // Check if exact match OR within 30 meters of end node
        const isAtEnd = nodeId === GameState.endNode ||
            (endPos && nodePos && haversineDistance(nodePos.lat, nodePos.lng, endPos.lat, endPos.lng) < 0.03);

        if (isAtEnd) {
            // If close but not exactly at end, add endNode to complete the path
            if (nodeId !== GameState.endNode) {
                GameState.userPathNodes.push(GameState.endNode);
                recalculateUserDistance();
                updateAllDistanceDisplays();
            }
            // Small delay for visual feedback, then auto-submit
            setTimeout(() => {
                if (!GameState.vizState.active) {  // Don't submit if already processing
                    submitRoute();
                }
            }, 150);
        }
    }

    return true;
}

/**
 * Recalculate the user's path distance from raw drawn points.
 * This measures the actual line the user drew, not snapped nodes.
 */
function recalculateUserDistance() {
    GameState.userDistance = calculateDrawnDistance();
}

/**
 * Calculate distance from raw drawn points (actual mouse path).
 * This is what the user visually drew - simple and accurate.
 */
function calculateDrawnDistance() {
    const points = GameState.userDrawnPoints;
    if (!points || points.length < 2) return 0;

    let total = 0;
    for (let i = 0; i < points.length - 1; i++) {
        total += haversineDistance(
            points[i].lat, points[i].lng,
            points[i + 1].lat, points[i + 1].lng
        );
    }
    return total;
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

function showLoading(text) {
    document.getElementById('loading-text').textContent = text;
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
    SoundEngine.stopAmbient();

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
 * Draw the road network with cyberpunk neon aesthetic.
 * Only shows roads that exist in our graph - what A* can actually use.
 */
function drawRoadNetwork() {
    const ctx = GameState.vizCtx;
    const width = GameState.vizCanvas.width;
    const height = GameState.vizCanvas.height;

    // Don't draw if visualization is active
    if (GameState.vizState.active) return;

    // Clear the canvas (background handled by CSS)
    ctx.clearRect(0, 0, width, height);

    if (GameState.edgeList.length === 0) return;

    // Draw all edges with neon glow effect
    ctx.strokeStyle = 'rgba(255, 140, 50, 0.5)';
    ctx.lineWidth = 1.5;
    ctx.shadowColor = '#ff8c32';
    ctx.shadowBlur = 6;
    ctx.lineCap = 'round';

    ctx.beginPath();
    for (const edge of GameState.edgeList) {
        const from = GameState.map.latLngToContainerPoint([edge.fromPos.lat, edge.fromPos.lng]);
        const to = GameState.map.latLngToContainerPoint([edge.toPos.lat, edge.toPos.lng]);

        // Skip edges completely off-screen
        if (from.x < -100 && to.x < -100) continue;
        if (from.x > width + 100 && to.x > width + 100) continue;
        if (from.y < -100 && to.y < -100) continue;
        if (from.y > height + 100 && to.y > height + 100) continue;

        ctx.moveTo(from.x, from.y);
        ctx.lineTo(to.x, to.y);
    }
    ctx.stroke();
    ctx.shadowBlur = 0;
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
