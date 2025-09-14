using System;
using System.Linq;
using UnityEngine;

/// <summary>
/// Manages pathfinding marker state using Online Maps as Single Source of Truth
/// Replaces the dual-state system that was causing synchronization issues
/// All marker operations go through Online Maps API for consistent state management
/// </summary>
public class MarkerStateManager : MonoBehaviour
{
    [Header("Marker Configuration")]
    public string startMarkerLabel = "START";
    public string endMarkerLabel = "END";
    public float markerScale = 1f;
    
    [Header("Placement Mode")]
    public PathfindingPlacementMode currentPlacementMode = PathfindingPlacementMode.Disabled;
    
    // Public property for external access
    public PathfindingPlacementMode CurrentPlacementMode 
    { 
        get { return currentPlacementMode; } 
        set { currentPlacementMode = value; OnPlacementModeChanged?.Invoke(value); }
    }
    
    [Header("Debug")]
    public bool enableDebugLogs = true;
    
    // Online Maps markers - Single Source of Truth for coordinates
    private OnlineMapsMarker startMarker;
    private OnlineMapsMarker endMarker;
    
    // Component references
    private OnlineMaps map;
    private OnlineMapsControlBase mapControl;
    
    // Events for state changes
    public static event Action<Vector2> OnStartMarkerChanged;
    public static event Action<Vector2> OnEndMarkerChanged;
    public static event Action OnMarkersReady; // When both start and end are placed
    public static event Action OnMarkersCleared;
    public static event Action<PathfindingPlacementMode> OnPlacementModeChanged;
    
    void Start()
    {
        InitializeManager();
    }
    
    void OnEnable()
    {
        // OnlineMaps.instance is often null during OnEnable - event subscription moved to InitializeManager
        if (enableDebugLogs)
        {
            Debug.Log("[MarkerStateManager] OnEnable called - will subscribe to events during initialization");
        }
    }
    
    void OnDisable()
    {
        // Unsubscribe from events
        if (OnlineMaps.instance != null && OnlineMaps.instance.control != null)
        {
            OnlineMaps.instance.control.OnMapClick -= HandleMapClicked;
        }
    }
    
    #region Initialization
    
    void InitializeManager()
    {
        if (enableDebugLogs)
        {
            Debug.Log("[MarkerStateManager] Starting initialization...");
        }
        
        // Use OnlineMaps native system directly
        map = OnlineMaps.instance;
        if (map == null)
        {
            Debug.LogError("[MarkerStateManager] OnlineMaps not found! Please ensure it exists in the scene.");
            return;
        }
        
        mapControl = map.control;
        if (mapControl == null)
        {
            Debug.LogError("[MarkerStateManager] OnlineMaps control not found!");
            return;
        }
        
        // Subscribe to OnlineMaps click events - this should work with all control types
        bool eventSubscribed = SubscribeToMapClickEvents();
        
        if (enableDebugLogs)
        {
            Debug.Log($"[MarkerStateManager] Initialization complete. Event subscription: {(eventSubscribed ? "SUCCESS" : "FAILED")}");
            Debug.Log($"[MarkerStateManager] Map position: {map.position}, Zoom: {map.zoom}");
            Debug.Log($"[MarkerStateManager] Control type: {mapControl.GetType().Name}");
        }
    }
    
