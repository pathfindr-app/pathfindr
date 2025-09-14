# Online Maps Pathfinding Visualization System

## Overview

This system replaces the Unity LineRenderer-based pathfinding visualization with Online Maps native Drawing API for automatic view synchronization (zoom/pan/rotate).

**Key Benefits:**
- ✅ **Automatic View Sync**: Lines follow map movements perfectly
- ✅ **Geographic Precision**: Uses coordinates directly, no conversion loss
- ✅ **Better Performance**: Native Online Maps rendering pipeline
- ✅ **Shader Support**: Custom effects via TilesetPBRDrawingElement
- ✅ **Backward Compatible**: Fallback to legacy LineRenderer system

## Architecture

### Core Components

1. **OnlineMapsPathVisualizer** - Replaces PathSegmentRenderer
   - Creates OnlineMapsDrawingLine objects instead of Unity LineRenderers
   - Reads from PathSegmentTimeline for step-by-step animation
   - Uses geographic coordinates directly

2. **PathSegmentTimeline** - Unchanged, mirrors React's waypoint system
   - Builds timeline of path segments with timestamps
   - Supports real-time execution + replay with scrubbing

3. **AlgorithmStepExecutor** - Enhanced to support both systems
   - Prefers OnlineMapsPathVisualizer over legacy PathSegmentRenderer
   - Auto-creates components and connects timeline

### Integration Flow

```
AlgorithmStepExecutor → PathSegmentTimeline → OnlineMapsPathVisualizer → OnlineMapsDrawingLine
```

1. **Algorithm Execution**: A* runs step-by-step at 100 steps/second
2. **Timeline Building**: Each algorithm step adds segments to timeline
3. **Visualization**: OnlineMapsPathVisualizer converts segments to drawing lines
4. **Rendering**: Online Maps handles geographic positioning and view sync

## Setup Instructions

### Option 1: Automatic Setup (Recommended)

1. Add `AlgorithmStepExecutor` component to any GameObject
2. System automatically creates `OnlineMapsPathVisualizer` and `PathSegmentTimeline`
3. Components auto-connect at runtime

### Option 2: Manual Setup

1. Create GameObject with these components:
   - `AlgorithmStepExecutor`
   - `PathSegmentTimeline`
   - `OnlineMapsPathVisualizer`

2. Connect references in AlgorithmStepExecutor:
   - Set `timeline` reference
   - Set `pathVisualizer` reference

3. Configure OnlineMapsPathVisualizer:
   - Set colors: `explorationColor`, `routeColor`, `playerRouteColor`
   - Set line widths: `explorationLineWidth`, `routeLineWidth`
   - Adjust `maxActiveSegments` for performance

## Testing

### Simple Drawing API Test

Add `SimpleDrawingAPITest` component to test basic Drawing API functionality:

```csharp
// Creates cross pattern of lines in NYC
SimpleDrawingAPITest tester = gameObject.AddComponent<SimpleDrawingAPITest>();
```

**Context Menu Options:**
- 🧪 Create Test Lines
- 🗑️ Clear Test Lines
- 👁️ Toggle Line Visibility
- 🎨 Randomize Colors
- 📍 Center on NYC

### Complete Visualization Test

Add `PathfindingVisualizationTester` for comprehensive testing:

```csharp
// Tests entire pathfinding visualization pipeline
PathfindingVisualizationTester tester = gameObject.AddComponent<PathfindingVisualizationTester>();
```

**Test Coverage:**
1. Component verification and connections
2. Basic Drawing API functionality
3. Timeline integration
4. Coordinate system accuracy
5. Full algorithm execution with visualization

### Switching Between Systems

**Switch to Drawing API (New):**
```csharp
[ContextMenu("🎨 Switch to Drawing API")]
algorithmExecutor.pathVisualizer.enabled = true;
algorithmExecutor.renderer.enabled = false;
```

**Switch to Legacy LineRenderer:**
```csharp
[ContextMenu("🖼️ Switch to Legacy Renderer")]
algorithmExecutor.renderer.enabled = true;
algorithmExecutor.pathVisualizer.enabled = false;
```

## Configuration

### OnlineMapsPathVisualizer Settings

```csharp
[Header("Rendering Configuration")]
public float explorationLineWidth = 3f;    // Algorithm exploration lines
public float routeLineWidth = 5f;          // Optimal route lines

[Header("Color Scheme")]
public Color explorationColor = Color.cyan;  // Algorithm exploration
public Color routeColor = Color.green;       // Optimal route
public Color playerRouteColor = Color.yellow; // User-drawn route

[Header("Performance")]
public int maxActiveSegments = 1000;        // Max simultaneous lines
```

