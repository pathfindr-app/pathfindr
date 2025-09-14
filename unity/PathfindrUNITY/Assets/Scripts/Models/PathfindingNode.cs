using System.Collections.Generic;
using UnityEngine;
using System;

/// <summary>
/// Pathfinding node representing a point in the road network
/// Unity port of React Node.js
/// </summary>
[System.Serializable]
public class PathfindingNode : IComparable<PathfindingNode>
{
    [Header("Node Identity")]
    public long id;                    // OSM node ID
    public Vector2 geoCoordinate;      // Latitude, Longitude
    public Vector3 worldPosition;      // Unity world position
    
    [Header("Pathfinding Data")]
    public float distanceFromStart = float.MaxValue;  // g-cost
    public float distanceToEnd = 0f;                  // h-cost  
    public bool visited = false;
    [System.NonSerialized]
    public PathfindingNode referer = null;            // Parent node for path reconstruction
    [System.NonSerialized]
    public PathfindingNode parent = null;             // Alternative parent reference
    
    [Header("Network Connections")]
    [System.NonSerialized]
    public List<NodeNeighbor> neighbors = new List<NodeNeighbor>();
    [System.NonSerialized]
    public List<PathfindingEdge> edges = new List<PathfindingEdge>();
    
    [Header("Visualization")]
    public bool isStartNode = false;
    public bool isEndNode = false;
    public Color nodeColor = Color.white;
    public SearchDirection searchDirection = SearchDirection.Forward;
    
    #region Constructors
    
    public PathfindingNode()
    {
        // Default constructor
    }
    
    public PathfindingNode(long id, double latitude, double longitude)
    {
        this.id = id;
        this.geoCoordinate = new Vector2((float)longitude, (float)latitude); // Store as (lng, lat) with full precision
        this.worldPosition = GeoToWorldPosition();
        
        InitializeNode();
    }
    
    public PathfindingNode(OSMNode osmNode)
    {
        this.id = osmNode.id;
        // CRITICAL FIX: Preserve maximum precision from double to float conversion
        // Use high-precision cast to maintain coordinate accuracy
        this.geoCoordinate = new Vector2((float)osmNode.lon, (float)osmNode.lat);
        this.worldPosition = GeoToWorldPosition();

        InitializeNode();

        // DEBUG: Validate precision preservation
        double originalLon = osmNode.lon;
        double originalLat = osmNode.lat;
        float convertedLon = this.geoCoordinate.x;
        float convertedLat = this.geoCoordinate.y;

        // Check if precision was lost significantly
        double lonPrecisionLoss = System.Math.Abs(originalLon - convertedLon);
        double latPrecisionLoss = System.Math.Abs(originalLat - convertedLat);

        if (lonPrecisionLoss > 0.00001 || latPrecisionLoss > 0.00001)
        {
            Debug.LogWarning($"[PathfindingNode] Precision loss detected for ID={osmNode.id}:");
            Debug.LogWarning($"  Original: lon={originalLon:F8}, lat={originalLat:F8}");
            Debug.LogWarning($"  Converted: lon={convertedLon:F8}, lat={convertedLat:F8}");
            Debug.LogWarning($"  Loss: lon={lonPrecisionLoss:F8}, lat={latPrecisionLoss:F8}");
        }
    }
    
    void InitializeNode()
    {
        neighbors = new List<NodeNeighbor>();
        edges = new List<PathfindingEdge>();
        visited = false;
        referer = null;
        distanceFromStart = float.MaxValue;
        distanceToEnd = 0f;
    }
    
    #endregion
    
    #region Properties
    
    /// <summary>
    /// Total distance for A* algorithm (f-cost = g-cost + h-cost)
    /// </summary>
    public float totalDistance
    {
        get { return distanceFromStart + distanceToEnd; }
    }
    
    /// <summary>
    /// Geographic coordinate as (longitude, latitude)
    /// </summary>
    public Vector2 GeoCoordinate
    {
        get { return geoCoordinate; }
        set 
        { 
            geoCoordinate = value;
            worldPosition = GeoToWorldPosition();
        }
    }
    
    /// <summary>
    /// Number of connected neighbors
    /// </summary>
    public int NeighborCount
    {
        get { return neighbors.Count; }
    }
    
    #endregion
    
    #region Neighbor Management
    
