# Scaling Strategy: Bigger Map Bounds

> **Status:** Planning
> **Priority:** Feature Request
> **Related:** Bike/walk paths, larger play areas

---

## Overview

Players have requested larger map bounds for gameplay. This document outlines the technical challenges and solutions for scaling from current viewport sizes (~2,000 nodes) to significantly larger areas (25,000-100,000+ nodes).

---

## Current Limitations

### What We Have Now

| Metric | Current | With 4x Bounds | With Bike/Walk Paths |
|--------|---------|----------------|----------------------|
| Typical nodes | 1,000-3,000 | 4,000-12,000 | 10,000-30,000 |
| Edges | 2,000-6,000 | 8,000-24,000 | 20,000-60,000 |
| Overpass query time | 1-3s | 5-15s | 10-30s |
| Graph build time | <100ms | 200-500ms | 500ms-2s |
| Frame render time | 2-5ms | 8-20ms | 20-50ms |

### Current Optimizations Already In Place

1. **Viewport Culling** - Skip edges outside screen bounds
2. **ScreenCoordCache** - Cache map projections, invalidate on move
3. **Batched Rendering** - Single `stroke()` call per layer
4. **Largest Component Filter** - Only use connected road network

---

## Scaling Solutions

### Tier 1: Quick Wins (1-2 days each)

#### 1.1 Spatial Grid for Viewport Culling

**Problem:** Currently checking every edge against viewport bounds is O(n).

**Solution:** Divide map into grid cells, only check edges in visible cells.

```
┌─────┬─────┬─────┬─────┐
│     │     │░░░░░│░░░░░│  ░ = visible cells
├─────┼─────┼░░░░░┼░░░░░│
│     │     │░░░░░│░░░░░│  Only iterate edges
├─────┼─────┼─────┼─────│  in these 4 cells
│     │     │     │     │
└─────┴─────┴─────┴─────┘
```

**Impact:** O(n) → O(visible cells) for viewport queries
**Effort:** ~50-100 lines of code
**Files:** `game.js` - new `SpatialGrid` module

---

#### 1.2 Reduce Rendering Layers

**Problem:** Drawing 3-4 glow layers per frame multiplies draw calls.

**Current:**
```
Layer 1: Outer glow (6px, 8% opacity)
Layer 2: Mid glow (3px, 15% opacity)
Layer 3: Core line (1px, 35% opacity)
= 3 full iterations over visible edges
```

**Solution:** Pre-render road glow to offscreen canvas, composite once.

**Impact:** 3x fewer edge iterations per frame
**Effort:** ~30-50 lines
**Files:** `game.js` - ambient rendering functions

---

#### 1.3 Edge Simplification

**Problem:** Straight roads stored as many small segments.

```
Before: A──B──C──D──E  (4 edges)
After:  A───────────E  (1 edge, if roughly straight)
```

**Solution:** Douglas-Peucker or Visvalingam algorithm during `processRoadData()`.

**Impact:** 30-50% fewer edges with no visual difference
**Effort:** ~50-80 lines
**Files:** `game.js` - `processRoadData()`

---

### Tier 2: Medium Effort (3-5 days each)

#### 2.1 Level of Detail (LOD)

**Problem:** At zoomed-out views, small roads aren't visible anyway.

**Solution:** Filter roads by type based on zoom level.

| Zoom Level | Roads Shown | Approx. Reduction |
|------------|-------------|-------------------|
| < 12 | Highways, primary only | 80% fewer edges |
| 12-14 | + Secondary, tertiary | 50% fewer edges |
| 14-16 | + Residential | 20% fewer edges |
| 16+ | All roads | Full detail |

**Requires:** Store `roadClass` from Overpass `highway` tag.

**Impact:** Dramatic reduction at low zoom
**Effort:** ~100-150 lines
**Files:** `game.js` - `processRoadData()`, rendering functions

---

#### 2.2 Web Worker for Graph Processing

**Problem:** Large Overpass responses freeze UI during processing.

**Solution:** Offload `processRoadData()` to background thread.

```
Main Thread              Worker Thread
    │                        │
    ├─── fetch Overpass ────►│
    │    (show loading)      ├─── parse JSON
    │                        ├─── build nodes
    │                        ├─── build edges
    │◄── receive graph ──────┤
    │    (hide loading)      │
```

**Impact:** No UI freeze during load
**Effort:** ~150-200 lines + new worker file
**Files:** New `road-worker.js`, modify `game.js` loading

---

#### 2.3 Quadtree for Click Snapping

**Problem:** `findNearestNode()` is O(n), noticeable at 25k+ nodes.

**Solution:** Quadtree spatial index for point queries.

```
        ┌───────────────────┐
        │    ┌─────┬─────┐  │
        │    │  ●  │     │  │  Query: O(log n)
        │    ├─────┼─────┤  │  Insert: O(log n)
        │    │     │  ●  │  │  Build: O(n log n)
        │    └─────┴─────┘  │
        └───────────────────┘
```

**Impact:** O(n) → O(log n) for nearest-node queries
**Effort:** ~100-150 lines
**Files:** `game.js` - new `Quadtree` module, modify `findNearestNode()`