### PathSegment Types

- **"path"** - Algorithm exploration (cyan, thin lines)
- **"route"** - Optimal route (green, thick lines)
- **"player"** - User-drawn route (yellow, thick lines)

## Performance Notes

### Memory Usage
- OnlineMapsDrawingLine objects are more efficient than Unity LineRenderers
- Drawing API uses native mesh generation
- Built-in object pooling through Online Maps system

### Rendering Performance
- Better GPU utilization through Online Maps rendering pipeline
- Automatic LOD and culling based on map view
- No manual coordinate conversion overhead

### Mobile Optimization
- Reduce `maxActiveSegments` for mobile devices (500-1000)
- Use Tileset mode for better mobile performance
- Consider disabling `checkMapBoundaries` for pathfinding lines

## Troubleshooting

### Lines Not Appearing

1. **Check Online Maps Setup:**
   ```csharp
   OnlineMaps map = FindObjectOfType<OnlineMaps>();
   Debug.Log($"Map found: {map != null}");
   Debug.Log($"Drawing manager: {map?.drawingElementManager != null}");
   ```

2. **Verify Coordinates:**
   ```csharp
   // Ensure coordinates are in lng/lat format
   Vector2 coords = new Vector2(-74.006f, 40.713f); // NYC (lng, lat)
   ```

3. **Check Line Properties:**
   ```csharp
   line.visible = true;
   line.checkMapBoundaries = false; // Allow lines outside bounds
   ```

### Timeline Connection Issues

```csharp
// Verify timeline connections
Debug.Log($"Executor timeline: {algorithmExecutor.timeline?.GetInstanceID()}");
Debug.Log($"Visualizer timeline: {pathVisualizer.timeline?.GetInstanceID()}");
Debug.Log($"Timelines match: {algorithmExecutor.timeline == pathVisualizer.timeline}");
```

### Coordinate Precision Problems

```csharp
// Test coordinate conversion accuracy
OnlineMapsBridge bridge = FindObjectOfType<OnlineMapsBridge>();
Vector3 worldPos = bridge.GeoCoordinateToWorldPosition(geoCoord);
Vector2 backToGeo = bridge.WorldPositionToGeoCoordinate(worldPos);
float error = Vector2.Distance(geoCoord, backToGeo);
Debug.Log($"Conversion error: {error:F8}"); // Should be < 0.00001
```

## Advanced Usage

### Custom Shaders

```csharp
// Apply custom shader to drawing elements
OnlineMapsTileSetControl tilesetControl = map.control as OnlineMapsTileSetControl;
if (tilesetControl != null)
{
    tilesetControl.drawingShader = yourCustomShader;
}
```

### Dynamic Line Updates

```csharp
// Update line points in real-time
List<Vector2> newPoints = CalculateNewPath();
drawingLine.points = newPoints; // Automatically triggers map.Redraw()

// Change line appearance
drawingLine.color = Color.red;
drawingLine.width = 10f;
```

### Performance Monitoring

```csharp
// Get visualization statistics
string stats = pathVisualizer.GetVisualizationStats();
Debug.Log($"Visualization: {stats}");

// Monitor drawing element count
int totalElements = map.drawingElementManager.Count;
Debug.Log($"Total drawing elements: {totalElements}");
```

## Migration from Legacy System

### Automatic Migration
- System automatically prefers OnlineMapsPathVisualizer
- Legacy PathSegmentRenderer disabled when both exist
- Timeline connections preserved

### Manual Migration Steps
1. Replace PathSegmentRenderer references with OnlineMapsPathVisualizer
2. Update coordinate handling (no world position conversion needed)
3. Test visualization with existing algorithms
4. Adjust performance settings for target platform

### Backward Compatibility
- Legacy system remains functional
- Can switch between systems at runtime
- Same PathSegmentTimeline works with both visualizers
- Algorithm execution unchanged

## React Architecture Mirror

This Unity implementation mirrors the React pathfinding visualization:

| React Component | Unity Equivalent | Purpose |
|----------------|------------------|---------|
| `TripsLayer` | `OnlineMapsPathVisualizer` | Renders animated path segments |
| `waypoints.current` | `PathSegmentTimeline` | Timeline of path segments |
| `animateStep()` | `AlgorithmStepExecutor` | Step-by-step algorithm execution |
| `updateWaypoints()` | `AddPathSegment()` | Add segments to timeline |

**Key Similarities:**
- Real-time visualization during algorithm execution
- Timeline-based replay with scrubbing support
- Geographic coordinate precision
- 100 steps/second execution speed
- Progressive line animation with segment growth