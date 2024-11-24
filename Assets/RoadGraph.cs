using System.Collections.Generic;
using UnityEngine;

namespace Pathfindr
{
    public class RoadGraph
    {
        private Dictionary<long, RoadNode> nodes;
        public RoadNode StartNode { get; set; }

        public RoadGraph()
        {
            nodes = new Dictionary<long, RoadNode>();
        }

        public RoadNode AddNode(long id, float lat, float lon)
        {
            if (!nodes.ContainsKey(id))
            {
                nodes[id] = new RoadNode(id, lat, lon);
            }
            return nodes[id];
        }

        public RoadNode GetNode(long id)
        {
            return nodes.ContainsKey(id) ? nodes[id] : null;
        }
    }

    public class RoadNode
    {
        public long Id { get; private set; }
        public float Latitude { get; private set; }
        public float Longitude { get; private set; }
        public List<RoadNode> Connections { get; private set; }

        public RoadNode(long id, float lat, float lon)
        {
            Id = id;
            Latitude = lat;
            Longitude = lon;
            Connections = new List<RoadNode>();
        }

        public void ConnectTo(RoadNode other)
        {
            if (!Connections.Contains(other))
            {
                Connections.Add(other);
                other.Connections.Add(this); // Add bidirectional connection
            }
        }
    }
} 