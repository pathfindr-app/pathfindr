using System.Collections.Generic;
using UnityEngine;

/// <summary>
/// Unity equivalent of React's TripsLayer - renders path segments based on timeline position
/// Provides real-time visualization during algorithm execution and replay with scrubbing
/// Uses OnlineMapsBridge for accurate geographic coordinate conversion
/// </summary>
public class PathSegmentRenderer : MonoBehaviour
{
    [Header("Rendering Configuration")]
    public Material pathMaterial;
    public Material routeMaterial;
    public float lineWidth = 0.1f;
    public int segmentsPerLine = 10; // For smooth curves
    
    [Header("Color Scheme")]
    public Color explorationColor = Color.cyan;
    public Color routeColor = Color.green;
    public Color playerRouteColor = Color.yellow;
    
    [Header("Performance")]
    [Tooltip("Maximum segments to render simultaneously")]
    public int maxActiveSegments = 1000;
    public bool enableBatching = true;
    
    [Header("Integration")]
    public PathSegmentTimeline timeline;
    public OnlineMapsBridge mapBridge;
    
    [Header("Debug")]
    public bool enableDebugLogs = true;  // TEMP: Enable for coordinate issue debugging
    public bool showSegmentDebugInfo = false;
    
    // Rendering state
    private Dictionary<string, List<LineRenderer>> lineRendererPools;
    private List<LineRenderer> activeRenderers;
    private Dictionary<PathSegment, LineRenderer> segmentToRenderer;
    
    // Current frame state
    private float currentRenderTime = 0f;
    private List<PathSegment> currentActiveSegments;
    
    void Start()
    {
        InitializeRenderer();
    }
    
    void InitializeRenderer()
    {
        Debug.Log("[PathSegmentRenderer] Initializing renderer...");

        if (mapBridge == null)
        {
            mapBridge = FindObjectOfType<OnlineMapsBridge>();
            Debug.Log($"[PathSegmentRenderer] Found OnlineMapsBridge: {mapBridge != null}");
        }

        // Find timeline dependency - prefer local component, then find in scene
        if (timeline == null)
        {
            timeline = GetComponent<PathSegmentTimeline>();
            if (timeline == null)
            {
                timeline = FindObjectOfType<PathSegmentTimeline>();
            }
            Debug.Log($"[PathSegmentRenderer] Found PathSegmentTimeline: {timeline != null}");
        }

        // CRITICAL DEBUG: Check if timeline has segments and which instance we're using
        if (timeline != null)
        {
            Debug.Log($"[PathSegmentRenderer] Timeline instance: {timeline.GetInstanceID()}, segments at startup: {timeline.segments.Count}");
        }
            
        if (mapBridge == null)
            mapBridge = FindObjectOfType<OnlineMapsBridge>();
            
        if (mapBridge == null)
        {
            Debug.LogError("[PathSegmentRenderer] OnlineMapsBridge not found - coordinate conversion will fail!");
        }
        
        // Create default materials if needed - FIXED: Use proper LineRenderer shader
        if (pathMaterial == null)
        {
            // Try Unity's built-in line shader first, fallback to Unlit/Color
            Shader lineShader = Shader.Find("Legacy Shaders/Particles/Alpha Blended Premultiply") ?? Shader.Find("Unlit/Color");
            pathMaterial = new Material(lineShader);
            pathMaterial.color = explorationColor;
            Debug.Log($"[PathSegmentRenderer] Created default path material with shader: {lineShader.name}");
        }

        if (routeMaterial == null)
        {
            Shader lineShader = Shader.Find("Legacy Shaders/Particles/Alpha Blended Premultiply") ?? Shader.Find("Unlit/Color");
            routeMaterial = new Material(lineShader);
            routeMaterial.color = routeColor;
            Debug.Log($"[PathSegmentRenderer] Created default route material with shader: {lineShader.name}");
        }
        
        // Initialize pools
        lineRendererPools = new Dictionary<string, List<LineRenderer>>();
        activeRenderers = new List<LineRenderer>();
        segmentToRenderer = new Dictionary<PathSegment, LineRenderer>();
        currentActiveSegments = new List<PathSegment>();
        
        // Create pools for different segment types
        CreateLineRendererPool("path", explorationColor, 50, pathMaterial);
        CreateLineRendererPool("route", routeColor, 20, routeMaterial);
        CreateLineRendererPool("player", playerRouteColor, 10, routeMaterial);
        
        if (enableDebugLogs)
        {
            Debug.Log("[PathSegmentRenderer] Initialized with LineRenderer pools");
        }
    }
    
