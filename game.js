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

    // US Cities for random selection (with optional districts)
    usCities: [
        {
            lat: 40.7128, lng: -74.0060, name: "New York, NY", zoom: 15,
            districts: [
                { lat: 40.7580, lng: -73.9855, name: "Midtown Manhattan", zoom: 16 },
                { lat: 40.7484, lng: -73.9857, name: "Times Square", zoom: 16 },
                { lat: 40.7061, lng: -74.0087, name: "Financial District", zoom: 16 },
                { lat: 40.7282, lng: -73.7949, name: "Queens", zoom: 15 },
                { lat: 40.6782, lng: -73.9442, name: "Brooklyn", zoom: 15 },
                { lat: 40.8448, lng: -73.8648, name: "The Bronx", zoom: 15 },
            ]
        },
        {
            lat: 34.0522, lng: -118.2437, name: "Los Angeles, CA", zoom: 15,
            districts: [
                { lat: 34.1022, lng: -118.3260, name: "Hollywood", zoom: 16 },
                { lat: 34.0195, lng: -118.4912, name: "Santa Monica", zoom: 16 },
                { lat: 34.0407, lng: -118.2468, name: "Downtown LA", zoom: 16 },
                { lat: 34.0259, lng: -118.7798, name: "Malibu", zoom: 15 },
                { lat: 33.9850, lng: -118.4695, name: "Venice Beach", zoom: 16 },
            ]
        },
        {
            lat: 41.8781, lng: -87.6298, name: "Chicago, IL", zoom: 15,
            districts: [
                { lat: 41.8827, lng: -87.6233, name: "The Loop", zoom: 16 },
                { lat: 41.9142, lng: -87.6345, name: "Lincoln Park", zoom: 16 },
                { lat: 41.8947, lng: -87.6116, name: "Magnificent Mile", zoom: 16 },
                { lat: 41.8507, lng: -87.6512, name: "Pilsen", zoom: 16 },
            ]
        },
        { lat: 29.7604, lng: -95.3698, name: "Houston, TX", zoom: 15 },
        { lat: 33.4484, lng: -112.0740, name: "Phoenix, AZ", zoom: 15 },
        { lat: 39.9526, lng: -75.1652, name: "Philadelphia, PA", zoom: 15 },
        { lat: 29.4241, lng: -98.4936, name: "San Antonio, TX", zoom: 15 },
        { lat: 32.7767, lng: -96.7970, name: "Dallas, TX", zoom: 15 },
        { lat: 37.3382, lng: -121.8863, name: "San Jose, CA", zoom: 15 },
        { lat: 30.2672, lng: -97.7431, name: "Austin, TX", zoom: 15 },
        {
            lat: 37.7749, lng: -122.4194, name: "San Francisco, CA", zoom: 15,
            districts: [
                { lat: 37.7879, lng: -122.4074, name: "Financial District", zoom: 16 },
                { lat: 37.7599, lng: -122.4148, name: "Mission District", zoom: 16 },
                { lat: 37.8044, lng: -122.4194, name: "North Beach", zoom: 16 },
                { lat: 37.7694, lng: -122.4862, name: "Golden Gate Park", zoom: 15 },
                { lat: 37.7651, lng: -122.4195, name: "Castro", zoom: 16 },
            ]
        },
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

    // Global Cities for random selection (with optional districts)
    globalCities: [
        {
            lat: 30.0309, lng: 31.4725, name: "New Cairo, Egypt", zoom: 15,
            wikiName: "New Cairo",  // For Wikipedia lookups
            districts: [
                { lat: 30.0309, lng: 31.4725, name: "Lotus District", zoom: 16, isDefault: true },
                { lat: 30.0254, lng: 31.4615, name: "Fifth Settlement", zoom: 16 },
                { lat: 30.0074, lng: 31.4934, name: "Rehab City", zoom: 16 },
                { lat: 29.9870, lng: 31.4356, name: "Madinaty", zoom: 16 },
            ]
        },
        {
            lat: 51.5074, lng: -0.1278, name: "London, UK", zoom: 15,
            districts: [
                { lat: 51.5137, lng: -0.0984, name: "City of London", zoom: 16 },
                { lat: 51.5014, lng: -0.1419, name: "Westminster", zoom: 16 },
                { lat: 51.5083, lng: -0.0758, name: "Tower Bridge", zoom: 16 },
                { lat: 51.5290, lng: -0.1255, name: "Camden", zoom: 16 },
                { lat: 51.4613, lng: -0.1156, name: "Brixton", zoom: 16 },
            ]
        },
        {
            lat: 48.8566, lng: 2.3522, name: "Paris, France", zoom: 15,
            districts: [
                { lat: 48.8584, lng: 2.2945, name: "Eiffel Tower", zoom: 16 },
                { lat: 48.8606, lng: 2.3376, name: "Le Marais", zoom: 16 },
                { lat: 48.8867, lng: 2.3431, name: "Montmartre", zoom: 16 },
                { lat: 48.8530, lng: 2.3499, name: "Latin Quarter", zoom: 16 },
                { lat: 48.8738, lng: 2.2950, name: "Champs-Élysées", zoom: 16 },
            ]
        },
        {
            lat: 35.6762, lng: 139.6503, name: "Tokyo, Japan", zoom: 15,
            districts: [
                { lat: 35.6595, lng: 139.7004, name: "Shibuya", zoom: 16 },
                { lat: 35.6938, lng: 139.7036, name: "Shinjuku", zoom: 16 },
                { lat: 35.7100, lng: 139.8107, name: "Akihabara", zoom: 16 },
                { lat: 35.6654, lng: 139.7707, name: "Ginza", zoom: 16 },
                { lat: 35.7148, lng: 139.7967, name: "Ueno", zoom: 16 },
            ]
        },
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

    // Segment distance limits by difficulty (in km)
    segmentDistance: {
        hard: 0.25,    // 250 meters - most granular, requires many clicks
        medium: 0.5,   // 500 meters - balanced gameplay
        easy: 1.0      // 1 kilometer - allows longer segments
    },

    // Visualization settings - ENHANCED for vibrant effects
    viz: {
        explorationDelay: 12,       // ms between exploration batches (slower = more visible)
        batchSize: 4,               // nodes per batch (fewer = more visible progression)
        nodeGlowRadius: 22,         // ENHANCED: larger glow radius
        edgeWidth: 5,               // ENHANCED: thicker edges
        heatDecay: 0.998,           // VERY slow decay for maximum persistence
        heatFloor: 0.6,             // HIGH floor so explored areas stay bright
        pulseSpeed: 0.065,          // pulse animation speed
        particleCount: 35,          // particles during exploration
        pathTraceSpeed: 8,          // path tracing speed (slower for more drama)
        maxParticles: 120,          // max particles allowed
        glowIntensity: 1.6,         // glow multiplier (brighter)
        saturationBoost: 1.3,       // color saturation boost
    },

    // ═══════════════════════════════════════════════════════════════════════════
    // UNIFIED COLOR SYSTEM - One color per round, three shades (hot/mid/cool)
    // ═══════════════════════════════════════════════════════════════════════════
    // COOL → HOT progression: difficulty increases as colors get warmer
    color: {
        // Base colors for each round - cool to hot progression
        // Round colors - DISTINCT, no purple/magenta to avoid confusion
        rounds: [
            { r: 0,   g: 230, b: 255, name: 'Cyan'     },  // Round 1: Electric Cyan
            { r: 100, g: 255, b: 100, name: 'Lime'     },  // Round 2: Bright Lime Green
            { r: 255, g: 220, b: 0,   name: 'Gold'     },  // Round 3: Electric Gold
            { r: 255, g: 100, b: 50,  name: 'Orange'   },  // Round 4: Neon Orange
            { r: 255, g: 50,  b: 50,  name: 'Red'      },  // Round 5: Hot Red (no purple!)
        ],

        // Shade multipliers for the three intensity levels
        // SIMPLIFIED: All shades use SAME hue, only brightness varies slightly
        // This keeps each round visually unified
        shades: {
            hot:  { brightness: 1.0 },   // Optimal path - full brightness
            mid:  { brightness: 1.0 },   // User path - same as optimal (distinguished by thickness)
            cool: { brightness: 0.7 },   // Exploration falloff - slightly dimmer, SAME HUE
        },

        // Get base color for a round
        getBase(roundNumber) {
            return this.rounds[(roundNumber - 1) % this.rounds.length];
        },

        // Get base color by index (for explorer/visualizer)
        getBaseByIndex(index) {
            return this.rounds[index % this.rounds.length];
        },

        // Apply shade to base color (hot/mid/cool)
        applyShade(base, shade) {
            const s = this.shades[shade] || this.shades.mid;
            return {
                r: Math.round(Math.min(255, base.r * s.brightness)),
                g: Math.round(Math.min(255, base.g * s.brightness)),
                b: Math.round(Math.min(255, base.b * s.brightness)),
            };
        },

        // Get full theme for a round with all three shades
        getTheme(roundNumber) {
            const base = this.getBase(roundNumber);
            return {
                base: base,
                hot: this.applyShade(base, 'hot'),      // Optimal path
                mid: this.applyShade(base, 'mid'),      // User path
                cool: this.applyShade(base, 'cool'),    // Ambient history
                name: base.name,
            };
        },

        // Get theme by index (for explorer/visualizer history cycling)
        getThemeByIndex(index) {
            const base = this.getBaseByIndex(index);
            return {
                base: base,
                hot: this.applyShade(base, 'hot'),
                mid: this.applyShade(base, 'mid'),
                cool: this.applyShade(base, 'cool'),
                name: base.name,
            };
        },

        // Ambient road colors - NEUTRAL dark grays so they don't compete with round colors
        ambient: {
            core:  { r: 80, g: 75, b: 70 },   // Warm dark gray
            mid:   { r: 60, g: 55, b: 55 },   // Medium gray
            outer: { r: 45, g: 42, b: 45 },   // Dark gray
        },

        // User path - ALWAYS WHITE for instant recognition
        // This stays constant across all rounds so players always know "this is MY path"
        userPath: { r: 255, g: 255, b: 255, name: 'White' },

        getAmbient() {
            return this.ambient;
        },

        getUserPathColor() {
            return this.userPath;
        },
    },

    // Electricity effect settings
    electricity: {
        pulseCount: 8,              // traveling pulses per path
        pulseSpeed: 0.003,          // pulse travel speed
        flickerIntensity: 0.15,     // line flicker amount
        arcFrequency: 0.02,         // chance of arc spark per frame
        wobbleAmount: 1.5,          // pixel wobble from noise
        idleIntensity: 0.65,        // brightness of idle/persistent paths (bumped for better visibility)
        activeIntensity: 1.0,       // brightness of active round
        visualizerIdleIntensity: 1.0, // Full intensity - explored edges NEVER fade
    },

    // Living Network - keeps visualization alive after pathfinding completes
    livingNetwork: {
        breatheSpeed: 0.3,          // Slower breathing for more dramatic effect
        breatheMin: 0.75,           // Higher minimum - paths never get too dim
        breatheMax: 1.0,            // Maximum brightness during breath
        rippleInterval: 2000,       // More frequent ripple waves
        rippleSpeed: 0.12,          // Slightly slower ripple spread
        rippleDuration: 2000,       // Longer lasting ripples
        powerPulseSpeed: 0.006,     // Slower, more visible energy pulses
        powerPulseCount: 16,        // More energy pulses along paths
        powerGlowIntensity: 1.8,    // Brighter optimal path glow
        sparkChance: 0.025,         // More frequent sparks
    },

    maxScore: 1000,
    // Multiple Overpass servers for fallback reliability
    overpassServers: [
        'https://overpass-api.de/api/interpreter',
        'https://overpass.kumi.systems/api/interpreter',
        'https://maps.mail.ru/osm/tools/overpass/api/interpreter'
    ],
    overpassUrl: 'https://overpass-api.de/api/interpreter', // Default, will rotate on failure
    nominatimUrl: 'https://nominatim.openstreetmap.org/search',

    // Supabase Edge Function URL for city facts
    cityFactsUrl: 'https://wxlglepsypmpnupxexoc.supabase.co/functions/v1/get-city-facts',

    // Supabase Edge Function URL for random cities
    randomCityUrl: 'https://wxlglepsypmpnupxexoc.supabase.co/functions/v1/get-random-city',
};

// =============================================================================
// GAME CONTROLLER - Central State Machine & Animation Coordinator
// =============================================================================
// Fixes: Competing animation loops, race conditions, unclear phase transitions
// All game state changes go through here for predictable behavior.

const GamePhase = {
    MENU: 'menu',           // Mode/location selection screens
    LOADING: 'loading',     // Loading road network
    PLAYING: 'playing',     // User drawing their path (competitive/explorer)
    VISUALIZING: 'visualizing', // A* visualization running
    RESULTS: 'results',     // Showing round results
    IDLE: 'idle',           // Between actions (visualizer mode waiting)
};

const GameController = {
    phase: GamePhase.MENU,
    previousPhase: null,

    // Cancellation token for async operations
    abortController: null,

    // Single animation frame ID - only ONE loop runs at a time
    animationId: null,
    lastFrameTime: 0,

    // Frame budget tracking (target 60fps = 16.67ms per frame)
    frameBudget: 16,
    frameOverruns: 0,

    // Phase transition with cleanup
    enterPhase(newPhase, options = {}) {
        if (this.phase === newPhase && !options.force) return;

        const oldPhase = this.phase;
        this.previousPhase = oldPhase;

        // Exit cleanup for old phase
        this._exitPhase(oldPhase);

        // Enter new phase
        this.phase = newPhase;
        this._enterPhase(newPhase, options);

        console.log(`[GameController] ${oldPhase} → ${newPhase}`);
    },

    _exitPhase(phase) {
        switch (phase) {
            case GamePhase.LOADING:
                // Cancel any pending load operations
                if (this.abortController) {
                    this.abortController.abort();
                    this.abortController = null;
                }
                break;
            case GamePhase.VISUALIZING:
                // Ensure viz state is cleaned up
                if (GameState.vizState) {
                    GameState.vizState.active = false;
                }
                break;
        }
    },

    _enterPhase(phase, options) {
        switch (phase) {
            case GamePhase.LOADING:
                this.abortController = new AbortController();
                break;
            case GamePhase.VISUALIZING:
                if (GameState.vizState) {
                    GameState.vizState.active = true;
                }
                break;
            case GamePhase.PLAYING:
                // Ensure ambient viz is running for gameplay
                if (!AmbientViz.active) {
                    AmbientViz.start();
                }
                break;
        }
    },

    // Check if operation should continue (for async loops)
    shouldContinue(expectedPhase) {
        return this.phase === expectedPhase &&
               (!this.abortController || !this.abortController.signal.aborted);
    },

    // Get abort signal for fetch operations
    getAbortSignal() {
        return this.abortController ? this.abortController.signal : null;
    },

    // =========================================================================
    // UNIFIED ANIMATION LOOP
    // =========================================================================
    // Single requestAnimationFrame that dispatches to subsystems based on phase.
    // This prevents competing loops and ensures consistent frame timing.

    startLoop() {
        if (this.animationId) return; // Already running

        // Stop AmbientViz's independent loop if it's running
        // GameController takes over all animation duties
        if (AmbientViz.animationId) {
            cancelAnimationFrame(AmbientViz.animationId);
            AmbientViz.animationId = null;
            console.log('[GameController] Took over from AmbientViz loop');
        }

        this.lastFrameTime = performance.now();
        this._loop();
    },

    stopLoop() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    },

    _loop() {
        const now = performance.now();
        const deltaTime = now - this.lastFrameTime;
        this.lastFrameTime = now;

        const frameStart = now;

        // Dispatch rendering based on current phase
        this._renderFrame(deltaTime);

        // Track frame budget (for debugging performance)
        const frameTime = performance.now() - frameStart;
        if (frameTime > this.frameBudget) {
            this.frameOverruns++;
        }

        // Continue loop
        this.animationId = requestAnimationFrame(() => this._loop());
    },

    _renderFrame(deltaTime) {
        const ctx = GameState.vizCtx;
        if (!ctx) return;

        const width = GameState.vizCanvas?.width || 0;
        const height = GameState.vizCanvas?.height || 0;

        // Always update subsystems (they track their own state)
        RoundHistory.update(deltaTime);
        ExplorerHistory.update(deltaTime);
        VisualizerHistory.update(deltaTime);
        ElectricitySystem.update(deltaTime);
        AmbientViz.updateProximityToEnd();

        // Phase-specific rendering
        switch (this.phase) {
            case GamePhase.VISUALIZING:
                // During A* visualization, renderVisualization handles everything
                renderVisualization();
                break;

            case GamePhase.PLAYING:
            case GamePhase.IDLE:
            case GamePhase.RESULTS:
                // Normal gameplay - AmbientViz handles all layers
                this._renderAmbientFrame(ctx, width, height, deltaTime);
                break;

            case GamePhase.MENU:
            case GamePhase.LOADING:
                // Minimal rendering during menus/loading
                ctx.clearRect(0, 0, width, height);
                if (GameState.useWebGL && GameState.edgeList?.length > 0) {
                    WebGLRenderer.renderAmbient(performance.now());
                }
                break;
        }
    },

    _renderAmbientFrame(ctx, width, height, deltaTime) {
        // Clear canvas
        ctx.clearRect(0, 0, width, height);

        // Layer 0: WebGL road network
        if (GameState.useWebGL && GameState.edgeList?.length > 0) {
            WebGLRenderer.renderAmbient(performance.now());
        }

        // Layer 1: Canvas 2D fallback
        if (!GameState.useWebGL && GameState.showCustomRoads) {
            drawRoadNetwork(ctx);
        }

        // Layer 2: History rendering based on game mode
        if (GameState.gameMode === 'explorer') {
            AmbientViz.renderPathHistory(ctx, deltaTime, ExplorerHistory.getPaths(), false);
        } else if (GameState.gameMode === 'visualizer') {
            AmbientViz.renderPathHistory(ctx, deltaTime, VisualizerHistory.getPaths(), false);
        } else {
            AmbientViz.renderRoundHistory(ctx, deltaTime, false);
        }

        // Layer 3: Ambient particles and marker auras
        AmbientViz.render(ctx, width, height, deltaTime);

        // Layer 4: Arc sparks
        ElectricitySystem.renderArcs(ctx);

        // Layer 5: Trace animation
        renderTraceAnimation(ctx);

        // Layer 6: User path
        if (GameState.gameStarted && GameState.userPathNodes.length >= 2) {
            redrawUserPath();
        }

        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = 1;
    },

    // Performance monitoring
    getFrameStats() {
        return {
            overruns: this.frameOverruns,
            phase: this.phase,
        };
    },

    resetStats() {
        this.frameOverruns = 0;
    }
};

// =============================================================================
// MAP TRANSITION - Smooth zoom animation during city loading
// =============================================================================

const MapTransition = {
    active: false,
    animationId: null,

    // Simple approach: Just update city name, don't animate the map
    // The map will be set to the correct position when road loading starts
    start(lat, lng, cityName = '', zoom = 15) {
        // Update city name display
        const cityEl = document.getElementById('loading-city');
        if (cityEl) cityEl.textContent = cityName || '';

        // Set map to target position immediately (needed for road network bounds)
        if (GameState.map) {
            GameState.map.jumpTo({ center: [lng, lat], zoom: zoom });
        }
    },

    stop() {
        // Nothing to stop anymore
    }
};

// Alias for backward compatibility
const GlobeAnimation = MapTransition;

// =============================================================================
// CITY FACTS - Fetches interesting facts about cities via Supabase Edge Function
// =============================================================================

