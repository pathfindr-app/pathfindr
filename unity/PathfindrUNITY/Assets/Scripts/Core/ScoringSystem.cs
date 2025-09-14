using System.Collections.Generic;
using UnityEngine;
using System;

[System.Serializable]
public struct ScoreResult
{
    public int efficiency;
    public int coverageEfficiency;
    public int granularityBonus;
    public int playerNodes;
    public int optimalNodes;
    public int nodesHit;
    public int playerDistance;
    public int optimalDistance;
    public int waypoints;
    public string note;
}

[System.Serializable]
public struct PlayerWaypoint
{
    public double lat;
    public double lon;
    
    public PlayerWaypoint(double latitude, double longitude)
    {
        lat = latitude;
        lon = longitude;
    }
}

public static class ScoringSystem
{
    private const double HIT_THRESHOLD = 0.001; // ~100m tolerance in lat/lon degrees
    private const int MAX_GRANULARITY_BONUS = 10; // Maximum 10% bonus
    private const double DEGREES_TO_METERS = 111139; // Conversion factor
    private const int MAX_PATH_STEPS = 1000; // Safety limit for path tracing

    public static ScoreResult CalculateScore(List<PlayerWaypoint> playerRoute, PathfindingNode endNode)
    {
        if (playerRoute == null || playerRoute.Count == 0 || endNode == null)
        {
            Debug.Log("Score calculation failed: missing route or endNode");
            return new ScoreResult
            {
                efficiency = 0,
                coverageEfficiency = 0,
                granularityBonus = 0,
                playerNodes = 0,
                optimalNodes = 0,
                nodesHit = 0,
                playerDistance = 0,
                optimalDistance = 0,
                waypoints = 0,
                note = "Missing data for calculation"
            };
        }

        Debug.Log("Analyzing player waypoint coverage of optimal path...");

        // Calculate optimal route distance and build path
        double optimalDistance = 0;
        List<PathfindingNode> optimalPath = new List<PathfindingNode>();
        PathfindingNode node = endNode;

        Debug.Log($"Tracing optimal path from endNode: {node?.id}");

        // Build the optimal path by following parent links
        int pathSteps = 0;
        while (node != null && node.parent != null && pathSteps < MAX_PATH_STEPS)
        {
            PathfindingNode parent = node.parent;
            optimalPath.Insert(0, node); // Add to beginning

            // Debug first few steps
            if (pathSteps == 0)
            {
                Debug.Log($"Node coords: lat={node.geoCoordinate.y}, lon={node.geoCoordinate.x}");
                Debug.Log($"Parent coords: lat={parent.geoCoordinate.y}, lon={parent.geoCoordinate.x}");
            }

            // Calculate segment distance using latitude/longitude
            double nodeLat = node.geoCoordinate.y;
            double nodeLon = node.geoCoordinate.x;
            double parentLat = parent.geoCoordinate.y;
            double parentLon = parent.geoCoordinate.x;

            if (!double.IsNaN(parentLat) && !double.IsNaN(parentLon) && 
                !double.IsNaN(nodeLat) && !double.IsNaN(nodeLon))
            {
                double segmentDistance = Math.Sqrt(
                    Math.Pow(nodeLat - parentLat, 2) + 
                    Math.Pow(nodeLon - parentLon, 2)
                );
                optimalDistance += segmentDistance;
                
                if (pathSteps < 3)
                {
                    Debug.Log($"Path step {pathSteps}: {parent.id} -> {node.id}, distance: {segmentDistance}");
                }
            }
            else
            {
                Debug.Log($"Missing coordinates at step {pathSteps}");
            }

            node = parent;
            pathSteps++;
        }

        if (node != null)
        {
            optimalPath.Insert(0, node); // Add start node
        }

        Debug.Log($"Optimal path built: {pathSteps} steps, total distance: {optimalDistance}");

        int optimalNodeCount = optimalPath.Count;
        int playerWaypointCount = playerRoute.Count;

        // If no optimal path was found, show basic comparison
        if (optimalDistance == 0 || optimalNodeCount == 0)
        {
            return new ScoreResult
            {
                efficiency = 100,
                coverageEfficiency = 100,
                granularityBonus = 0,
                playerNodes = playerWaypointCount,
                optimalNodes = optimalNodeCount,
                nodesHit = 0,
                playerDistance = 0,
                optimalDistance = 0,
                waypoints = playerWaypointCount,
                note = "Algorithm path not found"
            };
        }

        // Check how many optimal nodes the player waypoints are close to
        int nodesHit = 0;

        foreach (var optimalNode in optimalPath)
        {
            foreach (var playerWaypoint in playerRoute)
            {
                double distance = Math.Sqrt(
                    Math.Pow(optimalNode.geoCoordinate.y - playerWaypoint.lat, 2) +
                    Math.Pow(optimalNode.geoCoordinate.x - playerWaypoint.lon, 2)
                );

                if (distance <= HIT_THRESHOLD)
                {
                    nodesHit++;
                    break; // Count each optimal node only once
                }
            }
        }

        // Path coverage efficiency: how much of optimal path did player hit
        int coverageEfficiency = Mathf.RoundToInt((float)nodesHit / optimalNodeCount * 100);

        // Granularity bonus: more waypoints = more detailed planning (up to reasonable limit)
        int granularityBonus = Mathf.Min(MAX_GRANULARITY_BONUS, Mathf.RoundToInt(playerWaypointCount / 2f));

        // Final efficiency with granularity bonus
        int finalEfficiency = Mathf.Min(100, coverageEfficiency + granularityBonus);

        Debug.Log($"Waypoint coverage analysis - Player waypoints: {playerWaypointCount}, " +
                 $"Optimal nodes: {optimalNodeCount}, Nodes hit: {nodesHit}, " +
                 $"Coverage: {coverageEfficiency}%, Granularity bonus: {granularityBonus}%, " +
                 $"Final efficiency: {finalEfficiency}%");

        return new ScoreResult
        {
            efficiency = finalEfficiency,
            coverageEfficiency = coverageEfficiency,
            granularityBonus = granularityBonus,
            playerNodes = playerWaypointCount,
            optimalNodes = optimalNodeCount,
            nodesHit = nodesHit,
            playerDistance = 0, // Not calculating player distance in current implementation
            optimalDistance = Mathf.RoundToInt((float)(optimalDistance * DEGREES_TO_METERS)),
            waypoints = playerWaypointCount,
            note = null
        };
    }

    public static bool IsValidScore(ScoreResult score)
    {
        return score.efficiency >= 0 && score.efficiency <= 100 &&
               score.coverageEfficiency >= 0 && score.coverageEfficiency <= 100 &&
               score.granularityBonus >= 0 && score.granularityBonus <= MAX_GRANULARITY_BONUS;
    }

    public static string GetScoreGrade(int efficiency)
    {
        if (efficiency >= 90) return "S";
        if (efficiency >= 80) return "A";
        if (efficiency >= 70) return "B";
        if (efficiency >= 60) return "C";
        if (efficiency >= 50) return "D";
        return "F";
    }

    public static Color GetScoreColor(int efficiency)
    {
        if (efficiency >= 90) return new Color(0.2f, 0.8f, 0.2f); // Green
        if (efficiency >= 70) return new Color(0.8f, 0.8f, 0.2f); // Yellow
        if (efficiency >= 50) return new Color(0.8f, 0.5f, 0.2f); // Orange
        return new Color(0.8f, 0.2f, 0.2f); // Red
    }
}