    void CreateLineRendererPool(string poolName, Color color, int poolSize, Material material)
    {
        List<LineRenderer> pool = new List<LineRenderer>();
        
        for (int i = 0; i < poolSize; i++)
        {
            GameObject lineObj = new GameObject($"LineRenderer_{poolName}_{i}");
            lineObj.transform.SetParent(transform);
            
            LineRenderer lr = lineObj.AddComponent<LineRenderer>();
            SetupLineRenderer(lr, color, material);
            lr.gameObject.SetActive(false);
            
            pool.Add(lr);
        }
        
        lineRendererPools[poolName] = pool;
    }
    
    void SetupLineRenderer(LineRenderer lr, Color color, Material material)
    {
        // FIXED: Create instance of material to avoid modifying shared material
        lr.material = new Material(material);
        lr.material.color = color;
        lr.startWidth = lineWidth;
        lr.endWidth = lineWidth;
        lr.useWorldSpace = true;
        lr.positionCount = 2;
        lr.sortingOrder = 1;

        // CRITICAL: Ensure line renderer is on a visible layer
        lr.gameObject.layer = 0; // Default layer

        if (enableDebugLogs)
        {
            Debug.Log($"[PathSegmentRenderer] Setup LineRenderer with material: {material.name}, color: {color}, width: {lineWidth}");
        }
    }
    
    void Update()
    {
        if (timeline == null)
        {
            if (enableDebugLogs && Time.frameCount % 300 == 0) // Log every 5 seconds
            {
                Debug.LogWarning("[PathSegmentRenderer] No timeline - cannot render segments");
            }
            return;
        }

        if (mapBridge == null && Time.frameCount % 300 == 0) // Log every 5 seconds
        {
            Debug.LogWarning("[PathSegmentRenderer] No mapBridge - coordinate conversion will fail");
        }
        
        // Get current timeline position
        float timelineTime = timeline.GetCurrentPlaybackTime();
        
        // CRITICAL FIX: Force update when segments exist but none are being rendered
        bool forceUpdate = (timeline.segments.Count > 0 && currentActiveSegments.Count == 0);

        // Update every frame like React (remove 10ms threshold for real-time)
        // OR if segments count changed (new segments added during algorithm execution)
        if (Mathf.Abs(timelineTime - currentRenderTime) > 1f || timeline.segments.Count != currentActiveSegments.Count || forceUpdate)
        {
            UpdateSegmentRendering(timelineTime);
            currentRenderTime = timelineTime;

            if (enableDebugLogs && Time.frameCount % 60 == 0) // Log once per second
            {
                Debug.Log($"[PathSegmentRenderer] Update: time={timelineTime:F1}ms, segments={timeline.segments.Count}, active={currentActiveSegments.Count}, force={forceUpdate}");
                Debug.Log($"[PathSegmentRenderer] Timeline instance: {timeline.GetInstanceID()}, duration: {timeline.totalDuration:F1}ms");
            }
        }
    }
    
    /// <summary>
    /// Main rendering update - mirrors React TripsLayer time-based rendering
    /// </summary>
    void UpdateSegmentRendering(float renderTime)
    {
        // Get segments that should be active at this time
        List<PathSegment> activeSegments = timeline.GetActiveSegmentsAtTime(renderTime);
        
        // Limit active segments for performance
        if (activeSegments.Count > maxActiveSegments)
        {
            activeSegments = activeSegments.GetRange(0, maxActiveSegments);
        }
        
        // Hide segments that are no longer active
        HideInactiveSegments(activeSegments);
        
        // Show/update active segments
        foreach (PathSegment segment in activeSegments)
        {
            UpdateSegmentRenderer(segment, renderTime);
        }
        
        currentActiveSegments = activeSegments;
        
        if (enableDebugLogs && Time.frameCount % 60 == 0) // Log every 60 frames
        {
            Debug.Log($"[PathSegmentRenderer] Rendering {activeSegments.Count} segments at time {renderTime:F1}ms");
        }
    }
    