const CityFacts = {
    cache: new Map(),  // Local cache to avoid repeated requests
    currentFact: null,
    factIndex: 0,      // Rotate through facts for the same city

    // =========================================================================
    // TESTING MODE: Set to true to aggressively fetch facts for all cities
    // This builds up the Supabase database with facts during testing.
    // The Edge Function will skip re-fetching if facts already exist in DB,
    // but this ensures we HIT the API for every unique city we visit.
    // Set to false in production to reduce API calls.
    // =========================================================================
    TESTING_MODE: true,
    citiesQueried: new Set(),  // Track unique cities queried this session

    /**
     * Fetch facts for a city from Supabase Edge Function
     * Results are cached locally and on the server
     */
    async fetchFacts(cityName) {
        // In testing mode, log every unique city we query
        if (this.TESTING_MODE && !this.citiesQueried.has(cityName)) {
            this.citiesQueried.add(cityName);
            console.log(`[CityFacts] Testing mode: Queried ${this.citiesQueried.size} unique cities this session`);
            console.log(`[CityFacts] Cities: ${Array.from(this.citiesQueried).join(', ')}`);
        }

        // Check local cache first (still cache locally for performance)
        if (this.cache.has(cityName)) {
            return this.cache.get(cityName);
        }

        try {
            const response = await fetch(CONFIG.cityFactsUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${PathfindrConfig.supabase.anonKey}`,
                },
                body: JSON.stringify({ city: cityName }),
            });

            if (!response.ok) {
                throw new Error(`Facts API error: ${response.status}`);
            }

            const data = await response.json();
            const facts = data.facts || [];

            // Cache locally
            this.cache.set(cityName, facts);

            return facts;
        } catch (error) {
            console.warn('Failed to fetch city facts:', error);
            // Return fallback facts
            return this.getFallbackFacts(cityName);
        }
    },

    /**
     * Get a random fact for the current city
     */
    async getRandomFact(cityName) {
        const facts = await this.fetchFacts(cityName);
        if (facts.length === 0) return null;

        // Rotate through facts to avoid repetition
        this.factIndex = (this.factIndex + 1) % facts.length;
        this.currentFact = facts[this.factIndex];
        return this.currentFact;
    },

    /**
     * Display fact in the results panel
     */
    async showFactInResults(cityName) {
        const factEl = document.getElementById('location-fact');
        const factTextEl = document.getElementById('fact-text');

        if (!factEl || !factTextEl) return;

        // Use wikiName if available for better lookups
        const lookupName = this.getWikiName(cityName);
        const fact = await this.getRandomFact(lookupName);

        if (fact) {
            factTextEl.textContent = fact;
            factEl.classList.remove('hidden');
        } else {
            factEl.classList.add('hidden');
        }
    },

    /**
     * Get the Wikipedia-friendly name for a city
     */
    getWikiName(cityName) {
        // Check if this is the current city and it has a wikiName
        if (GameState.currentCity?.name === cityName && GameState.currentCity?.wikiName) {
            return GameState.currentCity.wikiName;
        }

        // Check if we have a wikiName defined for this city in CONFIG
        const allCities = [...CONFIG.usCities, ...CONFIG.globalCities];
        const city = allCities.find(c => c.name === cityName);
        if (city?.wikiName) return city.wikiName;

        // Otherwise strip country/state suffix for better Wikipedia results
        // "New York, NY" -> "New York"
        // "Tokyo, Japan" -> "Tokyo"
        return cityName.split(',')[0].trim();
    },

    /**
     * Display fact in the transition overlay
     */
    async showFactInTransition(cityName) {
        const factEl = document.getElementById('transition-fact');
        if (!factEl) return;

        const lookupName = this.getWikiName(cityName);
        const fact = await this.getRandomFact(lookupName);
        factEl.textContent = fact || '';
    },

    /**
     * Fallback facts when API is unavailable
     */
    getFallbackFacts(cityName) {
        return [
            `Navigate the streets of ${cityName} and find the optimal path!`,
            `${cityName}'s road network awaits your pathfinding skills.`,
            `Every city has its own rhythm. Discover ${cityName}'s street patterns.`,
            `Can you beat the A* algorithm in ${cityName}?`,
            `Explore ${cityName}'s unique urban geography.`,
        ];
    },

    /**
     * Preload facts for a city (call during loading screens)
     */
    preload(cityName) {
        // Fire and forget - just populate the cache
        const lookupName = this.getWikiName(cityName);
        this.fetchFacts(lookupName).catch(() => {});
    },

    // =========================================================================
    // STREAMING FACTS TICKER (for Explorer/Visualizer modes)
    // =========================================================================

    ticker: {
        active: false,
        interval: null,
        currentIndex: 0,
        facts: [],
        cityName: null,
        intervalMs: 8000,  // 8 seconds between facts
    },

    /**
     * Start the facts ticker for Explorer/Visualizer modes
     */
    async startTicker(cityName) {
        const tickerEl = document.getElementById('facts-ticker');
        const textEl = document.getElementById('ticker-text');
        if (!tickerEl || !textEl) return;

        // Stop any existing ticker
        this.stopTicker();

        // Get facts for this city
        const lookupName = this.getWikiName(cityName);
        this.ticker.facts = await this.fetchFacts(lookupName);
        this.ticker.cityName = cityName;
        this.ticker.currentIndex = 0;
        this.ticker.active = true;

        // Show first fact immediately
        this.showNextTickerFact();

        // Show the ticker
        tickerEl.classList.remove('hidden');

        // Start rotating facts
        this.ticker.interval = setInterval(() => {
            if (this.ticker.active) {
                this.showNextTickerFact();
            }
        }, this.ticker.intervalMs);
    },

    /**
     * Show the next fact in the ticker
     */
    showNextTickerFact() {
        const textEl = document.getElementById('ticker-text');
        if (!textEl || this.ticker.facts.length === 0) return;

        // Get next fact
        const fact = this.ticker.facts[this.ticker.currentIndex];
        this.ticker.currentIndex = (this.ticker.currentIndex + 1) % this.ticker.facts.length;

        // Animate the text change
        textEl.style.animation = 'none';
        textEl.offsetHeight; // Trigger reflow
        textEl.style.animation = 'ticker-text-fade 0.4s ease-out';
        textEl.textContent = fact;
    },

    /**
     * Stop the facts ticker
     */
    stopTicker() {
        const tickerEl = document.getElementById('facts-ticker');
        if (tickerEl) tickerEl.classList.add('hidden');

        if (this.ticker.interval) {
            clearInterval(this.ticker.interval);
            this.ticker.interval = null;
        }
        this.ticker.active = false;
        this.ticker.facts = [];
        this.ticker.currentIndex = 0;
    },

    /**
     * Update ticker with new city (when map moves significantly)
     */
    async updateTickerCity(cityName) {
        if (!this.ticker.active) return;
        if (cityName === this.ticker.cityName) return;

        // Fetch new facts
        const lookupName = this.getWikiName(cityName);
        const newFacts = await this.fetchFacts(lookupName);

        if (newFacts.length > 0) {
            this.ticker.facts = newFacts;
            this.ticker.cityName = cityName;
            this.ticker.currentIndex = 0;
            this.showNextTickerFact();
        }
    },
};

// =============================================================================
// CITY DATABASE - Fetch random cities from Supabase
// =============================================================================

const CityDB = {
    // =========================================================================
    // TESTING MODE: Set to true to use Supabase cities database
    // When enabled, getRandomCity() will fetch from the DB instead of
    // using the hardcoded lists. This allows access to 40,000+ cities.
    // Set to false to use only the hardcoded CONFIG.usCities/globalCities.
    // =========================================================================
    enabled: true,

    // Cache for fetched cities to avoid redundant API calls
    cache: new Map(),

    /**
     * Fetch a random city from Supabase
     * @param {Object} options - Filter options
     * @param {string} options.countryCode - ISO country code (e.g., "US", "GB")
     * @param {number} options.minPopulation - Minimum population filter
     * @returns {Promise<Object>} City object with lat, lng, name, etc.
     */
    async getRandomCity(options = {}) {
        const { countryCode, minPopulation = 10000 } = options;

        try {
            const params = new URLSearchParams();
            if (countryCode) params.set('country_code', countryCode);
            if (minPopulation) params.set('min_population', minPopulation.toString());

            const url = `${CONFIG.randomCityUrl}?${params.toString()}`;

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${PathfindrConfig.supabase.anonKey}`,
                },
            });

            if (!response.ok) {
                throw new Error(`City API error: ${response.status}`);
            }

            const data = await response.json();

            if (data.city) {
                // Build full location name: City, Region/State, Country
                let locationName = data.city.name;
                if (data.city.region) {
                    locationName += `, ${data.city.region}`;
                }
                if (data.city.country) {
                    locationName += `, ${data.city.country}`;
                }

                // Convert to the format expected by the game
                return {
                    lat: parseFloat(data.city.lat),
                    lng: parseFloat(data.city.lng),
                    name: locationName,
                    zoom: this.getZoomForPopulation(data.city.population),
                    population: data.city.population,
                    fromDB: true,
                };
            }

            return null;
        } catch (error) {
            console.error('[CityDB] Error fetching random city:', error);
            return null;
        }
    },

    /**
     * Get appropriate zoom level based on city population
     * Larger cities = lower zoom (more zoomed out)
     * Smaller cities = higher zoom (more zoomed in)
     */
    getZoomForPopulation(population) {
        if (!population) return 15;
        if (population > 5000000) return 14;  // Megacities
        if (population > 1000000) return 14;  // Major cities
        if (population > 500000) return 15;   // Large cities
        if (population > 100000) return 15;   // Medium cities
        if (population > 50000) return 16;    // Small cities
        return 16;                            // Towns
    },

    /**
     * Get a random city for US mode
     */
    async getRandomUSCity() {
        return this.getRandomCity({ countryCode: 'US', minPopulation: 25000 });
    },

    /**
     * Get a random city for global/world mode
     */
    async getRandomWorldCity() {
        return this.getRandomCity({ minPopulation: 50000 });
    },
};

// =============================================================================
// WEBGL RENDERER - GPU-Accelerated Road Network Rendering
// =============================================================================

const WebGLRenderer = {
    canvas: null,
    gl: null,
    initialized: false,

    // Shader programs
    programs: {
        roads: null,       // Ambient road network
        heatEdges: null,   // Heat-mapped exploration edges
        glow: null,        // Glow effect pass
        atmosphere: null,  // Soft atmospheric glow
    },

    // Buffers
    buffers: {
        edgePositions: null,   // Float32Array of edge vertices
        edgeNormals: null,     // Float32Array of edge normals
        edgeHeats: null,       // Float32Array of heat values per edge
        edgeIndices: null,     // Element array buffer for indexed drawing (ALL edges)
        exploredIndices: null, // Element array buffer for explored edges ONLY
    },

    // Index count for drawing
    indexCount: 0,
    exploredIndexCount: 0,     // Number of indices for explored edges only

    // State
    edgeCount: 0,
    edgeKeyToIndex: new Map(),  // Map edgeKey -> index in buffer
    exploredEdgeSet: new Set(), // Track which edges are already in explored buffer
    exploredIndicesData: null,  // Uint16Array for explored indices (CPU-side)
    heatData: null,             // Float32Array for heat values
    needsHeatUpdate: false,
    needsExploredUpdate: false, // Flag for explored buffer upload
    globalOpacity: 1.0,         // For settling transition fadeout

    // Uniforms
    uniforms: {
        time: 0,
        resolution: [0, 0],
        viewMatrix: null,
    },

    // Shaders source code
    shaders: {
        // Vertex shader for thick lines (road edges)
        roadVertex: `
            precision mediump float;

            attribute vec2 a_position;
            attribute vec2 a_normal;
            attribute float a_heat;

            uniform vec2 u_resolution;
            uniform float u_lineWidth;
            uniform float u_time;

            varying float v_heat;
            varying vec2 v_position;

            void main() {
                v_heat = a_heat;
                v_position = a_position;

                // Expand vertex along normal for line thickness
                vec2 pos = a_position + a_normal * u_lineWidth;

                // Convert to clip space
                vec2 clipSpace = (pos / u_resolution) * 2.0 - 1.0;
                gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
            }
        `,

        // Fragment shader for ambient roads - slow, meditative, ASMR energy
        ambientFragment: `
            precision mediump float;

            uniform float u_time;
            uniform vec2 u_resolution;
            uniform vec2 u_center;

            varying float v_heat;
            varying vec2 v_position;

            void main() {
                // Distance from center for radial gradient
                float dist = distance(v_position, u_center) / max(u_resolution.x, u_resolution.y);

                // Very slow flow coordinate - glacial movement
                float flowCoord = (v_position.x + v_position.y) * 0.003;

                // Single slow wave - 60 second cycle (u_time * 0.1 = full cycle every ~63s)
                float slowWave = sin(flowCoord * 1.0 - u_time * 0.1) * 0.5 + 0.5;

                // Second even slower wave - 90 second cycle, opposite direction
                float slowerWave = sin(flowCoord * 0.7 + u_time * 0.07) * 0.5 + 0.5;

                // Blend them gently
                float energyFlow = slowWave * 0.6 + slowerWave * 0.4;

                // Very slow breathing - 45 second cycle
                float breathe = 0.92 + sin(u_time * 0.14) * 0.08;

                // Color palette - warm amber core to cool purple edges
                vec3 warmCore = vec3(1.0, 0.5, 0.15);    // Warm orange
                vec3 midTone = vec3(0.9, 0.35, 0.5);     // Soft pink-orange
                vec3 coolEdge = vec3(0.5, 0.2, 0.6);     // Muted purple
                vec3 energyColor = vec3(0.3, 0.9, 1.0);  // Soft cyan

                // Base color gradient from center
                vec3 baseColor;
                if (dist < 0.35) {
                    baseColor = mix(warmCore, midTone, dist / 0.35);
                } else {
                    baseColor = mix(midTone, coolEdge, (dist - 0.35) / 0.65);
                }

                // Gentle energy color blend
                float energyMix = energyFlow * 0.2 * (1.0 - dist * 0.4);
                vec3 color = mix(baseColor, energyColor, energyMix);

                // Strong base visibility
                float baseAlpha = mix(0.7, 0.3, dist);

                // Subtle energy boost
                float energyBoost = energyFlow * 0.15;

                float alpha = (baseAlpha + energyBoost) * breathe;

                gl_FragColor = vec4(color * alpha, alpha);
            }
        `,

        // Fragment shader for heat-mapped exploration - uses ROUND COLOR with FRONTIER GLOW
        // v_heat now contains explorationTime (negative = not explored, positive = time when explored)
        heatFragment: `
            precision mediump float;

            uniform float u_time;
            uniform vec2 u_resolution;
            uniform vec3 u_roundColor;  // Current round's color (passed from JS)
            uniform float u_decaySpeed;  // Linear decay speed per second
            uniform float u_heatFloor;  // Minimum heat value
            uniform float u_flicker;    // Pre-computed flicker (CPU-side sin)
            uniform float u_frontierPulse;  // Pre-computed frontier pulse

            varying float v_heat;  // Actually explorationTime (or -1 if never explored)
            varying vec2 v_position;

            void main() {
                // v_heat < 0 means never explored
                if (v_heat < 0.0) discard;

                // Linear decay - MUCH faster than pow()
                // heat goes from 1.0 to floor over ~2 seconds
                float timeSinceExplored = u_time - v_heat;
                float heat = max(u_heatFloor, 1.0 - timeSinceExplored * u_decaySpeed);

                if (heat < 0.02) discard;

                // === ASMR SATISFACTION: Smooth wavefront with lingering glow ===

                // Frontier detection - very recent edges (< 0.5s old)
                float frontierStrength = smoothstep(0.5, 0.95, heat);

                // Subtle global breathing for "alive" feel (slow, calming)
                float breathe = 0.95 + u_flicker * 0.05;

                // Base brightness - explored edges maintain gentle visibility
                // Higher base for persistence, frontier gets dramatic boost
                float baseBrightness = 0.3 + heat * 0.4;

                // Frontier gets MUCH brighter - this is the satisfying wavefront
                float frontierBoost = 1.0 + frontierStrength * 2.5;

                // Gentle pulse only on frontier (not chaotic)
                float frontierPulse = 1.0 + frontierStrength * u_frontierPulse * 0.15;

                float brightness = baseBrightness * frontierBoost * frontierPulse * breathe;

                vec3 color = u_roundColor * brightness;

                // Subtle white bloom on frontier only (not harsh)
                float bloom = frontierStrength * 0.25;
                color = mix(color, vec3(1.0), bloom);

                // Alpha: explored edges stay visible, frontier is brightest
                float alpha = (0.4 + heat * 0.4) * (0.7 + frontierStrength * 0.4);

                gl_FragColor = vec4(color * alpha, alpha);
            }
        `,

        // Fragment shader for glow effect - uses ROUND COLOR
        // v_heat now contains explorationTime (negative = not explored)
        glowFragment: `
            precision mediump float;

            uniform float u_time;
            uniform vec2 u_resolution;
            uniform vec3 u_roundColor;  // Current round's color
            uniform float u_decaySpeed;
            uniform float u_heatFloor;
            uniform float u_glowPulse;  // Pre-computed glow pulse

            varying float v_heat;  // Actually explorationTime
            varying vec2 v_position;

            void main() {
                if (v_heat < 0.0) discard;

                // Linear decay - MUCH faster than pow()
                float timeSinceExplored = u_time - v_heat;
                float heat = max(u_heatFloor, 1.0 - timeSinceExplored * u_decaySpeed);

                if (heat < 0.02) discard;

                // Use pre-computed pulse (CPU-side sin calculations)
                float pulse = u_glowPulse;

                // Use round color - just vary brightness by heat
                vec3 color = u_roundColor * (0.4 + heat * 0.6);

                // Glow intensity
                float glow = heat * 0.35 * pulse;

                gl_FragColor = vec4(color * glow, glow);
            }
        `,

        // Vertex shader for optimal path
        pathVertex: `
            precision mediump float;

            attribute vec2 a_position;
            attribute vec2 a_normal;
            attribute float a_progress;

            uniform vec2 u_resolution;
            uniform float u_lineWidth;
            uniform float u_pathProgress;

            varying float v_visible;
            varying vec2 v_position;

            void main() {
                v_visible = step(a_progress, u_pathProgress);
                v_position = a_position;

                vec2 pos = a_position + a_normal * u_lineWidth;
                vec2 clipSpace = (pos / u_resolution) * 2.0 - 1.0;
                gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
            }
        `,

        pathFragment: `
            precision mediump float;

            uniform float u_time;

            varying float v_visible;
            varying vec2 v_position;

            void main() {
                if (v_visible < 0.5) discard;

                // Electric pulse along path
                float pulse = 0.9 + sin(u_time * 4.0) * 0.08 + sin(u_time * 12.0) * 0.02;

                // Bright electric cyan with white hot center
                vec3 color = vec3(0.4, 1.0, 1.0) * pulse;

                // Add slight brightness boost
                color = color * 1.15;

                gl_FragColor = vec4(color, 1.0);
            }
        `,

        // Fragment shader for soft atmospheric glow - very slow, calming
        atmosphereFragment: `
            precision mediump float;

            uniform float u_time;
            uniform vec2 u_resolution;
            uniform vec2 u_center;

            varying float v_heat;
            varying vec2 v_position;

            void main() {
                // Distance from center for radial gradient
                float dist = distance(v_position, u_center) / max(u_resolution.x, u_resolution.y);

                // Very slow breathing - 50 second cycle
                float breathe = 0.85 + 0.15 * sin(u_time * 0.125);

                // Glacial flow effect - 75 second cycle
                float flowCoord = (v_position.x + v_position.y) * 0.002;
                float flow = sin(flowCoord - u_time * 0.085) * 0.1 + 0.9;

                // Soft warm colors
                vec3 warmGlow = vec3(0.7, 0.3, 0.12);   // Soft orange
                vec3 coolGlow = vec3(0.25, 0.1, 0.3);   // Muted purple

                vec3 color = mix(warmGlow, coolGlow, dist);

                // Visible atmospheric glow
                float alpha = mix(0.18, 0.04, dist) * breathe * flow;

                gl_FragColor = vec4(color * alpha, alpha);
            }
        `,
    },

    // Initialize WebGL context and compile shaders
    init() {
        this.canvas = document.getElementById('webgl-canvas');
        if (!this.canvas) {
            console.error('WebGL canvas not found');
            return false;
        }

        // Get WebGL context with alpha for transparency
        this.gl = this.canvas.getContext('webgl', {
            alpha: true,
            premultipliedAlpha: false,
            antialias: true,
        });

        if (!this.gl) {
            console.error('WebGL not supported');
            return false;
        }

        const gl = this.gl;

        // Enable blending for transparency and glow
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

        // Compile shader programs
        this.programs.roads = this.createProgram(
            this.shaders.roadVertex,
            this.shaders.ambientFragment
        );

        this.programs.heatEdges = this.createProgram(
            this.shaders.roadVertex,
            this.shaders.heatFragment
        );

        this.programs.glow = this.createProgram(
            this.shaders.roadVertex,
            this.shaders.glowFragment
        );

        this.programs.atmosphere = this.createProgram(
            this.shaders.roadVertex,
            this.shaders.atmosphereFragment
        );

        if (!this.programs.roads || !this.programs.heatEdges || !this.programs.atmosphere) {
            console.error('Failed to compile WebGL shaders');
            return false;
        }

        // Create buffers
        this.buffers.edgePositions = gl.createBuffer();
        this.buffers.edgeNormals = gl.createBuffer();
        this.buffers.edgeHeats = gl.createBuffer();
        this.buffers.edgeIndices = gl.createBuffer();
        this.buffers.exploredIndices = gl.createBuffer();

        this.initialized = true;
        console.log('WebGL renderer initialized successfully');
        return true;
    },

    // Compile shader from source
    compileShader(type, source) {
        const gl = this.gl;
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);

        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            console.error('Shader compile error:', gl.getShaderInfoLog(shader));
            gl.deleteShader(shader);
            return null;
        }
        return shader;
    },

    // Create shader program
    createProgram(vertexSource, fragmentSource) {
        const gl = this.gl;

        const vertexShader = this.compileShader(gl.VERTEX_SHADER, vertexSource);
        const fragmentShader = this.compileShader(gl.FRAGMENT_SHADER, fragmentSource);

        if (!vertexShader || !fragmentShader) return null;

        const program = gl.createProgram();
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);

        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            console.error('Program link error:', gl.getProgramInfoLog(program));
            return null;
        }

        // Cache attribute and uniform locations
        program.attributes = {
            position: gl.getAttribLocation(program, 'a_position'),
            normal: gl.getAttribLocation(program, 'a_normal'),
            heat: gl.getAttribLocation(program, 'a_heat'),
            progress: gl.getAttribLocation(program, 'a_progress'),
        };

        program.uniforms = {
            resolution: gl.getUniformLocation(program, 'u_resolution'),
            time: gl.getUniformLocation(program, 'u_time'),
            lineWidth: gl.getUniformLocation(program, 'u_lineWidth'),
            center: gl.getUniformLocation(program, 'u_center'),
            pathProgress: gl.getUniformLocation(program, 'u_pathProgress'),
            roundColor: gl.getUniformLocation(program, 'u_roundColor'),
            decaySpeed: gl.getUniformLocation(program, 'u_decaySpeed'),
            heatFloor: gl.getUniformLocation(program, 'u_heatFloor'),
            vizStartTime: gl.getUniformLocation(program, 'u_vizStartTime'),
            // Pre-computed effect values (CPU-side sin calculations)
            flicker: gl.getUniformLocation(program, 'u_flicker'),
            frontierPulse: gl.getUniformLocation(program, 'u_frontierPulse'),
            glowPulse: gl.getUniformLocation(program, 'u_glowPulse'),
        };

        return program;
    },

    // Resize canvas to match container
    resize() {
        if (!this.canvas) return;

        const container = document.getElementById('map-container');
        const width = container.offsetWidth;
        const height = container.offsetHeight;

        // Set canvas size (both CSS and buffer)
        this.canvas.width = width;
        this.canvas.height = height;
        this.canvas.style.width = width + 'px';
        this.canvas.style.height = height + 'px';

        if (this.gl) {
            this.gl.viewport(0, 0, width, height);
        }

        this.uniforms.resolution = [width, height];
    },

    // Build edge geometry buffers from road network
    buildEdgeBuffers() {
        if (!this.initialized || !GameState.edgeList || GameState.edgeList.length === 0) {
            return;
        }

        const gl = this.gl;
        const edges = GameState.edgeList;
        const map = GameState.map;

        if (!map) return;

        this.edgeCount = edges.length;
        this.edgeKeyToIndex.clear();

        // Each edge needs 4 vertices (2 triangles for thick line)
        // Position: x, y for each vertex
        // Normal: nx, ny for each vertex (perpendicular to line)
        const positions = new Float32Array(edges.length * 8);  // 4 vertices * 2 coords
        const normals = new Float32Array(edges.length * 8);
        this.heatData = new Float32Array(edges.length * 4);    // 4 vertices per edge

        for (let i = 0; i < edges.length; i++) {
            const edge = edges[i];
            const fromScreen = map.project([edge.fromPos.lng, edge.fromPos.lat]);
            const toScreen = map.project([edge.toPos.lng, edge.toPos.lat]);

            // Calculate perpendicular normal
            const dx = toScreen.x - fromScreen.x;
            const dy = toScreen.y - fromScreen.y;
            const len = Math.sqrt(dx * dx + dy * dy) || 1;
            const nx = -dy / len;
            const ny = dx / len;

            // Edge key for heat lookup
            const edgeKey = `${Math.min(edge.from, edge.to)}-${Math.max(edge.from, edge.to)}`;
            this.edgeKeyToIndex.set(edgeKey, i);

            // 4 vertices per edge: from-left, from-right, to-left, to-right
            const baseIdx = i * 8;

            // From vertex - left side
            positions[baseIdx + 0] = fromScreen.x;
            positions[baseIdx + 1] = fromScreen.y;
            normals[baseIdx + 0] = -nx;
            normals[baseIdx + 1] = -ny;

            // From vertex - right side
            positions[baseIdx + 2] = fromScreen.x;
            positions[baseIdx + 3] = fromScreen.y;
            normals[baseIdx + 2] = nx;
            normals[baseIdx + 3] = ny;

            // To vertex - left side
            positions[baseIdx + 4] = toScreen.x;
            positions[baseIdx + 5] = toScreen.y;
            normals[baseIdx + 4] = -nx;
            normals[baseIdx + 5] = -ny;

            // To vertex - right side
            positions[baseIdx + 6] = toScreen.x;
            positions[baseIdx + 7] = toScreen.y;
            normals[baseIdx + 6] = nx;
            normals[baseIdx + 7] = ny;

            // Initialize to -1 (never explored) - shader uses negative = unexplored
            this.heatData[i * 4 + 0] = -1;
            this.heatData[i * 4 + 1] = -1;
            this.heatData[i * 4 + 2] = -1;
            this.heatData[i * 4 + 3] = -1;
        }

        // Build index buffer for batched drawing
        // Each edge = 2 triangles = 6 indices
        // Vertices per edge: 0=from-left, 1=from-right, 2=to-left, 3=to-right
        // Triangle 1: 0, 1, 2  |  Triangle 2: 1, 3, 2
        const indices = new Uint16Array(edges.length * 6);
        for (let i = 0; i < edges.length; i++) {
            const baseVertex = i * 4;
            const baseIndex = i * 6;
            // Triangle 1
            indices[baseIndex + 0] = baseVertex + 0;
            indices[baseIndex + 1] = baseVertex + 1;
            indices[baseIndex + 2] = baseVertex + 2;
            // Triangle 2
            indices[baseIndex + 3] = baseVertex + 1;
            indices[baseIndex + 4] = baseVertex + 3;
            indices[baseIndex + 5] = baseVertex + 2;
        }
        this.indexCount = edges.length * 6;

        // Upload to GPU
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.edgePositions);
        gl.bufferData(gl.ARRAY_BUFFER, positions, gl.DYNAMIC_DRAW);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.edgeNormals);
        gl.bufferData(gl.ARRAY_BUFFER, normals, gl.DYNAMIC_DRAW);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.edgeHeats);
        gl.bufferData(gl.ARRAY_BUFFER, this.heatData, gl.DYNAMIC_DRAW);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.buffers.edgeIndices);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

        // Initialize explored indices array (empty initially, populated during A*)
        this.exploredIndicesData = new Uint16Array(edges.length * 6);  // Max same size
        this.exploredIndexCount = 0;
        this.exploredEdgeSet.clear();
        this.needsExploredUpdate = false;

        console.log(`WebGL: Built buffers for ${edges.length} edges (${this.indexCount} indices)`);
    },

    // Update edge positions when map moves/zooms
    updateEdgePositions() {
        if (!this.initialized || !GameState.edgeList || this.edgeCount === 0) {
            return;
        }

        const gl = this.gl;
        const edges = GameState.edgeList;
        const map = GameState.map;

        if (!map) return;

        const positions = new Float32Array(edges.length * 8);
        const normals = new Float32Array(edges.length * 8);

        for (let i = 0; i < edges.length; i++) {
            const edge = edges[i];
            const fromScreen = map.project([edge.fromPos.lng, edge.fromPos.lat]);
            const toScreen = map.project([edge.toPos.lng, edge.toPos.lat]);

            const dx = toScreen.x - fromScreen.x;
            const dy = toScreen.y - fromScreen.y;
            const len = Math.sqrt(dx * dx + dy * dy) || 1;
            const nx = -dy / len;
            const ny = dx / len;

            const baseIdx = i * 8;

            positions[baseIdx + 0] = fromScreen.x;
            positions[baseIdx + 1] = fromScreen.y;
            normals[baseIdx + 0] = -nx;
            normals[baseIdx + 1] = -ny;

            positions[baseIdx + 2] = fromScreen.x;
            positions[baseIdx + 3] = fromScreen.y;
            normals[baseIdx + 2] = nx;
            normals[baseIdx + 3] = ny;

            positions[baseIdx + 4] = toScreen.x;
            positions[baseIdx + 5] = toScreen.y;
            normals[baseIdx + 4] = -nx;
            normals[baseIdx + 5] = -ny;

            positions[baseIdx + 6] = toScreen.x;
            positions[baseIdx + 7] = toScreen.y;
            normals[baseIdx + 6] = nx;
            normals[baseIdx + 7] = ny;
        }

        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.edgePositions);
        gl.bufferData(gl.ARRAY_BUFFER, positions, gl.DYNAMIC_DRAW);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.edgeNormals);
        gl.bufferData(gl.ARRAY_BUFFER, normals, gl.DYNAMIC_DRAW);
    },

    // Mark edge as explored at current time (GPU calculates decay from this)
    // Only updates if not already explored - prevents resetting exploration time
    setEdgeExplored(edgeKey, explorationTime) {
        const index = this.edgeKeyToIndex.get(edgeKey);
        if (index === undefined || !this.heatData) return;

        const baseIdx = index * 4;
        // Only set if not already explored (value is -1)
        if (this.heatData[baseIdx] < 0) {
            this.heatData[baseIdx + 0] = explorationTime;
            this.heatData[baseIdx + 1] = explorationTime;
            this.heatData[baseIdx + 2] = explorationTime;
            this.heatData[baseIdx + 3] = explorationTime;
            this.needsHeatUpdate = true;

            // Also add to explored indices buffer (for efficient rendering)
            if (!this.exploredEdgeSet.has(edgeKey)) {
                this.exploredEdgeSet.add(edgeKey);
                // Add 6 indices for this edge's 2 triangles
                const baseVertex = index * 4;
                const idxOffset = this.exploredIndexCount;
                this.exploredIndicesData[idxOffset + 0] = baseVertex + 0;
                this.exploredIndicesData[idxOffset + 1] = baseVertex + 1;
                this.exploredIndicesData[idxOffset + 2] = baseVertex + 2;
                this.exploredIndicesData[idxOffset + 3] = baseVertex + 1;
                this.exploredIndicesData[idxOffset + 4] = baseVertex + 3;
                this.exploredIndicesData[idxOffset + 5] = baseVertex + 2;
                this.exploredIndexCount += 6;
                this.needsExploredUpdate = true;
            }
        }
    },

    // Legacy compatibility - converts heat 1.0 to "just explored"
    setEdgeHeat(edgeKey, heat) {
        if (heat >= 0.9) {
            // Heat of 1.0 means "just explored" - set current time
            this.setEdgeExplored(edgeKey, performance.now() * 0.001);
        }
        // Lower heat values are ignored - decay is now GPU-side
    },

    // Decay is now handled in shader - this is a no-op for performance
    decayHeat(decayRate, floor) {
        // GPU-side decay - nothing to do here!
    },

    // Clear all exploration times and explored indices (reset for new visualization)
    clearHeat() {
        if (!this.heatData) return;
        this.heatData.fill(-1);  // -1 = never explored
        this.needsHeatUpdate = true;

        // Also clear explored indices
        this.exploredIndexCount = 0;
        this.exploredEdgeSet.clear();
        this.needsExploredUpdate = true;
    },

    // Set global opacity for settling transition
    setGlobalOpacity(opacity) {
        this.globalOpacity = opacity;
    },

    // Get current color index based on game mode
    getCurrentColorIndex() {
        if (GameState.gameMode === 'visualizer') {
            return VisualizerHistory.pathIndex;  // Current viz being rendered
        } else if (GameState.gameMode === 'explorer') {
            return ExplorerHistory.pathIndex;
        } else {
            // Competitive mode - use round number (1-indexed, convert to 0-indexed)
            return (GameState.currentRound || 1) - 1;
        }
    },

    // Upload heat data to GPU
    uploadHeatData() {
        if (!this.needsHeatUpdate || !this.heatData || !this.gl) return;

        const gl = this.gl;
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.edgeHeats);
        gl.bufferData(gl.ARRAY_BUFFER, this.heatData, gl.DYNAMIC_DRAW);
        this.needsHeatUpdate = false;
    },

    // Upload explored indices to GPU (only explored edges)
    uploadExploredData() {
        if (!this.needsExploredUpdate || !this.exploredIndicesData || !this.gl) return;

        const gl = this.gl;
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.buffers.exploredIndices);
        // Only upload the portion that's actually used
        const usedData = this.exploredIndicesData.subarray(0, this.exploredIndexCount);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, usedData, gl.DYNAMIC_DRAW);
        this.needsExploredUpdate = false;
    },

    // Main render function
    render(time) {
        if (!this.initialized || !this.gl) return;

        const gl = this.gl;
        const width = this.canvas.width;
        const height = this.canvas.height;

        // Clear with transparency
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);

        if (this.edgeCount === 0) return;

        // Upload any pending updates
        this.uploadHeatData();
        this.uploadExploredData();

        const timeSeconds = time * 0.001;

        // Draw ambient roads first (base layer)
        this.renderAmbientRoads(timeSeconds, width, height);

        // Only draw heat/glow if we have explored edges
        if (this.exploredIndexCount > 0) {
            // Draw heat-mapped edges on top (additive blending) - ONLY explored edges
            gl.blendFunc(gl.SRC_ALPHA, gl.ONE);  // Additive
            this.renderHeatEdges(timeSeconds, width, height);

            // Draw glow layer - ONLY explored edges
            this.renderGlow(timeSeconds, width, height);

            // Reset blend mode
            gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        }
    },

    // Render ONLY ambient roads (for continuous background rendering)
    renderAmbient(time) {
        if (!this.initialized || !this.gl) return;

        const gl = this.gl;
        const width = this.canvas.width;
        const height = this.canvas.height;

        // Clear with transparency
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);

        if (this.edgeCount === 0) return;

        const timeSeconds = time * 0.001;

        // Layer 1: Ambient glow (wider, softer) - additive blending
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
        this.renderAmbientGlow(timeSeconds, width, height);

        // Layer 2: Core roads with energy flow - standard blending
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        this.renderAmbientRoads(timeSeconds, width, height);
    },

    // Render soft ambient glow underneath roads
    renderAmbientGlow(time, width, height) {
        const gl = this.gl;
        const program = this.programs.atmosphere;

        gl.useProgram(program);

        // Set uniforms - much wider line for soft atmospheric glow
        gl.uniform2f(program.uniforms.resolution, width, height);
        gl.uniform1f(program.uniforms.time, time);
        gl.uniform1f(program.uniforms.lineWidth, 12.0);  // Wide soft glow
        gl.uniform2f(program.uniforms.center, width / 2, height / 2);

        // Bind buffers
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.edgePositions);
        gl.enableVertexAttribArray(program.attributes.position);
        gl.vertexAttribPointer(program.attributes.position, 2, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.edgeNormals);
        gl.enableVertexAttribArray(program.attributes.normal);
        gl.vertexAttribPointer(program.attributes.normal, 2, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.edgeHeats);
        gl.enableVertexAttribArray(program.attributes.heat);
        gl.vertexAttribPointer(program.attributes.heat, 1, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.buffers.edgeIndices);
        gl.drawElements(gl.TRIANGLES, this.indexCount, gl.UNSIGNED_SHORT, 0);
    },

    // Render ambient road network
    renderAmbientRoads(time, width, height) {
        const gl = this.gl;
        const program = this.programs.roads;

        gl.useProgram(program);

        // Set uniforms
        gl.uniform2f(program.uniforms.resolution, width, height);
        gl.uniform1f(program.uniforms.time, time);
        gl.uniform1f(program.uniforms.lineWidth, 3.0);
        gl.uniform2f(program.uniforms.center, width / 2, height / 2);

        // Bind position buffer
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.edgePositions);
        gl.enableVertexAttribArray(program.attributes.position);
        gl.vertexAttribPointer(program.attributes.position, 2, gl.FLOAT, false, 0, 0);

        // Bind normal buffer
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.edgeNormals);
        gl.enableVertexAttribArray(program.attributes.normal);
        gl.vertexAttribPointer(program.attributes.normal, 2, gl.FLOAT, false, 0, 0);

        // Bind heat buffer (not used but required by shader)
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.edgeHeats);
        gl.enableVertexAttribArray(program.attributes.heat);
        gl.vertexAttribPointer(program.attributes.heat, 1, gl.FLOAT, false, 0, 0);

        // Bind index buffer and draw ALL edges in a single call
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.buffers.edgeIndices);
        gl.drawElements(gl.TRIANGLES, this.indexCount, gl.UNSIGNED_SHORT, 0);
    },

    // Render heat-mapped exploration edges
    renderHeatEdges(time, width, height) {
        const gl = this.gl;
        const program = this.programs.heatEdges;

        gl.useProgram(program);

        gl.uniform2f(program.uniforms.resolution, width, height);
        gl.uniform1f(program.uniforms.time, time);
        gl.uniform1f(program.uniforms.lineWidth, 4.0);

        // Linear decay: heat = 1.0 - time * decaySpeed
        // Visualizer: Very slow decay (0.03) to high floor (0.6) - edges settle gently
        // Other modes: Faster decay to lower floor
        const decaySpeed = GameState.gameMode === 'visualizer' ? 0.03 : 0.12;
        const heatFloor = GameState.gameMode === 'visualizer' ? 0.6 : 0.25;
        gl.uniform1f(program.uniforms.decaySpeed, decaySpeed);
        gl.uniform1f(program.uniforms.heatFloor, heatFloor);

        // Pass current visualization color to shader (mode-aware)
        const colorIndex = this.getCurrentColorIndex();
        const theme = CONFIG.color.getThemeByIndex(colorIndex);
        const c = theme.base;
        gl.uniform3f(program.uniforms.roundColor, c.r / 255, c.g / 255, c.b / 255);

        // Pre-computed effect values (CPU-side sin() - one call per frame instead of millions)
        const flicker = 0.9 + Math.sin(time * 8.0) * 0.05;
        const frontierPulse = Math.sin(time * 12.0);  // Range -1 to 1
        gl.uniform1f(program.uniforms.flicker, flicker);
        gl.uniform1f(program.uniforms.frontierPulse, frontierPulse);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.edgePositions);
        gl.enableVertexAttribArray(program.attributes.position);
        gl.vertexAttribPointer(program.attributes.position, 2, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.edgeNormals);
        gl.enableVertexAttribArray(program.attributes.normal);
        gl.vertexAttribPointer(program.attributes.normal, 2, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.edgeHeats);
        gl.enableVertexAttribArray(program.attributes.heat);
        gl.vertexAttribPointer(program.attributes.heat, 1, gl.FLOAT, false, 0, 0);

        // Draw ONLY explored edges (massive performance win!)
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.buffers.exploredIndices);
        gl.drawElements(gl.TRIANGLES, this.exploredIndexCount, gl.UNSIGNED_SHORT, 0);
    },

    // Render glow effect (wider, more transparent)
    renderGlow(time, width, height) {
        const gl = this.gl;
        const program = this.programs.glow;

        gl.useProgram(program);

        gl.uniform2f(program.uniforms.resolution, width, height);
        gl.uniform1f(program.uniforms.time, time);
        gl.uniform1f(program.uniforms.lineWidth, 12.0);  // Wider for glow

        // Linear decay parameters (same as heat edges)
        // Visualizer: Very slow decay to high floor - glow settles gently
        const decaySpeed = GameState.gameMode === 'visualizer' ? 0.03 : 0.12;
        const heatFloor = GameState.gameMode === 'visualizer' ? 0.6 : 0.25;
        gl.uniform1f(program.uniforms.decaySpeed, decaySpeed);
        gl.uniform1f(program.uniforms.heatFloor, heatFloor);

        // Pass current visualization color to shader (mode-aware)
        const colorIndex = this.getCurrentColorIndex();
        const theme = CONFIG.color.getThemeByIndex(colorIndex);
        const c = theme.base;
        gl.uniform3f(program.uniforms.roundColor, c.r / 255, c.g / 255, c.b / 255);

        // Pre-computed glow pulse (CPU-side sin() - one call per frame instead of millions)
        const glowPulse = Math.sin(time * 0.35) * 0.2 + Math.sin(time * 0.5) * 0.08 + 0.85;
        gl.uniform1f(program.uniforms.glowPulse, glowPulse);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.edgePositions);
        gl.enableVertexAttribArray(program.attributes.position);
        gl.vertexAttribPointer(program.attributes.position, 2, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.edgeNormals);
        gl.enableVertexAttribArray(program.attributes.normal);
        gl.vertexAttribPointer(program.attributes.normal, 2, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.edgeHeats);
        gl.enableVertexAttribArray(program.attributes.heat);
        gl.vertexAttribPointer(program.attributes.heat, 1, gl.FLOAT, false, 0, 0);

        // Draw ONLY explored edges (massive performance win!)
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.buffers.exploredIndices);
        gl.drawElements(gl.TRIANGLES, this.exploredIndexCount, gl.UNSIGNED_SHORT, 0);
    },

    // Cleanup
    destroy() {
        if (!this.gl) return;

        const gl = this.gl;

        // Delete buffers
        if (this.buffers.edgePositions) gl.deleteBuffer(this.buffers.edgePositions);
        if (this.buffers.edgeNormals) gl.deleteBuffer(this.buffers.edgeNormals);
        if (this.buffers.edgeHeats) gl.deleteBuffer(this.buffers.edgeHeats);
        if (this.buffers.edgeIndices) gl.deleteBuffer(this.buffers.edgeIndices);
        if (this.buffers.exploredIndices) gl.deleteBuffer(this.buffers.exploredIndices);

        // Delete programs
        for (const name in this.programs) {
            if (this.programs[name]) gl.deleteProgram(this.programs[name]);
        }

        this.initialized = false;
    }
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
        soundtrack: null,
        // UI sounds
        click: null,
        tick: null,
        success: null,
    },

    // Active audio sources (so we can stop them)
    activeSources: {
        scanning: null,
        soundtrack: null,
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
            // Load gameplay sound effects
            const [scanningResponse, foundResponse] = await Promise.all([
                fetch('Scanning.wav'),
                fetch('Found1.wav')
            ]);

            const [scanningData, foundData] = await Promise.all([
                scanningResponse.arrayBuffer(),
                foundResponse.arrayBuffer()
            ]);

            this.buffers.scanning = await this.ctx.decodeAudioData(scanningData);
            this.buffers.found = await this.ctx.decodeAudioData(foundData);

            console.log('[Sound] Gameplay effects loaded');

            // Load UI sound effects (non-blocking)
            this.loadUISounds();

            // Load soundtrack separately (larger file)
            this.loadSoundtrack();
        } catch (e) {
            console.warn('Could not load audio files:', e);
        }
    },

    // Load UI sound effects
    async loadUISounds() {
        try {
            const [clickRes, tickRes, successRes] = await Promise.all([
                fetch('sounds/click.wav'),
                fetch('sounds/tick.wav'),
                fetch('sounds/success.wav')
            ]);

            const [clickData, tickData, successData] = await Promise.all([
                clickRes.arrayBuffer(),
                tickRes.arrayBuffer(),
                successRes.arrayBuffer()
            ]);

            this.buffers.click = await this.ctx.decodeAudioData(clickData);
            this.buffers.tick = await this.ctx.decodeAudioData(tickData);
            this.buffers.success = await this.ctx.decodeAudioData(successData);

            console.log('[Sound] UI sounds loaded');
        } catch (e) {
            console.warn('[Sound] Could not load UI sounds:', e);
        }
    },

    // Load soundtrack (separate to not block other audio)
    async loadSoundtrack() {
        try {
            const response = await fetch('Pathfindr1.wav');
            const data = await response.arrayBuffer();
            this.buffers.soundtrack = await this.ctx.decodeAudioData(data);
            console.log('Soundtrack loaded successfully');

            // Auto-start soundtrack if not muted
            if (!this.muted) {
                this.playSoundtrack();
            }
        } catch (e) {
            console.warn('Could not load soundtrack:', e);
        }
    },

    // Play background soundtrack (looped)
    playSoundtrack() {
        if (!this.initialized || !this.buffers.soundtrack) return;

        // Don't restart if already playing
        if (this.activeSources.soundtrack) return;

        const source = this.ctx.createBufferSource();
        source.buffer = this.buffers.soundtrack;
        source.loop = true;  // Loop the soundtrack

        // Create gain node for soundtrack volume (slightly quieter than SFX)
        const gainNode = this.ctx.createGain();
        gainNode.gain.value = 0.7;  // 70% volume for background music

        source.connect(gainNode);
        gainNode.connect(this.masterGain);
        source.start();

        this.activeSources.soundtrack = { source, gainNode };
    },

    // Stop soundtrack (abrupt)
    stopSoundtrack() {
        if (this.activeSources.soundtrack) {
            try {
                this.activeSources.soundtrack.source.stop();
            } catch (e) {}
            this.activeSources.soundtrack = null;
        }
    },

    // Fade out soundtrack smoothly
    fadeOutSoundtrack(duration = 1000) {
        if (!this.activeSources.soundtrack) return Promise.resolve();

        return new Promise(resolve => {
            const { source, gainNode } = this.activeSources.soundtrack;
            const now = this.ctx.currentTime;
            const fadeTime = duration / 1000;

            // Smoothly fade to 0
            gainNode.gain.setValueAtTime(gainNode.gain.value, now);
            gainNode.gain.linearRampToValueAtTime(0, now + fadeTime);

            // Stop after fade completes
            setTimeout(() => {
                try {
                    source.stop();
                } catch (e) {}
                this.activeSources.soundtrack = null;
                resolve();
            }, duration + 50);
        });
    },

    // Play scanning sound (for A* exploration)
    scanning() {
        if (!this.initialized || this.muted || !this.buffers.scanning) return;

        // Stop any existing scanning sound first
        this.stopScanning();

        const source = this.ctx.createBufferSource();
        source.buffer = this.buffers.scanning;
        source.loop = false;  // Ensure no looping

        // Create gain node for fade out capability
        const gainNode = this.ctx.createGain();
        gainNode.gain.value = 1.0;

        source.connect(gainNode);
        gainNode.connect(this.masterGain);
        source.start();

        // Track so we can stop/fade it
        this.activeSources.scanning = { source, gainNode };

        // Auto-cleanup when done
        source.onended = () => {
            this.activeSources.scanning = null;
        };
    },

    // Stop scanning sound (abrupt)
    stopScanning() {
        if (this.activeSources.scanning) {
            try {
                this.activeSources.scanning.source.stop();
            } catch (e) { /* already stopped */ }
            this.activeSources.scanning = null;
        }
    },

    // Fade out scanning sound smoothly
    fadeOutScanning(duration = 500) {
        if (!this.activeSources.scanning) return Promise.resolve();

        return new Promise(resolve => {
            const { source, gainNode } = this.activeSources.scanning;

            // If no gainNode, just stop abruptly
            if (!gainNode) {
                this.stopScanning();
                resolve();
                return;
            }

            const now = this.ctx.currentTime;
            const fadeTime = duration / 1000;

            // Smoothly fade to 0
            gainNode.gain.setValueAtTime(gainNode.gain.value, now);
            gainNode.gain.linearRampToValueAtTime(0, now + fadeTime);

            // Stop after fade completes
            setTimeout(() => {
                try {
                    source.stop();
                } catch (e) {}
                this.activeSources.scanning = null;
                resolve();
            }, duration + 50);
        });
    },

    // Play path found sound
    pathFound() {
        if (!this.initialized || this.muted || !this.buffers.found) return;

        // Fade out scanning sound when path is found (quick fade)
        this.fadeOutScanning(200);

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

            // Start/stop soundtrack based on mute state
            if (this.muted) {
                this.stopSoundtrack();
            } else if (this.buffers.soundtrack) {
                this.playSoundtrack();
            }
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

    // 1. TICK - Typewriter/CRT click for score counting (uses custom audio if available)
    tick() {
        if (!this.initialized || this.muted) return;

        // Use custom tick sound if loaded
        if (this.buffers.tick) {
            this.playBuffer(this.buffers.tick, 0.4);
            return;
        }

        // Fallback to synthesized
        const now = this.ctx.currentTime;
        const noise = this.ctx.createBufferSource();
        noise.buffer = this.createNoiseBuffer(0.05);

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 2500 + Math.random() * 1500;
        filter.Q.value = 2;

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

    // 2. CLICK - UI button click (uses custom audio if available)
    click() {
        if (!this.initialized || this.muted) return;

        // Use custom click sound if loaded
        if (this.buffers.click) {
            this.playBuffer(this.buffers.click, 0.5);
            return;
        }

        // Fallback to synthesized
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        osc.type = 'square';
        osc.frequency.setValueAtTime(100, now);
        osc.frequency.setTargetAtTime(60, now + 0.05, 0.03);

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(800, now);
        filter.frequency.setTargetAtTime(200, now + 0.08, 0.05);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.setTargetAtTime(0.001, now + 0.08, 0.03);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);

        osc.start(now);
        osc.stop(now + 0.12);
    },

    // 3. HOVER - Subtle button hover (uses custom audio if available)
    hover() {
        if (!this.initialized || this.muted) return;

        // Use custom click at lower volume for hover (if loaded)
        if (this.buffers.click) {
            this.playBuffer(this.buffers.click, 0.15);
            return;
        }

        // Fallback to synthesized
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

    // Helper: Play an audio buffer at specified volume
    playBuffer(buffer, volume = 1.0) {
        if (!this.initialized || this.muted || !buffer) return;

        const source = this.ctx.createBufferSource();
        source.buffer = buffer;

        const gain = this.ctx.createGain();
        gain.gain.value = volume;

        source.connect(gain);
        gain.connect(this.masterGain);
        source.start();
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

    // 7. RESOLVE - Path complete chime (uses custom success audio if available)
    resolve() {
        if (!this.initialized || this.muted) return;

        // Use custom success sound if loaded
        if (this.buffers.success) {
            this.playBuffer(this.buffers.success, 0.6);
            return;
        }

        // Fallback to synthesized A major chord
        const now = this.ctx.currentTime;
        const freqs = [440, 554, 659]; // A, C#, E

        freqs.forEach((freq, i) => {
            const osc = this.ctx.createOscillator();
            osc.type = 'sine';
            osc.frequency.value = freq;

            const gain = this.ctx.createGain();
            const startTime = now + i * 0.05;
            gain.gain.setValueAtTime(0, startTime);
            gain.gain.setTargetAtTime(0.15, startTime, 0.05);
            gain.gain.setTargetAtTime(0.001, startTime + 0.5, 0.3);

            osc.connect(gain);
            gain.connect(this.masterGain);

            osc.start(startTime);
            osc.stop(startTime + 1.2);
        });

        const shimmer = this.ctx.createOscillator();
        shimmer.type = 'sine';
        shimmer.frequency.value = 1760;

        const shimmerGain = this.ctx.createGain();
        shimmerGain.gain.setValueAtTime(0, now + 0.1);
        shimmerGain.gain.setTargetAtTime(0.04, now + 0.1, 0.05);
        shimmerGain.gain.setTargetAtTime(0.001, now + 0.6, 0.4);

        shimmer.connect(shimmerGain);
        shimmerGain.connect(this.masterGain);
        shimmer.start(now + 0.1);
        shimmer.stop(now + 1.5);
    },

    // 8. SLIDE - Panel whoosh (synthesized)
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
    },

    // Pause all audio (when app goes to background)
    pauseAll() {
        if (!this.initialized || !this.ctx) return;

        // Suspend the audio context (stops all audio processing)
        if (this.ctx.state === 'running') {
            this.ctx.suspend().catch(e => console.warn('Audio suspend failed:', e));
        }
    },

    // Resume audio (when app returns to foreground)
    resumeAll() {
        if (!this.initialized || !this.ctx) return;

        // Resume the audio context
        if (this.ctx.state === 'suspended') {
            this.ctx.resume().catch(e => console.warn('Audio resume failed:', e));
        }
    },

    // ==========================================================================
    // UI SOUND EFFECTS - Subtle audio feedback for interface interactions
    // ==========================================================================

    // Soft hover/highlight sound - gentle tonal shimmer
    uiHover() {
        if (!this.initialized || this.muted) return;

        const now = this.ctx.currentTime;

        // High-frequency soft tone
        const osc = this.ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1200, now);
        osc.frequency.setTargetAtTime(1400, now, 0.05);

        // Very short, quiet envelope
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.06, now + 0.01);
        gain.gain.setTargetAtTime(0, now + 0.02, 0.03);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(now);
        osc.stop(now + 0.1);
    },

    // Satisfying click sound - crisp, warm tactile feel
    uiClick() {
        if (!this.initialized || this.muted) return;

        const now = this.ctx.currentTime;

        // Two-tone click: low thump + high tap
        const lowOsc = this.ctx.createOscillator();
        lowOsc.type = 'sine';
        lowOsc.frequency.setValueAtTime(180, now);
        lowOsc.frequency.setTargetAtTime(80, now, 0.02);

        const highOsc = this.ctx.createOscillator();
        highOsc.type = 'triangle';
        highOsc.frequency.setValueAtTime(2400, now);
        highOsc.frequency.setTargetAtTime(1800, now, 0.015);

        // Low thump envelope
        const lowGain = this.ctx.createGain();
        lowGain.gain.setValueAtTime(0.15, now);
        lowGain.gain.setTargetAtTime(0, now + 0.01, 0.02);

        // High tap envelope
        const highGain = this.ctx.createGain();
        highGain.gain.setValueAtTime(0.08, now);
        highGain.gain.setTargetAtTime(0, now + 0.005, 0.01);

        lowOsc.connect(lowGain);
        highOsc.connect(highGain);
        lowGain.connect(this.masterGain);
        highGain.connect(this.masterGain);

        lowOsc.start(now);
        highOsc.start(now);
        lowOsc.stop(now + 0.08);
        highOsc.stop(now + 0.05);
    },

    // Smooth transition whoosh - rising sweep
    uiTransition() {
        if (!this.initialized || this.muted) return;

        const now = this.ctx.currentTime;

        // Filtered noise sweep
        const noise = this.ctx.createBufferSource();
        noise.buffer = this.createNoiseBuffer(0.25);

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.Q.value = 2;
        filter.frequency.setValueAtTime(400, now);
        filter.frequency.exponentialRampToValueAtTime(2000, now + 0.15);
        filter.frequency.setTargetAtTime(800, now + 0.15, 0.05);

        // Soft oscillator sweep for warmth
        const osc = this.ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.exponentialRampToValueAtTime(600, now + 0.12);

        // Envelopes
        const noiseGain = this.ctx.createGain();
        noiseGain.gain.setValueAtTime(0, now);
        noiseGain.gain.linearRampToValueAtTime(0.08, now + 0.05);
        noiseGain.gain.setTargetAtTime(0, now + 0.12, 0.05);

        const oscGain = this.ctx.createGain();
        oscGain.gain.setValueAtTime(0, now);
        oscGain.gain.linearRampToValueAtTime(0.04, now + 0.03);
        oscGain.gain.setTargetAtTime(0, now + 0.1, 0.04);

        noise.connect(filter);
        filter.connect(noiseGain);
        noiseGain.connect(this.masterGain);

        osc.connect(oscGain);
        oscGain.connect(this.masterGain);

        noise.start(now);
        osc.start(now);
        noise.stop(now + 0.25);
        osc.stop(now + 0.2);
    },

    // Success chime - warm, positive feedback (uses custom success audio if available)
    uiSuccess() {
        if (!this.initialized || this.muted) return;

        // Use custom success sound if loaded
        if (this.buffers.success) {
            this.playBuffer(this.buffers.success, 0.5);
            return;
        }

        // Fallback to synthesized two-note chime
        const now = this.ctx.currentTime;

        const osc1 = this.ctx.createOscillator();
        osc1.type = 'sine';
        osc1.frequency.value = 523.25; // C5

        const osc2 = this.ctx.createOscillator();
        osc2.type = 'sine';
        osc2.frequency.value = 659.25; // E5

        const gain1 = this.ctx.createGain();
        gain1.gain.setValueAtTime(0.12, now);
        gain1.gain.setTargetAtTime(0, now + 0.1, 0.08);

        const gain2 = this.ctx.createGain();
        gain2.gain.setValueAtTime(0, now);
        gain2.gain.setValueAtTime(0.12, now + 0.08);
        gain2.gain.setTargetAtTime(0, now + 0.2, 0.1);

        osc1.connect(gain1);
        osc2.connect(gain2);
        gain1.connect(this.masterGain);
        gain2.connect(this.masterGain);

        osc1.start(now);
        osc2.start(now + 0.08);
        osc1.stop(now + 0.25);
        osc2.stop(now + 0.35);
    },

    // Stop all sounds completely (for clean shutdown)
    stopAll() {
        this.stopScanning();
        this.stopSoundtrack();
        this.stopAmbient();
        this.stopTrace();

        // Suspend context to ensure silence
        if (this.ctx && this.ctx.state === 'running') {
            this.ctx.suspend().catch(() => {});
        }
    }
};

// =============================================================================
// APP VISIBILITY & STATE HANDLERS - Pause audio when app is hidden/backgrounded
// =============================================================================

// Handle browser visibility changes (tab hidden, minimized, etc.)
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        SoundEngine.pauseAll();
    } else {
        SoundEngine.resumeAll();
    }
});

// Handle Capacitor app state changes (native app backgrounded/foregrounded)
if (typeof window !== 'undefined' && window.Capacitor && window.Capacitor.isNativePlatform()) {
    // Import App plugin dynamically for native platforms
    import('@capacitor/app').then(({ App }) => {
        App.addListener('appStateChange', ({ isActive }) => {
            if (isActive) {
                SoundEngine.resumeAll();
            } else {
                SoundEngine.pauseAll();
            }
        });

        // Also handle app being terminated
        App.addListener('backButton', () => {
            // On Android back button, pause audio before potentially exiting
            SoundEngine.pauseAll();
        });
    }).catch(e => {
        console.warn('Capacitor App plugin not available:', e);
    });
}

// =============================================================================
// HAPTICS ENGINE - Mobile Tactile Feedback
// =============================================================================

const GameHaptics = {
    initialized: false,
    Haptics: null,

    /**
     * Initialize haptics on native platforms
     * Safe to call on web - will silently do nothing
     */
    async init() {
        if (this.initialized) return;

        // Only initialize on native platforms
        if (typeof window === 'undefined' || !window.Capacitor || !window.Capacitor.isNativePlatform()) {
            console.log('[Haptics] Web platform - haptics disabled');
            this.initialized = true;
            return;
        }

        try {
            const { Haptics } = await import('@capacitor/haptics');
            this.Haptics = Haptics;
            this.initialized = true;
            console.log('[Haptics] Initialized successfully');
        } catch (error) {
            console.warn('[Haptics] Failed to initialize:', error);
            this.initialized = true; // Mark as initialized to prevent retries
        }
    },

    /**
     * Light tap - used when snapping to a node while drawing path
     */
    async nodeSnap() {
        if (!this.Haptics) return;
        try {
            await this.Haptics.impact({ style: 'light' });
        } catch (e) { /* ignore */ }
    },

    /**
     * Medium impact - used when path reaches destination
     */
    async pathComplete() {
        if (!this.Haptics) return;
        try {
            await this.Haptics.impact({ style: 'medium' });
        } catch (e) { /* ignore */ }
    },

    /**
     * Success notification - used when round ends
     */
    async roundEnd() {
        if (!this.Haptics) return;
        try {
            await this.Haptics.notification({ type: 'success' });
        } catch (e) { /* ignore */ }
    },

    /**
     * Heavy impact - used for game over / high score
     */
    async gameOver() {
        if (!this.Haptics) return;
        try {
            await this.Haptics.impact({ style: 'heavy' });
        } catch (e) { /* ignore */ }
    },

    /**
     * Warning notification - used for errors or rejected actions
     */
    async warning() {
        if (!this.Haptics) return;
        try {
            await this.Haptics.notification({ type: 'warning' });
        } catch (e) { /* ignore */ }
    },

    /**
     * Selection change - subtle feedback for UI interactions
     */
    async selectionChanged() {
        if (!this.Haptics) return;
        try {
            await this.Haptics.selectionChanged();
        } catch (e) { /* ignore */ }
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
                    const screen = GameState.map.project([lng, lat]);
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
            const screen = GameState.map.project([point.lng, point.lat]);

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
                const screen = GameState.map.project([pos.lng, pos.lat]);
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
                const screen = GameState.map.project([pos.lng, pos.lat]);
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

        // If GameController is running the unified loop, don't start our own
        // GameController will call our render methods directly
        if (GameController.animationId) {
            console.log('[AmbientViz] Deferring to GameController loop');
            return;
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

        // Update systems (always update regardless of viz state)
        this.updateProximityToEnd();
        RoundHistory.update(deltaTime);
        ExplorerHistory.update(deltaTime);
        VisualizerHistory.update(deltaTime);
        ElectricitySystem.update(deltaTime);

        // When A* viz is active, let renderVisualization() handle ALL rendering
        // to avoid two loops fighting over the canvas
        if (GameState.vizState.active) {
            this.animationId = requestAnimationFrame(() => this.loop());
            return;
        }

        // Clear canvas (only when viz is NOT active)
        ctx.clearRect(0, 0, width, height);

        // Layer 0: WebGL road network (always render if available and we have edges)
        if (GameState.useWebGL && GameState.edgeList && GameState.edgeList.length > 0) {
            WebGLRenderer.renderAmbient(performance.now());
        }

        // Layer 1: Orange road network Canvas 2D fallback (if no WebGL)
        if (!GameState.useWebGL && GameState.showCustomRoads) {
            drawRoadNetwork(ctx);
        }

        // Layer 2: History rendering (persistent visualization from previous paths/rounds)
        // Render the appropriate history based on game mode
        if (GameState.gameMode === 'explorer') {
            this.renderPathHistory(ctx, deltaTime, ExplorerHistory.getPaths(), false);
        } else if (GameState.gameMode === 'visualizer') {
            this.renderPathHistory(ctx, deltaTime, VisualizerHistory.getPaths(), false);
        } else {
            // Competitive mode - render round history
            this.renderRoundHistory(ctx, deltaTime, false);
        }

        // Layer 3: Ambient gameplay - particles and marker auras
        this.render(ctx, width, height, deltaTime);

        // Layer 4: Arc sparks (always render on top)
        ElectricitySystem.renderArcs(ctx);

        // Layer 5: Trace animation for user path clicks
        renderTraceAnimation(ctx);

        // Layer 6: Animate user path with electricity (when drawing)
        if (GameState.gameStarted && GameState.userPathNodes.length >= 2) {
            redrawUserPath();
        }

        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = 1;

        this.animationId = requestAnimationFrame(() => this.loop());
    },

    // Render persisted rounds with electricity effects
    renderRoundHistory(ctx, deltaTime, isVizActive = false) {
        const rounds = RoundHistory.getRounds();

        // During active visualization, dim previous rounds to 40% to not compete
        const vizDimFactor = isVizActive ? 0.6 : 1.0;  // BUMPED from 0.4 for better visibility

        for (const round of rounds) {
            // Convert explored edges to screen coordinates (O(1) lookup via edgeLookup)
            const screenEdges = [];
            for (const edgeKey of round.exploredEdges) {
                const edge = GameState.edgeLookup.get(edgeKey);

                if (edge) {
                    const from = GameState.map.project([edge.fromPos.lng, edge.fromPos.lat]);
                    const to = GameState.map.project([edge.toPos.lng, edge.toPos.lat]);
                    screenEdges.push({ from, to });
                }
            }

            // Render explored edges with electricity (dimmed during active viz)
            const isActive = round.state === 'rising' && !isVizActive;
            const effectiveIntensity = round.intensity * vizDimFactor;
            ElectricitySystem.renderElectrifiedEdges(ctx, screenEdges, round.color, effectiveIntensity, isActive);

            // Render optimal path with contrasting color (dimmed during active viz)
            if (round.optimalPath.length > 1) {
                const optimalPoints = round.optimalPath.map(nodeId => {
                    const pos = GameState.nodes.get(nodeId);
                    if (pos) return GameState.map.project([pos.lng, pos.lat]);
                    return null;
                }).filter(p => p !== null);

                if (optimalPoints.length > 1) {
                    // Use contrasting optimal color (fall back to exploration color if not set)
                    const pathColor = round.hotColor || round.color;
                    // Initialize sweep for this path if not exists
                    if (!round.optimalSweep) {
                        round.optimalSweep = ElectricitySystem.createSweep();
                    }
                    this.renderOptimalPathWithElectricity(ctx, optimalPoints, pathColor, effectiveIntensity, round.optimalSweep);
                }
            }

            // Render user path with distinct electricity (dimmed during active viz)
            if (round.userPath.length > 1) {
                const userPoints = round.userPath.map(nodeId => {
                    const pos = GameState.nodes.get(nodeId);
                    if (pos) return GameState.map.project([pos.lng, pos.lat]);
                    return null;
                }).filter(p => p !== null);

                if (userPoints.length > 1) {
                    // Use stored userPathColor from round theme
                    ElectricitySystem.renderUserPathElectricity(ctx, userPoints, effectiveIntensity, round.midColor);
                }
            }
        }
    },

    // Render path history for Explorer/Visualizer modes (uses same structure as RoundHistory)
    // OPTIMIZED: Uses cached screen coordinates and simplified idle rendering
    renderPathHistory(ctx, deltaTime, paths, isVizActive = false) {
        // During active visualization, dim previous paths to 40%
        const vizDimFactor = isVizActive ? 0.6 : 1.0;  // BUMPED from 0.4 for better visibility

        // Get the correct history object based on game mode for living network effects
        const historyObj = GameState.gameMode === 'explorer' ? ExplorerHistory : VisualizerHistory;

        // Get breathing multiplier for living network effect
        const breathe = historyObj.getBreathingMultiplier();

        // Check if map moved (invalidates all caches)
        const mapCenter = GameState.map.getCenter();
        const mapZoom = GameState.map.getZoom();
        const mapState = `${mapCenter.lat.toFixed(6)},${mapCenter.lng.toFixed(6)},${mapZoom}`;

        for (const path of paths) {
            // OPTIMIZATION: Use cached screen coordinates if map hasn't moved
            if (!path.cacheValid || path.lastMapState !== mapState) {
                // Rebuild cache
                path.screenEdgesCache = [];
                for (const edgeKey of path.exploredEdges) {
                    const edge = GameState.edgeLookup.get(edgeKey);
                    if (edge) {
                        const from = GameState.map.project([edge.fromPos.lng, edge.fromPos.lat]);
                        const to = GameState.map.project([edge.toPos.lng, edge.toPos.lat]);
                        path.screenEdgesCache.push({ from, to });
                    }
                }

                // Cache optimal path points
                if (path.optimalPath.length > 1) {
                    path.optimalPointsCache = path.optimalPath.map(nodeId => {
                        const pos = GameState.nodes.get(nodeId);
                        if (pos) return GameState.map.project([pos.lng, pos.lat]);
                        return null;
                    }).filter(p => p !== null);
                }

                // Cache user path points (Explorer mode)
                if (path.userPath && path.userPath.length > 1) {
                    path.userPointsCache = path.userPath.map(nodeId => {
                        const pos = GameState.nodes.get(nodeId);
                        if (pos) return GameState.map.project([pos.lng, pos.lat]);
                        return null;
                    }).filter(p => p !== null);
                }

                path.lastMapState = mapState;
                path.cacheValid = true;
            }

            const screenEdges = path.screenEdgesCache || [];
            const isActive = path.state === 'rising' && !isVizActive;

            // LIVING NETWORK: Apply breathing + ripple boost for idle paths
            let effectiveIntensity = path.intensity * vizDimFactor;
            if (path.state === 'idle' && !isVizActive) {
                // Breathing effect makes all idle paths pulse together
                effectiveIntensity *= breathe;
                // Ripple boost adds temporary brightness during waves
                effectiveIntensity += path.rippleIntensity;
                effectiveIntensity = Math.min(effectiveIntensity, 1.2);  // Cap to prevent blowout
            }

            // Render explored edges with living network effect
            if (path.state === 'idle' && !isActive) {
                this.renderLivingEdges(ctx, screenEdges, path.color, effectiveIntensity, breathe);
            } else {
                ElectricitySystem.renderElectrifiedEdges(ctx, screenEdges, path.color, effectiveIntensity, isActive);
            }

            // Render optimal path as POWER SOURCE (always animated, never static)
            const optimalPoints = path.optimalPointsCache;
            const optimalColor = path.hotColor || path.color;
            if (optimalPoints && optimalPoints.length > 1) {
                if (!path.optimalSweep) {
                    path.optimalSweep = ElectricitySystem.createSweep();
                }
                // LIVING NETWORK: Optimal path is always animated as power source
                if (path.state === 'idle') {
                    this.renderPowerSourcePath(ctx, optimalPoints, optimalColor, effectiveIntensity, path.optimalSweep, breathe);
                } else {
                    this.renderOptimalPathWithElectricity(ctx, optimalPoints, optimalColor, effectiveIntensity, path.optimalSweep);
                }
            }

            // Render user path (if exists - Explorer mode)
            const userPoints = path.userPointsCache;
            if (userPoints && userPoints.length > 1) {
                ElectricitySystem.renderUserPathElectricity(ctx, userPoints, effectiveIntensity, path.midColor);
            }
        }

        // Render sparks from living network
        this.renderSparks(ctx, historyObj.sparks);
    },

    // OPTIMIZATION: Simplified edge rendering for idle paths (no wobble, fewer layers)
    renderSimplifiedEdges(ctx, edges, color, intensity) {
        if (edges.length === 0) return;

        ctx.globalCompositeOperation = 'lighter';
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        // Just 2 layers instead of 4-5
        ctx.strokeStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${0.15 * intensity})`;
        ctx.lineWidth = 6;
        ctx.beginPath();
        for (const edge of edges) {
            ctx.moveTo(edge.from.x, edge.from.y);
            ctx.lineTo(edge.to.x, edge.to.y);
        }
        ctx.stroke();

        ctx.strokeStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${0.4 * intensity})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (const edge of edges) {
            ctx.moveTo(edge.from.x, edge.from.y);
            ctx.lineTo(edge.to.x, edge.to.y);
        }
        ctx.stroke();

        ctx.globalCompositeOperation = 'source-over';
    },

    // OPTIMIZATION: Simplified path rendering for idle paths (2 layers instead of 5)
    renderSimplifiedPath(ctx, points, color, intensity) {
        if (points.length < 2) return;

        ctx.globalCompositeOperation = 'lighter';
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        // Outer glow only
        ctx.strokeStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${0.2 * intensity})`;
        ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
            ctx.lineTo(points[i].x, points[i].y);
        }
        ctx.stroke();

        // Core
        ctx.strokeStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${0.6 * intensity})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
            ctx.lineTo(points[i].x, points[i].y);
        }
        ctx.stroke();

        ctx.globalCompositeOperation = 'source-over';
    },

    // Render optimal path with flowing electricity - PROMINENT and eye-catching
    renderOptimalPathWithElectricity(ctx, points, color, intensity, sweep) {
        if (points.length < 2) return;

        const flicker = ElectricitySystem.getFlicker();
        const effectiveIntensity = intensity * flicker;

        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.globalCompositeOperation = 'lighter';

        // Build path once, stroke multiple times (more efficient)
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
            ctx.lineTo(points[i].x, points[i].y);
        }

        // ENHANCED: Wide atmospheric bloom - makes path GLOW prominently
        ctx.strokeStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${0.15 * effectiveIntensity})`;
        ctx.lineWidth = 32;
        ctx.stroke();

        // ENHANCED: Outer glow - brighter and wider
        ctx.strokeStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${0.25 * effectiveIntensity})`;
        ctx.lineWidth = 18;
        ctx.stroke();

        // ENHANCED: Mid glow - stronger presence
        ctx.strokeStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${0.5 * effectiveIntensity})`;
        ctx.lineWidth = 10;
        ctx.stroke();

        // ENHANCED: Core - bright and solid
        ctx.strokeStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${0.9 * effectiveIntensity})`;
        ctx.lineWidth = 5;
        ctx.stroke();

        // ENHANCED: Hot center highlight - white-hot core
        ctx.strokeStyle = `rgba(255, 255, 255, ${0.7 * effectiveIntensity})`;
        ctx.lineWidth = 2;
        ctx.stroke();

        // ASMR: Single elegant sweep instead of chaotic pulses
        ElectricitySystem.renderSweep(ctx, points, color, intensity, sweep);

        ctx.globalCompositeOperation = 'source-over';
    },

    // LIVING NETWORK: Render explored edges with breathing effect
    renderLivingEdges(ctx, edges, color, intensity, breathe) {
        if (edges.length === 0) return;

        const time = performance.now() * 0.001;
        ctx.globalCompositeOperation = 'lighter';
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        // Enhanced flicker with multiple wave frequencies for organic feel
        const flicker = 0.85 + breathe * 0.15;
        const neuralPulse = 0.9 + Math.sin(time * 1.5) * 0.1 + Math.sin(time * 3.7) * 0.05;
        const combinedPulse = flicker * neuralPulse;

        // Wide atmospheric bloom - MUCH brighter
        ctx.strokeStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${0.15 * intensity * combinedPulse})`;
        ctx.lineWidth = 14;
        ctx.beginPath();
        for (const edge of edges) {
            ctx.moveTo(edge.from.x, edge.from.y);
            ctx.lineTo(edge.to.x, edge.to.y);
        }
        ctx.stroke();

        // Mid glow layer - brighter and pulses
        ctx.strokeStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${0.35 * intensity * combinedPulse})`;
        ctx.lineWidth = 7;
        ctx.beginPath();
        for (const edge of edges) {
            ctx.moveTo(edge.from.x, edge.from.y);
            ctx.lineTo(edge.to.x, edge.to.y);
        }
        ctx.stroke();

        // Core - bright and stable
        ctx.strokeStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${0.7 * intensity})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        for (const edge of edges) {
            ctx.moveTo(edge.from.x, edge.from.y);
            ctx.lineTo(edge.to.x, edge.to.y);
        }
        ctx.stroke();

        // Neural pulse highlights - random edges light up brighter
        if (GameState.gameMode === 'visualizer' && edges.length > 5) {
            const pulsePhase = (time * 2) % 1;
            const highlightCount = Math.min(15, Math.floor(edges.length * 0.08));
            ctx.strokeStyle = `rgba(${Math.min(255, color.r + 50)}, ${Math.min(255, color.g + 50)}, ${Math.min(255, color.b + 50)}, ${0.6 * intensity * (0.5 + pulsePhase * 0.5)})`;
            ctx.lineWidth = 4;
            ctx.beginPath();
            for (let i = 0; i < highlightCount; i++) {
                const idx = Math.floor((pulsePhase * edges.length + i * (edges.length / highlightCount))) % edges.length;
                const edge = edges[idx];
                if (edge) {
                    ctx.moveTo(edge.from.x, edge.from.y);
                    ctx.lineTo(edge.to.x, edge.to.y);
                }
            }
            ctx.stroke();
        }

        ctx.globalCompositeOperation = 'source-over';
    },

    // LIVING NETWORK: Render optimal path as continuous power source - PROMINENT
    renderPowerSourcePath(ctx, points, color, intensity, sweep, breathe) {
        if (points.length < 2) return;

        const cfg = CONFIG.livingNetwork;
        const powerGlow = cfg.powerGlowIntensity;
        const flicker = 0.92 + breathe * 0.08;
        const effectiveIntensity = intensity * powerGlow * flicker;

        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.globalCompositeOperation = 'lighter';

        // Build path once for efficiency
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
            ctx.lineTo(points[i].x, points[i].y);
        }

        // ENHANCED: Wide atmospheric bloom - the "power" aura
        ctx.strokeStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${0.12 * effectiveIntensity})`;
        ctx.lineWidth = 28;
        ctx.stroke();

        // ENHANCED: Outer glow - visible presence
        ctx.strokeStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${0.22 * effectiveIntensity})`;
        ctx.lineWidth = 16;
        ctx.stroke();

        // ENHANCED: Mid glow - stronger
        ctx.strokeStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${0.45 * effectiveIntensity})`;
        ctx.lineWidth = 9;
        ctx.stroke();

        // ENHANCED: Core line - bright and solid
        ctx.strokeStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${0.85 * effectiveIntensity})`;
        ctx.lineWidth = 4;
        ctx.stroke();

        // ENHANCED: Hot center - white-hot core
        ctx.strokeStyle = `rgba(255, 255, 255, ${0.55 * effectiveIntensity})`;
        ctx.lineWidth = 2;
        ctx.stroke();

        // ASMR: Render elegant sweep instead of chaotic pulses
        ElectricitySystem.renderSweep(ctx, points, color, effectiveIntensity, sweep);

        ctx.globalCompositeOperation = 'source-over';
    },

    // Render power pulses along the optimal path
    renderPowerPulses(ctx, points, color, intensity, pulses) {
        if (points.length < 2 || !pulses) return;

        // Calculate total path length and segment lengths
        const segmentLengths = [];
        let totalLength = 0;
        for (let i = 0; i < points.length - 1; i++) {
            const dx = points[i + 1].x - points[i].x;
            const dy = points[i + 1].y - points[i].y;
            const len = Math.sqrt(dx * dx + dy * dy);
            segmentLengths.push(len);
            totalLength += len;
        }

        ctx.globalCompositeOperation = 'lighter';

        for (const pulse of pulses) {
            // Find position along path
            const targetDist = pulse.progress * totalLength;
            let accum = 0;
            let px = points[0].x;
            let py = points[0].y;

            for (let i = 0; i < segmentLengths.length; i++) {
                if (accum + segmentLengths[i] >= targetDist) {
                    const t = (targetDist - accum) / segmentLengths[i];
                    px = points[i].x + (points[i + 1].x - points[i].x) * t;
                    py = points[i].y + (points[i + 1].y - points[i].y) * t;
                    break;
                }
                accum += segmentLengths[i];
            }

            // Draw pulse as bright dot with glow
            const pulseSize = 6 * pulse.size;
            const pulseIntensity = intensity * pulse.brightness;

            // Outer glow
            const gradient = ctx.createRadialGradient(px, py, 0, px, py, pulseSize * 2);
            gradient.addColorStop(0, `rgba(255, 255, 255, ${0.8 * pulseIntensity})`);
            gradient.addColorStop(0.3, `rgba(${color.r}, ${color.g}, ${color.b}, ${0.6 * pulseIntensity})`);
            gradient.addColorStop(1, `rgba(${color.r}, ${color.g}, ${color.b}, 0)`);

            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(px, py, pulseSize * 2, 0, Math.PI * 2);
            ctx.fill();
        }
    },

    // Render sparks from the living network
    renderSparks(ctx, sparks) {
        if (!sparks || sparks.length === 0) return;

        ctx.globalCompositeOperation = 'lighter';

        for (const spark of sparks) {
            const edge = spark.edge;
            if (!edge) continue;

            // Calculate spark position along edge
            const t = Math.min(1, spark.progress);
            const px = edge.from.x + (edge.to.x - edge.from.x) * t;
            const py = edge.from.y + (edge.to.y - edge.from.y) * t;

            const alpha = spark.life * spark.brightness;
            const size = 4 * spark.life;

            // Spark glow
            const gradient = ctx.createRadialGradient(px, py, 0, px, py, size * 3);
            gradient.addColorStop(0, `rgba(255, 255, 255, ${0.9 * alpha})`);
            gradient.addColorStop(0.3, `rgba(${spark.color.r}, ${spark.color.g}, ${spark.color.b}, ${0.7 * alpha})`);
            gradient.addColorStop(1, `rgba(${spark.color.r}, ${spark.color.g}, ${spark.color.b}, 0)`);

            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(px, py, size * 3, 0, Math.PI * 2);
            ctx.fill();
        }

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
        const theme = CONFIG.color.getTheme(roundNumber);

        this.rounds.push({
            roundNumber,
            exploredEdges: new Set(exploredEdges),  // Set of edge keys
            optimalPath: [...optimalPath],           // Array of node IDs
            userPath: [...userPath],                 // Array of node IDs
            color: theme.base,                // Base color (for heatmap/exploration)
            hotColor: theme.hot,              // Hot shade (optimal path - brightest)
            midColor: theme.mid,              // Mid shade (user path)
            coolColor: theme.cool,            // Cool shade (ambient history falloff)
            state: 'rising',                  // 'rising' | 'settling' | 'idle'
            intensity: 0.15,                  // Start dim, fade UP to avoid brightness pop
            surgeStartTime: performance.now(),
        });
    },

    // Update all round states
    update(deltaTime) {
        const now = performance.now();
        const startIntensity = 0.15;  // Match addRound starting intensity

        for (const round of this.rounds) {
            if (round.state === 'rising') {
                // Fade UP from startIntensity to 1.0 over 1000ms
                const elapsed = now - round.surgeStartTime;
                const riseProgress = Math.min(1, elapsed / 1000);
                // Ease-out curve for smooth rise
                const easeOut = 1 - Math.pow(1 - riseProgress, 2);
                round.intensity = startIntensity + (1.0 - startIntensity) * easeOut;

                if (riseProgress >= 1) {
                    round.state = 'settling';
                    round.settleStartTime = now;
                    round.intensity = 1.0;
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
// EXPLORER HISTORY - Persistent Path Visualization for Explorer Mode
// =============================================================================

const ExplorerHistory = {
    paths: [],      // Array of completed path data
    pathIndex: 0,   // For cycling through colors

    // Living Network state (shared with Visualizer for consistent effects)
    breatheTime: 0,
    ripples: [],
    lastRipple: 0,
    sparks: [],

    // Add completed path to history
    addPath(exploredEdges, optimalPath, userPath = []) {
        const theme = CONFIG.color.getThemeByIndex(this.pathIndex);
        this.pathIndex++;

        // OPTIMIZATION: Only store a SAMPLE of explored edges (every 3rd edge)
        const sampledEdges = exploredEdges.filter((_, i) => i % 3 === 0);

        this.paths.push({
            exploredEdges: new Set(sampledEdges),
            optimalPath: [...optimalPath],
            userPath: [...userPath],
            color: theme.base,            // Base color (for heatmap/exploration)
            hotColor: theme.hot,          // Hot shade (optimal path - brightest)
            midColor: theme.mid,          // Mid shade (user path)
            coolColor: theme.cool,        // Cool shade (ambient history falloff)
            state: 'rising',              // 'rising' | 'settling' | 'idle'
            intensity: 0.15,              // Start dim, fade UP to avoid brightness pop
            surgeStartTime: performance.now(),
            optimalSweep: null,           // ASMR: Elegant sweep (lazy init on first render)
            rippleIntensity: 0,
            // OPTIMIZATION: Cache screen coordinates
            screenEdgesCache: null,
            optimalPointsCache: null,
            userPointsCache: null,
            cacheValid: false,
        });
    },

    // Update all path states (same state machine as RoundHistory)
    update(deltaTime) {
        const now = performance.now();
        const dt = deltaTime * 0.001;
        const startIntensity = 0.15;  // Match addPath starting intensity

        // Update global breathing
        this.breatheTime += dt * CONFIG.livingNetwork.breatheSpeed * Math.PI * 2;

        // Spawn ripples periodically
        if (this.paths.length > 0 && now - this.lastRipple > CONFIG.livingNetwork.rippleInterval) {
            this.spawnRipple();
            this.lastRipple = now;
        }

        // Update ripples
        for (let i = this.ripples.length - 1; i >= 0; i--) {
            const ripple = this.ripples[i];
            ripple.progress += CONFIG.livingNetwork.rippleSpeed * dt;
            ripple.age = now - ripple.startTime;
            if (ripple.age > CONFIG.livingNetwork.rippleDuration) {
                this.ripples.splice(i, 1);
            }
        }

        // Update sparks
        for (let i = this.sparks.length - 1; i >= 0; i--) {
            const spark = this.sparks[i];
            spark.life -= dt * 2;
            spark.progress += spark.speed * dt;
            if (spark.life <= 0) {
                this.sparks.splice(i, 1);
            }
        }

        for (const path of this.paths) {
            if (path.state === 'rising') {
                // Fade UP from startIntensity to 1.0 over 1000ms
                const elapsed = now - path.surgeStartTime;
                const riseProgress = Math.min(1, elapsed / 1000);
                // Ease-out curve for smooth rise
                const easeOut = 1 - Math.pow(1 - riseProgress, 2);
                path.intensity = startIntensity + (1.0 - startIntensity) * easeOut;

                if (riseProgress >= 1) {
                    path.state = 'settling';
                    path.settleStartTime = now;
                    path.intensity = 1.0;
                }
            } else if (path.state === 'settling') {
                const elapsed = now - path.settleStartTime;
                const settleProgress = Math.min(1, elapsed / 1000);
                path.intensity = 1.0 - (settleProgress * (1 - CONFIG.electricity.idleIntensity));

                if (settleProgress >= 1) {
                    path.state = 'idle';
                    path.intensity = CONFIG.electricity.idleIntensity;
                }
            }

            // Spawn occasional sparks (ASMR: less frequent for calmer feel)
            if (path.state === 'idle' && Math.random() < CONFIG.livingNetwork.sparkChance * 0.3 && this.sparks.length < 10) {
                this.spawnSpark(path);
            }

            // Calculate ripple boost
            path.rippleIntensity = 0;
            for (const ripple of this.ripples) {
                const rippleStrength = 1 - (ripple.age / CONFIG.livingNetwork.rippleDuration);
                const wave = Math.sin(ripple.progress * Math.PI * 2) * 0.5 + 0.5;
                path.rippleIntensity += rippleStrength * wave * 0.4;
            }
        }
    },

    spawnRipple() {
        if (this.paths.length === 0) return;
        const pathIndex = Math.floor(Math.random() * this.paths.length);
        this.ripples.push({
            sourcePathIndex: pathIndex,
            progress: 0,
            startTime: performance.now(),
            age: 0,
        });
    },

    spawnSpark(path) {
        if (!path.screenEdgesCache || path.screenEdgesCache.length === 0) return;
        const edgeIndex = Math.floor(Math.random() * path.screenEdgesCache.length);
        const edge = path.screenEdgesCache[edgeIndex];
        this.sparks.push({
            edge: edge,
            color: path.color,
            progress: 0,
            speed: 2 + Math.random() * 2,
            life: 1.0,
            brightness: 0.8 + Math.random() * 0.4,
        });
    },

    getBreathingMultiplier() {
        const cfg = CONFIG.livingNetwork;
        const breathe = (Math.sin(this.breatheTime) + 1) * 0.5;
        return cfg.breatheMin + breathe * (cfg.breatheMax - cfg.breatheMin);
    },

    // Clear all history
    clear() {
        this.paths = [];
        this.pathIndex = 0;
        this.ripples = [];
        this.sparks = [];
        this.lastRipple = 0;
    },

    // Get all paths for rendering
    getPaths() {
        return this.paths;
    },

    // Check if there are paths to render
    hasHistory() {
        return this.paths.length > 0;
    }
};

// =============================================================================
// VISUALIZER HISTORY - Persistent Path Visualization for Visualizer Mode
// =============================================================================

const VisualizerHistory = {
    paths: [],
    pathIndex: 0,
    lastMapState: null,  // Track map position for cache invalidation

    // Living Network state
    breatheTime: 0,      // Global breathing phase
    ripples: [],         // Active ripple waves
    lastRipple: 0,       // Timestamp of last ripple spawn
    sparks: [],          // Active sparks from optimal paths

    addPath(exploredEdges, optimalPath) {
        const theme = CONFIG.color.getThemeByIndex(this.pathIndex);
        this.pathIndex++;

        // Store more edges for better visual coverage (every 2nd edge)
        // Visualizer mode benefits from denser networks for the neural effect
        const sampledEdges = exploredEdges.filter((_, i) => i % 2 === 0);

        this.paths.push({
            exploredEdges: new Set(sampledEdges),
            optimalPath: [...optimalPath],
            color: theme.base,            // Base color (for heatmap/exploration)
            hotColor: theme.hot,          // Hot shade (optimal path - brightest)
            coolColor: theme.cool,        // Cool shade (ambient history falloff)
            state: 'rising',              // 'rising' | 'settling' | 'idle'
            intensity: 0.15,              // Start dim, fade UP to avoid brightness pop
            surgeStartTime: performance.now(),
            optimalSweep: null,           // ASMR: Elegant sweep (lazy init on first render)
            rippleIntensity: 0,           // Current ripple boost for this path
            // OPTIMIZATION: Cache screen coordinates (invalidated on map move)
            screenEdgesCache: null,
            optimalPointsCache: null,
            cacheValid: false,
        });
    },

    update(deltaTime) {
        const now = performance.now();
        const dt = deltaTime * 0.001;  // Convert to seconds
        const startIntensity = 0.15;  // Match addPath starting intensity

        // Update global breathing
        this.breatheTime += dt * CONFIG.livingNetwork.breatheSpeed * Math.PI * 2;

        // Spawn ripples periodically when we have paths
        if (this.paths.length > 0 && now - this.lastRipple > CONFIG.livingNetwork.rippleInterval) {
            this.spawnRipple();
            this.lastRipple = now;
        }

        // Update ripples
        for (let i = this.ripples.length - 1; i >= 0; i--) {
            const ripple = this.ripples[i];
            ripple.progress += CONFIG.livingNetwork.rippleSpeed * dt;
            ripple.age = now - ripple.startTime;

            // Remove expired ripples
            if (ripple.age > CONFIG.livingNetwork.rippleDuration) {
                this.ripples.splice(i, 1);
            }
        }

        // Update sparks
        for (let i = this.sparks.length - 1; i >= 0; i--) {
            const spark = this.sparks[i];
            spark.life -= dt * 2;
            spark.progress += spark.speed * dt;
            if (spark.life <= 0) {
                this.sparks.splice(i, 1);
            }
        }

        // Update path states and power pulses
        for (const path of this.paths) {
            if (path.state === 'rising') {
                // Fade UP from startIntensity to 1.0 over 1000ms
                const elapsed = now - path.surgeStartTime;
                const riseProgress = Math.min(1, elapsed / 1000);
                // Ease-out curve for smooth rise
                const easeOut = 1 - Math.pow(1 - riseProgress, 2);
                path.intensity = startIntensity + (1.0 - startIntensity) * easeOut;

                if (riseProgress >= 1) {
                    path.state = 'settling';
                    path.settleStartTime = now;
                    path.intensity = 1.0;
                }
            } else if (path.state === 'settling') {
                const elapsed = now - path.settleStartTime;
                const settleProgress = Math.min(1, elapsed / 1000);
                // Use higher idle intensity for Visualizer mode for better persistence
                const targetIdle = CONFIG.electricity.visualizerIdleIntensity || CONFIG.electricity.idleIntensity;
                path.intensity = 1.0 - (settleProgress * (1 - targetIdle));

                if (settleProgress >= 1) {
                    path.state = 'idle';
                    path.intensity = targetIdle;
                }
            }

            // Spawn occasional sparks - increased for more visual interest
            if (path.state === 'idle' && Math.random() < CONFIG.livingNetwork.sparkChance * 0.5 && this.sparks.length < 15) {
                this.spawnSpark(path);
            }

            // Calculate ripple boost for this path
            path.rippleIntensity = 0;
            for (const ripple of this.ripples) {
                // Simple radial ripple effect - all paths get boosted by active ripples
                const rippleStrength = 1 - (ripple.age / CONFIG.livingNetwork.rippleDuration);
                const wave = Math.sin(ripple.progress * Math.PI * 2) * 0.5 + 0.5;
                path.rippleIntensity += rippleStrength * wave * 0.4;
            }
        }
    },

    // Spawn a ripple wave from a random optimal path
    spawnRipple() {
        if (this.paths.length === 0) return;

        // Pick a random path to ripple from
        const pathIndex = Math.floor(Math.random() * this.paths.length);

        this.ripples.push({
            sourcePathIndex: pathIndex,
            progress: 0,
            startTime: performance.now(),
            age: 0,
        });
    },

    // Spawn a spark that travels along an explored edge
    spawnSpark(path) {
        if (!path.screenEdgesCache || path.screenEdgesCache.length === 0) return;

        // Pick random edge from explored edges
        const edgeIndex = Math.floor(Math.random() * path.screenEdgesCache.length);
        const edge = path.screenEdgesCache[edgeIndex];

        this.sparks.push({
            edge: edge,
            color: path.color,
            progress: 0,
            speed: 2 + Math.random() * 2,
            life: 1.0,
            brightness: 0.8 + Math.random() * 0.4,
        });
    },

    // Get the current breathing multiplier (0.5 - 1.0)
    getBreathingMultiplier() {
        const cfg = CONFIG.livingNetwork;
        const breathe = (Math.sin(this.breatheTime) + 1) * 0.5;  // 0-1
        return cfg.breatheMin + breathe * (cfg.breatheMax - cfg.breatheMin);
    },

    clear() {
        this.paths = [];
        this.pathIndex = 0;
        this.ripples = [];
        this.sparks = [];
        this.lastRipple = 0;
    },

    getPaths() {
        return this.paths;
    },

    hasHistory() {
        return this.paths.length > 0;
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

    // Enhanced multi-octave noise for organic movement
    noise(x, y, t) {
        // Layer 1: Large scale undulation
        const large = Math.sin(x * 0.08 + t * 0.9) * Math.cos(y * 0.08 + t * 0.6) * 0.4;
        // Layer 2: Medium frequency
        const medium = Math.sin(x * 0.15 - t * 1.3) * Math.cos(y * 0.12 + t * 0.8) * 0.3;
        // Layer 3: High frequency detail
        const detail = Math.sin(x * 0.25 + t * 2.1) * Math.cos(y * 0.22 - t * 1.7) * 0.15;
        // Layer 4: Rapid shimmer
        const shimmer = Math.sin(x * 0.4 + y * 0.3 + t * 4) * 0.1;

        return large + medium + detail + shimmer;
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

    // ASMR SATISFACTION: Single elegant sweep instead of chaotic pulses
    // One slow, graceful gradient that glides along the path
    createSweep() {
        return {
            progress: 0,           // 0-1 along path (head position)
            speed: 0.0008,         // Very slow - full sweep takes ~1250 frames (~20s at 60fps)
            tailLength: 0.35,      // 35% of path glows behind the head
            brightness: 1.0,
            startTime: performance.now()
        };
    },

    // Render elegant single sweep along path (ASMR-satisfying)
    renderSweep(ctx, pathPoints, color, intensity, sweep) {
        if (pathPoints.length < 2 || !sweep) return;

        // Update sweep position with easing
        const elapsed = (performance.now() - sweep.startTime) / 1000;
        // Ease in-out cubic for smooth start/stop feel
        const duration = 5.0; // 5 seconds for full sweep
        const cycleTime = elapsed % (duration * 2); // ping-pong
        let rawProgress;
        if (cycleTime < duration) {
            rawProgress = cycleTime / duration;
        } else {
            rawProgress = 1 - (cycleTime - duration) / duration;
        }
        // Cubic ease in-out
        const eased = rawProgress < 0.5
            ? 4 * rawProgress * rawProgress * rawProgress
            : 1 - Math.pow(-2 * rawProgress + 2, 3) / 2;

        sweep.progress = eased;

        const headProgress = sweep.progress;
        const tailProgress = Math.max(0, headProgress - sweep.tailLength);

        if (headProgress <= 0) return;

        ctx.globalCompositeOperation = 'lighter';
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        // Calculate path total length and segment lengths
        const totalSegments = pathPoints.length - 1;

        // Get points for the sweep segment
        const sweepPoints = [];
        for (let i = 0; i < pathPoints.length; i++) {
            const segmentProgress = i / totalSegments;
            if (segmentProgress >= tailProgress && segmentProgress <= headProgress) {
                sweepPoints.push({
                    point: pathPoints[i],
                    localProgress: (segmentProgress - tailProgress) / (headProgress - tailProgress)
                });
            }
        }

        // Interpolate head and tail positions for smooth gradient
        const getPointAtProgress = (progress) => {
            const segmentFloat = progress * totalSegments;
            const segmentIndex = Math.min(Math.floor(segmentFloat), totalSegments - 1);
            const segmentProgress = segmentFloat - segmentIndex;
            const p1 = pathPoints[segmentIndex];
            const p2 = pathPoints[Math.min(segmentIndex + 1, pathPoints.length - 1)];
            return {
                x: p1.x + (p2.x - p1.x) * segmentProgress,
                y: p1.y + (p2.y - p1.y) * segmentProgress
            };
        };

        const tailPoint = getPointAtProgress(tailProgress);
        const headPoint = getPointAtProgress(headProgress);

        // Create gradient from tail to head
        const gradient = ctx.createLinearGradient(tailPoint.x, tailPoint.y, headPoint.x, headPoint.y);

        // Gradient: transparent tail -> colored body -> bright white head
        gradient.addColorStop(0, `rgba(${color.r}, ${color.g}, ${color.b}, 0)`);
        gradient.addColorStop(0.3, `rgba(${color.r}, ${color.g}, ${color.b}, ${0.3 * intensity})`);
        gradient.addColorStop(0.7, `rgba(${color.r}, ${color.g}, ${color.b}, ${0.7 * intensity})`);
        gradient.addColorStop(0.9, `rgba(255, 255, 255, ${0.6 * intensity})`);
        gradient.addColorStop(1.0, `rgba(255, 255, 255, ${0.9 * intensity})`);

        // Draw the sweep segment with multiple layers for glow
        const drawSweepSegment = (width, alpha) => {
            ctx.strokeStyle = gradient;
            ctx.lineWidth = width;
            ctx.globalAlpha = alpha;
            ctx.beginPath();
            ctx.moveTo(tailPoint.x, tailPoint.y);

            // Draw through intermediate points
            for (const sp of sweepPoints) {
                ctx.lineTo(sp.point.x, sp.point.y);
            }
            ctx.lineTo(headPoint.x, headPoint.y);
            ctx.stroke();
        };

        // Layered glow effect
        drawSweepSegment(16, 0.15);  // Wide atmospheric glow
        drawSweepSegment(8, 0.35);   // Mid glow
        drawSweepSegment(4, 0.7);    // Core
        drawSweepSegment(2, 1.0);    // Bright center

        // Bright orb at the head for that satisfying leading edge
        const orbSize = 8 + Math.sin(elapsed * 2) * 2; // Subtle breathing
        const orbGradient = ctx.createRadialGradient(
            headPoint.x, headPoint.y, 0,
            headPoint.x, headPoint.y, orbSize
        );
        orbGradient.addColorStop(0, `rgba(255, 255, 255, ${0.9 * intensity})`);
        orbGradient.addColorStop(0.3, `rgba(${color.r}, ${color.g}, ${color.b}, ${0.7 * intensity})`);
        orbGradient.addColorStop(1, `rgba(${color.r}, ${color.g}, ${color.b}, 0)`);

        ctx.fillStyle = orbGradient;
        ctx.globalAlpha = 1;
        ctx.beginPath();
        ctx.arc(headPoint.x, headPoint.y, orbSize, 0, Math.PI * 2);
        ctx.fill();

        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = 'source-over';
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

    // Get flicker multiplier for organic pulsing - enhanced with more natural variation
    getFlicker() {
        const t = this.time;
        // Slow breathing rhythm
        const breath = Math.sin(t * 4.5) * 0.06;
        // Primary electrical pulse
        const pulse = Math.sin(t * 17) * 0.04;
        // Fast high-frequency shimmer
        const shimmer = Math.sin(t * 53) * 0.025;
        // Very fast micro-flicker
        const micro = Math.sin(t * 97) * 0.015;
        // Organic randomness
        const random = (Math.random() - 0.5) * CONFIG.electricity.flickerIntensity * 0.8;
        // Occasional intensity spike
        const spike = Math.max(0, Math.sin(t * 2.3) - 0.85) * 0.3;

        return 1 + breath + pulse + shimmer + micro + random + spike;
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

    // Render user path - THINNER with different opacity to distinguish from optimal
    // Uses SAME color as round for visual unity - NO dashed lines (better performance)
    renderUserPathElectricity(ctx, pathPoints, intensity, userPathColor) {
        if (pathPoints.length < 2) return;

        // Use provided color EXACTLY - no adjustments to maintain round unity
        const uc = userPathColor || CONFIG.color.getUserPathColor();
        const flicker = this.getFlicker();
        const effectiveIntensity = intensity * flicker;

        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.globalCompositeOperation = 'lighter';

        // User path is THINNER than optimal - distinguishes without dashing (better perf)
        // Outer glow
        ctx.strokeStyle = `rgba(${uc.r}, ${uc.g}, ${uc.b}, ${0.15 * effectiveIntensity})`;
        ctx.lineWidth = 10;
        ctx.beginPath();
        ctx.moveTo(pathPoints[0].x, pathPoints[0].y);
        for (let i = 1; i < pathPoints.length; i++) {
            ctx.lineTo(pathPoints[i].x, pathPoints[i].y);
        }
        ctx.stroke();

        // Core - slightly dimmer than optimal to visually separate
        ctx.strokeStyle = `rgba(${uc.r}, ${uc.g}, ${uc.b}, ${0.6 * effectiveIntensity})`;
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
// MAPLIBRE COMPATIBILITY SHIM - Minimal API translation layer
// =============================================================================

/**
 * Convert geo coordinates to screen coordinates
 * MapLibre uses [lng, lat] order, returns {x, y}
 */
function geoToScreen(lat, lng) {
    if (!GameState.map) return { x: 0, y: 0 };
    const point = GameState.map.project([lng, lat]);
    return { x: point.x, y: point.y };
}

/**
 * Convert screen coordinates to geo coordinates
 * MapLibre returns LngLat object
 */
function screenToGeo(x, y) {
    if (!GameState.map) return { lat: 0, lng: 0 };
    const lngLat = GameState.map.unproject([x, y]);
    return { lat: lngLat.lat, lng: lngLat.lng };
}

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
            // MapLibre uses [lng, lat] order and project() method
            const fromScreen = map.project([edge.fromPos.lng, edge.fromPos.lat]);
            const toScreen = map.project([edge.toPos.lng, edge.toPos.lat]);
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
    tileLayerId: null,      // Reference to MapLibre tile layer ID for toggle
    showCustomRoads: true,  // Toggle state for custom road view
    drawCanvas: null,
    drawCtx: null,
    vizCanvas: null,
    vizCtx: null,
    useWebGL: false,        // Whether WebGL rendering is available

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

    // Game mode
    gameMode: 'competitive',  // 'competitive' | 'explorer' | 'visualizer'
    difficulty: 'medium',     // 'easy' | 'medium' | 'hard' - controls max segment distance

    // Visualizer mode state
    visualizerState: {
        active: false,
        currentVisualization: 0,
        maxPerCity: 5,
        loopTimeout: null,
        delayBetweenRuns: 3000,  // ms between visualizations
    },

    // Explorer mode state
    explorerState: {
        placingStart: false,
        placingEnd: false,
        customStart: null,
        customEnd: null,
    },

    // Continuous play state
    continuousPlay: {
        enabled: false,
        citiesCompleted: 0,
        preloadedCity: null,
        preloadedData: null,
        cityScores: [],
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

    // User path electricity animation (continuous)
    userPathElectricity: {
        pulses: [],         // Energy pulses traveling along path
        lastPulseTime: 0,   // For spawning new pulses
        phase: 0,           // Animation phase for wobble
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
    gamesCompleted: parseInt(localStorage.getItem('pathfindr_games_completed') || '0', 10),
    isLoading: true,
    gameStarted: false,
    canDraw: false,

    // Location settings
    locationMode: 'us',  // 'local', 'us', or 'global'
    currentCity: null,   // Current city object
};

// =============================================================================
// MOBILE BROWSER DETECTION
// =============================================================================

/**
 * Detect mobile browsers with bottom address bars and apply appropriate CSS classes
 * Also sets up dynamic viewport height for accurate mobile sizing
 */
function initMobileBrowserDetection() {
    const ua = navigator.userAgent || navigator.vendor || window.opera;

    // Detect iOS
    const isIOS = /iPad|iPhone|iPod/.test(ua) && !window.MSStream;

    // Detect iOS Safari (not Chrome or other browsers on iOS)
    const isIOSSafari = isIOS && /Safari/.test(ua) && !/CriOS|FxiOS|OPiOS|EdgiOS/.test(ua);

    // Detect Android
    const isAndroid = /Android/.test(ua);

    // Detect mobile (general)
    const isMobile = isIOS || isAndroid || /webOS|BlackBerry|IEMobile|Opera Mini/i.test(ua);

    // Detect if likely has bottom address bar
    // iOS Safari and some Android Chrome versions put address bar at bottom
    const hasBottomBar = isIOSSafari || (isAndroid && /Chrome/i.test(ua) && window.innerHeight < window.screen.height * 0.85);

    // Apply classes
    if (isMobile) {
        document.body.classList.add('mobile-browser');
    }

    if (hasBottomBar) {
        document.body.classList.add('mobile-bottom-bar');
    }

    if (isIOSSafari) {
        document.body.classList.add('ios-safari');
    }

    // Set up dynamic viewport height
    // This gives us an accurate vh unit that accounts for browser UI
    const setVh = () => {
        const vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--vh', `${vh}px`);
    };

    setVh();
    window.addEventListener('resize', setVh);
    window.addEventListener('orientationchange', () => {
        setTimeout(setVh, 100); // Delay to let orientation change complete
    });

    // Log detection results for debugging
    console.log('[Mobile] Detection:', {
        isMobile,
        isIOS,
        isIOSSafari,
        isAndroid,
        hasBottomBar,
        viewportHeight: window.innerHeight,
        screenHeight: window.screen.height
    });
}

// =============================================================================
// INITIALIZATION
// =============================================================================

document.addEventListener('DOMContentLoaded', () => {
    initMobileBrowserDetection();  // Detect mobile browser type first
    initMap();
    initCanvases();
    AmbientViz.init();  // Initialize glow sprites
    initEventListeners();
    initSoundListeners();
    initModeSelector();
    initLocationSelector();
    initVisualizerUI();
    initExplorerUI();
    initInlineLocationSearch();  // Click-to-search on location display
    initCustomCursor();  // Custom cursor for web version
    // Show mode selector first
    showModeSelector();
});

// Initialize sound on first user interaction
function initSoundListeners() {
    // Add hover/click sounds to all buttons (including HUD buttons)
    document.querySelectorAll('.btn, .speed-btn, .replay-btn, .location-option, .hud-btn').forEach(btn => {
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
        // View toggle
        if (e.key === 'v' || e.key === 'V') {
            toggleMapView();
        }
    });

    // View toggle button
    document.getElementById('toggle-view-btn').addEventListener('click', toggleMapView);
}

function initMap() {
    // Detect mobile for touch-specific settings
    const isMobile = window.innerWidth <= 768 || ('ontouchstart' in window);

    // MapLibre GL JS initialization
    GameState.map = new maplibregl.Map({
        container: 'map',
        style: {
            version: 8,
            sources: {
                'osm': {
                    type: 'raster',
                    tiles: [CONFIG.tileUrl.replace('{s}', 'a')], // MapLibre doesn't use {s} subdomains
                    tileSize: 256,
                    attribution: '&copy; <a href="https://openstreetmap.org">OSM</a>'
                }
            },
            layers: [{
                id: 'osm-tiles',
                type: 'raster',
                source: 'osm'
            }]
        },
        center: [CONFIG.defaultLocation.lng, CONFIG.defaultLocation.lat], // MapLibre uses [lng, lat]
        zoom: CONFIG.defaultLocation.zoom,
        maxPitch: 60,
        // Touch/interaction settings
        dragPan: !isMobile, // Disable single-finger drag on mobile
        touchZoomRotate: true, // Enable pinch-to-zoom
        doubleClickZoom: !isMobile,
        dragRotate: true, // Enable rotation with right-click drag
        touchPitch: true, // Enable pitch with two-finger gesture
    });

    // Add navigation control (zoom + compass) - hidden on mobile
    if (!isMobile) {
        GameState.map.addControl(new maplibregl.NavigationControl({
            visualizePitch: true,
            showCompass: true
        }), 'top-right');
    }

    // Store reference for toggle functionality (MapLibre uses style layers)
    GameState.tileLayerId = 'osm-tiles';

    // Start with custom road view mode if enabled
    if (GameState.showCustomRoads) {
        document.getElementById('map-container').classList.add('custom-roads-mode');
    }

    // Layer groups not needed in MapLibre - we use canvas overlays instead
    // These are kept for compatibility but are unused
    GameState.exploredLayer = null;
    GameState.optimalLayer = null;
    GameState.userPathLayer = null;

    // Unified map change handler
    function onMapChange() {
        ScreenCoordCache.invalidate();  // Invalidate coordinate cache
        if (GameState.useWebGL) WebGLRenderer.updateEdgePositions();
        updateMarkerPositions();
        redrawUserPath();
        if (GameState.showCustomRoads && !GameState.vizState.active) drawRoadNetwork();
        if (GameState.vizState.active) renderVisualization();
    }

    // MapLibre events - includes pitch and rotate
    GameState.map.on('move', onMapChange);
    GameState.map.on('zoom', onMapChange);
    GameState.map.on('pitch', onMapChange);
    GameState.map.on('rotate', onMapChange);
}

function initCanvases() {
    GameState.drawCanvas = document.getElementById('draw-canvas');
    GameState.drawCtx = GameState.drawCanvas.getContext('2d');

    GameState.vizCanvas = document.getElementById('viz-canvas');
    GameState.vizCtx = GameState.vizCanvas.getContext('2d');

    // Initialize WebGL renderer
    if (!WebGLRenderer.init()) {
        console.warn('WebGL initialization failed, falling back to Canvas 2D');
        GameState.useWebGL = false;
    } else {
        GameState.useWebGL = true;
    }

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

    // Resize WebGL canvas
    if (GameState.useWebGL) {
        WebGLRenderer.resize();
    }

    redrawUserPath();
}

function initEventListeners() {
    // Drawing
    GameState.drawCanvas.addEventListener('mousedown', startDrawing);
    GameState.drawCanvas.addEventListener('mousemove', draw);
    GameState.drawCanvas.addEventListener('mouseup', stopDrawing);
    GameState.drawCanvas.addEventListener('mouseleave', stopDrawing);

    // Touch
    GameState.drawCanvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    GameState.drawCanvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    GameState.drawCanvas.addEventListener('touchend', stopDrawing);

    // Prevent pinch-zoom on the game canvas (iOS gesture events)
    GameState.drawCanvas.addEventListener('gesturestart', (e) => e.preventDefault());
    GameState.drawCanvas.addEventListener('gesturechange', (e) => e.preventDefault());
    GameState.drawCanvas.addEventListener('gestureend', (e) => e.preventDefault());

    // Prevent double-tap zoom on the game canvas
    let lastTouchEnd = 0;
    GameState.drawCanvas.addEventListener('touchend', (e) => {
        const now = Date.now();
        if (now - lastTouchEnd <= 300) {
            e.preventDefault();
        }
        lastTouchEnd = now;
    }, { passive: false });

    // Buttons with UI sounds
    document.getElementById('start-game-btn').addEventListener('click', () => {
        SoundEngine.uiClick();
        startGame();
    });
    document.getElementById('clear-btn').addEventListener('click', () => {
        SoundEngine.uiClick();
        clearUserPath();
    });
    document.getElementById('undo-btn').addEventListener('click', () => {
        SoundEngine.uiClick();
        undoLastSegment();
    });
    document.getElementById('submit-btn').addEventListener('click', () => {
        SoundEngine.uiClick();
        submitRoute();
    });
    document.getElementById('next-round-btn').addEventListener('click', () => {
        SoundEngine.uiClick();
        nextRound();
    });
    document.getElementById('play-again-btn').addEventListener('click', () => {
        SoundEngine.uiClick();
        playAgain();
    });
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

    // === MOBILE UI HANDLING ===
    initMobileUI();
}

// =============================================================================
// MOBILE UI
// =============================================================================

/**
 * Initialize mobile-specific UI elements and touch handling
 */
function initMobileUI() {
    // Wire up mobile control buttons
    const mobileUndo = document.getElementById('mobile-undo-btn');
    const mobileClear = document.getElementById('mobile-clear-btn');
    const mobileMute = document.getElementById('mobile-mute-btn');

    if (mobileUndo) mobileUndo.addEventListener('click', undoLastSegment);
    if (mobileClear) mobileClear.addEventListener('click', clearUserPath);
    if (mobileMute) mobileMute.addEventListener('click', () => {
        toggleMute();
        // Sync mute state with button appearance
        mobileMute.classList.toggle('muted', GameState.isMuted);
    });

    // Sync mute state when main mute button is clicked
    const mainMute = document.getElementById('mute-btn');
    if (mainMute) {
        const originalClick = mainMute.onclick;
        mainMute.addEventListener('click', () => {
            if (mobileMute) mobileMute.classList.toggle('muted', GameState.isMuted);
        });
    }

    // Mobile overflow menu
    const menuBtn = document.getElementById('hud-menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');
    const menuBackdrop = mobileMenu?.querySelector('.mobile-menu-backdrop');

    if (menuBtn && mobileMenu) {
        // Toggle menu
        menuBtn.addEventListener('click', () => {
            mobileMenu.classList.toggle('hidden');
        });

        // Close on backdrop click
        if (menuBackdrop) {
            menuBackdrop.addEventListener('click', () => {
                mobileMenu.classList.add('hidden');
            });
        }

        // Wire up menu items
        const menuUndo = document.getElementById('menu-undo');
        const menuClear = document.getElementById('menu-clear');
        const menuSound = document.getElementById('menu-sound');
        const menuExit = document.getElementById('menu-exit');

        if (menuUndo) {
            menuUndo.addEventListener('click', () => {
                undoLastSegment();
                mobileMenu.classList.add('hidden');
            });
        }

        if (menuClear) {
            menuClear.addEventListener('click', () => {
                clearUserPath();
                mobileMenu.classList.add('hidden');
            });
        }

        if (menuSound) {
            menuSound.addEventListener('click', () => {
                toggleMute();
                // Update sound icon text
                const iconSpan = menuSound.querySelector('.mobile-menu-icon');
                if (iconSpan) {
                    iconSpan.textContent = GameState.isMuted ? '🔇' : '🔊';
                }
                const labelSpan = menuSound.querySelector('.mobile-menu-label');
                if (labelSpan) {
                    labelSpan.textContent = GameState.isMuted ? 'Sound Off' : 'Sound On';
                }
            });
        }

        if (menuExit) {
            menuExit.addEventListener('click', () => {
                mobileMenu.classList.add('hidden');
                exitToMenu();
            });
        }
    }

    // Improved touch handling for mobile
    setupMobileTouchHandling();
}

/**
 * Sync mobile bottom bar stats with game state
 * Call this whenever stats change
 */
function updateMobileStats() {
    const mobileRound = document.getElementById('mobile-round');
    const mobileDistance = document.getElementById('mobile-distance');
    const mobileScore = document.getElementById('mobile-score');
    const mobileCityNumber = document.getElementById('mobile-city-number');
    const mobileRoundLegend = document.getElementById('mobile-round-legend');

    if (mobileRound) mobileRound.textContent = GameState.currentRound;
    if (mobileScore) mobileScore.textContent = GameState.totalScore;
    if (mobileCityNumber) mobileCityNumber.textContent = GameState.currentRound;

    // Update round progress dots
    if (mobileRoundLegend) {
        const dots = mobileRoundLegend.querySelectorAll('.mobile-round-dot');
        dots.forEach((dot, index) => {
            dot.classList.remove('completed', 'current');
            if (index < GameState.currentRound - 1) {
                dot.classList.add('completed');
            } else if (index === GameState.currentRound - 1) {
                dot.classList.add('current');
            }
        });
    }
}

/**
 * Update mobile distance display
 * @param {number} distance - Distance in km
 */
function updateMobileDistance(distance) {
    const mobileDistance = document.getElementById('mobile-distance');
    if (mobileDistance) {
        mobileDistance.textContent = distance.toFixed(2);
    }
}

/**
 * Setup improved touch handling for mobile
 * Uses MapLibre's native click handler for path drawing,
 * allowing two-finger gestures (pan/zoom) to work natively.
 */
function setupMobileTouchHandling() {
    const canvas = GameState.drawCanvas;
    if (!canvas) return;

    // Make canvas non-interactive - let touches pass through to MapLibre
    canvas.style.pointerEvents = 'none';

    // Remove any old touch listeners from canvas
    canvas.removeEventListener('touchstart', handleTouchStart);
    canvas.removeEventListener('touchmove', handleTouchMove);
    canvas.removeEventListener('touchend', stopDrawing);

    // Use MapLibre's click event for path drawing
    // This fires for taps but allows two-finger gestures to work
    if (!GameState.mobileClickHandlerAdded) {
        GameState.map.on('click', (e) => {
            // Only handle during competitive game mode
            if (!GameState.gameStarted || !GameState.canDraw) return;
            if (GameState.vizState.active) return;
            if (GameState.gameMode !== 'competitive') return;

            // MapLibre click event provides e.point (screen coords) directly
            const rect = canvas.getBoundingClientRect();

            handlePathClick({
                clientX: rect.left + e.point.x,
                clientY: rect.top + e.point.y
            });

            // Light haptic feedback on mobile
            if (window.Capacitor?.Plugins?.Haptics) {
                window.Capacitor.Plugins.Haptics.impact({ style: 'light' });
            }
        });
        GameState.mobileClickHandlerAdded = true;
    }
}

// =============================================================================
// ROAD NETWORK LOADING
// =============================================================================

async function loadRoadNetwork(location, retryCount = 0, serverIndex = 0) {
    const maxRetries = 4; // More retries since we have multiple servers
    const baseDelay = 1500;
    const servers = CONFIG.overpassServers;

    // Calming loading messages
    const loadingMessages = [
        'Mapping the streets...',
        'Discovering routes...',
        'Charting the city...',
        'Building the network...'
    ];

    const retryMessages = [
        'Still working on it...',
        'Taking a moment...',
        'Almost there...',
        'Patience, pathfinder...'
    ];

    if (retryCount === 0) {
        showLoading(loadingMessages[Math.floor(Math.random() * loadingMessages.length)], false, location);
    } else {
        showLoading(retryMessages[Math.min(retryCount - 1, retryMessages.length - 1)], false, location);
    }

    // Rotate through servers on retries
    const currentServer = servers[serverIndex % servers.length];

    try {
        const bounds = GameState.map.getBounds();
        const query = `
            [out:json][timeout:25];
            (
                way["highway"]["highway"!~"footway|path|steps|pedestrian|cycleway|track"]
                (${bounds.getSouth()},${bounds.getWest()},${bounds.getNorth()},${bounds.getEast()});
            );
            out body;
            >;
            out skel qt;
        `;

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 20000); // 20 second timeout

        const response = await fetch(currentServer, {
            method: 'POST',
            body: `data=${encodeURIComponent(query)}`,
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);

        const data = await response.json();

        // Validate we got actual data
        if (!data.elements || data.elements.length === 0) {
            throw new Error('No road data returned');
        }

        processRoadData(data);

        document.getElementById('current-location').textContent = location.name;
        hideLoading();

        // Handle different game modes after road network loads
        if (GameState.gameMode === 'explorer') {
            startExplorerMode();
        } else if (GameState.gameMode === 'visualizer') {
            // Visualizer handles its own flow
        } else {
            // Competitive mode - show instructions
            showInstructions();
        }

    } catch (error) {
        console.error(`Road network loading (server ${serverIndex + 1}, attempt ${retryCount + 1}):`, error);

        if (retryCount < maxRetries) {
            // Shorter delay, rotate servers
            const delay = baseDelay + (Math.random() * 500); // 1.5-2s with jitter
            const nextServer = (serverIndex + 1) % servers.length;

            // Calming wait messages
            const waitMessages = [
                'Trying another route...',
                'Good things take time...',
                'Preparing your adventure...',
                'One moment please...'
            ];
            showLoading(waitMessages[Math.floor(Math.random() * waitMessages.length)]);

            await new Promise(resolve => setTimeout(resolve, delay));
            return loadRoadNetwork(location, retryCount + 1, nextServer);
        } else {
            // Max retries exceeded - friendly message with retry button
            showLoading(`
                <div style="text-align: center;">
                    <div style="margin-bottom: 12px; opacity: 0.8;">The map servers are busy</div>
                    <button onclick="loadRoadNetwork(GameState.currentCity, 0, ${(serverIndex + 1) % servers.length})" class="btn btn-primary" style="padding: 10px 24px; cursor: pointer;">
                        Try Again
                    </button>
                </div>
            `);
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

    // Build WebGL buffers for road network
    if (GameState.useWebGL) {
        WebGLRenderer.buildEdgeBuffers();
    }

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
    GameHaptics.init();
    // Old ambient drone removed - using wav files now
    hideInstructions();
    GameState.gameStarted = true;
    enableDrawing();
    selectRandomEndpoints();

    // Start unified animation loop and enter PLAYING phase
    GameController.startLoop();
    GameController.enterPhase(GamePhase.PLAYING);

    // Initialize AmbientViz particles (loop handled by GameController)
    AmbientViz.start();

    // Analytics: Track game start and first round
    if (typeof PathfindrAnalytics !== 'undefined') {
        const cityName = GameState.currentCity?.name || 'Unknown';
        PathfindrAnalytics.trackGameStart(GameState.locationMode, cityName);
        PathfindrAnalytics.trackRoundStart(1, cityName);
        PathfindrAnalytics.trackTimeBasedEvent();
    }
}

async function nextRound() {
    // Check if interstitial ad should be shown after this round
    const justCompletedRound = GameState.currentRound;
    const shouldShowAd = typeof PathfindrAds !== 'undefined' &&
                         PathfindrAds.shouldShowInterstitialAfterRound(justCompletedRound);

    hideResults();

    // Show interstitial ad if configured for this round
    if (shouldShowAd) {
        await PathfindrAds.showInterstitial();
    }

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

        // Trigger preload during round 4 if continuous play is enabled
        if (GameState.currentRound === 4 && GameState.continuousPlay.enabled) {
            preloadNextCity();
        }

        // Stay in same city, just pick new endpoints with increased distance
        selectRandomEndpoints();
        enableDrawing();

        // Analytics: Track round start for rounds 2-5
        if (typeof PathfindrAnalytics !== 'undefined') {
            PathfindrAnalytics.trackRoundStart(GameState.currentRound, GameState.currentCity?.name || 'Unknown');
        }
    } else {
        // End of 5 rounds - check for continuous play
        if (GameState.continuousPlay.enabled) {
            transitionToNextCity();
        } else {
            showGameOver();
            AmbientViz.stop();
        }
    }
}

function playAgain() {
    hideGameOver();
    GameState.currentRound = 1;
    GameState.totalScore = 0;
    GameState.roundScores = []; // Reset round history
    GameState.gameStarted = false;
    updateScoreDisplay();
    clearRoundLegend();
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

    // Reset game mode to competitive
    GameState.gameMode = 'competitive';

    // Reset continuous play state and remove HUD indicator
    disableContinuousPlay();
    removeContinuousHUD();

    // Show mode selector for new game
    showModeSelector();
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

    // Scale distance based on round number (round 1 = short, round 5 = epic cityscape)
    // EXCEPTION: Visualizer mode always uses epic distances
    let scale;
    if (GameState.gameMode === 'visualizer') {
        // Visualizer always gets epic, cinematic routes
        scale = { min: 3.0, max: 6.0 };
    } else {
        const round = GameState.currentRound || 1;
        const distanceScales = [
            { min: 0.3, max: 0.6 },   // Round 1: warm up (~3-6 blocks)
            { min: 0.5, max: 1.0 },   // Round 2: getting comfortable
            { min: 1.0, max: 2.0 },   // Round 3: neighborhood scale
            { min: 2.0, max: 3.5 },   // Round 4: cross-neighborhood
            { min: 3.0, max: 6.0 }    // Round 5: epic cityscape (~quarter city)
        ];
        scale = distanceScales[Math.min(round - 1, 4)];
    }

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

    // MapLibre fitBounds expects [[west, south], [east, north]] = [[minLng, minLat], [maxLng, maxLat]]
    const bounds = [
        [Math.min(startPos.lng, endPos.lng), Math.min(startPos.lat, endPos.lat)],
        [Math.max(startPos.lng, endPos.lng), Math.max(startPos.lat, endPos.lat)]
    ];

    GameState.map.fitBounds(bounds, {
        padding: 80,
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

    // MapLibre fitBounds expects [[west, south], [east, north]] = [[minLng, minLat], [maxLng, maxLat]]
    const bounds = [
        [Math.min(startPos.lng, endPos.lng), Math.min(startPos.lat, endPos.lat)],
        [Math.max(startPos.lng, endPos.lng), Math.max(startPos.lat, endPos.lat)]
    ];

    GameState.map.fitBounds(bounds, {
        padding: 80,
        maxZoom: 16
    });
}

function placeMarkers() {
    // Clear existing markers from DOM container
    const markerContainer = document.getElementById('marker-container');
    if (GameState.startMarkerEl) {
        GameState.startMarkerEl.remove();
        GameState.startMarkerEl = null;
    }
    if (GameState.endMarkerEl) {
        GameState.endMarkerEl.remove();
        GameState.endMarkerEl = null;
    }

    // Clear legacy markers if present
    if (GameState.startMarker) {
        GameState.map.removeLayer(GameState.startMarker);
        GameState.startMarker = null;
    }
    if (GameState.endMarker) {
        GameState.map.removeLayer(GameState.endMarker);
        GameState.endMarker = null;
    }

    const startPos = GameState.nodes.get(GameState.startNode);
    const endPos = GameState.nodes.get(GameState.endNode);

    if (!startPos || !endPos) {
        console.error('Invalid start or end position!', startPos, endPos);
        return;
    }

    // Create start marker element
    const startMarker = document.createElement('div');
    startMarker.className = 'custom-marker start-marker';
    startMarker.textContent = 'S';
    markerContainer.appendChild(startMarker);
    GameState.startMarkerEl = startMarker;

    // Create end marker element
    const endMarker = document.createElement('div');
    endMarker.className = 'custom-marker end-marker';
    endMarker.textContent = 'E';
    markerContainer.appendChild(endMarker);
    GameState.endMarkerEl = endMarker;

    // Store lat/lng for position updates
    GameState.startMarkerLatLng = { lat: startPos.lat, lng: startPos.lng };
    GameState.endMarkerLatLng = { lat: endPos.lat, lng: endPos.lng };

    // Position markers initially
    updateMarkerPositions();

    // Labels no longer needed - integrated into markers
    GameState.startLabel = null;
    GameState.endLabel = null;
}

function updateMarkerPositions() {
    if (!GameState.map) return;

    // Marker is 28px, so offset by 14 to center
    // MapLibre project() takes [lng, lat] and returns {x, y}
    if (GameState.startMarkerEl && GameState.startMarkerLatLng) {
        const startPt = GameState.map.project([GameState.startMarkerLatLng.lng, GameState.startMarkerLatLng.lat]);
        GameState.startMarkerEl.style.transform = `translate(${startPt.x - 14}px, ${startPt.y - 14}px)`;
    }

    if (GameState.endMarkerEl && GameState.endMarkerLatLng) {
        const endPt = GameState.map.project([GameState.endMarkerLatLng.lng, GameState.endMarkerLatLng.lat]);
        GameState.endMarkerEl.style.transform = `translate(${endPt.x - 14}px, ${endPt.y - 14}px)`;
    }
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
        // Audio and visual feedback
        SoundEngine.click();
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
    // Only handle single-finger taps for drawing
    // Multi-touch should be allowed for map navigation
    if (e.touches.length === 1) {
        e.preventDefault(); // Prevent scroll/zoom for single touch
        handleTouchTap(e);
    }
    // Multi-touch (2+ fingers) is not prevented - allows map pinch-zoom
}

function handleTouchMove(e) {
    // Prevent scrolling when touching the canvas
    // But allow multi-touch for map navigation
    if (e.touches.length === 1) {
        e.preventDefault();
    }
}

function getLatLngFromEvent(e) {
    const rect = GameState.drawCanvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    // MapLibre unproject() takes [x, y] and returns LngLat object
    const lngLat = GameState.map.unproject([x, y]);
    return { lat: lngLat.lat, lng: lngLat.lng };
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
        points.push(GameState.map.project([pos.lng, pos.lat]));
    }

    if (points.length < 2) return;

    // ALWAYS use consistent warm orange for user path - instant recognition across all rounds
    const uc = CONFIG.color.getUserPathColor();

    // Get animation state
    const elec = GameState.userPathElectricity;
    const time = performance.now() * 0.001;
    elec.phase = time;

    // Organic flicker - more pronounced for "human" feel
    const flicker = 0.88 + Math.sin(time * 18) * 0.04 + Math.sin(time * 5) * 0.04 + (Math.random() - 0.5) * 0.04;

    // Add subtle wobble to points for "hand-drawn" feel
    const wobblePoints = points.map((p, i) => {
        // More wobble in the middle, less at endpoints
        const edgeFactor = Math.min(i, points.length - 1 - i) / (points.length / 2);
        const wobbleAmount = 1.5 * Math.min(edgeFactor, 1);
        const wobbleX = Math.sin(time * 3 + i * 0.7) * wobbleAmount;
        const wobbleY = Math.cos(time * 2.3 + i * 0.5) * wobbleAmount;
        return { x: p.x + wobbleX, y: p.y + wobbleY };
    });

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Use lighter composite for glow
    ctx.globalCompositeOperation = 'lighter';

    // Outer atmospheric glow - warm orange haze
    ctx.strokeStyle = `rgba(${uc.r}, ${uc.g}, ${uc.b}, ${0.08 * flicker})`;
    ctx.lineWidth = 20;
    drawWobblyPath(ctx, wobblePoints);
    ctx.stroke();

    // Outer glow with flicker
    ctx.strokeStyle = `rgba(${uc.r}, ${uc.g}, ${uc.b}, ${0.18 * flicker})`;
    ctx.lineWidth = 12;
    drawWobblyPath(ctx, wobblePoints);
    ctx.stroke();

    // Mid glow - slightly brighter, warmer
    ctx.strokeStyle = `rgba(${uc.r}, ${Math.min(255, uc.g + 20)}, ${uc.b}, ${0.35 * flicker})`;
    ctx.lineWidth = 7;
    drawWobblyPath(ctx, wobblePoints);
    ctx.stroke();

    // Inner glow - brightest
    ctx.strokeStyle = `rgba(${uc.r}, ${Math.min(255, uc.g + 40)}, ${uc.b}, ${0.55 * flicker})`;
    ctx.lineWidth = 4;
    drawWobblyPath(ctx, wobblePoints);
    ctx.stroke();

    ctx.globalCompositeOperation = 'source-over';

    // Core line - bright warm orange with flicker
    ctx.strokeStyle = `rgba(${uc.r}, ${Math.min(255, uc.g + 30)}, ${uc.b}, ${0.95})`;
    ctx.lineWidth = 2.5;
    drawWobblyPath(ctx, wobblePoints);
    ctx.stroke();

    // White hot center for extra pop
    ctx.strokeStyle = `rgba(255, 255, 255, ${0.4 * flicker})`;
    ctx.lineWidth = 1;
    drawWobblyPath(ctx, wobblePoints);
    ctx.stroke();

    // Energy pulses traveling along the path
    renderUserPathPulses(ctx, points, time, uc);
}

// Helper to draw a slightly wobbly path (human feel)
function drawWobblyPath(ctx, points) {
    if (points.length < 2) return;
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y);
    }
}

// Render energy pulses along user path
function renderUserPathPulses(ctx, points, time, userColor) {
    if (points.length < 2) return;

    const elec = GameState.userPathElectricity;
    const uc = userColor || CONFIG.color.getTheme(1).mid; // Fallback to round 1 mid

    // Spawn new pulses periodically
    if (time - elec.lastPulseTime > 0.8) { // New pulse every 0.8 seconds
        elec.pulses.push({
            progress: 0,
            speed: 0.4 + Math.random() * 0.2, // Vary speed slightly
            size: 0.8 + Math.random() * 0.4,
        });
        elec.lastPulseTime = time;

        // Limit pulse count
        if (elec.pulses.length > 4) {
            elec.pulses.shift();
        }
    }

    // Calculate total path length for pulse positioning
    let totalLength = 0;
    const segmentLengths = [];
    for (let i = 1; i < points.length; i++) {
        const dx = points[i].x - points[i-1].x;
        const dy = points[i].y - points[i-1].y;
        const len = Math.sqrt(dx * dx + dy * dy);
        segmentLengths.push(len);
        totalLength += len;
    }

    if (totalLength === 0) return;

    ctx.globalCompositeOperation = 'lighter';

    // Update and render each pulse
    for (let p = elec.pulses.length - 1; p >= 0; p--) {
        const pulse = elec.pulses[p];
        pulse.progress += pulse.speed * 0.016; // Assuming ~60fps

        if (pulse.progress > 1) {
            elec.pulses.splice(p, 1);
            continue;
        }

        // Find position along path
        const targetDist = pulse.progress * totalLength;
        let accDist = 0;
        let pulseX = points[0].x;
        let pulseY = points[0].y;

        for (let i = 0; i < segmentLengths.length; i++) {
            if (accDist + segmentLengths[i] >= targetDist) {
                const segProgress = (targetDist - accDist) / segmentLengths[i];
                pulseX = points[i].x + (points[i+1].x - points[i].x) * segProgress;
                pulseY = points[i].y + (points[i+1].y - points[i].y) * segProgress;
                break;
            }
            accDist += segmentLengths[i];
        }

        // Draw pulse glow
        const pulseAlpha = Math.sin(pulse.progress * Math.PI); // Fade in/out
        const size = 24 * pulse.size * (0.8 + 0.2 * pulseAlpha);

        // Use sprite if available, otherwise gradient
        const sprite = AmbientViz.sprites?.glowWhite;
        if (sprite) {
            ctx.globalAlpha = pulseAlpha * 0.7;
            ctx.drawImage(sprite, pulseX - size/2, pulseY - size/2, size, size);
        } else {
            // Use theme-based user path colors for gradient
            const gradient = ctx.createRadialGradient(pulseX, pulseY, 0, pulseX, pulseY, size/2);
            gradient.addColorStop(0, `rgba(255, ${Math.min(255, uc.g + 80)}, ${Math.min(255, uc.b + 80)}, ${pulseAlpha * 0.9})`);
            gradient.addColorStop(0.5, `rgba(${uc.r}, ${Math.min(255, uc.g + 30)}, ${uc.b}, ${pulseAlpha * 0.5})`);
            gradient.addColorStop(1, `rgba(${uc.r}, ${uc.g}, ${uc.b}, 0)`);

            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(pulseX, pulseY, size/2, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
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

    // === HERO ANIMATION: User path "locks in" with dramatic effect ===
    await playUserPathLockInAnimation();

    // User path is rendered via canvas overlays
    // Clear the draw canvas before A* visualization
    GameState.drawCtx.clearRect(0, 0, GameState.drawCanvas.width, GameState.drawCanvas.height);

    // Brief anticipation pause before A* begins
    await sleep(400);

    // Run A*
    const { path, explored } = runAStar(GameState.startNode, GameState.endNode);
    GameState.optimalPath = path;
    GameState.exploredNodes = explored;

    // Enter VISUALIZING phase (GameController handles vizState.active)
    GameController.enterPhase(GamePhase.VISUALIZING);

    // Start visualization
    await runEpicVisualization(explored, path);

    // Enter RESULTS phase immediately - no additional delay
    GameController.enterPhase(GamePhase.RESULTS);

    calculateAndShowScore();
}

// Hero animation: User path "locks in" with flash and surge effect
async function playUserPathLockInAnimation() {
    const ctx = GameState.drawCtx;
    const points = [];

    for (let i = 0; i < GameState.userPathNodes.length; i++) {
        const nodeId = GameState.userPathNodes[i];
        const pos = GameState.nodes.get(nodeId);
        if (!pos) continue;
        points.push(GameState.map.project([pos.lng, pos.lat]));
    }

    if (points.length < 2) return;

    const uc = CONFIG.color.getUserPathColor();
    const duration = 600; // ms
    const startTime = performance.now();

    // Animate flash and lock-in
    return new Promise(resolve => {
        function animate() {
            const elapsed = performance.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);

            ctx.clearRect(0, 0, GameState.drawCanvas.width, GameState.drawCanvas.height);

            // Easing for dramatic effect
            const easeOut = 1 - Math.pow(1 - progress, 3);
            const flashIntensity = progress < 0.3 ? progress / 0.3 : 1 - ((progress - 0.3) / 0.7);

            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.globalCompositeOperation = 'lighter';

            // Big flash at the start
            if (flashIntensity > 0) {
                ctx.strokeStyle = `rgba(255, 255, 255, ${flashIntensity * 0.5})`;
                ctx.lineWidth = 30 + flashIntensity * 20;
                ctx.beginPath();
                ctx.moveTo(points[0].x, points[0].y);
                for (let i = 1; i < points.length; i++) {
                    ctx.lineTo(points[i].x, points[i].y);
                }
                ctx.stroke();
            }

            // Path solidifies
            const solidOpacity = easeOut;

            // Outer glow
            ctx.strokeStyle = `rgba(${uc.r}, ${uc.g}, ${uc.b}, ${0.2 * solidOpacity})`;
            ctx.lineWidth = 16;
            ctx.beginPath();
            ctx.moveTo(points[0].x, points[0].y);
            for (let i = 1; i < points.length; i++) {
                ctx.lineTo(points[i].x, points[i].y);
            }
            ctx.stroke();

            // Core
            ctx.strokeStyle = `rgba(${uc.r}, ${uc.g}, ${uc.b}, ${0.9 * solidOpacity})`;
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(points[0].x, points[0].y);
            for (let i = 1; i < points.length; i++) {
                ctx.lineTo(points[i].x, points[i].y);
            }
            ctx.stroke();

            ctx.globalCompositeOperation = 'source-over';

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                resolve();
            }
        }
        animate();
    });
}

// Comparison animation: Both paths pulse together for easy comparison
async function playComparisonAnimation() {
    // This runs after the optimal path is drawn
    // Brief moment where both paths pulse together before showing results
    const duration = 150; // Very quick - results panel slides in immediately after
    const startTime = performance.now();

    return new Promise(resolve => {
        function pulse() {
            const elapsed = performance.now() - startTime;
            if (elapsed >= duration) {
                resolve();
                return;
            }
            requestAnimationFrame(pulse);
        }
        pulse();
    });
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
                // Sync to WebGL
                if (GameState.useWebGL) {
                    WebGLRenderer.setEdgeHeat(edgeKey, 1.0);
                }
            }
        }

        // Reduced particles - only spawn occasionally
        if (i % 3 === 0 && viz.particles.length < CONFIG.viz.maxParticles) {
            const pos = GameState.nodes.get(nodeId);
            if (pos) {
                viz.particles.push(createParticle(pos, 'explore'));
            }
        }

        // Rising ping sound removed - using WAV file only

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

    // Brief pause at full brightness
    await sleep(250 / speed);

    // === SETTLING PHASE: Quick blend to ambient ===
    // Heat map blends into ambient (never fully fades)
    viz.phase = 'settling';
    viz.settleStartTime = performance.now();
    viz.settleDuration = 400; // 0.4 seconds - snappy transition

    // Wait for settling to complete (renderVisualization handles the animation)
    await sleep(viz.settleDuration / speed);
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
    // If GameController is running the unified loop, don't start a competing loop
    // GameController._renderFrame() will call renderVisualization() when in VISUALIZING phase
    if (GameController.animationId) {
        console.log('[startRenderLoop] Deferring to GameController');
        return;
    }

    function render() {
        if (!GameState.vizState.active) return;

        renderVisualization();
        GameState.vizState.animationId = requestAnimationFrame(render);
    }
    render();
}

// Ambient road network - subtle glow that stays locked to roads
function drawAmbientRoads(ctx, time, width, height) {
    const edges = ScreenCoordCache.getEdges();
    if (edges.length === 0) return;

    // Get ambient colors from unified color system
    const ambient = CONFIG.color.getAmbient();

    // Gentle breathing pulse
    const breathe = 0.85 + 0.15 * Math.sin(time * 0.6);

    ctx.globalCompositeOperation = 'source-over';
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Outer warm glow layer - using ambient.outer
    ctx.strokeStyle = `rgba(${ambient.outer.r}, ${ambient.outer.g}, ${ambient.outer.b}, ${0.2 * breathe})`;
    ctx.lineWidth = 6;
    ctx.beginPath();
    for (let i = 0; i < edges.length; i++) {
        const edge = edges[i];
        ctx.moveTo(edge.from.x, edge.from.y);
        ctx.lineTo(edge.to.x, edge.to.y);
    }
    ctx.stroke();

    // Mid glow layer - using ambient.mid
    ctx.strokeStyle = `rgba(${ambient.mid.r}, ${ambient.mid.g}, ${ambient.mid.b}, ${0.22 * breathe})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (let i = 0; i < edges.length; i++) {
        const edge = edges[i];
        ctx.moveTo(edge.from.x, edge.from.y);
        ctx.lineTo(edge.to.x, edge.to.y);
    }
    ctx.stroke();

    // Core roads - using ambient.core (warm amber)
    ctx.strokeStyle = `rgba(${ambient.core.r}, ${ambient.core.g}, ${ambient.core.b}, ${0.15 * breathe})`;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let i = 0; i < edges.length; i++) {
        const edge = edges[i];
        ctx.moveTo(edge.from.x, edge.from.y);
        ctx.lineTo(edge.to.x, edge.to.y);
    }
    ctx.stroke();
}

