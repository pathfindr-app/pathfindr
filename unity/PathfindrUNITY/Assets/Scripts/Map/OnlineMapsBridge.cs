using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using System;
using System.Threading.Tasks;

// Online Maps v3.9 classes are available in global namespace
// No additional using statements needed

/// <summary>
/// Bridge between our pathfinding system and Online Maps v3.9
/// Handles coordinate conversion, map interaction, and OSM data fetching
/// </summary>
public class OnlineMapsBridge : MonoBehaviour
{
    [Header("Map Configuration")]
    public Vector2 defaultLocation = new Vector2(-74.006f, 40.7128f); // NYC coordinates (lng, lat)
    public int defaultZoom = 15;
    public int minZoom = 10;
    public int maxZoom = 18;
    
    [Header("OSM Integration")]
    public float osmSearchRadius = 0.15f; // Radius in km for OSM node search
    public string overpassApiUrl = "https://overpass-api.de/api/interpreter";
    
    // Online Maps references
    private OnlineMaps map;
    private OnlineMapsControlBase mapControl;
    
    // Event system
    public event Action<Vector2> OnMapClick;
    public event Action<Vector2> OnMapDrag;
    
    // Route drawing
    private OnlineMapsDrawingLine currentPlayerRoute;
    private OnlineMapsDrawingLine currentOptimalRoute;
    private List<OnlineMapsMarker> nodeMarkers = new List<OnlineMapsMarker>();
    
    // Coordinate conversion cache
    private Dictionary<Vector2, Vector3> coordinateCache = new Dictionary<Vector2, Vector3>();
    
    void Start()
    {
        StartCoroutine(InitializeAfterDelay());
    }
    
    /// <summary>
    /// Initialize after a short delay to ensure OnlineMaps is fully set up
    /// </summary>
    IEnumerator InitializeAfterDelay()
    {
        // Wait a few frames for OnlineMaps to initialize
        yield return new WaitForEndOfFrame();
        yield return new WaitForEndOfFrame();
        
        InitializeOnlineMaps();
        
        // Additional validation after initialization
        if (map != null && mapControl != null)
        {
            Debug.Log($"OnlineMapsBridge initialized successfully with {mapControl.GetType().Name}");
        }
    }
    
    #region Initialization
    
    void InitializeOnlineMaps()
    {
        // For Tileset control, find components in scene instead of using singletons
        map = FindObjectOfType<OnlineMaps>();
        if (map == null)
        {
            Debug.LogError("OnlineMaps component not found! Please add Online Maps to the scene.");
            return;
        }
        
        // Get control component - use the base class to support all control types
        mapControl = OnlineMapsControlBase.instance;
        if (mapControl == null)
        {
            // Fallback to finding any control in scene
            mapControl = FindObjectOfType<OnlineMapsControlBase>();
        }
        if (mapControl == null)
        {
            Debug.LogError("OnlineMaps Control not found! Please ensure proper Online Maps setup.");
            return;
        }
        
        // Configure initial map settings
        SetupMapConfiguration();
        
        // Setup input handlers
        SetupInputHandlers();
        
        // Load default location
        LoadLocation(defaultLocation, defaultZoom);
        
    }
    
    void SetupMapConfiguration()
    {
        // Set map bounds
        map.zoomRange = new OnlineMapsRange(minZoom, maxZoom);
        
        // Configure for raster tiles (better performance than vector)
        // Online Maps v3.9 uses raster by default
        
        // Enable smooth zoom (available on base control)
        mapControl.smoothZoom = true;
        
        // Note: Double-click zooming is handled automatically by OnlineMapsControlBase
    }
    
    void SetupInputHandlers()
    {
        // REMOVED: Online Maps event handlers to fix jittery navigation
        // Pathfinding will be controlled via UI buttons only
        
        // Keep zoom change handler for coordinate cache clearing
        if (map != null)
        {
            map.OnChangeZoom += HandleZoomChange;
        }
        
    }
    
    #endregion
    
    #region Input Handling
    
