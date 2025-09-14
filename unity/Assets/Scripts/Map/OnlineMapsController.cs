using System;
using System.Collections;
using System.Collections.Generic;
using System.Threading.Tasks;
using UnityEngine;

/// <summary>
/// Clean, event-driven interface to Online Maps v3.9
/// Serves as Single Source of Truth for all map interactions
/// Replaces the complex OnlineMapsBridge with proper Online Maps integration
/// </summary>
public class OnlineMapsController : MonoBehaviour
{
    [Header("Map Configuration")]
    public Vector2 defaultLocation = new Vector2(-74.006f, 40.7128f); // NYC coordinates (lng, lat)
    public int defaultZoom = 15;
    public int minZoom = 10;
    public int maxZoom = 18;
    
    [Header("OSM Integration")]
    public string overpassApiUrl = "https://overpass-api.de/api/interpreter";
    
    [Header("Debug")]
    public bool enableDebugLogs = true;
    
    // Online Maps references - using Online Maps as Single Source of Truth
    private OnlineMaps map;
    private OnlineMapsControlBase mapControl;
    
    // Event System - Clean, predictable events for marker operations
    public static event Action<Vector2> OnStartMarkerPlaced;
    public static event Action<Vector2> OnEndMarkerPlaced;
    public static event Action<Vector2> OnStartMarkerMoved;
    public static event Action<Vector2> OnEndMarkerMoved;
    public static event Action OnStartMarkerRemoved;
    public static event Action OnEndMarkerRemoved;
    public static event Action<Vector2> OnMapClicked;
    
    // Initialization state
    private bool isInitialized = false;
    
    void Start()
    {
        StartCoroutine(InitializeController());
    }
    
    #region Initialization
    
    /// <summary>
    /// Initialize Online Maps integration with proper setup
    /// </summary>
    IEnumerator InitializeController()
    {
        // Wait for Online Maps to be fully initialized
        yield return new WaitForEndOfFrame();
        yield return new WaitForEndOfFrame();
        
        // Find Online Maps components in scene
        map = FindObjectOfType<OnlineMaps>();
        if (map == null)
        {
            Debug.LogError("[OnlineMapsController] OnlineMaps component not found! Please add Online Maps to the scene.");
            yield break;
        }
        
        mapControl = FindObjectOfType<OnlineMapsControlBase>();
        if (mapControl == null)
        {
            Debug.LogError("[OnlineMapsController] OnlineMaps Control not found! Please ensure proper Online Maps setup.");
            yield break;
        }
        
        // Configure map settings
        SetupMapConfiguration();
        
        // Setup Online Maps native event handlers
        SetupOnlineMapsEvents();
        
        // Load default location
        SetMapLocation(defaultLocation, defaultZoom);
        
        isInitialized = true;
        
        if (enableDebugLogs)
        {
            Debug.Log($"[OnlineMapsController] Initialized successfully with {mapControl.GetType().Name}");
        }
    }
    
    void SetupMapConfiguration()
    {
        // Set zoom bounds
        map.zoomRange = new OnlineMapsRange(minZoom, maxZoom);
        
        // Enable smooth interactions
        if (mapControl != null)
        {
            mapControl.smoothZoom = true;
        }
    }
    
    /// <summary>
    /// Setup Online Maps native event system - this is the key to proper integration
    /// </summary>
    void SetupOnlineMapsEvents()
    {
        if (map == null || mapControl == null) return;
        
        // Use Online Maps' native click event system
        mapControl.OnMapClick += HandleOnlineMapsClick;
        
        // Listen for zoom changes to clear caches
        map.OnChangeZoom += HandleZoomChange;
        
        if (enableDebugLogs)
        {
            Debug.Log("[OnlineMapsController] Online Maps event handlers registered");
        }
    }
    
    #endregion
    
    #region Event Handlers
    
    /// <summary>
    /// Handle Online Maps native click events - this is our primary input method
    /// </summary>
    void HandleOnlineMapsClick()
    {
        if (!isInitialized) return;
        
        // Get click coordinates using Online Maps native methods
        Vector2 mousePosition = mapControl.GetInputPosition();
        Vector2 geoCoordinate = mapControl.GetCoords(mousePosition);
        
        if (enableDebugLogs)
        {
            Debug.Log($"[OnlineMapsController] Map clicked at geo: {geoCoordinate}, screen: {mousePosition}");
        }
        
        // Validate coordinates
        if (IsValidGeoCoordinate(geoCoordinate))
        {
            // Broadcast click event - let other systems decide what to do
            OnMapClicked?.Invoke(geoCoordinate);
        }
        else
        {
            Debug.LogWarning($"[OnlineMapsController] Invalid coordinates from click: {geoCoordinate}");
        }
    }
    
