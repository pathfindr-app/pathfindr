using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using System;

/// <summary>
/// Core component for spectacular step-by-step pathfinding algorithm visualization
/// Orchestrates node exploration animation, trail effects, and algorithm-specific visual signatures
/// </summary>
public class AlgorithmAnimator : MonoBehaviour
{
    [Header("Animation Settings")]
    [Range(0.1f, 10f)]
    public float animationSpeed = 1f;
    [Range(0.01f, 2f)]
    public float stepDelay = 0.1f;
    public bool autoAdvance = true;
    public bool showNodeValues = true;
    
    [Header("Visual Configuration")]
    public AnimationQuality qualityLevel = AnimationQuality.High;
    public bool enableParticleEffects = true;
    public bool enableScreenEffects = false;
    [Range(0f, 1f)]
    public float effectIntensity = 0.8f;
    
    [Header("Algorithm Colors")]
    public Color aStarColor = new Color(0.2f, 0.8f, 0.3f, 1f);        // Green
    public Color dijkstraColor = new Color(0.2f, 0.4f, 0.9f, 1f);      // Blue  
    public Color greedyColor = new Color(0.9f, 0.8f, 0.2f, 1f);        // Yellow
    public Color bidirectionalColor = new Color(0.9f, 0.2f, 0.3f, 1f); // Red
    
    [Header("Dependencies")]
    public VisualEffectsManager vfxManager;
    public WaypointSystem waypointSystem;
    public NodeVisualizer nodeVisualizer;
    public TimelineManager timelineManager;
    
    // Animation State
    public PathfindingAnimationState State { get; private set; } = PathfindingAnimationState.Stopped;
    public PathfindingAlgorithm.AlgorithmType CurrentAlgorithm { get; private set; }
    public int CurrentStep { get; private set; } = 0;
    public int TotalSteps { get; private set; } = 0;
    public float AnimationProgress => TotalSteps > 0 ? (float)CurrentStep / TotalSteps : 0f;
    
    // Animation Data
    private PathfindingAlgorithm activeAlgorithm;
    private List<PathfindingAnimationFrame> animationFrames = new List<PathfindingAnimationFrame>();
    private Coroutine animationCoroutine;
    private bool isPaused = false;
    
    // Performance Tracking
    private float frameStartTime;
    private List<float> frameTimes = new List<float>();
    private const int FRAME_TIME_SAMPLES = 30;
    
    // Events
    public event Action<int, int> OnStepChanged; // currentStep, totalSteps
    public event Action<PathfindingAnimationFrame> OnFrameAnimated;
    public event Action<PathfindingAlgorithm.AlgorithmType> OnAlgorithmAnimationStarted;
    public event Action OnAnimationCompleted;
    public event Action<bool> OnAnimationPaused;
    
    void Start()
    {
        InitializeAnimator();
    }
    
    void Update()
    {
        HandleInput();
        UpdatePerformanceTracking();
    }
    
    #region Initialization
    
    void InitializeAnimator()
    {
        // Get dependencies if not assigned
        if (vfxManager == null)
            vfxManager = FindObjectOfType<VisualEffectsManager>();
            
        if (waypointSystem == null)
            waypointSystem = FindObjectOfType<WaypointSystem>();
            
        if (nodeVisualizer == null)
            nodeVisualizer = FindObjectOfType<NodeVisualizer>();
            
        if (timelineManager == null)
            timelineManager = FindObjectOfType<TimelineManager>();
        
        // Subscribe to timeline events
        if (timelineManager != null)
        {
            timelineManager.OnTimelineSeek += HandleTimelineSeek;
            timelineManager.OnPlaybackSpeedChanged += HandleSpeedChanged;
        }
        
        Debug.Log("AlgorithmAnimator initialized");
    }
    
    #endregion
    
    #region Animation Control
    
    /// <summary>
    /// Start animating a pathfinding algorithm with spectacular visualization
    /// </summary>
    public void StartAlgorithmAnimation(PathfindingAlgorithm algorithm)
    {
        if (algorithm == null)
        {
            Debug.LogError("Cannot start animation with null algorithm");
            return;
        }
        
        // Stop any existing animation
        StopAnimation();
        
        activeAlgorithm = algorithm;
        CurrentAlgorithm = algorithm.algorithmType;
        
        // Pre-calculate animation frames
        PreparePathfindingAnimationFrames();
        
        // Initialize visual systems
        InitializeVisualization();
        
        // Start animation
        State = PathfindingAnimationState.Playing;
        OnAlgorithmAnimationStarted?.Invoke(CurrentAlgorithm);
        
        if (autoAdvance)
        {
            animationCoroutine = StartCoroutine(AnimateAlgorithmSteps());
        }
        
        Debug.Log($"Started {CurrentAlgorithm} animation with {TotalSteps} steps");
    }
    