    /// <summary>
    /// Update or create renderer for specific segment
    /// </summary>
    void UpdateSegmentRenderer(PathSegment segment, float renderTime)
    {
        // Get or create LineRenderer for this segment
        LineRenderer lr = GetLineRendererForSegment(segment);
        if (lr == null) return;
        
        // Convert geographic coordinates to world positions
        Vector2 startGeo = segment.path[0];
        Vector2 endGeo = segment.path[1];
        
        // HARDCODED TEST: Override first segment with different coordinates to test rendering
        if (enableDebugLogs && activeRenderers.Count == 0)
        {
            startGeo = new Vector2(-74.00f, 40.70f);  // Different start
            endGeo = new Vector2(-74.01f, 40.71f);    // Different end
            Debug.Log($"[PathSegmentRenderer] HARDCODED TEST: Using test coordinates {startGeo} → {endGeo}");
        }
        
        Vector3 startWorldPos = GetWorldPosition(startGeo);
        Vector3 endWorldPos = GetWorldPosition(endGeo);
        
        // CRITICAL DEBUG: Enhanced coordinate debugging (reduced spam)
        if (enableDebugLogs && activeRenderers.Count == 0) // Only log first segment
        {
            float geoDistance = Vector2.Distance(segment.path[0], segment.path[1]);
            float worldDistance = Vector3.Distance(startWorldPos, endWorldPos);

            Debug.Log($"[PathSegmentRenderer] === FIRST SEGMENT DEBUG ===");
            Debug.Log($"[PathSegmentRenderer] Geo: ({segment.path[0].x:F8}, {segment.path[0].y:F8}) → ({segment.path[1].x:F8}, {segment.path[1].y:F8}) [dist: {geoDistance:F8}]");
            Debug.Log($"[PathSegmentRenderer] World: {startWorldPos} → {endWorldPos} [dist: {worldDistance:F2}]");
            Debug.Log($"[PathSegmentRenderer] MapBridge: {mapBridge != null}, Camera.main: {Camera.main != null}");

            if (mapBridge != null && worldDistance < 0.001f)
            {
                Debug.LogWarning($"[PathSegmentRenderer] WORLD DISTANCE TOO SMALL - LINE MAY BE INVISIBLE!");
            }
        }
        
        // Calculate animation progress within segment timespan
        float segmentProgress = Mathf.InverseLerp(segment.timestamps[0], segment.timestamps[1], renderTime);
        segmentProgress = Mathf.Clamp01(segmentProgress);
        
        // Interpolate end position based on progress (animated line growth)
        Vector3 currentEndPos = Vector3.Lerp(startWorldPos, endWorldPos, segmentProgress);
        
        // Update line positions
        lr.positionCount = 2;
        lr.SetPosition(0, startWorldPos);
        lr.SetPosition(1, currentEndPos);
        
        // Ensure renderer is visible
        lr.gameObject.SetActive(true);
        
        // CRITICAL DEBUG: Log actual world positions set on LineRenderer (first segment only)
        if (enableDebugLogs && activeRenderers.Count == 1) // Only log first renderer
        {
            Debug.Log($"[PathSegmentRenderer] LineRenderer positions: {startWorldPos} → {currentEndPos}");
            Debug.Log($"[PathSegmentRenderer] LineRenderer active: {lr.gameObject.activeInHierarchy}, material: {lr.material?.name}, color: {lr.material?.color}");
            Debug.Log($"[PathSegmentRenderer] LineRenderer width: {lr.startWidth}, positionCount: {lr.positionCount}");
        }
        
        if (showSegmentDebugInfo && enableDebugLogs)
        {
            Debug.Log($"[PathSegmentRenderer] Segment {segment.color}: {segment.path[0]} → {segment.path[1]}, progress: {segmentProgress:F2}");
        }
    }
    
