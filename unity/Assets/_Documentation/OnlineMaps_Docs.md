# Online Maps v3.9 Documentation

This documentation covers the Online Maps v3.9 asset integration for the Pathfinder Unity port.

## Key Features Used

### Core Map Functions
- Raster tile rendering for performance
- Touch coordinate detection with mobile gesture support  
- Drawing API for real-time route visualization
- Coordinate conversion (lat/lng ↔ Unity world space)
- Tileset Control for enhanced mobile performance

### Integration Points
- Click/touch position to latitude/longitude conversion
- Dynamic drawing of pathfinding routes on map
- Real-time coordinate tracking for waypoint placement
- Map zoom and pan controls optimized for mobile

### Performance Optimizations
- Tileset Control reduces draw calls for mobile devices
- Raster tiles provide faster loading than vector tiles
- Universal Render Pipeline (URP) support for better mobile performance
- Coordinate conversion optimized for real-time pathfinding

## API Usage Patterns

### Map Initialization
```csharp
// Initialize Online Maps component
OnlineMaps map = OnlineMaps.instance;
map.position = new Vector2(longitude, latitude);
map.zoom = zoomLevel;
```

### Coordinate Conversion
```csharp
// Screen to geographic coordinates
Vector2 screenPos = Input.mousePosition;
Vector2 geoPos = map.control.GetCoords(screenPos);

// Geographic to world coordinates  
Vector3 worldPos = OnlineMapsUtils.LatLongToWorldPosition(lat, lng);
```

### Route Drawing
```csharp
// Draw pathfinding route
OnlineMapsDrawingLine route = new OnlineMapsDrawingLine(routePoints, Color.blue, 3f);
OnlineMapsDrawingElementManager.AddItem(route);
```

Based on original Online Maps v3.9 documentation from online-maps-DOCSv3.txt