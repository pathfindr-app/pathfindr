using System.Collections.Generic;
using UnityEngine;

/// <summary>
/// Exact mirror of React waypoints.current timeline system
/// Builds a timeline of path segments with timestamps during algorithm execution
/// Enables real-time animation + replay with scrubbing (no state snapshots needed)
/// </summary>
[System.Serializable]
public class PathSegment
{
    [Header("Geographic Path")]
    public Vector2[] path;          // [startCoord, endCoord] in lng/lat
    
    [Header("Timeline")]
    public float[] timestamps;      // [startTime, endTime] when segment appears/completes
    
    [Header("Visual")]
    public string color;            // "path", "route", "exploration", etc.
    
    [Header("Debug")]
    public long startNodeId;        // For debugging
    public long endNodeId;          // For debugging
    
    public PathSegment(Vector2 startCoord, Vector2 endCoord, float startTime, float endTime, string segmentColor = "path")
    {
        path = new Vector2[] { startCoord, endCoord };
        timestamps = new float[] { startTime, endTime };
        color = segmentColor;
    }
}

public class PathSegmentTimeline : MonoBehaviour
{
    [Header("Timeline State")]
    public List<PathSegment> segments = new List<PathSegment>();
    public float currentTimer = 0f;
    public float totalDuration = 0f;
    
    [Header("Playback")]
    [Range(0f, 1f)]
    public float timelinePosition = 0f;  // 0-1 for scrubbing
    public float playbackSpeed = 1f;
    public bool isPlaying = false;
    
    [Header("Configuration")]
    [Tooltip("Distance multiplier for timing calculations (mirrors React's 50000)")]
    public float distanceTimeMultiplier = 50000f;
    
    [Header("Debug")]
    public bool enableDebugLogs = true;
    public int totalSegments = 0;
    
    void Update()
    {
        // Update debug info
        totalSegments = segments.Count;
        
        if (totalDuration > 0)
        {
            timelinePosition = Mathf.Clamp01(currentTimer / totalDuration);
        }
    }
    
    /// <summary>
    /// Mirror of React's updateWaypoints() function
    /// Adds path segment to timeline with calculated timestamps
    /// </summary>
    public void AddPathSegment(Vector2 startCoord, Vector2 endCoord, string segmentColor = "path", float timeMultiplier = 1f)
    {
        if (startCoord == endCoord)
        {
            if (enableDebugLogs)
            {
                Debug.LogWarning("[PathSegmentTimeline] Skipping zero-length segment");
            }
            return;
        }
        
        // Calculate timing based on geographic distance (mirrors React calculation)
        float distance = Vector2.Distance(startCoord, endCoord);
        float timeAdd = distance * distanceTimeMultiplier * timeMultiplier;
        
        // Create segment with timestamps
        PathSegment segment = new PathSegment(startCoord, endCoord, currentTimer, currentTimer + timeAdd, segmentColor);
        
        segments.Add(segment);
        currentTimer += timeAdd;
        totalDuration = currentTimer;
        
        // Removed debug spam
    }
    
    /// <summary>
    /// Add segment using PathfindingNode objects (Unity integration)
    /// </summary>
    public void AddPathSegment(PathfindingNode startNode, PathfindingNode endNode, string segmentColor = "path", float timeMultiplier = 1f)
    {
        if (startNode == null || endNode == null)
        {
            if (enableDebugLogs)
            {
                Debug.LogWarning("[PathSegmentTimeline] Null nodes provided to AddPathSegment");
            }
            return;
        }
        
        AddPathSegment(startNode.geoCoordinate, endNode.geoCoordinate, segmentColor, timeMultiplier);
        
        // Store debug info
        if (segments.Count > 0)
        {
            PathSegment lastSegment = segments[segments.Count - 1];
            lastSegment.startNodeId = startNode.id;
            lastSegment.endNodeId = endNode.id;
        }
    }
    
    /// <summary>
    /// Get all segments active at specific time position
    /// Used for rendering at any timeline position
    /// </summary>
    public List<PathSegment> GetActiveSegmentsAtTime(float timePosition)
    {
        List<PathSegment> activeSegments = new List<PathSegment>();

        // CRITICAL FIX: For real-time algorithm visualization, show ALL segments that exist
        // This ensures visualization works immediately as segments are added
        foreach (PathSegment segment in segments)
        {
            activeSegments.Add(segment);
        }

        return activeSegments;
    }
    
    /// <summary>
    /// Get current playback time based on timeline position
    /// CRITICAL FIX: Use currentTimer during algorithm execution instead of timelinePosition
    /// </summary>
    public float GetCurrentPlaybackTime()
    {
        // During algorithm execution, use currentTimer (real-time progress)
        // During replay/scrubbing, use timelinePosition * totalDuration
        if (isPlaying)
        {
            return timelinePosition * totalDuration;
        }
        else
        {
            // CRITICAL: Return current timer for real-time algorithm visualization
            return currentTimer;
        }
    }
    
    /// <summary>
    /// Set playback position (0-1) for scrubbing
    /// </summary>
    public void SeekToPosition(float normalizedPosition)
    {
        timelinePosition = Mathf.Clamp01(normalizedPosition);
        currentTimer = timelinePosition * totalDuration;
        
        if (enableDebugLogs)
        {
            Debug.Log($"[PathSegmentTimeline] Seeked to position {timelinePosition:F2} (time: {currentTimer:F1}ms)");
        }
    }
    
    /// <summary>
    /// Clear timeline for new algorithm execution
    /// </summary>
    public void ClearTimeline()
    {
        segments.Clear();
        currentTimer = 0f;
        totalDuration = 0f;
        timelinePosition = 0f;
        
        if (enableDebugLogs)
        {
            Debug.Log("[PathSegmentTimeline] Timeline cleared for new algorithm");
        }
    }
    
    /// <summary>
    /// Get timeline statistics for debugging
    /// </summary>
    public string GetTimelineStats()
    {
        if (segments.Count == 0)
            return "Timeline: Empty";
            
        return $"Timeline: {segments.Count} segments, {totalDuration:F1}ms total, position: {timelinePosition:F2}";
    }
    
    /// <summary>
    /// Debug method to log timeline contents
    /// </summary>
    [ContextMenu("🧪 Log Timeline Contents")]
    public void DebugLogTimeline()
    {
        Debug.Log("🧪 PATHFINDING TIMELINE DEBUG");
        Debug.Log("═══════════════════════════");
        Debug.Log($"Total segments: {segments.Count}");
        Debug.Log($"Total duration: {totalDuration:F1}ms");
        Debug.Log($"Current position: {timelinePosition:F2}");
        
        for (int i = 0; i < Mathf.Min(segments.Count, 10); i++) // Show first 10
        {
            PathSegment segment = segments[i];
            Debug.Log($"  [{i}] {segment.path[0]} → {segment.path[1]} | {segment.timestamps[0]:F1}-{segment.timestamps[1]:F1}ms | {segment.color}");
        }
        
        if (segments.Count > 10)
        {
            Debug.Log($"  ... and {segments.Count - 10} more segments");
        }
        
        Debug.Log("═══════════════════════════");
    }
}