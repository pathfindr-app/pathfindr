# Road Network Technical Specification

## System Overview

### Purpose
Create an efficient road network graph system using Online Maps' OSM integration that combines HONZAAPREF's optimized graph creation with our extended feature requirements.

### Online Maps Integration Points
- OSM Overpass API Integration
  - Direct access through OnlineMapsOSMAPIQuery
  - Custom query filtering
  - Built-in error handling
  - Response validation

- Tile Management
  - OnlineMapsTileManager for viewport handling
  - Built-in caching system
  - Background tile loading
  - Memory optimization

## Core Systems

### OSM Data Processing

#### Graph Creation (HONZAAPREF Method)
- Initial Data Fetch
  - Use OnlineMapsOSMAPIQuery with minimal query:
    ```
    way[highway][highway!="footway"][highway!="pedestrian"]
    [highway!="steps"][highway!="path"][highway!="track"]
    ```
  - Fetch in skeleton mode
  - Minimal node data
  - Clean filtering upfront

- Node Processing
  1. First Pass - Way Analysis:
     - Collect nodes that are part of multiple ways (intersections)
     - Identify end nodes of ways (dead ends)
     - Mark important shape nodes (significant curves)
     - Calculate node importance

  2. Node Reduction:
     - Keep intersection nodes
     - Keep dead ends
     - Keep critical shape points
     - Remove redundant geometry
     - Maintain connectivity

  3. Graph Building:
     - Create nodes only for kept points
     - Connect nodes directly if part of same way
     - Calculate edge weights using geographic distance
     - Maintain minimal metadata

#### Extended Features
Goals:
- Maintain HONZAAPREF's efficient graph while supporting:
  - Background pre-calculation of graph
  - Location-based optimization
  - Unity-specific features


### Graph Structure (HONZAAPREF Style)

#### Node System
Essential Data Only:
- ID (number)
- Latitude/Longitude (OnlineMapsVector2d)
- Edges array
- Basic pathfinding data:
  - Distance from start
  - Distance to end
  - Parent reference
- Visited flag

Implementation:
- Unity object pooling wrapper
- Thread-safe operations
- Memory optimization
- Quick spatial lookups

#### Edge System
Minimal Structure:
- Node1/Node2 references
- Visited flag
- Weight (direct distance calculation)
- Essential Unity requirements

Implementation:
- Direct node connections
- Simple weight calculations
- Memory pooling
- Quick traversal

### Location Mode Support
Goals:
- Support ~30sq mile local mode
- Enable global mode
- Maintain graph efficiency
- Optimize performance

Implementation:
Local Mode:
- Pre-loaded adjacent areas
- Background updates
- Optimized for quick access
- Memory efficient storage

Global Mode:
- Dynamic loading strategy
- Memory-efficient storage
- Clean cleanup system
- Resource management

## Performance Optimization

### Memory Management
- Object Pooling
  - Node pool
  - Edge pool
  - Event handlers
  - Resource management

- Cache Strategy
  - Leverage OnlineMapsCache
  - Custom graph caching
  - Tile-aligned data storage
  - Memory pressure handling

### Threading Model
- Main Thread
  - Unity lifecycle
  - User input
  - State management
  - Critical operations

- Background Processing
  - Graph construction
  - Data reduction
  - Cache management

## Performance Targets

### Memory Usage
- Graph Structure: TBD BASED ON TESTING
- Cache: TBD BASED ON TESTING
- Total: TBD BASED ON TESTING

### Processing Times
- Initial graph creation: TBD
- Node reduction: TBD


## Technical Requirements

### Unity Integration
- OnlineMaps v3.9.5+
- Custom MonoBehaviour wrappers
- Event system integration
- Editor tools

### Mobile Support
- iOS/Android optimization
- Battery efficiency
- Memory management
- Thread handling

## Implementation Phases

### Phase 1: Core Graph
- HONZAAPREF graph implementation
- Online Maps integration
- Basic Unity support
- Essential features

### Phase 2: Extended Features
- Location modes
- Memory optimization
- Cache implementation

### Phase 3: Performance
- Threading model
- Memory optimization
- Battery efficiency
- Debug tools

## Development Tools
Goals:
- Graph visualization
- Performance monitoring
- Testing frameworks
- Development utilities

Implementation:
- Memory usage tracking
- Graph analysis tools
- Debug visualization

## Metrics
- Node Statistics
  - Count per viewport
  - Urban vs rural density
  - Post-reduction ratios
  - Memory per node

- Edge Statistics
  - Count per viewport
  - Memory per edge
  - Connection density
  - Weight distributions

- Performance Metrics
  - Graph creation time
  - Node reduction time
  - Memory usage patterns



  ## HONZAAPREF Graph Creation Method

### Core Data Structures
1. Node Class:
```javascript
constructor(id, latitude, longitude) {
    this.edges = [];
    this.id = id;
    this.latitude = latitude;
    this.longitude = longitude;
    this.visited = false;
    this.distanceFromStart = 0;
    this.distanceToEnd = 0;
    this.parent = null;
}
```

2. Edge Class:
```javascript
constructor(node1, node2) {
    this.node1 = node1;
    this.node2 = node2;
    this.visited = false;
}

get weight() {
    return Math.hypot(this.node1.latitude - this.node2.latitude, 
                      this.node1.longitude - this.node2.longitude);
}
```

3. Graph Class:
```javascript
constructor() {
    this.startNode = null;
    this.nodes = new Map();
}
```

### Key OSM Query Optimization
```javascript
const highWayExclude = ["footway", "street_lamp", "steps", "pedestrian", "track", "path"];
const query = `
[out:json];(
    way[highway]${exclusion}[footway!="*"]
    (${boundingBox});
    node(w);
);
out skel;`;
```

### Graph Building Process
1. Node Collection:
```javascript
for(const element of elements) {
    if(element.type === "node") {
        const node = graph.addNode(element.id, element.lat, element.lon);
    }
}
```

2. Edge Creation:
```javascript
if(element.type === "way") {
    if(!element.nodes || element.nodes.length < 2) continue;
    for(let i = 0; i < element.nodes.length - 1; i++) {
        const node1 = graph.getNode(element.nodes[i]);
        const node2 = graph.getNode(element.nodes[i + 1]);
        if(!node1 || !node2) continue;
        node1.connectTo(node2);
    }
}
```

Key Benefits:
- Minimal data storage
- Simple, efficient connections
- Clean node reduction
- Allows for Fast path calculations