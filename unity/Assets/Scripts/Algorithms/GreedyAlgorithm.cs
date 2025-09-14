using System.Collections.Generic;
using System.Linq;
using UnityEngine;

/// <summary>
/// Greedy Best-First Search pathfinding algorithm implementation
/// Unity port of React Greedy.js
/// Fast but doesn't guarantee optimal path - uses only heuristic to guide search
/// </summary>
public class GreedyAlgorithm : PathfindingAlgorithm
{
    // Algorithm-specific data structures
    private List<PathfindingNode> openList = new List<PathfindingNode>();
    private HashSet<PathfindingNode> closedList = new HashSet<PathfindingNode>();
    
    #region Core Algorithm
    
    public override void Start(PathfindingNode startNode, PathfindingNode endNode)
    {
        base.Start(startNode, endNode);
        
        // Initialize Greedy-specific state
        openList.Clear();
        closedList.Clear();
        
        // Add start node to open list
        openList.Add(this.startNode);
        
        // Set initial heuristic distance (Greedy only cares about heuristic, not actual distance)
        this.startNode.distanceFromStart = 0f; // Not used in pure greedy, but kept for consistency
        this.startNode.distanceToEnd = CalculateHeuristic(this.startNode, this.endNode);
        
        Debug.Log($"Greedy Best-First initialized: start={this.startNode.id}, end={this.endNode.id}");
        Debug.Log("Greedy characteristic: Fast but may not find optimal path");
    }
    
    public override List<PathfindingNode> NextStep()
    {
        // Check if we have any nodes to explore
        if (openList.Count == 0)
        {
            finished = true;
            Debug.Log("Greedy finished - no path found");
            return new List<PathfindingNode>();
        }
        
        List<PathfindingNode> updatedNodes = new List<PathfindingNode>();
        
        // Find node with smallest heuristic distance to goal (greedy choice)
        PathfindingNode currentNode = GetNodeWithSmallestHeuristic();
        
        // Move current node from open to closed list
        openList.Remove(currentNode);
        closedList.Add(currentNode);
        currentNode.visited = true;
        updatedNodes.Add(currentNode);
        
        // Track exploration for visualization
        exploredNodes.Add(currentNode);
        nodesExplored++;
        
        // Check if we've reached the destination
        if (currentNode.id == endNode.id)
        {
            finished = true;
            Debug.Log($"Greedy found path! Explored {nodesExplored} nodes");
            return updatedNodes;
        }
        
        // Explore neighbors - Greedy only considers heuristic distance
        foreach (var neighbor in currentNode.neighbors)
        {
            PathfindingNode neighborNode = neighbor.node;
            PathfindingEdge edge = neighbor.edge;
            
            // Skip if already in closed list (already processed)
            if (closedList.Contains(neighborNode))
            {
                continue;
            }
            
            // Skip if already in open list (already discovered)
            if (openList.Contains(neighborNode))
            {
                continue;
            }
            
            // Add neighbor to open list
            openList.Add(neighborNode);
            
            // Set up pathfinding data
            neighborNode.referer = currentNode;
            neighborNode.parent = currentNode;
            
            // For Greedy, we primarily care about heuristic distance
            neighborNode.distanceToEnd = CalculateHeuristic(neighborNode, endNode);
            neighborNode.distanceFromStart = currentNode.distanceFromStart + edge.cost; // Track for path reconstruction
            
            // Mark edge as explored for visualization
            if (!edge.visited)
            {
                edge.visited = true;
                exploredEdges.Add(edge);
            }
            
            updatedNodes.Add(neighborNode);
        }
        
        return updatedNodes;
    }
    
    #endregion
    
    #region Greedy Specific Utilities
    
