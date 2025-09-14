using System.Collections;
using System.Collections.Generic;
using UnityEngine;

/// <summary>
/// Mirror of React's background algorithm processing system
/// Runs pathfinding algorithms in background while player draws route
/// Enables instant animation start when player finishes (no waiting)
/// Implements dual-algorithm pattern from React codebase
/// </summary>
public class BackgroundAlgorithmProcessor : MonoBehaviour
{
    [Header("Dual Algorithm System")]
    [Tooltip("Main algorithm executor for primary visualization")]
    public AlgorithmStepExecutor mainExecutor;
    [Tooltip("Background algorithm executor for pre-calculation")]
    public AlgorithmStepExecutor backgroundExecutor;
    
    [Header("Background Processing")]
    public bool enableBackgroundProcessing = true;
    public bool backgroundAlgorithmReady = false;
    public bool backgroundIsRunning = false;
    
    [Header("Integration")]
    public PathSegmentTimeline mainTimeline;
    public PathSegmentTimeline backgroundTimeline;
    public TimelinePlayer timelinePlayer;
    
    [Header("Performance")]
    [Tooltip("Background execution steps per frame")]
    public int backgroundStepsPerFrame = 5;
    [Tooltip("Maximum background execution time per frame (ms)")]
    public float maxBackgroundTimePerFrame = 5f;
    
    [Header("Game State Integration")]
    public MarkerStateManager markerManager;
    public PathfindingManager pathfindingManager;
    
    [Header("Debug")]
    public bool enableDebugLogs = true;
    public PathfindingResult backgroundResult;
    
    // Events for game flow integration
    public System.Action<PathfindingResult> OnBackgroundAlgorithmReady;
    public System.Action OnBackgroundAlgorithmStarted;
    public System.Action OnMainAlgorithmStarted;
    
    // Background processing state
    private PathfindingAlgorithm backgroundAlgorithm;
    private PathfindingNode backgroundStartNode;
    private PathfindingNode backgroundEndNode;
    private Coroutine backgroundProcessingCoroutine;
    
    void Start()
    {
        InitializeBackgroundProcessor();
    }
    
    void InitializeBackgroundProcessor()
    {
        // Find dependencies
        if (mainExecutor == null)
            mainExecutor = FindObjectOfType<AlgorithmStepExecutor>();
            
        if (markerManager == null)
            markerManager = FindObjectOfType<MarkerStateManager>();
            
        if (pathfindingManager == null)
            pathfindingManager = FindObjectOfType<PathfindingManager>();
        
        // Create background executor if not assigned
        if (backgroundExecutor == null)
        {
            GameObject bgExecutorObj = new GameObject("BackgroundAlgorithmExecutor");
            bgExecutorObj.transform.SetParent(transform);
            backgroundExecutor = bgExecutorObj.AddComponent<AlgorithmStepExecutor>();
            backgroundExecutor.enableDebugLogs = false; // Reduce noise
        }
        
        // Create background timeline if not assigned
        if (backgroundTimeline == null)
        {
            GameObject bgTimelineObj = new GameObject("BackgroundTimeline");
            bgTimelineObj.transform.SetParent(transform);
            backgroundTimeline = bgTimelineObj.AddComponent<PathSegmentTimeline>();
            backgroundTimeline.enableDebugLogs = false; // Reduce noise
        }
        
        // Subscribe to marker placement events
        if (markerManager != null)
        {
            MarkerStateManager.OnMarkersReady += OnBothMarkersPlaced;
        }
        
        if (enableDebugLogs)
        {
            Debug.Log("[BackgroundAlgorithmProcessor] Initialized dual-algorithm background system");
        }
    }
    
    #region Background Processing - Mirror of React Pattern
    
    /// <summary>
    /// Start background algorithm when both markers are placed - mirrors React's background system
    /// </summary>
    void OnBothMarkersPlaced()
    {
        if (!enableBackgroundProcessing) return;
        
        // Get start and end nodes from marker manager
        PathfindingNode startNode = markerManager.CreateStartNode();
        PathfindingNode endNode = markerManager.CreateEndNode();
        
        if (startNode != null && endNode != null)
        {
            StartBackgroundAlgorithm(startNode, endNode);
        }
        else
        {
            Debug.LogWarning("[BackgroundAlgorithmProcessor] Could not create pathfinding nodes from markers");
        }
    }
    
