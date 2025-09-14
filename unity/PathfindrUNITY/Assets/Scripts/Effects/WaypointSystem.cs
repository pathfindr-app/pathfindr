using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using System;

/// <summary>
/// Replicates React's sophisticated waypoint animation system for Unity
/// Handles timed trail animations with distance-based timing exactly like the React version
/// </summary>
public class WaypointSystem : MonoBehaviour
{
    [Header("Animation Settings")]
    [Range(0.1f, 20f)]
    public float globalAnimationSpeed = 1f;
    public bool enableTrailAnimation = true;
    public bool enableDistanceBasedTiming = true;
    public float distanceTimeMultiplier = 50000f; // React uses 50000
    
    [Header("Visual Configuration")]
    public Material trailMaterial;
    public float trailWidth = 0.05f;
    public Color defaultTrailColor = Color.green;
    [Range(0f, 1f)]
    public float trailAlpha = 0.8f;
    
    [Header("Performance")]
    public int maxActiveTrails = 200;
    public int maxWaypointsPerSecond = 100;
    public bool enableLOD = true;
    public float lodDistance = 50f;
    
    // React-style animation data
    private List<WaypointTrail> waypoints = new List<WaypointTrail>();
    private List<WaypointTrail> playerWaypoints = new List<WaypointTrail>();
    private float animationTimer = 0f;
    private bool isPlaying = false;
    
    // Performance management
    private Queue<LineRenderer> trailPool = new Queue<LineRenderer>();
    private List<ActiveTrail> activeTrails = new List<ActiveTrail>();
    private int waypointsThisSecond = 0;
    private float lastSecondTime = 0f;
    
    // Playback state
    public float CurrentTime => animationTimer;
    public float MaxTime { get; private set; } = 0f;
    public bool IsPlaying => isPlaying;
    public int TotalWaypoints => waypoints.Count;
    public int ActiveTrailCount => activeTrails.Count;
    
    // Events
    public event Action<WaypointTrail> OnWaypointAdded;
    public event Action<float> OnTimeUpdated;
    public event Action OnAnimationCompleted;
    
    void Start()
    {
        InitializeWaypointSystem();
    }
    
    void Update()
    {
        if (isPlaying)
        {
            UpdateAnimation();
        }
        
        UpdateActiveTrails();
        ManagePerformance();
    }
    
    #region Initialization
    
    void InitializeWaypointSystem()
    {
        // Pre-populate trail pool for performance
        PopulateTrailPool(20);
        
        // Initialize timing
        animationTimer = 0f;
        MaxTime = 0f;
        
        Debug.Log("WaypointSystem initialized with React-style animation");
    }
    
    void PopulateTrailPool(int poolSize)
    {
        for (int i = 0; i < poolSize; i++)
        {
            var trailObject = new GameObject($"TrailPool_{i}");
            trailObject.transform.SetParent(transform);
            
            var lineRenderer = trailObject.AddComponent<LineRenderer>();
            ConfigureLineRenderer(lineRenderer);
            
            trailObject.SetActive(false);
            trailPool.Enqueue(lineRenderer);
        }
    }
    
    void ConfigureLineRenderer(LineRenderer lineRenderer)
    {
        lineRenderer.material = trailMaterial;
        lineRenderer.startColor = defaultTrailColor;
        lineRenderer.startWidth = trailWidth;
        lineRenderer.endWidth = trailWidth * 0.5f;
        lineRenderer.useWorldSpace = true;
        lineRenderer.positionCount = 2;
        lineRenderer.sortingOrder = 5;
        
        // Enable smooth curves
        lineRenderer.generateLightingData = false;
        lineRenderer.receiveShadows = false;
        lineRenderer.shadowCastingMode = UnityEngine.Rendering.ShadowCastingMode.Off;
    }
    
    #endregion
    
    #region Waypoint Management (React-style)
    
