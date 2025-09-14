using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using System;

/// <summary>
/// Master coordinator for spectacular pathfinding visualization
/// Integrates all VFX systems to create cohesive algorithm-specific experiences
/// </summary>
public class VisualizationCoordinator : MonoBehaviour
{
    [Header("Core Systems")]
    public AlgorithmAnimator algorithmAnimator;
    public VisualEffectsManager vfxManager;
    public WaypointSystem waypointSystem;
    public NodeVisualizer nodeVisualizer;
    public TimelineManager timelineManager;
    public PathfindingManager pathfindingManager;
    
    [Header("Algorithm Visual Profiles")]
    public AlgorithmVisualProfile aStarProfile;
    public AlgorithmVisualProfile dijkstraProfile;
    public AlgorithmVisualProfile greedyProfile;
    public AlgorithmVisualProfile bidirectionalProfile;
    
    [Header("Master Settings")]
    public bool enableSpectacularMode = true;
    public bool synchronizeAllSystems = true;
    public float globalVisualizationSpeed = 1f;
    [Range(0f, 1f)]
    public float effectIntensity = 1f;
    
    // Current state
    public PathfindingAlgorithm.AlgorithmType CurrentAlgorithm { get; private set; }
    public bool IsVisualizationActive { get; private set; } = false;
    public VisualizationState State { get; private set; } = VisualizationState.Idle;
    
    // Algorithm-specific configurations
    private Dictionary<PathfindingAlgorithm.AlgorithmType, AlgorithmVisualProfile> visualProfiles;
    private AlgorithmVisualProfile currentProfile;
    
    // Performance tracking
    private float lastPerformanceCheck = 0f;
    private List<float> frameTimes = new List<float>();
    private bool autoQualityEnabled = true;
    
    // Events
    public event Action<PathfindingAlgorithm.AlgorithmType> OnAlgorithmVisualizationStarted;
    public event Action OnVisualizationCompleted;
    public event Action<VisualizationState> OnStateChanged;
    
    void Awake()
    {
        InitializeVisualizationCoordinator();
    }
    
    void Start()
    {
        SetupSystemIntegration();
    }
    
    void Update()
    {
        MonitorPerformance();
        
        if (synchronizeAllSystems)
        {
            SynchronizeSystemStates();
        }
    }
    
    #region Initialization
    
    void InitializeVisualizationCoordinator()
    {
        // Auto-find components if not assigned
        FindRequiredComponents();
        
        // Setup algorithm visual profiles
        SetupVisualProfiles();
        
        // Initialize all systems
        InitializeAllSystems();
        
        Debug.Log("VisualizationCoordinator initialized - ready for spectacular pathfinding visualization");
    }
    
    void FindRequiredComponents()
    {
        if (algorithmAnimator == null)
            algorithmAnimator = FindObjectOfType<AlgorithmAnimator>();
            
        if (vfxManager == null)
            vfxManager = FindObjectOfType<VisualEffectsManager>();
            
        if (waypointSystem == null)
            waypointSystem = FindObjectOfType<WaypointSystem>();
            
        if (nodeVisualizer == null)
            nodeVisualizer = FindObjectOfType<NodeVisualizer>();
            
        if (timelineManager == null)
            timelineManager = FindObjectOfType<TimelineManager>();
            
        if (pathfindingManager == null)
            pathfindingManager = FindObjectOfType<PathfindingManager>();
    }
    
    void SetupVisualProfiles()
    {
        visualProfiles = new Dictionary<PathfindingAlgorithm.AlgorithmType, AlgorithmVisualProfile>();
        
        // A* Profile - Green focused intelligence
        if (aStarProfile.algorithmType == PathfindingAlgorithm.AlgorithmType.None)
        {
            aStarProfile = CreateDefaultAStarProfile();
        }
        visualProfiles[PathfindingAlgorithm.AlgorithmType.AStar] = aStarProfile;
        
        // Dijkstra Profile - Blue expanding exploration
        if (dijkstraProfile.algorithmType == PathfindingAlgorithm.AlgorithmType.None)
        {
            dijkstraProfile = CreateDefaultDijkstraProfile();
        }
        visualProfiles[PathfindingAlgorithm.AlgorithmType.Dijkstra] = dijkstraProfile;
        
        // Greedy Profile - Yellow aggressive pursuit
        if (greedyProfile.algorithmType == PathfindingAlgorithm.AlgorithmType.None)
        {
            greedyProfile = CreateDefaultGreedyProfile();
        }
        visualProfiles[PathfindingAlgorithm.AlgorithmType.Greedy] = greedyProfile;
        
        // Bidirectional Profile - Red/Blue convergence
        if (bidirectionalProfile.algorithmType == PathfindingAlgorithm.AlgorithmType.None)
        {
            bidirectionalProfile = CreateDefaultBidirectionalProfile();
        }
        visualProfiles[PathfindingAlgorithm.AlgorithmType.BidirectionalSearch] = bidirectionalProfile;
        
        Debug.Log($"Setup {visualProfiles.Count} algorithm visual profiles");
    }
    
