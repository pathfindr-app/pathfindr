using System.Collections;
using System.Collections.Generic;
using System.Linq;
using UnityEngine;

/// <summary>
/// Mirror of React's animateStep() function and algorithm execution system
/// Executes pathfinding algorithms step-by-step while building visualization timeline
/// Integrates with PathSegmentTimeline to create real-time + replay visualization
/// </summary>
public class AlgorithmStepExecutor : MonoBehaviour
{
    [Header("Algorithm System")]
    public PathfindingAlgorithm currentAlgorithm;
    public PathSegmentTimeline timeline;
    public VisualEffectsManager visualEffects;

    [Header("Visualization (Choose One)")]
    public PathSegmentRenderer renderer; // Legacy LineRenderer system
    public OnlineMapsPathVisualizer pathVisualizer; // New Drawing API system
    
    [Header("Execution State")]
    public bool isExecuting = false;
    public bool algorithmFinished = false;
    public bool animationFinished = false;
    
    [Header("Timing Control")]
    [Tooltip("Steps per second during real-time execution")]
    public float stepsPerSecond = 100f;  // Much faster like React
    [Tooltip("Speed multiplier for route tracing (mirrors React's Math.log2(settings.speed))")]
    public float routeTraceSpeedMultiplier = 1f;
    
    [Header("Route Tracing")]
    [Tooltip("Current node being traced back for final route")]
    public PathfindingNode currentTraceNode;
    
    [Header("Debug")]
    public bool enableDebugLogs = true;
    public int totalStepsExecuted = 0;
    public int totalNodesExplored = 0;
    public int maxStepsLimit = 1000; // Prevent infinite loops
    
    // Events for integration with other systems
    public System.Action<PathfindingNode[]> OnAlgorithmStep;
    public System.Action OnAlgorithmFinished;
    public System.Action OnRouteTraceFinished;
    
    void Start()
    {
        if (timeline == null)
        {
            timeline = GetComponent<PathSegmentTimeline>();
            if (timeline == null)
            {
                // Add the component if it doesn't exist
                timeline = gameObject.AddComponent<PathSegmentTimeline>();
                Debug.Log("[AlgorithmStepExecutor] Added PathSegmentTimeline component");
            }
        }
        
        // Setup visualization system - prefer OnlineMapsPathVisualizer over legacy renderer
        if (pathVisualizer == null && renderer == null)
        {
            // Try to find OnlineMapsPathVisualizer first
            pathVisualizer = GetComponent<OnlineMapsPathVisualizer>();
            if (pathVisualizer == null)
            {
                // Fallback to PathSegmentRenderer
                renderer = GetComponent<PathSegmentRenderer>();
                if (renderer == null)
                {
                    // Create OnlineMapsPathVisualizer by default (new system)
                    pathVisualizer = gameObject.AddComponent<OnlineMapsPathVisualizer>();
                    Debug.Log("[AlgorithmStepExecutor] Added OnlineMapsPathVisualizer component (Drawing API)");
                }
            }
        }

        // Connect timeline to active visualizer
        if (pathVisualizer != null)
        {
            pathVisualizer.timeline = timeline;
            Debug.Log($"[AlgorithmStepExecutor] Connected OnlineMapsPathVisualizer to timeline: {timeline != null}");

            // Disable legacy renderer if both exist
            if (renderer != null)
            {
                renderer.enabled = false;
                Debug.Log("[AlgorithmStepExecutor] Disabled legacy PathSegmentRenderer in favor of OnlineMapsPathVisualizer");
            }
        }
        else if (renderer != null)
        {
            // CRITICAL FIX: Always connect renderer to our timeline instance
            renderer.timeline = timeline;
            Debug.Log($"[AlgorithmStepExecutor] Connected PathSegmentRenderer to timeline: {timeline != null}");
        }
            
        if (visualEffects == null)
            visualEffects = FindObjectOfType<VisualEffectsManager>();
    }
    
