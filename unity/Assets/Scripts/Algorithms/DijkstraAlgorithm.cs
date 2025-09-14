using System.Collections.Generic;
using System.Linq;
using UnityEngine;

/// <summary>
/// Dijkstra's pathfinding algorithm implementation
/// Unity port of React Dijkstra.js
/// Guarantees shortest path, explores uniformly in all directions
/// </summary>
public class DijkstraAlgorithm : PathfindingAlgorithm
{
    // Algorithm-specific data structures
    private List<PathfindingNode> unvisitedNodes = new List<PathfindingNode>();
    private HashSet<PathfindingNode> visitedNodes = new HashSet<PathfindingNode>();
    
    #region Core Algorithm
    
    public override void Start(PathfindingNode startNode, PathfindingNode endNode)
    {
        base.Start(startNode, endNode);
        
        // Initialize Dijkstra-specific state
        unvisitedNodes.Clear();
        visitedNodes.Clear();
        
        // Add start node to unvisited list
        unvisitedNodes.Add(this.startNode);
        
        // Set initial distances - start node has distance 0, all others infinite
        this.startNode.distanceFromStart = 0f;
        
        Debug.Log($"Dijkstra initialized: start={this.startNode.id}, end={this.endNode.id}");
    }
    
    public override List<PathfindingNode> NextStep()
    {
        // Check if we have any unvisited nodes
        if (unvisitedNodes.Count == 0)
        {
            finished = true;
            Debug.Log("Dijkstra finished - no unvisited nodes remain");
            return new List<PathfindingNode>();
        }
        
        List<PathfindingNode> updatedNodes = new List<PathfindingNode>();
        
        // Find unvisited node with smallest distance
        PathfindingNode currentNode = GetNodeWithSmallestDistance();
        
        // If the smallest distance is infinity, then remaining nodes are unreachable
        if (currentNode.distanceFromStart == float.MaxValue)
        {
            finished = true;
            Debug.Log("Dijkstra finished - remaining nodes unreachable");
            return updatedNodes;
        }
        
        // Remove current node from unvisited and add to visited
        unvisitedNodes.Remove(currentNode);
        visitedNodes.Add(currentNode);
        currentNode.visited = true;
        updatedNodes.Add(currentNode);
        
        // Track exploration for visualization
        exploredNodes.Add(currentNode);
        nodesExplored++;
        
        // Check if we've reached the destination
        if (currentNode.id == endNode.id)
        {
            finished = true;
            Debug.Log($"Dijkstra found path! Explored {nodesExplored} nodes");
            return updatedNodes;
        }
        
        // Update distances to all neighbors
        foreach (var neighbor in currentNode.neighbors)
        {
            PathfindingNode neighborNode = neighbor.node;
            PathfindingEdge edge = neighbor.edge;
            
            // Skip if already visited
            if (visitedNodes.Contains(neighborNode))
            {
                continue;
            }
            
            // Calculate tentative distance through current node
            float tentativeDistance = currentNode.distanceFromStart + edge.cost;
            
            // If this is a better path, update the neighbor
            if (tentativeDistance < neighborNode.distanceFromStart)
            {
                neighborNode.distanceFromStart = tentativeDistance;
                neighborNode.referer = currentNode;
                neighborNode.parent = currentNode;
                
                // Add to unvisited list if not already there
                if (!unvisitedNodes.Contains(neighborNode))
                {
                    unvisitedNodes.Add(neighborNode);
                }
                
                // Mark edge as explored for visualization
                if (!edge.visited)
                {
                    edge.visited = true;
                    exploredEdges.Add(edge);
                }
                
                updatedNodes.Add(neighborNode);
            }
        }
        
        return updatedNodes;
    }
    
    #endregion
    
    #region Dijkstra Specific Utilities
    
    /// <summary>
    /// Find unvisited node with smallest distance from start
    /// This is the key difference from A* - no heuristic, just actual distance
    /// </summary>
    private PathfindingNode GetNodeWithSmallestDistance()
    {
        if (unvisitedNodes.Count == 0) return null;
        
        PathfindingNode smallestNode = unvisitedNodes[0];
        float smallestDistance = smallestNode.distanceFromStart;
        
        for (int i = 1; i < unvisitedNodes.Count; i++)
        {
            float distance = unvisitedNodes[i].distanceFromStart;
            if (distance < smallestDistance)
            {
                smallestDistance = distance;
                smallestNode = unvisitedNodes[i];
            }
        }
        
        return smallestNode;
    }
    