    /// <summary>
    /// Subscribe to map click events with multiple fallback approaches
    /// </summary>
    bool SubscribeToMapClickEvents()
    {
        bool success = false;
        
        // Primary approach: Use the native OnMapClick event
        try
        {
            // Unsubscribe first to prevent duplicates
            mapControl.OnMapClick -= HandleMapClicked;
            mapControl.OnMapClick += HandleMapClicked;
            
            if (enableDebugLogs)
            {
                Debug.Log("[MarkerStateManager] ✅ Subscribed to mapControl.OnMapClick event");
            }
            success = true;
        }
        catch (System.Exception e)
        {
            if (enableDebugLogs)
            {
                Debug.LogError($"[MarkerStateManager] ❌ Failed to subscribe to OnMapClick: {e.Message}");
            }
        }
        
        // Add debug info about the control and its capabilities
        if (enableDebugLogs)
        {
            Debug.Log($"[MarkerStateManager] Control details:");
            Debug.Log($"  - Type: {mapControl.GetType().Name}");
            Debug.Log($"  - Enabled: {mapControl.enabled}");
            Debug.Log($"  - Active: {mapControl.gameObject.activeInHierarchy}");
            
            // Check if OnMapClick exists and is callable
            var onMapClickField = mapControl.GetType().GetField("OnMapClick", System.Reflection.BindingFlags.Public | System.Reflection.BindingFlags.Instance);
            if (onMapClickField != null)
            {
                var onMapClickValue = onMapClickField.GetValue(mapControl);
                Debug.Log($"  - OnMapClick field exists: {onMapClickValue != null}");
            }
        }
        
        return success;
    }
    
    #endregion
    
    #region Event Handlers
    
    /// <summary>
    /// Handle map clicks based on current placement mode - OnlineMaps native event
    /// </summary>
    void HandleMapClicked()
    {
        if (map == null || mapControl == null)
        {
            Debug.LogWarning("[MarkerStateManager] OnlineMaps not ready for marker placement");
            return;
        }

        // Get click position in geographic coordinates
        Vector2 mousePosition = mapControl.GetInputPosition();
        Vector2 geoCoordinate = mapControl.GetCoords(mousePosition);
        
        switch (currentPlacementMode)
        {
            case PathfindingPlacementMode.PlaceStart:
                SetStartMarker(geoCoordinate);
                // Auto-disable placement mode after successful placement
                SetPlacementMode(PathfindingPlacementMode.Disabled);
                break;
                
            case PathfindingPlacementMode.PlaceEnd:
                SetEndMarker(geoCoordinate);
                // Auto-disable placement mode after successful placement
                SetPlacementMode(PathfindingPlacementMode.Disabled);
                break;
                
            case PathfindingPlacementMode.Disabled:
                // Silently ignore clicks when placement is disabled
                break;
        }
    }
    
    #endregion
    
    #region Marker Management - Single Source of Truth
    
    /// <summary>
    /// Set start marker position using Online Maps as storage
    /// </summary>
    public bool SetStartMarker(Vector2 geoCoordinate)
    {
        // Removed debug spam
        
        try
        {
            // Remove existing start marker if present
            if (startMarker != null)
            {
                OnlineMapsMarkerManager.RemoveItem(startMarker);
                startMarker = null;
                
                if (enableDebugLogs)
                {
                    Debug.Log("[MarkerStateManager] Removed existing start marker");
                }
            }
            
            // Create new start marker using Online Maps API
            startMarker = OnlineMapsMarkerManager.CreateItem(geoCoordinate, startMarkerLabel);
            
            if (startMarker != null)
            {
                // Configure marker properties
                startMarker.label = startMarkerLabel;
                startMarker.scale = markerScale;
                
                if (enableDebugLogs)
                {
                    Debug.Log($"[MarkerStateManager] Start marker placed at: ({geoCoordinate.x:F6}, {geoCoordinate.y:F6})");
                }
                
                // Build graph immediately (React timing) - do this asynchronously
                StartCoroutine(BuildGraphForStartMarker(geoCoordinate));
                
                // Broadcast event
                OnStartMarkerChanged?.Invoke(geoCoordinate);
                
                // Check if we now have both markers
                CheckMarkersReady();
                
                return true;
            }
            else
            {
                Debug.LogError("[MarkerStateManager] Failed to create start marker through Online Maps API");
                return false;
            }
        }
        catch (System.Exception e)
        {
            Debug.LogError($"[MarkerStateManager] Error creating start marker: {e.Message}");
            return false;
        }
    }
    