    /// <summary>
    /// Add a neighbor connection
    /// </summary>
    public void AddNeighbor(PathfindingNode neighborNode, PathfindingEdge edge)
    {
        if (neighborNode == null || edge == null) return;
        
        // Check if neighbor already exists
        if (HasNeighbor(neighborNode)) return;
        
        // Add neighbor
        var neighbor = new NodeNeighbor
        {
            node = neighborNode,
            edge = edge
        };
        
        neighbors.Add(neighbor);
        edges.Add(edge);
    }
    
    /// <summary>
    /// Remove a neighbor connection
    /// </summary>
    public void RemoveNeighbor(PathfindingNode neighborNode)
    {
        for (int i = neighbors.Count - 1; i >= 0; i--)
        {
            if (neighbors[i].node.id == neighborNode.id)
            {
                var edgeToRemove = neighbors[i].edge;
                neighbors.RemoveAt(i);
                edges.Remove(edgeToRemove);
                break;
            }
        }
    }
    
    /// <summary>
    /// Check if node has specific neighbor
    /// </summary>
    public bool HasNeighbor(PathfindingNode neighborNode)
    {
        foreach (var neighbor in neighbors)
        {
            if (neighbor.node.id == neighborNode.id)
                return true;
        }
        return false;
    }
    
    /// <summary>
    /// Get neighbor by node ID
    /// </summary>
    public PathfindingNode GetNeighbor(long nodeId)
    {
        foreach (var neighbor in neighbors)
        {
            if (neighbor.node.id == nodeId)
                return neighbor.node;
        }
        return null;
    }
    
    /// <summary>
    /// Get edge connecting to specific neighbor
    /// </summary>
    public PathfindingEdge GetEdgeTo(PathfindingNode neighborNode)
    {
        foreach (var neighbor in neighbors)
        {
            if (neighbor.node.id == neighborNode.id)
                return neighbor.edge;
        }
        return null;
    }
    
    #endregion
    
    #region Edge Management (Legacy compatibility)
    
    /// <summary>
    /// Add edge connection (legacy method for compatibility)
    /// </summary>
    public void AddEdge(PathfindingNode otherNode)
    {
        if (HasNeighbor(otherNode)) return;
        
        // Create edge
        var edge = new PathfindingEdge(this, otherNode);
        
        // Add to both nodes
        AddNeighbor(otherNode, edge);
        otherNode.AddNeighbor(this, edge);
    }
    
    /// <summary>
    /// Connect to node using React's exact method
    /// Mirrors React: connectTo(node) { const edge = new Edge(this, node); this.edges.push(edge); node.edges.push(edge); }
    /// </summary>
    public void ConnectTo(PathfindingNode otherNode)
    {
        if (otherNode == null || otherNode.id == this.id) return;
        
        // Check if connection already exists (check both directions)
        foreach (var existingEdge in edges)
        {
            if ((existingEdge.nodeA.id == this.id && existingEdge.nodeB.id == otherNode.id) ||
                (existingEdge.nodeA.id == otherNode.id && existingEdge.nodeB.id == this.id))
            {
                return; // Connection already exists
            }
        }
        
        // Create single edge object (React style)
        var edge = new PathfindingEdge(this, otherNode);
        
        // Push same edge to both nodes' edge arrays (React's exact approach)
        this.edges.Add(edge);
        otherNode.edges.Add(edge);
        
        // Also update the neighbor lists for algorithm compatibility
        var thisNeighbor = new NodeNeighbor { node = otherNode, edge = edge };
        var otherNeighbor = new NodeNeighbor { node = this, edge = edge };
        
        this.neighbors.Add(thisNeighbor);
        otherNode.neighbors.Add(otherNeighbor);
    }
    
    /// <summary>
    /// Check if edge exists to another node
    /// </summary>
    public bool HasEdge(PathfindingNode otherNode)
    {
        return HasNeighbor(otherNode);
    }
    
    /// <summary>
    /// Remove edge to another node
    /// </summary>
    public void RemoveEdge(PathfindingNode otherNode)
    {
        RemoveNeighbor(otherNode);
        otherNode.RemoveNeighbor(this);
    }
    
    #endregion
    
    #region Distance Calculations
    
    /// <summary>
    /// Calculate distance to another node
    /// </summary>
    public float GetDistanceTo(PathfindingNode otherNode)
    {
        if (otherNode == null) return float.MaxValue;
        
        return Vector2.Distance(this.geoCoordinate, otherNode.geoCoordinate);
    }
    