    /// <summary>
    /// Find node in open list with smallest heuristic distance to goal
    /// This is the key characteristic of Greedy - it's "greedy" for the goal
    /// </summary>
    private PathfindingNode GetNodeWithSmallestHeuristic()
    {
        if (openList.Count == 0) return null;
        
        PathfindingNode bestNode = openList[0];
        float bestHeuristic = bestNode.distanceToEnd;
        
        for (int i = 1; i < openList.Count; i++)
        {
            float heuristic = openList[i].distanceToEnd;
            if (heuristic < bestHeuristic)
            {
                bestHeuristic = heuristic;
                bestNode = openList[i];
            }
        }
        
        return bestNode;
    }
    
    /// <summary>
    /// Get current algorithm state for debugging
    /// </summary>
    public GreedyDebugInfo GetDebugInfo()
    {
        var currentBest = openList.Count > 0 ? GetNodeWithSmallestHeuristic() : null;
        
        return new GreedyDebugInfo
        {
            openListCount = openList.Count,
            closedListCount = closedList.Count,
            nodesExplored = nodesExplored,
            finished = finished,
            currentBestHeuristic = currentBest?.distanceToEnd ?? 0f,
            averageHeuristicInOpen = CalculateAverageHeuristicInOpen()
        };
    }
    
    float CalculateAverageHeuristicInOpen()
    {
        if (openList.Count == 0) return 0f;
        
        float total = 0f;
        foreach (var node in openList)
        {
            total += node.distanceToEnd;
        }
        return total / openList.Count;
    }
    
    #endregion
    
    #region Algorithm Characteristics
    
    /// <summary>
    /// Greedy Best-First is fast but doesn't guarantee optimal path
    /// It's "greedy" - always chooses the node that appears closest to the goal
    /// Can get trapped in local minima or take suboptimal paths
    /// </summary>
    public override List<PathfindingNode> FindPath()
    {
        float startTime = Time.realtimeSinceStartup;
        
        Debug.Log("Running Greedy Best-First - fast but may not find optimal path");
        
        while (!finished)
        {
            var updatedNodes = NextStep();
            
            // Safety check to prevent infinite loops
            if (nodesExplored > 10000)
            {
                Debug.LogWarning("Greedy exceeded max nodes - terminating");
                break;
            }
        }
        
        algorithmTime = Time.realtimeSinceStartup - startTime;
        Debug.Log($"Greedy completed in {algorithmTime:F3}s, explored {nodesExplored} nodes");
        Debug.Log($"Greedy characteristic: Very fast, follows heuristic directly toward goal");
        
        var path = GetPath();
        if (path.Count > 0)
        {
            Debug.Log($"Greedy found path of length {path.Count} - may not be optimal");
        }
        
        return path;
    }
    
    #endregion
    
    #region Heuristic Calculation
    
    /// <summary>
    /// Greedy relies heavily on a good heuristic function
    /// The quality of the heuristic directly affects path quality
    /// </summary>
    protected override float CalculateHeuristic(PathfindingNode from, PathfindingNode to)
    {
        // For geographic coordinates, use Euclidean distance
        // This is admissible (never overestimates) for straight-line distance
        Vector2 fromPos = from.geoCoordinate;
        Vector2 toPos = to.geoCoordinate;
        
        float distance = Vector2.Distance(fromPos, toPos);
        
        // Optional: Could enhance with Manhattan distance or other heuristics
        // depending on the road network characteristics
        
        return distance;
    }
    
    /// <summary>
    /// Alternative heuristic: Manhattan distance
    /// Sometimes works better for grid-like road networks
    /// </summary>
    float CalculateManhattanHeuristic(PathfindingNode from, PathfindingNode to)
    {
        Vector2 fromPos = from.geoCoordinate;
        Vector2 toPos = to.geoCoordinate;
        
        return Mathf.Abs(toPos.x - fromPos.x) + Mathf.Abs(toPos.y - fromPos.y);
    }
    
    #endregion
    
    #region Performance Analysis
    