    void HandleZoomChange()
    {
        if (enableDebugLogs)
        {
            Debug.Log($"[OnlineMapsController] Zoom changed to: {map.zoom}");
        }
    }
    
    #endregion
    
    #region Public API - Clean Interface
    
    /// <summary>
    /// Check if controller is ready for operations
    /// </summary>
    public bool IsReady()
    {
        return isInitialized && map != null && mapControl != null;
    }
    
    /// <summary>
    /// Set map location and zoom
    /// </summary>
    public void SetMapLocation(Vector2 geoCoordinate, int zoom)
    {
        if (map == null) return;
        
        map.position = geoCoordinate;
        map.zoom = zoom;
        
        if (enableDebugLogs)
        {
            Debug.Log($"[OnlineMapsController] Map location set to: {geoCoordinate} at zoom {zoom}");
        }
    }
    
    /// <summary>
    /// Get current map center position
    /// </summary>
    public Vector2 GetMapCenter()
    {
        if (map != null)
        {
            return map.position;
        }
        return defaultLocation;
    }
    
    /// <summary>
    /// Get current map zoom level
    /// </summary>
    public int GetMapZoom()
    {
        if (map != null)
        {
            return map.zoom;
        }
        return defaultZoom;
    }
    
    /// <summary>
    /// Load a random location from predefined list
    /// </summary>
    public void LoadRandomLocation()
    {
        Vector2[] locations = {
            new Vector2(-74.006f, 40.7128f),  // NYC
            new Vector2(-0.1276f, 51.5074f),  // London  
            new Vector2(2.3522f, 48.8566f),   // Paris
            new Vector2(13.4050f, 52.5200f),  // Berlin
            new Vector2(139.6917f, 35.6895f), // Tokyo
            new Vector2(-122.4194f, 37.7749f) // San Francisco
        };
        
        Vector2 randomLocation = locations[UnityEngine.Random.Range(0, locations.Length)];
        SetMapLocation(randomLocation, defaultZoom);
    }
    
    #endregion
    
    #region Coordinate Conversion - Using Online Maps Native Methods
    
    /// <summary>
    /// Convert screen position to geographic coordinates using Online Maps
    /// </summary>
    public Vector2 ScreenToGeoCoordinate(Vector2 screenPosition)
    {
        if (!IsReady())
        {
            Debug.LogWarning("[OnlineMapsController] Not ready for coordinate conversion");
            return Vector2.zero;
        }
        
        return mapControl.GetCoords(screenPosition);
    }
    
    /// <summary>
    /// Convert geographic coordinates to screen position using Online Maps
    /// </summary>
    public Vector2 GeoCoordinateToScreen(Vector2 geoCoordinate)
    {
        if (!IsReady())
        {
            Debug.LogWarning("[OnlineMapsController] Not ready for coordinate conversion");
            return Vector2.zero;
        }
        
        return mapControl.GetScreenPosition(geoCoordinate.x, geoCoordinate.y);
    }
    
    /// <summary>
    /// Convert geographic coordinates to Unity world position
    /// Uses Online Maps screen coordinates as intermediate step for accuracy
    /// </summary>
    public Vector3 GeoCoordinateToWorldPosition(Vector2 geoCoordinate)
    {
        if (!IsReady())
        {
            Debug.LogWarning("[OnlineMapsController] Not ready for coordinate conversion");
            return Vector3.zero;
        }
        
        // Use Online Maps for screen position
        Vector2 screenPos = GeoCoordinateToScreen(geoCoordinate);
        
        // Convert screen to world using Unity camera system
        if (Camera.main != null)
        {
            Vector3 screenPos3D = new Vector3(screenPos.x, screenPos.y, 10f);
            Vector3 worldPos = Camera.main.ScreenToWorldPoint(screenPos3D);
            worldPos.y = 2f; // Elevate for visibility
            return worldPos;
        }
        
        // Fallback: basic scaling
        return new Vector3(screenPos.x * 0.01f, 2f, screenPos.y * 0.01f);
    }
    
    #endregion
    
    #region OSM Data Integration
    
