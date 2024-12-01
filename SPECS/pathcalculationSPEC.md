# Path Calculation Technical Specification

## Overview

### Purpose
Define a robust path calculation system that supports multiple algorithms, pre-calculation strategies, and efficient integration with Online Maps and Road Network systems while maintaining HONZAAPREF's performance optimizations.

## Core Algorithms

### Algorithm Base Class
```csharp
public abstract class PathfindingAlgorithm
{
    protected Node m_StartNode;
    protected Node m_EndNode;
    protected bool m_Finished;

    public virtual void Start(Node _startNode, Node _endNode)
    {
        m_StartNode = _startNode;
        m_EndNode = _endNode;
        m_Finished = false;
    }

    public abstract Node[] NextStep();
}
```

### Supported Algorithms

1. **A* (Primary Algorithm)**
- Optimal path finding with heuristic guidance
- Distance + heuristic cost calculation
- Priority queue implementation
- Memory-efficient node exploration

2. **Dijkstra's Algorithm**
- Base pathfinding implementation
- Uniform cost exploration
- No heuristic requirement
- Complete area coverage

3. **Bidirectional Search**
- Simultaneous start/end exploration
- Meets in the middle
- Reduced search space
- Optimal for longer paths

4. **Greedy Best-First**
- Fastest calculation time
- Heuristic-only guidance
- Non-optimal paths
- Minimal memory usage

## Pre-Calculation System

### Strategy
1. **Background Processing**
- Calculate during exploration state
- Priority-based queue system
- Resource-aware processing
- Cache management integration

2. **Calculation Priorities**
```csharp
public enum CalculationPriority
{
    Immediate,    // Current round requirement
    High,         // Next likely paths
    Normal,       // General area coverage
    Low          // Extended area preparation
}
```

3. **Cache Integration**
- Leverage OnlineMapsCache
- Path result storage
- Efficient retrieval
- Memory pressure handling

### Pre-Calculation Manager
```csharp
public class PathPreCalculationManager
{
    private Queue<PathRequest> m_HighPriorityQueue;
    private Queue<PathRequest> m_NormalPriorityQueue;
    private Dictionary<string, PathResult> m_CachedResults;

    public void QueueCalculation(Vector2 _start, Vector2 _end, 
                               CalculationPriority _priority)
    {
        // Queue based on priority
    }

    private void ProcessQueue()
    {
        // Background processing logic
    }
}
```

## Performance Requirements

### Calculation Times
- A*: < 100ms for local paths
- Dijkstra: < 200ms for area coverage
- Bidirectional: < 150ms for long paths
- Greedy: < 50ms for quick estimates

### Memory Usage
- Active Calculation: < 64MB (per global spec)
- Cached Results: < 256MB (Tier 2 storage)
- Pre-Calculation Queue: < 32MB (background)
- Total System: < 352MB

### Cache Integration
- Utilizes Tier 1 RAM Cache (64MB allocation)
- Implements Tier 2 Storage (256MB for results)
- Follows global LRU invalidation policy
- Coordinates with Online Maps cache

### Threading Model
1. **Main Thread**
- Path request handling (< 5ms)
- Result delivery (< 2ms)
- State management (< 1ms)
- Critical updates (< 1ms)

2. **Background Threads**
- Pre-calculations (≤ 2 threads)
- Cache management (shared thread)
- Resource cleanup (shared thread)
- Performance monitoring (shared thread)

## Integration Points

### Road Network Integration
- Direct graph access
- Node/edge optimization
- Spatial indexing
- Memory sharing

### Online Maps Integration
- Coordinate conversion
- Tile management
- Cache coordination
- Resource sharing

### State Management Integration
- Calculation state tracking
- Resource allocation
- Error handling
- State transitions

## Implementation Phases

### Phase 1: Core Algorithms
- Base algorithm class
- A* implementation
- Basic pre-calculation
- Essential caching

### Phase 2: Extended Features
- Additional algorithms
- Advanced pre-calculation
- Performance optimization
- Memory management

### Phase 3: Optimization
- Threading model
- Cache efficiency
- Memory tuning
- Mobile optimization

## Error Handling

### Critical Scenarios
1. **Calculation Failures**
- Timeout handling
- Resource exhaustion
- Invalid graph data
- Recovery strategies

