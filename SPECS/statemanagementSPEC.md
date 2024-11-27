# Game State Management Technical Specification

## Core Architecture

### State Manager Integration
- Utilize OnlineMaps.instance singleton pattern
- Hook into key Online Maps events:
  - OnStart: Initial state setup
  - OnChangePosition: State-specific position handling
  - OnChangeZoom: State-specific zoom restrictions
  - OnUpdateBefore/After: State updates
  - OnMapUpdated: State-specific map refresh

### Base State Properties
- Control.allowUserControl flag
- Map interaction bounds
- Zoom level restrictions
- Input handling modes
- UI overlay state

## State Definitions

### Exploration State
Entry Points:
- OnlineMaps.dispatchEvents = true
- OnlineMaps.allowRedraw = true
- OnlineMaps.blockAllInteractions = false

Controls:
- Full zoom range (MINZOOM to MAXZOOM)
- Unrestricted panning
- POI interaction enabled
- Normal touch/mouse input

### Game Mode State
Entry Points:
- OnlineMaps.lockRedraw = false
- OnlineMaps.notInteractUnderGUI = true
- OnlineMaps.allowRedraw = controlled

Restrictions:
- Limited zoom range
- Restricted pan area
- Disabled POI interaction
- Custom input handling

### Visualizer State
Entry Points:
- OnlineMaps.allowRedraw = true
- OnlineMaps.dispatchEvents = true
- OnlineMaps.blockAllInteractions = false

Features:
- Full control access
- Custom drawing layer
- Algorithm visualization
- Path replay system

### Results State
Entry Points:
- OnlineMaps.lockRedraw = true
- OnlineMaps.blockAllInteractions = true
- Cache final state

Features:
- Static map display
- Score overlay
- Path comparison
- Save/share options

## State Transitions

### Transition Manager
Handles:
- State cleanup
- Resource management
- Cache updates
- Event rebinding
- UI transitions

### State Data Persistence
Per-State Cache:
- Map position/zoom
- Visualization state
- User input state
- Performance metrics

### Error Recovery
Handles:
- Connection loss
- State interruption
- Resource cleanup
- State restoration

## Performance Considerations

### Memory Management
Per State Limits:
- Exploration: Full cache
- Game Mode: Minimal cache
- Visualizer: Optimized cache
- Results: Static cache

### Threading Model
Main Thread:
- State transitions
- UI updates
- Input processing
- Event dispatch

Background Thread:
- State preparation
- Resource loading
- Cache management

## Implementation Strategy

### Phase 1: Core States
- Basic state machine
- Essential transitions
- Primary restrictions
- Performance baseline

### Phase 2: Enhanced Features
- Full state persistence
- Advanced transitions
- Error recovery
- Debug tools

### Phase 3: Optimization
- Memory management
- Performance tuning
- State prediction
- Cache optimization