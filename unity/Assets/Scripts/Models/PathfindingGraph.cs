using System.Collections.Generic;
using UnityEngine;
using System.Linq;

/// <summary>
/// Pathfinding graph that manages nodes and edges for algorithms
/// Unity port of React Graph.js
/// </summary>
public class PathfindingGraph
{
    [Header("Graph Data")]
    public Dictionary<long, PathfindingNode> nodes = new Dictionary<long, PathfindingNode>();
    public List<PathfindingEdge> edges = new List<PathfindingEdge>();
    
    [Header("Graph Properties")]
    public PathfindingNode startNode;
    public PathfindingNode endNode;
    public Vector2 boundingBoxMin;
    public Vector2 boundingBoxMax;
    
    // Statistics (Header attribute not valid on properties)
    public int nodeCount => nodes.Count;
    public int edgeCount => edges.Count;
    
    #region Node Management
    
    /// <summary>
    /// Add node to graph
    /// </summary>
    public void AddNode(PathfindingNode node)
    {
        if (node == null) return;
        
        nodes[node.id] = node;
        UpdateBoundingBox(node.geoCoordinate);
    }
    
    /// <summary>
    /// Get node by ID
    /// </summary>
    public PathfindingNode GetNode(long id)
    {
        return nodes.TryGetValue(id, out PathfindingNode node) ? node : null;
    }
    
    /// <summary>
    /// Remove node from graph
    /// </summary>
    public void RemoveNode(long id)
    {
        if (nodes.TryGetValue(id, out PathfindingNode node))
        {
            // Remove all edges connected to this node
            RemoveNodeEdges(node);
            nodes.Remove(id);
        }
    }
    
    /// <summary>
    /// Check if node exists
    /// </summary>
    public bool HasNode(long id)
    {
        return nodes.ContainsKey(id);
    }
    
    /// <summary>
    /// Get all nodes as list
    /// </summary>
    public List<PathfindingNode> GetAllNodes()
    {
        return nodes.Values.ToList();
    }
    
    #endregion
    
    #region Edge Management
    
    /// <summary>
    /// Add edge between two nodes
    /// </summary>
    public void AddEdge(PathfindingNode nodeA, PathfindingNode nodeB, string roadType = "", bool bidirectional = true)
    {
        if (nodeA == null || nodeB == null || nodeA.id == nodeB.id) return;
        
        // Check if edge already exists
        if (HasEdge(nodeA.id, nodeB.id)) return;
        
        // Create edge
        var edge = new PathfindingEdge(nodeA, nodeB, roadType, bidirectional);
        edges.Add(edge);
        
        // Add edge to both nodes
        nodeA.AddNeighbor(nodeB, edge);
        if (bidirectional)
        {
            nodeB.AddNeighbor(nodeA, edge);
        }
    }
    
    /// <summary>
    /// Check if edge exists between nodes
    /// </summary>
    public bool HasEdge(long nodeAId, long nodeBId)
    {
        return edges.Any(e => 
            (e.nodeA.id == nodeAId && e.nodeB.id == nodeBId) ||
            (e.nodeA.id == nodeBId && e.nodeB.id == nodeAId));
    }
    
    /// <summary>
    /// Get edge between two nodes
    /// </summary>
    public PathfindingEdge GetEdge(long nodeAId, long nodeBId)
    {
        return edges.FirstOrDefault(e => 
            (e.nodeA.id == nodeAId && e.nodeB.id == nodeBId) ||
            (e.nodeA.id == nodeBId && e.nodeB.id == nodeAId));
    }
    
    /// <summary>
    /// Remove all edges connected to a node
    /// </summary>
    void RemoveNodeEdges(PathfindingNode node)
    {
        edges.RemoveAll(e => e.nodeA.id == node.id || e.nodeB.id == node.id);
        
        // Remove from neighbor nodes
        foreach (var neighbor in node.neighbors.ToList())
        {
            neighbor.node.RemoveNeighbor(node);
        }
        node.neighbors.Clear();
        node.edges.Clear();
    }
    
    #endregion
    
    #region Graph Operations
    