    void HandleOnlineMapsClick()
    {
        Vector2 mousePosition = mapControl.GetInputPosition();
        Vector2 geoCoordinate = mapControl.GetCoords(mousePosition);
        
        // Check if pathfinding mode is active before processing clicks
        MapController mapController = FindObjectOfType<MapController>();
        if (mapController != null && mapController.pathfindingModeActive)
        {
            OnMapClick?.Invoke(geoCoordinate);
        }
        else
        {
            // Allow normal Online Maps interaction (pan/zoom/etc)
            Debug.Log("Map click ignored - pathfinding mode disabled, allowing normal map navigation");
        }
    }
    
    void HandleOnlineMapsDrag()
    {
        // TODO: Implement proper drag delta calculation
        Vector2 currentPosition = mapControl.GetInputPosition();
        OnMapDrag?.Invoke(currentPosition);
    }
    
    void HandleZoomChange()
    {
        // Clear coordinate cache when zoom changes
        coordinateCache.Clear();
        
    }
    
    /// <summary>
    /// Check if the map is ready for coordinate conversion operations
    /// </summary>
    public bool IsMapReady()
    {
        return map != null && 
               mapControl != null && 
               mapControl.enabled && 
               mapControl.gameObject.activeInHierarchy &&
               map.zoom > 0 &&
               !(map.position.x == 0 && map.position.y == 0);
    }
    
    #endregion
    
    #region Coordinate Conversion
    
    /// <summary>
    /// Convert screen position to geographic coordinates
    /// </summary>
    public Vector2 ScreenToGeoCoordinate(Vector2 screenPosition)
    {
        // Quick readiness check
        if (!IsMapReady())
        {
            Debug.LogWarning("ScreenToGeoCoordinate: Map not ready, attempting re-initialization...");
            InitializeOnlineMaps();
            
            if (!IsMapReady())
            {
                Debug.LogError("ScreenToGeoCoordinate: Re-initialization failed or map still not ready.");
                return Vector2.zero;
            }
        }
        
        // For Tileset control, ensure we have valid screen bounds
        if (screenPosition.x < 0 || screenPosition.y < 0 || 
            screenPosition.x > Screen.width || screenPosition.y > Screen.height)
        {
            Debug.LogWarning($"ScreenToGeoCoordinate: Screen position {screenPosition} is outside screen bounds ({Screen.width}x{Screen.height})");
        }
        
        Vector2 result = mapControl.GetCoords(screenPosition);
        
        // Validate result - (0,0) coordinates are suspicious unless we're actually at null island
        if (result.x == 0f && result.y == 0f)
        {
            Debug.LogError($"ScreenToGeoCoordinate: FAILED conversion {screenPosition} -> (0,0)");
            Debug.LogError($"Map state - Position: {map.position}, Zoom: {map.zoom}, Type: {mapControl.GetType().Name}");
            Debug.LogError($"Control state - Enabled: {mapControl.enabled}, Active: {mapControl.gameObject.activeInHierarchy}");
        }
        else if (Mathf.Abs(result.x) > 180f || Mathf.Abs(result.y) > 90f)
        {
            Debug.LogWarning($"ScreenToGeoCoordinate: Result {result} is outside valid lat/lng bounds");
        }
        
        return result;
    }
    
    /// <summary>
    /// Convert geographic coordinates to screen position
    /// </summary>
    public Vector2 GeoCoordinateToScreen(Vector2 geoCoordinate)
    {
        if (mapControl == null) return Vector2.zero;
        
        // Use Online Maps API - GetScreenPosition(lng, lat)
        return mapControl.GetScreenPosition(geoCoordinate.x, geoCoordinate.y);
    }
    
