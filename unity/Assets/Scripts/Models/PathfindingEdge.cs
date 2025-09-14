using UnityEngine;

/// <summary>
/// Pathfinding edge representing connection between two nodes
/// Unity port of React Edge.js
/// </summary>
[System.Serializable]
public class PathfindingEdge
{
    [Header("Edge Connection")]
    [System.NonSerialized]
    public PathfindingNode nodeA;
    [System.NonSerialized]
    public PathfindingNode nodeB;
    
    [Header("Edge Properties")]
    public float cost;              // Travel cost/weight
    public float length;            // Physical length
    public bool visited = false;    // For pathfinding visualization
    public bool bidirectional = true; // Can travel in both directions
    
    [Header("Road Properties")]
    public string roadType = "";    // highway type from OSM
    public string roadName = "";    // road name
    public float speedLimit = 50f;  // km/h
    
    [Header("Visualization")]
    public Color edgeColor = Color.white;
    public float lineWidth = 1f;
    public bool highlighted = false;
    
    #region Constructors
    
    public PathfindingEdge()
    {
        // Default constructor
    }
    
    public PathfindingEdge(PathfindingNode nodeA, PathfindingNode nodeB)
    {
        this.nodeA = nodeA;
        this.nodeB = nodeB;
        this.bidirectional = true;
        
        CalculateProperties();
    }
    
    public PathfindingEdge(PathfindingNode nodeA, PathfindingNode nodeB, string roadType, bool bidirectional = true)
    {
        this.nodeA = nodeA;
        this.nodeB = nodeB;
        this.roadType = roadType;
        this.bidirectional = bidirectional;
        
        CalculateProperties();
    }
    
    #endregion
    
    #region Properties
    
    /// <summary>
    /// Get the other node given one node
    /// </summary>
    public PathfindingNode GetOtherNode(PathfindingNode currentNode)
    {
        if (currentNode == null) return null;
        
        if (currentNode.id == nodeA.id)
            return nodeB;
        else if (currentNode.id == nodeB.id)
            return nodeA;
        else
            return null; // Node not part of this edge
    }
    
    /// <summary>
    /// Check if edge connects to a specific node
    /// </summary>
    public bool ConnectsTo(PathfindingNode node)
    {
        return (node != null) && (node.id == nodeA.id || node.id == nodeB.id);
    }
    
    /// <summary>
    /// Get start position as Vector2 (geographic coordinates)
    /// </summary>
    public Vector2 StartGeoPosition
    {
        get { return nodeA != null ? nodeA.geoCoordinate : Vector2.zero; }
    }
    
    /// <summary>
    /// Get end position as Vector2 (geographic coordinates)
    /// </summary>
    public Vector2 EndGeoPosition
    {
        get { return nodeB != null ? nodeB.geoCoordinate : Vector2.zero; }
    }
    
    /// <summary>
    /// Get start position as Vector3 (world coordinates)
    /// </summary>
    public Vector3 StartWorldPosition
    {
        get { return nodeA != null ? nodeA.worldPosition : Vector3.zero; }
    }
    
    /// <summary>
    /// Get end position as Vector3 (world coordinates)
    /// </summary>
    public Vector3 EndWorldPosition
    {
        get { return nodeB != null ? nodeB.worldPosition : Vector3.zero; }
    }
    
    /// <summary>
    /// Get edge center point (geographic)
    /// </summary>
    public Vector2 CenterGeoPosition
    {
        get
        {
            if (nodeA == null || nodeB == null) return Vector2.zero;
            return (nodeA.geoCoordinate + nodeB.geoCoordinate) * 0.5f;
        }
    }
    
    /// <summary>
    /// Get edge center point (world)
    /// </summary>
    public Vector3 CenterWorldPosition
    {
        get
        {
            if (nodeA == null || nodeB == null) return Vector3.zero;
            return (nodeA.worldPosition + nodeB.worldPosition) * 0.5f;
        }
    }
    
    #endregion
    
    #region Cost and Distance Calculations
    
    /// <summary>
    /// Calculate edge properties based on connected nodes
    /// </summary>
    void CalculateProperties()
    {
        if (nodeA == null || nodeB == null) return;
        
        // Calculate geometric length
        length = nodeA.GetDistanceTo(nodeB);
        
        // Calculate travel cost based on road type and length
        cost = CalculateTravelCost();
        
        // Set default speed limit based on road type
        SetDefaultSpeedLimit();
    }
    
    /// <summary>
    /// Calculate travel cost based on road type and conditions
    /// </summary>
    float CalculateTravelCost()
    {
        if (nodeA == null || nodeB == null) return float.MaxValue;
        
        float baseCost = length;
        float roadMultiplier = GetRoadTypeMultiplier();
        
        return baseCost * roadMultiplier;
    }
    
    /// <summary>
    /// Get cost multiplier based on road type
    /// </summary>
    float GetRoadTypeMultiplier()
    {
        switch (roadType.ToLower())
        {
            case "motorway":
            case "trunk":
                return 0.8f; // Fast roads
                
            case "primary":
            case "secondary":
                return 1.0f; // Normal roads
                
            case "tertiary":
            case "unclassified":
                return 1.2f; // Slower roads
                
            case "residential":
            case "living_street":
                return 1.5f; // Very slow roads
                
            default:
                return 1.0f; // Default cost
        }
    }
    
