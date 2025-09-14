using System.Collections.Generic;
using UnityEngine;

public class Graph
{
    public PathfindingNode startNode;
    private Dictionary<long, PathfindingNode> nodes;

    public Graph()
    {
        startNode = null;
        nodes = new Dictionary<long, PathfindingNode>();
    }

    public PathfindingNode GetNode(long id)
    {
        return nodes.ContainsKey(id) ? nodes[id] : null;
    }

    public PathfindingNode AddNode(long id, float latitude, float longitude)
    {
        PathfindingNode node = new PathfindingNode(id, latitude, longitude);
        nodes[node.id] = node;
        return node;
    }

    public Dictionary<long, PathfindingNode> GetAllNodes()
    {
        return nodes;
    }

    public int NodeCount => nodes.Count;

    public void Clear()
    {
        startNode = null;
        nodes.Clear();
    }

    public bool ContainsNode(long id)
    {
        return nodes.ContainsKey(id);
    }

    public void ResetAllNodes()
    {
        foreach (var node in nodes.Values)
        {
            node.ResetPathfindingData();
        }
    }
}