    /// <summary>
    /// Convert geographic coordinates to Unity world position
    /// </summary>
    public Vector3 GeoCoordinateToWorldPosition(Vector2 geoCoordinate)
    {
        // Ensure we're initialized
        if (map == null)
        {
            InitializeOnlineMaps();
        }
        
        // Check cache first
        if (coordinateCache.TryGetValue(geoCoordinate, out Vector3 cachedPos))
        {
            return cachedPos;
        }
        
        Vector3 worldPos;
        
        // Use Online Maps screen coordinate system for conversion
        if (mapControl != null)
        {
            // Get screen position from geographic coordinates
            Vector2 screenPos = mapControl.GetScreenPosition(geoCoordinate.x, geoCoordinate.y);
            
            // Convert screen position to world position using camera
            if (Camera.main != null)
            {
                // Assume screen depth for UI/2D map
                Vector3 screenPos3D = new Vector3(screenPos.x, screenPos.y, 10f);
                worldPos = Camera.main.ScreenToWorldPoint(screenPos3D);
                worldPos.y = 2f; // Elevate markers above map
                Debug.Log($"Using screen-to-world conversion: {geoCoordinate} -> screen {screenPos} -> world {worldPos}");
            }
            else
            {
                // Fallback: basic screen coordinate scaling
                worldPos = new Vector3(screenPos.x * 0.01f, 2f, screenPos.y * 0.01f);
            }
        }
        else if (map != null)
        {
            // Fallback: Use map-relative scaling for 2D controls
            float mapSizeInMeters = 1000f; // Approximate size of visible map area
            float mapSizeInDegrees = 0.01f; // Approximate degrees covered by visible area
            float scale = mapSizeInMeters / mapSizeInDegrees;
            
            float x = (geoCoordinate.x - map.position.x) * scale;
            float z = (geoCoordinate.y - map.position.y) * scale;
            worldPos = new Vector3(x, 2f, z); // Elevated for visibility
            Debug.Log($"Using map-relative conversion: {geoCoordinate} -> {worldPos}");
        }
        else
        {
            // Last resort fallback
            Debug.LogWarning("Online Maps not initialized, using basic coordinate conversion");
            float x = geoCoordinate.x * 1000f;
            float z = geoCoordinate.y * 1000f;
            worldPos = new Vector3(x, 2f, z); // Elevated for visibility
        }
        
        coordinateCache[geoCoordinate] = worldPos;
        return worldPos;
    }
    
    /// <summary>
    /// Convert Unity world position to geographic coordinates  
    /// </summary>
    public Vector2 WorldPositionToGeoCoordinate(Vector3 worldPosition)
    {
        // Convert world position to screen coordinates first
        if (Camera.main != null)
        {
            Vector3 screenPos3D = Camera.main.WorldToScreenPoint(worldPosition);
            return ScreenToGeoCoordinate(new Vector2(screenPos3D.x, screenPos3D.y));
        }
        
        // Fallback: reverse the basic world-to-screen conversion from GeoCoordinateToWorldPosition
        Vector2 fallbackScreenPos = new Vector2(worldPosition.x / 0.01f, worldPosition.z / 0.01f);
        return ScreenToGeoCoordinate(fallbackScreenPos);
    }
    
    #endregion
    
    #region Map Navigation
    
    /// <summary>
    /// Set map position and zoom
    /// </summary>
    public void LoadLocation(Vector2 geoCoordinate, int zoom)
    {
        if (map == null) return;
        
        map.position = geoCoordinate;
        map.zoom = zoom;
        
        // Clear any existing markers/routes
        ClearMapDrawings();
        
    }
    
    /// <summary>
    /// Pan map by delta position
    /// </summary>
    public void PanMap(Vector2 deltaPosition)
    {
        if (map == null) return;
        
        // Online Maps handles panning internally via control
        // This is mainly for programmatic panning
        Vector2 currentPos = map.position;
        Vector2 newPos = currentPos + deltaPosition * 0.001f; // Scale factor
        map.position = newPos;
    }
    
    /// <summary>
    /// Load a random location from predefined list
    /// </summary>
    public void LoadRandomLocation()
    {
        // Predefined interesting locations for pathfinding
        Vector2[] locations = {
            new Vector2(-74.006f, 40.7128f),  // NYC
            new Vector2(-0.1276f, 51.5074f),  // London  
            new Vector2(2.3522f, 48.8566f),   // Paris
            new Vector2(13.4050f, 52.5200f),  // Berlin
            new Vector2(139.6917f, 35.6895f), // Tokyo
            new Vector2(-122.4194f, 37.7749f) // San Francisco
        };
        
        Vector2 randomLocation = locations[UnityEngine.Random.Range(0, locations.Length)];
        LoadLocation(randomLocation, defaultZoom);
    }
    
    #endregion
    
    #region OSM Data Integration
    