    /// <summary>
    /// Stop the current animation
    /// </summary>
    public void StopAnimation()
    {
        if (animationCoroutine != null)
        {
            StopCoroutine(animationCoroutine);
            animationCoroutine = null;
        }
        
        State = PathfindingAnimationState.Stopped;
        CurrentStep = 0;
        isPaused = false;
        
        // Clear visual effects
        ClearAllVisualEffects();
        
        OnStepChanged?.Invoke(CurrentStep, TotalSteps);
    }
    
    /// <summary>
    /// Pause/Resume animation
    /// </summary>
    public void TogglePause()
    {
        if (State != PathfindingAnimationState.Playing && State != PathfindingAnimationState.Paused)
            return;
            
        isPaused = !isPaused;
        State = isPaused ? PathfindingAnimationState.Paused : PathfindingAnimationState.Playing;
        
        OnAnimationPaused?.Invoke(isPaused);
        
        Debug.Log($"Animation {(isPaused ? "paused" : "resumed")}");
    }
    
    /// <summary>
    /// Step through animation manually
    /// </summary>
    public void StepForward()
    {
        if (CurrentStep < TotalSteps - 1)
        {
            CurrentStep++;
            AnimateFrame(CurrentStep);
            OnStepChanged?.Invoke(CurrentStep, TotalSteps);
        }
    }
    
    /// <summary>
    /// Step backwards through animation
    /// </summary>
    public void StepBackward()
    {
        if (CurrentStep > 0)
        {
            CurrentStep--;
            ReverseToFrame(CurrentStep);
            OnStepChanged?.Invoke(CurrentStep, TotalSteps);
        }
    }
    
    /// <summary>
    /// Jump to specific animation frame
    /// </summary>
    public void SeekToFrame(int frameIndex)
    {
        frameIndex = Mathf.Clamp(frameIndex, 0, TotalSteps - 1);
        
        if (frameIndex != CurrentStep)
        {
            // Rebuild animation state up to target frame
            RebuildAnimationToFrame(frameIndex);
            CurrentStep = frameIndex;
            OnStepChanged?.Invoke(CurrentStep, TotalSteps);
        }
    }
    
    #endregion
    
    #region Animation Frames
    
    /// <summary>
    /// Pre-calculate all animation frames for smooth playback
    /// </summary>
    void PreparePathfindingAnimationFrames()
    {
        animationFrames.Clear();
        frameStartTime = Time.time;
        
        // Reset algorithm to initial state
        activeAlgorithm.Reset();
        
        // Record each algorithm step as animation frame
        int stepCount = 0;
        while (!activeAlgorithm.IsFinished() && stepCount < 10000) // Safety limit
        {
            var updatedNodes = activeAlgorithm.NextStep();
            
            if (updatedNodes != null && updatedNodes.Count > 0)
            {
                PathfindingAnimationFrame frame = new PathfindingAnimationFrame
                {
                    stepIndex = stepCount,
                    timestamp = stepCount * stepDelay,
                    updatedNodes = new List<PathfindingNode>(updatedNodes),
                    algorithmState = new AlgorithmState { nodesExplored = stepCount, nodesInQueue = 0 },
                    isPathComplete = activeAlgorithm.IsFinished()
                };
                
                animationFrames.Add(frame);
            }
            
            stepCount++;
        }
        
        TotalSteps = animationFrames.Count;
        CurrentStep = 0;
        
        Debug.Log($"Prepared {TotalSteps} animation frames in {(Time.time - frameStartTime) * 1000f:F1}ms");
    }
    
    /// <summary>
    /// Animate a specific frame with all visual effects
    /// </summary>
    void AnimateFrame(int frameIndex)
    {
        if (frameIndex < 0 || frameIndex >= animationFrames.Count)
            return;
            
        frameStartTime = Time.time;
        
        PathfindingAnimationFrame frame = animationFrames[frameIndex];
        
        // Animate each updated node
        foreach (var node in frame.updatedNodes)
        {
            AnimateNodeExploration(node);
            
            // Add waypoint trail if node has parent
            if (node.parent != null)
            {
                AddWaypointTrail(node.parent, node);
            }
        }
        
        // Handle path completion
        if (frame.isPathComplete && !activeAlgorithm.pathFound)
        {
            AnimatePathCompletion();
        }
        
        // Update UI overlays
        if (nodeVisualizer != null && showNodeValues)
        {
            nodeVisualizer.UpdateNodeValues(frame.updatedNodes);
        }
        
        // Update timeline
        if (timelineManager != null)
        {
            timelineManager.UpdateProgress(AnimationProgress);
        }
        
        OnFrameAnimated?.Invoke(frame);
        
        // Track performance
        float frameTime = Time.time - frameStartTime;
        RecordFrameTime(frameTime);
    }
    
    #endregion
    
    #region Visual Effects
    
