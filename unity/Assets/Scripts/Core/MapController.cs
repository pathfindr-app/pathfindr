using System.Collections;
using System.Collections.Generic;
using UnityEngine;

/// <summary>
/// Main game controller - Unity port of React Map.jsx component
/// Manages game state, user input, and coordinates all subsystems
/// </summary>
public partial class MapController : MonoBehaviour
{
    [Header("Game Settings")]
    public GameSettings gameSettings;
    
    [Header("References")]
    public GameInterface gameInterface;
    public OnlineMapsController mapsController;
    public MarkerStateManager markerStateManager;
    public VisualEffectsManager vfxManager;
    
    [Header("Optional Components")]
    public PathfindingManager pathfindingManager; // Optional - for advanced algorithm management
    
    // Game State - matches React component states
    public enum GamePhase
    {
        Setup,          // Initial state, place start/end points
        Drawing,        // Player drawing their route guess
        PlayerAnimation,    // Animating player's route
        AlgorithmAnimation, // Animating optimal algorithm route  
        Complete        // Show results and scoring
    }
    
    [Header("Current State")]
    public GamePhase currentPhase = GamePhase.Setup;
    public bool gameMode = false;
    public float playerScore = 0f;
    
    // Pathfinding mode is now managed by MarkerStateManager
    
    [Header("Debug")]
    public bool enableDebugLogs = true;
    
    // Node references - now created from MarkerStateManager when needed
    private PathfindingNode startNode;
    private PathfindingNode endNode;
    
    // Route data
    private List<Vector2> playerRoute = new List<Vector2>();
    private List<Vector2> algorithmRoute = new List<Vector2>();
    
    // Input handling
    private bool isDrawingRoute = false;
    private Vector2 lastDrawPoint;
    private float drawDistanceThreshold = 0.01f; // Minimum distance between route points
    
    // Click debouncing (ported from React - 50ms debounce)
    private float lastClickTime = 0f;
    private const float CLICK_DEBOUNCE_TIME = 0.05f; // 50ms like React
    
    // Click vs Drag detection (for proper map navigation)
    private bool isMouseDown = false;
    private Vector2 mouseDownPosition;
    private float mouseDownTime;
    private const float DRAG_THRESHOLD = 15f; // pixels - if mouse moves more than this, it's a drag
    private const float CLICK_TIMEOUT = 0.5f; // seconds - if held longer than this, it's not a click
    
    // Background algorithm processing (ported from React)
    private Coroutine backgroundAlgorithmCoroutine;
    private bool algorithmReady = false;
    
    // Pathfinding mode status (compatibility property)
    public bool pathfindingModeActive
    {
        get
        {
            return markerStateManager != null && markerStateManager.CurrentPlacementMode != PathfindingPlacementMode.Disabled;
        }
    }
    
    // Marker placement coroutines (prevent overlapping placements)
    private Coroutine currentStartPlacementCoroutine;
    private Coroutine currentEndPlacementCoroutine;
    
    // Background waypoints system (matches React's backgroundWaypoints.current)
    private List<BackgroundWaypoint> backgroundWaypoints = new List<BackgroundWaypoint>();
    private float backgroundTimer = 0f;
    
    // Background algorithm state (matches React's backgroundAlgorithmState.current)
    private PathfindingAlgorithm backgroundAlgorithm;
    public PathfindingGraph currentGraph;
    
    void Start()
    {
        InitializeGame();
    }
    
    void OnEnable()
    {
        // Subscribe to marker events from new architecture
        MarkerStateManager.OnMarkersReady += HandleMarkersReady;
        MarkerStateManager.OnMarkersCleared += HandleMarkersCleared;
    }
    
    void OnDisable()
    {
        // Unsubscribe from marker events
        MarkerStateManager.OnMarkersReady -= HandleMarkersReady;
        MarkerStateManager.OnMarkersCleared -= HandleMarkersCleared;
    }
    
    void Update()
    {
        HandleInput();
        UpdateGameLogic();
    }
    
    #region Initialization
    
    void InitializeGame()
    {
        currentPhase = GamePhase.Setup;
        
        // Initialize OnlineMapsController (new architecture)
        if (mapsController == null)
            mapsController = FindObjectOfType<OnlineMapsController>();
            
        // Initialize MarkerStateManager (new architecture)
        if (markerStateManager == null)
            markerStateManager = FindObjectOfType<MarkerStateManager>();
            
        // Initialize pathfinding manager (optional)
        if (pathfindingManager == null)
            pathfindingManager = GetComponent<PathfindingManager>(); // Optional component
            
        // Initialize UI
        if (gameInterface == null)
            gameInterface = FindObjectOfType<GameInterface>();
            
        // Initialize VFX
        if (vfxManager == null)
            vfxManager = GetComponent<VisualEffectsManager>();
            
        // Setup event listeners
        SetupEventListeners();
        
        if (enableDebugLogs)
        {
            Debug.Log("[MapController] Initialized with new event-driven architecture");
        }
    }
    
    void SetupEventListeners()
    {
        // UI events - simplified with new architecture
        if (gameInterface != null)
        {
            gameInterface.OnStartGameClicked += StartGameMode;
            gameInterface.OnAlgorithmChanged += ChangeAlgorithm;
            gameInterface.OnNewLocationClicked += LoadNewLocation;
        }
        
        if (enableDebugLogs)
        {
            Debug.Log("[MapController] Event listeners setup complete");
        }
    }
    
    #endregion
    
    #region Input Handling - Simplified with New Architecture
    
    void HandleInput()
    {
        // Handle touch/mouse input for route drawing
        if (currentPhase == GamePhase.Drawing && gameMode)
        {
            HandleRouteDrawing();
        }
    }
    
    // Old input handling methods removed - now handled by OnlineMapsController + MarkerStateManager
    
    void HandleRouteDrawing()
    {
        // Apply React's click debouncing to prevent rapid-fire waypoint placement
        if (Time.time - lastClickTime < CLICK_DEBOUNCE_TIME)
            return;
            
        // Handle click-to-place waypoints (like React version)
        bool clickDetected = Input.GetMouseButtonDown(0) || 
                            (Input.touchCount > 0 && Input.GetTouch(0).phase == TouchPhase.Began);
        
        if (clickDetected && mapsController != null && mapsController.IsReady())
        {
            // Performance timing measurement (like React)
            float inputStart = Time.realtimeSinceStartup;
            
            Vector2 screenPos = Input.mousePosition;
            if (Input.touchCount > 0)
                screenPos = Input.GetTouch(0).position;
                
            Vector2 geoPos = mapsController.ScreenToGeoCoordinate(screenPos);
            
            // Enhanced coordinate validation
            if (IsValidGeoCoordinate(geoPos))
            {
                if (!isDrawingRoute)
                {
                    Debug.Log("Starting route drawing with first waypoint");
                    StartRouteDrawing(geoPos);
                }
                else
                {
                    Debug.Log($"Adding waypoint {playerRoute.Count + 1} to route");
                    ContinueRouteDrawing(geoPos);
                    
                    // Check if user clicked near end node to finish route
                    if (endNode != null && Vector2.Distance(geoPos, endNode.geoCoordinate) < 0.001f)
                    {
                        Debug.Log("User clicked near end node - finishing route");
                        FinishRouteDrawing();
                    }
                }
                
                lastClickTime = Time.time; // Update debounce timer
            }
            
            // Performance logging (like React's timing measurements)
            float inputTime = (Time.realtimeSinceStartup - inputStart) * 1000f;
            if (inputTime > 5f) // Log if >5ms (performance concern)
            {
                Debug.Log($"Route drawing input took {inputTime:F1}ms");
            }
        }
        
        // Option: Allow double-click to finish route early
        if (Input.GetMouseButtonDown(0) && Time.time - lastClickTime < 0.3f && isDrawingRoute)
        {
            Debug.Log("Double-click detected - finishing route drawing");
            FinishRouteDrawing();
        }
    }
    