    /// <summary>
    /// Start algorithm execution - mirror of React's state.current.start()
    /// </summary>
    public void StartAlgorithm(PathfindingAlgorithm algorithm, PathfindingNode startNode, PathfindingNode endNode)
    {
        if (isExecuting)
        {
            Debug.LogWarning("[AlgorithmStepExecutor] Algorithm already executing - stopping current execution");
            StopAlgorithm();
        }
        
        // Initialize algorithm
        currentAlgorithm = algorithm;
        currentAlgorithm.Start(startNode, endNode);
        
        // Reset state
        if (timeline != null)
        {
            timeline.ClearTimeline();
        }
        isExecuting = true;
        algorithmFinished = false;
        animationFinished = false;
        totalStepsExecuted = 0;
        totalNodesExplored = 0;
        currentTraceNode = null;
        
        if (enableDebugLogs)
        {
            Debug.Log($"[AlgorithmStepExecutor] Started {algorithm.GetType().Name} from {startNode.geoCoordinate} to {endNode.geoCoordinate}");
        }
        
        // Start execution coroutine
        StartCoroutine(ExecuteAlgorithmSteps());
    }
    
    /// <summary>
    /// Stop algorithm execution
    /// </summary>
    public void StopAlgorithm()
    {
        isExecuting = false;
        StopAllCoroutines();
        
        if (enableDebugLogs)
        {
            Debug.Log($"[AlgorithmStepExecutor] Algorithm execution stopped after {totalStepsExecuted} steps");
        }
    }
    
    /// <summary>
    /// Main algorithm execution loop - mirrors React's animateStep() pattern
    /// </summary>
    IEnumerator ExecuteAlgorithmSteps()
    {
        while (isExecuting && !algorithmFinished)
        {
            // CRITICAL: Prevent infinite loops
            if (totalStepsExecuted >= maxStepsLimit)
            {
                Debug.LogError($"[AlgorithmStepExecutor] ⚠️ STOPPING: Reached maximum steps limit ({maxStepsLimit}) - possible infinite loop!");
                StopAlgorithm();
                break;
            }

            // Execute one algorithm step - mirror of state.current.nextStep()
            PathfindingNode[] updatedNodes = ExecuteAlgorithmStep();
            
            if (updatedNodes.Length == 0 || currentAlgorithm.IsFinished())
            {
                // Algorithm finished - start route tracing
                algorithmFinished = true;
                OnAlgorithmFinished?.Invoke();

                if (enableDebugLogs)
                {
                    Debug.Log($"[AlgorithmStepExecutor] 🎯 Algorithm finished after {totalStepsExecuted} steps, {totalNodesExplored} nodes explored");
                    Debug.Log($"[AlgorithmStepExecutor] Target reached: {currentAlgorithm.IsFinished()}, Updated nodes: {updatedNodes.Length}");
                }
                
                // Start route tracing phase
                StartCoroutine(TraceOptimalRoute());
                break;
            }
            
            // Wait for next step
            yield return new WaitForSeconds(1f / stepsPerSecond);
        }
    }
    
