using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using System.Threading.Tasks;
using System;

/// <summary>
/// Manages pathfinding algorithms and execution
/// Handles algorithm selection, execution, and performance tracking
/// </summary>
public class PathfindingManager : MonoBehaviour
{
    [Header("Algorithm Settings")]
    public PathfindingAlgorithm.AlgorithmType currentAlgorithm = PathfindingAlgorithm.AlgorithmType.AStar;
    public bool enableBackgroundProcessing = true;
    public int maxNodesPerFrame = 50;
    public float stepDelay = 0.1f;
    
    [Header("Performance")]
    public bool trackPerformance = true;
    public bool logAlgorithmStats = true;
    
    // Current algorithm instance
    private PathfindingAlgorithm activeAlgorithm;
    private Coroutine algorithmCoroutine;
    
    // Algorithm execution state
    public bool IsRunning { get; private set; } = false;
    public bool IsComplete { get; private set; } = false;
    public List<PathfindingNode> CurrentPath { get; private set; } = new List<PathfindingNode>();
    
    // Performance tracking
    private List<AlgorithmStats> performanceHistory = new List<AlgorithmStats>();
    
    // Events
    public event Action<PathfindingAlgorithm.AlgorithmType> OnAlgorithmChanged;
    public event Action<List<PathfindingNode>> OnPathFound;
    public event Action<List<PathfindingNode>> OnStepCompleted;
    public event Action<AlgorithmStats> OnAlgorithmCompleted;
    
    void Start()
    {
        InitializeManager();
    }
    
    #region Initialization
    
    void InitializeManager()
    {
        Debug.Log("PathfindingManager initialized");
    }
    
    #endregion
    
    #region Algorithm Management
    
    /// <summary>
    /// Set the active pathfinding algorithm
    /// </summary>
    public void SetAlgorithm(PathfindingAlgorithm.AlgorithmType algorithmType)
    {
        if (IsRunning)
        {
            Debug.LogWarning("Cannot change algorithm while pathfinding is running");
            return;
        }
        
        currentAlgorithm = algorithmType;
        
        // Create new algorithm instance
        activeAlgorithm = PathfindingAlgorithm.CreateAlgorithm(algorithmType);
        
        Debug.Log($"Pathfinding algorithm set to: {algorithmType}");
        OnAlgorithmChanged?.Invoke(algorithmType);
    }
    
    /// <summary>
    /// Get information about all available algorithms
    /// </summary>
    public AlgorithmInfo[] GetAvailableAlgorithms()
    {
        return new AlgorithmInfo[]
        {
            new AlgorithmInfo
            {
                type = PathfindingAlgorithm.AlgorithmType.AStar,
                name = "A* Algorithm",
                description = "Optimal pathfinding with heuristic guidance. Best balance of speed and optimality.",
                characteristics = "Fast, Optimal, Heuristic-guided",
                complexity = "O((V+E) log V)"
            },
            new AlgorithmInfo
            {
                type = PathfindingAlgorithm.AlgorithmType.Dijkstra,
                name = "Dijkstra's Algorithm", 
                description = "Guarantees shortest path. Explores uniformly in all directions.",
                characteristics = "Slower, Guaranteed Optimal, Uniform exploration",
                complexity = "O((V+E) log V)"
            },
            new AlgorithmInfo
            {
                type = PathfindingAlgorithm.AlgorithmType.Greedy,
                name = "Greedy Best-First",
                description = "Very fast but may not find optimal path. Rushes toward goal.",
                characteristics = "Very Fast, May be suboptimal, Goal-directed",
                complexity = "O(V log V)"
            },
            new AlgorithmInfo
            {
                type = PathfindingAlgorithm.AlgorithmType.BidirectionalSearch,
                name = "Bidirectional Search",
                description = "Searches from both start and end. Can be much faster for long paths.",
                characteristics = "Potentially very fast, Optimal*, Dual-direction",
                complexity = "O(b^(d/2))"
            }
        };
    }
    
    #endregion
    
    #region Pathfinding Execution
    