    /// <summary>
    /// Get OSM road network data for pathfinding
    /// </summary>
    public async Task<OSMData> GetOSMRoadNetwork(Vector2 center, float radiusKm = 1.0f)
    {
        try
        {
            string query = BuildOSMQuery(center, radiusKm);
            
            if (enableDebugLogs)
            {
                Debug.Log($"[OnlineMapsController] Fetching OSM data for: {center}, radius: {radiusKm}km");
            }
            
            string jsonResponse = await FetchOSMData(query);
            
            if (string.IsNullOrEmpty(jsonResponse))
            {
                Debug.LogError("[OnlineMapsController] OSM API returned empty response");
                return null;
            }
            
            OSMData osmData = JsonUtility.FromJson<OSMData>(jsonResponse);
            
            if (osmData?.elements != null && enableDebugLogs)
            {
                Debug.Log($"[OnlineMapsController] Successfully loaded OSM data with {osmData.elements.Length} elements");
            }
            
            return osmData;
        }
        catch (System.Exception e)
        {
            Debug.LogError($"[OnlineMapsController] Error fetching OSM data: {e.Message}");
            return null;
        }
    }
    
    string BuildOSMQuery(Vector2 center, float radiusKm)
    {
        float lat = center.y;
        float lng = center.x;
        float radius = radiusKm * 1000; // Convert to meters
        
        return $@"[out:json][timeout:25];
(
  way[""highway""~""^(motorway|trunk|primary|secondary|tertiary|residential|service)$""]
    (around:{radius},{lat},{lng});
);
(._;>;);
out geom;";
    }
    
    async Task<string> FetchOSMData(string query)
    {
        using (var request = UnityEngine.Networking.UnityWebRequest.PostWwwForm(overpassApiUrl, ""))
        {
            byte[] bodyRaw = System.Text.Encoding.UTF8.GetBytes(query);
            request.uploadHandler = new UnityEngine.Networking.UploadHandlerRaw(bodyRaw);
            request.downloadHandler = new UnityEngine.Networking.DownloadHandlerBuffer();
            request.SetRequestHeader("Content-Type", "application/x-www-form-urlencoded");
            
            var operation = request.SendWebRequest();
            while (!operation.isDone)
                await Task.Yield();
            
            if (request.result == UnityEngine.Networking.UnityWebRequest.Result.Success)
            {
                return request.downloadHandler.text;
            }
            else
            {
                throw new System.Exception($"OSM API request failed: {request.error}");
            }
        }
    }
    
    #endregion
    
    #region Utility Methods
    
    /// <summary>
    /// Validate geographic coordinates
    /// </summary>
    bool IsValidGeoCoordinate(Vector2 geoCoordinate)
    {
        // Check for NaN values
        if (float.IsNaN(geoCoordinate.x) || float.IsNaN(geoCoordinate.y))
            return false;
            
        // Check for invalid (0,0) conversion
        if (geoCoordinate.x == 0f && geoCoordinate.y == 0f)
            return false;
        
        // Check valid coordinate bounds
        return geoCoordinate.x >= -180f && geoCoordinate.x <= 180f &&
               geoCoordinate.y >= -90f && geoCoordinate.y <= 90f;
    }
    
    /// <summary>
    /// Get diagnostic information about Online Maps state
    /// </summary>
    public void LogDiagnostics()
    {
        Debug.Log("=== OnlineMapsController Diagnostics ===");
        Debug.Log($"Initialized: {isInitialized}");
        Debug.Log($"Map Component: {map != null}");
        Debug.Log($"Control Component: {mapControl != null}");
        
        if (map != null)
        {
            Debug.Log($"Map Position: {map.position}");
            Debug.Log($"Map Zoom: {map.zoom}");
        }
        
        if (mapControl != null)
        {
            Debug.Log($"Control Type: {mapControl.GetType().Name}");
            Debug.Log($"Control Enabled: {mapControl.enabled}");
        }
        
        Debug.Log("=== End Diagnostics ===");
    }
    
    #endregion
    
    #region Cleanup
    
    void OnDestroy()
    {
        // Clean up Online Maps event handlers
        if (mapControl != null)
        {
            mapControl.OnMapClick -= HandleOnlineMapsClick;
        }
        
        if (map != null)
        {
            map.OnChangeZoom -= HandleZoomChange;
        }
        
        // Clear static events
        OnStartMarkerPlaced = null;
        OnEndMarkerPlaced = null;
        OnStartMarkerMoved = null;
        OnEndMarkerMoved = null;
        OnStartMarkerRemoved = null;
        OnEndMarkerRemoved = null;
        OnMapClicked = null;
        
        if (enableDebugLogs)
        {
            Debug.Log("[OnlineMapsController] Cleaned up event handlers");
        }
    }
    
    #endregion
}

// OSM Data structures are defined in OnlineMapsBridge.cs