    /// <summary>
    /// Set end marker position using Online Maps as storage
    /// </summary>
    public bool SetEndMarker(Vector2 geoCoordinate)
    {
        try
        {
            // Remove existing end marker if present
            if (endMarker != null)
            {
                OnlineMapsMarkerManager.RemoveItem(endMarker);
                endMarker = null;
                
                if (enableDebugLogs)
                {
                    Debug.Log("[MarkerStateManager] Removed existing end marker");
                }
            }
            
            // Create new end marker using Online Maps API
            endMarker = OnlineMapsMarkerManager.CreateItem(geoCoordinate, endMarkerLabel);
            
            if (endMarker != null)
            {
                // Configure marker properties
                endMarker.label = endMarkerLabel;
                endMarker.scale = markerScale;
                
                if (enableDebugLogs)
                {
                    Debug.Log($"[MarkerStateManager] End marker placed at: ({geoCoordinate.x:F6}, {geoCoordinate.y:F6})");
                }
                
                // Broadcast event
                OnEndMarkerChanged?.Invoke(geoCoordinate);
                
                // Check if we now have both markers
                CheckMarkersReady();
                
                return true;
            }
            else
            {
                Debug.LogError("[MarkerStateManager] Failed to create end marker through Online Maps API");
                return false;
            }
        }
        catch (System.Exception e)
        {
            Debug.LogError($"[MarkerStateManager] Error creating end marker: {e.Message}");
            return false;
        }
    }
    
    /// <summary>
    /// Get start marker coordinates from Online Maps (Single Source of Truth)
    /// </summary>
    public Vector2? GetStartCoordinate()
    {
        if (startMarker != null)
        {
            return startMarker.position;
        }
        return null;
    }
    
    /// <summary>
    /// Get end marker coordinates from Online Maps (Single Source of Truth)
    /// </summary>
    public Vector2? GetEndCoordinate()
    {
        if (endMarker != null)
        {
            return endMarker.position;
        }
        return null;
    }
    
    /// <summary>
    /// Check if both start and end markers are placed
    /// </summary>
    public bool HasBothMarkers()
    {
        return startMarker != null && endMarker != null;
    }
    
    /// <summary>
    /// Check if start marker is placed
    /// </summary>
    public bool HasStartMarker()
    {
        return startMarker != null;
    }
    
    /// <summary>
    /// Check if end marker is placed
    /// </summary>
    public bool HasEndMarker()
    {
        return endMarker != null;
    }
    
    /// <summary>
    /// Clear all markers
    /// </summary>
    public void ClearAllMarkers()
    {
        bool hadMarkers = HasBothMarkers();
        
        if (startMarker != null)
        {
            OnlineMapsMarkerManager.RemoveItem(startMarker);
            startMarker = null;
        }
        
        if (endMarker != null)
        {
            OnlineMapsMarkerManager.RemoveItem(endMarker);
            endMarker = null;
        }
        
        if (enableDebugLogs)
        {
            Debug.Log("[MarkerStateManager] All markers cleared");
        }
        
        if (hadMarkers)
        {
            OnMarkersCleared?.Invoke();
        }
    }
    
    /// <summary>
    /// Clear only start marker
    /// </summary>
    public void ClearStartMarker()
    {
        if (startMarker != null)
        {
            OnlineMapsMarkerManager.RemoveItem(startMarker);
            startMarker = null;
            
            if (enableDebugLogs)
            {
                Debug.Log("[MarkerStateManager] Start marker cleared");
            }
        }
    }
    
    /// <summary>
    /// Clear only end marker
    /// </summary>
    public void ClearEndMarker()
    {
        if (endMarker != null)
        {
            OnlineMapsMarkerManager.RemoveItem(endMarker);
            endMarker = null;
            
            if (enableDebugLogs)
            {
                Debug.Log("[MarkerStateManager] End marker cleared");
            }
        }
    }
    
    #endregion
    
    #region Placement Mode Management
    
    /// <summary>
    /// Enable start marker placement mode
    /// </summary>
    public void EnableStartPlacement()
    {
        SetPlacementMode(PathfindingPlacementMode.PlaceStart);
    }
    
    /// <summary>
    /// Enable end marker placement mode
    /// </summary>
    public void EnableEndPlacement()
    {
        SetPlacementMode(PathfindingPlacementMode.PlaceEnd);
    }
    
    /// <summary>
    /// Disable all placement modes
    /// </summary>
    public void DisablePlacement()
    {
        SetPlacementMode(PathfindingPlacementMode.Disabled);
    }
    