    bool IsValidGeoCoordinate(Vector2 geoCoordinate)
    {
        // Check for NaN values first
        if (float.IsNaN(geoCoordinate.x) || float.IsNaN(geoCoordinate.y))
            return false;
            
        // Check for invalid coordinate conversion (exact 0,0 usually indicates failure)
        if (geoCoordinate.x == 0f && geoCoordinate.y == 0f)
        {
            Debug.LogWarning("Coordinate validation: (0,0) detected - likely coordinate conversion failure");
            return false;
        }
        
        // Check valid coordinate bounds
        return geoCoordinate.x >= -180f && geoCoordinate.x <= 180f &&
               geoCoordinate.y >= -90f && geoCoordinate.y <= 90f;
    }
    
    // Map panning now handled by OnlineMapsController automatically
    
    #endregion
    
    #region Game Logic
    
    void UpdateGameLogic()
    {
        // Update game state based on current phase
        switch (currentPhase)
        {
            case GamePhase.Setup:
                UpdateSetupPhase();
                break;
                
            case GamePhase.Drawing:
                UpdateDrawingPhase();
                break;
                
            case GamePhase.PlayerAnimation:
                UpdatePlayerAnimationPhase();
                break;
                
            case GamePhase.AlgorithmAnimation:
                UpdateAlgorithmAnimationPhase();
                break;
                
            case GamePhase.Complete:
                UpdateCompletePhase();
                break;
        }
    }
    
    void UpdateSetupPhase()
    {
        // Ready state is now managed by MarkerStateManager events
        // This method kept for consistency but functionality moved to event handlers
    }
    
    void UpdateDrawingPhase()
    {
        // Background algorithm processing (ported from React)
        if (!algorithmReady && backgroundAlgorithmCoroutine == null)
        {
            backgroundAlgorithmCoroutine = StartCoroutine(ProcessBackgroundAlgorithm());
        }
    }
    
    void UpdatePlayerAnimationPhase()
    {
        // Player animation is handled by coroutines
        // This could be used for progress tracking or interruption handling
    }
    
    void UpdateAlgorithmAnimationPhase()
    {
        // Algorithm animation is handled by coroutines
        // This could be used for progress tracking or skip functionality
    }
    
    void UpdateCompletePhase()
    {
        // Results are displayed, waiting for user input (Try Again/New Location)
        // No continuous updates needed in this phase
    }
    
    #endregion
    
    #region Marker Event Handlers - New Architecture
    
    /// <summary>
    /// Handle when both markers are ready (from MarkerStateManager)
    /// Now just enables the Start Game button - real nodes loaded when needed
    /// </summary>
    void HandleMarkersReady()
    {
        if (enableDebugLogs)
        {
            // Markers ready - UI will be updated
        }
        
        // Enable start game button - real OSM nodes will be loaded when game starts
        if (gameInterface != null)
        {
            gameInterface.EnableStartGameButton(true);
        }
    }
    
    /// <summary>
    /// Handle when markers are cleared (from MarkerStateManager)
    /// </summary>
    void HandleMarkersCleared()
    {
        startNode = null;
        endNode = null;
        
        if (enableDebugLogs)
        {
            Debug.Log("[MapController] Markers cleared");
        }
        
        // Disable start game button through UI
        if (gameInterface != null)
        {
            gameInterface.EnableStartGameButton(false);
        }
    }
    
    #endregion
    
    #region Node Placement - Legacy Methods (Kept for Algorithm Compatibility)
    
    void PlaceStartNode(Vector2 geoCoordinate)
    {
        // Delegate to MarkerStateManager (Single Source of Truth)
        if (markerStateManager != null)
        {
            markerStateManager.SetStartMarker(geoCoordinate);
        }
        else
        {
            Debug.LogError("[MapController] MarkerStateManager not available for start node placement");
        }
    }
    
    void PlaceEndNode(Vector2 geoCoordinate)
    {
        // Delegate to MarkerStateManager (Single Source of Truth)
        if (markerStateManager != null)
        {
            markerStateManager.SetEndMarker(geoCoordinate);
        }
        else
        {
            Debug.LogError("[MapController] MarkerStateManager not available for end node placement");
        }
    }
    
    /// <summary>
    /// Load pathfinding graph for area (Coroutine version - React's elegant pattern ported)
    /// </summary>
    IEnumerator LoadGraphForAreaCoroutine(Vector2 centerCoordinate)
    {
        if (enableDebugLogs)
        {
            Debug.Log($"Loading OSM graph for area: {centerCoordinate} - using React's elegant patterns");
        }
        
        // Show loading indicator
        if (gameInterface != null)
        {
            gameInterface.ShowLoadingPanel("Loading road network...");
        }
        
        // Initialize new graph
        currentGraph = new PathfindingGraph();
        
        // Use Coroutine-based OSM fetching to prevent blocking
        bool loadSuccess = false;
        float searchRadius = gameSettings?.searchRadius ?? 1.0f; // Default 1km radius
        yield return StartCoroutine(LoadOSMDataCoroutine(centerCoordinate, searchRadius, 
            (success) => { loadSuccess = success; }));
        
        if (loadSuccess && currentGraph != null)
        {
            if (enableDebugLogs)
            {
                Debug.Log($"OSM graph loaded successfully: {currentGraph.GetStats()}");
            }
            
            // Success message
            if (gameInterface != null)
            {
                gameInterface.ShowSnack($"Loaded {currentGraph.nodeCount} nodes, {currentGraph.edgeCount} roads", "success");
            }
        }
        else
        {
            Debug.LogWarning("OSM graph loading failed, using basic fallback mode");
            
            // Ensure we have a basic graph even if OSM fails
            if (currentGraph == null)
            {
                currentGraph = new PathfindingGraph();
            }
            
            if (gameInterface != null)
            {
                gameInterface.ShowSnack("Failed to load road network, using basic mode", "warning");
            }
        }
        
        // Always hide loading panel when done
        if (gameInterface != null)
        {
            gameInterface.HideLoadingPanel();
        }
    }
    
    /// <summary>
    /// Non-blocking OSM data loading using Coroutines (React's elegant approach ported)
    /// </summary>
    IEnumerator LoadOSMDataCoroutine(Vector2 centerCoordinate, float radiusKm, System.Action<bool> onComplete = null)
    {
        if (enableDebugLogs)
        {
            Debug.Log($"Fetching OSM data: center={centerCoordinate}, radius={radiusKm}km");
        }
        
        // Step 1: Build OSM query (React pattern)
        string overpassQuery = BuildOSMQuery(centerCoordinate, radiusKm);
        
        if (enableDebugLogs)
        {
            Debug.Log($"OSM Query: {overpassQuery}");
        }
        
        // Step 2: Fetch OSM data non-blocking (React's elegant async pattern)
        OSMData osmData = null;
        bool fetchComplete = false;
        bool fetchError = false;
        string errorMessage = "";
        
        // Start async fetch and monitor completion
        StartCoroutine(FetchOSMDataCoroutine(overpassQuery, 
            (data) => { osmData = data; fetchComplete = true; },
            (error) => { errorMessage = error; fetchError = true; fetchComplete = true; }
        ));
        
        // Wait for fetch completion with timeout
        float timeout = 30f;
        float startTime = Time.time;
        
        while (!fetchComplete && (Time.time - startTime) < timeout)
        {
            yield return new WaitForSeconds(0.1f); // Check every 100ms
        }
        
        if (fetchError || osmData == null)
        {
            Debug.LogError($"OSM fetch failed: {errorMessage}");
            onComplete?.Invoke(false);
            yield break;
        }
        
        if (!fetchComplete)
        {
            Debug.LogError("OSM fetch timeout - network or API issue");
            onComplete?.Invoke(false);
            yield break;
        }
        
        // Step 3: Build graph using React's elegant two-pass algorithm
        yield return StartCoroutine(BuildGraphFromOSMDataCoroutine(osmData));
        
        if (enableDebugLogs)
        {
            Debug.Log($"OSM data loading complete: {currentGraph?.nodeCount ?? 0} nodes, {currentGraph?.edgeCount ?? 0} edges");
        }
        
        // Success callback
        onComplete?.Invoke(true);
    }
    