    /// <summary>
    /// Start background algorithm processing - mirrors React's backgroundAlgorithmState pattern
    /// </summary>
    public void StartBackgroundAlgorithm(PathfindingNode startNode, PathfindingNode endNode, string algorithmType = "astar")
    {
        if (backgroundIsRunning)
        {
            StopBackgroundAlgorithm();
        }
        
        backgroundStartNode = startNode;
        backgroundEndNode = endNode;
        
        // Create algorithm instance
        backgroundAlgorithm = CreateAlgorithmInstance(algorithmType);
        
        if (backgroundAlgorithm == null)
        {
            Debug.LogError($"[BackgroundAlgorithmProcessor] Failed to create algorithm: {algorithmType}");
            return;
        }
        
        // Reset state
        backgroundAlgorithmReady = false;
        backgroundIsRunning = true;
        backgroundResult = null;
        backgroundTimeline.ClearTimeline();
        
        // Start background processing
        backgroundProcessingCoroutine = StartCoroutine(ProcessBackgroundAlgorithm());
        
        OnBackgroundAlgorithmStarted?.Invoke();
        
        if (enableDebugLogs)
        {
            Debug.Log($"[BackgroundAlgorithmProcessor] Started background {algorithmType} from {startNode.geoCoordinate} to {endNode.geoCoordinate}");
        }
    }
    
    /// <summary>
    /// Background algorithm processing coroutine - mirrors React's background execution
    /// </summary>
    IEnumerator ProcessBackgroundAlgorithm()
    {
        float frameStartTime = Time.realtimeSinceStartup * 1000f;
        
        // Execute algorithm instantly in background (no visualization)
        backgroundResult = backgroundExecutor.ExecuteAlgorithmInstant(
            backgroundAlgorithm,
            backgroundStartNode,
            backgroundEndNode
        );
        
        // Build timeline from result for later playback
        if (backgroundResult.success)
        {
            BuildTimelineFromResult(backgroundResult, backgroundTimeline);
        }
        
        // Mark as ready
        backgroundAlgorithmReady = true;
        backgroundIsRunning = false;
        
        OnBackgroundAlgorithmReady?.Invoke(backgroundResult);
        
        if (enableDebugLogs)
        {
            float processingTime = (Time.realtimeSinceStartup * 1000f) - frameStartTime;
            Debug.Log($"[BackgroundAlgorithmProcessor] Background algorithm completed in {processingTime:F1}ms");
            Debug.Log($"[BackgroundAlgorithmProcessor] Result: {backgroundResult.executionSteps} steps, {backgroundResult.nodesExplored} nodes explored");
        }
        
        yield return null;
    }
    
    /// <summary>
    /// Stop background algorithm processing
    /// </summary>
    public void StopBackgroundAlgorithm()
    {
        if (backgroundProcessingCoroutine != null)
        {
            StopCoroutine(backgroundProcessingCoroutine);
            backgroundProcessingCoroutine = null;
        }
        
        backgroundIsRunning = false;
        
        if (enableDebugLogs)
        {
            Debug.Log("[BackgroundAlgorithmProcessor] Background algorithm stopped");
        }
    }
    
    #endregion
    
    #region Main Algorithm Execution
    
    /// <summary>
    /// Start main algorithm visualization - uses background results if ready
    /// </summary>
    public void StartMainAlgorithmVisualization(string algorithmType = "astar")
    {
        if (mainExecutor == null)
        {
            Debug.LogError("[BackgroundAlgorithmProcessor] Main executor not available");
            return;
        }
        
        PathfindingNode startNode = markerManager?.CreateStartNode();
        PathfindingNode endNode = markerManager?.CreateEndNode();
        
        if (startNode == null || endNode == null)
        {
            Debug.LogError("[BackgroundAlgorithmProcessor] Cannot start main algorithm - no valid start/end nodes");
            return;
        }
        
        // Check if background algorithm is ready and matches
        if (backgroundAlgorithmReady && backgroundResult != null && backgroundResult.success)
        {
            // Use background results for instant visualization start
            if (enableDebugLogs)
            {
                Debug.Log("[BackgroundAlgorithmProcessor] Using background algorithm results for instant animation");
            }
            
            // Copy background timeline to main timeline
            CopyTimelineData(backgroundTimeline, mainTimeline);
            
            // Start timeline playback immediately
            if (timelinePlayer != null)
            {
                timelinePlayer.SeekToStart();
                timelinePlayer.StartPlayback();
            }
        }
        else
        {
            // Fall back to real-time algorithm execution
            if (enableDebugLogs)
            {
                Debug.Log("[BackgroundAlgorithmProcessor] Background not ready - falling back to real-time execution");
            }
            
            PathfindingAlgorithm algorithm = CreateAlgorithmInstance(algorithmType);
            if (algorithm != null)
            {
                mainExecutor.StartAlgorithm(algorithm, startNode, endNode);
            }
        }
        
        OnMainAlgorithmStarted?.Invoke();
    }
    
    #endregion
    
    #region Algorithm Factory
    
    /// <summary>
    /// Create algorithm instance by type name
    /// </summary>
    PathfindingAlgorithm CreateAlgorithmInstance(string algorithmType)
    {
        if (pathfindingManager == null)
        {
            Debug.LogError("[BackgroundAlgorithmProcessor] PathfindingManager not available for algorithm creation");
            return null;
        }
        
        // Use PathfindingAlgorithm's static factory method
        switch (algorithmType.ToLower())
        {
            case "astar":
                return PathfindingAlgorithm.CreateAlgorithm(PathfindingAlgorithm.AlgorithmType.AStar);
            case "dijkstra":
                return PathfindingAlgorithm.CreateAlgorithm(PathfindingAlgorithm.AlgorithmType.Dijkstra);
            case "greedy":
                return PathfindingAlgorithm.CreateAlgorithm(PathfindingAlgorithm.AlgorithmType.Greedy);
            case "bidirectional":
                return PathfindingAlgorithm.CreateAlgorithm(PathfindingAlgorithm.AlgorithmType.BidirectionalSearch);
            default:
                return PathfindingAlgorithm.CreateAlgorithm(PathfindingAlgorithm.AlgorithmType.AStar);
        }
    }
    