    /// <summary>
    /// Get nearest OSM node for pathfinding
    /// Ported from React MapService.js
    /// </summary>
    public async Task<OSMNode> GetNearestOSMNode(Vector2 geoCoordinate)
    {
        try
        {
            // Create search circle around point
            string overpassQuery = BuildOverpassQuery(geoCoordinate, osmSearchRadius);
            
            // Fetch data from Overpass API
            string jsonResponse = await FetchOverpassData(overpassQuery);
            
            // Parse response and find nearest node
            OSMData osmData = JsonUtility.FromJson<OSMData>(jsonResponse);
            return FindNearestNode(geoCoordinate, osmData);
        }
        catch (Exception e)
        {
            Debug.LogError($"Error fetching OSM data: {e.Message}");
            return null;
        }
    }
    
    string BuildOverpassQuery(Vector2 center, float radiusKm)
    {
        // Build Overpass API query for road network
        float lat = center.y;
        float lng = center.x;
        float radius = radiusKm * 1000; // Convert to meters
        
        string query = $@"
        [out:json][timeout:25];
        (
          way[""highway""~""^(motorway|trunk|primary|secondary|tertiary|unclassified|residential)$""](around:{radius},{lat},{lng});
          way[""highway""=""living_street""](around:{radius},{lat},{lng});
        );
        (._;>;);
        out geom;
        ";
        
        return query;
    }
    
    async Task<string> FetchOverpassData(string query)
    {
        // Use UnityWebRequest with raw POST body (like React fetch)
        using (var request = UnityEngine.Networking.UnityWebRequest.PostWwwForm(overpassApiUrl, ""))
        {
            // Set raw body data
            byte[] bodyRaw = System.Text.Encoding.UTF8.GetBytes(query);
            request.uploadHandler = new UnityEngine.Networking.UploadHandlerRaw(bodyRaw);
            request.downloadHandler = new UnityEngine.Networking.DownloadHandlerBuffer();
            
            // Don't set Content-Type - let Unity handle it or use default
            
            var operation = request.SendWebRequest();
            while (!operation.isDone)
                await Task.Yield();
                
            if (request.result == UnityEngine.Networking.UnityWebRequest.Result.Success)
            {
                return request.downloadHandler.text;
            }
            else
            {
                throw new Exception($"Overpass API request failed: {request.error} - Response: {request.downloadHandler?.text}");
            }
        }
    }
    
    OSMNode FindNearestNode(Vector2 center, OSMData osmData)
    {
        OSMNode nearestNode = null;
        double nearestDistance = double.MaxValue;

        if (osmData?.elements == null || osmData.elements.Length == 0)
        {
            Debug.LogError("[OnlineMapsBridge] OSM data is null or empty - cannot find nearest node");
            return null;
        }

        Debug.Log($"[OnlineMapsBridge] Searching {osmData.elements.Length} OSM elements for nearest node to ({center.x:F6}, {center.y:F6})");

        foreach (var element in osmData.elements)
        {
            if (element.type == "node" && element.lat != 0 && element.lon != 0)
            {
                // Use double precision for distance calculation to preserve accuracy
                double deltaLat = (double)center.y - element.lat;
                double deltaLon = (double)center.x - element.lon;
                double distance = Math.Sqrt(deltaLat * deltaLat + deltaLon * deltaLon);

                if (distance < nearestDistance)
                {
                    nearestDistance = distance;
                    // Convert OSMElement to OSMNode - PRESERVE FULL DOUBLE PRECISION
                    nearestNode = new OSMNode
                    {
                        type = element.type,
                        id = element.id,
                        lat = element.lat,    // Keep full double precision
                        lon = element.lon,    // Keep full double precision
                        tags = element.tags
                    };
                }
            }
        }

        if (nearestNode != null)
        {
            Debug.Log($"[OnlineMapsBridge] Found nearest OSM node: ID={nearestNode.id}, lat={nearestNode.lat:F6}, lon={nearestNode.lon:F6}, distance={nearestDistance:F6}");
        }
        else
        {
            Debug.LogError("[OnlineMapsBridge] No valid OSM nodes found in data");
        }

        return nearestNode;
    }
    