    /// <summary>
    /// Build OSM query (matches React's query builder)
    /// </summary>
    string BuildOSMQuery(Vector2 center, float radiusKm)
    {
        float lat = center.y;
        float lng = center.x;
        float radiusMeters = radiusKm * 1000f;
        
        // React's exact query format preserved
        string query = $@"[out:json][timeout:25];
(
  way[""highway""~""^(motorway|trunk|primary|secondary|tertiary|residential|service)$""]
    (around:{radiusMeters},{lat},{lng});
);
(._;>;);
out geom;";
        
        return query;
    }
    
    /// <summary>
    /// Coroutine wrapper for OSM data fetching
    /// </summary>
    IEnumerator FetchOSMDataCoroutine(string query, System.Action<OSMData> onSuccess, System.Action<string> onError)
    {
        // Use the existing OnlineMapsController async method but wrap in Coroutine
        var fetchTask = FetchOSMDataAsync(query);
        
        // Wait for async task completion
        while (!fetchTask.IsCompleted)
        {
            yield return null;
        }
        
        if (fetchTask.Exception != null)
        {
            onError?.Invoke(fetchTask.Exception.GetBaseException().Message);
        }
        else
        {
            onSuccess?.Invoke(fetchTask.Result);
        }
    }
    
    /// <summary>
    /// Async OSM data fetching (uses OnlineMapsBridge)
    /// </summary>
    async System.Threading.Tasks.Task<OSMData> FetchOSMDataAsync(string query)
    {
        try
        {
            // Find OnlineMapsBridge for API URL
            var bridge = FindObjectOfType<OnlineMapsBridge>();
            string apiUrl = bridge?.overpassApiUrl ?? "https://overpass-api.de/api/interpreter";
            
            // Use Unity web request for HTTP request
            using (var request = UnityEngine.Networking.UnityWebRequest.PostWwwForm(apiUrl, ""))
            {
                // Set raw POST body (React's approach)
                byte[] bodyRaw = System.Text.Encoding.UTF8.GetBytes(query);
                request.uploadHandler = new UnityEngine.Networking.UploadHandlerRaw(bodyRaw);
                request.downloadHandler = new UnityEngine.Networking.DownloadHandlerBuffer();
                request.SetRequestHeader("Content-Type", "application/x-www-form-urlencoded");
                
                var operation = request.SendWebRequest();
                while (!operation.isDone)
                    await System.Threading.Tasks.Task.Yield();
                
                if (request.result == UnityEngine.Networking.UnityWebRequest.Result.Success)
                {
                    string jsonResponse = request.downloadHandler.text;
                    
                    if (enableDebugLogs)
                    {
                        Debug.Log($"OSM API response: {jsonResponse.Length} characters");
                    }
                    
                    // Parse JSON response
                    OSMData osmData = JsonUtility.FromJson<OSMData>(jsonResponse);
                    return osmData;
                }
                else
                {
                    throw new System.Exception($"OSM API request failed: {request.error}");
                }
            }
        }
        catch (System.Exception e)
        {
            Debug.LogError($"OSM data fetch error: {e.Message}");
            throw;
        }
    }
    
    /// <summary>
    /// Build graph from OSM data using React's elegant two-pass algorithm (Coroutine version)
    /// </summary>
    IEnumerator BuildGraphFromOSMDataCoroutine(OSMData osmData)
    {
        if (osmData?.elements == null)
        {
            Debug.LogWarning("OSM data is null or has no elements");
            yield break;
        }
        
        if (enableDebugLogs)
        {
            Debug.Log($"Building graph from {osmData.elements.Length} OSM elements using React's two-pass algorithm");
        }
        
        // React Pattern: First pass - Create all nodes
        Dictionary<long, OSMNode> osmNodes = new Dictionary<long, OSMNode>();
        int processedElements = 0;
        const int ELEMENTS_PER_FRAME = 50; // Process in batches to prevent frame drops
        
        foreach (var element in osmData.elements)
        {
            if (element.type == "node")
            {
                // Convert OSMElement to OSMNode
                var osmNode = new OSMNode
                {
                    type = element.type,
                    id = element.id,
                    lat = element.lat,
                    lon = element.lon,
                    tags = element.tags
                };
                
                osmNodes[element.id] = osmNode;
                var pathfindingNode = new PathfindingNode(osmNode);
                currentGraph.AddNode(pathfindingNode);
            }
            
            processedElements++;
            
            // Yield control every batch to prevent frame drops (React's performance pattern)
            if (processedElements % ELEMENTS_PER_FRAME == 0)
            {
                yield return null;
            }
        }
        
        if (enableDebugLogs)
        {
            Debug.Log($"First pass complete: {osmNodes.Count} nodes created");
        }
        
        // React Pattern: Second pass - Create edges from ways
        int edgesCreated = 0;
        int waysProcessed = 0;
        processedElements = 0;
        
        foreach (var element in osmData.elements)
        {
            if (element.type == "way")
            {
                waysProcessed++;
                
                if (element.nodes != null && element.nodes.Length >= 2)
                {
                    string roadType = element.tags?.highway ?? "unknown";
                    
                    // Connect consecutive nodes in the way (React pattern)
                    for (int i = 0; i < element.nodes.Length - 1; i++)
                    {
                        long nodeAId = element.nodes[i];
                        long nodeBId = element.nodes[i + 1];
                        
                        var nodeA = currentGraph.GetNode(nodeAId);
                        var nodeB = currentGraph.GetNode(nodeBId);
                        
                        if (nodeA != null && nodeB != null)
                        {
                            currentGraph.AddEdge(nodeA, nodeB, roadType, true);
                            edgesCreated++;
                        }
                    }
                }
            }
            
            processedElements++;
            
            // Yield control every batch (React's frame-rate conscious processing)
            if (processedElements % ELEMENTS_PER_FRAME == 0)
            {
                yield return null;
            }
        }
        
        if (enableDebugLogs)
        {
            Debug.Log($"Second pass complete: Processed {waysProcessed} ways, created {edgesCreated} edges");
            Debug.Log($"Final graph: {currentGraph.nodeCount} nodes, {currentGraph.edgeCount} edges");
        }
    }
    
    #endregion
    
    #region Route Drawing
    
    void StartRouteDrawing(Vector2 geoCoordinate)
    {
        isDrawingRoute = true;
        playerRoute.Clear();
        playerRoute.Add(geoCoordinate);
        lastDrawPoint = geoCoordinate;
        
        vfxManager.StartPlayerRouteDrawing();
        
        // Trigger background algorithm on first waypoint (matches React behavior)
        if (playerRoute.Count == 1 && !algorithmReady && backgroundAlgorithmCoroutine == null)
        {
            Debug.Log("First waypoint placed, starting background algorithm");
            backgroundAlgorithmCoroutine = StartCoroutine(ProcessBackgroundAlgorithm());
        }
    }
    
    void ContinueRouteDrawing(Vector2 geoCoordinate)
    {
        // Use geographic distance for more accurate threshold
        float distance = Vector2.Distance(geoCoordinate, lastDrawPoint);
        
        // Enhanced distance filtering with configurable threshold
        float adjustedThreshold = gameSettings?.drawDistanceThreshold ?? drawDistanceThreshold;
        
        if (distance > adjustedThreshold)
        {
            playerRoute.Add(geoCoordinate);
            lastDrawPoint = geoCoordinate;
            
            vfxManager.ExtendPlayerRoute(geoCoordinate);
            
            // Optional: Limit maximum route points for performance
            if (playerRoute.Count > 100) // Reasonable limit
            {
                Debug.Log("Route reached maximum waypoint limit");
                FinishRouteDrawing();
            }
        }
    }
    
    void FinishRouteDrawing()
    {
        isDrawingRoute = false;
        
        if (playerRoute.Count > 1)
        {
            vfxManager.CompletePlayerRouteDrawing();
            TransitionToPlayerAnimation();
        }
    }
    
