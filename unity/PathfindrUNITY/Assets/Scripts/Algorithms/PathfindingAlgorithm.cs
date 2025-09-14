using System.Collections.Generic;
using UnityEngine;

/// <summary>
/// Base class for pathfinding algorithms
/// Unity port of React PathfindingAlgorithm.js
/// </summary>
public abstract class PathfindingAlgorithm
{
    public enum AlgorithmType
    {
        None,
        AStar,
        Dijkstra, 
        Greedy,
        BidirectionalSearch
    }
    
    [Header("Algorithm State")]
    public PathfindingNode startNode;
    public PathfindingNode endNode;
    public bool finished = false;
    public bool pathFound = false;
    
    [Header("Debug")]
    public bool enableDebugLogs = false;
    
    // Animation and visualization
    public List<PathfindingNode> exploredNodes = new List<PathfindingNode>();
    public List<PathfindingEdge> exploredEdges = new List<PathfindingEdge>();
    
    // Performance tracking
    public int nodesExplored = 0;
    public float algorithmTime = 0f;
    
    #region Core Algorithm Interface
    
    /// <summary>
    /// Initialize algorithm with start and end nodes
    /// </summary>
    public virtual void Start(PathfindingNode startNode, PathfindingNode endNode)
    {
        this.startNode = startNode;
        this.endNode = endNode;
        this.finished = false;
        
        // Reset state
        exploredNodes.Clear();
        exploredEdges.Clear();
        nodesExplored = 0;
        algorithmTime = 0f;
        
        // Reset all nodes in the graph
        ResetGraphNodes();
        
        Debug.Log($"Started {GetType().Name} pathfinding from {startNode.id} to {endNode.id}");
    }
    
    /// <summary>
    /// Execute one step of the algorithm
    /// Returns nodes that were updated in this step for visualization
    /// </summary>
    public abstract List<PathfindingNode> NextStep();
    
    /// <summary>
    /// Get the complete path from start to end (if found)
    /// </summary>
    public virtual List<PathfindingNode> GetPath()
    {
        if (!finished || endNode == null || endNode.referer == null)
        {
            return new List<PathfindingNode>();
        }
        
        List<PathfindingNode> path = new List<PathfindingNode>();
        PathfindingNode current = endNode;
        
        // Trace back through referers
        while (current != null)
        {
            path.Add(current);
            current = current.referer;
        }
        
        // Reverse to get start-to-end order
        path.Reverse();
        return path;
    }
    
    /// <summary>
    /// Run algorithm to completion
    /// </summary>
    public virtual List<PathfindingNode> FindPath()
    {
        float startTime = Time.realtimeSinceStartup;
        
        while (!finished)
        {
            var updatedNodes = NextStep();
            
            // Safety check to prevent infinite loops
            if (nodesExplored > 10000)
            {
                Debug.LogWarning("Algorithm exceeded max nodes - terminating");
                break;
            }
        }
        
        algorithmTime = Time.realtimeSinceStartup - startTime;
        Debug.Log($"{GetType().Name} completed in {algorithmTime:F3}s, explored {nodesExplored} nodes");
        
        return GetPath();
    }
    
    #endregion
    
    #region Utility Methods
    
    /// <summary>
    /// Reset all nodes to initial state - now finds and resets the entire graph
    /// </summary>
    protected virtual void ResetGraphNodes()
    {
        // Find the graph that contains our start/end nodes
        var mapController = UnityEngine.Object.FindObjectOfType<MapController>();
        if (mapController != null && mapController.currentGraph != null)
        {
            mapController.currentGraph.ResetNodes();
            if (enableDebugLogs)
            {
                Debug.Log($"[PathfindingAlgorithm] Reset {mapController.currentGraph.nodeCount} nodes in graph");
            }
        }
        else
        {
            // Fallback: reset just start and end nodes
            if (startNode != null)
            {
                startNode.distanceFromStart = 0f;
                startNode.distanceToEnd = 0f;
                startNode.visited = false;
                startNode.referer = null;
            }
            
            if (endNode != null)
            {
                endNode.distanceFromStart = float.MaxValue;
                endNode.distanceToEnd = 0f;
                endNode.visited = false;
                endNode.referer = null;
            }
        }
    }
    