    /// <summary>
    /// Reset all nodes for new pathfinding run
    /// </summary>
    public void ResetNodes()
    {
        foreach (var node in nodes.Values)
        {
            node.ResetPathfindingData();
        }
        
        foreach (var edge in edges)
        {
            edge.ResetPathfindingState();
        }
    }
    
    /// <summary>
    /// Set start node
    /// </summary>
    public void SetStartNode(PathfindingNode node)
    {
        if (startNode != null)
            startNode.isStartNode = false;
            
        startNode = node;
        if (startNode != null)
        {
            startNode.isStartNode = true;
            startNode.distanceFromStart = 0f;
        }
    }
    
    /// <summary>
    /// Set end node
    /// </summary>
    public void SetEndNode(PathfindingNode node)
    {
        if (endNode != null)
            endNode.isEndNode = false;
            
        endNode = node;
        if (endNode != null)
        {
            endNode.isEndNode = true;
        }
    }
    
    /// <summary>
    /// Find nearest node to geographic coordinate
    /// </summary>
    public PathfindingNode FindNearestNode(Vector2 geoCoordinate)
    {
        PathfindingNode nearest = null;
        float minDistance = float.MaxValue;
        
        foreach (var node in nodes.Values)
        {
            float distance = Vector2.Distance(geoCoordinate, node.geoCoordinate);
            if (distance < minDistance)
            {
                minDistance = distance;
                nearest = node;
            }
        }
        
        return nearest;
    }
    
    /// <summary>
    /// Get nodes within radius of coordinate
    /// </summary>
    public List<PathfindingNode> GetNodesInRadius(Vector2 center, float radius)
    {
        List<PathfindingNode> result = new List<PathfindingNode>();
        
        foreach (var node in nodes.Values)
        {
            float distance = Vector2.Distance(center, node.geoCoordinate);
            if (distance <= radius)
            {
                result.Add(node);
            }
        }
        
        return result;
    }
    
    #endregion
    
    #region Graph Construction from OSM Data
    
    /// <summary>
    /// Build graph from OSM data using React's EXACT method
    /// Mirrors React's getMapGraph() function exactly
    /// </summary>
    public void BuildFromOSMData(OSMData osmData, long startNodeId = 0)
    {
        if (osmData?.elements == null) 
        {
            Debug.LogWarning("OSM data is null or has no elements");
            return;
        }
        
        Debug.Log($"Building graph using React's exact method: {osmData.elements.Length} elements, startNodeId={startNodeId}");
        
        // First pass: Create all nodes (React: if(element.type === "node"))
        int nodeCount = 0;
        foreach (var element in osmData.elements)
        {
            if (element.type == "node")
            {
                // React: const node = graph.addNode(element.id, element.lat, element.lon);
                var node = AddNodeSimple(element.id, element.lat, element.lon);
                
                nodeCount++;
                
                // React: if(node.id === startNodeId) { graph.startNode = node; }
                if (startNodeId > 0 && node.id == startNodeId)
                {
                    startNode = node;
                    Debug.Log($"Set startNode: ID={node.id} (React style)");
                }
            }
        }
        
        // Second pass: Connect nodes via ways (React: else if(element.type === "way"))
        int connectionsCreated = 0;
        
        foreach (var element in osmData.elements)
        {
            if (element.type == "way")
            {
                if (element.nodes == null || element.nodes.Length < 2) continue;
                
                // React: for(let i = 0; i < element.nodes.length - 1; i++)
                for (int i = 0; i < element.nodes.Length - 1; i++)
                {
                    long nodeAId = element.nodes[i];
                    long nodeBId = element.nodes[i + 1];
                    
                    // React: const node1 = graph.getNode(element.nodes[i]);
                    // React: const node2 = graph.getNode(element.nodes[i + 1]);
                    var nodeA = GetNode(nodeAId);
                    var nodeB = GetNode(nodeBId);
                    
                    if (nodeA != null && nodeB != null)
                    {
                        // React: node1.connectTo(node2);
                        ConnectNodesSimple(nodeA, nodeB);
                        connectionsCreated++;
                    }
                }
            }
        }
        
        Debug.Log($"React-style graph complete: {nodeCount} nodes, {connectionsCreated} connections");
        
        if (startNodeId > 0)
        {
            if (startNode != null)
            {
                Debug.Log($"StartNode found and set: ID={startNode.id}, neighbors={startNode.neighbors.Count}");
            }
            else
            {
                Debug.LogError($"StartNode with ID={startNodeId} was not found in OSM data!");
            }
        }
    }
    