    /// <summary>
    /// Build graph for start node using React's exact method and timing
    /// Mirrors React: getMapGraph(getBoundingBoxFromPolygon(circle), node.id)
    /// </summary>
    public System.Collections.IEnumerator BuildGraphForStartNode(Vector2 startCoordinate, long startNodeId)
    {
        if (enableDebugLogs)
        {
            Debug.Log($"[MapController] Building graph using React method for start node at {startCoordinate}, startNodeId={startNodeId}");
        }
        
        // Get user's radius setting (default 4km like React default)
        float userRadius = gameSettings?.searchRadius ?? 4.0f;
        
        if (enableDebugLogs)
        {
            Debug.Log($"[MapController] Using user radius: {userRadius}km (React style)");
        }
        
        // Initialize new graph using simple approach
        currentGraph = new PathfindingGraph();
        
        // Fetch OSM data within radius around start coordinate (React approach)
        bool loadSuccess = false;
        yield return StartCoroutine(LoadOSMDataCoroutineWithStartNode(startCoordinate, userRadius, startNodeId,
            (success) => { loadSuccess = success; }));
        
        if (loadSuccess && currentGraph != null)
        {
            if (enableDebugLogs)
            {
                Debug.Log($"[MapController] Graph built successfully using React method: {currentGraph.GetStats()}");
                Debug.Log($"[MapController] StartNode set: {(currentGraph.startNode != null ? currentGraph.startNode.id.ToString() : "null")}");
            }
        }
        else
        {
            Debug.LogError("[MapController] Failed to build graph using React method");
        }
    }
    
    /// <summary>
    /// Load OSM data and build graph with startNode set (React style)
    /// </summary>
    System.Collections.IEnumerator LoadOSMDataCoroutineWithStartNode(Vector2 centerCoordinate, float searchRadius, long startNodeId, System.Action<bool> onComplete)
    {
        if (enableDebugLogs)
        {
            Debug.Log($"Fetching OSM data: center={centerCoordinate}, radius={searchRadius}km, startNodeId={startNodeId}");
        }
        
        // Build OSM query
        string osmQuery = BuildOSMQuery(centerCoordinate, searchRadius);
        if (enableDebugLogs)
        {
            Debug.Log($"OSM Query: {osmQuery}");
        }
        
        // Fetch OSM data asynchronously
        OSMData osmData = null;
        bool fetchComplete = false;
        string fetchError = null;
        yield return StartCoroutine(FetchOSMDataCoroutine(osmQuery, 
            (data) => { osmData = data; fetchComplete = true; },
            (error) => { fetchError = error; fetchComplete = true; }));
        
        if (osmData == null || fetchError != null)
        {
            Debug.LogError($"OSM fetch failed: {fetchError}");
            onComplete?.Invoke(false);
            yield break;
        }
        
        if (enableDebugLogs)
        {
            Debug.Log($"OSM data loaded: {osmData.elements?.Length ?? 0} elements");
        }
        
        // Build graph from OSM data with startNodeId (React style)
        yield return StartCoroutine(BuildGraphFromOSMDataCoroutineWithStartNode(osmData, startNodeId));
        
        if (enableDebugLogs)
        {
            Debug.Log($"OSM data loading complete: {currentGraph?.nodeCount ?? 0} nodes, {currentGraph?.edgeCount ?? 0} edges");
        }
        
        onComplete?.Invoke(currentGraph != null && currentGraph.nodeCount > 0);
    }
    
    /// <summary>
    /// Build graph from OSM data with startNode set (React style)
    /// </summary>
    System.Collections.IEnumerator BuildGraphFromOSMDataCoroutineWithStartNode(OSMData osmData, long startNodeId)
    {
        if (osmData?.elements == null)
        {
            Debug.LogWarning("OSM data is null or has no elements");
            yield break;
        }
        
        if (enableDebugLogs)
        {
            Debug.Log($"Building graph from {osmData.elements.Length} OSM elements with startNodeId={startNodeId} (React style)");
        }
        
        // Use React's exact method with startNodeId
        currentGraph.BuildFromOSMData(osmData, startNodeId);
        
        // Yield to prevent blocking
        yield return null;
    }
    
    #endregion
    
    #region Game State Transitions
    
    public void StartGameMode()
    {
        if (enableDebugLogs)
        {
            Debug.Log("[MapController] StartGameMode called - React timing approach");
        }
        
        // Ensure we have current marker data and graph is already built (React timing)
        if (markerStateManager != null && markerStateManager.HasBothMarkers())
        {
            if (currentGraph == null || currentGraph.nodeCount == 0)
            {
                Debug.LogWarning("[MapController] Graph not ready - start marker should have built it already (React timing)");
                return;
            }
            
            gameMode = true;
            currentPhase = GamePhase.Setup;
            
            // Start algorithm execution with pre-built graph (React approach)
            StartCoroutine(StartGameModeWithExistingGraph());
        }
        else
        {
            Debug.LogWarning("[MapController] Cannot start game mode - MarkerStateManager not ready or missing markers");
        }
    }
    
    /// <summary>
    /// Start game mode with existing graph (React timing approach)
    /// Graph is already built when start marker was placed
    /// </summary>
    System.Collections.IEnumerator StartGameModeWithExistingGraph()
    {
        if (enableDebugLogs)
        {
            Debug.Log("[MapController] Starting game with existing graph (React timing)");
        }
        
        // Get real end node ID from markers (start node is already set in graph)
        PathfindingNode realEndNode = null;
        
        bool endNodeReady = false;
        System.Exception nodeError = null;
        
        // Get real end node asynchronously  
        yield return StartCoroutine(GetRealEndNodeCoroutine((end, error) => {
            realEndNode = end;
            nodeError = error;
            endNodeReady = true;
        }));
        
        if (nodeError != null || realEndNode == null)
        {
            Debug.LogError($"[MapController] Failed to get real end node: {nodeError?.Message}");
            yield break;
        }
        
        // React approach: start node already set during graph building, find end node in existing graph
        startNode = currentGraph.startNode; // Already set during graph construction
        
        // React: const realEndNode = state.current.getNode(node.id);
        endNode = currentGraph.GetNode(realEndNode.id);
        
        if (endNode == null)
        {
            // Fallback: find nearest node in graph if exact ID not found
            endNode = currentGraph.FindNearestNode(realEndNode.geoCoordinate);
            if (enableDebugLogs && endNode != null)
            {
                Debug.Log($"[MapController] End node {realEndNode.id} not in graph, using nearest: {endNode.id}");
            }
        }
        
        if (startNode == null || endNode == null)
        {
            Debug.LogError("[MapController] Start or end nodes not found in existing graph");
            yield break;
        }
        
        currentGraph.SetStartNode(startNode);
        currentGraph.SetEndNode(endNode);
        
        if (enableDebugLogs)
        {
            Debug.Log($"[MapController] Ready to start algorithms with existing graph:");
            Debug.Log($"  Start: ID={startNode.id}, Coord={startNode.geoCoordinate}");
            Debug.Log($"  End: ID={endNode.id}, Coord={endNode.geoCoordinate}");
        }
        
        // Start algorithm visualization
        currentPhase = GamePhase.AlgorithmAnimation;
        StartAlgorithmVisualization();
    }
    