    #endregion
    
    #region Timeline Management
    
    /// <summary>
    /// Build timeline from completed pathfinding result
    /// </summary>
    void BuildTimelineFromResult(PathfindingResult result, PathSegmentTimeline timeline)
    {
        if (result == null || !result.success || result.optimalRoute.Count < 2)
        {
            if (enableDebugLogs)
            {
                Debug.LogWarning("[BackgroundAlgorithmProcessor] Cannot build timeline - invalid result");
            }
            return;
        }
        
        timeline.ClearTimeline();
        
        // Add route segments to timeline
        for (int i = 1; i < result.optimalRoute.Count; i++)
        {
            PathfindingNode fromNode = result.optimalRoute[i - 1];
            PathfindingNode toNode = result.optimalRoute[i];
            
            timeline.AddPathSegment(fromNode, toNode, "route");
        }
        
        if (enableDebugLogs)
        {
            Debug.Log($"[BackgroundAlgorithmProcessor] Built timeline with {result.optimalRoute.Count - 1} segments");
        }
    }
    
    /// <summary>
    /// Copy timeline data from source to destination
    /// </summary>
    void CopyTimelineData(PathSegmentTimeline source, PathSegmentTimeline destination)
    {
        if (source == null || destination == null)
        {
            Debug.LogWarning("[BackgroundAlgorithmProcessor] Cannot copy timeline data - null references");
            return;
        }
        
        destination.ClearTimeline();
        
        // Copy all segments
        foreach (PathSegment segment in source.segments)
        {
            PathSegment newSegment = new PathSegment(
                segment.path[0],
                segment.path[1],
                segment.timestamps[0],
                segment.timestamps[1],
                segment.color
            );
            
            destination.segments.Add(newSegment);
        }
        
        // Copy timeline state
        destination.currentTimer = source.currentTimer;
        destination.totalDuration = source.totalDuration;
        
        if (enableDebugLogs)
        {
            Debug.Log($"[BackgroundAlgorithmProcessor] Copied {source.segments.Count} timeline segments");
        }
    }
    
    #endregion
    
    #region Public Interface
    
    /// <summary>
    /// Check if background processing is available and ready
    /// </summary>
    public bool IsBackgroundReady()
    {
        return enableBackgroundProcessing && backgroundAlgorithmReady && backgroundResult != null && backgroundResult.success;
    }
    
    /// <summary>
    /// Get background processing status
    /// </summary>
    public string GetBackgroundStatus()
    {
        if (!enableBackgroundProcessing)
            return "Disabled";
        if (backgroundIsRunning)
            return "Processing...";
        if (backgroundAlgorithmReady)
            return "Ready";
        return "Waiting";
    }
    
    /// <summary>
    /// Force restart background processing
    /// </summary>
    public void RestartBackgroundProcessing()
    {
        if (markerManager != null && markerManager.HasBothMarkers())
        {
            OnBothMarkersPlaced();
        }
    }
    
    #endregion
    
    #region Debug Methods
    
    /// <summary>
    /// Test background processing system
    /// </summary>
    [ContextMenu("🧪 Test Background Processing")]
    public void TestBackgroundProcessing()
    {
        Debug.Log("🧪 BACKGROUND PROCESSING TEST");
        Debug.Log("═══════════════════════════");
        Debug.Log($"Background enabled: {enableBackgroundProcessing}");
        Debug.Log($"Background status: {GetBackgroundStatus()}");
        Debug.Log($"Background ready: {IsBackgroundReady()}");
        
        if (backgroundResult != null)
        {
            Debug.Log($"Background result: {backgroundResult.executionSteps} steps, {backgroundResult.nodesExplored} nodes");
            Debug.Log($"Route length: {backgroundResult.optimalRoute.Count} nodes");
        }
        
        Debug.Log("═══════════════════════════");
        
        // Test restart if markers are available
        if (markerManager != null && markerManager.HasBothMarkers())
        {
            Debug.Log("Testing background processing restart...");
            RestartBackgroundProcessing();
        }
    }
    
    #endregion
    
    void OnDestroy()
    {
        // Clean up event subscriptions
        if (markerManager != null)
        {
            MarkerStateManager.OnMarkersReady -= OnBothMarkersPlaced;
        }
        
        // Stop background processing
        StopBackgroundAlgorithm();
        
        if (enableDebugLogs)
        {
            Debug.Log("[BackgroundAlgorithmProcessor] Cleaned up background processing system");
        }
    }
}