    /// <summary>
    /// Initialize all visualization systems
    /// </summary>
    void InitializeVisualization()
    {
        // Clear previous effects
        ClearAllVisualEffects();
        
        // Set algorithm-specific colors
        Color algorithmColor = GetAlgorithmColor(CurrentAlgorithm);
        
        if (vfxManager != null)
        {
            vfxManager.SetAlgorithmColor(algorithmColor);
        }
        
        if (waypointSystem != null)
        {
            waypointSystem.SetTrailColor(algorithmColor);
        }
        
        if (nodeVisualizer != null)
        {
            nodeVisualizer.SetNodeColor(algorithmColor);
        }
    }
    
    /// <summary>
    /// Animate node exploration with algorithm-specific effects
    /// </summary>
    void AnimateNodeExploration(PathfindingNode node)
    {
        if (node == null) return;
        
        // Visual effects based on algorithm type
        switch (CurrentAlgorithm)
        {
            case PathfindingAlgorithm.AlgorithmType.AStar:
                AnimateAStarExploration(node);
                break;
                
            case PathfindingAlgorithm.AlgorithmType.Dijkstra:
                AnimateDijkstraExploration(node);
                break;
                
            case PathfindingAlgorithm.AlgorithmType.Greedy:
                AnimateGreedyExploration(node);
                break;
                
            case PathfindingAlgorithm.AlgorithmType.BidirectionalSearch:
                AnimateBidirectionalExploration(node);
                break;
        }
        
        // Common node visualization
        if (nodeVisualizer != null)
        {
            nodeVisualizer.ShowExploredNode(node);
        }
    }
    
    /// <summary>
    /// A* specific exploration animation - focused green beam toward target
    /// </summary>
    void AnimateAStarExploration(PathfindingNode node)
    {
        if (vfxManager != null)
        {
            vfxManager.CreateFocusedBeamEffect(node.geoCoordinate, aStarColor);
        }
    }
    
    /// <summary>
    /// Dijkstra specific exploration - expanding blue ripple effect
    /// </summary>
    void AnimateDijkstraExploration(PathfindingNode node)
    {
        if (vfxManager != null)
        {
            vfxManager.CreateRippleEffect(node.geoCoordinate, dijkstraColor);
        }
    }
    
    /// <summary>
    /// Greedy specific exploration - aggressive yellow straight-line pursuit
    /// </summary>
    void AnimateGreedyExploration(PathfindingNode node)
    {
        if (vfxManager != null)
        {
            vfxManager.CreatePursuitEffect(node.geoCoordinate, greedyColor);
        }
    }
    
    /// <summary>
    /// Bidirectional specific exploration - red/blue waves meeting
    /// </summary>
    void AnimateBidirectionalExploration(PathfindingNode node)
    {
        if (vfxManager != null)
        {
            Color waveColor = node.searchDirection == SearchDirection.Forward ? 
                bidirectionalColor : Color.blue;
            vfxManager.CreateWaveEffect(node.geoCoordinate, waveColor);
        }
    }
    
    /// <summary>
    /// Add waypoint trail between nodes
    /// </summary>
    void AddWaypointTrail(PathfindingNode fromNode, PathfindingNode toNode)
    {
        if (waypointSystem != null)
        {
            float distance = Vector2.Distance(
                new Vector2((float)fromNode.geoCoordinate.x, (float)fromNode.geoCoordinate.y),
                new Vector2((float)toNode.geoCoordinate.x, (float)toNode.geoCoordinate.y)
            );
            
            float timeAdd = distance * 50000f * (1f / animationSpeed);
            
            waypointSystem.AddWaypoint(fromNode.geoCoordinate, toNode.geoCoordinate, 
                GetAlgorithmColor(CurrentAlgorithm), timeAdd);
        }
    }
    
    /// <summary>
    /// Animate path completion with celebration effects
    /// </summary>
    void AnimatePathCompletion()
    {
        if (vfxManager != null)
        {
            vfxManager.CreatePathCompletionEffect(GetAlgorithmColor(CurrentAlgorithm));
        }
        
        OnAnimationCompleted?.Invoke();
    }
    
    #endregion
    
    #region Animation Coroutine
    
    /// <summary>
    /// Main animation coroutine for automatic playback
    /// </summary>
    IEnumerator AnimateAlgorithmSteps()
    {
        while (CurrentStep < TotalSteps && State == PathfindingAnimationState.Playing)
        {
            // Handle pause
            while (isPaused && State == PathfindingAnimationState.Paused)
            {
                yield return null;
            }
            
            // Check if still playing after pause
            if (State != PathfindingAnimationState.Playing)
                break;
            
            // Animate current frame
            AnimateFrame(CurrentStep);
            
            // Advance to next step
            CurrentStep++;
            OnStepChanged?.Invoke(CurrentStep, TotalSteps);
            
            // Wait for step delay (adjusted by speed)
            float actualDelay = stepDelay / animationSpeed;
            yield return new WaitForSeconds(actualDelay);
        }
        
        // Animation completed
        if (CurrentStep >= TotalSteps)
        {
            State = PathfindingAnimationState.Complete;
            OnAnimationCompleted?.Invoke();
            Debug.Log($"{CurrentAlgorithm} animation completed");
        }
    }
    
