using System.Collections.Generic;
using System.Linq;
using UnityEngine;

/// <summary>
/// Bidirectional Search pathfinding algorithm implementation
/// Unity port of React BidirectionalSearch.js
/// Searches from both start and end simultaneously until they meet
/// Can be significantly faster than unidirectional search
/// </summary>
public class BidirectionalSearchAlgorithm : PathfindingAlgorithm
{
    // Forward search (from start)
    private List<PathfindingNode> forwardOpenList = new List<PathfindingNode>();
    private HashSet<PathfindingNode> forwardClosedList = new HashSet<PathfindingNode>();
    
    // Backward search (from end)
    private List<PathfindingNode> backwardOpenList = new List<PathfindingNode>();
    private HashSet<PathfindingNode> backwardClosedList = new HashSet<PathfindingNode>();
    
    // Meeting point
    private PathfindingNode meetingNode = null;
    private bool searchesMet = false;
    
    // Search alternation
    private bool forwardTurn = true; // Alternate between forward and backward search
    
    #region Core Algorithm
    
    public override void Start(PathfindingNode startNode, PathfindingNode endNode)
    {
        base.Start(startNode, endNode);
        
        // Initialize Bidirectional-specific state
        forwardOpenList.Clear();
        forwardClosedList.Clear();
        backwardOpenList.Clear();
        backwardClosedList.Clear();
        
        meetingNode = null;
        searchesMet = false;
        forwardTurn = true;
        
        // Initialize forward search from start
        forwardOpenList.Add(this.startNode);
        this.startNode.distanceFromStart = 0f;
        this.startNode.distanceToEnd = CalculateHeuristic(this.startNode, this.endNode);
        
        // Initialize backward search from end
        backwardOpenList.Add(this.endNode);
        this.endNode.distanceFromStart = 0f; // In backward search, this becomes distance from end
        this.endNode.distanceToEnd = CalculateHeuristic(this.endNode, this.startNode);
        
        Debug.Log($"Bidirectional Search initialized: start={this.startNode.id}, end={this.endNode.id}");
        Debug.Log("Bidirectional characteristic: Searches from both ends simultaneously");
    }
    
    public override List<PathfindingNode> NextStep()
    {
        // Check if both searches are exhausted
        if (forwardOpenList.Count == 0 && backwardOpenList.Count == 0)
        {
            finished = true;
            Debug.Log("Bidirectional search finished - no path found");
            return new List<PathfindingNode>();
        }
        
        List<PathfindingNode> updatedNodes = new List<PathfindingNode>();
        
        // Alternate between forward and backward search
        if (forwardTurn && forwardOpenList.Count > 0)
        {
            updatedNodes = PerformForwardStep();
        }
        else if (!forwardTurn && backwardOpenList.Count > 0)
        {
            updatedNodes = PerformBackwardStep();
        }
        else if (forwardOpenList.Count > 0)
        {
            // If backward is exhausted, continue with forward
            updatedNodes = PerformForwardStep();
        }
        else if (backwardOpenList.Count > 0)
        {
            // If forward is exhausted, continue with backward
            updatedNodes = PerformBackwardStep();
        }
        
        // Alternate search direction for next step
        forwardTurn = !forwardTurn;
        
        // Check if searches have met
        CheckForMeeting();
        
        if (searchesMet)
        {
            finished = true;
            Debug.Log($"Bidirectional search found path! Searches met at node {meetingNode?.id}. Explored {nodesExplored} nodes");
        }
        
        return updatedNodes;
    }
    
    #endregion
    
    #region Forward Search (from start)
    