    /// <summary>
    /// Get current algorithm state for debugging
    /// </summary>
    public DijkstraDebugInfo GetDebugInfo()
    {
        return new DijkstraDebugInfo
        {
            unvisitedCount = unvisitedNodes.Count,
            visitedCount = visitedNodes.Count,
            nodesExplored = nodesExplored,
            finished = finished,
            currentShortestDistance = unvisitedNodes.Count > 0 ? GetNodeWithSmallestDistance()?.distanceFromStart ?? 0f : 0f
        };
    }
    
    #endregion
    
    #region Algorithm Characteristics
    
    /// <summary>
    /// Dijkstra explores uniformly in all directions from start
    /// Unlike A*, it doesn't use a heuristic to guide the search toward the goal
    /// This guarantees the shortest path but may explore more nodes
    /// </summary>
    public override List<PathfindingNode> FindPath()
    {
        float startTime = Time.realtimeSinceStartup;
        
        Debug.Log("Running Dijkstra's algorithm - guarantees shortest path");
        
        while (!finished)
        {
            var updatedNodes = NextStep();
            
            // Safety check to prevent infinite loops
            if (nodesExplored > 10000)
            {
                Debug.LogWarning("Dijkstra exceeded max nodes - terminating");
                break;
            }
            
            // Early termination if we've found the target
            // (Though Dijkstra typically continues until all reachable nodes are processed)
            if (finished && endNode.visited)
            {
                break;
            }
        }
        
        algorithmTime = Time.realtimeSinceStartup - startTime;
        Debug.Log($"Dijkstra completed in {algorithmTime:F3}s, explored {nodesExplored} nodes");
        Debug.Log($"Dijkstra characteristic: Explores uniformly, guarantees optimal path");
        
        return GetPath();
    }
    
    #endregion
    
    #region Distance Calculations
    
    /// <summary>
    /// Dijkstra uses only actual distances, no heuristic
    /// </summary>
    protected override float CalculateHeuristic(PathfindingNode from, PathfindingNode to)
    {
        // Dijkstra doesn't use heuristic - return 0
        return 0f;
    }
    
    /// <summary>
    /// Calculate actual travel cost between adjacent nodes
    /// </summary>
    protected override float CalculateDistance(PathfindingNode from, PathfindingNode to)
    {
        // Use geographic distance for real-world pathfinding
        return Vector2.Distance(from.geoCoordinate, to.geoCoordinate);
    }
    
    #endregion
    
    #region Performance Analysis
    
    /// <summary>
    /// Get Dijkstra-specific performance characteristics
    /// </summary>
    public new AlgorithmStats GetPerformanceStats()
    {
        var baseStats = base.GetPerformanceStats();
        
        // Add Dijkstra-specific metrics
        var dijkstraStats = new DijkstraStats
        {
            algorithmType = "Dijkstra",
            nodesExplored = nodesExplored,
            pathLength = GetPath().Count,
            executionTime = algorithmTime,
            pathDistance = CalculatePathDistance(GetPath()),
            finished = finished,
            
            // Dijkstra-specific
            totalUnvisitedNodes = unvisitedNodes.Count,
            totalVisitedNodes = visitedNodes.Count,
            explorationEfficiency = endNode.visited ? (float)GetPath().Count / nodesExplored : 0f
        };
        
        return dijkstraStats;
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
    
    #region Cleanup
    
    protected override void ResetGraphNodes()
    {
        base.ResetGraphNodes();
        
        // Clear Dijkstra-specific lists
        unvisitedNodes.Clear();
        visitedNodes.Clear();
        
        // Reset all explored nodes
        foreach (var node in exploredNodes)
        {
            if (node != null)
            {
                node.visited = false;
                node.referer = null;
                node.parent = null;
                node.distanceFromStart = float.MaxValue;
                node.distanceToEnd = 0f; // Dijkstra doesn't use heuristic
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
/// Debug information for Dijkstra's algorithm
/// </summary>
[System.Serializable]
public class DijkstraDebugInfo
{
    public int unvisitedCount;
    public int visitedCount;
    public int nodesExplored;
    public bool finished;
    public float currentShortestDistance;
    
    public override string ToString()
    {
        return $"Dijkstra Debug - Unvisited: {unvisitedCount}, Visited: {visitedCount}, " +
               $"Explored: {nodesExplored}, Current Distance: {currentShortestDistance:F3}, Finished: {finished}";
    }
}

/// <summary>
/// Extended algorithm statistics for Dijkstra
/// </summary>
[System.Serializable]
public class DijkstraStats : AlgorithmStats
{
    public int totalUnvisitedNodes;
    public int totalVisitedNodes;
    public float explorationEfficiency; // path length / nodes explored
    
    public override string ToString()
    {
        return $"Dijkstra: {nodesExplored} explored, {pathLength} path length, " +
               $"{executionTime:F3}s, efficiency: {explorationEfficiency:F2}";
    }
}