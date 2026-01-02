# A* Pathfinding Challenge - Technical Documentation

## Overview

An interactive web-based game where players draw routes on a real map and compete against the A* pathfinding algorithm. Players try to find the shortest path between two points, then watch the algorithm visualize its search and compare results.

## Game Flow

1. **Load** - Fetches road network data from OpenStreetMap via Overpass API
2. **Instructions** - Shows how to play overlay
3. **Play** - Random start/end points placed; player draws their route
4. **Submit** - Player's route is snapped to roads; A* visualization runs
5. **Score** - Compare distances, calculate efficiency, show results
6. **Repeat** - 5 rounds total, then final score

---

## File Structure

```
Astar/
├── index.html      # Main HTML structure
├── styles.css      # All styling (dark theme, animations, layout)
├── game.js         # All game logic (~1400 lines)
└── DOCUMENTATION.md
```

---

## Technology Stack

- **Leaflet.js** (v1.9.4) - Map rendering and interaction
- **OpenStreetMap** - Tile layer for map visuals
- **Overpass API** - Road network data (nodes and ways)
- **Nominatim API** - Geocoding for location search
- **Canvas API** - Custom visualization rendering

---

## Architecture

### HTML Structure (`index.html`)

```
#app
├── #header (score display, round counter)
└── #game-container
    ├── #map-container
    │   ├── #map (Leaflet map)
    │   ├── #draw-canvas (user drawing layer, z-index: 400)
    │   ├── #viz-canvas (A* visualization layer, z-index: 450)
    │   └── Overlays (loading, instructions, results, gameover)
    └── #sidebar (location search, route info, controls, legend)
```

### Key CSS Classes

- `.overlay` / `.overlay.hidden` - Modal overlays
- `.drawing-ready` - Canvas accepts clicks but not actively drawing
- `.drawing-active` - User is currently drawing (map dragging disabled)
- `.custom-marker` - Leaflet marker styling (though now using circleMarker)

### JavaScript Architecture (`game.js`)

#### Global Objects

**CONFIG** - All configuration constants
```javascript
{
  defaultLocation: { lat, lng, zoom, name },
  tileUrl: string,
  totalRounds: 5,
  minRoutePoints: 5,
  viz: {
    explorationDelay: 6,    // ms between batches
    batchSize: 3,           // nodes per batch
    nodeGlowRadius: 18,
    edgeWidth: 4,
    heatDecay: 0.992,       // per-frame multiplier
    pulseSpeed: 0.06,
    pathTraceSpeed: 12      // ms per segment
  },
  heatColors: [...],        // gradient from white to purple
  colors: { userRoute, optimal, start, end },
  maxScore: 1000,
  overpassUrl: string,
  nominatimUrl: string
}
```

**GameState** - All runtime state
```javascript
{
  // Leaflet
  map: L.Map,

  // Canvases
  drawCanvas, drawCtx,
  vizCanvas, vizCtx,

  // Road network (from Overpass)
  nodes: Map<nodeId, {lat, lng}>,
  edges: Map<nodeId, [{neighbor, weight}]>,
  edgeList: [{from, to, fromPos, toPos}],

  // Current round
  startNode, endNode,
  startMarker, endMarker,     // L.circleMarker
  startLabel, endLabel,       // L.marker with divIcon

  // User drawing
  isDrawing: boolean,
  userPath: [{lat, lng}],
  snappedUserPath: [nodeId],  // after road snapping

  // A* results
  exploredNodes: [nodeId],
  optimalPath: [nodeId],

  // Visualization state
  vizState: {
    active: boolean,
    exploredSet: Set,
    nodeHeat: Map<nodeId, float>,    // 0-1
    edgeHeat: Map<edgeKey, float>,   // "min-max" format
    particles: [{lat, lng, vx, vy, life, decay, size, type}],
    phase: 'idle'|'exploring'|'path'|'complete',
    pathProgress: number,
    pulsePhase: number,
    animationId: number
  },

  // Leaflet layers
  exploredLayer, optimalLayer, userPathLayer,

  // Game progress
  currentRound: 1-5,
  totalScore: number,
  isLoading: boolean,
  gameStarted: boolean,
  canDraw: boolean
}
```

---

## Core Systems

### 1. Road Network Loading

**Function:** `loadRoadNetwork(location)`

Queries Overpass API for road ways within map bounds:
```
way["highway"]["highway"!~"footway|path|steps|pedestrian|cycleway|service|track"]
```

**Function:** `processRoadData(data)`

Builds graph structure:
- `nodes` Map: nodeId → {lat, lng}
- `edges` Map: nodeId → [{neighbor, weight}] (bidirectional)
- `edgeList` Array: for visualization iteration

Edge weights use `haversineDistance()` for geographic accuracy.

### 2. Endpoint Selection

**Function:** `selectRandomEndpoints()`

- Filters nodes to ~70% of visible map area (avoids edge nodes)
- Randomly selects start/end with distance constraints (0.15-0.8 km)
- Retries with relaxed constraints if needed
- Calls `placeMarkers()` after fitting map bounds

**Function:** `placeMarkers()`

Uses `L.circleMarker` (not divIcon) for reliable positioning:
- Green circle (radius 20) for start
- Red circle (radius 20) for end
- Small divIcon labels ("S" / "E") centered on each

### 3. User Drawing

**Input Handling:**
- Left mouse: Draw route
- Middle mouse: Pan map
- Scroll wheel: Zoom (passed through to Leaflet)
- Touch: Supported via touch events

**Function:** `startDrawing(e)` / `draw(e)` / `stopDrawing()`

