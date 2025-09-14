using System.Collections.Generic;
using UnityEngine;

/// <summary>
/// Replacement for PathSegmentRenderer using Online Maps native Drawing API
/// Renders pathfinding visualization with automatic view synchronization (zoom/pan/rotate)
/// Mirrors React's TripsLayer but uses OnlineMapsDrawingLine instead of Unity LineRenderers
/// </summary>
public class OnlineMapsPathVisualizer : MonoBehaviour
{
    [Header("Rendering Configuration")]
    public float explorationLineWidth = 3f;
    public float routeLineWidth = 5f;

    [Header("Color Scheme")]
    public Color explorationColor = Color.cyan;
    public Color routeColor = Color.green;
    public Color playerRouteColor = Color.yellow;

    [Header("Performance")]
    [Tooltip("Maximum segments to render simultaneously")]
    public int maxActiveSegments = 1000;

    [Header("Integration")]
    public PathSegmentTimeline timeline;

    [Header("Debug")]
    public bool enableDebugLogs = true;

    // Online Maps references
    private OnlineMaps map;
    private OnlineMapsDrawingElementManager drawingManager;

    // Drawing state
    private Dictionary<PathSegment, OnlineMapsDrawingLine> segmentToDrawingLine;
    private List<OnlineMapsDrawingLine> activeDrawingLines;

    // Current frame state
    private float currentRenderTime = 0f;
    private List<PathSegment> currentActiveSegments;

    void Start()
    {
        InitializeVisualizer();
    }

    void InitializeVisualizer()
    {
        if (enableDebugLogs)
        {
            Debug.Log("[OnlineMapsPathVisualizer] Initializing Drawing API visualizer...");
        }

        // Find Online Maps components
        map = FindObjectOfType<OnlineMaps>();
        if (map == null)
        {
            Debug.LogError("[OnlineMapsPathVisualizer] OnlineMaps component not found!");
            return;
        }

        drawingManager = map.drawingElementManager;
        if (drawingManager == null)
        {
            Debug.LogError("[OnlineMapsPathVisualizer] OnlineMapsDrawingElementManager not found!");
            return;
        }

        // Find timeline dependency
        if (timeline == null)
        {
            timeline = GetComponent<PathSegmentTimeline>();
            if (timeline == null)
            {
                timeline = FindObjectOfType<PathSegmentTimeline>();
            }
        }

        if (timeline == null)
        {
            Debug.LogError("[OnlineMapsPathVisualizer] PathSegmentTimeline not found!");
            return;
        }

        // Initialize collections
        segmentToDrawingLine = new Dictionary<PathSegment, OnlineMapsDrawingLine>();
        activeDrawingLines = new List<OnlineMapsDrawingLine>();
        currentActiveSegments = new List<PathSegment>();

        if (enableDebugLogs)
        {
            Debug.Log($"[OnlineMapsPathVisualizer] Initialized with timeline: {timeline.GetInstanceID()}");
            Debug.Log($"[OnlineMapsPathVisualizer] Drawing manager: {drawingManager != null}");
        }
    }

    void Update()
    {
        if (timeline == null || map == null || drawingManager == null)
        {
            if (enableDebugLogs && Time.frameCount % 300 == 0) // Log every 5 seconds
            {
                Debug.LogWarning("[OnlineMapsPathVisualizer] Missing dependencies - cannot render segments");
            }
            return;
        }

        // Get current timeline position
        float timelineTime = timeline.GetCurrentPlaybackTime();

        // Force update when segments exist but none are being rendered
        bool forceUpdate = (timeline.segments.Count > 0 && currentActiveSegments.Count == 0);

        // Update every frame for real-time visualization (mirrors React TripsLayer)
        if (Mathf.Abs(timelineTime - currentRenderTime) > 1f || timeline.segments.Count != currentActiveSegments.Count || forceUpdate)
        {
            UpdateSegmentVisualization(timelineTime);
            currentRenderTime = timelineTime;

            if (enableDebugLogs && Time.frameCount % 60 == 0) // Log once per second
            {
                Debug.Log($"[OnlineMapsPathVisualizer] Update: time={timelineTime:F1}ms, segments={timeline.segments.Count}, active={currentActiveSegments.Count}");
            }
        }
    }