    /// <summary>
    /// Set placement mode and broadcast change
    /// </summary>
    void SetPlacementMode(PathfindingPlacementMode newMode)
    {
        if (currentPlacementMode != newMode)
        {
            currentPlacementMode = newMode;
            
            // Only log important placement mode changes
            if (newMode != PathfindingPlacementMode.Disabled && enableDebugLogs)
            {
                Debug.Log($"[MarkerStateManager] Placement mode: {newMode}");
            }
            
            OnPlacementModeChanged?.Invoke(newMode);
        }
    }
    
    /// <summary>
    /// Get current placement mode
    /// </summary>
    public PathfindingPlacementMode GetPlacementMode()
    {
        return currentPlacementMode;
    }
    
    /// <summary>
    /// Check if any placement mode is active
    /// </summary>
    public bool IsPlacementActive()
    {
        return currentPlacementMode != PathfindingPlacementMode.Disabled;
    }
    
    #endregion
    
    #region Pathfinding Node Creation
    
    /// <summary>
    /// Create PathfindingNode from start marker - finds nearest REAL OSM node with full precision
    /// Mirrors React's getNearestNode() functionality with coordinate validation
    /// </summary>
    public async System.Threading.Tasks.Task<PathfindingNode> CreateStartNodeAsync()
    {
        Vector2? startCoord = GetStartCoordinate();
        if (startCoord.HasValue)
        {
            var osmBridge = FindObjectOfType<OnlineMapsBridge>();
            if (osmBridge != null)
            {
                OSMNode nearestOsmNode = await osmBridge.GetNearestOSMNode(startCoord.Value);
                if (nearestOsmNode != null)
                {
                    var pathfindingNode = new PathfindingNode(nearestOsmNode);

                    // CRITICAL FIX: Check if coordinates were rounded (September 13th issue)
                    bool coordinatesRounded = IsCoordinateRounded(pathfindingNode.geoCoordinate);

                    if (coordinatesRounded)
                    {
                        if (enableDebugLogs)
                        {
                            Debug.LogWarning($"[MarkerStateManager] OSM node coordinates rounded: ID={pathfindingNode.id}, Coord={pathfindingNode.geoCoordinate}");
                            Debug.Log($"[MarkerStateManager] Attempting to find actual graph node with full precision...");
                        }

                        // Try to get the actual node from the current graph with full precision
                        var mapController = FindObjectOfType<MapController>();
                        if (mapController?.currentGraph != null)
                        {
                            var graphNode = mapController.currentGraph.GetNode(pathfindingNode.id);
                            if (graphNode != null)
                            {
                                if (enableDebugLogs)
                                {
                                    Debug.Log($"[MarkerStateManager] Found graph node with full precision: ID={graphNode.id}, Coord={graphNode.geoCoordinate}");
                                }
                                return graphNode; // Return the graph node with full precision
                            }
                        }
                    }

                    if (enableDebugLogs)
                    {
                        Debug.Log($"[MarkerStateManager] Found real OSM start node: ID={pathfindingNode.id}, Coord=({pathfindingNode.geoCoordinate.x:F8}, {pathfindingNode.geoCoordinate.y:F8}) (precision: {(coordinatesRounded ? "ROUNDED" : "FULL")})");
                    }
                    return pathfindingNode;
                }
                else
                {
                    Debug.LogWarning($"[MarkerStateManager] No OSM node found near {startCoord.Value}");
                }
            }
            else
            {
                Debug.LogError("[MarkerStateManager] OnlineMapsBridge not found - cannot get real OSM nodes");
            }
        }
        return null;
    }
    
    /// <summary>
    /// Synchronous version for backward compatibility - creates fake node
    /// </summary>
    public PathfindingNode CreateStartNode()
    {
        Vector2? startCoord = GetStartCoordinate();
        if (startCoord.HasValue)
        {
            if (enableDebugLogs)
            {
                Debug.LogWarning("[MarkerStateManager] Using fake node - consider using CreateStartNodeAsync() for real OSM nodes");
            }
            
            return new PathfindingNode
            {
                geoCoordinate = startCoord.Value,
                id = GetStableNodeId(startCoord.Value, true)
            };
        }
        return null;
    }
    
