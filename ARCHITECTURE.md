# Pathfindr v0.01 Alpha - System Architecture

> **Last Updated:** January 2026
> **Version:** 0.01 Alpha (Production)
> **Status:** In production, preparing for v1.0

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Tech Stack Overview](#2-tech-stack-overview)
3. [File Structure](#3-file-structure)
4. [Game Modes](#4-game-modes)
5. [Core Architecture](#5-core-architecture)
6. [Event Flow & State Machine](#6-event-flow--state-machine)
7. [Road Network System](#7-road-network-system)
8. [User Input & Path Drawing](#8-user-input--path-drawing)
9. [A* Pathfinding Algorithm](#9-a-pathfinding-algorithm)
10. [Visualization Systems](#10-visualization-systems)
11. [Scoring System](#11-scoring-system)
12. [Audio System](#12-audio-system)
13. [Authentication & User Management](#13-authentication--user-management)
14. [Payment System](#14-payment-system)
15. [Challenge System](#15-challenge-system)
16. [City Facts System](#16-city-facts-system)
17. [Supabase Backend](#17-supabase-backend)
18. [Configuration & Constants](#18-configuration--constants)
19. [Performance Optimizations](#19-performance-optimizations)
20. [Mobile Support](#20-mobile-support)
21. [Known Issues & Technical Debt](#21-known-issues--technical-debt)
22. [Expansion Points](#22-expansion-points)

---

## 1. Executive Summary

Pathfindr is a web-based game where players draw routes on real-world maps and compete against the A* pathfinding algorithm. The game features a **Blade Runner/cyberpunk aesthetic** with neon colors, organic electricity effects, and synthesized audio.

**Core Gameplay Loop:**
1. Player selects a city (local, US, or global)
2. Random START and END markers are placed
3. Player draws what they think is the shortest path
4. A* algorithm runs with visual exploration animation
5. Player scored on efficiency (user distance vs optimal distance)
6. 5 rounds per game with cumulative scoring

**Current State:** Production deployment with ~12,500 lines of vanilla JavaScript. All core systems operational. Challenge mode has known issues (see Section 21).

---

## 2. Tech Stack Overview

### Frontend
| Technology | Purpose |
|------------|---------|
| Vanilla JavaScript | All game logic (no framework) |
| MapLibre GL JS | Map rendering (OpenStreetMap tiles) |
| Canvas 2D API | Visualization overlays |
| WebGL (optional) | High-performance road rendering |
| Web Audio API | Sound effects and music |
| CSS Custom Properties | Theming and animations |

### Backend (Supabase)
| Technology | Purpose |
|------------|---------|
| PostgreSQL | Database (users, scores, challenges, facts) |
| Edge Functions (Deno) | API endpoints (city facts, challenges) |
| Auth | OAuth + email/password authentication |
| Row Level Security | Data access control |

### External APIs
| API | Purpose |
|-----|---------|
| Overpass API | Road network data from OpenStreetMap |
| Nominatim API | Geocoding (location search) |
| Wikipedia API | City information for facts |
| OpenAI (gpt-4o-mini) | Processing city facts |
| Stripe | Web payments |
| RevenueCat | Mobile in-app purchases |

---

## 3. File Structure

```
pathfindr/
├── index.html              # Main HTML with all UI overlays
├── game.js                 # Core game logic (~12,477 lines)
├── styles.css              # Blade Runner themed styling (174KB)
├── config.js               # API keys and configuration
├── auth.js                 # Supabase authentication (~1000 lines)
├── payments.js             # Stripe/RevenueCat (~700 lines)
├── ads.js                  # AdMob/AdSense integration (~800 lines)
├── analytics.js            # Event tracking (~600 lines)
│
├── Audio/
│   ├── Scanning.wav        # A* exploration sound
│   ├── Found1.wav          # Path found sound
│   └── Pathfindr1.wav      # Background soundtrack
│
├── supabase/
│   ├── functions/
│   │   ├── get-city-facts/index.ts
│   │   ├── get-random-city/index.ts
│   │   ├── create-hourly-challenge/index.ts
│   │   ├── create-checkout/index.ts
│   │   └── stripe-webhook/index.ts
│   └── migrations/
│       ├── 001_city_facts.sql → 014_cleanup_remote_challenges.sql
│
└── .github/workflows/
    └── hourly-challenge.yml    # Cron job for challenge creation
```

---

## 4. Game Modes

### 4.1 Competitive/Classic Mode (Free)
- **Rounds:** 5 per game
- **Cities:** Random from curated US or Global pools
- **Gameplay:** Player draws path, A* visualizes, scoring based on efficiency
- **Persistence:** Round history shows all 5 rounds with different colors
- **Max Score:** 5000 (1000 per round × 5)

### 4.2 Explorer Mode (Premium)
- **Rounds:** Unlimited
- **Cities:** Player chooses
- **Gameplay:** Free-form exploration, place markers anywhere
- **Features:**
  - "Challenge" button runs full A* visualization
  - "Show Route" reveals optimal path instantly
  - "Living Network" breathing/ripple effects
  - Persistent history of all paths drawn

### 4.3 Visualizer Mode (Premium)
- **Rounds:** Automatic continuous
- **Cities:** Random selection, auto-transitions
- **Gameplay:** Passive viewing mode
- **Features:**
  - 5 visualizations per city
  - Auto-transition to new cities
  - City facts ticker
  - Mesmerizing ambient display

### 4.4 Challenge Mode (Free, requires login)
- **Rounds:** 1 per challenge (single attempt)
- **Cities:** Fixed by challenge
- **Gameplay:** Compete on global leaderboard
- **Features:**
  - Hourly challenges created automatically
  - 36-hour active window per challenge
  - Fixed start/end points for fair competition
  - Global ranking system
- **Status:** ⚠️ Currently has issues (see Section 21)

---

## 5. Core Architecture

### 5.1 GameController (State Machine)

The `GameController` manages game phases and coordinates all subsystems:

```javascript
const GamePhase = {
    MENU: 'menu',           // Mode/location selection screens
    LOADING: 'loading',     // Road network loading
    PLAYING: 'playing',     // User drawing path
    VISUALIZING: 'visualizing', // A* visualization running
    RESULTS: 'results',     // Round results display
    IDLE: 'idle',           // Visualizer waiting between cities
};
```

**Key Methods:**
```javascript
GameController.enterPhase(newPhase)    // Transition with cleanup
GameController.startLoop()             // Start RAF animation loop
GameController.stopLoop()              // Stop animation loop
GameController._renderFrame(deltaTime) // Phase-specific rendering
GameController.shouldContinue(phase)   // Async operation safety
```

### 5.2 GameState (Central State Object)

Single source of truth for all runtime data:

```javascript
GameState = {
    // Map & Rendering
    map: MapLibreGL.Map,
    drawCanvas, drawCtx,        // User path drawing
    vizCanvas, vizCtx,          // A* visualization
    useWebGL: boolean,          // WebGL road rendering toggle

    // Road Network Graph
    nodes: Map<nodeId, {lat, lng}>,           // All intersections
    edges: Map<nodeId, [{neighbor, weight}]>, // Adjacency list
    edgeList: Array<edge>,                    // For iteration
    edgeLookup: Map<"min-max", edge>,         // O(1) lookup

    // Current Round State
    startNode, endNode,         // Node IDs
    startMarker, endMarker,     // MapLibre markers

    // User Path (Single Source of Truth)
    userPathNodes: [nodeId],    // Snapped to road network
    userDrawnPoints: [{lat, lng}], // Raw mouse/touch path
    userDistance: number,       // Calculated from userPathNodes

    // A* Results
    exploredNodes: [nodeId],    // Exploration order
    optimalPath: [nodeId],      // Shortest path found

    // Visualization State
    vizState: {
        active: boolean,
        exploredSet: Set<nodeId>,
        nodeHeat: Map<nodeId, 0-1>,
        edgeHeat: Map<edgeKey, 0-1>,
        particles: Array<Particle>,
        phase: 'idle'|'exploring'|'path'|'complete',
    },

    // Game Progress
    currentRound: 1-5,
    totalScore: number,
    gameMode: 'competitive'|'explorer'|'visualizer'|'challenge',
    difficulty: 'easy'|'medium'|'hard',

    // Mode-specific
    challengeState: {...},      // Challenge mode data
    explorerHistory: {...},     // Explorer persistent paths
    visualizerHistory: {...},   // Visualizer persistent paths
}
```

---

## 6. Event Flow & State Machine

### 6.1 Complete Game Flow (Competitive Mode)

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER LAUNCHES GAME                        │
└─────────────────────────────┬───────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  PHASE: MENU                                                     │
│  ─────────────                                                   │
│  • showModeSelector() displays mode buttons                      │
│  • User clicks "Pathfindr Classic"                               │
│  • showLocationOptions() shows: My Location | US | Global        │
└─────────────────────────────┬───────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  PHASE: LOADING                                                  │
│  ──────────────                                                  │
│  • showLoading() with globe animation                            │
│  • getRandomCity() selects from curated pool                     │
│  • initMap() if first load                                       │
│  • map.jumpTo() centers on city                                  │
│  • loadRoadNetwork() fetches from Overpass API                   │
│  • processRoadData() builds graph (nodes, edges, edgeList)       │
│  • selectRandomEndpoints() picks start/end nodes                 │
│  • placeMarkers() creates map markers                            │
│  • hideLoading()                                                 │
└─────────────────────────────┬───────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  PHASE: PLAYING                                                  │
│  ──────────────                                                  │
│  • GameController.enterPhase(PLAYING)                            │
│  • AmbientViz.start() begins particle system                     │
│  • User clicks map → handlePathClick(e)                          │
│  • addPointToUserPath() snaps click to nearest node              │
│  • Micro A* finds path from last node to clicked node            │
│  • userPathNodes updated, userDistance recalculated              │
│  • redrawUserPath() renders with electricity animation           │
│  • When path reaches endNode OR user clicks Submit:              │
│    └─► proceedToVisualization()                                  │
└─────────────────────────────┬───────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  PHASE: VISUALIZING                                              │
│  ──────────────────                                              │
│  • GameController.enterPhase(VISUALIZING)                        │
│  • User path cleared from canvas                                 │
│  • runAStar(startNode, endNode) calculates optimal path          │
│  • runEpicVisualization(explored, path) animates:                │
│    ├─► Exploration phase: batch-process explored nodes           │
│    │   • Set edge/node heat to 1.0                               │
│    │   • Spawn particles at frontier                             │
│    │   • Heat decays each frame (CONFIG.viz.heatDecay)           │
│    ├─► Path tracing phase: draw optimal path node by node        │
│    │   • Energy pulses travel along path                         │
│    │   • Thick bright line with outer glow                       │
│    └─► Complete phase: final burst at destination                │
│  • RoundHistory.add() stores round visualization                 │
│  • SoundEngine.stop('scanning')                                  │
│  • SoundEngine.play('found')                                     │
└─────────────────────────────┬───────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  PHASE: RESULTS                                                  │
│  ──────────────                                                  │
│  • GameController.enterPhase(RESULTS)                            │
│  • calculateAndShowScore() computes efficiency:                  │
│    efficiency = min(100, (optimalDistance/userDistance) × 100)   │
│    roundScore = efficiency × 10 (max 1000)                       │
│  • showResultsOverlay() displays:                                │
│    ├─► User distance vs optimal distance                         │
│    ├─► Efficiency percentage                                     │
│    ├─► Round score                                               │
│    └─► City fact (if available)                                  │
│  • Round legend shows persistent history colors                  │
│  • "Next Round" button OR "Game Over" if round 5                 │
└─────────────────────────────┬───────────────────────────────────┘
                              ▼
           ┌──────────────────┴──────────────────┐
           ▼                                      ▼
┌─────────────────────────┐         ┌─────────────────────────────┐
│  IF round < 5:          │         │  IF round == 5:             │
│  • nextRound()          │         │  • showGameOverScreen()     │
│  • Load new random city │         │  • Display final score      │
│  • Return to LOADING    │         │  • Show round summary       │
└─────────────────────────┘         │  • "Play Again" button      │
                                    └─────────────────────────────┘
```

### 6.2 Animation Loop Architecture

Single `requestAnimationFrame` loop prevents race conditions:

```javascript
GameController._loop() {
    const now = performance.now();
    const deltaTime = (now - this.lastFrameTime) / 1000;
    this.lastFrameTime = now;

    // Update all visualization systems
    RoundHistory.update(deltaTime);
    ExplorerHistory.update(deltaTime);
    VisualizerHistory.update(deltaTime);
    ElectricitySystem.update(deltaTime);
    AmbientViz.updateProximityToEnd();

    // Phase-specific rendering
    switch(this.currentPhase) {
        case GamePhase.VISUALIZING:
            this._renderVisualizationFrame(deltaTime);
            break;
        case GamePhase.PLAYING:
        case GamePhase.IDLE:
        case GamePhase.RESULTS:
            this._renderAmbientFrame(deltaTime);
            break;
        case GamePhase.MENU:
        case GamePhase.LOADING:
            this._renderMinimalFrame(deltaTime);
            break;
    }

    if (this.loopRunning) {
        this.animationId = requestAnimationFrame(() => this._loop());
    }
}
```

### 6.3 Event Listeners

```javascript
// Map events
map.on('click', handlePathClick)           // User drawing
map.on('moveend', ScreenCoordCache.invalidate)  // Cache invalidation

// UI buttons
#submit-btn → submitRoute()
#undo-btn → undoLastSegment()
#clear-btn → clearUserPath()
#mute-btn → toggleMute()
#next-round-btn → nextRound()

// Keyboard shortcuts
'M' → toggleMute()
'V' → toggleMapView()
Ctrl/Cmd+Z → undoLastSegment()

// Touch events (mobile)
touchstart → handleTouchStart()
touchmove → handleTouchMove()
touchend → stopDrawing()
```

---

## 7. Road Network System

### 7.1 Data Fetching (Overpass API)

```javascript
async function loadRoadNetwork(location) {
    const bounds = map.getBounds();
    const query = `
        [out:json][timeout:25];
        way["highway"]["highway"!~"footway|path|steps|pedestrian|cycleway|service|track"]
        (${bounds.getSouth()},${bounds.getWest()},${bounds.getNorth()},${bounds.getEast()});
        out body;
        >;
        out skel qt;
    `;

    // Retry logic with server rotation
    for (let attempt = 1; attempt <= 3; attempt++) {
        try {
            const response = await fetch(overpassUrl, {
                method: 'POST',
                body: `data=${encodeURIComponent(query)}`
            });
            return processRoadData(await response.json());
        } catch (error) {
            if (attempt < 3) {
                await sleep(Math.pow(2, attempt - 1) * 1000);
                overpassUrl = getNextServer();
            }
        }
    }
}
```

**Fallback Servers:**
```javascript
CONFIG.overpassServers = [
    'https://overpass-api.de/api/interpreter',
    'https://overpass.kumi.systems/api/interpreter',
    'https://maps.mail.ru/osm/tools/overpass/api/interpreter'
]
```

### 7.2 Graph Construction

```javascript
function processRoadData(data) {
    const nodes = new Map();      // nodeId → {lat, lng}
    const edges = new Map();      // nodeId → [{neighbor, weight}]
    const edgeList = [];          // For iteration
    const edgeLookup = new Map(); // "min-max" → edge (O(1) lookup)

    // Extract nodes from ways
    data.elements.forEach(el => {
        if (el.type === 'node') {
            nodes.set(el.id, { lat: el.lat, lng: el.lon });
        }
    });

    // Build edges from ways
    data.elements.forEach(el => {
        if (el.type === 'way' && el.nodes) {
            for (let i = 0; i < el.nodes.length - 1; i++) {
                const from = el.nodes[i];
                const to = el.nodes[i + 1];
                const weight = haversineDistance(
                    nodes.get(from), nodes.get(to)
                );

                // Bidirectional edges
                addEdge(from, to, weight);
                addEdge(to, from, weight);

                // Edge lookup key: "minId-maxId"
                const key = from < to ? `${from}-${to}` : `${to}-${from}`;
                edgeLookup.set(key, { from, to, weight });
                edgeList.push({ from, to, weight });
            }
        }
    });

    GameState.nodes = nodes;
    GameState.edges = edges;
    GameState.edgeList = edgeList;
    GameState.edgeLookup = edgeLookup;
}
```

### 7.3 Distance Calculation

All distances use **Haversine formula** (great-circle distance):

```javascript
function haversineDistance(lat1, lng1, lat2, lng2) {
    const R = 6371000; // Earth radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lng2 - lng1) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c; // Distance in meters
}
```

---

## 8. User Input & Path Drawing

### 8.1 Click Handling

```javascript
function handlePathClick(e) {
    // Guard conditions
    if (GameState.gameMode !== 'competitive' &&
        GameState.gameMode !== 'challenge') return;
    if (!GameState.gameStarted || GameState.isLoading) return;

    const { lat, lng } = e.lngLat;
    addPointToUserPath(lat, lng);
}
```

### 8.2 Path Snapping Algorithm

```javascript
function addPointToUserPath(lat, lng) {
    // 1. Find nearest node in road network
    const nearestNode = findNearestNode(lat, lng);

    // 2. Validate distance constraints
    const lastNode = userPathNodes[userPathNodes.length - 1];
    const dist = haversineDistance(
        nodes.get(lastNode), nodes.get(nearestNode)
    );

    // Distance limits by difficulty
    const maxDist = CONFIG.segmentDistance[GameState.difficulty];
    // easy: 500m, medium: 200m, hard: 100m

    if (dist > maxDist * 1000) {
        showToast(`Too far! Max ${maxDist * 1000}m per segment`);
        return;
    }

    // 3. Micro A* to route along roads
    const microPath = findShortestPathBetween(lastNode, nearestNode);

    // 4. Append to user path (skip duplicates)
    microPath.forEach(node => {
        if (node !== userPathNodes[userPathNodes.length - 1]) {
            userPathNodes.push(node);
        }
    });

    // 5. Recalculate total distance
    GameState.userDistance = calculateNodePathDistance(userPathNodes);

    // 6. Redraw with electricity animation
    redrawUserPath();

    // 7. Auto-complete if reached end
    if (nearestNode === GameState.endNode) {
        setTimeout(() => proceedToVisualization(), 300);
    }
}
```

### 8.3 Path Rendering (Electricity Animation)

```javascript
function redrawUserPath() {
    const ctx = GameState.drawCtx;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (userPathNodes.length < 2) return;

    // Convert nodes to screen coordinates
    const points = userPathNodes.map(nodeId => {
        const node = nodes.get(nodeId);
        return map.project([node.lng, node.lat]);
    });

    // Render layers
    // 1. Outer glow (wide, transparent)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 16;
    drawPath(ctx, points);

    // 2. Main line (white)
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 4;
    drawPath(ctx, points);

    // 3. Electricity flicker effect
    const flicker = 0.85 +
        Math.sin(performance.now() * 0.025) * 0.05 +
        Math.sin(performance.now() * 0.007) * 0.05;
    ctx.globalAlpha = flicker;
    ctx.strokeStyle = CONFIG.color.userPath;
    ctx.lineWidth = 2;
    drawPath(ctx, points);
    ctx.globalAlpha = 1.0;

    // 4. Energy pulses (traveling along path)
    ElectricitySystem.renderPulses(ctx, points);
}
```

---

## 9. A* Pathfinding Algorithm

### 9.1 Implementation

```javascript
function runAStar(startNode, endNode) {
    const openSet = new MinHeap();
    const closedSet = new Set();
    const cameFrom = new Map();
    const gScore = new Map();
    const explored = []; // Track exploration order

    gScore.set(startNode, 0);
    openSet.insert({
        node: startNode,
        priority: heuristic(startNode, endNode)
    });

    while (!openSet.isEmpty()) {
        const { node: current } = openSet.extractMin();

        if (current === endNode) {
            // Reconstruct path
            const path = [];
            let node = current;
            while (cameFrom.has(node)) {
                path.unshift(node);
                node = cameFrom.get(node);
            }
            path.unshift(startNode);
            return { path, explored };
        }

        if (closedSet.has(current)) continue;
        closedSet.add(current);
        explored.push(current);

        // Process neighbors
        const neighbors = GameState.edges.get(current) || [];
        for (const { neighbor, weight } of neighbors) {
            if (closedSet.has(neighbor)) continue;

            const tentativeG = gScore.get(current) + weight;

            if (!gScore.has(neighbor) || tentativeG < gScore.get(neighbor)) {
                cameFrom.set(neighbor, current);
                gScore.set(neighbor, tentativeG);

                const fScore = tentativeG + heuristic(neighbor, endNode);
                openSet.insert({ node: neighbor, priority: fScore });
            }
        }
    }

    return { path: [], explored }; // No path found
}

function heuristic(nodeA, nodeB) {
    // Haversine distance is admissible & consistent
    const a = GameState.nodes.get(nodeA);
    const b = GameState.nodes.get(nodeB);
    return haversineDistance(a.lat, a.lng, b.lat, b.lng);
}
```

### 9.2 MinHeap (Priority Queue)

```javascript
class MinHeap {
    constructor() {
        this.heap = [];
    }

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

    bubbleUp(index) {
        while (index > 0) {
            const parent = Math.floor((index - 1) / 2);
            if (this.heap[parent].priority <= this.heap[index].priority) break;
            [this.heap[parent], this.heap[index]] =
                [this.heap[index], this.heap[parent]];
            index = parent;
        }
    }

    bubbleDown(index) {
        while (true) {
            const left = 2 * index + 1;
            const right = 2 * index + 2;
            let smallest = index;

            if (left < this.heap.length &&
                this.heap[left].priority < this.heap[smallest].priority) {
                smallest = left;
            }
            if (right < this.heap.length &&
                this.heap[right].priority < this.heap[smallest].priority) {
                smallest = right;
            }

            if (smallest === index) break;
            [this.heap[smallest], this.heap[index]] =
                [this.heap[index], this.heap[smallest]];
            index = smallest;
        }
    }
}
```

---

## 10. Visualization Systems

### 10.1 Canvas Layer Stack (Z-Index)

```
Z-Index    Layer                    Purpose
────────   ─────                    ───────
10000      Modal overlays           Auth, premium, game-over screens
9999       Grain overlay            Static noise effect
1000       Mobile menu              Touch menu popup
450        viz-canvas               A* visualization, particles
400        draw-canvas              User path, electricity effects
0          MapLibre map             Base map tiles
```

### 10.2 RoundHistory System (Competitive Mode)

Stores and renders all 5 rounds simultaneously:

```javascript
const RoundHistory = {
    rounds: [], // Array of round data

    add(roundNumber, exploredEdges, optimalPath, userPath) {
        const colors = CONFIG.color.rounds[roundNumber - 1];
        this.rounds.push({
            roundNumber,
            exploredEdges: new Set(exploredEdges),
            optimalPath: [...optimalPath],
            userPath: [...userPath],
            color: colors,
            state: 'rising',   // 'rising' → 'settling' → 'idle'
            intensity: 0.15,
            timestamp: Date.now()
        });
    },

    update(deltaTime) {
        this.rounds.forEach(round => {
            switch (round.state) {
                case 'rising':
                    round.intensity += deltaTime * 0.85;
                    if (round.intensity >= 1.0) {
                        round.intensity = 1.0;
                        round.state = 'settling';
                    }
                    break;
                case 'settling':
                    round.intensity -= deltaTime * 0.35;
                    if (round.intensity <= CONFIG.electricity.idleIntensity) {
                        round.intensity = CONFIG.electricity.idleIntensity;
                        round.state = 'idle';
                    }
                    break;
                case 'idle':
                    // Maintain idle intensity
                    break;
            }
        });
    },

    render(ctx) {
        this.rounds.forEach(round => {
            // Render explored edges (dim)
            ctx.strokeStyle = applyIntensity(round.color.cool, round.intensity * 0.6);
            ctx.lineWidth = 2;
            renderEdges(ctx, round.exploredEdges);

            // Render optimal path (bright)
            ctx.strokeStyle = applyIntensity(round.color.hot, round.intensity);
            ctx.lineWidth = 4;
            renderPath(ctx, round.optimalPath);
        });
    }
};
```

**Round Colors:**
| Round | Color | RGB |
|-------|-------|-----|
| 1 | Cyan | (0, 230, 255) |
| 2 | Lime | (100, 255, 100) |
| 3 | Gold | (255, 220, 0) |
| 4 | Orange | (255, 100, 50) |
| 5 | Red | (255, 50, 50) |

### 10.3 ExplorerHistory / VisualizerHistory

Similar to RoundHistory but with additional "Living Network" effects:

```javascript
const LivingNetworkEffects = {
    // Global breathing effect
    breathePhase: 0,
    breatheSpeed: 0.3,
    breatheMin: 0.75,
    breatheMax: 1.0,

    // Ripple waves
    ripples: [],
    rippleInterval: 2000,
    rippleSpeed: 0.12,

    // Random sparks
    sparkChance: 0.025,
    sparks: [],

    update(deltaTime) {
        // Breathing
        this.breathePhase += deltaTime * this.breatheSpeed;
        const breathe = this.breatheMin +
            (Math.sin(this.breathePhase) + 1) / 2 *
            (this.breatheMax - this.breatheMin);

        // Ripples
        this.ripples.forEach(r => {
            r.radius += deltaTime * this.rippleSpeed * 100;
            r.opacity -= deltaTime * 0.5;
        });
        this.ripples = this.ripples.filter(r => r.opacity > 0);

        // Sparks
        if (Math.random() < this.sparkChance) {
            this.sparks.push(createRandomSpark());
        }
    }
};
```

### 10.4 AmbientViz (Particle System)

Pre-rendered sprite-based particles for performance:

```javascript
const AmbientViz = {
    sprites: {
        glowCyan: createGlowSprite('#00f0ff'),
        glowPink: createGlowSprite('#ff2a6d'),
        glowPurple: createGlowSprite('#b829dd'),
        glowGreen: createGlowSprite('#39ff14'),
        glowWhite: createGlowSprite('#ffffff'),
    },

    particles: new Array(16).fill(null).map(() => ({
        active: false,
        x: 0, y: 0,
        vx: 0, vy: 0,
        life: 0,
        sprite: null
    })),

    spawn(x, y, type) {
        const p = this.particles.find(p => !p.active);
        if (!p) return;

        p.active = true;
        p.x = x; p.y = y;
        p.life = 1.0;
        p.sprite = this.sprites[type];
        // Random velocity along network edges
        p.vx = (Math.random() - 0.5) * 20;
        p.vy = (Math.random() - 0.5) * 20;
    },

    update(deltaTime) {
        this.particles.forEach(p => {
            if (!p.active) return;
            p.x += p.vx * deltaTime;
            p.y += p.vy * deltaTime;
            p.life -= deltaTime * 0.5;
            if (p.life <= 0) p.active = false;
        });
    },

    render(ctx) {
        this.particles.forEach(p => {
            if (!p.active) return;
            ctx.globalAlpha = p.life;
            ctx.drawImage(p.sprite, p.x - 16, p.y - 16, 32, 32);
        });
        ctx.globalAlpha = 1.0;
    }
};
```

### 10.5 ElectricitySystem

Organic electricity effects on paths:

```javascript
const ElectricitySystem = {
    pulses: [],
    flickerPhase: 0,

    update(deltaTime) {
        this.flickerPhase += deltaTime * 25;

        // Update traveling pulses
        this.pulses.forEach(pulse => {
            pulse.progress += deltaTime * CONFIG.electricity.pulseSpeed;
        });
        this.pulses = this.pulses.filter(p => p.progress < 1.0);
    },

    calculateFlicker() {
        return 0.85 +
            Math.sin(this.flickerPhase) * 0.05 +
            Math.sin(this.flickerPhase * 0.28) * 0.05;
    },

    renderPulses(ctx, path) {
        this.pulses.forEach(pulse => {
            const pos = getPositionAlongPath(path, pulse.progress);
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, 6, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 255, 255, ${pulse.intensity})`;
            ctx.fill();
        });
    }
};
```

---

## 11. Scoring System

### 11.1 Efficiency Calculation

```javascript
function calculateAndShowScore() {
    const userDistance = GameState.userDistance;  // From userPathNodes
    const optimalDistance = calculateNodePathDistance(GameState.optimalPath);

    // Efficiency = how close user is to optimal (capped at 100%)
    const efficiency = Math.min(100, (optimalDistance / userDistance) * 100);

    // Round score = efficiency * 10 (max 1000)
    const roundScore = Math.round((efficiency / 100) * CONFIG.maxScore);

    // Update totals
    GameState.totalScore += roundScore;

    // Store for summary
    GameState.roundScores.push({
        round: GameState.currentRound,
        score: roundScore,
        efficiency: efficiency,
        userDistance: userDistance,
        optimalDistance: optimalDistance
    });
}
```

### 11.2 Scoring Examples

| User Distance | Optimal Distance | Efficiency | Round Score |
|---------------|------------------|------------|-------------|
| 1.0 km | 1.0 km | 100% | 1000 |
| 1.2 km | 1.0 km | 83.3% | 833 |
| 1.5 km | 1.0 km | 66.7% | 667 |
| 2.0 km | 1.0 km | 50% | 500 |
| 0.9 km | 1.0 km | 100% (capped) | 1000 |

---

## 12. Audio System

### 12.1 SoundEngine

```javascript
const SoundEngine = {
    ctx: null,              // AudioContext
    masterGain: null,       // Master volume node
    muted: false,

    buffers: {
        scanning: null,     // A* exploration sound
        found: null,        // Path found sound
        soundtrack: null,   // Background music
        click: null,        // UI click
        tick: null,         // UI hover
        success: null       // Achievement
    },

    activeSources: {},      // Currently playing sources

    async init() {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        this.masterGain = this.ctx.createGain();
        this.masterGain.connect(this.ctx.destination);

        // Load buffers
        this.buffers.scanning = await this.loadBuffer('Scanning.wav');
        this.buffers.found = await this.loadBuffer('Found1.wav');
        this.buffers.soundtrack = await this.loadBuffer('Pathfindr1.wav');
    },

    play(name, options = {}) {
        if (this.muted || !this.buffers[name]) return;

        const source = this.ctx.createBufferSource();
        source.buffer = this.buffers[name];

        const gainNode = this.ctx.createGain();
        gainNode.gain.value = options.volume || 1.0;

        source.connect(gainNode);
        gainNode.connect(this.masterGain);

        if (options.loop) source.loop = true;
        source.start(0);

        this.activeSources[name] = { source, gainNode };
    },

    stop(name) {
        if (this.activeSources[name]) {
            this.activeSources[name].source.stop();
            delete this.activeSources[name];
        }
    },

    toggleMute() {
        this.muted = !this.muted;
        this.masterGain.gain.value = this.muted ? 0 : 1;
        localStorage.setItem('pathfindr_muted', this.muted);
    }
};
```

### 12.2 Audio Triggers

| Event | Sound | Notes |
|-------|-------|-------|
| A* exploration starts | `scanning` | Loops until complete |
| Optimal path found | `found` | Single play |
| Game start | `soundtrack` | Loops continuously |
| UI button click | `click` | Short blip |
| Achievement unlocked | `success` | Celebration sound |

---

## 13. Authentication & User Management

### 13.1 PathfindrAuth Module

Located in `auth.js`:

```javascript
const PathfindrAuth = {
    client: null,           // Supabase client
    currentUser: null,      // User object
    currentProfile: null,   // Profile with callsign, purchases

    async init() {
        this.client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

        // Check for existing session
        const { data: { session } } = await this.client.auth.getSession();
        if (session) {
            this.currentUser = session.user;
            await this.loadProfile(session.user.id);
        }

        // Listen for auth changes
        this.client.auth.onAuthStateChange((event, session) => {
            if (session) {
                this.currentUser = session.user;
                this.loadProfile(session.user.id);
            } else {
                this.currentUser = null;
                this.currentProfile = null;
            }
            this.notifyListeners();
        });
    },

    async login(email, password) {
        const { data, error } = await this.client.auth.signInWithPassword({
            email, password
        });
        if (error) throw error;
        return data;
    },

    async signInWithProvider(provider) {
        // OAuth: google, apple, facebook, discord
        const { data, error } = await this.client.auth.signInWithOAuth({
            provider,
            options: {
                redirectTo: window.location.origin
            }
        });
        if (error) throw error;
        return data;
    },

    isLoggedIn() {
        return !!this.currentUser;
    },

    hasPurchased() {
        return this.currentProfile?.has_purchased || false;
    }
};
```

### 13.2 User Profile Schema

```sql
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id),
    callsign TEXT UNIQUE,
    has_purchased BOOLEAN DEFAULT FALSE,
    games_played INTEGER DEFAULT 0,
    total_score INTEGER DEFAULT 0,
    best_efficiency FLOAT DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 14. Payment System

### 14.1 PathfindrPayments Module

Located in `payments.js`:

```javascript
const PathfindrPayments = {
    platform: 'web',  // 'web' | 'ios' | 'android'

    async init() {
        if (window.Capacitor?.isNativePlatform()) {
            this.platform = Capacitor.getPlatform();
            await this.initRevenueCat();
        } else {
            await this.initStripe();
        }
    },

    async purchasePremium() {
        if (this.platform === 'web') {
            return this.purchaseStripe();
        } else {
            return this.purchaseRevenueCat();
        }
    },

    async purchaseStripe() {
        // Create checkout session via Edge Function
        const { data } = await fetch('/functions/v1/create-checkout', {
            method: 'POST',
            body: JSON.stringify({
                price_id: 'price_xxx',
                success_url: `${origin}?checkout=success`,
                cancel_url: `${origin}?checkout=cancel`
            })
        }).then(r => r.json());

        // Redirect to Stripe Checkout
        window.location.href = data.checkout_url;
    }
};
```

### 14.2 Price Points

| Platform | Price | Product |
|----------|-------|---------|
| Web (Stripe) | $2 | One-time unlock |
| iOS (App Store) | $1.99 | One-time unlock |
| Android (Play) | $1.99 | One-time unlock |

---

## 15. Challenge System

### 15.1 Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    CHALLENGE CREATION                        │
│  ─────────────────────────────────────────────────────────  │
│  GitHub Actions cron (hourly)                                │
│       ↓                                                      │
│  Edge Function: create-hourly-challenge                      │
│       ↓                                                      │
│  Supabase RPC: create_hourly_challenge()                     │
│       ↓                                                      │
│  challenges table (city, start/end coords, difficulty)       │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    CHALLENGE GAMEPLAY                        │
│  ─────────────────────────────────────────────────────────  │
│  1. updateChallengeButton() - Fetch active challenges        │
│  2. showChallengeList() - Display available challenges       │
│  3. showChallengeInfoScreen() - Pre-game info + leaderboard  │
│  4. beginChallengeGame() - Load city, place markers          │
│  5. (User draws path OR auto-visualization runs)             │
│  6. submitChallengeEntry() - Submit score to leaderboard     │
│  7. showChallengeComplete() - Show rank and results          │
└─────────────────────────────────────────────────────────────┘
```

### 15.2 Challenge Data Structure

```javascript
// Challenge from database
{
    id: UUID,
    city_name: "New York, NY",
    center_lat: 40.7128,
    center_lng: -74.0060,
    start_lat: 40.715,
    start_lng: -74.008,
    end_lat: 40.710,
    end_lng: -74.003,
    difficulty: "medium",
    challenge_type: "hourly",
    active_until: "2026-01-28T12:00:00Z",
    participant_count: 47,
    top_score: 98.5
}

// Challenge entry (user submission)
{
    challenge_id: UUID,
    user_id: UUID,
    username: "PlayerOne",
    efficiency: 94.2,
    duration_ms: 45000,
    submitted_at: timestamp
}
```

### 15.3 Hourly Challenge Creation

Edge Function at `supabase/functions/create-hourly-challenge/index.ts`:

```typescript
// Called every hour by GitHub Actions
// Every 3rd hour (0, 3, 6...) = global city
// Other hours = US city

const hour = new Date().getUTCHours();
const useGlobal = hour % 3 === 0;

const city = getRandomCity(useGlobal);
const { startLat, startLng, endLat, endLng } = generateStartEnd(city);
const difficulty = Math.random() < 0.2 ? 'easy' :
                   Math.random() < 0.85 ? 'medium' : 'hard';

await supabase.rpc('create_hourly_challenge', {
    p_city_name: city.name,
    p_start_lat: startLat,
    // ... etc
    p_hours_active: 36
});
```

### 15.4 Challenge State Management

```javascript
GameState.challengeState = {
    activeChallenge: null,      // Current challenge being played
    activeChallenges: [],       // All fetched active challenges
    userEntries: new Map(),     // Map<challengeId, entry>
    startTime: null,            // When user started current challenge
    optimalPath: null,          // A* result for submission
    optimalDistance: null
};
```

---

## 16. City Facts System

### 16.1 Data Flow

```
User enters city
       ↓
CityFacts.fetch(cityName)
       ↓
Check Supabase cache (city_facts table)
       ↓
If cached: return facts
If not cached:
       ↓
Edge Function: get-city-facts
       ↓
Fetch Wikipedia page for city
       ↓
Send to OpenAI gpt-4o-mini
       ↓
Extract 2-3 concise facts
       ↓
Cache in Supabase
       ↓
Return facts
```

### 16.2 Database Schema

```sql
CREATE TABLE city_facts (
    id SERIAL PRIMARY KEY,
    city_name TEXT UNIQUE NOT NULL,
    display_name TEXT,
    facts TEXT[] NOT NULL,
    cached_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_city_facts_name ON city_facts(city_name);
```

### 16.3 Testing Mode

```javascript
// In game.js
CityFacts.TESTING_MODE = true;  // Build up database during testing

// When true:
// - Every city triggers API call (if not cached)
// - Console logs track unique cities queried
// - Database builds up over time

// Set to false for production to reduce API costs
```

---

## 17. Supabase Backend

### 17.1 Edge Functions

| Function | Purpose | Trigger |
|----------|---------|---------|
| `get-city-facts` | Fetch/generate city facts | On-demand |
| `get-random-city` | Random city selection | On-demand |
| `create-hourly-challenge` | Create new challenge | Cron (hourly) |
| `create-checkout` | Stripe checkout session | On-demand |
| `stripe-webhook` | Handle Stripe events | Webhook |

### 17.2 Database Tables

```
auth.users           - Supabase auth (built-in)
profiles             - User profiles with callsign, purchases
cities               - City database with coordinates
city_facts           - Cached Wikipedia facts
user_scores          - Game scores and replays
city_leaderboards    - Per-city rankings
challenges           - Challenge definitions
challenge_entries    - Challenge submissions
achievements         - User achievements
analytics_events     - Event tracking
```

### 17.3 Key RPC Functions

```sql
-- Get active challenges
get_active_challenges(p_type, p_limit)

-- Submit challenge entry
submit_challenge_entry(p_challenge_id, p_user_id, p_username, p_efficiency, p_duration_ms)

-- Get challenge leaderboard
get_challenge_leaderboard(p_challenge_id, p_limit)

-- Create hourly challenge
create_hourly_challenge(p_city_name, p_center_lat, p_center_lng, ...)
```

---

## 18. Configuration & Constants

### 18.1 CONFIG Object

```javascript
CONFIG = {
    // Game Rules
    totalRounds: 5,
    maxScore: 1000,

    // Difficulty (max segment distance in km)
    segmentDistance: {
        easy: 0.5,      // 500m
        medium: 0.2,    // 200m
        hard: 0.1       // 100m
    },

    // Visualization Timing
    viz: {
        explorationDelay: 12,   // ms between batches
        batchSize: 4,           // nodes per frame
        pathTraceSpeed: 8,      // ms per segment
        heatDecay: 0.998,       // per-frame multiplier
        heatFloor: 0.6,         // minimum brightness
        maxParticles: 120,
        glowIntensity: 1.6
    },

    // Electricity Effects
    electricity: {
        pulseCount: 8,
        pulseSpeed: 0.003,
        flickerIntensity: 0.15,
        idleIntensity: 0.65,
        activeIntensity: 1.0
    },

    // Living Network (Explorer/Visualizer)
    livingNetwork: {
        breatheSpeed: 0.3,
        breatheMin: 0.75,
        breatheMax: 1.0,
        rippleInterval: 2000,
        sparkChance: 0.025
    },

    // Colors
    color: {
        rounds: [
            { r: 0, g: 230, b: 255, name: 'Cyan' },
            { r: 100, g: 255, b: 100, name: 'Lime' },
            { r: 255, g: 220, b: 0, name: 'Gold' },
            { r: 255, g: 100, b: 50, name: 'Orange' },
            { r: 255, g: 50, b: 50, name: 'Red' }
        ],
        userPath: { r: 255, g: 255, b: 255 },
        ambient: {
            core: { r: 80, g: 75, b: 70 },
            mid: { r: 60, g: 55, b: 55 },
            outer: { r: 45, g: 42, b: 45 }
        }
    },

    // API Endpoints
    overpassServers: [
        'https://overpass-api.de/api/interpreter',
        'https://overpass.kumi.systems/api/interpreter',
        'https://maps.mail.ru/osm/tools/overpass/api/interpreter'
    ]
};
```

---

## 19. Performance Optimizations

### 19.1 ScreenCoordCache

Caches expensive `map.project()` calls:

```javascript
const ScreenCoordCache = {
    cache: new Map(),
    mapVersion: 0,

    get(edge) {
        const key = `${edge.from}-${edge.to}`;
        if (this.cache.has(key)) {
            return this.cache.get(key);
        }

        const fromNode = GameState.nodes.get(edge.from);
        const toNode = GameState.nodes.get(edge.to);
        const coords = {
            from: GameState.map.project([fromNode.lng, fromNode.lat]),
            to: GameState.map.project([toNode.lng, toNode.lat])
        };

        this.cache.set(key, coords);
        return coords;
    },

    invalidate() {
        this.cache.clear();
        this.mapVersion++;
    }
};

// Invalidate on map movement
map.on('moveend', () => ScreenCoordCache.invalidate());
map.on('zoomend', () => ScreenCoordCache.invalidate());
```

### 19.2 Batched Rendering

```javascript
// BAD: Individual stroke per edge
edges.forEach(edge => {
    ctx.beginPath();
    ctx.moveTo(edge.from.x, edge.from.y);
    ctx.lineTo(edge.to.x, edge.to.y);
    ctx.stroke();  // Expensive!
});

// GOOD: Batch by style
ctx.beginPath();
edges.forEach(edge => {
    ctx.moveTo(edge.from.x, edge.from.y);
    ctx.lineTo(edge.to.x, edge.to.y);
});
ctx.stroke();  // Single draw call
```

### 19.3 Particle Pool

Fixed-size pool prevents allocation churn:

```javascript
// Pre-allocate particle pool
const particles = new Array(MAX_PARTICLES).fill(null)
    .map(() => ({ active: false, x: 0, y: 0 }));

// Spawn by finding inactive particle
function spawn() {
    const p = particles.find(p => !p.active);
    if (p) {
        p.active = true;
        // Initialize p...
    }
}
```

### 19.4 Heat Decay

Multiplicative decay is O(n) per frame:

```javascript
// Efficient: multiply all values
const decay = CONFIG.viz.heatDecay;  // 0.998
edgeHeat.forEach((value, key) => {
    edgeHeat.set(key, Math.max(value * decay, CONFIG.viz.heatFloor));
});
```

---

## 20. Mobile Support

### 20.1 Platform Detection

```javascript
function initMobileBrowserDetection() {
    const ua = navigator.userAgent;

    const isMobile = /iPad|iPhone|iPod|Android/.test(ua);
    const isIOSSafari = /iPad|iPhone|iPod/.test(ua) && /Safari/.test(ua);
    const isAndroid = /Android/.test(ua);
    const hasBottomBar = isIOSSafari || (isAndroid && /Chrome/.test(ua));

    if (isMobile) document.body.classList.add('mobile-browser');
    if (hasBottomBar) document.body.classList.add('mobile-bottom-bar');

    // Dynamic viewport height
    function setVh() {
        const vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--vh', `${vh}px`);
    }
    setVh();
    window.addEventListener('resize', setVh);
}
```

### 20.2 Touch Handling

```javascript
// MapLibre handles multi-touch natively
map.touchZoomRotate.enable();
map.touchPitch.enable();
map.dragPan.enable();

// Drawing on touch
canvas.addEventListener('touchstart', handleTouchStart);
canvas.addEventListener('touchmove', handleTouchMove);
canvas.addEventListener('touchend', stopDrawing);

function handleTouchMove(e) {
    if (e.touches.length === 1) {
        // Single touch = draw
        const touch = e.touches[0];
        addPointToUserPath(touch.lat, touch.lng);
    }
    // Multi-touch = let map handle zoom/rotate
}
```

### 20.3 Capacitor (Native Apps)

```javascript
// Deep link handling for OAuth
App.addListener('appUrlOpen', (event) => {
    if (event.url.includes('pathfindr://auth')) {
        // Parse tokens from URL
        const hash = new URL(event.url).hash;
        PathfindrAuth.handleDeepLink(hash);
    }
});

// Haptic feedback
const GameHaptics = {
    roundEnd() {
        if (Capacitor.isNativePlatform()) {
            Haptics.impact({ style: ImpactStyle.Medium });
        }
    }
};
```

---

## 21. Known Issues & Technical Debt

### 21.1 Challenge Mode Issues ⚠️

**Current Status:** Challenge mode has been significantly fixed but may still have issues.

**Recently Fixed (Jan 2026):**
- ✅ Menu not hiding when starting challenge (`hideModeSelector()` added)
- ✅ Map not positioning correctly (switched to `jumpTo()`)
- ✅ Visualization starting before map rendered (500ms delay added)
- ✅ `activeChallenge` not set in `beginChallengeGame()`
- ✅ Non-curated cities causing Overpass failures (cleanup migration added)
- ✅ Undefined `resetToMenu` reference (replaced with `showModeSelector`)
- ✅ Now using curated city pools for reliable Overpass coverage

**Potentially Remaining Issues:**
- Challenges may not be created consistently by cron job
- User may see "No active challenges" if cron hasn't run
- Auth timing issues (`updateChallengeButton()` may run before auth ready)

**Challenge Flow Debug Points:**
1. **Cron Job:** `.github/workflows/hourly-challenge.yml` runs hourly
2. **Edge Function:** `supabase/functions/create-hourly-challenge/index.ts`
3. **Database RPC:** `create_hourly_challenge()` in migrations
4. **Frontend Fetch:** `fetchActiveChallenges()` at `game.js:10137`
5. **UI Update:** `updateChallengeButton()` at `game.js:10034`
6. **Game Start:** `beginChallengeGame()` at `game.js:10483`

**How to Debug:**
```javascript
// Check if challenges exist in database
// In browser console:
await PathfindrAuth.client.rpc('get_active_challenges', { p_type: 'hourly', p_limit: 10 })

// Check GameState
console.log(GameState.challengeState.activeChallenges)
```

### 21.2 Performance Concerns

| Issue | Location | Severity |
|-------|----------|----------|
| `findNearestNode()` is O(n) | `game.js:~6000` | Medium |
| No quadtree spatial indexing | - | Medium |
| Large WAV files (~50MB) | Audio files | Low |
| No edge culling (viewport) | Visualization | Low |

### 21.3 Technical Debt

1. **Single 12,500 line file** - `game.js` should be modularized
2. **No TypeScript** - Type safety would help
3. **No automated tests** - Unit tests needed
4. **Hardcoded strings** - Should use i18n
5. **Mixed concerns** - UI, logic, and rendering intertwined

---

## 22. Expansion Points

### 22.1 Easy to Add (Modular)

| Feature | Where to Add | Complexity |
|---------|--------------|------------|
| New city pools | `CONFIG.usCities`, `CONFIG.globalCities` | Low |
| New round colors | `CONFIG.color.rounds` | Low |
| New difficulty levels | `CONFIG.segmentDistance` | Low |
| New sounds | `SoundEngine.buffers` | Low |
| New achievements | `PathfindrAchievements` | Medium |

### 22.2 Requires Refactoring

| Feature | Challenge | Recommendation |
|---------|-----------|----------------|
| Multiplayer | Real-time sync needed | WebSocket + Supabase Realtime |
| Terrain costs | Different road weights | Modify `processRoadData()` |
| Time trials | Timer integration | Add to `GameState`, new mode |
| Replay system | Path serialization | Already partially implemented |
| Custom themes | CSS variables | Extend CONFIG.color |

### 22.3 Backend Changes Needed

| Feature | Database Change | Edge Function |
|---------|-----------------|---------------|
| Daily challenges | Add `challenge_type='daily'` | Modify create function |
| Seasons/Events | New `seasons` table | Seasonal challenge logic |
| Friends/Social | New `friendships` table | Friend API endpoints |
| Achievements v2 | Expand `achievements` | Achievement triggers |

---

## Appendix A: Quick Reference

### Game Phases
```
MENU → LOADING → PLAYING → VISUALIZING → RESULTS → (repeat or MENU)
```

### Key Functions by Purpose

**Game Flow:**
- `showModeSelector()` - Display mode selection
- `startCompetitiveGame()` - Begin competitive mode
- `nextRound()` - Advance to next round
- `showGameOverScreen()` - End game display

**Road Network:**
- `loadRoadNetwork()` - Fetch from Overpass
- `processRoadData()` - Build graph
- `findNearestNode()` - Spatial query

**User Input:**
- `handlePathClick()` - Process map click
- `addPointToUserPath()` - Snap and route
- `redrawUserPath()` - Render with effects

**A* Algorithm:**
- `runAStar()` - Full pathfinding
- `findShortestPathBetween()` - Micro-pathfinding
- `runEpicVisualization()` - Animated display

**Scoring:**
- `calculateAndShowScore()` - Compute efficiency
- `showResultsOverlay()` - Display results

### CSS Color Variables
```css
--neon-cyan: #41d9d9
--neon-pink: #ff6b9d
--neon-orange: #ff8c69
--sunset-gold: #ffd866
--void: #0d0a14
```

---

*Document generated for Pathfindr v0.01 Alpha. Last updated January 2026.*