// Helper: Get current visualization color theme based on game mode
function getCurrentVizTheme() {
    let colorIndex;
    if (GameState.gameMode === 'visualizer') {
        colorIndex = VisualizerHistory.pathIndex;
    } else if (GameState.gameMode === 'explorer') {
        colorIndex = ExplorerHistory.pathIndex;
    } else {
        // Competitive mode - use round number (1-indexed, convert to 0-indexed)
        colorIndex = (GameState.currentRound || 1) - 1;
    }
    return CONFIG.color.getThemeByIndex(colorIndex);
}

function renderVisualization() {
    const ctx = GameState.vizCtx;
    const viz = GameState.vizState;
    const width = GameState.vizCanvas.width;
    const height = GameState.vizCanvas.height;

    ctx.clearRect(0, 0, width, height);

    // Render persistent history FIRST (underneath current visualization)
    // This ensures previous paths stay visible during new visualizations
    if (GameState.gameMode === 'explorer' && ExplorerHistory.hasHistory()) {
        AmbientViz.renderPathHistory(ctx, 16, ExplorerHistory.getPaths(), true);
    } else if (GameState.gameMode === 'visualizer' && VisualizerHistory.hasHistory()) {
        AmbientViz.renderPathHistory(ctx, 16, VisualizerHistory.getPaths(), true);
    } else if (GameState.gameMode === 'competitive') {
        // Competitive mode - render round history
        AmbientViz.renderRoundHistory(ctx, 16, true);
    }

    viz.pulsePhase += CONFIG.viz.pulseSpeed;

    const time = performance.now() * 0.001;
    // Enhanced organic flicker - multiple layered sine waves with phase offsets
    const flicker = 0.88 +
        Math.sin(time * 23) * 0.03 +           // Primary pulse
        Math.sin(time * 7.3) * 0.04 +          // Slow breathing
        Math.sin(time * 47) * 0.015 +          // High frequency shimmer
        Math.sin(time * 3.7 + 1.2) * 0.02 +    // Very slow undulation
        (Math.random() - 0.5) * 0.04;          // Organic noise

    // === SETTLING PHASE: Calculate crossfade progress ===
    let settleProgress = 0;
    let heatOpacity = 1.0;
    let ambientOpacity = 0.0;

    if (viz.phase === 'settling') {
        const elapsed = performance.now() - viz.settleStartTime;
        settleProgress = Math.min(1, elapsed / (viz.settleDuration || 800));

        // Ease-out curve for smooth deceleration
        const easeOut = 1 - Math.pow(1 - settleProgress, 2);

        // VISUALIZER MODE: Keep heat at full brightness permanently
        if (GameState.gameMode === 'visualizer') {
            heatOpacity = 1.0;
            ambientOpacity = 0.0;
        } else {
            // Other modes: Heat map blends into ambient - never fully fades out
            // Keep minimum 25% heat visibility so it blends smoothly
            heatOpacity = 1 - (easeOut * 0.75);
            ambientOpacity = easeOut;
        }
    }

    // Decay heat values with floor - explored edges never fully fade
    // During settling, decay faster but KEEP a floor for ambient blending
    // NOTE: When using WebGL, decay is GPU-side (time-based in shader)
    // This CPU loop is only needed for Canvas 2D fallback
    const baseDecay = CONFIG.viz.heatDecay;
    const settlingDecay = viz.phase === 'settling'
        ? Math.pow(baseDecay, 1 + settleProgress * 2)  // Up to 3x faster decay
        : baseDecay;
    // Keep floor at minimum 20% during settling so heat blends into ambient
    const heatFloor = viz.phase === 'settling'
        ? Math.max(0.2, CONFIG.viz.heatFloor * (1 - settleProgress * 0.7))
        : CONFIG.viz.heatFloor;

    // Only run CPU decay loop for Canvas 2D fallback
    if (!GameState.useWebGL) {
        for (const [nodeId, heat] of viz.nodeHeat) {
            const newHeat = heat * settlingDecay;
            viz.nodeHeat.set(nodeId, Math.max(newHeat, heatFloor));
        }
        for (const [edgeKey, heat] of viz.edgeHeat) {
            const newHeat = heat * settlingDecay;
            viz.edgeHeat.set(edgeKey, Math.max(newHeat, heatFloor));
        }
    }

    // During settling, render ambient underneath with increasing opacity
    if (viz.phase === 'settling' && ambientOpacity > 0.1) {
        ctx.save();
        ctx.globalAlpha = ambientOpacity;

        // Render ambient history layer
        if (GameState.gameMode === 'explorer' && ExplorerHistory.hasHistory()) {
            AmbientViz.renderPathHistory(ctx, 16, ExplorerHistory.getPaths(), false);
        } else if (GameState.gameMode === 'visualizer' && VisualizerHistory.hasHistory()) {
            AmbientViz.renderPathHistory(ctx, 16, VisualizerHistory.getPaths(), false);
        } else if (GameState.gameMode === 'competitive') {
            AmbientViz.renderRoundHistory(ctx, 16, false);
        }

        ctx.restore();
    }

    // Use WebGL for road and heat rendering
    if (GameState.useWebGL) {
        // During settling, reduce WebGL opacity
        if (viz.phase === 'settling') {
            WebGLRenderer.setGlobalOpacity(heatOpacity);
        }
        WebGLRenderer.render(performance.now());
        if (viz.phase === 'settling') {
            WebGLRenderer.setGlobalOpacity(1.0);
        }
    } else {
        // Canvas 2D fallback - draw ambient road network
        drawAmbientRoads(ctx, time, width, height);

        // Batch render explored edges
        ctx.globalCompositeOperation = 'lighter';
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        // Apply heat opacity during settling phase (fades out heat map)
        if (viz.phase === 'settling') {
            ctx.save();
            ctx.globalAlpha = heatOpacity;
        }

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

        // Get current visualization color - mode-aware
        const theme = getCurrentVizTheme();
        const c = theme.base;  // SINGLE color for all heat levels - unity!
        const glowMult = CONFIG.viz.glowIntensity;

        // ENHANCED heat map - dramatic glow with multiple layers
        // High heat - FRONTIER GLOW - brightest, most dramatic
        if (edgesByHeat.high.length > 0) {
            // Widest atmospheric bloom
            ctx.strokeStyle = `rgba(${c.r}, ${c.g}, ${c.b}, ${0.12 * glowMult})`;
            ctx.lineWidth = 20;
            ctx.beginPath();
            for (const edge of edgesByHeat.high) {
                ctx.moveTo(edge.from.x, edge.from.y);
                ctx.lineTo(edge.to.x, edge.to.y);
            }
            ctx.stroke();

            // Outer glow
            ctx.strokeStyle = `rgba(${c.r}, ${c.g}, ${c.b}, ${0.2 * glowMult})`;
            ctx.lineWidth = 12;
            ctx.beginPath();
            for (const edge of edgesByHeat.high) {
                ctx.moveTo(edge.from.x, edge.from.y);
                ctx.lineTo(edge.to.x, edge.to.y);
            }
            ctx.stroke();

            // Core glow
            ctx.strokeStyle = `rgba(${c.r}, ${c.g}, ${c.b}, ${0.5 * flicker * glowMult})`;
            ctx.lineWidth = 5;
            ctx.beginPath();
            for (const edge of edgesByHeat.high) {
                ctx.moveTo(edge.from.x, edge.from.y);
                ctx.lineTo(edge.to.x, edge.to.y);
            }
            ctx.stroke();

            // White-hot center for frontier
            ctx.strokeStyle = `rgba(255, 255, 255, ${0.3 * flicker})`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            for (const edge of edgesByHeat.high) {
                ctx.moveTo(edge.from.x, edge.from.y);
                ctx.lineTo(edge.to.x, edge.to.y);
            }
            ctx.stroke();
        }

        // Medium heat - explored areas, still visible
        if (edgesByHeat.medium.length > 0) {
            // Outer glow
            ctx.strokeStyle = `rgba(${c.r}, ${c.g}, ${c.b}, ${0.1 * glowMult})`;
            ctx.lineWidth = 14;
            ctx.beginPath();
            for (const edge of edgesByHeat.medium) {
                ctx.moveTo(edge.from.x, edge.from.y);
                ctx.lineTo(edge.to.x, edge.to.y);
            }
            ctx.stroke();

            // Mid glow
            ctx.strokeStyle = `rgba(${c.r}, ${c.g}, ${c.b}, ${0.25 * flicker * glowMult})`;
            ctx.lineWidth = 6;
            ctx.beginPath();
            for (const edge of edgesByHeat.medium) {
                ctx.moveTo(edge.from.x, edge.from.y);
                ctx.lineTo(edge.to.x, edge.to.y);
            }
            ctx.stroke();

            // Core
            ctx.strokeStyle = `rgba(${c.r}, ${c.g}, ${c.b}, ${0.4 * flicker})`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            for (const edge of edgesByHeat.medium) {
                ctx.moveTo(edge.from.x, edge.from.y);
                ctx.lineTo(edge.to.x, edge.to.y);
            }
            ctx.stroke();
        }

        // Low heat - ambient explored, keeps map "alive"
        if (edgesByHeat.low.length > 0) {
            ctx.strokeStyle = `rgba(${c.r}, ${c.g}, ${c.b}, ${0.08 * glowMult})`;
            ctx.lineWidth = 8;
            ctx.beginPath();
            for (const edge of edgesByHeat.low) {
                ctx.moveTo(edge.from.x, edge.from.y);
                ctx.lineTo(edge.to.x, edge.to.y);
            }
            ctx.stroke();

            ctx.strokeStyle = `rgba(${c.r}, ${c.g}, ${c.b}, ${0.15 * flicker})`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            for (const edge of edgesByHeat.low) {
                ctx.moveTo(edge.from.x, edge.from.y);
                ctx.lineTo(edge.to.x, edge.to.y);
            }
            ctx.stroke();
        }

        // Restore context after settling opacity changes
        if (viz.phase === 'settling') {
            ctx.restore();
        }
    }

    // Draw frontier nodes using sprites (always on Canvas 2D)
    // OPTIMIZED: Only render highest-heat nodes, limit total count
    ctx.globalCompositeOperation = 'lighter';
    const spriteSize = AmbientViz.spriteSize;
    const maxFrontierNodes = 50; // Limit to prevent performance issues on dense maps
    let frontierCount = 0;

    // Only draw during active exploration phase, not during path/complete
    if (viz.phase === 'exploring') {
        for (const [nodeId, heat] of viz.nodeHeat) {
            if (heat < 0.7) continue; // Higher threshold for better performance
            if (frontierCount >= maxFrontierNodes) break;

            const pos = GameState.nodes.get(nodeId);
            if (!pos) continue;

            const screen = GameState.map.project([pos.lng, pos.lat]);
            const size = spriteSize * heat * 0.8;
            const spriteToUse = heat > 0.9 ? AmbientViz.sprites.glowWhite :
                               AmbientViz.sprites.glowCyan;

            ctx.globalAlpha = heat * flicker * 0.8;
            ctx.drawImage(spriteToUse, screen.x - size / 2, screen.y - size / 2, size, size);
            frontierCount++;
        }
    }

    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';

    // Draw optimal path (always on Canvas 2D)
    // During settling, fade out the path along with the heat map
    if (viz.phase === 'path' || viz.phase === 'complete' || viz.phase === 'settling') {
        if (viz.phase === 'settling') {
            ctx.save();
            ctx.globalAlpha = heatOpacity;
        }
        drawOptimalPath(ctx);
        if (viz.phase === 'settling') {
            ctx.restore();
        }
    }

    // Update and draw particles
    updateParticles();
    drawParticles(ctx);
}