- Only left click (button 0) triggers drawing
- Disables map dragging during active draw
- Samples points with 5m minimum spacing
- Auto-starts from start node position

**Function:** `redrawUserPath()`

Draws orange glowing line on draw-canvas.

### 4. Road Snapping (Scoring)

**Function:** `snapPathToRoads(path)` → [nodeId]

1. For each drawn point, find nearest graph node
2. Remove consecutive duplicates
3. Ensure path starts at startNode, ends at endNode
4. For each pair of consecutive nodes, find shortest path between them
5. Return complete node sequence

**Function:** `findNearestNode(lat, lng)` → nodeId

Iterates all nodes, returns closest by haversine distance.

**Function:** `findShortestPathBetween(from, to)` → [nodeId]

Mini A* with 500 iteration limit. Returns direct path if adjacent.

**Function:** `calculateSnappedPathDistance(nodeIds)` → km

Sums haversine distances between consecutive nodes.

### 5. A* Algorithm

**Function:** `runAStar(startNode, endNode)` → {path, explored}

Standard A* implementation:
- Priority queue via `MinHeap` class
- `gScore`: actual distance from start
- `fScore`: gScore + heuristic
- `heuristic()`: straight-line haversine distance (admissible)
- Returns both optimal path and exploration order

**Class:** `MinHeap`

Binary heap with `insert()`, `extractMin()`, `bubbleUp()`, `bubbleDown()`.

### 6. Visualization System

**Function:** `runEpicVisualization(explored, path)`

Async function that orchestrates the animation:
1. **Exploring phase**: Iterate explored nodes with delays
   - Set heat to 1.0 for each node/edge
   - Spawn particles at each node
2. **Path phase**: Trace optimal path node by node
   - Spawn particles along path
3. **Complete phase**: Final particle burst at destination

**Function:** `startRenderLoop()` / `renderVisualization()`

RequestAnimationFrame loop that:
1. Clears canvas (map visible underneath)
2. Decays all heat values by `heatDecay`
3. Draws edges with multi-layer neon glow
4. Draws nodes with pulsing radial gradients
5. Draws optimal path (if in path/complete phase)
6. Updates and draws particles

**Heat Color System:**

`getHeatColor(heat)` interpolates between:
```
White → Cyan → Light Blue → Blue → Purple → Dark Purple → Very Dark
```

**Optimal Path Rendering:**

- 5 glow layers (40px blur down to 4px)
- White core line
- 3 animated energy pulses traveling along path (when complete)
- Leading point glow (during path drawing)

### 7. Scoring

**Function:** `calculateAndShowScore()`

```javascript
efficiency = min(100, (optimalDistance / userDistance) * 100)
roundScore = efficiency * 10  // max 1000 per round
```

User's path is road-snapped before comparison, so distances are always comparable.

---

## Known Issues / Limitations

1. **Location search CORS** - Nominatim API may block requests from `file://` protocol. Works when served via HTTP.

2. **Performance with large networks** - Cities with dense road networks may have thousands of nodes. Consider:
   - Spatial indexing (quadtree) for `findNearestNode()`
   - Limiting edge rendering to visible viewport
   - Web Workers for A* computation

3. **Mobile UX** - Touch drawing works but could be improved with larger touch targets.

4. **No sound effects** - Currently silent.

---

## Potential Improvements

### Performance
- [ ] Implement quadtree for spatial queries
- [ ] Only render edges within viewport bounds
- [ ] Throttle particle count on slower devices
- [ ] Use OffscreenCanvas or Web Workers

### Sound Effects
- [ ] Background ambient music
- [ ] Sound for each explored node (pitch based on heat?)
- [ ] Path tracing sound (rising tone)
- [ ] Success/failure jingles
- [ ] Drawing feedback sounds

### UI Improvements
- [ ] Better mobile responsive design
- [ ] Minimap showing full route
- [ ] Difficulty settings (change distance range)
- [ ] High score persistence (localStorage)
- [ ] Share score functionality
- [ ] Tutorial/onboarding flow
- [ ] Keyboard shortcuts
- [ ] Accessibility improvements

### Gameplay
- [ ] Multiple difficulty levels
- [ ] Time pressure mode
- [ ] Obstacles/terrain that affects path cost
- [ ] Multiplayer race mode
- [ ] Daily challenges with fixed seeds

---

## API Dependencies

### Overpass API
- **Endpoint:** `https://overpass-api.de/api/interpreter`
- **Method:** POST
- **Rate limits:** Be respectful, cache when possible

### Nominatim API
- **Endpoint:** `https://nominatim.openstreetmap.org/search`
- **Required header:** `User-Agent`
- **Rate limits:** 1 request/second max

### Leaflet CDN
- **CSS:** `https://unpkg.com/leaflet@1.9.4/dist/leaflet.css`
- **JS:** `https://unpkg.com/leaflet@1.9.4/dist/leaflet.js`

---

## Running Locally

Due to CORS restrictions, serve via HTTP:

```bash
# Python 3
python -m http.server 8000

# Node.js
npx serve .

# Then open http://localhost:8000
```

---

## Code Style Notes

- No build tools/bundlers - vanilla JS
- Single file for all JS logic
- CSS custom properties for theming
- ES6+ features (Maps, Sets, async/await, arrow functions)
- No external dependencies except Leaflet

---

## Contact / Handoff Notes

This documentation was generated to facilitate handoff to another AI or developer. The codebase is straightforward vanilla JS. Main areas that need attention:

1. **Performance** - `findNearestNode()` is O(n) on every drawn point
2. **Sound** - No audio system exists yet
3. **UI Polish** - Functional but could use refinement

Feel free to refactor as needed. The core game loop and scoring system are solid.
