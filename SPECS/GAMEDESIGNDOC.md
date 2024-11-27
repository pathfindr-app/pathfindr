# Pathfindr - Game Design Document

## Game Overview
A geolocation-based pathfinding puzzle game where players compete against algorithms to find optimal routes while collecting rewards, leveraging real-world map data to create unique local experiences.

## Core Gameplay

### Round Structure
- Each round is one pathfinding challenge (5-30 seconds)
- Background caching of multiple pre-calculated paths
- Seamless transitions between rounds
- Round difficulty determined by visualization speed and route complexity
- Failed/incomplete paths result in zero points

### Difficulty System
- Easy: Slow visualization, relaxed gameplay
- Medium: Standard visualization speed
- Hard: Fast visualization, challenging gameplay
- Visualization speed tied directly to difficulty
- Route complexity scales with difficulty

### Location Modes
- Local Mode (~30sq mile radius)
  - Geolocation-based start points
  - Smart POI suggestions (user prefs, seasonal, business hours)
  - Dynamic route generation
  - Background path calculation
- Global Mode (scope TBD)

### Input System
- Cross-platform support (touch/mouse/controller)
- Consistent experience across devices
- Real-time path validation
- Visual/audio feedback
- Platform-specific optimizations

## Technical Architecture

### Map System
- Dynamic tile loading/caching
- Custom marker management
- Road network overlay system
- POI filtering and visualization
- LOD system for road networks
- Connected graph maintenance
- Max 5-10 second loading time for new areas
- Poor map data filtering

### Game States
- Exploration
- Route Setup
- Path Drawing
- Algorithm Visualization
- Results
- Practice

### Road Network
- Geometric accuracy prioritized
- Traffic rules/directions ignored initially
- Dynamic loading based on viewport
- Network simplification
- Path validation
- Intersection detection

### Performance Targets
- Minimal loading times
- Smooth visualization playback
- Efficient memory usage
- Battery optimization
- Background processing

## Features

### Algorithm Visualization
- Multiple pathfinding algorithms (A*, Dijkstra's, etc.)
- Unique shader effects per algorithm
- Sound design integration
- Speed controls
- Route replay system
- Educational overlays (lower priority)
- Performance-optimized effects

### Scoring System
Base Formula: (Path Accuracy × 0.6) + (Time Bonus × 0.3) + (Collectibles × 0.1)
- Route complexity bonus
- Algorithm comparison
- Achievement multipliers
- To be refined through testing

### POI System
Categories:
- Standard (Restaurants, Museums, etc.)
- Seasonal/Events
- User-generated
- Time-based
- Rarity tiers
- Dynamic spawning
- Category-based rewards

### Online/Offline Features
- Cloud save synchronization
- Local/Global leaderboards
- Daily challenges
- Social features
- Progress sync
- Offline support (TBD based on data requirements)

## Monetization
### Free Version
- Daily path limits
- Geographic restrictions
- Ad-supported features
- Basic algorithms

### Premium Features
- Unlimited paths
- Global access
- Custom themes
- Advanced algorithms
- Ad-free experience
- Monthly subscription or one-time purchase (TBD)

## Development Phases

### Phase 1: Core Mechanics
- Map integration
- Path drawing
- Basic visualization
- Scoring system
- Simple tutorial video

### Phase 2: Enhanced Features
- Multiple algorithms
- POI implementation
- Collectibles
- Advanced visualization
- Achievement system
- Leaderboards

### Phase 3: Polish & Social
- UI/UX refinement
- Social features
- Cloud save
- Cross-platform support
- Performance optimization

## Future Considerations
- User profile system
- Friend/social features
- Challenge creation/sharing
- Analytics integration
- Anti-cheat measures
- Accessibility options
- Legal/Privacy compliance
- Safety guidelines
- Battery usage optimization
- Bandwidth management
- Cache strategy
- Maximum concurrent players

## Technical Requirements
- Minimum: Android 7.0+, iOS 12.0+
- Recommended: Android 10.0+, iOS 14.0+
- Performance optimizations
- Tile caching
- Network compression
- Efficient rendering

## Outstanding Questions
- Tutorial system complexity
- Poor map data handling
- Monetization model refinement
- Difficulty system expansion
- Social feature scope
- Seasonal event implementation
- User-generated content moderation
- Anti-cheat measures
- Privacy/safety considerations