// LEGACY: Heat color interpolation - now uses current round's exploration color instead
// Kept for potential future use, returns theme-based exploration color
function getHeatColor(heat) {
    const theme = getCurrentVizTheme();
    const ec = theme.base;
    // Modulate brightness by heat
    const brightness = 0.3 + heat * 0.7;
    return {
        r: Math.round(ec.r * brightness),
        g: Math.round(ec.g * brightness),
        b: Math.round(ec.b * brightness)
    };
}

// Helper: Draw smooth bezier curve through points
function drawSmoothPath(ctx, points) {
    if (points.length < 2) return;

    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);

    if (points.length === 2) {
        // Just a line for 2 points
        ctx.lineTo(points[1].x, points[1].y);
    } else {
        // Use quadratic bezier curves for smooth interpolation
        for (let i = 0; i < points.length - 1; i++) {
            const p0 = points[i];
            const p1 = points[i + 1];

            if (i === 0) {
                // First segment - line to midpoint
                const midX = (p0.x + p1.x) / 2;
                const midY = (p0.y + p1.y) / 2;
                ctx.lineTo(midX, midY);
            } else if (i === points.length - 2) {
                // Last segment - curve to end point
                ctx.quadraticCurveTo(p0.x, p0.y, p1.x, p1.y);
            } else {
                // Middle segments - curve to midpoint of next segment
                const p2 = points[i + 2];
                const midX = (p1.x + p2.x) / 2;
                const midY = (p1.y + p2.y) / 2;
                ctx.quadraticCurveTo(p1.x, p1.y, midX, midY);
            }
        }
    }
}