    /// <summary>
    /// Async game mode startup - loads real OSM graph and finds real start/end nodes
    /// Mirrors React's getMapGraph() -> algorithm flow
    /// </summary>
    IEnumerator StartGameModeAsync()
    {
        if (enableDebugLogs)
        {
            Debug.Log("[MapController] Starting async game mode with real OSM data");
        }
        
        // Show loading UI
        if (gameInterface != null)
        {
            gameInterface.ShowLoadingPanel("Loading road network...");
        }
        
        // Step 1: Get real OSM start and end nodes using OnlineMapsBridge
        PathfindingNode realStartNode = null;
        PathfindingNode realEndNode = null;
        
        bool nodesReady = false;
        System.Exception nodeError = null;
        
        // Start async node finding
        StartCoroutine(GetRealNodesAsync((start, end, error) => {
            realStartNode = start;
            realEndNode = end;
            nodeError = error;
            nodesReady = true;
        }));
        
        // Wait for nodes
        yield return new WaitUntil(() => nodesReady);
        
        if (nodeError != null)
        {
            Debug.LogError($"[MapController] Failed to get real OSM nodes: {nodeError.Message}");
            if (gameInterface != null)
            {
                gameInterface.HideLoadingPanel();
                gameInterface.ShowSnack("Failed to load road network", "error");
            }
            yield break;
        }
        
        if (realStartNode == null || realEndNode == null)
        {
            Debug.LogError("[MapController] Real OSM nodes not found near markers");
            if (gameInterface != null)
            {
                gameInterface.HideLoadingPanel();
                gameInterface.ShowSnack("No roads found near markers", "warning");
            }
            yield break;
        }
        
        // Step 2: Load real OSM graph for the area (mirrors React's getMapGraph)
        Vector2 centerCoord = Vector2.Lerp(realStartNode.geoCoordinate, realEndNode.geoCoordinate, 0.5f);
        bool graphLoaded = false;
        
        yield return StartCoroutine(LoadGraphForAreaCoroutine(centerCoord));
        
        if (currentGraph == null || currentGraph.nodeCount == 0)
        {
            Debug.LogError("[MapController] Failed to load OSM graph for area");
            if (gameInterface != null)
            {
                gameInterface.HideLoadingPanel();
                gameInterface.ShowSnack("Failed to load road network", "error");
            }
            yield break;
        }
        
        // Step 3: Find start and end nodes within the loaded graph
        startNode = currentGraph.FindNearestNode(realStartNode.geoCoordinate);
        endNode = currentGraph.FindNearestNode(realEndNode.geoCoordinate);
        
        if (startNode == null || endNode == null)
        {
            Debug.LogError("[MapController] Start or end nodes not found in loaded graph");
            if (gameInterface != null)
            {
                gameInterface.HideLoadingPanel();
                gameInterface.ShowSnack("Nodes not connected to road network", "warning");
            }
            yield break;
        }
        
        // Set start and end nodes in graph
        currentGraph.SetStartNode(startNode);
        currentGraph.SetEndNode(endNode);
        
        if (enableDebugLogs)
        {
            Debug.Log($"[MapController] Real OSM setup complete:");
            Debug.Log($"  Graph: {currentGraph.nodeCount} nodes, {currentGraph.edgeCount} edges");
            Debug.Log($"  Start: ID={startNode.id}, Coord={startNode.geoCoordinate}");
            Debug.Log($"  End: ID={endNode.id}, Coord={endNode.geoCoordinate}");
        }
        
        // Step 4: Start algorithm visualization with real connected nodes
        currentPhase = GamePhase.AlgorithmAnimation;
        
        if (gameInterface != null)
        {
            gameInterface.HideLoadingPanel();
            gameInterface.ShowSnack($"Loaded {currentGraph.nodeCount} road nodes", "success");
        }
        
        StartAlgorithmVisualization();
        
        if (enableDebugLogs)
        {
            Debug.Log("[MapController] Game mode started successfully with real OSM data");
        }
    }
    
    /// <summary>
    /// Get real OSM nodes from marker positions using OnlineMapsBridge
    /// </summary>
    IEnumerator GetRealNodesAsync(System.Action<PathfindingNode, PathfindingNode, System.Exception> callback)
    {
        PathfindingNode startNode = null;
        PathfindingNode endNode = null;
        bool startDone = false;
        bool endDone = false;
        System.Exception error = null;
        
        // Get start node
        StartCoroutine(GetRealNodeCoroutine(true, (node, err) => {
            startNode = node;
            error = err;
            startDone = true;
        }));
        
        // Get end node  
        StartCoroutine(GetRealNodeCoroutine(false, (node, err) => {
            endNode = node;
            if (err != null) error = err;
            endDone = true;
        }));
        
        yield return new WaitUntil(() => startDone && endDone);
        
        callback?.Invoke(startNode, endNode, error);
    }
    
    /// <summary>
    /// Get single real node using async MarkerStateManager methods
    /// </summary>
    IEnumerator GetRealNodeCoroutine(bool isStart, System.Action<PathfindingNode, System.Exception> callback)
    {
        PathfindingNode resultNode = null;
        System.Exception error = null;
        bool done = false;
        
        // Start async task
        System.Threading.Tasks.Task<PathfindingNode> task = isStart ? 
            markerStateManager.CreateStartNodeAsync() : 
            markerStateManager.CreateEndNodeAsync();
        
        // Wait for completion
        while (!task.IsCompleted)
        {
            yield return null;
        }
        
        if (task.Exception != null)
        {
            error = task.Exception.GetBaseException();
        }
        else
        {
            resultNode = task.Result;
        }
        
        callback?.Invoke(resultNode, error);
    }
    
    /// <summary>
    /// Get single real end node using async MarkerStateManager method
    /// </summary>
    IEnumerator GetRealEndNodeCoroutine(System.Action<PathfindingNode, System.Exception> callback)
    {
        PathfindingNode resultNode = null;
        System.Exception error = null;
        
        // Start async task for end node
        var task = markerStateManager.CreateEndNodeAsync();
        
        // Wait for completion
        while (!task.IsCompleted)
        {
            yield return null;
        }
        
        if (task.Exception != null)
        {
            error = task.Exception.GetBaseException();
        }
        else
        {
            resultNode = task.Result;
        }
        
        callback?.Invoke(resultNode, error);
    }
    
    /// <summary>
    /// Start algorithm visualization using new system
    /// </summary>
    void StartAlgorithmVisualization()
    {
        // Find or create AlgorithmStepExecutor
        AlgorithmStepExecutor stepExecutor = FindObjectOfType<AlgorithmStepExecutor>();
        if (stepExecutor == null)
        {
            GameObject executorObj = new GameObject("AlgorithmStepExecutor");
            stepExecutor = executorObj.AddComponent<AlgorithmStepExecutor>();
            if (enableDebugLogs)
            {
                Debug.Log("[MapController] Created AlgorithmStepExecutor");
            }
        }
        
        // Create A* algorithm instance
        PathfindingAlgorithm algorithm = PathfindingAlgorithm.CreateAlgorithm(PathfindingAlgorithm.AlgorithmType.AStar);
        
        if (algorithm != null && startNode != null && endNode != null)
        {
            // ENHANCED PATH 1 FIX: Use actual graph nodes with full precision coordinates
            PathfindingNode graphStartNode = currentGraph?.GetNode(startNode.id) ?? startNode;
            PathfindingNode graphEndNode = currentGraph?.GetNode(endNode.id) ?? endNode;

            // CRITICAL VALIDATION: Check for coordinate precision loss (September 13th issue)
            bool startNodeHasPrecision = ValidateNodePrecision(startNode, graphStartNode, "start");
            bool endNodeHasPrecision = ValidateNodePrecision(endNode, graphEndNode, "end");

            if (!startNodeHasPrecision || !endNodeHasPrecision)
            {
                Debug.LogError("[MapController] CRITICAL: Coordinate precision loss detected - algorithm will show zero-length segments!");
                return;
            }

            // Start the step-by-step visualization with validated graph nodes
            stepExecutor.StartAlgorithm(algorithm, graphStartNode, graphEndNode);

            if (enableDebugLogs)
            {
                Debug.Log($"[MapController] Started A* visualization with FULL PRECISION coordinates:");
                Debug.Log($"  Start: ({graphStartNode.geoCoordinate.x:F8}, {graphStartNode.geoCoordinate.y:F8}) (ID={graphStartNode.id})");
                Debug.Log($"  End: ({graphEndNode.geoCoordinate.x:F8}, {graphEndNode.geoCoordinate.y:F8}) (ID={graphEndNode.id})");

                float distance = Vector2.Distance(graphStartNode.geoCoordinate, graphEndNode.geoCoordinate);
                Debug.Log($"  Distance between nodes: {distance:F8} (should be > 0.00001 for visible lines)");
            }
        }
        else
        {
            Debug.LogError("[MapController] Failed to start algorithm visualization - missing algorithm or nodes");
        }
    }
    
    void TransitionToPlayerAnimation()
    {
        currentPhase = GamePhase.PlayerAnimation;
        StartCoroutine(AnimatePlayerRoute());
    }
    
    void TransitionToAlgorithmAnimation()
    {
        currentPhase = GamePhase.AlgorithmAnimation;
        StartCoroutine(AnimateAlgorithmRoute());
    }
    
    void TransitionToComplete()
    {
        currentPhase = GamePhase.Complete;
        CalculateScore();
        gameInterface.ShowResults(playerScore);
    }
    