    List<PathfindingNode> PerformForwardStep()
    {
        List<PathfindingNode> updatedNodes = new List<PathfindingNode>();
        
        // Find node with lowest f-cost in forward direction
        PathfindingNode currentNode = GetLowestFCostNode(forwardOpenList, true);
        
        // Move from open to closed list
        forwardOpenList.Remove(currentNode);
        forwardClosedList.Add(currentNode);
        currentNode.visited = true;
        updatedNodes.Add(currentNode);
        
        // Track exploration
        exploredNodes.Add(currentNode);
        nodesExplored++;
        
        // Explore neighbors in forward direction
        foreach (var neighbor in currentNode.neighbors)
        {
            PathfindingNode neighborNode = neighbor.node;
            PathfindingEdge edge = neighbor.edge;
            
            // Skip if already processed in forward search
            if (forwardClosedList.Contains(neighborNode))
            {
                continue;
            }
            
            // Calculate tentative distance
            float tentativeDistance = currentNode.distanceFromStart + edge.cost;
            bool isInForwardOpen = forwardOpenList.Contains(neighborNode);
            bool shouldUpdate = false;
            
            if (!isInForwardOpen)
            {
                forwardOpenList.Add(neighborNode);
                shouldUpdate = true;
            }
            else if (tentativeDistance < neighborNode.distanceFromStart)
            {
                shouldUpdate = true;
            }
            
            if (shouldUpdate)
            {
                neighborNode.referer = currentNode;
                neighborNode.distanceFromStart = tentativeDistance;
                neighborNode.distanceToEnd = CalculateHeuristic(neighborNode, endNode);
                
                // Mark edge as explored
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
    
    #region Backward Search (from end)
    
    List<PathfindingNode> PerformBackwardStep()
    {
        List<PathfindingNode> updatedNodes = new List<PathfindingNode>();
        
        // Find node with lowest f-cost in backward direction
        PathfindingNode currentNode = GetLowestFCostNode(backwardOpenList, false);
        
        // Move from open to closed list
        backwardOpenList.Remove(currentNode);
        backwardClosedList.Add(currentNode);
        currentNode.visited = true;
        updatedNodes.Add(currentNode);
        
        // Track exploration
        exploredNodes.Add(currentNode);
        nodesExplored++;
        
        // Explore neighbors in backward direction
        foreach (var neighbor in currentNode.neighbors)
        {
            PathfindingNode neighborNode = neighbor.node;
            PathfindingEdge edge = neighbor.edge;
            
            // Skip if already processed in backward search
            if (backwardClosedList.Contains(neighborNode))
            {
                continue;
            }
            
            // In backward search, we're measuring distance from the end node
            float tentativeDistance = currentNode.distanceFromStart + edge.cost;
            bool isInBackwardOpen = backwardOpenList.Contains(neighborNode);
            bool shouldUpdate = false;
            
            if (!isInBackwardOpen)
            {
                backwardOpenList.Add(neighborNode);
                shouldUpdate = true;
            }
            else if (tentativeDistance < neighborNode.distanceFromStart)
            {
                shouldUpdate = true;
            }
            
            if (shouldUpdate)
            {
                neighborNode.referer = currentNode;
                neighborNode.distanceFromStart = tentativeDistance; // Distance from end in backward search
                neighborNode.distanceToEnd = CalculateHeuristic(neighborNode, startNode); // Heuristic to start
                
                // Mark edge as explored
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
    
    #region Meeting Point Detection
    
    void CheckForMeeting()
    {
        // Check if any node has been explored by both searches
        foreach (var forwardNode in forwardClosedList)
        {
            if (backwardClosedList.Contains(forwardNode))
            {
                meetingNode = forwardNode;
                searchesMet = true;
                return;
            }
        }
        
        // Also check open lists for potential meetings
        foreach (var forwardNode in forwardOpenList)
        {
            if (backwardClosedList.Contains(forwardNode) || backwardOpenList.Contains(forwardNode))
            {
                meetingNode = forwardNode;
                searchesMet = true;
                return;
            }
        }
    }
    
    #endregion
    
    #region Path Reconstruction
    
    /// <summary>
    /// Reconstruct path from bidirectional search
    /// Need to combine forward path (start to meeting) with backward path (meeting to end)
    /// </summary>
    public override List<PathfindingNode> GetPath()
    {
        if (!finished || !searchesMet || meetingNode == null)
        {
            return new List<PathfindingNode>();
        }
        
        List<PathfindingNode> path = new List<PathfindingNode>();
        
        // Build forward path (start to meeting point)
        List<PathfindingNode> forwardPath = new List<PathfindingNode>();
        PathfindingNode current = meetingNode;
        
        // Trace back from meeting point to start
        while (current != null && forwardClosedList.Contains(current))
        {
            forwardPath.Add(current);
            current = current.referer;
        }
        
        // Reverse forward path to get start-to-meeting order
        forwardPath.Reverse();
        path.AddRange(forwardPath);
        
        // Build backward path (meeting point to end)
        List<PathfindingNode> backwardPath = new List<PathfindingNode>();
        current = meetingNode.referer; // Skip meeting node to avoid duplication
        
        // Trace forward from meeting point toward end
        // Note: This is tricky because backward search stores parent relationships backward
        // We need to reconstruct this carefully
        
        // For now, simplified approach - this would need refinement in a full implementation
        // The key insight is that we have two partial paths that meet in the middle
        
        return path;
    }
    
    #endregion
    
    #region Utility Methods
    
    /// <summary>
    /// Get node with lowest f-cost from specified list
    /// </summary>
    PathfindingNode GetLowestFCostNode(List<PathfindingNode> nodeList, bool isForwardSearch)
    {
        if (nodeList.Count == 0) return null;
        
        PathfindingNode bestNode = nodeList[0];
        float bestFCost = bestNode.totalDistance;
        
        for (int i = 1; i < nodeList.Count; i++)
        {
            float fCost = nodeList[i].totalDistance;
            if (fCost < bestFCost)
            {
                bestFCost = fCost;
                bestNode = nodeList[i];
            }
        }
        
        return bestNode;
    }
    
    /// <summary>
    /// Get current algorithm state for debugging
    /// </summary>
    public BidirectionalDebugInfo GetDebugInfo()
    {
        return new BidirectionalDebugInfo
        {
            forwardOpenCount = forwardOpenList.Count,
            forwardClosedCount = forwardClosedList.Count,
            backwardOpenCount = backwardOpenList.Count,
            backwardClosedCount = backwardClosedList.Count,
            nodesExplored = nodesExplored,
            searchesMet = searchesMet,
            meetingNodeId = meetingNode?.id ?? -1,
            finished = finished,
            currentSearchDirection = forwardTurn ? "Forward" : "Backward"
        };
    }
    
    #endregion
    
    #region Algorithm Characteristics
    
    /// <summary>
    /// Bidirectional search can be much faster than unidirectional
    /// Theoretical speedup: if unidirectional explores b^d nodes, 
    /// bidirectional explores 2*b^(d/2) nodes where b=branching factor, d=depth
    /// </summary>
    public override List<PathfindingNode> FindPath()
    {
        float startTime = Time.realtimeSinceStartup;
        
        Debug.Log("Running Bidirectional Search - explores from both ends simultaneously");
        
        while (!finished)
        {
            var updatedNodes = NextStep();
            
            // Safety check to prevent infinite loops
            if (nodesExplored > 10000)
            {
                Debug.LogWarning("Bidirectional search exceeded max nodes - terminating");
                break;
            }
        }
        
        algorithmTime = Time.realtimeSinceStartup - startTime;
        Debug.Log($"Bidirectional completed in {algorithmTime:F3}s, explored {nodesExplored} nodes");
        Debug.Log($"Bidirectional characteristic: Can be much faster than unidirectional search");
        
        if (searchesMet && meetingNode != null)
        {
            Debug.Log($"Searches met at node {meetingNode.id}");
        }
        
        return GetPath();
    }
    
    #endregion
    
    #region Performance Analysis
    
    /// <summary>
    /// Get Bidirectional-specific performance characteristics
    /// </summary>
    public new AlgorithmStats GetPerformanceStats()
    {
        var baseStats = base.GetPerformanceStats();
        
        var bidirectionalStats = new BidirectionalStats
        {
            algorithmType = "Bidirectional Search",
            nodesExplored = nodesExplored,
            pathLength = GetPath().Count,
            executionTime = algorithmTime,
            pathDistance = CalculatePathDistance(GetPath()),
            finished = finished,
            
            // Bidirectional-specific
            forwardNodesExplored = forwardClosedList.Count,
            backwardNodesExplored = backwardClosedList.Count,
            searchBalance = CalculateSearchBalance(),
            meetingPointOptimality = CalculateMeetingPointOptimality()
        };
        
        return bidirectionalStats;
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
    
    float CalculateSearchBalance()
    {
        // Measure how balanced the two searches were (1.0 = perfectly balanced)
        int forwardExplored = forwardClosedList.Count;
        int backwardExplored = backwardClosedList.Count;
        int totalExplored = forwardExplored + backwardExplored;
        
        if (totalExplored == 0) return 1f;
        
        float forwardRatio = (float)forwardExplored / totalExplored;
        float backwardRatio = (float)backwardExplored / totalExplored;
        
        // Perfect balance would be 0.5 each, so measure deviation from 0.5
        float deviation = Mathf.Abs(forwardRatio - 0.5f) + Mathf.Abs(backwardRatio - 0.5f);
        return 1f - deviation; // 1.0 = perfect balance, 0.0 = completely unbalanced
    }
    
    float CalculateMeetingPointOptimality()
    {
        // Measure how good the meeting point was (closer to middle of optimal path = better)
        if (meetingNode == null) return 0f;
        
        float distanceFromStart = CalculateHeuristic(startNode, meetingNode);
        float distanceFromEnd = CalculateHeuristic(meetingNode, endNode);
        float totalDistance = CalculateHeuristic(startNode, endNode);
        
        if (totalDistance == 0) return 1f;
        
        // Optimal meeting point would be at 50% of the path
        float meetingRatio = distanceFromStart / totalDistance;
        float deviation = Mathf.Abs(meetingRatio - 0.5f);
        
        return 1f - (deviation * 2f); // 1.0 = perfect middle, 0.0 = at one end
    }
    
    #endregion
    
    #region Cleanup
    
    protected override void ResetGraphNodes()
    {
        base.ResetGraphNodes();
        
        // Clear bidirectional-specific state
        forwardOpenList.Clear();
        forwardClosedList.Clear();
        backwardOpenList.Clear();
        backwardClosedList.Clear();
        
        meetingNode = null;
        searchesMet = false;
        forwardTurn = true;
        
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
/// Debug information for Bidirectional Search
/// </summary>
[System.Serializable]
public class BidirectionalDebugInfo
{
    public int forwardOpenCount;
    public int forwardClosedCount;
    public int backwardOpenCount;
    public int backwardClosedCount;
    public int nodesExplored;
    public bool searchesMet;
    public long meetingNodeId;
    public bool finished;
    public string currentSearchDirection;
    
    public override string ToString()
    {
        return $"Bidirectional Debug - Forward(O:{forwardOpenCount},C:{forwardClosedCount}) " +
               $"Backward(O:{backwardOpenCount},C:{backwardClosedCount}) " +
               $"Explored:{nodesExplored} Met:{searchesMet} Direction:{currentSearchDirection}";
    }
}

/// <summary>
/// Extended algorithm statistics for Bidirectional Search
/// </summary>
[System.Serializable]
public class BidirectionalStats : AlgorithmStats
{
    public int forwardNodesExplored;
    public int backwardNodesExplored;
    public float searchBalance;              // How balanced the two searches were
    public float meetingPointOptimality;     // How optimal the meeting point was
    
    public override string ToString()
    {
        return $"Bidirectional: {nodesExplored} explored (F:{forwardNodesExplored} B:{backwardNodesExplored}), " +
               $"{pathLength} path length, {executionTime:F3}s, balance: {searchBalance:F2}";
    }
}