function drawOptimalPath(ctx) {
    const path = GameState.optimalPath;
    const progress = GameState.vizState.pathProgress;
    const viz = GameState.vizState;

    if (path.length < 2) return;

    // Get current visualization's optimal color (hot shade for visibility)
    const theme = getCurrentVizTheme();
    const oc = theme.hot;

    const drawTo = Math.min(progress + 1, path.length - 1);

    const points = [];
    for (let i = 0; i <= drawTo; i++) {
        const pos = GameState.nodes.get(path[i]);
        if (!pos) continue;
        points.push(GameState.map.project([pos.lng, pos.lat]));
    }

    if (points.length < 2) return;

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.globalCompositeOperation = 'lighter';

    // CLEAN OPTIMAL PATH TRACE - Simple, elegant layers
    // Wide atmospheric bloom
    ctx.strokeStyle = `rgba(${oc.r}, ${oc.g}, ${oc.b}, 0.08)`;
    ctx.lineWidth = 24;
    drawSmoothPath(ctx, points);
    ctx.stroke();

    // Outer glow
    ctx.strokeStyle = `rgba(${oc.r}, ${oc.g}, ${oc.b}, 0.18)`;
    ctx.lineWidth = 12;
    drawSmoothPath(ctx, points);
    ctx.stroke();

    // Main colored line
    ctx.strokeStyle = `rgba(${oc.r}, ${oc.g}, ${oc.b}, 0.7)`;
    ctx.lineWidth = 5;
    drawSmoothPath(ctx, points);
    ctx.stroke();

    // Bright white core - crisp definition
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.lineWidth = 2;
    drawSmoothPath(ctx, points);
    ctx.stroke();

    ctx.globalCompositeOperation = 'source-over';

    // LEAD POINT during tracing - clean bright dot
    if (progress < path.length - 1 && points.length > 0) {
        const leadPoint = points[points.length - 1];
        ctx.globalCompositeOperation = 'lighter';

        // Simple clean glow
        const radius = 14;
        const gradient = ctx.createRadialGradient(leadPoint.x, leadPoint.y, 0, leadPoint.x, leadPoint.y, radius);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
        gradient.addColorStop(0.3, `rgba(${oc.r}, ${oc.g}, ${oc.b}, 0.8)`);
        gradient.addColorStop(1, `rgba(${oc.r}, ${oc.g}, ${oc.b}, 0)`);

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(leadPoint.x, leadPoint.y, radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.globalCompositeOperation = 'source-over';
    }

    // COMPLETED STATE: Multiple traveling pulses for "living" feel
    if (viz.phase === 'complete' && points.length > 1) {
        const time = performance.now() * 0.001;
        ctx.globalCompositeOperation = 'lighter';

        // 3 pulses traveling at different speeds
        const pulseConfigs = [
            { speed: 0.15, size: 8, brightness: 0.7 },
            { speed: 0.22, size: 6, brightness: 0.5 },
            { speed: 0.08, size: 10, brightness: 0.6 },
        ];

        for (const cfg of pulseConfigs) {
            const t = (time * cfg.speed) % 1;
            const totalLen = points.length - 1;
            const idx = Math.floor(t * totalLen);
            const frac = (t * totalLen) - idx;

            if (idx < points.length - 1) {
                const x = points[idx].x + (points[idx + 1].x - points[idx].x) * frac;
                const y = points[idx].y + (points[idx + 1].y - points[idx].y) * frac;

                const gradient = ctx.createRadialGradient(x, y, 0, x, y, cfg.size);
                gradient.addColorStop(0, `rgba(255, 255, 255, ${cfg.brightness})`);
                gradient.addColorStop(0.5, `rgba(${oc.r}, ${oc.g}, ${oc.b}, ${cfg.brightness * 0.5})`);
                gradient.addColorStop(1, `rgba(${oc.r}, ${oc.g}, ${oc.b}, 0)`);
                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(x, y, cfg.size, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        ctx.globalCompositeOperation = 'source-over';
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
        const screen = GameState.map.project([p.lng, p.lat]);

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

    // Clear WebGL heat data
    if (GameState.useWebGL) {
        WebGLRenderer.clearHeat();
    }

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

    // Clear visualization canvas
    if (GameState.vizCtx) {
        GameState.vizCtx.clearRect(0, 0, GameState.vizCanvas.width, GameState.vizCanvas.height);
    }

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

    // Check max segment distance (prevents clicking directly on endpoint)
    if (GameState.gameMode !== 'explorer') {
        const lastPos = GameState.nodes.get(lastNode);
        const targetPos = GameState.nodes.get(targetNode);
        if (lastPos && targetPos) {
            const clickDistance = haversineDistance(lastPos.lat, lastPos.lng, targetPos.lat, targetPos.lng);
            const maxDistance = CONFIG.segmentDistance[GameState.difficulty] || CONFIG.segmentDistance.medium;
            if (clickDistance > maxDistance) {
                showDistanceRejectionFeedback();
                return false;
            }
        }
    }

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

    // Haptic feedback when node is snapped
    GameHaptics.nodeSnap();

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
            // Haptic feedback when path reaches destination
            GameHaptics.pathComplete();

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

            // Handle completion based on game mode
            if (GameState.gameMode === 'explorer') {
                // In explorer mode, show comparison visualization
                setTimeout(() => {
                    if (!GameState.vizState.active) {
                        showExplorerComparison();
                    }
                }, 300);
            } else {
                // Competitive mode - auto-submit
                setTimeout(() => {
                    if (!GameState.vizState.active) {
                        submitRoute();
                    }
                }, 300);
            }
        }
    }

    return true;
}

/**
 * Show visual feedback when a click is rejected due to distance limit.
 */
function showDistanceRejectionFeedback() {
    if (GameState.drawCanvas) {
        GameState.drawCanvas.classList.add('distance-rejected');
        setTimeout(() => {
            GameState.drawCanvas.classList.remove('distance-rejected');
        }, 300);
    }
    // Play a subtle error sound if audio is available
    if (typeof playSound === 'function') {
        playSound('error', 0.3);
    }
    // Haptic warning for rejected tap
    GameHaptics.warning();
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

    // Get current visualization's exploration color for trace animation
    const theme = getCurrentVizTheme();
    const tc = theme.base; // Trace uses exploration color

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
        const from = GameState.map.project([seg.fromLng, seg.fromLat]);
        const to = GameState.map.project([seg.toLng, seg.toLat]);

        // Glow - using exploration color
        ctx.strokeStyle = `rgba(${tc.r}, ${tc.g}, ${tc.b}, 0.4)`;
        ctx.lineWidth = 12;
        ctx.beginPath();
        ctx.moveTo(from.x, from.y);
        ctx.lineTo(to.x, to.y);
        ctx.stroke();

        // Core
        ctx.strokeStyle = `rgba(${tc.r}, ${tc.g}, ${tc.b}, 0.9)`;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(from.x, from.y);
        ctx.lineTo(to.x, to.y);
        ctx.stroke();
    }

    // Draw current segment (partial, with bright leading edge)
    if (completedSegments < totalSegments) {
        const seg = trace.segments[completedSegments];
        const from = GameState.map.project([seg.fromLng, seg.fromLat]);
        const to = GameState.map.project([seg.toLng, seg.toLat]);

        // Interpolate position
        const currentX = from.x + (to.x - from.x) * currentSegmentProgress;
        const currentY = from.y + (to.y - from.y) * currentSegmentProgress;

        // Trail glow
        ctx.strokeStyle = `rgba(${tc.r}, ${tc.g}, ${tc.b}, 0.3)`;
        ctx.lineWidth = 10;
        ctx.beginPath();
        ctx.moveTo(from.x, from.y);
        ctx.lineTo(currentX, currentY);
        ctx.stroke();

        // Trail core
        ctx.strokeStyle = `rgba(${tc.r}, ${tc.g}, ${tc.b}, 0.8)`;
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

    // Mobile bottom bar distance
    const mobileDist = document.getElementById('mobile-distance');
    if (mobileDist) mobileDist.textContent = distStr;

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
    if (GameState.drawCtx) {
        GameState.drawCtx.clearRect(0, 0, GameState.drawCanvas.width, GameState.drawCanvas.height);
    }

    // Clear electricity animation state
    GameState.userPathElectricity.pulses = [];
    GameState.userPathElectricity.lastPulseTime = 0;

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

    // Update the round legend in HUD
    updateRoundLegend();

    // Save round to persistent history for visualization
    const exploredEdgeKeys = Array.from(GameState.vizState.edgeHeat.keys());
    RoundHistory.addRound(
        GameState.currentRound,
        exploredEdgeKeys,
        GameState.optimalPath,
        GameState.userPathNodes
    );

    // Submit score to Supabase (if logged in)
    if (typeof PathfindrAuth !== 'undefined' && PathfindrAuth.isLoggedIn()) {
        const mapCenter = GameState.map.getCenter();
        const locationName = document.getElementById('current-location')?.textContent || 'Unknown';

        // Convert node IDs to lat/lng coordinates for storage
        const userPathCoords = GameState.userPathNodes
            .map(nodeId => GameState.nodes.get(nodeId))
            .filter(pos => pos != null)
            .map(pos => ({ lat: pos.lat, lng: pos.lng }));

        const optimalPathCoords = GameState.optimalPath
            .map(nodeId => GameState.nodes.get(nodeId))
            .filter(pos => pos != null)
            .map(pos => ({ lat: pos.lat, lng: pos.lng }));

        PathfindrAuth.submitScore({
            efficiency: efficiency,
            locationName: locationName,
            centerLat: mapCenter.lat,
            centerLng: mapCenter.lng,
            zoomLevel: GameState.map.getZoom(),
            roundNumber: GameState.currentRound,
            userPath: userPathCoords,
            optimalPath: optimalPathCoords,
        }).then(result => {
            if (result.success) {
                console.log('[Game] Score submitted for round', GameState.currentRound);
            }
        }).catch(err => {
            console.warn('[Game] Score submission failed:', err);
        });

        // Update city leaderboard
        if (typeof CityLeaderboard !== 'undefined') {
            CityLeaderboard.submitScore(locationName, efficiency);
        }
    }

    // Analytics: Track round completion
    if (typeof PathfindrAnalytics !== 'undefined') {
        PathfindrAnalytics.trackRoundComplete(
            GameState.currentRound,
            efficiency,
            userDistance * 1000,  // Convert to meters
            optimalDistance * 1000
        );
    }

    // Check for new achievements after round
    if (typeof PathfindrAchievements !== 'undefined' && PathfindrAuth?.isLoggedIn()) {
        PathfindrAchievements.checkAchievements();
    }

    // Play the path found sound and haptic
    SoundEngine.pathFound();
    GameHaptics.roundEnd();

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
            nextBtn.innerHTML = `<span>Next City</span>
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

    showLoading('Finding your destination...');

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

        GameState.map.jumpTo({ center: [lng, lat], zoom: 15 });
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

function showLoading(text, allowHtml = false, targetCity = null) {
    const loadingText = document.getElementById('loading-text');
    if (allowHtml || text.includes('<')) {
        loadingText.innerHTML = text;
    } else {
        loadingText.textContent = text;
    }
    document.getElementById('loading-overlay').classList.remove('hidden');

    // Update city name
    const cityEl = document.getElementById('loading-city');
    if (cityEl) cityEl.textContent = targetCity?.name || '';

    // Start map zoom animation if we have valid coordinates
    if (targetCity && targetCity.lat && targetCity.lng) {
        MapTransition.start(targetCity.lat, targetCity.lng, targetCity.name || '', targetCity.zoom || 15);
    }
}

function hideLoading() {
    document.getElementById('loading-overlay').classList.add('hidden');
    MapTransition.stop();

    // Clear city name
    const cityEl = document.getElementById('loading-city');
    if (cityEl) cityEl.textContent = '';
}

// =============================================================================
// MODE SELECTOR
// =============================================================================

function initModeSelector() {
    // Mode buttons
    document.querySelectorAll('.mode-btn').forEach(btn => {
        btn.addEventListener('mouseenter', () => SoundEngine.uiHover());
        btn.addEventListener('click', () => {
            SoundEngine.uiClick();
            const mode = btn.dataset.mode;
            selectGameMode(mode);
        });
    });

    // Difficulty buttons
    document.querySelectorAll('.difficulty-btn').forEach(btn => {
        btn.addEventListener('mouseenter', () => SoundEngine.uiHover());
        btn.addEventListener('click', () => {
            SoundEngine.uiClick();
            const difficulty = btn.dataset.difficulty;
            setDifficulty(difficulty);
        });
    });
}

function setDifficulty(difficulty) {
    // Update game state
    GameState.difficulty = difficulty;

    // Update button active states
    document.querySelectorAll('.difficulty-btn').forEach(btn => {
        if (btn.dataset.difficulty === difficulty) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    console.log(`[Game] Difficulty set to: ${difficulty} (${CONFIG.segmentDistance[difficulty]}km max segment)`);
}

function showModeSelector() {
    document.getElementById('loading-overlay').classList.add('hidden');
    document.getElementById('mode-selector').classList.remove('hidden');
    SoundEngine.uiTransition();
}

function hideModeSelector() {
    document.getElementById('mode-selector').classList.add('hidden');
}

// DEBUG: Set to true to bypass premium checks for testing
const DEBUG_BYPASS_PREMIUM = false;

function checkPremiumAccess(mode) {
    // Debug bypass
    if (DEBUG_BYPASS_PREMIUM) return true;

    // Check if user has premium access
    if (typeof PathfindrAuth !== 'undefined') {
        // Admin users always have access
        if (typeof PathfindrConfig !== 'undefined' && PathfindrConfig.isAdmin()) {
            return true;
        }
        // Purchased users have access
        if (PathfindrAuth.hasPurchased()) {
            return true;
        }
    }
    return false;
}

async function showPremiumRequired(modeName) {
    // Create and show premium prompt modal
    const existingModal = document.getElementById('premium-prompt-modal');
    if (existingModal) existingModal.remove();

    const modal = document.createElement('div');
    modal.id = 'premium-prompt-modal';
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="premium-prompt-content">
            <div class="premium-prompt-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
            </div>
            <h2>Unlock ${modeName} Mode</h2>
            <div class="premium-features-list">
                <div class="premium-feature"><span class="feature-check">✓</span> Ad-free experience</div>
                <div class="premium-feature"><span class="feature-check">✓</span> Explorer & Visualizer modes</div>
                <div class="premium-feature"><span class="feature-check">✓</span> Search any location in Classic</div>
                <div class="premium-feature"><span class="feature-check">✓</span> One-time payment</div>
            </div>
            <div class="premium-price">$2 <span>one-time purchase</span></div>
            <div class="premium-prompt-buttons">
                <button id="premium-buy-btn" class="btn btn-primary">Go Pro</button>
                <button id="premium-cancel-btn" class="btn btn-secondary">Maybe Later</button>
            </div>
            ${typeof PathfindrAuth !== 'undefined' && !PathfindrAuth.isLoggedIn() ?
              '<p class="premium-login-hint">Already Pro? <a href="#" id="premium-login-link">Sign in</a> to restore.</p>' :
              '<p class="premium-restore-hint"><a href="#" id="premium-restore-link">Restore purchases</a></p>'}
        </div>
    `;

    // Add styles if not present
    if (!document.getElementById('premium-prompt-styles')) {
        const styles = document.createElement('style');
        styles.id = 'premium-prompt-styles';
        styles.textContent = `
            #premium-prompt-modal {
                position: fixed;
                inset: 0;
                background: rgba(0, 0, 0, 0.9);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 10000;
                animation: fadeIn 0.3s ease;
            }
            .premium-prompt-content {
                background: linear-gradient(135deg, var(--deep) 0%, var(--surface) 100%);
                border: 1px solid var(--neon-cyan);
                border-radius: var(--radius-lg);
                padding: 2rem;
                max-width: 400px;
                width: 90%;
                text-align: center;
                box-shadow: var(--glow-cyan);
            }
            .premium-prompt-icon svg {
                width: 48px;
                height: 48px;
                stroke: var(--sunset-gold);
                filter: drop-shadow(0 0 10px rgba(255, 216, 102, 0.5));
            }
            .premium-prompt-content h2 {
                font-family: var(--font-display);
                color: var(--text-bright);
                margin: 1rem 0 1rem;
            }
            .premium-features-list {
                text-align: left;
                margin: 0 auto 1.25rem;
                max-width: 260px;
            }
            .premium-feature {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                padding: 0.35rem 0;
                color: var(--text-dim);
                font-size: 0.9rem;
            }
            .premium-feature .feature-check {
                color: var(--neon-cyan);
                font-weight: bold;
            }
            .premium-price {
                font-size: 1.5rem;
                font-weight: bold;
                color: var(--neon-cyan);
                margin-bottom: 1.5rem;
            }
            .premium-price span {
                font-size: 0.8rem;
                font-weight: normal;
                color: var(--text-muted);
            }
            .premium-prompt-buttons {
                display: flex;
                gap: 1rem;
                justify-content: center;
                margin-bottom: 1rem;
            }
            .premium-prompt-buttons .btn {
                flex: 1;
                max-width: 150px;
            }
            .premium-login-hint,
            .premium-restore-hint {
                font-size: 0.8rem;
                color: var(--text-muted);
            }
            .premium-login-hint a,
            .premium-restore-hint a {
                color: var(--neon-cyan);
                text-decoration: underline;
            }
        `;
        document.head.appendChild(styles);
    }

    document.body.appendChild(modal);

    // Event handlers
    document.getElementById('premium-buy-btn').addEventListener('click', async () => {
        modal.remove();
        // Check if logged in
        if (typeof PathfindrAuth !== 'undefined' && !PathfindrAuth.isLoggedIn()) {
            // Show auth modal first
            const authModal = document.getElementById('auth-modal');
            if (authModal) authModal.classList.remove('hidden');
            return;
        }
        // Trigger purchase
        if (typeof PathfindrPayments !== 'undefined') {
            const result = await PathfindrPayments.showPurchasePrompt();
            if (result.success) {
                // Refresh premium status and retry action
                alert('Thank you! You are now Pro. Enjoy!');
            }
        }
    });

    document.getElementById('premium-cancel-btn').addEventListener('click', () => {
        modal.remove();
    });

    const loginLink = document.getElementById('premium-login-link');
    if (loginLink) {
        loginLink.addEventListener('click', (e) => {
            e.preventDefault();
            modal.remove();
            const authModal = document.getElementById('auth-modal');
            if (authModal) authModal.classList.remove('hidden');
        });
    }

    const restoreLink = document.getElementById('premium-restore-link');
    if (restoreLink) {
        restoreLink.addEventListener('click', async (e) => {
            e.preventDefault();
            if (typeof PathfindrPayments !== 'undefined') {
                const result = await PathfindrPayments.restorePurchases();
                if (result.isPremium) {
                    modal.remove();
                    alert('Purchases restored! You are now Pro.');
                } else {
                    alert('No previous purchases found.');
                }
            }
        });
    }

    // Close on background click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.remove();
    });
}

function selectGameMode(mode) {
    // Check premium access for explorer and visualizer modes
    if ((mode === 'explorer' || mode === 'visualizer')) {
        if (!checkPremiumAccess(mode)) {
            showPremiumRequired(mode === 'explorer' ? 'Explorer' : 'Visualizer');
            // Analytics: Track premium modal view
            if (typeof PathfindrAnalytics !== 'undefined') {
                PathfindrAnalytics.trackPremiumViewed();
            }
            return;
        }
    }

    GameState.gameMode = mode;
    hideModeSelector();
    updateSearchProBadge();

    // Analytics: Track mode selection
    if (typeof PathfindrAnalytics !== 'undefined') {
        PathfindrAnalytics.trackModeSelected(mode);
    }

    if (mode === 'visualizer') {
        // Visualizer picks random cities automatically
        startVisualizerMode();
    } else if (mode === 'competitive') {
        // Enable continuous play for competitive mode
        enableContinuousPlay();
        showLocationSelector();
    } else {
        // Explorer mode
        disableContinuousPlay();
        showLocationSelector();
    }
}

// =============================================================================
// VISUALIZER MODE
// =============================================================================

function initVisualizerUI() {
    // Old visualizer exit button (keeping for backwards compatibility)
    const exitBtn = document.getElementById('visualizer-exit-btn');
    if (exitBtn) {
        exitBtn.addEventListener('click', stopVisualizerMode);
    }

    // New unified mode exit button in HUD
    const modeExitBtn = document.getElementById('mode-exit-btn');
    if (modeExitBtn) {
        modeExitBtn.addEventListener('click', () => {
            if (GameState.visualizerState.active) {
                stopVisualizerMode();
            } else if (GameState.gameMode === 'explorer') {
                stopExplorerMode();
            }
        });
    }

    // Fullscreen button
    const fullscreenBtn = document.getElementById('fullscreen-btn');
    if (fullscreenBtn) {
        fullscreenBtn.addEventListener('click', enterFullscreenMode);
    }

    // Initialize location search
    initLocationSearch();
}

// =============================================================================
// LOCATION SEARCH - Now handled by inline search (click location display)
// Legacy functions kept as no-ops for compatibility
// =============================================================================

function initLocationSearch() {
    // Legacy - search now handled by initInlineLocationSearch()
}

// Legacy no-op functions (search now integrated into location display)
function showLocationSearch() {}
function hideLocationSearch() {}

async function navigateToCity(city) {
    console.log('Navigating to:', city.name);

    // Update current city
    GameState.currentCity = {
        name: `${city.name}${city.country ? ', ' + city.country : ''}`,
        lat: city.lat,
        lng: city.lng,
        zoom: 15
    };

    // Update location display
    const locationEl = document.getElementById('current-location');
    if (locationEl) locationEl.textContent = GameState.currentCity.name;

    // Show loading with map transition (transition handles the map view)
    showLoading('Discovering routes...', false, GameState.currentCity);

    // Clear existing visualization
    clearVisualization();
    VisualizerHistory.clear();

    try {
        await loadRoadNetwork(GameState.currentCity);

        // Start facts ticker for new city
        CityFacts.startTicker(city.name);

        // If in visualizer mode, restart the loop
        if (GameState.visualizerState.active) {
            GameState.visualizerState.currentVisualization = 0;
            updateModeStats(1, GameState.visualizerState.maxPerCity);
            runVisualizerLoop();
        }
    } catch (error) {
        console.error('Failed to load city:', error);
    }
}

// =============================================================================
// INLINE LOCATION SEARCH - Click location to search in any mode
// =============================================================================

function initInlineLocationSearch() {
    const locationDisplay = document.getElementById('location-display');
    const searchInline = document.getElementById('location-search-inline');
    const searchInput = document.getElementById('inline-location-search');
    const closeBtn = document.getElementById('close-search-btn');
    const hudLocation = document.getElementById('hud-location');

    if (!locationDisplay || !searchInline || !searchInput) return;

    // Check if mobile (matches CSS media query)
    const isMobile = () => window.innerWidth <= 600;

    // Create results dropdown container
    let resultsEl = document.getElementById('inline-search-results');
    if (!resultsEl) {
        resultsEl = document.createElement('div');
        resultsEl.id = 'inline-search-results';
        resultsEl.className = 'inline-search-results hidden';
        // On mobile, append to body for fixed positioning; on desktop, append to hudLocation
        if (isMobile()) {
            document.body.appendChild(resultsEl);
        } else {
            hudLocation.style.position = 'relative';
            hudLocation.appendChild(resultsEl);
        }
    }

    // Click location to show search
    locationDisplay.addEventListener('click', async () => {
        // In Classic (competitive) mode, search is premium-only
        if (GameState.gameMode === 'competitive') {
            const isPremium = typeof PathfindrConfig !== 'undefined' && PathfindrConfig.isAdFree();
            if (!isPremium) {
                // Show purchase prompt instead
                if (typeof PathfindrPayments !== 'undefined') {
                    await PathfindrPayments.showPurchasePrompt();
                }
                return;
            }
        }

        locationDisplay.classList.add('hidden');
        searchInline.classList.remove('hidden');
        // Small delay to ensure display:flex is applied before focusing
        setTimeout(() => searchInput.focus(), 50);
    });

    // Close search
    const closeSearch = () => {
        searchInline.classList.add('hidden');
        locationDisplay.classList.remove('hidden');
        searchInput.value = '';
        resultsEl.classList.add('hidden');
        resultsEl.innerHTML = '';
    };

    closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        closeSearch();
    });

    // Search on input with debounce
    let debounceTimer = null;
    searchInput.addEventListener('input', (e) => {
        clearTimeout(debounceTimer);
        const query = e.target.value.trim();

        if (query.length < 2) {
            resultsEl.classList.add('hidden');
            return;
        }

        debounceTimer = setTimeout(async () => {
            try {
                const response = await fetch(
                    `${PathfindrConfig.supabase.url}/rest/v1/cities?name=ilike.*${encodeURIComponent(query)}*&limit=6&order=population.desc.nullslast`,
                    {
                        headers: {
                            'apikey': PathfindrConfig.supabase.anonKey,
                            'Authorization': `Bearer ${PathfindrConfig.supabase.anonKey}`,
                        }
                    }
                );

                if (!response.ok) throw new Error('Search failed');
                const cities = await response.json();

                if (cities.length === 0) {
                    resultsEl.innerHTML = '<div class="inline-search-result" style="color: var(--text-muted);">No cities found</div>';
                } else {
                    resultsEl.innerHTML = cities.map(city => `
                        <div class="inline-search-result" data-lat="${city.lat}" data-lng="${city.lng}" data-name="${city.name}" data-country="${city.country || ''}">
                            ${city.name}${city.country ? ', ' + city.country : ''}
                        </div>
                    `).join('');

                    // Add click handlers
                    resultsEl.querySelectorAll('.inline-search-result').forEach(item => {
                        item.addEventListener('click', () => {
                            const lat = parseFloat(item.dataset.lat);
                            const lng = parseFloat(item.dataset.lng);
                            const name = item.dataset.name;
                            const country = item.dataset.country;

                            navigateToCity({ name, lat, lng, country });
                            closeSearch();
                        });
                    });
                }

                resultsEl.classList.remove('hidden');
            } catch (error) {
                console.error('Inline search error:', error);
                resultsEl.innerHTML = '<div class="inline-search-result" style="color: var(--text-muted);">Search error</div>';
                resultsEl.classList.remove('hidden');
            }
        }, 300);
    });

    // Escape to close
    searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeSearch();
        } else if (e.key === 'Enter') {
            // Select first result if available
            const firstResult = resultsEl.querySelector('.inline-search-result[data-lat]');
            if (firstResult) {
                firstResult.click();
            }
        }
    });

    // Close when clicking outside (but not on the search itself)
    document.addEventListener('click', (e) => {
        const clickedOnSearch = e.target.closest('#location-search-inline') ||
                                e.target.closest('#inline-search-results') ||
                                e.target.closest('#location-display');
        if (!clickedOnSearch && !searchInline.classList.contains('hidden')) {
            closeSearch();
        }
    });
}