    /// <summary>
    /// Create PathfindingNode from end marker - finds nearest REAL OSM node with full precision
    /// Mirrors React's getNearestNode() functionality with coordinate validation
    /// </summary>
    public async System.Threading.Tasks.Task<PathfindingNode> CreateEndNodeAsync()
    {
        Vector2? endCoord = GetEndCoordinate();
        if (endCoord.HasValue)
        {
            var osmBridge = FindObjectOfType<OnlineMapsBridge>();
            if (osmBridge != null)
            {
                OSMNode nearestOsmNode = await osmBridge.GetNearestOSMNode(endCoord.Value);
                if (nearestOsmNode != null)
                {
                    var pathfindingNode = new PathfindingNode(nearestOsmNode);

                    // CRITICAL FIX: Check if coordinates were rounded (September 13th issue)
                    bool coordinatesRounded = IsCoordinateRounded(pathfindingNode.geoCoordinate);

                    if (coordinatesRounded)
                    {
                        if (enableDebugLogs)
                        {
                            Debug.LogWarning($"[MarkerStateManager] OSM end node coordinates rounded: ID={pathfindingNode.id}, Coord={pathfindingNode.geoCoordinate}");
                            Debug.Log($"[MarkerStateManager] Attempting to find actual graph end node with full precision...");
                        }

                        // Try to get the actual node from the current graph with full precision
                        var mapController = FindObjectOfType<MapController>();
                        if (mapController?.currentGraph != null)
                        {
                            var graphNode = mapController.currentGraph.GetNode(pathfindingNode.id);
                            if (graphNode != null)
                            {
                                if (enableDebugLogs)
                                {
                                    Debug.Log($"[MarkerStateManager] Found graph end node with full precision: ID={graphNode.id}, Coord={graphNode.geoCoordinate}");
                                }
                                return graphNode; // Return the graph node with full precision
                            }
                        }
                    }

                    if (enableDebugLogs)
                    {
                        Debug.Log($"[MarkerStateManager] Found real OSM end node: ID={pathfindingNode.id}, Coord=({pathfindingNode.geoCoordinate.x:F8}, {pathfindingNode.geoCoordinate.y:F8}) (precision: {(coordinatesRounded ? "ROUNDED" : "FULL")})");
                    }
                    return pathfindingNode;
                }
                else
                {
                    Debug.LogWarning($"[MarkerStateManager] No OSM node found near {endCoord.Value}");
                }
            }
            else
            {
                Debug.LogError("[MarkerStateManager] OnlineMapsBridge not found - cannot get real OSM nodes");
            }
        }
        return null;
    }

    /// <summary>
    /// Create PathfindingNode from end marker (for algorithm processing) - LEGACY FAKE VERSION
    /// </summary>
    public PathfindingNode CreateEndNode()
    {
        Vector2? endCoord = GetEndCoordinate();
        if (endCoord.HasValue)
        {
            if (enableDebugLogs)
            {
                Debug.LogWarning("[MarkerStateManager] Using fake end node - consider using CreateEndNodeAsync() for real OSM nodes");
            }
            
            return new PathfindingNode
            {
                geoCoordinate = endCoord.Value,
                id = GetStableNodeId(endCoord.Value, false)
            };
        }
        return null;
    }
    
    /// <summary>
    /// Generate stable node ID based on coordinates
    /// </summary>
    long GetStableNodeId(Vector2 coordinate, bool isStart)
    {
        // Create stable ID based on coordinate hash and type
        int hash = coordinate.GetHashCode();
        long baseId = (long)hash;
        return isStart ? baseId * 2 : (baseId * 2) + 1;
    }
    