    /// <summary>
    /// Calculate world distance to another node
    /// </summary>
    public float GetWorldDistanceTo(PathfindingNode otherNode)
    {
        if (otherNode == null) return float.MaxValue;
        
        return Vector3.Distance(this.worldPosition, otherNode.worldPosition);
    }
    
    /// <summary>
    /// Calculate great circle distance (more accurate for large distances)
    /// </summary>
    public float GetGreatCircleDistanceTo(PathfindingNode otherNode)
    {
        if (otherNode == null) return float.MaxValue;
        
        // Haversine formula for great circle distance
        float lat1Rad = geoCoordinate.y * Mathf.Deg2Rad;
        float lat2Rad = otherNode.geoCoordinate.y * Mathf.Deg2Rad;
        float deltaLatRad = (otherNode.geoCoordinate.y - geoCoordinate.y) * Mathf.Deg2Rad;
        float deltaLonRad = (otherNode.geoCoordinate.x - geoCoordinate.x) * Mathf.Deg2Rad;
        
        float a = Mathf.Sin(deltaLatRad / 2) * Mathf.Sin(deltaLatRad / 2) +
                  Mathf.Cos(lat1Rad) * Mathf.Cos(lat2Rad) *
                  Mathf.Sin(deltaLonRad / 2) * Mathf.Sin(deltaLonRad / 2);
                  
        float c = 2 * Mathf.Atan2(Mathf.Sqrt(a), Mathf.Sqrt(1 - a));
        
        // Earth radius in kilometers
        float earthRadius = 6371f;
        return earthRadius * c;
    }
    
    #endregion
    
    #region Coordinate Conversion
    
    /// <summary>
    /// Convert geographic coordinates to Unity world position
    /// Uses consistent coordinate conversion with other systems
    /// </summary>
    Vector3 GeoToWorldPosition()
    {
        // Try to use OnlineMapsController for proper coordinate conversion
        var bridge = UnityEngine.Object.FindObjectOfType<OnlineMapsController>();
        if (bridge != null)
        {
            return bridge.GeoCoordinateToWorldPosition(geoCoordinate);
        }
        
        // Fallback: consistent basic scaling (matches other systems)
        // Use same fallback as VisualEffectsManager for consistency
        float x = geoCoordinate.x * 1000f; // Longitude * scale
        float z = geoCoordinate.y * 1000f; // Latitude * scale
        return new Vector3(x, 0.1f, z); // Slightly above ground (consistent with other systems)
    }
    
    #endregion
    
    #region Pathfinding State Reset
    
    /// <summary>
    /// Reset pathfinding-specific data
    /// </summary>
    public void ResetPathfindingData()
    {
        visited = false;
        referer = null;
        parent = null;
        distanceFromStart = float.MaxValue;
        distanceToEnd = 0f;
    }
    
    #endregion
    
    #region Comparison and Equality
    
    /// <summary>
    /// Compare nodes by total distance (for priority queue)
    /// </summary>
    public int CompareTo(PathfindingNode other)
    {
        if (other == null) return 1;
        return totalDistance.CompareTo(other.totalDistance);
    }
    
    /// <summary>
    /// Check equality by ID
    /// </summary>
    public override bool Equals(object obj)
    {
        if (obj is PathfindingNode other)
        {
            return this.id == other.id;
        }
        return false;
    }
    
    /// <summary>
    /// Hash code by ID
    /// </summary>
    public override int GetHashCode()
    {
        return id.GetHashCode();
    }
    
    /// <summary>
    /// String representation with full precision coordinates
    /// </summary>
    public override string ToString()
    {
        return $"Node {id} at ({geoCoordinate.x:F8}, {geoCoordinate.y:F8}) - " +
               $"g:{distanceFromStart:F2}, h:{distanceToEnd:F2}, f:{totalDistance:F2}";
    }
    
    #endregion
}

/// <summary>
/// Neighbor connection data
/// </summary>
[System.Serializable]
public class NodeNeighbor
{
    [System.NonSerialized]
    public PathfindingNode node;
    [System.NonSerialized]
    public PathfindingEdge edge;
}

/// <summary>
/// Node type enumeration
/// </summary>
public enum NodeType
{
    Regular,        // Normal road node
    Intersection,   // Road intersection
    DeadEnd,        // Dead end
    StartNode,      // Pathfinding start
    EndNode         // Pathfinding end
}

// SearchDirection enum is now defined in GameSettings.cs