    /// <summary>
    /// Get full OSM data including roads for graph construction
    /// </summary>
    public async Task<OSMData> GetOSMRoadNetwork(Vector2 center, float radiusKm = 1.0f)
    {
        try
        {
            string overpassQuery = BuildRoadNetworkQuery(center, radiusKm);
            Debug.Log($"Fetching OSM data for area: center={center}, radius={radiusKm}km");
            Debug.Log($"Overpass query: {overpassQuery}");
            
            string jsonResponse = await FetchOverpassData(overpassQuery);
            
            if (string.IsNullOrEmpty(jsonResponse))
            {
                Debug.LogError("OSM API returned empty response");
                return null;
            }
            
            Debug.Log($"OSM API response length: {jsonResponse.Length} characters");
            Debug.Log($"Response preview: {jsonResponse.Substring(0, Mathf.Min(200, jsonResponse.Length))}...");
            
            // Try to deserialize JSON
            OSMData osmData = JsonUtility.FromJson<OSMData>(jsonResponse);
            
            if (osmData == null)
            {
                Debug.LogError("Failed to deserialize OSM data - JSON structure may not match OSMData class");
                return null;
            }
            
            Debug.Log($"Successfully parsed OSM data with {osmData.elements?.Length ?? 0} elements");
            return osmData;
        }
        catch (System.Exception e)
        {
            Debug.LogError($"Error fetching OSM road network: {e.Message}");
            Debug.LogError($"Stack trace: {e.StackTrace}");
            return null;
        }
    }
    
    string BuildRoadNetworkQuery(Vector2 center, float radiusKm)
    {
        float lat = center.y;
        float lng = center.x;
        float radius = radiusKm * 1000; // Convert to meters
        
        // Use simpler query format that matches React version more closely
        string query = $@"[out:json][timeout:25];
(
  way[highway][highway!=""footway""][highway!=""street_lamp""][highway!=""steps""][highway!=""pedestrian""][highway!=""track""][highway!=""path""][footway!=""*""](around:{radius},{lat},{lng});
  node(w);
);
out skel;";
        
        return query;
    }
    
    #endregion
    
    #region Route Drawing
    
    /// <summary>
    /// Draw player route on map
    /// </summary>
    public void DrawPlayerRoute(List<Vector2> routePoints, Color color)
    {
        if (routePoints == null || routePoints.Count < 2) return;
        
        // Remove existing player route
        if (currentPlayerRoute != null)
        {
            OnlineMapsDrawingElementManager.RemoveItem(currentPlayerRoute);
        }
        
        // Create new route line
        currentPlayerRoute = new OnlineMapsDrawingLine(routePoints, color, 3f);
        OnlineMapsDrawingElementManager.AddItem(currentPlayerRoute);
    }
    
    /// <summary>
    /// Draw optimal algorithm route on map
    /// </summary>
    public void DrawOptimalRoute(List<Vector2> routePoints, Color color)
    {
        if (routePoints == null || routePoints.Count < 2) return;
        
        // Remove existing optimal route
        if (currentOptimalRoute != null)
        {
            OnlineMapsDrawingElementManager.RemoveItem(currentOptimalRoute);
        }
        
        // Create new route line
        currentOptimalRoute = new OnlineMapsDrawingLine(routePoints, color, 4f);
        OnlineMapsDrawingElementManager.AddItem(currentOptimalRoute);
    }
    
    /// <summary>
    /// Add node marker to map
    /// </summary>
    public void AddNodeMarker(Vector2 geoCoordinate, string label, Color color)
    {
        var marker = OnlineMapsMarkerManager.CreateItem(geoCoordinate, label);
        // TODO: Implement proper marker color setting with Online Maps API
        // marker.color property may need different approach
        nodeMarkers.Add(marker);
    }
    
    /// <summary>
    /// Clear all drawings and markers
    /// </summary>
    public void ClearMapDrawings()
    {
        // Clear routes
        if (currentPlayerRoute != null)
        {
            OnlineMapsDrawingElementManager.RemoveItem(currentPlayerRoute);
            currentPlayerRoute = null;
        }
        
        if (currentOptimalRoute != null)
        {
            OnlineMapsDrawingElementManager.RemoveItem(currentOptimalRoute);
            currentOptimalRoute = null;
        }
        
        // Clear markers
        foreach (var marker in nodeMarkers)
        {
            OnlineMapsMarkerManager.RemoveItem(marker);
        }
        nodeMarkers.Clear();
        
        // Clear coordinate cache
        coordinateCache.Clear();
    }
    