    /// <summary>
    /// Main visualization update - mirrors PathSegmentRenderer.UpdateSegmentRendering()
    /// </summary>
    void UpdateSegmentVisualization(float renderTime)
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
            UpdateDrawingLine(segment, renderTime);
        }

        currentActiveSegments = activeSegments;

        if (enableDebugLogs && Time.frameCount % 60 == 0)
        {
            Debug.Log($"[OnlineMapsPathVisualizer] Rendered {activeSegments.Count} segments at time {renderTime:F1}ms");
        }
    }

    /// <summary>
    /// Update or create OnlineMapsDrawingLine for specific segment
    /// Mirrors PathSegmentRenderer.UpdateSegmentRenderer() but uses Drawing API
    /// </summary>
    void UpdateDrawingLine(PathSegment segment, float renderTime)
    {
        // Get or create OnlineMapsDrawingLine for this segment
        OnlineMapsDrawingLine drawingLine = GetDrawingLineForSegment(segment);
        if (drawingLine == null) return;

        // Calculate animation progress within segment timespan
        float segmentProgress = Mathf.InverseLerp(segment.timestamps[0], segment.timestamps[1], renderTime);
        segmentProgress = Mathf.Clamp01(segmentProgress);

        // CRITICAL: Use geographic coordinates directly (no world space conversion needed)
        Vector2 startGeo = segment.path[0];
        Vector2 endGeo = segment.path[1];

        // Animate line growth by interpolating end position
        Vector2 currentEndGeo = Vector2.Lerp(startGeo, endGeo, segmentProgress);

        // Update line points - OnlineMapsDrawingLine uses geographic coordinates directly
        List<Vector2> linePoints = new List<Vector2> { startGeo, currentEndGeo };
        drawingLine.points = linePoints; // This automatically triggers map.Redraw()

        // Set visibility
        drawingLine.visible = true;

        // CRITICAL DEBUG: Log first segment details
        if (enableDebugLogs && activeDrawingLines.Count == 1)
        {
            Debug.Log($"[OnlineMapsPathVisualizer] First line: {startGeo} → {currentEndGeo}, progress: {segmentProgress:F2}");
            Debug.Log($"[OnlineMapsPathVisualizer] Drawing line visible: {drawingLine.visible}, color: {drawingLine.color}");
        }
    }

    /// <summary>
    /// Get or create OnlineMapsDrawingLine for segment
    /// </summary>
    OnlineMapsDrawingLine GetDrawingLineForSegment(PathSegment segment)
    {
        // Check if segment already has drawing line
        if (segmentToDrawingLine.ContainsKey(segment))
        {
            return segmentToDrawingLine[segment];
        }

        // Create new OnlineMapsDrawingLine
        Color lineColor = GetColorForSegment(segment);
        float lineWidth = GetWidthForSegment(segment);

        // CRITICAL: Use geographic coordinates directly, no conversion needed
        List<Vector2> initialPoints = new List<Vector2> { segment.path[0], segment.path[0] }; // Start with zero-length line

        OnlineMapsDrawingLine drawingLine = new OnlineMapsDrawingLine(initialPoints, lineColor, lineWidth);

        // Configure line properties
        drawingLine.visible = true;
        drawingLine.checkMapBoundaries = false; // Allow lines outside map bounds (recommended for pathfinding)

        // Add to Online Maps drawing manager
        drawingManager.Add(drawingLine);

        // Track the line
        segmentToDrawingLine[segment] = drawingLine;
        activeDrawingLines.Add(drawingLine);

        if (enableDebugLogs)
        {
            Debug.Log($"[OnlineMapsPathVisualizer] Created drawing line: {segment.path[0]} → {segment.path[1]}, color: {lineColor}, width: {lineWidth}");
        }

        return drawingLine;
    }

    /// <summary>
    /// Get color for segment based on type
    /// </summary>
    Color GetColorForSegment(PathSegment segment)
    {
        switch (segment.color.ToLower())
        {
            case "route":
                return routeColor;
            case "player":
                return playerRouteColor;
            default:
                return explorationColor;
        }
    }

    /// <summary>
    /// Get line width for segment based on type
    /// </summary>
    float GetWidthForSegment(PathSegment segment)
    {
        switch (segment.color.ToLower())
        {
            case "route":
            case "player":
                return routeLineWidth;
            default:
                return explorationLineWidth;
        }
    }

    /// <summary>
    /// Hide drawing lines for segments no longer active
    /// </summary>
    void HideInactiveSegments(List<PathSegment> activeSegments)
    {
        List<PathSegment> segmentsToRemove = new List<PathSegment>();

        foreach (var kvp in segmentToDrawingLine)
        {
            PathSegment segment = kvp.Key;
            OnlineMapsDrawingLine drawingLine = kvp.Value;

            if (!activeSegments.Contains(segment))
            {
                // Hide the drawing line
                drawingLine.visible = false;
                activeDrawingLines.Remove(drawingLine);
                segmentsToRemove.Add(segment);
            }
        }

        // Clean up mapping
        foreach (PathSegment segment in segmentsToRemove)
        {
            segmentToDrawingLine.Remove(segment);
        }
    }

    /// <summary>
    /// Clear all rendered segments
    /// </summary>
    public void ClearAllSegments()
    {
        if (drawingManager != null)
        {
            foreach (OnlineMapsDrawingLine drawingLine in activeDrawingLines)
            {
                if (drawingLine != null)
                {
                    drawingManager.Remove(drawingLine);
                }
            }
        }

        activeDrawingLines.Clear();
        segmentToDrawingLine.Clear();
        currentActiveSegments.Clear();

        if (enableDebugLogs)
        {
            Debug.Log("[OnlineMapsPathVisualizer] All segments cleared");
        }
    }

    /// <summary>
    /// Set visibility of all segments
    /// </summary>
    public void SetSegmentVisibility(bool visible)
    {
        foreach (OnlineMapsDrawingLine drawingLine in activeDrawingLines)
        {
            if (drawingLine != null)
            {
                drawingLine.visible = visible;
            }
        }
    }

    /// <summary>
    /// Get current rendering statistics
    /// </summary>
    public string GetVisualizationStats()
    {
        return $"Active segments: {currentActiveSegments.Count}, Active drawing lines: {activeDrawingLines.Count}";
    }

    /// <summary>
    /// Debug method to test visualization
    /// </summary>
    [ContextMenu("🧪 Test Drawing API Visualization")]
    public void TestDrawingVisualization()
    {
        if (timeline == null)
        {
            Debug.LogWarning("[OnlineMapsPathVisualizer] No timeline found for testing");
            return;
        }

        Debug.Log("=== ONLINE MAPS DRAWING API TEST ===");
        Debug.Log($"Map: {map != null}, Drawing Manager: {drawingManager != null}");
        Debug.Log($"Timeline segments: {timeline.segments.Count}");
        Debug.Log($"Current stats: {GetVisualizationStats()}");

        if (timeline.segments.Count > 0)
        {
            for (int i = 0; i < Mathf.Min(3, timeline.segments.Count); i++)
            {
                var seg = timeline.segments[i];
                Debug.Log($"Segment {i}: {seg.path[0]} → {seg.path[1]} [{seg.timestamps[0]:F1}-{seg.timestamps[1]:F1}ms] {seg.color}");
            }
        }

        // Force update at current timeline position
        float currentTime = timeline.GetCurrentPlaybackTime();
        Debug.Log($"Forcing update at time: {currentTime:F1}ms");
        UpdateSegmentVisualization(currentTime);

        Debug.Log($"After update: {GetVisualizationStats()}");
        Debug.Log("=== END TEST ===");
    }

    /// <summary>
    /// Debug method to create test line using Drawing API
    /// </summary>
    [ContextMenu("🧪 Create Test Drawing Line")]
    public void CreateTestDrawingLine()
    {
        if (map == null || drawingManager == null)
        {
            Debug.LogError("[OnlineMapsPathVisualizer] Map or drawing manager not available");
            return;
        }

        Debug.Log("[OnlineMapsPathVisualizer] Creating test Drawing API line...");

        // Create test line with NYC coordinates
        Vector2 testStart = new Vector2(-74.0060f, 40.7128f);
        Vector2 testEnd = new Vector2(-74.0070f, 40.7138f);

        List<Vector2> testPoints = new List<Vector2> { testStart, testEnd };
        OnlineMapsDrawingLine testLine = new OnlineMapsDrawingLine(testPoints, Color.red, 5f);
        testLine.checkMapBoundaries = false;

        drawingManager.Add(testLine);

        Debug.Log($"[OnlineMapsPathVisualizer] Test line created: {testStart} → {testEnd}");
        Debug.Log($"[OnlineMapsPathVisualizer] Drawing manager elements: {drawingManager.Count}");
    }

    /// <summary>
    /// Verify connection with algorithm execution system
    /// </summary>
    [ContextMenu("🧪 Verify Algorithm Connection")]
    public void VerifyAlgorithmConnection()
    {
        Debug.Log("=== ALGORITHM CONNECTION TEST ===");

        AlgorithmStepExecutor executor = FindObjectOfType<AlgorithmStepExecutor>();
        if (executor != null)
        {
            Debug.Log($"Found AlgorithmStepExecutor: {executor.name}");
            Debug.Log($"Executor timeline: {executor.timeline?.GetInstanceID() ?? -1}");
            Debug.Log($"Visualizer timeline: {timeline?.GetInstanceID() ?? -1}");
            Debug.Log($"Timelines match: {executor.timeline == timeline}");

            if (executor.timeline != null)
            {
                Debug.Log($"Executor timeline segments: {executor.timeline.segments.Count}");
            }
        }
        else
        {
            Debug.LogWarning("No AlgorithmStepExecutor found in scene");
        }

        Debug.Log($"Online Maps initialized: {map != null}");
        Debug.Log($"Drawing manager ready: {drawingManager != null}");
        Debug.Log("=== END CONNECTION TEST ===");
    }
}