    #endregion
    
    #region Algorithm Processing
    
    IEnumerator ProcessBackgroundAlgorithm()
    {
        // Background algorithm processing (ported from React optimization)
        // Matches React's runAlgorithmSilently() behavior
        yield return new WaitForSeconds(0.1f);
        
        if (startNode != null && endNode != null && currentGraph != null)
        {
            Debug.Log("Starting silent background algorithm");
            
            // Reset graph for new pathfinding (matches React's reset)
            currentGraph.ResetNodes();
            
            // Reset background state (matches React's backgroundAlgorithmState.current.reset())
            backgroundWaypoints.Clear();
            backgroundTimer = 0f;
            
            // Create algorithm instance and set graph (matches React's pattern)
            var algorithmType = gameSettings?.defaultAlgorithm ?? PathfindingAlgorithm.AlgorithmType.AStar;
            backgroundAlgorithm = PathfindingAlgorithm.CreateAlgorithm(algorithmType);
            backgroundAlgorithm.Start(startNode, endNode);
            
            // Process algorithm steps over multiple frames (non-blocking)
            int stepCount = 0;
            const int MAX_STEPS_PER_FRAME = 10; // Prevent frame drops
            
            while (!backgroundAlgorithm.IsFinished() && stepCount < 10000) // Safety limit
            {
                // Process multiple steps per frame for performance
                for (int i = 0; i < MAX_STEPS_PER_FRAME && !backgroundAlgorithm.IsFinished(); i++)
                {
                    var updatedNodes = backgroundAlgorithm.NextStep();
                    stepCount++;
                    
                    // Generate waypoints silently (matches React's backgroundWaypoints storage)
                    foreach (var node in updatedNodes)
                    {
                        if (node.referer != null)
                        {
                            // Calculate distance and time (matches React's formula)
                            float distance = Vector2.Distance(node.referer.geoCoordinate, node.geoCoordinate);
                            float animSpeed = gameSettings?.animationSpeed ?? 5f;
                            float timeAdd = distance * 5000f * (1f / animSpeed); // Reduced from 50000f for faster animation
                            
                            // Create background waypoint (matches React's waypoint structure)
                            var waypoint = new BackgroundWaypoint(
                                node.referer,
                                node,
                                backgroundTimer,
                                timeAdd,
                                "exploration"
                            );
                            
                            backgroundWaypoints.Add(waypoint);
                            backgroundTimer += timeAdd;
                        }
                    }
                }
                
                // Yield control to prevent blocking main thread
                yield return null;
            }
            
            // Algorithm completed - get final path
            var pathNodes = backgroundAlgorithm.GetPath();
            algorithmRoute = ConvertNodesToCoordinates(pathNodes);
            algorithmReady = true;
            
            Debug.Log($"Background algorithm completed: {stepCount} steps, path length: {pathNodes.Count}");
            Debug.Log($"Background waypoints generated: {backgroundWaypoints.Count}, total time: {backgroundTimer:F2}s");
        }
    }
    
    IEnumerator AnimatePlayerRoute()
    {
        yield return vfxManager.AnimateRoute(playerRoute, PathfindrRouteType.PlayerRoute);
        TransitionToAlgorithmAnimation();
    }
    
    IEnumerator AnimateAlgorithmRoute()
    {
        // Instant animation fallback system (matches React's optimization)
        if (!algorithmReady)
        {
            Debug.Log("Algorithm not ready, falling back to synchronous method");
            // Fallback: run algorithm synchronously if background isn't ready
            yield return StartCoroutine(RunAlgorithmSynchronous());
        }
        else
        {
            Debug.Log("Using pre-calculated algorithm results for instant animation");
            Debug.Log($"Background waypoints available: {backgroundWaypoints.Count}");
        }
        
        // Use background waypoints for synchronized animation (matches React)
        if (backgroundWaypoints.Count > 0)
        {
            yield return StartCoroutine(AnimateBackgroundWaypoints());
        }
        else
        {
            // Fallback to basic route animation
            yield return vfxManager.AnimateRoute(algorithmRoute, PathfindrRouteType.OptimalRoute);
        }
        
        TransitionToComplete();
    }
    
    /// <summary>
    /// Synchronous algorithm fallback (matches React's fallback behavior)
    /// </summary>
    IEnumerator RunAlgorithmSynchronous()
    {
        if (startNode == null || endNode == null || currentGraph == null) yield break;
        
        Debug.Log("Running synchronous algorithm as fallback");
        
        currentGraph.ResetNodes();
        var algorithmType = gameSettings?.defaultAlgorithm ?? PathfindingAlgorithm.AlgorithmType.AStar;
        var fallbackAlgorithm = PathfindingAlgorithm.CreateAlgorithm(algorithmType);
        fallbackAlgorithm.Start(startNode, endNode);
        
        // Run algorithm steps with frame yields
        while (!fallbackAlgorithm.IsFinished())
        {
            fallbackAlgorithm.NextStep();
            yield return null; // Yield every step to prevent blocking
        }
        
        var pathNodes = fallbackAlgorithm.GetPath();
        algorithmRoute = ConvertNodesToCoordinates(pathNodes);
        algorithmReady = true;
        
        Debug.Log("Synchronous algorithm fallback completed");
    }
    
    /// <summary>
    /// Animate using background waypoints (matches React's instant animation)
    /// </summary>
    IEnumerator AnimateBackgroundWaypoints()
    {
        Debug.Log($"Animating {backgroundWaypoints.Count} background waypoints over {backgroundTimer:F2}s");
        
        float animationStartTime = Time.time;
        float animationSpeed = gameSettings?.animationSpeed ?? 5f;
        
        // Sort waypoints by start time
        backgroundWaypoints.Sort((a, b) => a.StartTime.CompareTo(b.StartTime));
        
        // Animate waypoints over time
        while (Time.time - animationStartTime < backgroundTimer / animationSpeed)
        {
            float currentAnimationTime = (Time.time - animationStartTime) * animationSpeed;
            
            // Update active waypoints
            foreach (var waypoint in backgroundWaypoints)
            {
                if (waypoint.IsActiveAtTime(currentAnimationTime))
                {
                    // Get current waypoint progress and position
                    float progress = waypoint.GetProgressAtTime(currentAnimationTime);
                    Vector2 currentPos = waypoint.GetPositionAtTime(currentAnimationTime);
                    
                    // Trigger actual visual effects using existing VFX methods
                    // (VFX manager handles coordinate conversion internally for consistency)
                    if (vfxManager != null)
                    {
                        // Show exploration particle at current position
                        vfxManager.ShowExploredNode(currentPos);
                        
                        // Create trail effect by showing nodes at regular intervals
                        if (progress > 0.1f && progress < 0.9f) // Avoid showing too many at start/end
                        {
                            // Show intermediate exploration points for trail effect
                            Vector2 trailPos = Vector2.Lerp(waypoint.FromCoordinate, waypoint.ToCoordinate, 
                                                          progress * 0.8f + 0.1f);
                            vfxManager.ShowExploredNode(trailPos);
                        }
                    }
                }
            }
            
            yield return null;
        }
        
        Debug.Log("Background waypoints animation completed");
    }
    
    #endregion
    
    #region Scoring
    