    /// <summary>
    /// Find path between two nodes asynchronously
    /// </summary>
    public async Task<List<PathfindingNode>> FindPathAsync(PathfindingNode startNode, PathfindingNode endNode)
    {
        if (IsRunning)
        {
            Debug.LogWarning("Pathfinding already running");
            return new List<PathfindingNode>();
        }
        
        if (startNode == null || endNode == null)
        {
            Debug.LogError("Start or end node is null");
            return new List<PathfindingNode>();
        }
        
        // Ensure we have an algorithm
        if (activeAlgorithm == null)
        {
            SetAlgorithm(currentAlgorithm);
        }
        
        IsRunning = true;
        IsComplete = false;
        CurrentPath.Clear();
        
        Debug.Log($"Starting {currentAlgorithm} pathfinding from {startNode.id} to {endNode.id}");
        
        try
        {
            // Run algorithm
            if (enableBackgroundProcessing)
            {
                CurrentPath = await FindPathBackgroundAsync(startNode, endNode);
            }
            else
            {
                CurrentPath = FindPathSynchronous(startNode, endNode);
            }
            
            // Track performance
            if (trackPerformance && activeAlgorithm != null)
            {
                var stats = activeAlgorithm.GetPerformanceStats();
                performanceHistory.Add(stats);
                
                if (logAlgorithmStats)
                {
                    Debug.Log($"Algorithm Performance: {stats}");
                }
                
                OnAlgorithmCompleted?.Invoke(stats);
            }
            
            OnPathFound?.Invoke(CurrentPath);
        }
        catch (Exception e)
        {
            Debug.LogError($"Pathfinding error: {e.Message}");
            CurrentPath = new List<PathfindingNode>();
        }
        finally
        {
            IsRunning = false;
            IsComplete = true;
        }
        
        return CurrentPath;
    }
    
    /// <summary>
    /// Find path with step-by-step visualization
    /// </summary>
    public void FindPathWithVisualization(PathfindingNode startNode, PathfindingNode endNode)
    {
        if (IsRunning)
        {
            Debug.LogWarning("Pathfinding already running");
            return;
        }
        
        if (algorithmCoroutine != null)
        {
            StopCoroutine(algorithmCoroutine);
        }
        
        algorithmCoroutine = StartCoroutine(FindPathStepByStep(startNode, endNode));
    }
    
    /// <summary>
    /// Stop current pathfinding operation
    /// </summary>
    public void StopPathfinding()
    {
        if (algorithmCoroutine != null)
        {
            StopCoroutine(algorithmCoroutine);
            algorithmCoroutine = null;
        }
        
        IsRunning = false;
        IsComplete = false;
    }
    
    #endregion
    
    #region Background Processing
    
    async Task<List<PathfindingNode>> FindPathBackgroundAsync(PathfindingNode startNode, PathfindingNode endNode)
    {
        return await Task.Run(() => 
        {
            activeAlgorithm.Start(startNode, endNode);
            return activeAlgorithm.FindPath();
        });
    }
    
    List<PathfindingNode> FindPathSynchronous(PathfindingNode startNode, PathfindingNode endNode)
    {
        activeAlgorithm.Start(startNode, endNode);
        return activeAlgorithm.FindPath();
    }
    
    #endregion
    
    #region Step-by-Step Execution
    
    IEnumerator FindPathStepByStep(PathfindingNode startNode, PathfindingNode endNode)
    {
        IsRunning = true;
        IsComplete = false;
        CurrentPath.Clear();
        
        // Ensure we have an algorithm
        if (activeAlgorithm == null)
        {
            SetAlgorithm(currentAlgorithm);
        }
        
        // Initialize algorithm
        activeAlgorithm.Start(startNode, endNode);
        
        Debug.Log($"Starting step-by-step {currentAlgorithm} visualization");
        
        // Execute step by step
        while (!activeAlgorithm.finished)
        {
            var updatedNodes = activeAlgorithm.NextStep();
            
            // Notify about step completion
            OnStepCompleted?.Invoke(updatedNodes);
            
            // Safety check
            if (activeAlgorithm.nodesExplored > 10000)
            {
                Debug.LogWarning("Algorithm exceeded max nodes - stopping visualization");
                break;
            }
            
            // Wait before next step
            yield return new WaitForSeconds(stepDelay);
        }
        
        // Get final path
        CurrentPath = activeAlgorithm.GetPath();
        
        // Performance tracking
        if (trackPerformance)
        {
            var stats = activeAlgorithm.GetPerformanceStats();
            performanceHistory.Add(stats);
            
            if (logAlgorithmStats)
            {
                Debug.Log($"Step-by-step Algorithm Performance: {stats}");
            }
            
            OnAlgorithmCompleted?.Invoke(stats);
        }
        
        OnPathFound?.Invoke(CurrentPath);
        
        IsRunning = false;
        IsComplete = true;
        
        Debug.Log($"Step-by-step pathfinding completed. Path length: {CurrentPath.Count}");
    }
    
    #endregion
    
    #region Performance Analysis
    
    /// <summary>
    /// Get performance statistics for the last run
    /// </summary>
    public AlgorithmStats GetLastPerformanceStats()
    {
        return performanceHistory.Count > 0 ? performanceHistory[performanceHistory.Count - 1] : null;
    }
    