---

### Tier 3: Significant Changes (1-2 weeks each)

#### 3.1 WebGL Road Rendering

**Problem:** Canvas 2D struggles above 30k edges at 60fps.

**Solution:** GPU-accelerated line rendering.

| Renderer | 10k edges | 50k edges | 100k edges |
|----------|-----------|-----------|------------|
| Canvas 2D | 5ms | 25ms | 50ms+ |
| WebGL | 1ms | 2ms | 4ms |

**Approach:**
1. Upload edge vertices to GPU buffer (once per load)
2. Update projection uniform on camera move
3. Single draw call renders all edges

**Impact:** 10-20x faster rendering
**Effort:** ~300-500 lines
**Files:** New `webgl-roads.js`, integrate with existing WebGL scaffolding

---

#### 3.2 Chunked/Tiled Loading

**Problem:** Can't load infinite map at once.

**Solution:** Load road data in tiles, stream as player moves.

```
┌─────┬─────┬─────┐
│     │loaded│     │
├─────┼─────┼─────┤
│loaded│ ★  │load │  ★ = player viewport
├─────┼─────┼─────┤
│     │load │     │  load = loading now
└─────┴─────┴─────┘
```

**Components:**
- Tile cache with LRU eviction
- Background prefetching
- Seamless tile stitching
- Graph merging across tile boundaries

**Impact:** Enables arbitrarily large play areas
**Effort:** ~500-800 lines
**Files:** New `tile-loader.js`, significant changes to graph management

---

#### 3.3 Road Network Caching (IndexedDB)

**Problem:** Reloading same city fetches from Overpass every time.

**Solution:** Cache processed road data locally.

```
First visit:  Overpass → Process → IndexedDB → Render
Return visit: IndexedDB → Render (skip network entirely)
```

**Cache Strategy:**
- Key by city + bounds + road types
- Expire after 7-30 days
- ~1-5MB per city
- Max cache size ~100MB

**Impact:** Instant load for visited cities
**Effort:** ~150-200 lines
**Files:** New `road-cache.js`, modify loading flow

---

## Adding Bike/Walk Paths

### Current Overpass Filter

```
["highway"]["highway"!~"footway|path|steps|pedestrian|cycleway|service|track"]
```

### Proposed: Configurable Road Types

| Mode | Highway Types | Use Case |
|------|---------------|----------|
| **Driving** (current) | primary, secondary, tertiary, residential | Car routes |
| **Cycling** | + cycleway, path, track | Bike-friendly |
| **Walking** | + footway, pedestrian, steps | Full pedestrian |
| **All** | Everything | Maximum coverage |

### UI Consideration

Add toggle or mode selector:
- "Roads Only" (default, current behavior)
- "Include Bike Paths"
- "Include Walking Paths"

Different gameplay feel - walking paths create more direct routes through parks, campuses, etc.

---

## Implementation Priority

### Phase 1: Enable Larger Bounds (Before v1.0)

| Task | Priority | Effort | Dependency |
|------|----------|--------|------------|
| Spatial grid culling | High | Low | None |
| Edge simplification | High | Low | None |
| Reduce render layers | Medium | Low | None |
| LOD by zoom | Medium | Medium | Road class data |

### Phase 2: Performance at Scale (v1.x)

| Task | Priority | Effort | Dependency |
|------|----------|--------|------------|
| Web Worker processing | High | Medium | None |
| Quadtree for clicking | Medium | Medium | None |
| IndexedDB caching | Medium | Medium | None |

### Phase 3: Unlimited Scale (v2.0+)

| Task | Priority | Effort | Dependency |
|------|----------|--------|------------|
| WebGL rendering | High | High | Phase 1 complete |
| Chunked loading | Medium | High | WebGL helps |

---

## Metrics to Track

When implementing, measure:

1. **Frame time** - Target <16ms for 60fps
2. **Load time** - Time from city select to playable
3. **Memory usage** - Track node/edge count vs RAM
4. **Click latency** - Time from click to path update

### Benchmarking Cities

| City | Nodes (est.) | Good Test For |
|------|--------------|---------------|
| Small town | 500-1,000 | Baseline |
| Medium city (current) | 2,000-3,000 | Current perf |
| Large downtown | 5,000-8,000 | First stress test |
| Manhattan | 15,000-25,000 | Scale testing |
| With bike paths | 2-3x above | Path type impact |

---

## Open Questions

1. **Gameplay balance** - Do larger maps need longer time limits?
2. **Difficulty scaling** - Should segment distance scale with map size?
3. **Scoring fairness** - Larger maps = longer optimal paths = more room for error?
4. **Mobile performance** - What's the ceiling on mobile devices?
5. **Overpass rate limits** - Will larger queries trigger throttling?

---

## Related Documents

- `ARCHITECTURE.md` - Current system design
- `CLAUDE.md` - Development guidelines
- Future: `BIKE_WALK_PATHS.md` - Detailed path type implementation

---

*Document created: January 2026*
*Last updated: January 2026*