    void CalculateScore()
    {
        if (playerRoute.Count == 0 || endNode == null)
        {
            Debug.Log("Score calculation failed: missing route or endNode", this);
            playerScore = 0f;
            return;
        }
        
        // Port of React's advanced scoring system with waypoint coverage
        Debug.Log("Analyzing player waypoint coverage of optimal path...");
        
        // Build optimal path from algorithm result
        List<PathfindingNode> optimalPath = BuildOptimalPath();
        
        if (optimalPath.Count == 0)
        {
            Debug.Log("No optimal path found by algorithm");
            playerScore = 100f; // If algorithm failed, give player full credit
            return;
        }
        
        // Calculate optimal route distance using geographic coordinates
        float optimalDistance = CalculateGeographicDistance(optimalPath);
        int optimalNodeCount = optimalPath.Count;
        int playerWaypointCount = playerRoute.Count;
        
        Debug.Log($"Optimal path: {optimalNodeCount} nodes, distance: {optimalDistance:F0}m");
        
        // Waypoint coverage analysis (React's core scoring feature)
        int nodesHit = 0;
        const float HIT_THRESHOLD = 0.001f; // ~111m in geographic coordinates
        
        // Check how many optimal nodes the player waypoints are close to
        foreach (var optimalNode in optimalPath)
        {
            foreach (var playerWaypoint in playerRoute)
            {
                float distance = Mathf.Sqrt(
                    Mathf.Pow(optimalNode.geoCoordinate.y - playerWaypoint.y, 2) + 
                    Mathf.Pow(optimalNode.geoCoordinate.x - playerWaypoint.x, 2)
                );
                
                if (distance <= HIT_THRESHOLD)
                {
                    nodesHit++;
                    break; // Count each optimal node only once
                }
            }
        }
        
        // Path coverage efficiency: how much of optimal path did player hit
        float coverageEfficiency = ((float)nodesHit / optimalNodeCount) * 100f;
        
        // Granularity bonus: more waypoints = more detailed planning (up to reasonable limit)
        float granularityBonus = Mathf.Min(10f, playerWaypointCount / 2f); // Max 10% bonus
        
        // Final efficiency with granularity bonus
        playerScore = Mathf.Min(100f, coverageEfficiency + granularityBonus);
        
        Debug.Log($"Waypoint coverage analysis: " +
            $"Player waypoints: {playerWaypointCount}, " +
            $"Optimal nodes: {optimalNodeCount}, " +
            $"Nodes hit: {nodesHit}, " +
            $"Coverage: {coverageEfficiency:F1}%, " +
            $"Granularity bonus: {granularityBonus:F1}%, " +
            $"Final score: {playerScore:F1}%");
    }
    
    List<PathfindingNode> BuildOptimalPath()
    {
        List<PathfindingNode> optimalPath = new List<PathfindingNode>();
        PathfindingNode node = endNode;
        int pathSteps = 0;
        
        // Trace back through parent references (like React's node.parent chain)
        while (node != null && node.referer != null && pathSteps < 1000) // Safety limit
        {
            optimalPath.Insert(0, node); // Add to beginning
            node = node.referer;
            pathSteps++;
        }
        
        // Add start node if we reached it
        if (node != null)
        {
            optimalPath.Insert(0, node);
        }
        
        return optimalPath;
    }
    
    float CalculateGeographicDistance(List<PathfindingNode> path)
    {
        if (path.Count < 2) return 0f;
        
        float totalDistance = 0f;
        
        for (int i = 1; i < path.Count; i++)
        {
            // Use great circle distance (Haversine formula) for accuracy
            totalDistance += path[i-1].GetGreatCircleDistanceTo(path[i]) * 1000f; // Convert to meters
        }
        
        return totalDistance;
    }
    
    float CalculateRouteDistance(List<Vector2> route)
    {
        float totalDistance = 0f;
        
        for (int i = 1; i < route.Count; i++)
        {
            totalDistance += Vector2.Distance(route[i-1], route[i]);
        }
        
        return totalDistance;
    }
    
    #endregion

    #region Coordinate Precision Validation

    /// <summary>
    /// Validate node precision to detect September 13th coordinate issue
    /// </summary>
    private bool ValidateNodePrecision(PathfindingNode originalNode, PathfindingNode graphNode, string nodeType)
    {
        if (originalNode == null || graphNode == null)
        {
            Debug.LogError($"[MapController] {nodeType} node validation failed: null node");
            return false;
        }

        Vector2 originalCoord = originalNode.geoCoordinate;
        Vector2 graphCoord = graphNode.geoCoordinate;

        // Check if coordinates are exactly the same (rounded coordinates issue)
        bool coordinatesIdentical = Vector2.Distance(originalCoord, graphCoord) < 0.000001f;

        // Check if coordinates are rounded (exactly 2 decimal places)
        bool originalIsRounded = IsCoordinateRounded(originalCoord);
        bool graphHasPrecision = !IsCoordinateRounded(graphCoord);

        if (originalIsRounded && coordinatesIdentical)
        {
            Debug.LogWarning($"[MapController] {nodeType} node has ROUNDED coordinates: {originalCoord} (should have full precision like graph nodes)");
            return false;
        }

        if (coordinatesIdentical && !graphHasPrecision)
        {
            Debug.LogError($"[MapController] CRITICAL: Both original and graph {nodeType} nodes have rounded coordinates: {originalCoord}");
            return false;
        }

        if (enableDebugLogs)
        {
            Debug.Log($"[MapController] {nodeType} node precision validation PASSED:");
            Debug.Log($"  Original: {originalCoord} (rounded: {originalIsRounded})");
            Debug.Log($"  Graph: {graphCoord} (rounded: {!graphHasPrecision})");
        }

        return true;
    }

    /// <summary>
    /// Check if coordinates are rounded to 2 decimal places (coordinate precision loss detector)
    /// </summary>
    private bool IsCoordinateRounded(Vector2 coordinate)
    {
        float x = coordinate.x;
        float y = coordinate.y;

        // Calculate what the coordinate would be if rounded to 2 decimal places
        float roundedX = Mathf.Round(x * 100f) / 100f;
        float roundedY = Mathf.Round(y * 100f) / 100f;

        // If the coordinate exactly matches its 2-decimal rounded version, it's likely been rounded
        bool xIsExactlyRounded = Mathf.Approximately(x, roundedX);
        bool yIsExactlyRounded = Mathf.Approximately(y, roundedY);

        // Additional check: see if string representation has only 2 decimal places
        string xStr = x.ToString("F6").TrimEnd('0');
        string yStr = y.ToString("F6").TrimEnd('0');
        bool xHasLimitedDecimals = xStr.Contains('.') && xStr.Split('.')[1].Length <= 2;
        bool yHasLimitedDecimals = yStr.Contains('.') && yStr.Split('.')[1].Length <= 2;

        return (xIsExactlyRounded && yIsExactlyRounded) && (xHasLimitedDecimals && yHasLimitedDecimals);
    }

    #endregion

    #region Helper Methods
    
    /// <summary>
    /// Convert list of pathfinding nodes to geographic coordinates
    /// </summary>
    private List<Vector2> ConvertNodesToCoordinates(List<PathfindingNode> nodes)
    {
        List<Vector2> coordinates = new List<Vector2>();
        foreach (var node in nodes)
        {
            coordinates.Add(node.geoCoordinate);
        }
        return coordinates;
    }
    
    #endregion
    
    #region Public Interface
    
    public void ChangeAlgorithm(PathfindingAlgorithm.AlgorithmType newAlgorithm)
    {
        // Update game settings with new algorithm
        if (gameSettings != null)
        {
            gameSettings.defaultAlgorithm = newAlgorithm;
        }
        
        // Reset background processing for new algorithm
        algorithmReady = false;
        backgroundWaypoints.Clear();
        backgroundTimer = 0f;
        backgroundAlgorithm = null;
        
        if (backgroundAlgorithmCoroutine != null)
        {
            StopCoroutine(backgroundAlgorithmCoroutine);
            backgroundAlgorithmCoroutine = null;
        }
        
        Debug.Log($"Algorithm changed to: {newAlgorithm}");
    }
    
    public void LoadNewLocation()
    {
        // Reset game state and load new map location
        ResetGame();
        if (mapsController != null)
        {
            mapsController.LoadRandomLocation();
        }
    }
    