    #endregion
    
    #region Public API
    
    /// <summary>
    /// Get current map center position
    /// </summary>
    public Vector2 GetMapCenterPosition()
    {
        if (map != null)
        {
            return map.position;
        }
        
        // Fallback default position (NYC)
        return new Vector2(-74.006f, 40.7128f);
    }
    
    /// <summary>
    /// Diagnostic method to check OnlineMaps state
    /// </summary>
    public void DiagnoseCoordinateSystem()
    {
        Debug.Log("=== OnlineMaps Diagnostic ===");
        Debug.Log($"OnlineMaps singleton: {OnlineMaps.instance != null}");
        Debug.Log($"OnlineMapsControlBase singleton: {OnlineMapsControlBase.instance != null}");
        
        // Check scene-based components (our new approach)
        OnlineMaps sceneMap = FindObjectOfType<OnlineMaps>();
        OnlineMapsControlBase sceneControl = FindObjectOfType<OnlineMapsControlBase>();
        
        Debug.Log($"Scene OnlineMaps component: {sceneMap != null}");
        Debug.Log($"Scene ControlBase component: {sceneControl != null}");
        
        // Check what type of control is actually in the scene
        if (sceneControl != null)
        {
            Debug.Log($"Actual control type found: {sceneControl.GetType().Name}");
        }
        
        if (map != null)
        {
            Debug.Log($"Map Position: {map.position}");
            Debug.Log($"Map Zoom: {map.zoom}");
            Debug.Log($"Map Enabled: {map.enabled}");
            Debug.Log($"Map GameObject: {map.gameObject.name}");
        }
        else
        {
            Debug.LogError("Map is null after initialization!");
        }
        
        if (mapControl != null)
        {
            Debug.Log($"Control Type: {mapControl.GetType().Name}");
            Debug.Log($"Control Enabled: {mapControl.enabled}");
            Debug.Log($"Control Active: {mapControl.gameObject.activeInHierarchy}");
            Debug.Log($"Control GameObject: {mapControl.gameObject.name}");
            
            // Test coordinate conversion with known screen position
            Vector2 testScreen = new Vector2(Screen.width / 2, Screen.height / 2);
            Vector2 testResult = mapControl.GetCoords(testScreen);
            Debug.Log($"Test conversion (center screen) {testScreen} -> {testResult}");
            
            // Test with a corner position
            Vector2 cornerScreen = new Vector2(100, 100);
            Vector2 cornerResult = mapControl.GetCoords(cornerScreen);
            Debug.Log($"Test conversion (corner) {cornerScreen} -> {cornerResult}");
        }
        else
        {
            Debug.LogError("MapControl is null after initialization!");
        }
        
        Debug.Log("=== End Diagnostic ===");
    }
    
    #endregion
    
    #region Testing Support
    
    /// <summary>
    /// Simulate map click for testing purposes
    /// </summary>
    public void SimulateMapClick(Vector2 geoCoordinate)
    {
        OnMapClick?.Invoke(geoCoordinate);
    }
    
    #endregion
    
    #region Cleanup
    
    void OnDestroy()
    {
        // Cleanup event handlers
        if (map != null)
        {
            map.OnChangeZoom -= HandleZoomChange;
        }
        
        // Clear all drawings
        ClearMapDrawings();
    }
    
    #endregion
}

// Data structures for OSM integration
[System.Serializable]
public class OSMData
{
    public OSMElement[] elements;
}

[System.Serializable]
public class OSMElement
{
    public string type;
    public long id;
    public double lat;  // Use double for full geographic coordinate precision
    public double lon;  // Use double for full geographic coordinate precision
    public long[] nodes; // For ways
    public OSMTags tags;
}

[System.Serializable]
public class OSMNode
{
    public string type;
    public long id;
    public double lat;  // Use double for full geographic coordinate precision
    public double lon;  // Use double for full geographic coordinate precision
    public OSMTags tags;
}

[System.Serializable]
public class OSMTags
{
    public string highway;
    public string name;
}