    /// <summary>
    /// Build graph when start marker is placed (React timing)
    /// Mirrors React's approach: getMapGraph() called immediately after start node selection
    /// </summary>
    private System.Collections.IEnumerator BuildGraphForStartMarker(Vector2 startCoordinate)
    {
        if (enableDebugLogs)
        {
            Debug.Log($"[MarkerStateManager] Building graph for start marker at {startCoordinate} (React timing)");
        }
        
        // First get the real OSM start node ID (like React does)
        PathfindingNode realStartNode = null;
        bool startNodeReady = false;
        
        StartCoroutine(GetRealStartNodeCoroutine((node, error) => {
            realStartNode = node;
            startNodeReady = true;
        }));
        
        yield return new WaitUntil(() => startNodeReady);
        
        if (realStartNode == null)
        {
            Debug.LogError("[MarkerStateManager] Failed to get real start node - cannot build graph");
            yield break;
        }
        
        // Get MapController to build the graph
        var mapController = FindObjectOfType<MapController>();
        if (mapController != null)
        {
            // Use React's exact approach: getMapGraph(boundingBox, startNodeId)
            yield return StartCoroutine(mapController.BuildGraphForStartNode(startCoordinate, realStartNode.id));
        }
        else
        {
            Debug.LogError("[MarkerStateManager] MapController not found - cannot build graph");
        }
    }
    