    public void ResetGame()
    {
        currentPhase = GamePhase.Setup;
        gameMode = false;
        startNode = null;
        endNode = null;
        playerRoute.Clear();
        algorithmRoute.Clear();
        algorithmReady = false;
        
        // Reset background algorithm state (matches React's reset)
        backgroundWaypoints.Clear();
        backgroundTimer = 0f;
        backgroundAlgorithm = null;
        
        if (backgroundAlgorithmCoroutine != null)
        {
            StopCoroutine(backgroundAlgorithmCoroutine);
            backgroundAlgorithmCoroutine = null;
        }
        
        // Stop any running placement coroutines
        if (currentStartPlacementCoroutine != null)
        {
            StopCoroutine(currentStartPlacementCoroutine);
            currentStartPlacementCoroutine = null;
        }
        
        if (currentEndPlacementCoroutine != null)
        {
            StopCoroutine(currentEndPlacementCoroutine);
            currentEndPlacementCoroutine = null;
        }
        
        // Reset graph state
        if (currentGraph != null)
        {
            currentGraph.ResetNodes();
            currentGraph.startNode = null;
            currentGraph.endNode = null;
        }
        
        // Reset markers through MarkerStateManager (Single Source of Truth)
        if (markerStateManager != null)
        {
            markerStateManager.ClearAllMarkers();
            markerStateManager.DisablePlacement();
        }
        
        if (vfxManager != null)
        {
            vfxManager.ClearAllForReset();
        }
        
        if (gameInterface != null)
        {
            gameInterface.ResetUI();
        }
    }
    
    public void NewLocation()
    {
        // Clear graph when moving to new location (force reload)
        currentGraph = null;
        ResetGame();
        
        // Load random location
        if (mapsController != null)
        {
            mapsController.LoadRandomLocation();
        }
        
        if (enableDebugLogs)
        {
            Debug.Log("[MapController] New location - graph cleared for reload");
        }
    }
    
    #endregion
    
    // Pathfinding Mode Control moved to MarkerStateManager
    
    #region Inspector Testing Methods
    
    /// <summary>
    /// Test method - can be called from Inspector buttons
    /// </summary>
    [ContextMenu("Enable Start Point Placement (Click-to-Replace)")]
    public void TestEnableStartPointPlacement()
    {
        if (markerStateManager != null)
        {
            markerStateManager.EnableStartPlacement();
            Debug.Log("[MapController] Start point placement enabled via MarkerStateManager");
        }
        else
        {
            Debug.LogError("[MapController] MarkerStateManager not available for testing");
        }
    }
    
    /// <summary>
    /// Test method - can be called from Inspector buttons  
    /// </summary>
    [ContextMenu("Enable End Point Placement (Click-to-Replace)")]
    public void TestEnableEndPointPlacement()
    {
        if (markerStateManager != null)
        {
            markerStateManager.EnableEndPlacement();
            Debug.Log("[MapController] End point placement enabled via MarkerStateManager");
        }
        else
        {
            Debug.LogError("[MapController] MarkerStateManager not available for testing");
        }
    }
    
    /// <summary>
    /// Test method - can be called from Inspector buttons
    /// </summary>
    [ContextMenu("Reset Pathfinding Points")]
    public void TestResetPathfindingPoints()
    {
        if (markerStateManager != null)
        {
            markerStateManager.ClearAllMarkers();
            markerStateManager.DisablePlacement();
            Debug.Log("[MapController] Pathfinding points reset via MarkerStateManager");
        }
        else
        {
            Debug.LogError("[MapController] MarkerStateManager not available for testing");
        }
    }
    
    /// <summary>
    /// Diagnostic method - can be called from Inspector buttons
    /// </summary>
    [ContextMenu("Diagnose Coordinate System")]
    public void DiagnoseCoordinateSystem()
    {
        if (mapsController != null)
        {
            mapsController.LogDiagnostics();
        }
        else
        {
            Debug.LogError("[MapController] OnlineMapsController is null - cannot run diagnostic");
        }
        
        if (markerStateManager != null)
        {
            markerStateManager.LogMarkerState();
        }
        else
        {
            Debug.LogError("[MapController] MarkerStateManager is null - cannot log marker state");
        }
    }
    
    /// <summary>
    /// Test method - place start point at map center
    /// </summary>
    [ContextMenu("Place Start Point at Map Center")]
    public void TestPlaceStartPointAtMapCenter()
    {
        if (markerStateManager != null)
        {
            markerStateManager.TestPlaceStartAtCenter();
        }
        else
        {
            Debug.LogError("[MapController] MarkerStateManager not available for testing");
        }
    }
    
    /// <summary>
    /// Test method - place end point at map center
    /// </summary>
    [ContextMenu("Place End Point at Map Center")]
    public void TestPlaceEndPointAtMapCenter()
    {
        if (markerStateManager != null)
        {
            markerStateManager.TestPlaceEndAtCenter();
        }
        else
        {
            Debug.LogError("[MapController] MarkerStateManager not available for testing");
        }
    }
    
    /// <summary>
    /// Test OSM graph loading system
    /// </summary>
    [ContextMenu("Test OSM Graph Loading")]
    public void TestOSMGraphLoading()
    {
        if (mapsController != null && mapsController.IsReady())
        {
            Vector2 mapCenter = mapsController.GetMapCenter();
            Debug.Log($"[MapController] Testing OSM graph loading at: {mapCenter}");
            StartCoroutine(TestOSMLoadingCoroutine(mapCenter));
        }
        else
        {
            Debug.LogError("[MapController] OnlineMapsController not ready - cannot test OSM loading");
        }
    }
    
    /// <summary>
    /// Coroutine to test OSM loading system
    /// </summary>
    IEnumerator TestOSMLoadingCoroutine(Vector2 centerCoordinate)
    {
        Debug.Log("=== OSM Graph Loading Test Started ===");
        
        // Clear existing graph
        currentGraph = null;
        
        // Test the new OSM loading system
        yield return StartCoroutine(LoadGraphForAreaCoroutine(centerCoordinate));
        
        if (currentGraph != null)
        {
            Debug.Log($"=== OSM Test SUCCESS ===");
            Debug.Log($"Graph loaded successfully: {currentGraph.GetStats()}");
            Debug.Log($"Nodes: {currentGraph.nodeCount}, Edges: {currentGraph.edgeCount}");
            
            // Test finding nearest nodes
            if (currentGraph.nodeCount > 0)
            {
                var nearestNode = currentGraph.FindNearestNode(centerCoordinate);
                if (nearestNode != null)
                {
                    Debug.Log($"Nearest node to center: ID={nearestNode.id}, Geo={nearestNode.geoCoordinate}");
                }
            }
        }
        else
        {
            Debug.LogWarning("=== OSM Test FAILED === - Graph is null");
        }
        
        Debug.Log("=== OSM Graph Loading Test Complete ===");
    }
    
    #endregion
    
    #region Cleanup
    
    void OnDestroy()
    {
        // Cleanup event listeners - simplified with new architecture
        if (gameInterface != null)
        {
            gameInterface.OnStartGameClicked -= StartGameMode;
            gameInterface.OnAlgorithmChanged -= ChangeAlgorithm;
            gameInterface.OnNewLocationClicked -= LoadNewLocation;
        }
        
        // Marker state events are handled in OnDisable()
        
        if (enableDebugLogs)
        {
            Debug.Log("[MapController] Cleaned up event listeners");
        }
    }
    
    #endregion
    
    #region Compatibility Methods (For UI Components)
    
    /// <summary>
    /// Enable start point placement (compatibility method)
    /// </summary>
    public void EnableStartPointPlacement()
    {
        if (markerStateManager != null)
        {
            markerStateManager.EnableStartPlacement();
            // Removed placement spam
        }
        else
        {
            Debug.LogWarning("MarkerStateManager not found - cannot enable start point placement");
        }
    }
    
    /// <summary>
    /// Enable end point placement (compatibility method)
    /// </summary>
    public void EnableEndPointPlacement()
    {
        if (markerStateManager != null)
        {
            markerStateManager.EnableEndPlacement();
            // Removed placement spam
        }
        else
        {
            Debug.LogWarning("MarkerStateManager not found - cannot enable end point placement");
        }
    }
    
    /// <summary>
    /// Reset pathfinding points (compatibility method)
    /// </summary>
    public void ResetPathfindingPoints()
    {
        if (markerStateManager != null)
        {
            markerStateManager.ClearAllMarkers();
            Debug.Log("Pathfinding points reset via compatibility method");
        }
        else
        {
            Debug.LogWarning("MarkerStateManager not found - cannot reset pathfinding points");
        }
    }
    
    #endregion
}

// Pathfinding steps now managed by PathfindingPlacementMode in MarkerStateManager
// GameSettings class is now defined in GameSettings.cs