// =============================================================================
// CUSTOM CURSOR - Web version aesthetic cursor (animated, marker-style)
// =============================================================================

function initCustomCursor() {
    // Only apply on web, not native apps
    if (PathfindrConfig.platform !== 'web') return;

    // Create custom cursor element - animated, like the start/end markers
    const cursor = document.createElement('div');
    cursor.id = 'custom-cursor';
    cursor.innerHTML = `
        <div class="cursor-outer"></div>
        <div class="cursor-ring"></div>
        <div class="cursor-rotating">
            <div class="cursor-dot"></div>
            <div class="cursor-dot"></div>
            <div class="cursor-dot"></div>
        </div>
        <div class="cursor-center"></div>
    `;
    document.body.appendChild(cursor);

    // Create styles for the animated cursor
    const style = document.createElement('style');
    style.id = 'custom-cursor-style';
    style.textContent = `
        /* Hide default cursor on game areas */
        #map,
        #pathCanvas,
        #roadCanvas,
        .maplibregl-map {
            cursor: none !important;
        }

        /* Custom animated cursor */
        #custom-cursor {
            position: fixed;
            pointer-events: none;
            z-index: 99999;
            width: 28px;
            height: 28px;
            transform: translate(-50%, -50%);
            opacity: 0;
            transition: opacity 0.15s ease;
        }

        #custom-cursor.visible {
            opacity: 1;
        }

        /* Outer glow ring */
        .cursor-outer {
            position: absolute;
            top: 50%;
            left: 50%;
            width: 26px;
            height: 26px;
            border-radius: 50%;
            border: 2px solid rgba(255, 255, 255, 0.15);
            transform: translate(-50%, -50%);
            box-shadow: 0 0 12px rgba(255, 107, 157, 0.3);
        }

        /* Main white ring */
        .cursor-ring {
            position: absolute;
            top: 50%;
            left: 50%;
            width: 18px;
            height: 18px;
            border-radius: 50%;
            border: 2px solid rgba(255, 255, 255, 0.9);
            transform: translate(-50%, -50%);
            box-shadow: 0 0 6px rgba(255, 255, 255, 0.5);
        }

        /* Rotating pink element */
        .cursor-rotating {
            position: absolute;
            top: 50%;
            left: 50%;
            width: 22px;
            height: 22px;
            transform: translate(-50%, -50%);
            animation: cursor-rotate 3s linear infinite;
        }

        @keyframes cursor-rotate {
            from { transform: translate(-50%, -50%) rotate(0deg); }
            to { transform: translate(-50%, -50%) rotate(360deg); }
        }

        .cursor-dot {
            position: absolute;
            width: 4px;
            height: 4px;
            background: #ff6b9d;
            border-radius: 50%;
            box-shadow: 0 0 6px #ff6b9d, 0 0 10px rgba(255, 107, 157, 0.6);
        }

        .cursor-dot:nth-child(1) {
            top: 0;
            left: 50%;
            transform: translateX(-50%);
        }

        .cursor-dot:nth-child(2) {
            bottom: 3px;
            left: 3px;
        }

        .cursor-dot:nth-child(3) {
            bottom: 3px;
            right: 3px;
        }

        /* Center dot */
        .cursor-center {
            position: absolute;
            top: 50%;
            left: 50%;
            width: 4px;
            height: 4px;
            background: white;
            border-radius: 50%;
            transform: translate(-50%, -50%);
            box-shadow: 0 0 4px white;
        }

        /* Pointer cursor for interactive elements */
        .btn,
        .speed-btn,
        .replay-btn,
        .location-option,
        .mode-option,
        .location-display,
        .inline-search-result,
        .search-result-item,
        a,
        button,
        [role="button"] {
            cursor: pointer !important;
        }

        /* Text cursor for inputs */
        input,
        textarea {
            cursor: text !important;
        }
    `;
    document.head.appendChild(style);

    // Track mouse position
    let cursorVisible = false;
    const gameAreas = ['map', 'pathCanvas', 'roadCanvas'];

    document.addEventListener('mousemove', (e) => {
        cursor.style.left = e.clientX + 'px';
        cursor.style.top = e.clientY + 'px';

        // Check if hovering over game area
        const target = e.target;
        const isOverGameArea = gameAreas.some(id => {
            const el = document.getElementById(id);
            return el && (el === target || el.contains(target));
        }) || target.closest('.maplibregl-map');

        if (isOverGameArea && !cursorVisible) {
            cursor.classList.add('visible');
            cursorVisible = true;
        } else if (!isOverGameArea && cursorVisible) {
            cursor.classList.remove('visible');
            cursorVisible = false;
        }
    });

    // Hide cursor when leaving window
    document.addEventListener('mouseleave', () => {
        cursor.classList.remove('visible');
        cursorVisible = false;
    });

    console.log('[UI] Animated custom cursor initialized for web');
}