    /// <summary>
    /// Add waypoint with distance-based timing exactly like React version
    /// </summary>
    public void AddWaypoint(Vector2 fromGeo, Vector2 toGeo, Color color, float? customTimeAdd = null)
    {
        // Performance throttling
        if (waypointsThisSecond >= maxWaypointsPerSecond)
        {
            return;
        }
        waypointsThisSecond++;
        
        // Calculate distance-based timing like React
        float distance = Vector2.Distance(fromGeo, toGeo);
        float timeAdd = customTimeAdd ?? (distance * distanceTimeMultiplier * (1f / globalAnimationSpeed));
        
        WaypointTrail waypoint = new WaypointTrail
        {
            fromGeoCoordinate = fromGeo,
            toGeoCoordinate = toGeo,
            startTime = animationTimer,
            endTime = animationTimer + timeAdd,
            color = color,
            trailType = WaypointType.Algorithm
        };
        
        waypoints.Add(waypoint);
        
        // Update maximum animation time
        MaxTime = Mathf.Max(MaxTime, waypoint.endTime);
        
        // Increment timer for next waypoint
        animationTimer += timeAdd;
        
        OnWaypointAdded?.Invoke(waypoint);
        
        if (enableTrailAnimation && isPlaying)
        {
            ScheduleTrailAnimation(waypoint);
        }
    }
    
    /// <summary>
    /// Add player waypoint (different visualization)
    /// </summary>
    public void AddPlayerWaypoint(Vector2 fromGeo, Vector2 toGeo, Color playerColor)
    {
        WaypointTrail playerWaypoint = new WaypointTrail
        {
            fromGeoCoordinate = fromGeo,
            toGeoCoordinate = toGeo,
            startTime = 0f,
            endTime = float.MaxValue, // Player route always visible
            color = playerColor,
            trailType = WaypointType.Player
        };
        
        playerWaypoints.Add(playerWaypoint);
        
        if (enableTrailAnimation)
        {
            CreateInstantTrail(playerWaypoint);
        }
    }
    
    /// <summary>
    /// Clear all waypoints and reset timer
    /// </summary>
    public void ClearAll()
    {
        waypoints.Clear();
        playerWaypoints.Clear();
        
        // Clear active trails
        foreach (var trail in activeTrails)
        {
            if (trail.lineRenderer != null)
            {
                trail.lineRenderer.gameObject.SetActive(false);
                trailPool.Enqueue(trail.lineRenderer);
            }
        }
        activeTrails.Clear();
        
        // Reset timing
        animationTimer = 0f;
        MaxTime = 0f;
        
        Debug.Log("All waypoints cleared");
    }
    
    #endregion
    
    #region Animation Control
    
    /// <summary>
    /// Start waypoint animation playback
    /// </summary>
    public void StartAnimation()
    {
        isPlaying = true;
        animationTimer = 0f;
        
        // Schedule all waypoint animations
        foreach (var waypoint in waypoints)
        {
            ScheduleTrailAnimation(waypoint);
        }
        
        Debug.Log($"Started waypoint animation with {waypoints.Count} trails");
    }
    
    /// <summary>
    /// Stop animation
    /// </summary>
    public void StopAnimation()
    {
        isPlaying = false;
        animationTimer = 0f;
        
        // Hide all active trails
        foreach (var trail in activeTrails)
        {
            if (trail.lineRenderer != null)
            {
                trail.lineRenderer.gameObject.SetActive(false);
            }
        }
    }
    
    /// <summary>
    /// Pause/Resume animation
    /// </summary>
    public void TogglePause()
    {
        isPlaying = !isPlaying;
    }
    
    /// <summary>
    /// Seek to specific time in animation
    /// </summary>
    public void SeekToTime(float targetTime)
    {
        animationTimer = Mathf.Clamp(targetTime, 0f, MaxTime);
        
        // Rebuild visible trails at target time
        RebuildTrailsAtTime(animationTimer);
        
        OnTimeUpdated?.Invoke(animationTimer);
    }
    
    /// <summary>
    /// Set animation speed
    /// </summary>
    public void SetAnimationSpeed(float speed)
    {
        globalAnimationSpeed = Mathf.Clamp(speed, 0.1f, 20f);
    }
    
    /// <summary>
    /// Set trail color for current algorithm
    /// </summary>
    public void SetTrailColor(Color color)
    {
        defaultTrailColor = color;
        
        // Update existing trail colors
        foreach (var trail in activeTrails)
        {
            if (trail.lineRenderer != null)
            {
                trail.lineRenderer.startColor = color;
            }
        }
    }
    
    #endregion
    
    #region Animation Update
    
    /// <summary>
    /// Update animation timing and trail visibility
    /// </summary>
    void UpdateAnimation()
    {
        float deltaTime = Time.deltaTime * globalAnimationSpeed;
        animationTimer += deltaTime;
        
        // Check for animation completion
        if (animationTimer >= MaxTime)
        {
            OnAnimationCompleted?.Invoke();
        }
        
        OnTimeUpdated?.Invoke(animationTimer);
    }
    