    /// <summary>
    /// Execute single algorithm step and update timeline - mirrors React's animateStep()
    /// </summary>
    PathfindingNode[] ExecuteAlgorithmStep()
    {
        if (currentAlgorithm == null || currentAlgorithm.IsFinished())
        {
            return new PathfindingNode[0];
        }
        
        // Get updated nodes from algorithm step
        List<PathfindingNode> updatedNodesList = currentAlgorithm.NextStep();
        PathfindingNode[] updatedNodes = updatedNodesList.ToArray();
        totalStepsExecuted++;
        totalNodesExplored += updatedNodes.Length;
        
        // Add path segments to timeline for each updated node
        foreach (PathfindingNode updatedNode in updatedNodes)
        {
            if (updatedNode.referer != null)
            {
                // Add exploration segment - mirrors your updateWaypoints(updatedNode, updatedNode.referer)
                if (timeline != null)
                {
                    // CRITICAL: Check for zero-length segments (September 13th issue)
                    if (totalStepsExecuted < 3) // Only check first few segments
                    {
                        Vector2 fromCoord = updatedNode.referer.geoCoordinate;
                        Vector2 toCoord = updatedNode.geoCoordinate;
                        float segmentLength = Vector2.Distance(fromCoord, toCoord);

                        if (segmentLength < 0.00001f) // Very small distance indicates potential precision loss
                        {
                            Debug.LogWarning($"[AlgorithmStepExecutor] ZERO-LENGTH SEGMENT: ({fromCoord.x:F8}, {fromCoord.y:F8}) → ({toCoord.x:F8}, {toCoord.y:F8}) - COORDINATE PRECISION ISSUE!");
                        }
                    }
                    timeline.AddPathSegment(updatedNode.referer, updatedNode, "path");

                    // CRITICAL DEBUG: Log segment addition for first few segments
                    if (enableDebugLogs && timeline.segments.Count <= 5)
                    {
                        Debug.Log($"[AlgorithmStepExecutor] Added segment #{timeline.segments.Count}: ({updatedNode.referer.geoCoordinate.x:F8}, {updatedNode.referer.geoCoordinate.y:F8}) → ({updatedNode.geoCoordinate.x:F8}, {updatedNode.geoCoordinate.y:F8})");
                        Debug.Log($"[AlgorithmStepExecutor] Timeline instance: {timeline.GetInstanceID()}, total segments: {timeline.segments.Count}, duration: {timeline.totalDuration:F1}ms");
                    }
                }
                
                // Create visual effects at node exploration
                if (visualEffects != null)
                {
                    visualEffects.ShowExploredNode(updatedNode.geoCoordinate);
                }
            }
        }
        
        // Broadcast step event
        OnAlgorithmStep?.Invoke(updatedNodes);
        
        if (enableDebugLogs && totalStepsExecuted % 50 == 0)
        {
            string timelineStats = timeline != null ? timeline.GetTimelineStats() : "No timeline";
            Debug.Log($"[AlgorithmStepExecutor] Step {totalStepsExecuted}: {updatedNodes.Length} nodes updated, timeline: {timelineStats}");

            // CRITICAL: Check if algorithm should be finished
            if (currentAlgorithm != null)
            {
                Debug.Log($"[AlgorithmStepExecutor] Algorithm finished status: {currentAlgorithm.IsFinished()}");
                if (currentAlgorithm.endNode != null)
                {
                    Debug.Log($"[AlgorithmStepExecutor] Looking for end node: ID={currentAlgorithm.endNode.id}");
                }
            }
        }
        
        return updatedNodes;
    }
    
    /// <summary>
    /// Trace optimal route backwards - mirrors React's route tracing logic
    /// </summary>
    IEnumerator TraceOptimalRoute()
    {
        if (currentAlgorithm == null || currentAlgorithm.endNode == null)
        {
            animationFinished = true;
            yield break;
        }
        
        // Start from end node and trace back to start
        currentTraceNode = currentAlgorithm.endNode;
        
        if (enableDebugLogs)
        {
            Debug.Log("[AlgorithmStepExecutor] Starting optimal route trace");
        }
        
        // Trace route backwards - mirrors React's traceNode logic  
        while (currentTraceNode != null && currentTraceNode.referer != null)
        {
            PathfindingNode parentNode = currentTraceNode.referer;
            
            // Add route segment with faster timing - mirrors React's route timeMultiplier
            if (timeline != null)
            {
                // CRITICAL: Check for zero-length route segments
                Vector2 fromCoord = parentNode.geoCoordinate;
                Vector2 toCoord = currentTraceNode.geoCoordinate;
                float segmentLength = Vector2.Distance(fromCoord, toCoord);

                if (segmentLength < 0.00001f) // Zero-length route segments indicate precision loss
                {
                    Debug.LogWarning($"[AlgorithmStepExecutor] ZERO-LENGTH ROUTE: ({fromCoord.x:F8}, {fromCoord.y:F8}) → ({toCoord.x:F8}, {toCoord.y:F8}) - COORDINATE PRECISION ISSUE!");
                }
                timeline.AddPathSegment(parentNode, currentTraceNode, "route", routeTraceSpeedMultiplier);
            }
            
            // Create route visual effects
            if (visualEffects != null)
            {
                visualEffects.CreatePathCompletionEffect(Color.green);
            }
            
            currentTraceNode = parentNode;
            
            // Small delay for visual effect
            yield return new WaitForSeconds(0.05f);
        }
        
        animationFinished = true;
        OnRouteTraceFinished?.Invoke();
        
        if (enableDebugLogs)
        {
            string timelineStats = timeline != null ? timeline.GetTimelineStats() : "No timeline";
            Debug.Log($"[AlgorithmStepExecutor] Route tracing complete. Final timeline: {timelineStats}");
        }
    }
    
