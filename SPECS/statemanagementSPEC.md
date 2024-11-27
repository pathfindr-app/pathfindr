# Game State Management Technical Specification

## Core Architecture

### State Manager Integration
Purpose:
- Centralized state control system leveraging Online Maps architecture
- Seamless transitions between 5-30 second gameplay rounds
- Efficient resource management across all game modes
- Performance optimization per state
- Support for local/global location modes

Online Maps Integration:
- OnlineMaps.instance singleton provides global access
- Event System Hooks:
  - OnStart: Initialize state system, prepare caches, setup location mode
  - OnChangePosition: Handle state-specific position restrictions
  - OnChangeZoom: Manage zoom levels per state
  - OnUpdateBefore: Prepare state updates, validate transitions, check round timing
  - OnUpdateAfter: Cleanup, cache management, prepare next round
  - OnMapUpdated: Handle state-specific map refreshes, update visualizations

Performance Considerations:
- Event subscription management to prevent memory leaks
- Efficient state validation checks
- Background processing for state preparation
- Resource preloading for next likely state
- Round-based resource management
- Visualization speed optimization

Error Handling:
- State validation system
- Transition interruption recovery
- Invalid state detection
- Resource loading failures
- Network interruption handling
- Location service errors
- Round timer management

### Base State Properties
Core Properties:
- Control.allowUserControl: State-specific input management
- Map interaction bounds: Dynamic restriction system
- Zoom level restrictions: Performance-based limits
- Input handling modes: State-appropriate controls
- UI overlay state: Context-sensitive interface
- Round timer management: 5-30 second control
- Visualization speed control: Difficulty-based playback rates

Resource Management:
- Memory allocation per state/mode
- Cache prioritization based on game mode
- Background resource loading for next round
- Cleanup scheduling between rounds

## State Definitions

### Exploration State
Purpose:
- Free map exploration
- POI discovery
- Route planning
- Area familiarization
- Practice mode access
- Daily challenge preview

Entry Points:
- OnlineMaps.dispatchEvents = true: Enable full event system
- OnlineMaps.allowRedraw = true: Enable dynamic map updates
- OnlineMaps.blockAllInteractions = false: Allow full user control

Location Mode Handling:
- Local Mode (~30sq mile radius):
  - Geolocation integration
  - Local POI management
  - Area-specific caching
  
- Global Mode:
  - Unrestricted exploration
  - Global POI system
  - Dynamic cache management

### Route Setup State
Purpose:
- Start/end point selection
- Difficulty selection (visualization speed)
- Mode selection (practice/challenge)
- Resource preparation

Technical Implementation:
- Point validation system
- Speed control initialization
- Background path pre-calculation
- Round timer initialization

### Game Mode State
Purpose:
- Active gameplay (5-30 second rounds)
- Path drawing
- Algorithm visualization at selected speed
- Score tracking

Entry Configuration:
- OnlineMaps.lockRedraw = false: Enable controlled updates
- OnlineMaps.notInteractUnderGUI = true: Prevent UI conflicts
- OnlineMaps.allowRedraw = controlled: Manage performance

Visualization Speed Control:
- Easy: Slow visualization playback
- Medium: Standard visualization playback
- Hard: Fast visualization playback

Technical Implementation:
- Single visualization system
- Configurable playback speed
- Smooth speed transitions
- Performance monitoring
- Background processing

Round Management:
- Timer system (5-30 seconds)
- Score calculation
- Path validation
- State persistence
- Transition preparation

### Practice State
Purpose:
- Unlimited time mode
- Learning environment
- Algorithm study
- Strategy development

Configuration:
- Modified game mode settings
- Relaxed time constraints
- Adjustable visualization speed
- Detailed feedback system

### Visualizer State
Purpose:
- Algorithm demonstration
- Path comparison
- Path replay system
- Performance analysis

Configuration:
- OnlineMaps.allowRedraw = true: Enable visualization updates
- OnlineMaps.dispatchEvents = true: Handle visualization events
- OnlineMaps.blockAllInteractions = false: Allow replay control

Speed Control:
- User-controlled playback speed
- Smooth speed transitions
- Performance optimization
- Replay functionality

### Results State
Purpose:
- Score display
- Path comparison
- Achievement tracking
- Social sharing
- Round statistics

Implementation:
- Static map rendering
- Score calculation
- Path comparison system
- Share functionality
- Achievement processing
- Next round preparation

## State Transitions

### Transition Manager
Core Functionality:
- State validation
- Resource preparation
- Cache management
- Event system reconfiguration
- UI state management
- Round timing management

Primary Transition Flows:
1. Exploration -> Route Setup:
   - Cache map state
   - Initialize speed selection
   - Prepare path validation
   - Load location-specific data

2. Route Setup -> Game Mode:
   - Set visualization speed
   - Initialize round timer
   - Prepare scoring system
   - Configure visualization system

3. Game Mode -> Results:
   - Stop timer
   - Calculate final score
   - Cache round data
   - Prepare comparisons
   - Initialize sharing

4. Results -> Exploration/Next Round:
   - Clear round data
   - Reset restrictions
   - Update leaderboards
   - Prepare next round
   - Cache cleanup

### State Data Persistence
Cache Strategy:
- State-specific data retention
- Round data management
- Performance metric tracking
- Resource usage monitoring
- Speed settings
- Location mode data

### Error Recovery
Error Handling:
- Connection loss recovery
- State interruption handling
- Round timer recovery
- Resource cleanup
- State restoration
- Location service errors

## Performance Considerations

### Memory Management
State-Specific Limits:
- Exploration: Full cache utilization
- Route Setup: Minimal cache
- Game Mode: Round-specific cache
- Practice: Extended cache
- Visualizer: Replay optimization
- Results: Static data retention

### Threading Model
Main Thread Operations:
- State transitions
- UI updates
- Input processing
- Round timing
- Event handling
- Visualization speed control

Background Processing:
- Next round preparation
- Path calculation
- Cache management
- Data cleanup
- State prediction

## Implementation Strategy

### Phase 1: Core States
- Basic state machine
- Essential transitions
- Round timing system
- Primary restrictions
- Visualization speed system

### Phase 2: Enhanced Features
- Full state persistence
- Advanced transitions
- Location modes
- Practice mode
- Daily challenges

### Phase 3: Optimization
- Memory management
- Performance tuning
- State prediction
- Cache optimization
- Resource efficiency



### Development Tools
Goals:
- Comprehensive debugging support
- Performance monitoring
- Testing frameworks
- Development utilities

Implementation:
Road Network Tools:
- Graph visualization
- Path calculation metrics
- Memory usage tracking
- Cache analysis tools

State Management Tools:
- State transition visualization
- Round timing analysis
- Resource usage monitoring
- Performance profiling

