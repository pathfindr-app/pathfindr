using UnityEngine;
using System;
using System.Collections.Generic;
using System.Linq;
using InfinityCode.OnlineMapsExamples;

namespace Pathfindr
{
    public class RoadNetworkManager : MonoBehaviour
    {
        [SerializeField] private OnlineMaps map;
        private RoadGraph currentGraph;

        // Overpass query template excluding non-vehicle paths
        private const string OVERPASS_QUERY_TEMPLATE = @"
            [out:json];
            (
                way[highway]
                    [highway!=""footway""]
                    [highway!=""pedestrian""]
                    [highway!=""steps""]
                    [highway!=""path""]
                    [highway!=""track""]
                    [highway!=""service""]
                    [footway!=""*""]
                    ({0},{1},{2},{3});
                node(w);
            );
            out body;";

        private void Start()
        {
            if (map == null) 
                map = GetComponent<OnlineMaps>();
        }

        public void FetchRoadNetwork()
        {
            // Get current map bounds
            Vector2 topLeft = map.topLeftPosition;
            Vector2 bottomRight = map.bottomRightPosition;

            // Format query with bounds
            string query = string.Format(OVERPASS_QUERY_TEMPLATE,
                bottomRight.y.ToString(OnlineMapsUtils.numberFormat),
                topLeft.x.ToString(OnlineMapsUtils.numberFormat),
                topLeft.y.ToString(OnlineMapsUtils.numberFormat),
                bottomRight.x.ToString(OnlineMapsUtils.numberFormat)
            );

            // Make the request
            OnlineMapsOSMAPIQuery.Find(query).OnComplete += OnOSMRequestComplete;
        }

        private void OnOSMRequestComplete(string response)
        {
            if (string.IsNullOrEmpty(response))
            {
                Debug.LogError("Failed to fetch OSM data");
                return;
            }

            List<OnlineMapsOSMNode> nodes;
            List<OnlineMapsOSMWay> ways;
            List<OnlineMapsOSMRelation> relations;

            // Parse the OSM response
            OnlineMapsOSMAPIQuery.ParseOSMResponse(response, out nodes, out ways, out relations);
            Debug.Log($"Fetched {nodes.Count} nodes and {ways.Count} ways");
            
            ProcessRoadNetwork(nodes, ways);
        }

        private void ProcessRoadNetwork(List<OnlineMapsOSMNode> nodes, List<OnlineMapsOSMWay> ways)
        {
            currentGraph = new RoadGraph();

            // First pass: Create all nodes
            foreach (var node in nodes)
            {
                long nodeId;
                if (long.TryParse(node.id, out nodeId))
                {
                    currentGraph.AddNode(
                        nodeId,
                        (float)node.lat,
                        (float)node.lon
                    );
                }
            }

            // Second pass: Connect nodes through ways
            foreach (var way in ways)
            {
                if (way.nodeRefs == null || way.nodeRefs.Count < 2) continue;

                // Connect sequential nodes in the way
                for (int i = 0; i < way.nodeRefs.Count - 1; i++)
                {
                    long node1Id, node2Id;
                    if (long.TryParse(way.nodeRefs[i], out node1Id) && 
                        long.TryParse(way.nodeRefs[i + 1], out node2Id))
                    {
                        var node1 = currentGraph.GetNode(node1Id);
                        var node2 = currentGraph.GetNode(node2Id);

                        if (node1 != null && node2 != null)
                        {
                            node1.ConnectTo(node2);
                        }
                    }
                }
            }

            Debug.Log($"Created graph with {nodes.Count} nodes");
        }
    }
} 