    /// <summary>
    /// Execute algorithm instantly without visualization (for background processing)
    /// </summary>
    public PathfindingResult ExecuteAlgorithmInstant(PathfindingAlgorithm algorithm, PathfindingNode startNode, PathfindingNode endNode)
    {
        algorithm.Start(startNode, endNode);
        
        var result = new PathfindingResult();
        result.startNode = startNode;
        result.endNode = endNode;
        result.algorithm = algorithm.GetType().Name;
        result.executionSteps = 0;
        
        // Execute all steps instantly
        while (!algorithm.IsFinished())
        {
            List<PathfindingNode> updatedNodesList = algorithm.NextStep();
            PathfindingNode[] updatedNodes = updatedNodesList.ToArray();
            result.executionSteps++;
            result.nodesExplored += updatedNodes.Length;
            
            if (updatedNodes.Length == 0)
                break;
        }
        
        // Calculate route
        result.optimalRoute = GetOptimalRouteNodes(algorithm.endNode);
        result.routeDistance = CalculateRouteDistance(result.optimalRoute);
        result.success = result.optimalRoute.Count > 0;
        
        if (enableDebugLogs)
        {
            Debug.Log($"[AlgorithmStepExecutor] Instant execution complete: {result.executionSteps} steps, {result.nodesExplored} nodes, route length: {result.optimalRoute.Count}");
        }
        
        return result;
    }
    
    /// <summary>
    /// Get optimal route as list of nodes
    /// </summary>
    List<PathfindingNode> GetOptimalRouteNodes(PathfindingNode endNode)
    {
        List<PathfindingNode> route = new List<PathfindingNode>();
        PathfindingNode current = endNode;
        
        while (current != null)
        {
            route.Add(current);
            current = current.referer;
        }
        
        route.Reverse();
        return route;
    }
    
    /// <summary>
    /// Calculate total route distance
    /// </summary>
    float CalculateRouteDistance(List<PathfindingNode> route)
    {
        float totalDistance = 0f;
        for (int i = 1; i < route.Count; i++)
        {
            totalDistance += Vector2.Distance(route[i-1].geoCoordinate, route[i].geoCoordinate);
        }
        return totalDistance;
    }
    
    /// <summary>
    /// Test method to execute A* algorithm
    /// </summary>
    [ContextMenu("🧪 Test A* Algorithm Execution")]
    public void TestAStarExecution()
    {
        // This would need to be connected to your actual pathfinding system
        Debug.Log("[AlgorithmStepExecutor] Test execution would require PathfindingManager integration");
    }
}

/// <summary>
/// Result container for algorithm execution
/// </summary>
[System.Serializable]
public class PathfindingResult
{
    public PathfindingNode startNode;
    public PathfindingNode endNode;
    public string algorithm;
    public List<PathfindingNode> optimalRoute = new List<PathfindingNode>();
    public int executionSteps;
    public int nodesExplored;
    public float routeDistance;
    public bool success;
}