    /// <summary>
    /// Update all active trails based on current time
    /// </summary>
    void UpdateActiveTrails()
    {
        for (int i = activeTrails.Count - 1; i >= 0; i--)
        {
            ActiveTrail trail = activeTrails[i];
            
            // Check if trail should be visible at current time
            bool shouldBeVisible = animationTimer >= trail.waypoint.startTime && 
                                 animationTimer <= trail.waypoint.endTime;
            
            if (shouldBeVisible && !trail.lineRenderer.gameObject.activeInHierarchy)
            {
                trail.lineRenderer.gameObject.SetActive(true);
                UpdateTrailProgress(trail, animationTimer);
            }
            else if (!shouldBeVisible && trail.lineRenderer.gameObject.activeInHierarchy)
            {
                trail.lineRenderer.gameObject.SetActive(false);
            }
            else if (shouldBeVisible)
            {
                UpdateTrailProgress(trail, animationTimer);
            }
            
            // Remove completed trails
            if (animationTimer > trail.waypoint.endTime + 1f) // Keep visible 1 second after completion
            {
                ReturnTrailToPool(trail.lineRenderer);
                activeTrails.RemoveAt(i);
            }
        }
    }
    
    /// <summary>
    /// Update trail animation progress
    /// </summary>
    void UpdateTrailProgress(ActiveTrail trail, float currentTime)
    {
        float progress = Mathf.Clamp01((currentTime - trail.waypoint.startTime) / 
                                     (trail.waypoint.endTime - trail.waypoint.startTime));
        
        // Animate trail drawing
        Vector3 fromWorld = GeoToWorldPosition(trail.waypoint.fromGeoCoordinate);
        Vector3 toWorld = GeoToWorldPosition(trail.waypoint.toGeoCoordinate);
        Vector3 currentEnd = Vector3.Lerp(fromWorld, toWorld, progress);
        
        trail.lineRenderer.SetPosition(0, fromWorld);
        trail.lineRenderer.SetPosition(1, currentEnd);
        
        // Update alpha based on progress for fade effect
        Color trailColor = trail.waypoint.color;
        trailColor.a = trailAlpha * Mathf.Clamp01(progress * 2f); // Fade in quickly
        trail.lineRenderer.startColor = trailColor;
    }
    
    #endregion
    
    #region Trail Management
    
    /// <summary>
    /// Schedule a trail animation
    /// </summary>
    void ScheduleTrailAnimation(WaypointTrail waypoint)
    {
        if (activeTrails.Count >= maxActiveTrails)
        {
            Debug.LogWarning("Maximum active trails reached");
            return;
        }
        
        LineRenderer lineRenderer = GetTrailFromPool();
        if (lineRenderer == null) return;
        
        // Configure trail for this waypoint
        lineRenderer.startColor = waypoint.color;
        lineRenderer.gameObject.SetActive(false); // Will be activated when time comes
        
        ActiveTrail activeTrail = new ActiveTrail
        {
            waypoint = waypoint,
            lineRenderer = lineRenderer,
            startTime = waypoint.startTime
        };
        
        activeTrails.Add(activeTrail);
    }
    
    /// <summary>
    /// Create instant trail (for player routes)
    /// </summary>
    void CreateInstantTrail(WaypointTrail waypoint)
    {
        LineRenderer lineRenderer = GetTrailFromPool();
        if (lineRenderer == null) return;
        
        Vector3 fromWorld = GeoToWorldPosition(waypoint.fromGeoCoordinate);
        Vector3 toWorld = GeoToWorldPosition(waypoint.toGeoCoordinate);
        
        lineRenderer.SetPosition(0, fromWorld);
        lineRenderer.SetPosition(1, toWorld);
        lineRenderer.startColor = waypoint.color;
        lineRenderer.gameObject.SetActive(true);
        
        ActiveTrail activeTrail = new ActiveTrail
        {
            waypoint = waypoint,
            lineRenderer = lineRenderer,
            startTime = 0f
        };
        
        activeTrails.Add(activeTrail);
    }
    