    /// <summary>
    /// Get LineRenderer from pool for segment
    /// </summary>
    LineRenderer GetLineRendererForSegment(PathSegment segment)
    {
        // Check if segment already has renderer
        if (segmentToRenderer.ContainsKey(segment))
        {
            return segmentToRenderer[segment];
        }
        
        // Get renderer from appropriate pool
        string poolName = GetPoolNameForSegment(segment);
        if (!lineRendererPools.ContainsKey(poolName))
        {
            poolName = "path"; // Fallback
        }
        
        List<LineRenderer> pool = lineRendererPools[poolName];
        
        // Find inactive renderer in pool
        foreach (LineRenderer lr in pool)
        {
            if (!lr.gameObject.activeInHierarchy)
            {
                segmentToRenderer[segment] = lr;
                activeRenderers.Add(lr);
                return lr;
            }
        }
        
        // Pool exhausted - reuse oldest renderer
        if (pool.Count > 0)
        {
            LineRenderer lr = pool[0];
            segmentToRenderer[segment] = lr;
            if (!activeRenderers.Contains(lr))
                activeRenderers.Add(lr);
            return lr;
        }
        
        return null;
    }
    
    string GetPoolNameForSegment(PathSegment segment)
    {
        switch (segment.color.ToLower())
        {
            case "route":
                return "route";
            case "player":
                return "player";
            default:
                return "path";
        }
    }
    
    /// <summary>
    /// Hide renderers for segments no longer active
    /// </summary>
    void HideInactiveSegments(List<PathSegment> activeSegments)
    {
        List<PathSegment> segmentsToRemove = new List<PathSegment>();
        
        foreach (var kvp in segmentToRenderer)
        {
            PathSegment segment = kvp.Key;
            LineRenderer lr = kvp.Value;
            
            if (!activeSegments.Contains(segment))
            {
                lr.gameObject.SetActive(false);
                activeRenderers.Remove(lr);
                segmentsToRemove.Add(segment);
            }
        }
        
        // Clean up mapping
        foreach (PathSegment segment in segmentsToRemove)
        {
            segmentToRenderer.Remove(segment);
        }
    }
    
    /// <summary>
    /// Convert geographic coordinate to Unity world position
    /// </summary>
    Vector3 GetWorldPosition(Vector2 geoCoordinate)
    {
        if (mapBridge != null)
        {
            return mapBridge.GeoCoordinateToWorldPosition(geoCoordinate);
        }
        
        // Fallback conversion (should not be used in production)
        Debug.LogWarning("[PathSegmentRenderer] Using fallback coordinate conversion - accuracy not guaranteed");
        return new Vector3(geoCoordinate.x * 1000f, 1f, geoCoordinate.y * 1000f);
    }
    
    /// <summary>
    /// Clear all rendered segments
    /// </summary>
    public void ClearAllSegments()
    {
        foreach (LineRenderer lr in activeRenderers)
        {
            lr.gameObject.SetActive(false);
        }
        
        activeRenderers.Clear();
        segmentToRenderer.Clear();
        currentActiveSegments.Clear();
        
        if (enableDebugLogs)
        {
            Debug.Log("[PathSegmentRenderer] All segments cleared");
        }
    }
    
    /// <summary>
    /// Set visibility of all segments
    /// </summary>
    public void SetSegmentVisibility(bool visible)
    {
        foreach (LineRenderer lr in activeRenderers)
        {
            lr.gameObject.SetActive(visible);
        }
    }
    
    /// <summary>
    /// Get current rendering statistics
    /// </summary>
    public string GetRenderingStats()
    {
        return $"Active segments: {currentActiveSegments.Count}, Active renderers: {activeRenderers.Count}";
    }
    