// =============================================================================
// FULLSCREEN MODE - Immersive visualization viewing
// =============================================================================

const FullscreenMode = {
    active: false,
    mouseMoveHandler: null,
    hintElement: null,

    enter() {
        if (this.active) return;
        this.active = true;

        // Add fullscreen class to body
        document.body.classList.add('fullscreen-mode');

        // Show hint
        this.showHint();

        // Set up mouse movement listener (with small delay to prevent immediate exit)
        setTimeout(() => {
            this.mouseMoveHandler = () => this.exit();
            document.addEventListener('mousemove', this.mouseMoveHandler, { once: true });
        }, 500);
    },

    exit() {
        if (!this.active) return;
        this.active = false;

        // Remove fullscreen class
        document.body.classList.remove('fullscreen-mode');

        // Remove hint if still present
        if (this.hintElement) {
            this.hintElement.remove();
            this.hintElement = null;
        }

        // Clean up listener if still attached
        if (this.mouseMoveHandler) {
            document.removeEventListener('mousemove', this.mouseMoveHandler);
            this.mouseMoveHandler = null;
        }
    },

    showHint() {
        // Create hint element
        this.hintElement = document.createElement('div');
        this.hintElement.className = 'fullscreen-exit-hint';
        this.hintElement.innerHTML = 'Fullscreen Mode<span>MOVE MOUSE TO EXIT</span>';
        document.body.appendChild(this.hintElement);

        // Remove hint after animation
        setTimeout(() => {
            if (this.hintElement) {
                this.hintElement.remove();
                this.hintElement = null;
            }
        }, 3000);
    }
};

function enterFullscreenMode() {
    FullscreenMode.enter();
}

function exitFullscreenMode() {
    FullscreenMode.exit();
}

// =============================================================================
// HUD MODE MANAGEMENT
// =============================================================================

/**
 * Set HUD to display a specific mode (visualizer, explorer, or competitive)
 * Uses body class for CSS-based hiding of extra stats
 * @param {string} mode - 'visualizer', 'explorer', or 'competitive'
 */
function setHUDMode(mode) {
    const modeSection = document.getElementById('hud-mode-section');
    const modeBadge = document.getElementById('hud-mode-badge');
    const modeExitBtn = document.getElementById('mode-exit-btn');
    const fullscreenBtn = document.getElementById('fullscreen-btn');
    const competitiveControls = document.querySelectorAll('.competitive-control');
    const primaryLabel = document.getElementById('stat-primary-label');

    // Remove all mode classes from body, add new one
    document.body.classList.remove('mode-competitive', 'mode-visualizer', 'mode-explorer');
    document.body.classList.add(`mode-${mode}`);

    if (mode === 'competitive') {
        // Hide mode badge, show competitive controls, show fullscreen button
        if (modeSection) modeSection.classList.add('hidden');
        if (modeExitBtn) modeExitBtn.classList.add('hidden');
        if (fullscreenBtn) fullscreenBtn.classList.remove('hidden'); // Show fullscreen for ALL modes
        competitiveControls.forEach(el => el.classList.remove('hidden'));

        // Set primary stat label to "Round"
        if (primaryLabel) primaryLabel.textContent = 'Round';
    } else {
        // Show mode badge, hide competitive controls
        if (modeSection) modeSection.classList.remove('hidden');
        if (modeExitBtn) modeExitBtn.classList.remove('hidden');
        if (fullscreenBtn) fullscreenBtn.classList.remove('hidden');
        competitiveControls.forEach(el => el.classList.add('hidden'));

        // Set badge style and text
        if (modeBadge) {
            modeBadge.classList.remove('visualizer', 'explorer');
            modeBadge.classList.add(mode);
            modeBadge.textContent = mode.toUpperCase();
        }

        // Set primary stat label to "Pathfind"
        if (primaryLabel) primaryLabel.textContent = 'Pathfind';
    }
}

/**
 * Update the unified stats display
 * @param {number} current - Current round/pathfind number
 * @param {number} total - Total rounds/pathfinds
 * @param {string} label - Optional label override
 */
function updateModeStats(current, total, label = null) {
    const labelEl = document.getElementById('stat-primary-label');
    const currentEl = document.getElementById('stat-primary-value');
    const totalEl = document.getElementById('stat-primary-total');

    if (label && labelEl) labelEl.textContent = label;
    if (currentEl) currentEl.textContent = current;
    if (totalEl) totalEl.textContent = total;
}

// =============================================================================
// FULLSCREEN API - True immersive fullscreen for Visualizer mode
// =============================================================================

/**
 * Request true fullscreen mode (hides browser chrome like Netflix/YouTube)
 */
function requestVisualizerFullscreen() {
    const elem = document.documentElement;

    // Check if fullscreen is supported and we're not already in fullscreen
    if (document.fullscreenEnabled && !document.fullscreenElement) {
        elem.requestFullscreen().catch(err => {
            console.log('[Fullscreen] Could not enter fullscreen:', err.message);
        });
    } else if (elem.webkitRequestFullscreen) {
        // Safari fallback
        elem.webkitRequestFullscreen();
    } else if (elem.msRequestFullscreen) {
        // IE/Edge fallback
        elem.msRequestFullscreen();
    }
}

/**
 * Exit fullscreen mode
 */
function exitVisualizerFullscreen() {
    if (document.fullscreenElement) {
        document.exitFullscreen().catch(err => {
            console.log('[Fullscreen] Could not exit fullscreen:', err.message);
        });
    } else if (document.webkitFullscreenElement) {
        document.webkitExitFullscreen();
    } else if (document.msFullscreenElement) {
        document.msExitFullscreen();
    }
}

// Handle ESC key exiting fullscreen - also stop visualizer
document.addEventListener('fullscreenchange', () => {
    // If we exited fullscreen while visualizer is active, stop visualizer
    if (!document.fullscreenElement && GameState.visualizerState?.active) {
        // User pressed ESC to exit fullscreen - also stop visualizer mode
        stopVisualizerMode();
    }
});

function startVisualizerMode() {
    GameState.visualizerState.active = true;
    GameState.visualizerState.currentVisualization = 0;

    // Request true fullscreen (like Netflix/YouTube)
    requestVisualizerFullscreen();

    // Switch HUD to visualizer mode
    setHUDMode('visualizer');

    // Show location search bar
    showLocationSearch();

    // Pick a random city and start
    const city = getRandomCity(Math.random() > 0.5 ? 'global' : 'us');
    GameState.currentCity = city;

    // Update location and stats
    const locationEl = document.getElementById('current-location');
    if (locationEl) locationEl.textContent = city.name;
    updateModeStats(1, GameState.visualizerState.maxPerCity);

    // Load road network and start the loop
    GameController.enterPhase(GamePhase.LOADING);
    document.getElementById('loading-overlay').classList.remove('hidden');
    document.getElementById('loading-text').textContent = 'Loading visualizer...';

    GameState.map.jumpTo({ center: [city.lng, city.lat], zoom: city.zoom || 15 });
    loadRoadNetwork(city).then(() => {
        // Start unified animation loop (replaces AmbientViz.start())
        GameController.startLoop();
        // Start facts ticker for visualizer mode
        CityFacts.startTicker(city.name);
        // Enter IDLE phase, then start visualizer loop
        GameController.enterPhase(GamePhase.IDLE);
        runVisualizerLoop();
    });
}

function updateVisualizerUI(cityName, count) {
    // Update location in main HUD
    const locationEl = document.getElementById('current-location');
    if (locationEl) locationEl.textContent = cityName;

    // Update mode stats counter
    updateModeStats(count, GameState.visualizerState.maxPerCity);
}

async function runVisualizerLoop() {
    // Use GameController for clean exit checking (fixes race condition)
    if (!GameState.visualizerState.active || !GameController.shouldContinue(GamePhase.IDLE)) {
        return;
    }

    // Pick random start/end points
    selectRandomEndpoints();

    GameState.visualizerState.currentVisualization++;
    updateVisualizerUI(
        GameState.currentCity?.name || 'Unknown',
        GameState.visualizerState.currentVisualization
    );

    // Run the A* visualization
    await runVisualizerAStar();

    // Check again after async operation (user might have exited during viz)
    if (!GameState.visualizerState.active) return;

    // Check if we should load a new city
    if (GameState.visualizerState.currentVisualization >= GameState.visualizerState.maxPerCity) {
        GameState.visualizerState.currentVisualization = 0;
        await loadNextVisualizerCity();
    }

    // Check AGAIN after potential city load (user might have exited)
    if (!GameState.visualizerState.active) return;

    // Return to IDLE phase after visualization completes
    GameController.enterPhase(GamePhase.IDLE);

    // Continue the loop after a delay
    GameState.visualizerState.loopTimeout = setTimeout(
        runVisualizerLoop,
        GameState.visualizerState.delayBetweenRuns
    );
}

async function runVisualizerAStar() {
    // VISUALIZER MODE: Clear history before each run - show only ONE visualization at a time
    VisualizerHistory.clear();

    // Clear previous visualization state
    clearVisualizationState();

    // Enter VISUALIZING phase (enables viz rendering in GameController loop)
    GameController.enterPhase(GamePhase.VISUALIZING);

    // Run A* and visualize
    const result = runAStar(GameState.startNode, GameState.endNode);

    if (result.path.length > 0) {
        // Run the epic visualization (it's async)
        await runEpicVisualization(result.explored, result.path);

        // Add to history for living network effect
        const exploredEdgeKeys = Array.from(GameState.vizState.edgeHeat.keys());
        VisualizerHistory.addPath(exploredEdgeKeys, result.path);
    }

    // Exit VISUALIZING phase (GameController cleans up vizState.active)
    // Phase transition happens in runVisualizerLoop after this returns
}

async function loadNextVisualizerCity() {
    if (!GameState.visualizerState.active) return;

    // Clear current visualization and history for new city
    clearVisualization();
    VisualizerHistory.clear();

    // Remove markers
    if (GameState.startMarker) {
        GameState.map.removeLayer(GameState.startMarker);
        GameState.startMarker = null;
    }
    if (GameState.endMarker) {
        GameState.map.removeLayer(GameState.endMarker);
        GameState.endMarker = null;
    }

    // Pick a new random city
    const city = getRandomCity(Math.random() > 0.5 ? 'global' : 'us');
    GameState.currentCity = city;

    updateVisualizerUI(city.name, 1);

    // Update facts ticker for new city
    CityFacts.updateTickerCity(city.name);

    // Show loading briefly
    document.getElementById('loading-overlay').classList.remove('hidden');
    document.getElementById('loading-text').textContent = `Loading ${city.name}...`;

    // Pan to new city and load road network
    GameState.map.jumpTo({ center: [city.lng, city.lat], zoom: city.zoom || 15 });
    await loadRoadNetwork(city);
}

function stopVisualizerMode() {
    // Mark visualizer as inactive FIRST (stops loop callbacks)
    GameState.visualizerState.active = false;

    // Exit fullscreen if we're in it
    exitVisualizerFullscreen();

    // Clear any pending timeout (prevents stale callbacks)
    if (GameState.visualizerState.loopTimeout) {
        clearTimeout(GameState.visualizerState.loopTimeout);
        GameState.visualizerState.loopTimeout = null;
    }

    // Use GameController to cleanly exit VISUALIZING phase (if active)
    // This handles vizState.active cleanup automatically
    GameController.enterPhase(GamePhase.MENU);

    // Hide location search bar
    hideLocationSearch();

    // Stop facts ticker
    CityFacts.stopTicker();

    // Fade out sounds smoothly
    if (typeof SoundEngine !== 'undefined') {
        SoundEngine.fadeOutScanning(400);
        SoundEngine.fadeOutSoundtrack(800);
    }

    // Reset state
    GameState.visualizerState.currentVisualization = 0;

    // Reset HUD to competitive mode
    setHUDMode('competitive');

    // Clear visualization and history
    clearVisualization();
    VisualizerHistory.clear();

    // Remove markers (DOM-based)
    if (GameState.startMarker) {
        GameState.map.removeLayer(GameState.startMarker);
        GameState.startMarker = null;
    }
    if (GameState.endMarker) {
        GameState.map.removeLayer(GameState.endMarker);
        GameState.endMarker = null;
    }
    if (GameState.startMarkerEl) {
        GameState.startMarkerEl.remove();
        GameState.startMarkerEl = null;
    }
    if (GameState.endMarkerEl) {
        GameState.endMarkerEl.remove();
        GameState.endMarkerEl = null;
    }

    // Return to mode selector
    GameState.gameMode = 'competitive';
    showModeSelector();
}

// =============================================================================
// EXPLORER MODE
// =============================================================================

function initExplorerUI() {
    const challengeBtn = document.getElementById('explorer-challenge-btn');
    const showRouteBtn = document.getElementById('explorer-show-route-btn');
    const resetBtn = document.getElementById('explorer-reset-btn');
    const exitBtn = document.getElementById('explorer-exit-btn');

    if (challengeBtn) {
        challengeBtn.addEventListener('click', startExplorerChallenge);
    }
    if (showRouteBtn) {
        showRouteBtn.addEventListener('click', explorerShowRoute);
    }
    if (resetBtn) {
        resetBtn.addEventListener('click', resetExplorer);
    }
    if (exitBtn) {
        exitBtn.addEventListener('click', stopExplorerMode);
    }

    // Context menu event listeners
    document.querySelectorAll('.context-option').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const action = btn.dataset.action;
            handleContextMenuAction(action);
        });
    });

    // Click outside to dismiss context menu (with debounce to prevent immediate close)
    document.addEventListener('mousedown', (e) => {
        const menu = document.getElementById('explorer-context-menu');
        if (!menu || menu.classList.contains('hidden')) return;

        // Check if click is inside the menu
        if (menu.contains(e.target)) return;

        // Check if menu was just shown (within 200ms)
        const showTime = menu.dataset.showTime;
        if (showTime && (Date.now() - parseInt(showTime)) < 200) return;

        hideExplorerContextMenu();
    });

    // Keyboard shortcuts for context menu
    document.addEventListener('keydown', (e) => {
        const menu = document.getElementById('explorer-context-menu');
        if (menu && !menu.classList.contains('hidden')) {
            if (e.key === 's' || e.key === 'S') {
                e.preventDefault();
                handleContextMenuAction('start');
            } else if (e.key === 'e' || e.key === 'E') {
                e.preventDefault();
                handleContextMenuAction('end');
            } else if (e.key === 'Escape') {
                hideExplorerContextMenu();
            }
        }
    });
}

function startExplorerMode() {
    GameState.gameMode = 'explorer';
    GameState.explorerState = {
        placingStart: false,
        placingEnd: false,
        customStart: null,
        customEnd: null,
        pendingNode: null,
        pendingLatLng: null,
    };

    // Switch HUD to explorer mode
    setHUDMode('explorer');

    // Show location search bar
    showLocationSearch();

    // Start unified animation loop and enter IDLE phase (waiting for user to place markers)
    GameController.startLoop();
    GameController.enterPhase(GamePhase.IDLE);

    // Initialize AmbientViz particles (loop handled by GameController)
    AmbientViz.start();

    // Enable map clicking for marker placement
    GameState.map.on('click', handleExplorerMapClick);

    // Start facts ticker for explorer mode
    CityFacts.startTicker(GameState.currentCity?.name);

    updateExplorerButtons();
}

function setExplorerPlacingMode(mode) {
    const startBtn = document.getElementById('place-start-btn');
    const endBtn = document.getElementById('place-end-btn');

    // Toggle the mode
    if (mode === 'start') {
        GameState.explorerState.placingStart = !GameState.explorerState.placingStart;
        GameState.explorerState.placingEnd = false;
    } else {
        GameState.explorerState.placingEnd = !GameState.explorerState.placingEnd;
        GameState.explorerState.placingStart = false;
    }

    // Update button states
    if (startBtn) {
        startBtn.classList.toggle('active', GameState.explorerState.placingStart);
    }
    if (endBtn) {
        endBtn.classList.toggle('active', GameState.explorerState.placingEnd);
    }

    // Update cursor
    const mapContainer = document.getElementById('map-container');
    if (mapContainer) {
        if (GameState.explorerState.placingStart || GameState.explorerState.placingEnd) {
            mapContainer.style.cursor = 'crosshair';
        } else {
            mapContainer.style.cursor = '';
        }
    }
}

function handleExplorerMapClick(e) {
    if (GameState.gameMode !== 'explorer') return;

    // MapLibre uses e.lngLat instead of e.latlng
    const { lat, lng } = e.lngLat;
    const nearestNode = findNearestNode(lat, lng);

    if (nearestNode === null) return;

    const nodePos = GameState.nodes.get(nearestNode);
    if (!nodePos) return;

    // Store pending location for context menu
    GameState.explorerState.pendingNode = nearestNode;
    GameState.explorerState.pendingLatLng = { lat: nodePos.lat, lng: nodePos.lng };

    // Get viewport position for context menu
    // Use the original event's screen position for accurate placement
    const originalEvent = e.originalEvent;
    const screenX = originalEvent?.clientX ?? originalEvent?.touches?.[0]?.clientX ?? 0;
    const screenY = originalEvent?.clientY ?? originalEvent?.touches?.[0]?.clientY ?? 0;

    // Show context menu at tap position
    showExplorerContextMenu(screenX, screenY, nodePos.lat, nodePos.lng);
}

