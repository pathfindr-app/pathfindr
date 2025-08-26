# PATHFINDR - Game Design Document

## Overview
PATHFINDR is a competitive pathfinding game where players race against AI algorithms to find the shortest route between locations on real-world maps sourced from OpenStreetMap.

## Core Game Concept

### Game Loop
1. Player sees start/end markers on real city map
2. Countdown timer (3-2-1-GO!)
3. Player draws path simultaneously while AI algorithms race
4. Score based on route accuracy, completion time, and algorithm difficulty

### Target Platform
- **Primary**: Mobile/iPad (touch-first design)
- **Secondary**: Desktop web

## Current Technical Foundation

### Existing Strengths
- **4 pathfinding algorithms** with step-by-step visualization
  - A* (Smart Speedster)
  - Dijkstra (Methodical Explorer) 
  - Greedy (Reckless Rusher)
  - Bidirectional (Twin Hunter)
- **High-performance Deck.GL** rendering
- **Real OSM integration** via MapService
- **Sophisticated timing system** for competitive mechanics
- **17 pre-configured major cities**
- **Speed controls** (1-10x) for difficulty scaling
- **React + Vite** modern development stack

### Current Tech Stack
```json
{
  "rendering": "Deck.GL + MapLibre",
  "maps": "OpenStreetMap",
  "frontend": "React 18 + Vite",
  "styling": "Material-UI + SCSS",
  "algorithms": "Custom implementations"
}
```

## Game Mechanics Design

### Algorithm Challengers
Each algorithm becomes a unique "competitor":

- **A\* - "Smart Speedster"**
  - Fast, efficient pathfinding
  - Hard difficulty (high speed multiplier)
  - Green visualization trail

- **Dijkstra - "Methodical Explorer"**  
  - Thorough but slower exploration
  - Medium difficulty
  - Blue visualization trail

- **Greedy - "Reckless Rusher"**
  - Fast but suboptimal paths
  - Easy difficulty 
  - Yellow visualization trail

- **Bidirectional - "Twin Hunter"**
  - Dramatic converging paths from both ends
  - Boss mode difficulty
  - Red dual-trail visualization

### Competitive Racing
- **Simultaneous gameplay** - player draws while algorithms explore
- **Real-time progress tracking** - see who's ahead
- **Speed pressure** - algorithms get faster with difficulty
- **Multiple victory conditions**:
  - First to complete (speed bonus)
  - Most accurate route (precision bonus)
  - Style points (smooth drawing, minimal nodes)

## Mobile-First Touch Interface

### Touch Interaction States

#### 1. Drawing Mode
- Finger down = creating path
- Continuous touch creates path segment
- Visual feedback with dotted line following finger

#### 2. Navigation Mode  
- Finger up = path node created
- Enable pinch-to-zoom and pan gestures
- Disable drawing to prevent accidental marks

#### 3. Resume Drawing
- Tap existing path endpoint to continue drawing
- Visual highlight on active drawing node
- Haptic feedback on node selection

### Technical Implementation

#### Gesture Handling
```javascript
controller={{ 
  doubleClickZoom: false, 
  keyboard: false,
  touchRotate: true,
  touchZoom: true, 
  touchPan: !isDrawing // conditional pan control
}}
```

#### Mobile Optimizations
- **Large touch targets** (15-20px minimum)
- **Visual zoom indicators**
- **Haptic feedback** on interactions
- **Performance optimization** for mobile GPUs
- **Responsive node sizing** based on zoom level

## Visual Enhancement Roadmap

### Current Visualization
- TripsLayer for animated pathfinding
- ScatterplotLayer for start/end points
- PolygonLayer for selection radius
- Basic color-coded algorithm trails

### Planned Enhancements

#### Level 1: Polish Current System
- Enable optimized glow effects (currently commented out)
- Particle trails behind algorithm paths
- Pulsing node effects during exploration
- Smooth animation transitions

#### Level 2: Advanced Effects
- Shader-based lighting effects
- Lightning/energy effects when paths converge
- Emissive materials for algorithm trails  
- Dynamic camera movements during races

#### Level 3: Cinematic Experience
- Automatic camera following for dramatic views
- Environmental effects (time of day, weather)
- Advanced particle systems
- Post-processing effects (bloom, DOF)

## Game Progression & Features

### Core Features (MVP)
- [ ] Mobile touch path drawing system
- [ ] Simultaneous player vs algorithm racing
- [ ] Basic scoring system (time + accuracy)
- [ ] 3-5 city locations
- [ ] 2-3 algorithm difficulties

### Enhanced Features
- [ ] Player progression/levels
- [ ] Leaderboards per city/algorithm
- [ ] Daily challenges
- [ ] Ghost races (play against recorded runs)
- [ ] Social sharing of routes

### Premium Features  
- [ ] Extended city library (50+ locations)
- [ ] Custom map uploads
- [ ] Advanced visual effects
- [ ] Detailed analytics
- [ ] Tournament modes

## Monetization Architecture

### Revenue Streams
1. **Freemium Model**
   - Free: Basic cities, limited algorithms
   - Premium: Full city library, all algorithms, advanced features

2. **Cosmetic Purchases**
   - Algorithm trail effects
   - UI themes
   - Celebration animations

3. **Competitive Features**
   - Tournament entry fees
   - Leaderboard premium tiers
   - Advanced statistics

### Technical Requirements
- User account management
- Payment processing integration
- Cloud save/sync
- Analytics tracking
- A/B testing framework

## Implementation Phases

### Phase 1: Core Game Mechanics
- Mobile touch interface for path drawing
- Simultaneous racing system
- Basic scoring and feedback
- 3 algorithms, 5 cities

### Phase 2: Visual Polish
- Enhanced visual effects
- Improved mobile UX
- Performance optimization
- Sound design integration

### Phase 3: Social & Competitive
- User accounts and progression  
- Leaderboards and challenges
- Social features and sharing
- Advanced analytics

### Phase 4: Monetization
- Premium content system
- Payment integration
- Advanced features unlock
- Marketing and user acquisition

## Technical Considerations

### Performance
- Mobile GPU optimization
- Efficient pathfinding visualization
- Memory management for large maps
- Battery usage optimization

### Scalability  
- Cloud-based user data
- CDN for map tiles
- Scalable backend architecture
- Real-time multiplayer potential

### Accessibility
- Colorblind-friendly palettes
- Touch target sizing
- Screen reader compatibility
- Multiple input methods

## Next Steps
1. Implement mobile touch drawing system
2. Create simultaneous racing mechanics
3. Enhance visual effects and polish
4. Design user progression system
5. Build monetization infrastructure

---

*Generated during PATHFINDR planning session - August 2025*