    /// <summary>
    /// Get real start node using async method
    /// </summary>
    private System.Collections.IEnumerator GetRealStartNodeCoroutine(System.Action<PathfindingNode, System.Exception> callback)
    {
        PathfindingNode resultNode = null;
        System.Exception error = null;
        bool done = false;
        
        // Start async task
        var task = CreateStartNodeAsync();
        
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
    
    #endregion
    
    #region Internal Methods
    
    /// <summary>
    /// Check if both markers are ready and broadcast event if so
    /// </summary>
    void CheckMarkersReady()
    {
        if (HasBothMarkers())
        {
            if (enableDebugLogs)
            {
                Debug.Log("[MarkerStateManager] Both markers ready for pathfinding");
            }
            
            OnMarkersReady?.Invoke();
        }
    }
    
    /// <summary>
    /// Check if coordinates have been rounded to 2 decimal places (indicates precision loss)
    /// This is the key detector for the September 13th coordinate issue
    /// </summary>
    private bool IsCoordinateRounded(Vector2 coordinate)
    {
        // Check if both coordinates are exactly 2 decimal places (like -74.00, 40.71)
        float x = coordinate.x;
        float y = coordinate.y;

        // Calculate what the coordinate would be if rounded to 2 decimal places
        float roundedX = Mathf.Round(x * 100f) / 100f;
        float roundedY = Mathf.Round(y * 100f) / 100f;

        // If the coordinate exactly matches its 2-decimal rounded version, it's likely been rounded
        bool xIsRounded = Mathf.Approximately(x, roundedX) && (x != roundedX || HasOnlyTwoDecimals(x));
        bool yIsRounded = Mathf.Approximately(y, roundedY) && (y != roundedY || HasOnlyTwoDecimals(y));

        return xIsRounded && yIsRounded;
    }

    /// <summary>
    /// Check if a float has only 2 decimal places (helper for coordinate rounding detection)
    /// </summary>
    private bool HasOnlyTwoDecimals(float value)
    {
        // Convert to string and check decimal places
        string str = value.ToString("F6"); // Show 6 decimal places
        string[] parts = str.Split('.');
        if (parts.Length > 1)
        {
            string decimals = parts[1].TrimEnd('0'); // Remove trailing zeros
            return decimals.Length <= 2;
        }
        return true; // No decimal places
    }

    #endregion

    #region Testing Methods
    
    /// <summary>
    /// Place start marker at map center (for testing)
    /// </summary>
    [ContextMenu("Test Place Start at Map Center")]
    public void TestPlaceStartAtCenter()
    {
        if (map != null)
        {
            Vector2 center = map.position;
            Debug.Log($"[MarkerStateManager] Testing start marker placement at map center: {center}");
            bool success = SetStartMarker(center);
            Debug.Log($"[MarkerStateManager] Start marker placement result: {(success ? "SUCCESS" : "FAILED")}");
        }
        else
        {
            Debug.LogWarning("[MarkerStateManager] Cannot test - OnlineMaps not ready");
        }
    }
    
    /// <summary>
    /// Test click event subscription and marker creation
    /// </summary>
    [ContextMenu("🧪 Test Event System & Marker Creation")]
    public void TestEventSystemAndMarkers()
    {
        Debug.Log("🧪 TESTING EVENT SYSTEM AND MARKER CREATION");
        Debug.Log("════════════════════════════════════════");
        
        // Test 1: Check initialization state
        bool initialized = (map != null && mapControl != null);
        Debug.Log($"1. Initialization: {(initialized ? "✅ Ready" : "❌ Not Ready")}");
        
        if (!initialized)
        {
            Debug.LogError("Cannot proceed with tests - system not initialized");
            return;
        }
        
        // Test 2: Check event subscription
        bool hasClickEvent = (mapControl.OnMapClick != null);
        Debug.Log($"2. OnMapClick event: {(hasClickEvent ? "✅ Available" : "❌ Null")}");
        
        // Test 3: Test marker creation at known coordinates
        Vector2 testCoord = map.position;
        Debug.Log($"3. Testing marker creation at current map position: {testCoord}");
        
        // Clear any existing markers first
        ClearAllMarkers();
        
        // Test start marker
        bool startSuccess = SetStartMarker(testCoord);
        Debug.Log($"   Start marker creation: {(startSuccess ? "✅ Success" : "❌ Failed")}");
        
        // Test end marker (slightly offset)
        Vector2 endCoord = new Vector2(testCoord.x + 0.01f, testCoord.y + 0.01f);
        bool endSuccess = SetEndMarker(endCoord);
        Debug.Log($"   End marker creation: {(endSuccess ? "✅ Success" : "❌ Failed")}");
        
        // Test 4: Check marker state
        bool bothMarkersExist = HasBothMarkers();
        Debug.Log($"4. Both markers exist: {(bothMarkersExist ? "✅ Yes" : "❌ No")}");
        
        Debug.Log("════════════════════════════════════════");
        Debug.Log($"Overall test result: {(startSuccess && endSuccess ? "✅ SUCCESS" : "❌ SOME TESTS FAILED")}");
    }
    
    /// <summary>
    /// Place end marker at map center with offset (for testing)
    /// </summary>
    [ContextMenu("Test Place End at Map Center")]
    public void TestPlaceEndAtCenter()
    {
        if (map != null)
        {
            Vector2 center = map.position;
            Vector2 offsetCenter = new Vector2(center.x + 0.01f, center.y + 0.01f);
            SetEndMarker(offsetCenter);
        }
        else
        {
            Debug.LogWarning("[MarkerStateManager] Cannot test - OnlineMaps not ready");
        }
    }
    
    /// <summary>
    /// Log current marker state (for debugging)
    /// </summary>
    [ContextMenu("Log Marker State")]
    public void LogMarkerState()
    {
        Debug.Log("=== MarkerStateManager State ===");
        Debug.Log($"Start Marker: {(startMarker != null ? startMarker.position.ToString() : "None")}");
        Debug.Log($"End Marker: {(endMarker != null ? endMarker.position.ToString() : "None")}");
        Debug.Log($"Placement Mode: {currentPlacementMode}");
        Debug.Log($"Both Markers Ready: {HasBothMarkers()}");
        Debug.Log("=== End State ===");
    }
    
    #endregion
    
    #region Cleanup
    
    void OnDestroy()
    {
        // Clear all markers
        ClearAllMarkers();
        
        // Clear events
        OnStartMarkerChanged = null;
        OnEndMarkerChanged = null;
        OnMarkersReady = null;
        OnMarkersCleared = null;
        OnPlacementModeChanged = null;
        
        if (enableDebugLogs)
        {
            Debug.Log("[MarkerStateManager] Cleaned up");
        }
    }
    
    #endregion
}

/// <summary>
/// Placement modes for pathfinding markers
/// </summary>
public enum PathfindingPlacementMode
{
    Disabled,    // No placement active - normal map navigation
    PlaceStart,  // Click to place/replace start marker
    PlaceEnd     // Click to place/replace end marker
}