    /// <summary>
    /// Get Greedy-specific performance characteristics
    /// </summary>
    public new AlgorithmStats GetPerformanceStats()
    {
        var baseStats = base.GetPerformanceStats();
        
        // Add Greedy-specific metrics
        var greedyStats = new GreedyStats
        {
            algorithmType = "Greedy Best-First",
            nodesExplored = nodesExplored,
            pathLength = GetPath().Count,
            executionTime = algorithmTime,
            pathDistance = CalculatePathDistance(GetPath()),
            finished = finished,
            
            // Greedy-specific
            averageHeuristicAccuracy = CalculateHeuristicAccuracy(),
            explorationFocusRatio = CalculateExplorationFocus(),
            speedVsOptimalityRatio = nodesExplored > 0 ? algorithmTime / nodesExplored : 0f
        };
        
        return greedyStats;
    }
    
    float CalculatePathDistance(List<PathfindingNode> path)
    {
        if (path.Count < 2) return 0f;
        
        float totalDistance = 0f;
        for (int i = 1; i < path.Count; i++)
        {
            totalDistance += Vector2.Distance(path[i-1].geoCoordinate, path[i].geoCoordinate);
        }
        return totalDistance;
    }
    
    float CalculateHeuristicAccuracy()
    {
        // Measure how well the heuristic predicted the actual path
        var path = GetPath();
        if (path.Count < 2) return 0f;
        
        float actualDistance = CalculatePathDistance(path);
        float heuristicDistance = CalculateHeuristic(startNode, endNode);
        
        return heuristicDistance > 0 ? actualDistance / heuristicDistance : 1f;
    }
    
    float CalculateExplorationFocus()
    {
        // Measure how focused the exploration was (lower is more focused)
        if (exploredNodes.Count == 0) return 1f;
        
        float totalDistanceFromGoal = 0f;
        foreach (var node in exploredNodes)
        {
            totalDistanceFromGoal += CalculateHeuristic(node, endNode);
        }
        
        float averageDistanceFromGoal = totalDistanceFromGoal / exploredNodes.Count;
        float startDistanceFromGoal = CalculateHeuristic(startNode, endNode);
        
        return startDistanceFromGoal > 0 ? averageDistanceFromGoal / startDistanceFromGoal : 1f;
    }
    
    #endregion
    
    #region Cleanup
    
    protected override void ResetGraphNodes()
    {
        base.ResetGraphNodes();
        
        // Clear Greedy-specific lists
        openList.Clear();
        closedList.Clear();
        
        // Reset all explored nodes
        foreach (var node in exploredNodes)
        {
            if (node != null)
            {
                node.visited = false;
                node.referer = null;
                node.parent = null;
                node.distanceFromStart = float.MaxValue;
                node.distanceToEnd = 0f;
            }
        }
        
        // Reset all edges
        foreach (var edge in exploredEdges)
        {
            if (edge != null)
            {
                edge.visited = false;
            }
        }
    }
    
    #endregion
}

/// <summary>
/// Debug information for Greedy Best-First algorithm
/// </summary>
[System.Serializable]
public class GreedyDebugInfo
{
    public int openListCount;
    public int closedListCount;
    public int nodesExplored;
    public bool finished;
    public float currentBestHeuristic;
    public float averageHeuristicInOpen;
    
    public override string ToString()
    {
        return $"Greedy Debug - Open: {openListCount}, Closed: {closedListCount}, " +
               $"Explored: {nodesExplored}, Best Heuristic: {currentBestHeuristic:F3}, " +
               $"Avg Open Heuristic: {averageHeuristicInOpen:F3}, Finished: {finished}";
    }
}

/// <summary>
/// Extended algorithm statistics for Greedy Best-First
/// </summary>
[System.Serializable]
public class GreedyStats : AlgorithmStats
{
    public float averageHeuristicAccuracy;  // How well heuristic predicted actual cost
    public float explorationFocusRatio;     // How focused the search was toward goal
    public float speedVsOptimalityRatio;    // Time per node explored
    
    public override string ToString()
    {
        return $"Greedy: {nodesExplored} explored, {pathLength} path length, " +
               $"{executionTime:F3}s, focus: {explorationFocusRatio:F2}, accuracy: {averageHeuristicAccuracy:F2}";
    }
}