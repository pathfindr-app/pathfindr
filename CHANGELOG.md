# Changelog

## 2026-01-05 - Performance Optimization & Coordinate Caching

### Performance Improvements

#### Screen Coordinate Caching System
Added `ScreenCoordCache` to eliminate redundant `latLngToContainerPoint` calculations:
- **Before:** ~8,000+ coordinate conversions per frame during visualization
- **After:** Coordinates cached and reused, only recalculated when map moves/zooms

The cache stores:
- Pre-calculated screen coordinates for all road edges
- Pre-computed edge keys for heat map lookups

Cache invalidation triggers:
- Map pan (move event)
- Map zoom
- New road data loaded

#### Path Animation Batching
Optimized the optimal path tracing animation:
- **Before:** Sequential 15ms delay per node (500 nodes = 7.5 seconds)
- **After:** Batched updates targeting ~1.5 second animation regardless of path length

### Files Modified
- `game.js`: Added ScreenCoordCache system, updated drawAmbientRoads and renderVisualization to use cached coordinates

### Technical Details
- `ScreenCoordCache` object added at line ~1556
- Cache invalidation added to map move/zoom handlers
- `drawAmbientRoads()` now uses `ScreenCoordCache.getEdges()`
- `renderVisualization()` edge loop uses cached coordinates and edgeKeys