function showExplorerContextMenu(x, y, lat, lng) {
    const menu = document.getElementById('explorer-context-menu');

    if (!menu) return;

    // Update actions section visibility based on whether both markers are placed
    const actionsSection = document.getElementById('context-actions');
    const hasStart = GameState.explorerState.customStart !== null;
    const hasEnd = GameState.explorerState.customEnd !== null;
    const hasBoth = hasStart && hasEnd;

    if (actionsSection) {
        actionsSection.style.display = hasBoth ? 'flex' : 'none';
    }

    // Position menu at tap location
    // CSS transform handles centering and positioning above the point
    const viewportWidth = window.innerWidth;
    const menuWidth = 160;

    // Clamp horizontal position so menu stays on screen
    let posX = Math.max(menuWidth / 2 + 10, Math.min(x, viewportWidth - menuWidth / 2 - 10));

    // If tap is too close to top, show below instead
    const showBelow = y < 120;

    menu.style.left = `${posX}px`;
    menu.style.top = `${y}px`;

    // Toggle transform direction based on vertical position
    if (showBelow) {
        menu.style.transform = 'translate(-50%, 10px)';
    } else {
        menu.style.transform = 'translate(-50%, -100%) translateY(-10px)';
    }

    // Track when menu was shown (for click-outside debounce)
    menu.dataset.showTime = Date.now().toString();

    // Show with animation
    menu.classList.remove('hidden');
    menu.classList.add('visible');
}

function hideExplorerContextMenu() {
    const menu = document.getElementById('explorer-context-menu');
    if (menu) {
        menu.classList.remove('visible');
        menu.classList.add('hidden');
    }
}

function handleContextMenuAction(action) {
    hideExplorerContextMenu();

    // Handle marker placement actions
    if (action === 'start' || action === 'end') {
        const nodeId = GameState.explorerState.pendingNode;
        const latlng = GameState.explorerState.pendingLatLng;

        if (!nodeId || !latlng) return;

        placeExplorerMarker(action, nodeId, latlng);

        // Clear pending
        GameState.explorerState.pendingNode = null;
        GameState.explorerState.pendingLatLng = null;
        return;
    }

    // Handle other actions
    switch (action) {
        case 'challenge':
            startExplorerChallenge();
            break;
        case 'showroute':
            explorerShowRoute();
            break;
        case 'clearpaths':
            clearExplorerPaths();
            break;
        case 'reset':
            resetExplorer();
            break;
        case 'exit':
            stopExplorerMode();
            break;
    }
}

function clearExplorerPaths() {
    // Clear the persistent path history
    ExplorerHistory.clear();
    // Also clear current visualization
    clearVisualization();
    console.log('[Explorer] Cleared all path history');
}

function placeExplorerMarker(type, nodeId, nodePos) {
    const markerContainer = document.getElementById('marker-container');
    if (!markerContainer) return;

    if (type === 'start') {
        // Remove old start marker (DOM element)
        if (GameState.startMarkerEl) {
            GameState.startMarkerEl.remove();
        }
        // Also remove legacy marker reference if exists
        if (GameState.startMarker) {
            GameState.map.removeLayer(GameState.startMarker);
            GameState.startMarker = null;
        }

        GameState.startNode = nodeId;
        GameState.explorerState.customStart = nodeId;

        // Create DOM marker (same as competitive mode)
        const marker = document.createElement('div');
        marker.className = 'custom-marker start-marker';
        marker.textContent = 'S';
        markerContainer.appendChild(marker);

        GameState.startMarkerEl = marker;
        GameState.startMarkerLatLng = { lat: nodePos.lat, lng: nodePos.lng };

    } else {
        // Remove old end marker (DOM element)
        if (GameState.endMarkerEl) {
            GameState.endMarkerEl.remove();
        }
        // Also remove legacy marker reference if exists
        if (GameState.endMarker) {
            GameState.map.removeLayer(GameState.endMarker);
            GameState.endMarker = null;
        }

        GameState.endNode = nodeId;
        GameState.explorerState.customEnd = nodeId;

        // Create DOM marker (same as competitive mode)
        const marker = document.createElement('div');
        marker.className = 'custom-marker end-marker';
        marker.textContent = 'E';
        markerContainer.appendChild(marker);

        GameState.endMarkerEl = marker;
        GameState.endMarkerLatLng = { lat: nodePos.lat, lng: nodePos.lng };
    }

    // Update marker positions on screen
    updateMarkerPositions();

    updateExplorerButtons();
}

function updateExplorerButtons() {
    // Update context menu actions section visibility
    const actionsSection = document.getElementById('context-actions');
    const hasStart = GameState.explorerState.customStart !== null;
    const hasEnd = GameState.explorerState.customEnd !== null;
    const hasBoth = hasStart && hasEnd;

    if (actionsSection) {
        actionsSection.style.display = hasBoth ? 'flex' : 'none';
    }
}

function startExplorerChallenge() {
    if (!GameState.explorerState.customStart || !GameState.explorerState.customEnd) return;

    // Clear any previous visualization state
    if (GameState.vizState) {
        GameState.vizState.active = false;
        GameState.vizState.paused = true;
    }
    clearVisualization();
    clearUserPath();

    // Stop any playing sounds
    if (typeof SoundEngine !== 'undefined') {
        SoundEngine.stopScanning();
    }

    // CRITICAL: Set gameStarted to true so drawing works
    GameState.gameStarted = true;

    // Initialize user path from start
    GameState.userPathNodes = [GameState.startNode];
    GameState.userDrawnPoints = [];
    GameState.userDistance = 0;

    // Add the start position to drawn points
    const startPos = GameState.nodes.get(GameState.startNode);
    if (startPos) {
        GameState.userDrawnPoints.push({ lat: startPos.lat, lng: startPos.lng });
    }

    // Enable drawing
    enableDrawing();

    // Hide context menu if open
    hideExplorerContextMenu();

    // Hide badge during challenge
    const badge = document.getElementById('explorer-badge');
    if (badge) badge.classList.add('hidden');

    console.log('[Explorer] Challenge started - draw your path to the end marker!');
}

async function explorerShowRoute() {
    if (!GameState.explorerState.customStart || !GameState.explorerState.customEnd) return;

    // Clear any existing visualization state
    clearVisualizationState();
    clearUserPath();

    // Stop any playing sounds first
    if (typeof SoundEngine !== 'undefined') {
        SoundEngine.stopScanning();
    }

    // Run A* between the two points
    const result = runAStar(GameState.startNode, GameState.endNode);

    if (result.path.length > 0) {
        // Enter VISUALIZING phase
        GameController.enterPhase(GamePhase.VISUALIZING);

        // Run the visualization
        await runEpicVisualization(result.explored, result.path);

        // Add to persistent history for continuous visualization
        const exploredEdgeKeys = Array.from(GameState.vizState.edgeHeat.keys());
        ExplorerHistory.addPath(exploredEdgeKeys, result.path, []);

        // Return to IDLE phase (GameController cleans up vizState.active)
        GameController.enterPhase(GamePhase.IDLE);
    }

    // Stop sounds after visualization completes
    if (typeof SoundEngine !== 'undefined') {
        SoundEngine.stopScanning();
    }
}

async function showExplorerComparison() {
    // Disable further drawing
    disableDrawing();

    // Run A* to get optimal path
    const result = runAStar(GameState.startNode, GameState.endNode);

    // Calculate user's path distance vs optimal
    const userDistance = GameState.userDistance;
    let optimalDistance = 0;
    for (let i = 1; i < result.path.length; i++) {
        const from = GameState.nodes.get(result.path[i - 1]);
        const to = GameState.nodes.get(result.path[i]);
        if (from && to) {
            optimalDistance += haversineDistance(from.lat, from.lng, to.lat, to.lng);
        }
    }

    const efficiency = optimalDistance > 0 ? Math.min(100, (optimalDistance / userDistance) * 100) : 100;

    console.log(`[Explorer] Your path: ${userDistance.toFixed(2)}km, Optimal: ${optimalDistance.toFixed(2)}km, Efficiency: ${efficiency.toFixed(1)}%`);

    // Save user path before visualization clears it
    const userPathCopy = [...GameState.userPathNodes];

    // Show the A* visualization to compare
    if (result.path.length > 0) {
        // Enter VISUALIZING phase
        GameController.enterPhase(GamePhase.VISUALIZING);

        await runEpicVisualization(result.explored, result.path);

        // Add to persistent history (with user path)
        const exploredEdgeKeys = Array.from(GameState.vizState.edgeHeat.keys());
        ExplorerHistory.addPath(exploredEdgeKeys, result.path, userPathCopy);

        // Return to IDLE phase
        GameController.enterPhase(GamePhase.IDLE);
    }

    // Stop sounds after visualization completes
    if (typeof SoundEngine !== 'undefined') {
        SoundEngine.stopScanning();
    }

    // Show badge again after challenge
    const badge = document.getElementById('explorer-badge');
    if (badge) badge.classList.remove('hidden');

    // Reset game started state
    GameState.gameStarted = false;
}

function resetExplorer() {
    // Clear DOM-based markers
    if (GameState.startMarkerEl) {
        GameState.startMarkerEl.remove();
        GameState.startMarkerEl = null;
        GameState.startMarkerLatLng = null;
    }
    if (GameState.endMarkerEl) {
        GameState.endMarkerEl.remove();
        GameState.endMarkerEl = null;
        GameState.endMarkerLatLng = null;
    }

    // Also clear legacy marker references if they exist
    if (GameState.startMarker) {
        GameState.map.removeLayer(GameState.startMarker);
        GameState.startMarker = null;
    }
    if (GameState.endMarker) {
        GameState.map.removeLayer(GameState.endMarker);
        GameState.endMarker = null;
    }

    // Clear state
    GameState.startNode = null;
    GameState.endNode = null;
    GameState.explorerState.customStart = null;
    GameState.explorerState.customEnd = null;
    GameState.explorerState.placingStart = false;
    GameState.explorerState.placingEnd = false;
    GameState.explorerState.pendingNode = null;
    GameState.explorerState.pendingLatLng = null;

    // Hide context menu if open
    hideExplorerContextMenu();

    // Clear visualization
    clearVisualization();
    clearUserPath();

    // Update buttons
    updateExplorerButtons();

    // Reset cursor
    const mapContainer = document.getElementById('map-container');
    if (mapContainer) mapContainer.style.cursor = '';
}

function stopExplorerMode() {
    // Use GameController to cleanly exit current phase
    GameController.enterPhase(GamePhase.MENU);

    // Hide location search bar
    hideLocationSearch();

    // Stop facts ticker
    CityFacts.stopTicker();

    // Remove map click listener
    GameState.map.off('click', handleExplorerMapClick);

    // Reset explorer
    resetExplorer();

    // Clear explorer history
    ExplorerHistory.clear();

    // Hide context menu if open
    hideExplorerContextMenu();

    // Reset HUD to competitive mode
    setHUDMode('competitive');

    // Return to mode selector
    GameState.gameMode = 'competitive';
    showModeSelector();
}

// =============================================================================
// CONTINUOUS COMPETITIVE PLAY
// =============================================================================

function preloadNextCity() {
    // Don't preload if already preloading
    if (GameState.continuousPlay.preloadedCity) return;

    // Pick next city based on location mode
    const nextCity = getRandomCity(GameState.locationMode);
    GameState.continuousPlay.preloadedCity = nextCity;

    // Calculate bounds for the city
    const zoom = nextCity.zoom || 15;
    const latOffset = 0.015 * Math.pow(2, 15 - zoom);
    const lngOffset = 0.02 * Math.pow(2, 15 - zoom);

    const bounds = {
        south: nextCity.lat - latOffset,
        north: nextCity.lat + latOffset,
        west: nextCity.lng - lngOffset,
        east: nextCity.lng + lngOffset
    };

    // Build the query
    const query = `
        [out:json][timeout:25];
        (
            way["highway"]["highway"!~"footway|path|steps|pedestrian|cycleway|track"]
            (${bounds.south},${bounds.west},${bounds.north},${bounds.east});
        );
        out body;
        >;
        out skel qt;
    `;

    // Fetch in background
    const servers = CONFIG.overpassServers;
    const server = servers[Math.floor(Math.random() * servers.length)];

    fetch(server, {
        method: 'POST',
        body: `data=${encodeURIComponent(query)}`,
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    })
    .then(response => response.json())
    .then(data => {
        if (data.elements && data.elements.length > 0) {
            GameState.continuousPlay.preloadedData = data;
            console.log(`Preloaded ${nextCity.name}: ${data.elements.length} elements`);
        }
    })
    .catch(error => {
        console.warn('City preload failed (will fetch fresh):', error);
        GameState.continuousPlay.preloadedCity = null;
        GameState.continuousPlay.preloadedData = null;
    });
}

async function transitionToNextCity() {
    // For local mode, stay in the same location - just reset rounds
    if (GameState.locationMode === 'local') {
        GameState.continuousPlay.citiesCompleted++;
        GameState.currentRound = 1;
        GameState.totalScore = 0;
        GameState.roundScores = [];
        updateScoreDisplay();
        updateRoundDisplay();
        clearRoundLegend();
        clearVisualization();
        clearUserPath();
        RoundHistory.clear();

        // Reset comparison bars
        const userBar = document.getElementById('user-bar');
        const optimalBar = document.getElementById('optimal-bar');
        if (userBar) userBar.style.width = '0%';
        if (optimalBar) optimalBar.style.width = '0%';

        // Stay in same location, pick new endpoints
        selectRandomEndpoints();
        enableDrawing();
        return;
    }

    // Store current city score
    GameState.continuousPlay.cityScores.push({
        city: GameState.currentCity?.name || 'Unknown',
        score: GameState.totalScore
    });
    GameState.continuousPlay.citiesCompleted++;

    // Show transition overlay
    const overlay = document.getElementById('city-transition');
    const cityName = document.getElementById('transition-city-name');
    const citiesCount = document.getElementById('transition-cities-count');

    // Determine next city
    let nextCity = GameState.continuousPlay.preloadedCity;
    if (!nextCity) {
        nextCity = getRandomCity(GameState.locationMode);
    }

    if (cityName) cityName.textContent = nextCity.name;
    if (citiesCount) citiesCount.textContent = GameState.continuousPlay.citiesCompleted;
    if (overlay) overlay.classList.remove('hidden');

    // Show a fact about the next city in the transition
    CityFacts.showFactInTransition(nextCity.name);

    // Reset game state for new city
    GameState.currentRound = 1;
    GameState.totalScore = 0;
    GameState.roundScores = [];
    updateScoreDisplay();
    updateRoundDisplay();
    clearRoundLegend();
    clearVisualization();
    clearUserPath();

    // Reset comparison bars
    const userBar = document.getElementById('user-bar');
    const optimalBar = document.getElementById('optimal-bar');
    if (userBar) userBar.style.width = '0%';
    if (optimalBar) optimalBar.style.width = '0%';

    // Clear round history for new city
    GameState.roundHistory = [];

    // Wait for transition effect
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Move map to new city
    GameState.currentCity = nextCity;
    GameState.map.jumpTo({ center: [nextCity.lng, nextCity.lat], zoom: nextCity.zoom || 15 });
    updateLocationDisplay(nextCity.name);

    // Update HUD with new city number
    updateContinuousHUD();

    // Use preloaded data if available
    if (GameState.continuousPlay.preloadedData) {
        processRoadData(GameState.continuousPlay.preloadedData);
        GameState.continuousPlay.preloadedCity = null;
        GameState.continuousPlay.preloadedData = null;

        // Hide transition, start new round
        if (overlay) overlay.classList.add('hidden');
        selectRandomEndpoints();
        enableDrawing();
    } else {
        // Fetch fresh
        if (overlay) overlay.classList.add('hidden');
        showLoading('Mapping new territory...', false, nextCity);
        await loadRoadNetworkForContinuous(nextCity);
    }
}

async function loadRoadNetworkForContinuous(location) {
    const servers = CONFIG.overpassServers;
    const server = servers[Math.floor(Math.random() * servers.length)];

    const bounds = GameState.map.getBounds();
    const query = `
        [out:json][timeout:25];
        (
            way["highway"]["highway"!~"footway|path|steps|pedestrian|cycleway|track"]
            (${bounds.getSouth()},${bounds.getWest()},${bounds.getNorth()},${bounds.getEast()});
        );
        out body;
        >;
        out skel qt;
    `;

    try {
        const response = await fetch(server, {
            method: 'POST',
            body: `data=${encodeURIComponent(query)}`,
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });

        const data = await response.json();

        if (data.elements && data.elements.length > 0) {
            processRoadData(data);
            hideLoading();
            selectRandomEndpoints();
            enableDrawing();
        } else {
            throw new Error('No road data');
        }
    } catch (error) {
        console.error('Continuous load failed:', error);
        hideLoading();
        // Fall back to mode selector on failure
        showModeSelector();
    }
}

function enableContinuousPlay() {
    GameState.continuousPlay.enabled = true;
    GameState.continuousPlay.citiesCompleted = 0;
    GameState.continuousPlay.cityScores = [];
    GameState.continuousPlay.preloadedCity = null;
    GameState.continuousPlay.preloadedData = null;

    // Update HUD to show continuous mode
    updateContinuousHUD();
}

function disableContinuousPlay() {
    GameState.continuousPlay.enabled = false;
    GameState.continuousPlay.preloadedCity = null;
    GameState.continuousPlay.preloadedData = null;
}

function updateContinuousHUD() {
    // City indicator removed - users see city count in the round recap
}

function removeContinuousHUD() {
    const cityIndicator = document.getElementById('city-indicator');
    if (cityIndicator) {
        cityIndicator.remove();
    }
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

    // Analytics: Track location mode selection
    if (typeof PathfindrAnalytics !== 'undefined') {
        PathfindrAnalytics.trackLocationSelected(mode, null);  // City name tracked later
    }

    // Show loading overlay (no map animation yet - we don't have the city)
    document.getElementById('loading-overlay').classList.remove('hidden');
    document.getElementById('loading-text').textContent = 'Finding your destination...';
    document.getElementById('loading-city').textContent = '';

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
        // Use async version to potentially fetch from city database
        getRandomCityAsync('us').then(city => {
            startGameWithLocation(city);
        });
    } else if (mode === 'global') {
        // Use async version to potentially fetch from city database
        getRandomCityAsync('global').then(city => {
            startGameWithLocation(city);
        });
    }
}

function getRandomCity(mode) {
    const cities = mode === 'us' ? CONFIG.usCities : CONFIG.globalCities;
    const city = cities[Math.floor(Math.random() * cities.length)];
    return maybePickDistrict(city);
}

/**
 * Async version of getRandomCity that optionally uses the Supabase cities database
 * Falls back to hardcoded lists if DB is disabled or fails
 */
async function getRandomCityAsync(mode) {
    // Try database if enabled
    if (CityDB.enabled) {
        try {
            let city = null;

            if (mode === 'us') {
                city = await CityDB.getRandomUSCity();
            } else if (mode === 'global') {
                city = await CityDB.getRandomWorldCity();
            }

            if (city) {
                console.log(`[CityDB] Got city from database: ${city.name}`);
                return city;
            }
        } catch (error) {
            console.warn('[CityDB] Database fetch failed, using fallback:', error);
        }
    }

    // Fallback to hardcoded lists
    return getRandomCity(mode);
}

/**
 * Pick the default district for a city (used for first-time visits)
 */
function pickDefaultDistrict(city) {
    if (!city.districts || city.districts.length === 0) {
        return city;
    }

    // Find the default district, or use the first one
    const defaultDistrict = city.districts.find(d => d.isDefault) || city.districts[0];

    return {
        lat: defaultDistrict.lat,
        lng: defaultDistrict.lng,
        zoom: defaultDistrict.zoom || city.zoom,
        name: `${defaultDistrict.name}, ${city.name.split(',')[0]}`,
        parentCity: city.name,
        wikiName: city.wikiName,
        isDistrict: true,
    };
}

/**
 * If a city has districts, randomly decide whether to use the main city
 * or one of its districts (50% chance of using a district)
 */
function maybePickDistrict(city) {
    if (!city.districts || city.districts.length === 0) {
        return city;
    }

    // 50% chance to pick a district, 50% to use the main city center
    if (Math.random() < 0.5) {
        return city;  // Use main city
    }

    // Pick a random district
    const district = city.districts[Math.floor(Math.random() * city.districts.length)];

    // Return district with parent city info for display
    return {
        lat: district.lat,
        lng: district.lng,
        zoom: district.zoom || city.zoom,
        name: `${district.name}, ${city.name.split(',')[0]}`,  // e.g. "Shibuya, Tokyo"
        parentCity: city.name,
        wikiName: city.wikiName,
        isDistrict: true,
    };
}

/**
 * Get all districts for a city (for future district selector UI)
 */
function getCityDistricts(cityName) {
    const allCities = [...CONFIG.usCities, ...CONFIG.globalCities];
    const city = allCities.find(c => c.name === cityName);
    return city?.districts || [];
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
            const countryCode = data.address.country_code?.toUpperCase();
            const countryName = data.address.country;

            // Build full location: City, State/Province, Country
            const parts = [];
            if (city) parts.push(city);
            if (state) parts.push(state);
            if (countryName) parts.push(countryName);

            if (parts.length > 0) {
                return parts.join(', ');
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

    // Start the map transition animation with the target city
    // The transition handles the map view, zooming from global to street level
    showLoading('Discovering routes...', false, location);

    // Preload facts for this city (non-blocking)
    CityFacts.preload(location.name);

    loadRoadNetwork(location);
}

function updateLocationDisplay(name) {
    const el = document.getElementById('current-location');
    if (el) el.textContent = name;
    updateSearchProBadge();
}

function updateSearchProBadge() {
    const locationDisplay = document.getElementById('location-display');
    if (!locationDisplay) return;

    // Remove existing badge if any
    const existingBadge = locationDisplay.querySelector('.search-pro-badge');
    if (existingBadge) existingBadge.remove();

    // Add PRO badge in competitive mode for non-premium users
    if (GameState.gameMode === 'competitive') {
        const isPremium = typeof PathfindrConfig !== 'undefined' && PathfindrConfig.isAdFree();
        if (!isPremium) {
            const badge = document.createElement('span');
            badge.className = 'search-pro-badge';
            badge.textContent = 'PRO';
            locationDisplay.appendChild(badge);
        }
    }
}

function showInstructions() {
    document.getElementById('instructions-overlay').classList.remove('hidden');
}

function hideInstructions() {
    document.getElementById('instructions-overlay').classList.add('hidden');
}

/**
 * Determine if an ad should show based on games completed and current round
 * Progressive ad frequency:
 * - Game 1: No ads (first experience is clean)
 * - Game 2: Rounds 1, 3
 * - Game 3: Rounds 1, 3, 5
 * - Game 4+: Every round
 */
function shouldShowRoundAd() {
    const gamesCompleted = GameState.gamesCompleted;
    const round = GameState.currentRound;

    // First game: no ads
    if (gamesCompleted === 0) return false;

    // Second game: rounds 1 and 3
    if (gamesCompleted === 1) return round === 1 || round === 3;

    // Third game: rounds 1, 3, and 5
    if (gamesCompleted === 2) return round === 1 || round === 3 || round === 5;

    // Fourth game and beyond: every round
    return true;
}

function showResults() {
    SoundEngine.slide();
    document.getElementById('results-panel').classList.add('visible');

    // Show a city fact in the results panel
    if (GameState.currentCity?.name) {
        CityFacts.showFactInResults(GameState.currentCity.name);
    }

    // Show banner ad during round recaps (progressive frequency, delayed)
    if (PathfindrConfig.ads.showBannerBetweenRounds && typeof PathfindrAds !== 'undefined') {
        if (shouldShowRoundAd()) {
            setTimeout(() => {
                PathfindrAds.showBanner(PathfindrConfig.ads.bannerPosition || 'top');
            }, 600);
        }
    }

    // Show inline interstitial above Next Round button (0.5s delay)
    if (typeof PathfindrAds !== 'undefined') {
        setTimeout(() => {
            PathfindrAds.showInlineInterstitial();
        }, 500);
    }
}

function hideResults() {
    document.getElementById('results-panel').classList.remove('visible');

    // Hide banner ad when leaving round recap
    if (typeof PathfindrAds !== 'undefined') {
        PathfindrAds.hideBanner();
        PathfindrAds.hideInlineInterstitial();
    }
}

async function showGameOver() {
    // Increment games completed counter (persists to localStorage)
    GameState.gamesCompleted++;
    localStorage.setItem('pathfindr_games_completed', GameState.gamesCompleted.toString());

    // Heavy haptic for game over
    GameHaptics.gameOver();

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

    // Analytics: Track game completion
    if (typeof PathfindrAnalytics !== 'undefined') {
        const avgEfficiency = GameState.roundScores?.length > 0
            ? GameState.roundScores.reduce((sum, r) => sum + r.efficiency, 0) / GameState.roundScores.length
            : 0;
        PathfindrAnalytics.trackGameComplete(
            GameState.totalScore,
            avgEfficiency,
            GameState.currentCity?.name || 'Unknown',
            GameState.locationMode
        );
    }

    // Check achievements after full game
    if (typeof PathfindrAchievements !== 'undefined' && PathfindrAuth?.isLoggedIn()) {
        PathfindrAchievements.checkAchievements();
    }
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
    // Sync mobile stats
    const mobileScore = document.getElementById('mobile-score');
    if (mobileScore) mobileScore.textContent = GameState.totalScore;
}

function updateRoundDisplay() {
    const roundEl = document.getElementById('stat-primary-value');
    if (!roundEl) return;
    roundEl.textContent = GameState.currentRound;

    // Color the round number to match the round's theme color
    const theme = CONFIG.color.getTheme(GameState.currentRound);
    const roundColor = `rgb(${theme.base.r}, ${theme.base.g}, ${theme.base.b})`;
    roundEl.style.color = roundColor;
    // Add subtle text shadow for glow effect
    roundEl.style.textShadow = `0 0 8px ${roundColor}, 0 0 15px ${roundColor}50`;

    // Sync mobile stats
    const mobileRound = document.getElementById('mobile-round');
    const mobileCityNumber = document.getElementById('mobile-city-number');
    if (mobileRound) {
        mobileRound.textContent = GameState.currentRound;
        mobileRound.style.color = roundColor;
        mobileRound.style.textShadow = `0 0 8px ${roundColor}`;
    }
    if (mobileCityNumber) {
        mobileCityNumber.textContent = GameState.currentRound;
        mobileCityNumber.style.color = roundColor;
    }
    // Update mobile round dots
    updateMobileRoundDots();
}

function updateMobileRoundDots() {
    const mobileRoundLegend = document.getElementById('mobile-round-legend');
    if (!mobileRoundLegend) return;

    const dots = mobileRoundLegend.querySelectorAll('.mobile-round-dot');
    dots.forEach((dot, index) => {
        dot.classList.remove('completed', 'current');
        if (index < GameState.currentRound - 1) {
            dot.classList.add('completed');
        } else if (index === GameState.currentRound - 1) {
            dot.classList.add('current');
        }
    });
}

// Update the round legend showing completed rounds with colors and scores
function updateRoundLegend() {
    const legendEl = document.getElementById('hud-round-legend');
    const itemsEl = document.getElementById('legend-items');

    if (!legendEl || !itemsEl) return;

    // Only show legend if there are completed rounds
    if (!GameState.roundScores || GameState.roundScores.length === 0) {
        legendEl.classList.add('hidden');
        return;
    }

    // Show the legend
    legendEl.classList.remove('hidden');

    // Build legend items
    itemsEl.innerHTML = GameState.roundScores.map(r => {
        const theme = CONFIG.color.getTheme(r.round);
        const color = theme.base;
        const colorStr = `rgb(${color.r}, ${color.g}, ${color.b})`;

        return `
            <div class="legend-item" title="Round ${r.round}: ${r.efficiency.toFixed(0)}% efficiency">
                <span class="legend-round">R${r.round}</span>
                <span class="legend-dot solid" style="background: ${colorStr}; color: ${colorStr};"></span>
                <span class="legend-score">${r.score}</span>
            </div>
        `;
    }).join('');
}

// Clear the round legend (for new games)
function clearRoundLegend() {
    const legendEl = document.getElementById('hud-round-legend');
    const itemsEl = document.getElementById('legend-items');

    if (legendEl) legendEl.classList.add('hidden');
    if (itemsEl) itemsEl.innerHTML = '';
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
 * Uses WebGL when available, falls back to Canvas 2D.
 */
function drawRoadNetwork(ctx) {
    // Use WebGL if available
    if (GameState.useWebGL) {
        WebGLRenderer.render(performance.now());
        return;
    }

    // Canvas 2D fallback
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
        const from = GameState.map.project([edge.fromPos.lng, edge.fromPos.lat]);
        const to = GameState.map.project([edge.toPos.lng, edge.toPos.lat]);

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
        const from = GameState.map.project([edge.fromPos.lng, edge.fromPos.lat]);
        const to = GameState.map.project([edge.toPos.lng, edge.toPos.lat]);

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
        const fromScreen = GameState.map.project([edge.fromPos.lng, edge.fromPos.lat]);
        const toScreen = GameState.map.project([edge.toPos.lng, edge.toPos.lat]);

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
        const screen = GameState.map.project([pos.lng, pos.lat]);

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

            const fromScreen = GameState.map.project([fromPos.lng, fromPos.lat]);
            const toScreen = GameState.map.project([toPos.lng, toPos.lat]);

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

// =============================================================================
// MODE SWITCHING FROM PROFILE
// =============================================================================

/**
 * Exit current game and return to main menu
 */
function exitToMenu() {
    // Stop any active modes
    if (GameState.gameMode === 'explorer') {
        stopExplorerMode();
        return; // stopExplorerMode already shows mode selector
    }
    if (GameState.gameMode === 'visualizer') {
        stopVisualizerMode();
        return; // stopVisualizerMode already shows mode selector
    }

    // For competitive mode, reset and show menu
    exitVisualizerFullscreen();
    hideResults();
    hideGameOver();
    clearVisualization();
    clearUserPath();
    AmbientViz.stop();
    RoundHistory.clear();

    // Reset game state
    GameState.currentRound = 1;
    GameState.totalScore = 0;
    GameState.roundScores = [];
    GameState.gameStarted = false;
    GameState.canDraw = false;
    clearRoundLegend();
    disableContinuousPlay();
    removeContinuousHUD();

    // Reset comparison bars
    const userBar = document.getElementById('user-bar');
    const optimalBar = document.getElementById('optimal-bar');
    if (userBar) userBar.style.width = '0%';
    if (optimalBar) optimalBar.style.width = '0%';

    showModeSelector();
}

/**
 * Switch directly to explorer mode
 */
function switchToExplorerMode() {
    // Check premium access
    if (!checkPremiumAccess('explorer')) {
        showPremiumRequired('Explorer');
        return;
    }

    // Exit current mode if active
    if (GameState.gameMode === 'visualizer') {
        GameState.visualizerState.active = false;
        if (GameState.visualizerState.loopTimeout) {
            clearTimeout(GameState.visualizerState.loopTimeout);
        }
        const vizUI = document.getElementById('visualizer-ui');
        if (vizUI) vizUI.classList.add('hidden');
        VisualizerHistory.clear();
    }

    // Reset competitive state if needed
    hideResults();
    hideGameOver();
    clearVisualization();
    clearUserPath();
    RoundHistory.clear();
    disableContinuousPlay();
    removeContinuousHUD();

    // Start explorer mode
    GameState.gameMode = 'explorer';
    startExplorerMode();
}

/**
 * Switch directly to visualizer mode
 */
function switchToVisualizerMode() {
    // Check premium access
    if (!checkPremiumAccess('visualizer')) {
        showPremiumRequired('Visualizer');
        return;
    }

    // Exit explorer mode if active
    if (GameState.gameMode === 'explorer') {
        GameState.map.off('click', handleExplorerMapClick);
        resetExplorer();
        ExplorerHistory.clear();
        const badge = document.getElementById('explorer-badge');
        if (badge) badge.classList.add('hidden');
        hideExplorerContextMenu();
    }

    // Reset competitive state if needed
    hideResults();
    hideGameOver();
    clearVisualization();
    clearUserPath();
    RoundHistory.clear();
    disableContinuousPlay();
    removeContinuousHUD();

    // Start visualizer mode
    GameState.gameMode = 'visualizer';
    startVisualizerMode();
}