    /// <summary>
    /// Calculate heuristic distance between two nodes (for A* and Greedy)
    /// </summary>
    protected virtual float CalculateHeuristic(PathfindingNode from, PathfindingNode to)
    {
        // Euclidean distance between geographic coordinates
        return Vector2.Distance(from.geoCoordinate, to.geoCoordinate);
    }
    
    /// <summary>
    /// Calculate actual distance between adjacent nodes
    /// </summary>
    protected virtual float CalculateDistance(PathfindingNode from, PathfindingNode to)
    {
        // For real-world coordinates, we should use proper geographic distance
        // For now, using simple Euclidean distance
        return Vector2.Distance(from.geoCoordinate, to.geoCoordinate);
    }
    
    #endregion
    
    #region Factory Method
    
    /// <summary>
    /// Create algorithm instance by type
    /// </summary>
    public static PathfindingAlgorithm CreateAlgorithm(AlgorithmType algorithmType)
    {
        switch (algorithmType)
        {
            case AlgorithmType.AStar:
                return new AStarAlgorithm();
                
            case AlgorithmType.Dijkstra:
                return new DijkstraAlgorithm();
                
            case AlgorithmType.Greedy:
                return new GreedyAlgorithm();
                
            case AlgorithmType.BidirectionalSearch:
                return new BidirectionalSearchAlgorithm();
                
            default:
                Debug.LogError($"Unknown algorithm type: {algorithmType}");
                return new AStarAlgorithm(); // Default fallback
        }
    }
    
    #endregion
    
    #region Performance Utilities
    
    /// <summary>
    /// Get algorithm performance statistics
    /// </summary>
    public AlgorithmStats GetPerformanceStats()
    {
        var path = GetPath();
        
        return new AlgorithmStats
        {
            algorithmType = GetType().Name,
            nodesExplored = nodesExplored,
            pathLength = path.Count,
            executionTime = algorithmTime,
            pathDistance = CalculatePathDistance(path),
            finished = finished
        };
    }
    
    float CalculatePathDistance(List<PathfindingNode> path)
    {
        if (path.Count < 2) return 0f;
        
        float totalDistance = 0f;
        for (int i = 1; i < path.Count; i++)
        {
            totalDistance += CalculateDistance(path[i-1], path[i]);
        }
        return totalDistance;
    }
    
    #endregion
    
    #region Compatibility Methods
    
    /// <summary>
    /// Get algorithm type as property (compatibility method)
    /// </summary>
    public virtual AlgorithmType algorithmType
    {
        get
        {
            // Determine type based on class name
            var typeName = GetType().Name;
            switch (typeName)
            {
                case "AStarAlgorithm": return AlgorithmType.AStar;
                case "DijkstraAlgorithm": return AlgorithmType.Dijkstra;
                case "GreedyAlgorithm": return AlgorithmType.Greedy;
                case "BidirectionalSearchAlgorithm": return AlgorithmType.BidirectionalSearch;
                default: return AlgorithmType.None;
            }
        }
    }
    
    /// <summary>
    /// Check if algorithm is finished (compatibility property)
    /// </summary>
    public bool IsFinished()
    {
        return finished;
    }
    
    /// <summary>
    /// Reset algorithm state (compatibility method)
    /// </summary>
    public virtual void Reset()
    {
        finished = false;
        pathFound = false;
        exploredNodes.Clear();
        exploredEdges.Clear();
        nodesExplored = 0;
        algorithmTime = 0f;
        ResetGraphNodes();
    }
    
    /// <summary>
    /// Get current algorithm state (compatibility method)
    /// </summary>
    public virtual Dictionary<string, object> GetCurrentState()
    {
        return new Dictionary<string, object>
        {
            {"finished", finished},
            {"pathFound", pathFound},
            {"nodesExplored", nodesExplored},
            {"algorithmTime", algorithmTime},
            {"exploredNodesCount", exploredNodes.Count}
        };
    }
    
    #endregion
}

/// <summary>
/// Algorithm performance statistics
/// </summary>
[System.Serializable]
public class AlgorithmStats
{
    public string algorithmType;
    public int nodesExplored;
    public int pathLength;
    public float executionTime;
    public float pathDistance;
    public bool finished;
    
    public override string ToString()
    {
        return $"{algorithmType}: {nodesExplored} nodes, {pathLength} path length, {executionTime:F3}s";
    }
}