2. **Memory Pressure**
- Cache reduction
- Queue management
- Resource cleanup
- System recovery

### Recovery Protocols
```csharp
public class PathCalculationRecovery
{
    public void HandleCalculationTimeout()
    {
        // Timeout recovery logic
    }

    public void HandleMemoryPressure()
    {
        // Memory cleanup logic
    }
}
```

## Development Tools

### Debug Visualization
- Path progression
- Algorithm comparison
- Memory usage
- Performance metrics

### Testing Framework
- Algorithm validation
- Performance testing
- Memory monitoring
- Integration tests

## Open Questions
1. Maximum pre-calculation queue size?
2. Specific memory thresholds per device tier?
3. Optimal thread count for background calculations?
4. Cache invalidation strategy?

## Gameplay Integration

### Path Result Utilization
1. **Visualization Control**
- Speed control based on difficulty
- Visual feedback intensity
- Progress tracking
- Performance scoring

2. **Game Mode Boundaries**
```csharp
public class PathBoundary 
{
    public float CollisionPenalty { get; set; }
    public float SafeDistance { get; set; }
    public bool IsActive { get; set; }
    
    // Boundary behavior per game mode
    public BoundaryBehavior Mode { get; set; }
}

public enum BoundaryBehavior
{
    None,           // Standard mode - no collision
    Penalty,        // Orb collector - punish on touch
    Blocking,       // Practice mode - prevent crossing
    Warning         // Tutorial mode - visual feedback only
}
```

3. **Path Properties**
```csharp
public class PathProperties
{
    // Core path data
    public Node[] PathNodes { get; private set; }
    public float TotalDistance { get; private set; }
    
    // Gameplay properties
    public float OptimalCompletionTime { get; set; }
    public float BoundaryWidth { get; set; }
    public BoundaryBehavior Behavior { get; set; }
    
    // Difficulty scaling
    public float SpeedMultiplier { get; set; }
    public float PenaltyMultiplier { get; set; }
}
```

### Game Mode Support

1. **Standard Mode**
- Path visualization only
- Completion time tracking
- Basic scoring system

2. **Orb Collector Mode**
- Active boundary collision
- Penalty calculation
- Orb placement along path
- Dynamic difficulty scaling

3. **Practice Mode**
- Relaxed boundaries
- Tutorial integration
- Detailed feedback
- Learning-focused visualization

## Algorithm Step Capture

### Step Recording System
```csharp
public class AlgorithmStep
{
    // The nodes explored in this step
    public Node[] ExploredNodes { get; private set; }
    
    // The current best path at this step
    public Node[] CurrentPath { get; private set; }
    
    // Algorithm-specific metadata
    public Dictionary<string, object> StepMetadata { get; private set; }
    
    // Step timing for visualization
    public float StepDuration { get; set; }
}

public class AlgorithmProgression
{
    // Complete record of algorithm steps
    private List<AlgorithmStep> m_Steps;
    
    // Current step index for visualization
    private int m_CurrentStepIndex;
    
    // Metadata for entire progression
    public float TotalDuration { get; private set; }
    public int TotalNodesExplored { get; private set; }
    public float PathLength { get; private set; }
}
```

### Algorithm-Specific Step Data

1. **A* Steps**
```csharp
public class AStarStepData
{
    public float CurrentFScore { get; set; }
    public float HeuristicValue { get; set; }
    public Node[] OpenSet { get; set; }
    public Node[] ClosedSet { get; set; }
}
```

2. **Dijkstra Steps**
```csharp
public class DijkstraStepData
{
    public float CurrentDistance { get; set; }
    public Node[] UnvisitedSet { get; set; }
    public Node[] VisitedSet { get; set; }
}
```

3. **Bidirectional Steps**
```csharp
public class BidirectionalStepData
{
    public Node[] ForwardFrontier { get; set; }
    public Node[] BackwardFrontier { get; set; }
    public bool MeetingPointFound { get; set; }
}
```

### Step Utilization

1. **Visualization Control**
- Step-by-step playback
- Speed control per step
- Visual effects tied to step data
- Algorithm-specific highlighting

2. **Educational Features**
- Algorithm explanation per step
- Decision point highlighting
- Comparison visualization
- Learning annotations

3. **Gameplay Integration**
- Difficulty based on step count?
- Score multipliers per step
- Challenge objectives
- Achievement tracking