    /// <summary>
    /// Set default speed limit based on road type
    /// </summary>
    void SetDefaultSpeedLimit()
    {
        switch (roadType.ToLower())
        {
            case "motorway":
                speedLimit = 120f;
                break;
            case "trunk":
                speedLimit = 100f;
                break;
            case "primary":
                speedLimit = 80f;
                break;
            case "secondary":
                speedLimit = 60f;
                break;
            case "tertiary":
                speedLimit = 50f;
                break;
            case "unclassified":
            case "residential":
                speedLimit = 30f;
                break;
            case "living_street":
                speedLimit = 20f;
                break;
            default:
                speedLimit = 50f;
                break;
        }
    }
    
    /// <summary>
    /// Calculate travel time based on length and speed limit
    /// </summary>
    public float GetTravelTime()
    {
        if (speedLimit <= 0) return float.MaxValue;
        
        // Convert to hours: (length in km) / (speed in km/h)
        return length / speedLimit;
    }
    
    #endregion
    
    #region Pathfinding State
    
    /// <summary>
    /// Reset pathfinding state
    /// </summary>
    public void ResetPathfindingState()
    {
        visited = false;
        highlighted = false;
    }
    
    /// <summary>
    /// Mark edge as part of the optimal path
    /// </summary>
    public void MarkAsPath()
    {
        highlighted = true;
        edgeColor = Color.green;
    }
    
    /// <summary>
    /// Mark edge as explored during search
    /// </summary>
    public void MarkAsExplored()
    {
        visited = true;
        edgeColor = Color.yellow;
    }
    
    #endregion
    
    #region Validation
    
    /// <summary>
    /// Check if edge is valid
    /// </summary>
    public bool IsValid()
    {
        return nodeA != null && nodeB != null && nodeA.id != nodeB.id;
    }
    
    /// <summary>
    /// Check if travel is allowed from nodeA to nodeB
    /// </summary>
    public bool CanTravel(PathfindingNode from, PathfindingNode to)
    {
        if (!IsValid() || from == null || to == null) return false;
        
        // Check if nodes are part of this edge
        if (!ConnectsTo(from) || !ConnectsTo(to)) return false;
        
        // Check if direction is allowed
        if (!bidirectional)
        {
            // Only allow travel from nodeA to nodeB for unidirectional edges
            return from.id == nodeA.id && to.id == nodeB.id;
        }
        
        return true;
    }
    
    #endregion
    
    #region Utility Methods
    
    /// <summary>
    /// Get edge direction vector (normalized)
    /// </summary>
    public Vector2 GetDirection()
    {
        if (nodeA == null || nodeB == null) return Vector2.zero;
        
        Vector2 direction = nodeB.geoCoordinate - nodeA.geoCoordinate;
        return direction.normalized;
    }
    
    /// <summary>
    /// Get edge direction in world space
    /// </summary>
    public Vector3 GetWorldDirection()
    {
        if (nodeA == null || nodeB == null) return Vector3.zero;
        
        Vector3 direction = nodeB.worldPosition - nodeA.worldPosition;
        return direction.normalized;
    }
    
    /// <summary>
    /// Get points along the edge for smooth visualization
    /// </summary>
    public Vector2[] GetInterpolatedPoints(int pointCount)
    {
        if (nodeA == null || nodeB == null || pointCount < 2)
            return new Vector2[0];
            
        Vector2[] points = new Vector2[pointCount];
        
        for (int i = 0; i < pointCount; i++)
        {
            float t = i / (float)(pointCount - 1);
            points[i] = Vector2.Lerp(nodeA.geoCoordinate, nodeB.geoCoordinate, t);
        }
        
        return points;
    }
    
    #endregion
    
    #region Comparison and Equality
    
    /// <summary>
    /// Check equality by connected nodes
    /// </summary>
    public override bool Equals(object obj)
    {
        if (obj is PathfindingEdge other)
        {
            // Edge is same if it connects the same nodes (regardless of direction)
            return (nodeA.id == other.nodeA.id && nodeB.id == other.nodeB.id) ||
                   (nodeA.id == other.nodeB.id && nodeB.id == other.nodeA.id);
        }
        return false;
    }
    
    /// <summary>
    /// Hash code based on connected nodes
    /// </summary>
    public override int GetHashCode()
    {
        if (nodeA == null || nodeB == null) return 0;
        
        // Ensure hash is same regardless of node order
        long id1 = nodeA.id;
        long id2 = nodeB.id;
        
        if (id1 > id2)
        {
            // Swap to ensure consistent ordering
            long temp = id1;
            id1 = id2;
            id2 = temp;
        }
        
        return (id1.ToString() + "_" + id2.ToString()).GetHashCode();
    }
    
    /// <summary>
    /// String representation
    /// </summary>
    public override string ToString()
    {
        string nodeAId = nodeA != null ? nodeA.id.ToString() : "null";
        string nodeBId = nodeB != null ? nodeB.id.ToString() : "null";
        
        return $"Edge {nodeAId} -> {nodeBId} ({roadType}, cost: {cost:F2}, length: {length:F2})";
    }
    
    #endregion
}