# PATHFINDR - Game Design Document

## Overview
PATHFINDR is a route prediction game where players guess the optimal path between locations, then watch beautiful algorithm visualizations reveal the actual shortest route on real-world maps sourced from OpenStreetMap.

## Core Game Concept

### Game Flow
1. **Route Prediction**: Player sees start/end markers and draws their best guess route
2. **Dual Visualization Reward**: Player's guessed route traces out first, followed by pathfinding algorithm exploration revealing the optimal path
3. **Visual Comparison**: See how player's intuition compares to algorithmic optimization
4. **Scoring**: Simple accuracy based on how close player route is to optimal distance

*Note: Future expansion may include a second game loop for additional gameplay variety*

### Target Platform
- **Primary**: Desktop web (for POC development and testing)
- **Future**: Mobile/iPad (touch-first design after web POC is validated)

## Current Technical Foundation

### Existing Strengths
- **4 pathfinding algorithms** with step-by-step visualization
  - A* (The Efficient Explorer)
  - Dijkstra (The Thorough Investigator) 
  - Greedy (The Impulsive Sprinter)
  - Bidirectional (The Twin Forces)
- **High-performance Deck.GL** rendering
- **Real OSM integration** via MapService
- **Sophisticated timing system** for visualization control
- **17 pre-configured major cities**
- **Speed controls** (1-10x) for visualization pacing
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

### Algorithm Visualization Characters
Each algorithm provides unique visual experiences:

- **A\* - "The Efficient Explorer"**
  - Smart, direct pathfinding with heuristic guidance
  - Beautiful focused exploration pattern
  - Green visualization trail

- **Dijkstra - "The Thorough Investigator"**  
  - Systematic exploration in all directions
  - Mesmerizing radial search pattern
  - Blue visualization trail

- **Greedy - "The Impulsive Sprinter"**
  - Always heads toward target, sometimes gets stuck
  - Fast but potentially flawed exploration
  - Yellow visualization trail

- **Bidirectional - "The Twin Forces"**
  - Dramatic converging search from both ends
  - Most visually spectacular when paths meet
  - Red dual-trail visualization

### Core Interaction
- **Player draws first** - thoughtful route planning without time pressure
- **Dual visualization reward** - player's route displays first, then algorithm exploration begins
- **Visual drama** - see where player intuition aligns with or differs from algorithmic optimization
- **Learning experience** - understand why the algorithm chose a different route

## Mobile-First Touch Interface (Future Phase)

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
- Dynamic camera movements during visualization

#### Level 3: Cinematic Experience
- Automatic camera following for dramatic views
- Environmental effects (time of day, weather)
- Advanced particle systems
- Post-processing effects (bloom, DOF)

## Game Progression & Features

### Core Features (MVP)
- [ ] Path drawing system (web-based with mouse/click input)
- [ ] Algorithm visualization spectacle
- [ ] Simple accuracy scoring system  
- [ ] 3-5 city locations
- [ ] 2-3 algorithm types for variety

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

### Phase 1: Core Game Mechanics (Web POC)
- Web-based path drawing interface (mouse/click input)
- Sequential gameplay (guess route → watch player route trace → watch algorithm find optimal path)
- Basic accuracy scoring and feedback
- 2-3 algorithms, 3-5 cities

### Phase 2: Visual Polish & Validation
- Enhanced visual effects
- Performance optimization
- Sound design integration
- User testing and feedback collection

### Phase 3: Mobile Adaptation
- Touch-first interface design
- Mobile gesture handling
- Responsive mobile UX
- Mobile performance optimization

### Phase 4: Social & Competitive
- User accounts and progression  
- Leaderboards and challenges
- Social features and sharing
- Advanced analytics

### Phase 5: Monetization
- Premium content system
- Payment integration
- Advanced features unlock
- Marketing and user acquisition

## Technical Considerations

### Performance
- Mobile GPU optimization (future phase)
- Efficient pathfinding visualization
- Memory management for large maps
- Battery usage optimization (mobile phase)

### Scalability  
- Cloud-based user data
- CDN for map tiles
- Scalable backend architecture
- Real-time multiplayer potential

### Accessibility
- Colorblind-friendly palettes
- Touch target sizing (mobile phase)
- Screen reader compatibility
- Multiple input methods

## Immediate Next Steps
1. **2-Hour Game Prototype**: Add basic game flow to existing visualization
   - Player draws route with mouse clicks
   - Show player's route tracing out first
   - Follow with algorithm finding optimal path
   - Display simple accuracy score
2. Test if core concept is engaging on web
3. Enhance visual effects and sound
4. Validate POC before mobile development
5. Design progression and monetization

## During-Visualization Mini-Games (Future)
- **Path Prediction**: Guess where algorithm will go next
- **Route Commentary**: Mark mistakes on your own path
- **Visual Reactions**: Interactive elements during the show

---

*Generated during PATHFINDR planning session - August 2025*