    void InitializeAllSystems()
    {
        // Verify all systems are ready
        if (algorithmAnimator == null || vfxManager == null || waypointSystem == null || 
            nodeVisualizer == null || timelineManager == null)
        {
            Debug.LogError("VisualizationCoordinator: Missing required components!");
            return;
        }
        
        // Set initial state
        State = VisualizationState.Ready;
        OnStateChanged?.Invoke(State);
    }
    
    #endregion
    
    #region Main Visualization Control
    
    /// <summary>
    /// Start spectacular visualization for specified algorithm
    /// </summary>
    public void StartVisualization(PathfindingAlgorithm algorithm)
    {
        if (algorithm == null)
        {
            Debug.LogError("Cannot start visualization with null algorithm");
            return;
        }
        
        if (IsVisualizationActive)
        {
            Debug.LogWarning("Stopping current visualization to start new one");
            StopVisualization();
        }
        
        CurrentAlgorithm = algorithm.algorithmType;
        currentProfile = visualProfiles[CurrentAlgorithm];
        IsVisualizationActive = true;
        State = VisualizationState.Running;
        
        // Configure all systems for this algorithm
        ConfigureSystemsForAlgorithm(currentProfile);
        
        // Start algorithm animation
        algorithmAnimator.StartAlgorithmAnimation(algorithm);
        
        // Initialize timeline
        float estimatedDuration = EstimateVisualizationDuration(algorithm);
        timelineManager.InitializeTimeline(estimatedDuration);
        
        OnAlgorithmVisualizationStarted?.Invoke(CurrentAlgorithm);
        OnStateChanged?.Invoke(State);
        
        Debug.Log($"Started spectacular {CurrentAlgorithm} visualization");
    }
    
    /// <summary>
    /// Stop current visualization
    /// </summary>
    public void StopVisualization()
    {
        if (!IsVisualizationActive) return;
        
        IsVisualizationActive = false;
        State = VisualizationState.Stopping;
        
        // Stop all systems
        algorithmAnimator?.StopAnimation();
        waypointSystem?.StopAnimation();
        timelineManager?.Pause();
        
        // Clear visual effects
        ClearAllVisualEffects();
        
        State = VisualizationState.Ready;
        OnStateChanged?.Invoke(State);
        
        Debug.Log("Visualization stopped");
    }
    
    /// <summary>
    /// Pause/Resume visualization
    /// </summary>
    public void TogglePauseVisualization()
    {
        if (!IsVisualizationActive) return;
        
        bool isPaused = algorithmAnimator.State == PathfindingAnimationState.Paused;
        
        if (isPaused)
        {
            State = VisualizationState.Running;
            algorithmAnimator.TogglePause();
            timelineManager.Play();
        }
        else
        {
            State = VisualizationState.Paused;
            algorithmAnimator.TogglePause();
            timelineManager.Pause();
        }
        
        OnStateChanged?.Invoke(State);
    }
    
    #endregion
    
    #region System Configuration
    
    /// <summary>
    /// Configure all visualization systems for specific algorithm
    /// </summary>
    void ConfigureSystemsForAlgorithm(AlgorithmVisualProfile profile)
    {
        // Configure colors across all systems
        Color algorithmColor = profile.primaryColor;
        
        vfxManager.SetAlgorithmColor(algorithmColor);
        waypointSystem.SetTrailColor(algorithmColor);
        nodeVisualizer.SetNodeColor(algorithmColor);
        
        // Configure algorithm-specific settings
        algorithmAnimator.stepDelay = profile.stepDelay;
        algorithmAnimator.effectIntensity = profile.effectIntensity * effectIntensity;
        algorithmAnimator.enableParticleEffects = profile.enableParticleEffects && enableSpectacularMode;
        
        waypointSystem.trailWidth = profile.trailWidth;
        waypointSystem.distanceTimeMultiplier = profile.distanceTimeMultiplier;
        
        nodeVisualizer.showHeuristicValues = profile.showHeuristicValues;
        nodeVisualizer.nodeScalePulse = profile.nodeScalePulse;
        
        // Apply performance settings
        ApplyPerformanceSettings(profile);
        
        Debug.Log($"Configured all systems for {profile.algorithmType} visualization");
    }
    
