Pathfindr - Game Design Document
Game Overview
A geolocation-based pathfinding puzzle game where players compete against algorithms to find optimal routes while collecting rewards, leveraging real-world map data to create unique local experiences.
Core Gameplay Loop
1. Route Selection


graph LR
    A[Player Start] --> B[Location Selection]
    B --> C[Manual Search]
    B --> D[GPS Location]
    C --> E[Route Setup]
    D --> E
    E --> F[Start/End Markers]


Automatic geolocation or manual location search
Smart POI suggestions based on player preferences
Dynamic difficulty scaling based on route complexity



graph TD
    A[Draw Mode] --> B[Touch Input]
    A --> C[Mouse/Controller Input]
    B --> D[Path Validation]
    C --> D
    D --> E[Real-time Feedback]
    E --> F[Score Calculation]







Multi-input support (touch/mouse/controller)
Real-time path validation against road network
Visual feedback for valid/invalid paths
Timer-based scoring system



Algorithm Visualization
Multiple pathfinding algorithms:
A with different heuristics
Dijkstra's
Custom aesthetic variants
Educational overlays explaining algorithm behavior
Stylized visualization effects
Speed controls for visualization playback


 Scoring & Rewards
Weighted scoring system:
  Final Score = (Path Accuracy × 0.6) + (Time Bonus × 0.3) + (Collectibles × 0.1)
- POI-based collectible system
Achievement system
Local/Global leaderboards


Technical Architecture
Core Systems
Map System (Online Maps Integration)


public class MapManager : MonoBehaviour
{
    #region Map States
    public enum MapState
    {
        Exploration,
        RouteSetup,
        PathDrawing,
        AlgorithmVisualization,
        Results
    }
    #endregion

    #region Cache Management
    [SerializeField] private bool m_EnableOfflineCache = true;
    private OnlineMapsCache m_Cache;
    #endregion
}

Dynamic tile loading/caching
Custom marker management
Road network overlay system
POI filtering and visualization


Game State Management
public class GameStateManager : MonoBehaviour
{
    #region Game Modes
    public enum GameMode
    {
        SinglePlayer,
        GlobalChallenge,
        DailyPuzzle,
        Practice
    }
    #endregion
}


State machine for game flow
Session persistence
Player progression system
Settings management


Road Network System

public class RoadNetworkManager : MonoBehaviour
{
    #region Network Loading
    private void LoadRoadNetwork(Bounds viewportBounds)
    {
        // Dynamic loading based on viewport
        // Network simplification for gameplay
        // Path validation system
    }
    #endregion
}


Dynamic loading based on viewport
Network simplification
Path validation
Intersection detection
Platform Support
Mobile Optimization
Target Specifications:
Minimum: Android 7.0+, iOS 12.0+
Recommended: Android 10.0+, iOS 14.0+
Performance optimizations:
Tile caching
Network data compression
Efficient path rendering
Input System
public class InputManager : MonoBehaviour
{
    #region Input Modes
    public enum InputMode
    {
        Touch,
        MouseKeyboard,
        Controller
    }
    
    [SerializeField] private float m_TouchSensitivity = 1.0f;
    [SerializeField] private float m_ControllerSensitivity = 1.0f;
    #endregion
}
ouch input with gesture recognition
Mouse/keyboard support
Controller support with reticle movement
Input switching based on last used device
Online/Offline Functionality
Online Features
Real-time leaderboards
Daily challenges
Social features
Cloud save synchronization
Offline Support (Optional)
Leveraging Online Maps caching system
Local leaderboards
Preset challenges
Progress synchronization when online
POI and Collectibles System
POI Categories

public enum POICategory
{
    Restaurants,
    Museums,
    MusicVenues,
    Historical,
    Shopping,
    Entertainment
}
Collectible Generation
Dynamic spawning based on POI locations
Category-based rewards
Time-based refresh system
Rarity tiers
Algorithm Visualization System
Supported Algorithms
public enum PathfindingAlgorithm
{
    AStar,
    Dijkstra,
    BreadthFirst,
    CustomAesthetic,
    DailySpecial
}


public enum PathfindingAlgorithm
{
    AStar,
    Dijkstra,
    BreadthFirst,
    CustomAesthetic,
    DailySpecial
}
Visualization Features
Custom shader effects
Animated path progression
Educational overlays
Performance optimization for mobile
Development Priorities
Phase 1: Core Mechanics
Basic map integration
Path drawing system
Simple algorithm visualization
Basic scoring system
Phase 2: Enhanced Features
Multiple algorithms
POI system
Collectibles
Advanced visualization
Phase 3: Polish & Social
UI/UX refinement
Leaderboards
Daily challenges
Social features
Questions for Future Development
Should we implement a tutorial system?
How should we handle areas with poor map data?
What's the monetization strategy?
Should we implement a level/difficulty system?