    /// <summary>
    /// Rebuild trails at specific time (for seeking)
    /// </summary>
    void RebuildTrailsAtTime(float targetTime)
    {
        // Clear current trails
        foreach (var trail in activeTrails)
        {
            ReturnTrailToPool(trail.lineRenderer);
        }
        activeTrails.Clear();
        
        // Recreate trails that should be visible at target time
        foreach (var waypoint in waypoints)
        {
            if (targetTime >= waypoint.startTime && targetTime <= waypoint.endTime)
            {
                LineRenderer lineRenderer = GetTrailFromPool();
                if (lineRenderer != null)
                {
                    lineRenderer.startColor = waypoint.color;
                    lineRenderer.gameObject.SetActive(true);
                    
                    ActiveTrail activeTrail = new ActiveTrail
                    {
                        waypoint = waypoint,
                        lineRenderer = lineRenderer,
                        startTime = waypoint.startTime
                    };
                    
                    activeTrails.Add(activeTrail);
                    UpdateTrailProgress(activeTrail, targetTime);
                }
            }
        }
        
        // Always show player trails
        foreach (var playerWaypoint in playerWaypoints)
        {
            CreateInstantTrail(playerWaypoint);
        }
    }
    
    /// <summary>
    /// Get trail from pool or create new one
    /// </summary>
    LineRenderer GetTrailFromPool()
    {
        if (trailPool.Count > 0)
        {
            return trailPool.Dequeue();
        }
        
        // Create new trail if pool is empty
        var trailObject = new GameObject("DynamicTrail");
        trailObject.transform.SetParent(transform);
        
        var lineRenderer = trailObject.AddComponent<LineRenderer>();
        ConfigureLineRenderer(lineRenderer);
        
        return lineRenderer;
    }
    
    /// <summary>
    /// Return trail to pool for reuse
    /// </summary>
    void ReturnTrailToPool(LineRenderer lineRenderer)
    {
        if (lineRenderer != null)
        {
            lineRenderer.gameObject.SetActive(false);
            trailPool.Enqueue(lineRenderer);
        }
    }
    
    #endregion
    
    #region Performance Management
    
    /// <summary>
    /// Manage performance and LOD
    /// </summary>
    void ManagePerformance()
    {
        // Reset per-second counters
        if (Time.time - lastSecondTime >= 1f)
        {
            waypointsThisSecond = 0;
            lastSecondTime = Time.time;
        }
        
        // LOD: Hide distant trails if enabled
        if (enableLOD && Camera.main != null)
        {
            Vector3 cameraPos = Camera.main.transform.position;
            
            foreach (var trail in activeTrails)
            {
                if (trail.lineRenderer != null && trail.lineRenderer.gameObject.activeInHierarchy)
                {
                    Vector3 trailPos = trail.lineRenderer.GetPosition(0);
                    float distance = Vector3.Distance(cameraPos, trailPos);
                    
                    bool shouldShow = distance <= lodDistance;
                    if (trail.lineRenderer.gameObject.activeInHierarchy != shouldShow)
                    {
                        trail.lineRenderer.gameObject.SetActive(shouldShow);
                    }
                }
            }
        }
    }
    
    #endregion
    
    #region Utility
    
    /// <summary>
    /// Convert geographic coordinates to Unity world position
    /// Should integrate with OnlineMapsController for accurate positioning
    /// </summary>
    Vector3 GeoToWorldPosition(Vector2 geoCoordinate)
    {
        // Simple conversion for now - replace with Online Maps integration
        float x = geoCoordinate.x * 1000f; // Longitude
        float z = geoCoordinate.y * 1000f; // Latitude
        return new Vector3(x, 0.1f, z);
    }
    
    /// <summary>
    /// Get animation statistics
    /// </summary>
    public WaypointSystemStats GetStats()
    {
        return new WaypointSystemStats
        {
            totalWaypoints = waypoints.Count,
            activeTrails = activeTrails.Count,
            currentTime = animationTimer,
            maxTime = MaxTime,
            poolSize = trailPool.Count,
            isPlaying = isPlaying
        };
    }
    
    #endregion
}

#region Data Structures

[System.Serializable]
public struct WaypointTrail
{
    public Vector2 fromGeoCoordinate;
    public Vector2 toGeoCoordinate;
    public float startTime;
    public float endTime;
    public Color color;
    public WaypointType trailType;
}

[System.Serializable]
public struct ActiveTrail
{
    public WaypointTrail waypoint;
    public LineRenderer lineRenderer;
    public float startTime;
}

[System.Serializable]
public struct WaypointSystemStats
{
    public int totalWaypoints;
    public int activeTrails;
    public float currentTime;
    public float maxTime;
    public int poolSize;
    public bool isPlaying;
}

public enum WaypointType
{
    Algorithm,
    Player,
    Route
}

#endregion