    /// <summary>
    /// Add node using React's simple method
    /// Mirrors: graph.addNode(id, latitude, longitude)
    /// </summary>
    PathfindingNode AddNodeSimple(long id, double latitude, double longitude)
    {
        var node = new PathfindingNode(id, latitude, longitude);
        nodes[id] = node;
        UpdateBoundingBox(node.geoCoordinate);
        return node;
    }
    
    /// <summary>
    /// Connect two nodes using React's simple method  
    /// Mirrors: node1.connectTo(node2)
    /// </summary>
    void ConnectNodesSimple(PathfindingNode nodeA, PathfindingNode nodeB)
    {
        // React's connectTo creates bidirectional edges
        nodeA.ConnectTo(nodeB); // Use new React-style method
        
        // CRITICAL: Also add the edge to graph's central list for proper statistics
        // Get the edge that was just created
        var edge = nodeA.GetEdgeTo(nodeB);
        if (edge != null && !edges.Contains(edge))
        {
            edges.Add(edge);
        }
    }
    
    #endregion
    
    #region OSM Data Conversion
    
    /// <summary>
    /// Convert OSMElement to OSMNode (fixes type mismatch)
    /// </summary>
    private OSMNode ConvertElementToNode(OSMElement element)
    {
        return new OSMNode
        {
            type = element.type,
            id = element.id,
            lat = element.lat,
            lon = element.lon,
            tags = element.tags
        };
    }
    
    #endregion
    
    #region Utility Methods
    
    /// <summary>
    /// Update bounding box when adding nodes
    /// </summary>
    void UpdateBoundingBox(Vector2 coordinate)
    {
        if (nodes.Count == 1)
        {
            // First node - initialize bounding box
            boundingBoxMin = coordinate;
            boundingBoxMax = coordinate;
        }
        else
        {
            // Update bounding box
            boundingBoxMin.x = Mathf.Min(boundingBoxMin.x, coordinate.x);
            boundingBoxMin.y = Mathf.Min(boundingBoxMin.y, coordinate.y);
            boundingBoxMax.x = Mathf.Max(boundingBoxMax.x, coordinate.x);
            boundingBoxMax.y = Mathf.Max(boundingBoxMax.y, coordinate.y);
        }
    }
    
    /// <summary>
    /// Get graph statistics
    /// </summary>
    public GraphStats GetStats()
    {
        return new GraphStats
        {
            nodeCount = nodeCount,
            edgeCount = edgeCount,
            boundingBox = new Vector4(boundingBoxMin.x, boundingBoxMin.y, boundingBoxMax.x, boundingBoxMax.y),
            averageConnections = nodes.Count > 0 ? edges.Count * 2f / nodes.Count : 0f
        };
    }
    
    /// <summary>
    /// Clear all graph data
    /// </summary>
    public void Clear()
    {
        nodes.Clear();
        edges.Clear();
        startNode = null;
        endNode = null;
        boundingBoxMin = Vector2.zero;
        boundingBoxMax = Vector2.zero;
    }
    
    #endregion
}

/// <summary>
/// Graph statistics data
/// </summary>
[System.Serializable]
public class GraphStats
{
    public int nodeCount;
    public int edgeCount;
    public Vector4 boundingBox; // min.x, min.y, max.x, max.y
    public float averageConnections;
    
    public override string ToString()
    {
        return $"Graph: {nodeCount} nodes, {edgeCount} edges, avg {averageConnections:F1} connections/node";
    }
}

/// <summary>
/// Extended OSM data structures to support ways
/// </summary>
[System.Serializable]
public class OSMWay
{
    public string type;
    public long id;
    public long[] nodes;
    public OSMTags tags;
}

// Update OSMData to include ways
[System.Serializable]
public class OSMDataExtended
{
    public OSMElement[] elements;
}

// OSMElement class is now defined in OnlineMapsController.cs