    #endregion
    
    #region Utility Methods
    
    Color GetAlgorithmColor(PathfindingAlgorithm.AlgorithmType algorithm)
    {
        return algorithm switch
        {
            PathfindingAlgorithm.AlgorithmType.AStar => aStarColor,
            PathfindingAlgorithm.AlgorithmType.Dijkstra => dijkstraColor,
            PathfindingAlgorithm.AlgorithmType.Greedy => greedyColor,
            PathfindingAlgorithm.AlgorithmType.BidirectionalSearch => bidirectionalColor,
            _ => Color.white
        };
    }
    
    void ClearAllVisualEffects()
    {
        vfxManager?.ClearAll();
        waypointSystem?.ClearAll();
        nodeVisualizer?.ClearAll();
    }
    
    void ReverseToFrame(int frameIndex)
    {
        // Rebuild visualization state by replaying from start
        RebuildAnimationToFrame(frameIndex);
    }
    
    void RebuildAnimationToFrame(int targetFrame)
    {
        ClearAllVisualEffects();
        InitializeVisualization();
        
        // Fast-forward through frames without delays
        for (int i = 0; i <= targetFrame && i < animationFrames.Count; i++)
        {
            AnimateFrame(i);
        }
    }
    
    void HandleInput()
    {
        // Keyboard shortcuts for animation control
        if (Input.GetKeyDown(KeyCode.Space))
            TogglePause();
        else if (Input.GetKeyDown(KeyCode.RightArrow))
            StepForward();
        else if (Input.GetKeyDown(KeyCode.LeftArrow))
            StepBackward();
        else if (Input.GetKeyDown(KeyCode.R))
            StopAnimation();
    }
    
    void HandleTimelineSeek(float normalizedTime)
    {
        int targetFrame = Mathf.RoundToInt(normalizedTime * (TotalSteps - 1));
        SeekToFrame(targetFrame);
    }
    
    void HandleSpeedChanged(float newSpeed)
    {
        animationSpeed = newSpeed;
    }
    
    void UpdatePerformanceTracking()
    {
        // Monitor performance and adjust quality if needed
        if (qualityLevel == AnimationQuality.Auto && frameTimes.Count >= FRAME_TIME_SAMPLES)
        {
            float avgFrameTime = 0f;
            foreach (float time in frameTimes)
                avgFrameTime += time;
            avgFrameTime /= frameTimes.Count;
            
            // Auto-adjust quality based on performance
            if (avgFrameTime > 0.033f) // Below 30fps
            {
                AdjustQualityDown();
            }
            else if (avgFrameTime < 0.016f) // Above 60fps
            {
                AdjustQualityUp();
            }
        }
    }
    
    void RecordFrameTime(float frameTime)
    {
        frameTimes.Add(frameTime);
        if (frameTimes.Count > FRAME_TIME_SAMPLES)
            frameTimes.RemoveAt(0);
    }
    
    void AdjustQualityDown()
    {
        if (enableParticleEffects)
        {
            enableParticleEffects = false;
            Debug.Log("Disabled particle effects for performance");
        }
        else if (effectIntensity > 0.3f)
        {
            effectIntensity *= 0.8f;
            Debug.Log($"Reduced effect intensity to {effectIntensity:F2}");
        }
    }
    
    void AdjustQualityUp()
    {
        if (!enableParticleEffects && effectIntensity > 0.7f)
        {
            enableParticleEffects = true;
            Debug.Log("Re-enabled particle effects");
        }
        else if (effectIntensity < 1f)
        {
            effectIntensity = Mathf.Min(1f, effectIntensity * 1.2f);
            Debug.Log($"Increased effect intensity to {effectIntensity:F2}");
        }
    }
    
    #endregion
}

#region Data Structures

[System.Serializable]
public struct PathfindingAnimationFrame
{
    public int stepIndex;
    public float timestamp;
    public List<PathfindingNode> updatedNodes;
    public AlgorithmState algorithmState;
    public bool isPathComplete;
}

[System.Serializable]
public struct AlgorithmState
{
    public int nodesExplored;
    public int nodesInQueue;
    public float currentCost;
    public bool pathFound;
}

public enum PathfindingAnimationState
{
    Stopped,
    Playing,
    Paused,
    Complete
}

public enum AnimationQuality
{
    Low,
    Medium,
    High,
    Ultra,
    Auto
}



#endregion