    /// <summary>
    /// Get performance comparison between algorithms
    /// </summary>
    public PerformanceComparison GetPerformanceComparison()
    {
        if (performanceHistory.Count == 0) return null;
        
        var comparison = new PerformanceComparison();
        
        foreach (var stats in performanceHistory)
        {
            switch (stats.algorithmType)
            {
                case "AStar":
                case "A*":
                    comparison.aStarStats = stats;
                    break;
                case "Dijkstra":
                    comparison.dijkstraStats = stats;
                    break;
                case "Greedy":
                case "Greedy Best-First":
                    comparison.greedyStats = stats;
                    break;
                case "Bidirectional":
                case "Bidirectional Search":
                    comparison.bidirectionalStats = stats;
                    break;
            }
        }
        
        return comparison;
    }
    
    /// <summary>
    /// Clear performance history
    /// </summary>
    public void ClearPerformanceHistory()
    {
        performanceHistory.Clear();
    }
    
    #endregion
    
    #region Settings
    
    /// <summary>
    /// Update algorithm settings
    /// </summary>
    public void UpdateSettings(PathfindingSettings settings)
    {
        currentAlgorithm = settings.algorithmType;
        enableBackgroundProcessing = settings.enableBackgroundProcessing;
        maxNodesPerFrame = settings.maxNodesPerFrame;
        stepDelay = settings.stepDelay;
        trackPerformance = settings.trackPerformance;
        logAlgorithmStats = settings.logAlgorithmStats;
        
        // Update active algorithm if needed
        if (!IsRunning)
        {
            SetAlgorithm(currentAlgorithm);
        }
    }
    
    /// <summary>
    /// Get current settings
    /// </summary>
    public PathfindingSettings GetCurrentSettings()
    {
        return new PathfindingSettings
        {
            algorithmType = currentAlgorithm,
            enableBackgroundProcessing = enableBackgroundProcessing,
            maxNodesPerFrame = maxNodesPerFrame,
            stepDelay = stepDelay,
            trackPerformance = trackPerformance,
            logAlgorithmStats = logAlgorithmStats
        };
    }
    
    #endregion
    
    #region Cleanup
    
    void OnDestroy()
    {
        // Stop any running pathfinding
        StopPathfinding();
        
        // Clear references
        activeAlgorithm = null;
        CurrentPath.Clear();
        performanceHistory.Clear();
    }
    
    #endregion
}

#region Supporting Data Structures

/// <summary>
/// Information about a pathfinding algorithm
/// </summary>
[System.Serializable]
public class AlgorithmInfo
{
    public PathfindingAlgorithm.AlgorithmType type;
    public string name;
    public string description;
    public string characteristics;
    public string complexity;
}

/// <summary>
/// Performance comparison between algorithms
/// </summary>
[System.Serializable]
public class PerformanceComparison
{
    public AlgorithmStats aStarStats;
    public AlgorithmStats dijkstraStats;
    public AlgorithmStats greedyStats;
    public AlgorithmStats bidirectionalStats;
    
    public AlgorithmStats GetFastest()
    {
        var algorithms = new[] { aStarStats, dijkstraStats, greedyStats, bidirectionalStats };
        AlgorithmStats fastest = null;
        float fastestTime = float.MaxValue;
        
        foreach (var algo in algorithms)
        {
            if (algo != null && algo.executionTime < fastestTime)
            {
                fastestTime = algo.executionTime;
                fastest = algo;
            }
        }
        
        return fastest;
    }
    
    public AlgorithmStats GetMostEfficient()
    {
        var algorithms = new[] { aStarStats, dijkstraStats, greedyStats, bidirectionalStats };
        AlgorithmStats mostEfficient = null;
        int fewestNodes = int.MaxValue;
        
        foreach (var algo in algorithms)
        {
            if (algo != null && algo.nodesExplored < fewestNodes)
            {
                fewestNodes = algo.nodesExplored;
                mostEfficient = algo;
            }
        }
        
        return mostEfficient;
    }
}

/// <summary>
/// Pathfinding manager settings
/// </summary>
[System.Serializable]
public class PathfindingSettings
{
    public PathfindingAlgorithm.AlgorithmType algorithmType = PathfindingAlgorithm.AlgorithmType.AStar;
    public bool enableBackgroundProcessing = true;
    public int maxNodesPerFrame = 50;
    public float stepDelay = 0.1f;
    public bool trackPerformance = true;
    public bool logAlgorithmStats = true;
}

#endregion