    void ApplyPerformanceSettings(AlgorithmVisualProfile profile)
    {
        // Adjust settings based on performance profile
        if (profile.performanceProfile == PerformanceProfile.High)
        {
            vfxManager.enableParticleEffects = enableSpectacularMode;
            nodeVisualizer.enableEducationalMode = true;
            waypointSystem.enableTrailAnimation = true;
        }
        else if (profile.performanceProfile == PerformanceProfile.Medium)
        {
            vfxManager.enableParticleEffects = enableSpectacularMode;
            nodeVisualizer.enableEducationalMode = true;
            waypointSystem.enableLOD = true;
        }
        else // Low performance
        {
            vfxManager.enableParticleEffects = false;
            nodeVisualizer.enableEducationalMode = false;
            waypointSystem.enableLOD = true;
            waypointSystem.maxActiveTrails = 50;
        }
    }
    
    #endregion
    
    #region System Integration
    
    void SetupSystemIntegration()
    {
        // Connect algorithm animator events
        if (algorithmAnimator != null)
        {
            algorithmAnimator.OnAnimationCompleted += HandleAnimationCompleted;
            algorithmAnimator.OnFrameAnimated += HandleFrameAnimated;
        }
        
        // Connect timeline events  
        if (timelineManager != null)
        {
            timelineManager.OnPlayPauseToggled += HandlePlayPauseToggled;
            timelineManager.OnTimelineSeek += HandleTimelineSeek;
        }
        
        // Connect pathfinding events
        if (pathfindingManager != null)
        {
            pathfindingManager.OnAlgorithmCompleted += HandlePathfindingCompleted;
        }
    }
    
    void SynchronizeSystemStates()
    {
        if (!IsVisualizationActive) return;
        
        // Synchronize playback speeds
        float masterSpeed = globalVisualizationSpeed * timelineManager.PlaybackSpeed;
        
        if (algorithmAnimator.animationSpeed != masterSpeed)
        {
            algorithmAnimator.animationSpeed = masterSpeed;
        }
        
        if (waypointSystem.globalAnimationSpeed != masterSpeed)
        {
            waypointSystem.SetAnimationSpeed(masterSpeed);
        }
        
        // Synchronize timing
        if (Math.Abs(timelineManager.CurrentTime - waypointSystem.CurrentTime) > 0.1f)
        {
            waypointSystem.SeekToTime(timelineManager.CurrentTime);
        }
    }
    
    #endregion
    
    #region Performance Monitoring
    
    void MonitorPerformance()
    {
        if (!autoQualityEnabled) return;
        
        if (Time.time - lastPerformanceCheck > 1f)
        {
            float avgFrameTime = CalculateAverageFrameTime();
            
            if (avgFrameTime > 0.033f) // Below 30 FPS
            {
                ReduceQuality();
            }
            else if (avgFrameTime < 0.016f && effectIntensity < 1f) // Above 60 FPS
            {
                IncreaseQuality();
            }
            
            lastPerformanceCheck = Time.time;
        }
        
        // Track frame times
        frameTimes.Add(Time.unscaledDeltaTime);
        if (frameTimes.Count > 60) // Keep last 60 frames
        {
            frameTimes.RemoveAt(0);
        }
    }
    
    float CalculateAverageFrameTime()
    {
        if (frameTimes.Count == 0) return 0f;
        
        float total = 0f;
        foreach (float frameTime in frameTimes)
        {
            total += frameTime;
        }
        return total / frameTimes.Count;
    }
    
    void ReduceQuality()
    {
        effectIntensity = Mathf.Max(0.3f, effectIntensity * 0.9f);
        
        if (vfxManager != null)
        {
            vfxManager.enableParticleEffects = effectIntensity > 0.7f;
        }
        
        Debug.Log($"Reduced visualization quality - intensity: {effectIntensity:F2}");
    }
    
    void IncreaseQuality()
    {
        effectIntensity = Mathf.Min(1f, effectIntensity * 1.1f);
        
        if (vfxManager != null && enableSpectacularMode)
        {
            vfxManager.enableParticleEffects = effectIntensity > 0.5f;
        }
        
        Debug.Log($"Increased visualization quality - intensity: {effectIntensity:F2}");
    }
    
