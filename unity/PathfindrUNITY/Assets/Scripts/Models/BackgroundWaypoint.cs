using UnityEngine;
using System.Collections.Generic;

/// <summary>
/// Background waypoint data structure that matches React's backgroundWaypoints format
/// Used for storing algorithm exploration data during background processing
/// </summary>
[System.Serializable]
public class BackgroundWaypoint
{
    [Header("Path Data")]
    public Vector2[] path;          // Start and end coordinates [from, to]
    public float[] timestamps;      // Start and end timestamps [startTime, endTime]
    public string color;            // Waypoint color type ("route", "exploration", etc.)
    
    [Header("Algorithm Data")]
    public long fromNodeId;         // Source node ID
    public long toNodeId;           // Target node ID
    public PathfindingAlgorithm.AlgorithmType algorithmType;
    
    [Header("Visual Properties")]
    public float width = 3f;        // Line width
    public float speed = 1f;        // Animation speed multiplier
    
    /// <summary>
    /// Create background waypoint (matches React's waypoint creation)
    /// </summary>
    public BackgroundWaypoint(Vector2 fromCoord, Vector2 toCoord, float startTime, float endTime, string colorType = "route")
    {
        path = new Vector2[] { fromCoord, toCoord };
        timestamps = new float[] { startTime, endTime };
        color = colorType;
        width = 3f;
        speed = 1f;
    }
    
    /// <summary>
    /// Create background waypoint from pathfinding nodes
    /// </summary>
    public BackgroundWaypoint(PathfindingNode fromNode, PathfindingNode toNode, float startTime, float duration, string colorType = "route")
    {
        path = new Vector2[] { fromNode.geoCoordinate, toNode.geoCoordinate };
        timestamps = new float[] { startTime, startTime + duration };
        color = colorType;
        fromNodeId = fromNode.id;
        toNodeId = toNode.id;
        width = 3f;
        speed = 1f;
    }
    
    /// <summary>
    /// Get waypoint duration
    /// </summary>
    public float Duration
    {
        get { return timestamps.Length >= 2 ? timestamps[1] - timestamps[0] : 0f; }
    }
    
    /// <summary>
    /// Get waypoint start time
    /// </summary>
    public float StartTime
    {
        get { return timestamps.Length >= 1 ? timestamps[0] : 0f; }
    }
    
    /// <summary>
    /// Get waypoint end time
    /// </summary>
    public float EndTime
    {
        get { return timestamps.Length >= 2 ? timestamps[1] : 0f; }
    }
    
    /// <summary>
    /// Get from coordinate
    /// </summary>
    public Vector2 FromCoordinate
    {
        get { return path.Length >= 1 ? path[0] : Vector2.zero; }
    }
    
    /// <summary>
    /// Get to coordinate
    /// </summary>
    public Vector2 ToCoordinate
    {
        get { return path.Length >= 2 ? path[1] : Vector2.zero; }
    }
    
    /// <summary>
    /// Get geographic distance between waypoint coordinates
    /// </summary>
    public float GetDistance()
    {
        if (path.Length < 2) return 0f;
        return Vector2.Distance(path[0], path[1]);
    }
    
    /// <summary>
    /// Convert to Unity Color based on color string
    /// </summary>
    public Color GetUnityColor()
    {
        switch (color.ToLower())
        {
            case "route":
                return Color.green;
            case "exploration":
                return Color.yellow;
            case "visited":
                return Color.red;
            case "path":
                return Color.blue;
            default:
                return Color.white;
        }
    }
    
    /// <summary>
    /// Check if waypoint should be active at given time
    /// </summary>
    public bool IsActiveAtTime(float currentTime)
    {
        return currentTime >= StartTime && currentTime <= EndTime;
    }
    
    /// <summary>
    /// Get interpolation progress at given time (0-1)
    /// </summary>
    public float GetProgressAtTime(float currentTime)
    {
        if (Duration <= 0f) return 1f;
        
        float elapsed = currentTime - StartTime;
        return Mathf.Clamp01(elapsed / Duration);
    }
    
    /// <summary>
    /// Get interpolated position at given time
    /// </summary>
    public Vector2 GetPositionAtTime(float currentTime)
    {
        float progress = GetProgressAtTime(currentTime);
        return Vector2.Lerp(FromCoordinate, ToCoordinate, progress);
    }
}