    /// <summary>
    /// Debug method to test rendering
    /// </summary>
    [ContextMenu("🧪 Test Segment Rendering")]
    public void TestSegmentRendering()
    {
        if (timeline == null)
        {
            Debug.LogWarning("[PathSegmentRenderer] No timeline found for testing");
            return;
        }

        Debug.Log("=== PATH SEGMENT RENDERER TEST ===");
        Debug.Log($"Timeline segments: {timeline.segments.Count}");
        Debug.Log($"Timeline instance ID: {timeline.GetInstanceID()}");
        Debug.Log($"Current stats: {GetRenderingStats()}");
        Debug.Log($"Timeline position: {timeline.timelinePosition:F3}");
        Debug.Log($"Timeline duration: {timeline.totalDuration:F1}ms");
        Debug.Log($"MapBridge connected: {mapBridge != null}");
        Debug.Log($"LineRenderer pools: {lineRendererPools?.Count ?? 0}");

        if (timeline.segments.Count > 0)
        {
            // Show first few segments
            for (int i = 0; i < Mathf.Min(3, timeline.segments.Count); i++)
            {
                var seg = timeline.segments[i];
                Debug.Log($"Segment {i}: {seg.path[0]} → {seg.path[1]} [{seg.timestamps[0]:F1}-{seg.timestamps[1]:F1}ms] {seg.color}");
            }
        }

        // Force update at current timeline position
        float currentTime = timeline.GetCurrentPlaybackTime();
        Debug.Log($"Forcing update at time: {currentTime:F1}ms");
        UpdateSegmentRendering(currentTime);

        Debug.Log($"After update: {GetRenderingStats()}");
        Debug.Log("=== END TEST ===");
    }

    /// <summary>
    /// Debug method to create test line
    /// </summary>
    [ContextMenu("🧪 Create Test Line")]
    public void CreateTestLine()
    {
        Debug.Log("[PathSegmentRenderer] Creating test line...");

        if (timeline == null)
        {
            Debug.LogError("[PathSegmentRenderer] No timeline - cannot create test line");
            return;
        }

        // Add test segment with visible coordinates
        Vector2 testStart = new Vector2(-74.0060f, 40.7128f); // NYC coordinates
        Vector2 testEnd = new Vector2(-74.0070f, 40.7138f);   // Slightly different

        timeline.AddPathSegment(testStart, testEnd, "path");
        Debug.Log($"[PathSegmentRenderer] Added test segment: {testStart} → {testEnd}");
        Debug.Log($"[PathSegmentRenderer] Timeline now has {timeline.segments.Count} segments");

        // Force render
        UpdateSegmentRendering(0f);
        Debug.Log($"[PathSegmentRenderer] Test line created. Stats: {GetRenderingStats()}");
    }

    /// <summary>
    /// Debug method to verify connection with AlgorithmStepExecutor
    /// </summary>
    [ContextMenu("🧪 Verify Connection with Algorithm")]
    public void VerifyAlgorithmConnection()
    {
        Debug.Log("=== ALGORITHM CONNECTION TEST ===");

        AlgorithmStepExecutor executor = FindObjectOfType<AlgorithmStepExecutor>();
        if (executor != null)
        {
            Debug.Log($"Found AlgorithmStepExecutor: {executor.name}");
            Debug.Log($"Executor timeline: {executor.timeline?.GetInstanceID() ?? -1}");
            Debug.Log($"Renderer timeline: {timeline?.GetInstanceID() ?? -1}");
            Debug.Log($"Timelines match: {executor.timeline == timeline}");

            if (executor.timeline != null)
            {
                Debug.Log($"Executor timeline segments: {executor.timeline.segments.Count}");
                Debug.Log($"Executor timeline duration: {executor.timeline.totalDuration:F1}ms");
            }
        }
        else
        {
            Debug.LogWarning("No AlgorithmStepExecutor found in scene");
        }

        Debug.Log($"Renderer initialized: {lineRendererPools != null}");
        Debug.Log($"Renderer materials: path={pathMaterial != null}, route={routeMaterial != null}");
        Debug.Log("=== END CONNECTION TEST ===");
    }
}