    #endregion
    
    #region Event Handlers
    
    void HandleAnimationCompleted()
    {
        State = VisualizationState.Complete;
        OnVisualizationCompleted?.Invoke();
        OnStateChanged?.Invoke(State);
        
        Debug.Log("Visualization animation completed");
    }
    
    void HandleFrameAnimated(PathfindingAnimationFrame frame)
    {
        // Coordinate frame-specific effects between systems
        if (currentProfile.enableFrameSynchronization)
        {
            SynchronizeFrameEffects(frame);
        }
    }
    
    void HandlePlayPauseToggled(bool isPlaying)
    {
        if (isPlaying)
        {
            State = VisualizationState.Running;
        }
        else
        {
            State = VisualizationState.Paused;
        }
        OnStateChanged?.Invoke(State);
    }
    
    void HandleTimelineSeek(float targetTime)
    {
        // Coordinate seeking across all systems
        if (waypointSystem != null)
        {
            waypointSystem.SeekToTime(targetTime);
        }
    }
    
    void HandlePathfindingCompleted(AlgorithmStats stats)
    {
        // Algorithm execution completed - transition to path visualization
        if (currentProfile.showPathCompletionCelebration)
        {
            StartPathCompletionCelebration();
        }
    }
    
    #endregion
    
    #region Special Effects
    
    void SynchronizeFrameEffects(PathfindingAnimationFrame frame)
    {
        // Create synchronized effects across all systems for this frame
        foreach (var node in frame.updatedNodes)
        {
            // Coordinate node effects
            if (currentProfile.enableNodeBursts)
            {
                vfxManager.CreateNodeExplorationBurst(node.geoCoordinate, currentProfile.primaryColor);
            }
            
            // Show educational overlays
            if (currentProfile.showHeuristicValues)
            {
                nodeVisualizer.ShowExploredNode(node);
            }
        }
    }
    
    void StartPathCompletionCelebration()
    {
        if (vfxManager != null)
        {
            vfxManager.CreatePathCompletionEffect(currentProfile.celebrationColor);
        }
        
        Debug.Log("Path completion celebration started!");
    }
    
    void ClearAllVisualEffects()
    {
        vfxManager?.ClearAll();
        waypointSystem?.ClearAll();
        nodeVisualizer?.ClearAll();
    }
    
    #endregion
    
    #region Utility
    
    float EstimateVisualizationDuration(PathfindingAlgorithm algorithm)
    {
        // Estimate based on algorithm complexity and graph size
        float baseTime = 10f; // Base 10 seconds
        
        // Adjust for algorithm type
        switch (algorithm.algorithmType)
        {
            case PathfindingAlgorithm.AlgorithmType.AStar:
                return baseTime * 0.8f; // A* is efficient
            case PathfindingAlgorithm.AlgorithmType.Dijkstra:
                return baseTime * 1.2f; // Dijkstra explores more
            case PathfindingAlgorithm.AlgorithmType.Greedy:
                return baseTime * 0.6f; // Greedy is fast but may fail
            case PathfindingAlgorithm.AlgorithmType.BidirectionalSearch:
                return baseTime * 1.0f; // Bidirectional is variable
            default:
                return baseTime;
        }
    }
    
    /// <summary>
    /// Get comprehensive visualization statistics
    /// </summary>
    public VisualizationStats GetVisualizationStats()
    {
        return new VisualizationStats
        {
            isActive = IsVisualizationActive,
            currentAlgorithm = CurrentAlgorithm,
            state = State,
            effectIntensity = effectIntensity,
            globalSpeed = globalVisualizationSpeed,
            averageFrameTime = CalculateAverageFrameTime(),
            activeNodes = nodeVisualizer?.GetStats().activeNodes ?? 0,
            activeTrails = waypointSystem?.GetStats().activeTrails ?? 0
        };
    }
    
    #endregion
    
    #region Default Profile Creation
    
    AlgorithmVisualProfile CreateDefaultAStarProfile()
    {
        return new AlgorithmVisualProfile
        {
            algorithmType = PathfindingAlgorithm.AlgorithmType.AStar,
            primaryColor = new Color(0.2f, 0.8f, 0.3f, 1f), // Green
            secondaryColor = new Color(0.6f, 1f, 0.6f, 0.6f),
            celebrationColor = new Color(0.2f, 1f, 0.3f, 1f),
            stepDelay = 0.08f,
            effectIntensity = 1f,
            trailWidth = 0.05f,
            nodeScalePulse = 1.3f,
            distanceTimeMultiplier = 45000f,
            enableParticleEffects = true,
            showHeuristicValues = true,
            enableNodeBursts = true,
            showPathCompletionCelebration = true,
            enableFrameSynchronization = true,
            performanceProfile = PerformanceProfile.High
        };
    }
    
