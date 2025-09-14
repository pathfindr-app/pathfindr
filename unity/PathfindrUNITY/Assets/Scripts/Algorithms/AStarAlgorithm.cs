using System.Collections.Generic;
using System.Linq;
using UnityEngine;

/// <summary>
/// A* pathfinding algorithm implementation
/// Unity port of React AStar.js
/// </summary>
public class AStarAlgorithm : PathfindingAlgorithm
{
    // Algorithm-specific data structures
    private List<PathfindingNode> openList = new List<PathfindingNode>();
    private List<PathfindingNode> closedList = new List<PathfindingNode>();
    
    #region Core Algorithm
    
    public override void Start(PathfindingNode startNode, PathfindingNode endNode)
    {
        base.Start(startNode, endNode);
        
        // Initialize A* specific state
        openList.Clear();
        closedList.Clear();
        
        // Add start node to open list
        openList.Add(this.startNode);
        
        // Set initial distances
        this.startNode.distanceFromStart = 0f;
        this.startNode.distanceToEnd = CalculateHeuristic(this.startNode, this.endNode);
        
        Debug.Log($"A* initialized: start={this.startNode.id}, end={this.endNode.id}");
    }
    
    public override List<PathfindingNode> NextStep()
    {
        // Check if we have any nodes to explore
        if (openList.Count == 0)
        {
            finished = true;
            Debug.Log("A* finished - no path found");
            return new List<PathfindingNode>();
        }
        
        List<PathfindingNode> updatedNodes = new List<PathfindingNode>();
        
        // Find node with lowest f-cost (total distance)
        PathfindingNode currentNode = GetLowestFCostNode();
        
        // Move current node from open to closed list
        openList.Remove(currentNode);
        closedList.Add(currentNode);
        currentNode.visited = true;
        updatedNodes.Add(currentNode);
        
        // Track exploration for visualization
        exploredNodes.Add(currentNode);
        nodesExplored++;
        
        // Check if we've reached the end
        if (currentNode.id == endNode.id)
        {
            finished = true;
            Debug.Log($"A* found path! Explored {nodesExplored} nodes");
            return updatedNodes;
        }
        
        // Explore neighbors
        foreach (var neighbor in currentNode.neighbors)
        {
            PathfindingNode neighborNode = neighbor.node;
            PathfindingEdge edge = neighbor.edge;
            
            // Skip if already in closed list
            if (closedList.Contains(neighborNode))
            {
                continue;
            }
            
            // Calculate tentative distance from start
            float tentativeDistanceFromStart = currentNode.distanceFromStart + edge.cost;
            
            bool isInOpenList = openList.Contains(neighborNode);
            bool shouldUpdateNeighbor = false;
            
            if (!isInOpenList)
            {
                // New node - add to open list
                openList.Add(neighborNode);
                shouldUpdateNeighbor = true;
            }
            else if (tentativeDistanceFromStart < neighborNode.distanceFromStart)
            {
                // Found better path to existing open node
                shouldUpdateNeighbor = true;
            }
            
            if (shouldUpdateNeighbor)
            {
                // Update neighbor's pathfinding data
                neighborNode.referer = currentNode;
                neighborNode.distanceFromStart = tentativeDistanceFromStart;
                neighborNode.distanceToEnd = CalculateHeuristic(neighborNode, endNode);
                
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
    
    #region A* Specific Utilities
    
    /// <summary>
    /// Find node in open list with lowest f-cost (g + h)
    /// </summary>
    private PathfindingNode GetLowestFCostNode()
    {
        if (openList.Count == 0) return null;
        
        PathfindingNode lowestNode = openList[0];
        float lowestFCost = lowestNode.totalDistance;
        
        for (int i = 1; i < openList.Count; i++)
        {
            float fCost = openList[i].totalDistance;
            if (fCost < lowestFCost)
            {
                lowestFCost = fCost;
                lowestNode = openList[i];
            }
        }
        
        return lowestNode;
    }
    
    /// <summary>
    /// Get current algorithm state for debugging
    /// </summary>
    public AStarDebugInfo GetDebugInfo()
    {
        return new AStarDebugInfo
        {
            openListCount = openList.Count,
            closedListCount = closedList.Count,
            nodesExplored = nodesExplored,
            finished = finished,
            currentBestFCost = openList.Count > 0 ? GetLowestFCostNode()?.totalDistance ?? 0f : 0f
        };
    }
    
    #endregion
    
    #region Heuristic Calculation
    
    /// <summary>
    /// A* heuristic function (Manhattan distance for grid, Euclidean for geographic)
    /// </summary>
    protected override float CalculateHeuristic(PathfindingNode from, PathfindingNode to)
    {
        // For geographic coordinates, use Euclidean distance
        // Could be enhanced with proper great-circle distance for more accuracy
        Vector2 fromPos = from.geoCoordinate;
        Vector2 toPos = to.geoCoordinate;
        
        return Vector2.Distance(fromPos, toPos);
    }
    
    #endregion
    
    #region Cleanup
    
    protected override void ResetGraphNodes()
    {
        base.ResetGraphNodes();
        
        // Clear A* specific lists
        openList.Clear();
        closedList.Clear();
        
        // Reset all nodes that might have been touched
        foreach (var node in exploredNodes)
        {
            if (node != null)
            {
                node.visited = false;
                node.referer = null;
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
/// Debug information for A* algorithm
/// </summary>
[System.Serializable]
public class AStarDebugInfo
{
    public int openListCount;
    public int closedListCount;
    public int nodesExplored;
    public bool finished;
    public float currentBestFCost;
    
    public override string ToString()
    {
        return $"A* Debug - Open: {openListCount}, Closed: {closedListCount}, " +
               $"Explored: {nodesExplored}, Best F-Cost: {currentBestFCost:F3}, Finished: {finished}";
    }
}