    AlgorithmVisualProfile CreateDefaultDijkstraProfile()
    {
        return new AlgorithmVisualProfile
        {
            algorithmType = PathfindingAlgorithm.AlgorithmType.Dijkstra,
            primaryColor = new Color(0.2f, 0.4f, 0.9f, 1f), // Blue
            secondaryColor = new Color(0.6f, 0.6f, 1f, 0.6f),
            celebrationColor = new Color(0.2f, 0.4f, 1f, 1f),
            stepDelay = 0.1f,
            effectIntensity = 0.9f,
            trailWidth = 0.06f,
            nodeScalePulse = 1.2f,
            distanceTimeMultiplier = 50000f,
            enableParticleEffects = true,
            showHeuristicValues = true,
            enableNodeBursts = true,
            showPathCompletionCelebration = true,
            enableFrameSynchronization = true,
            performanceProfile = PerformanceProfile.High
        };
    }
    
    AlgorithmVisualProfile CreateDefaultGreedyProfile()
    {
        return new AlgorithmVisualProfile
        {
            algorithmType = PathfindingAlgorithm.AlgorithmType.Greedy,
            primaryColor = new Color(0.9f, 0.8f, 0.2f, 1f), // Yellow
            secondaryColor = new Color(1f, 1f, 0.6f, 0.6f),
            celebrationColor = new Color(1f, 0.8f, 0.2f, 1f),
            stepDelay = 0.06f,
            effectIntensity = 1.1f,
            trailWidth = 0.04f,
            nodeScalePulse = 1.4f,
            distanceTimeMultiplier = 40000f,
            enableParticleEffects = true,
            showHeuristicValues = true,
            enableNodeBursts = true,
            showPathCompletionCelebration = false, // May not find optimal path
            enableFrameSynchronization = true,
            performanceProfile = PerformanceProfile.Medium
        };
    }
    
    AlgorithmVisualProfile CreateDefaultBidirectionalProfile()
    {
        return new AlgorithmVisualProfile
        {
            algorithmType = PathfindingAlgorithm.AlgorithmType.BidirectionalSearch,
            primaryColor = new Color(0.9f, 0.2f, 0.3f, 1f), // Red
            secondaryColor = new Color(0.2f, 0.4f, 0.9f, 1f), // Blue for reverse
            celebrationColor = new Color(0.8f, 0.2f, 0.8f, 1f), // Purple when they meet
            stepDelay = 0.09f,
            effectIntensity = 1.2f,
            trailWidth = 0.055f,
            nodeScalePulse = 1.25f,
            distanceTimeMultiplier = 48000f,
            enableParticleEffects = true,
            showHeuristicValues = true,
            enableNodeBursts = true,
            showPathCompletionCelebration = true,
            enableFrameSynchronization = true,
            performanceProfile = PerformanceProfile.High
        };
    }
    
    #endregion
}

#region Data Structures

[System.Serializable]
public struct AlgorithmVisualProfile
{
    public PathfindingAlgorithm.AlgorithmType algorithmType;
    public Color primaryColor;
    public Color secondaryColor;
    public Color celebrationColor;
    public float stepDelay;
    public float effectIntensity;
    public float trailWidth;
    public float nodeScalePulse;
    public float distanceTimeMultiplier;
    public bool enableParticleEffects;
    public bool showHeuristicValues;
    public bool enableNodeBursts;
    public bool showPathCompletionCelebration;
    public bool enableFrameSynchronization;
    public PerformanceProfile performanceProfile;
}

[System.Serializable]
public struct VisualizationStats
{
    public bool isActive;
    public PathfindingAlgorithm.AlgorithmType currentAlgorithm;
    public VisualizationState state;
    public float effectIntensity;
    public float globalSpeed;
    public float averageFrameTime;
    public int activeNodes;
    public int activeTrails;
}

public enum VisualizationState
{
    Idle,
    Ready,
    Running,
    Paused,
    Stopping,
    Complete
}

public enum PerformanceProfile
{
    Low,
    Medium,
    High
}

#endregion