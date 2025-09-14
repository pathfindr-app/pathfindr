using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;
using TMPro;
using UnityEngine.EventSystems;
using System;

/// <summary>
/// Advanced timeline controls for pathfinding algorithm playback
/// Provides scrubbing, speed control, and frame-perfect seeking like video editing software
/// </summary>
public class TimelineManager : MonoBehaviour, IPointerDownHandler, IPointerUpHandler, IDragHandler
{
    [Header("Timeline UI")]
    public Slider timelineSlider;
    public Button playPauseButton;
    public Button stepBackwardButton;
    public Button stepForwardButton;
    public Button resetButton;
    public Slider speedSlider;
    public TextMeshProUGUI currentTimeText;
    public TextMeshProUGUI totalTimeText;
    public TextMeshProUGUI speedText;
    
    [Header("Visual Feedback")]
    public Image playIcon;
    public Image pauseIcon;
    public Color timelineActiveColor = Color.green;
    public Color timelineInactiveColor = Color.gray;
    public RectTransform playheadIndicator;
    
    [Header("Timeline Configuration")]
    [Range(0.1f, 10f)]
    public float defaultPlaybackSpeed = 1f;
    [Range(0.01f, 20f)]
    public float maxPlaybackSpeed = 10f;
    public bool enableKeyboardShortcuts = true;
    public bool snapToFrames = true;
    public float frameSnappingThreshold = 0.1f;
    
    // Timeline State
    public bool IsPlaying { get; private set; } = false;
    public bool IsScrubbing { get; private set; } = false;
    public float CurrentTime { get; private set; } = 0f;
    public float TotalDuration { get; private set; } = 0f;
    public float PlaybackSpeed { get; private set; } = 1f;
    public float Progress => TotalDuration > 0f ? CurrentTime / TotalDuration : 0f;
    
    // Animation Integration
    private AlgorithmAnimator algorithmAnimator;
    private WaypointSystem waypointSystem;
    private List<float> keyframeTimes = new List<float>();
    
    // Scrubbing state
    private bool wasPlayingBeforeScrub = false;
    private float lastScrubTime = 0f;
    private Vector2 scrubStartPosition;
    
    // Performance tracking
    private float lastUpdateTime = 0f;
    private const float UPDATE_INTERVAL = 0.033f; // 30fps UI updates
    
    // Events
    public event Action<float> OnTimelineSeek;
    public event Action<float> OnPlaybackSpeedChanged;
    public event Action<bool> OnPlayPauseToggled;
    public event Action OnTimelineReset;
    
    void Start()
    {
        InitializeTimelineManager();
    }
    
    void Update()
    {
        HandleKeyboardInput();
        UpdateTimelineDisplay();
        
        if (IsPlaying && !IsScrubbing)
        {
            AdvancePlayback();
        }
    }
    
    #region Initialization
    
    void InitializeTimelineManager()
    {
        // Get dependencies
        algorithmAnimator = FindObjectOfType<AlgorithmAnimator>();
        waypointSystem = FindObjectOfType<WaypointSystem>();
        
        // Setup UI components
        SetupSliders();
        SetupButtons();
        
        // Initialize values
        PlaybackSpeed = defaultPlaybackSpeed;
        UpdateSpeedDisplay();
        
        // Subscribe to algorithm events
        if (algorithmAnimator != null)
        {
            algorithmAnimator.OnStepChanged += HandleStepChanged;
            algorithmAnimator.OnAnimationCompleted += HandleAnimationCompleted;
        }
        
        if (waypointSystem != null)
        {
            waypointSystem.OnTimeUpdated += HandleTimeUpdated;
        }
        
        Debug.Log("TimelineManager initialized with advanced playback controls");
    }
    
    void SetupSliders()
    {
        if (timelineSlider != null)
        {
            timelineSlider.minValue = 0f;
            timelineSlider.maxValue = 1f;
            timelineSlider.value = 0f;
            timelineSlider.onValueChanged.AddListener(HandleTimelineSliderChanged);
        }
        
        if (speedSlider != null)
        {
            speedSlider.minValue = 0.1f;
            speedSlider.maxValue = maxPlaybackSpeed;
            speedSlider.value = defaultPlaybackSpeed;
            speedSlider.onValueChanged.AddListener(HandleSpeedSliderChanged);
        }
    }
    
    void SetupButtons()
    {
        if (playPauseButton != null)
        {
            playPauseButton.onClick.AddListener(TogglePlayPause);
        }
        
        if (stepBackwardButton != null)
        {
            stepBackwardButton.onClick.AddListener(StepBackward);
        }
        
        if (stepForwardButton != null)
        {
            stepForwardButton.onClick.AddListener(StepForward);
        }
        
        if (resetButton != null)
        {
            resetButton.onClick.AddListener(ResetTimeline);
        }
    }
    
    #endregion
    
    #region Playback Control
    
    /// <summary>
    /// Toggle play/pause state
    /// </summary>
    public void TogglePlayPause()
    {
        IsPlaying = !IsPlaying;
        
        UpdatePlayPauseButton();
        OnPlayPauseToggled?.Invoke(IsPlaying);
        
        // Control algorithm animator
        if (algorithmAnimator != null)
        {
            algorithmAnimator.TogglePause();
        }
        
        Debug.Log($"Playback {(IsPlaying ? "started" : "paused")}");
    }
    
    /// <summary>
    /// Start playback
    /// </summary>
    public void Play()
    {
        if (!IsPlaying)
        {
            IsPlaying = true;
            UpdatePlayPauseButton();
            OnPlayPauseToggled?.Invoke(true);
            
            if (algorithmAnimator != null && algorithmAnimator.State == PathfindingAnimationState.Paused)
            {
                algorithmAnimator.TogglePause();
            }
        }
    }
    
    /// <summary>
    /// Pause playback
    /// </summary>
    public void Pause()
    {
        if (IsPlaying)
        {
            IsPlaying = false;
            UpdatePlayPauseButton();
            OnPlayPauseToggled?.Invoke(false);
            
            if (algorithmAnimator != null && algorithmAnimator.State == PathfindingAnimationState.Playing)
            {
                algorithmAnimator.TogglePause();
            }
        }
    }
    
    /// <summary>
    /// Step backward one frame
    /// </summary>
    public void StepBackward()
    {
        Pause();
        
        if (algorithmAnimator != null)
        {
            algorithmAnimator.StepBackward();
        }
        else if (snapToFrames && keyframeTimes.Count > 0)
        {
            SeekToPreviousKeyframe();
        }
        else
        {
            float newTime = Mathf.Max(0f, CurrentTime - 0.1f);
            SeekToTime(newTime);
        }
    }
    
    /// <summary>
    /// Step forward one frame
    /// </summary>
    public void StepForward()
    {
        Pause();
        
        if (algorithmAnimator != null)
        {
            algorithmAnimator.StepForward();
        }
        else if (snapToFrames && keyframeTimes.Count > 0)
        {
            SeekToNextKeyframe();
        }
        else
        {
            float newTime = Mathf.Min(TotalDuration, CurrentTime + 0.1f);
            SeekToTime(newTime);
        }
    }
    
    /// <summary>
    /// Reset timeline to beginning
    /// </summary>
    public void ResetTimeline()
    {
        Pause();
        SeekToTime(0f);
        OnTimelineReset?.Invoke();
        
        Debug.Log("Timeline reset to beginning");
    }
    
    /// <summary>
    /// Seek to specific time in seconds
    /// </summary>
    public void SeekToTime(float targetTime)
    {
        CurrentTime = Mathf.Clamp(targetTime, 0f, TotalDuration);
        
        // Update UI immediately
        UpdateTimelineSlider();
        UpdateTimeDisplay();
        
        // Notify listeners
        OnTimelineSeek?.Invoke(CurrentTime);
        
        // Update animation systems
        if (algorithmAnimator != null)
        {
            int targetFrame = Mathf.RoundToInt((CurrentTime / TotalDuration) * algorithmAnimator.TotalSteps);
            algorithmAnimator.SeekToFrame(targetFrame);
        }
        
        if (waypointSystem != null)
        {
            waypointSystem.SeekToTime(CurrentTime);
        }
    }
    
    /// <summary>
    /// Seek to normalized progress (0-1)
    /// </summary>
    public void SeekToProgress(float normalizedProgress)
    {
        float targetTime = Mathf.Clamp01(normalizedProgress) * TotalDuration;
        SeekToTime(targetTime);
    }
    
    #endregion
    
    #region Speed Control
    
    /// <summary>
    /// Set playback speed
    /// </summary>
    public void SetPlaybackSpeed(float speed)
    {
        PlaybackSpeed = Mathf.Clamp(speed, 0.1f, maxPlaybackSpeed);
        
        UpdateSpeedDisplay();
        OnPlaybackSpeedChanged?.Invoke(PlaybackSpeed);
        
        // Update algorithm animator speed
        if (algorithmAnimator != null)
        {
            algorithmAnimator.animationSpeed = PlaybackSpeed;
        }
        
        // Update waypoint system speed
        if (waypointSystem != null)
        {
            waypointSystem.SetAnimationSpeed(PlaybackSpeed);
        }
    }
    
    /// <summary>
    /// Increase playback speed
    /// </summary>
    public void IncreaseSpeed()
    {
        float newSpeed = PlaybackSpeed * 1.5f;
        SetPlaybackSpeed(newSpeed);
    }
    
    /// <summary>
    /// Decrease playback speed
    /// </summary>
    public void DecreaseSpeed()
    {
        float newSpeed = PlaybackSpeed / 1.5f;
        SetPlaybackSpeed(newSpeed);
    }
    
    #endregion
    
    #region Timeline Setup
    
    /// <summary>
    /// Initialize timeline with animation data
    /// </summary>
    public void InitializeTimeline(float totalDuration, List<float> keyframes = null)
    {
        TotalDuration = totalDuration;
        CurrentTime = 0f;
        
        if (keyframes != null)
        {
            keyframeTimes = new List<float>(keyframes);
        }
        
        UpdateTimelineSlider();
        UpdateTimeDisplay();
        
        Debug.Log($"Timeline initialized: {totalDuration:F1}s duration, {keyframeTimes.Count} keyframes");
    }
    
    /// <summary>
    /// Update progress from external source
    /// </summary>
    public void UpdateProgress(float normalizedProgress)
    {
        if (!IsScrubbing) // Don't override during manual scrubbing
        {
            CurrentTime = normalizedProgress * TotalDuration;
            UpdateTimelineSlider();
        }
    }
    
    #endregion
    
    #region Scrubbing (Mouse/Touch Interaction)
    
    public void OnPointerDown(PointerEventData eventData)
    {
        if (timelineSlider == null) return;
        
        IsScrubbing = true;
        wasPlayingBeforeScrub = IsPlaying;
        scrubStartPosition = eventData.position;
        
        // Pause playback during scrubbing
        if (IsPlaying)
        {
            Pause();
        }
        
        // Handle initial click position
        HandleScrubbing(eventData);
    }
    
    public void OnDrag(PointerEventData eventData)
    {
        if (!IsScrubbing) return;
        HandleScrubbing(eventData);
    }
    
    public void OnPointerUp(PointerEventData eventData)
    {
        if (!IsScrubbing) return;
        
        IsScrubbing = false;
        
        // Resume playback if it was playing before scrubbing
        if (wasPlayingBeforeScrub)
        {
            Play();
        }
        
        Debug.Log($"Scrubbing completed at time: {CurrentTime:F2}s");
    }
    
    void HandleScrubbing(PointerEventData eventData)
    {
        if (timelineSlider == null) return;
        
        // Convert screen position to slider value
        RectTransform sliderRect = timelineSlider.GetComponent<RectTransform>();
        Vector2 localPoint;
        RectTransformUtility.ScreenPointToLocalPointInRectangle(
            sliderRect, eventData.position, eventData.pressEventCamera, out localPoint);
        
        float normalizedPosition = Mathf.InverseLerp(-sliderRect.rect.width * 0.5f, 
            sliderRect.rect.width * 0.5f, localPoint.x);
        
        // Apply frame snapping if enabled
        if (snapToFrames)
        {
            normalizedPosition = SnapToNearestKeyframe(normalizedPosition);
        }
        
        // Update timeline
        SeekToProgress(normalizedPosition);
        
        lastScrubTime = Time.time;
    }
    
    float SnapToNearestKeyframe(float normalizedPosition)
    {
        if (keyframeTimes.Count == 0) return normalizedPosition;
        
        float targetTime = normalizedPosition * TotalDuration;
        float nearestKeyframe = keyframeTimes[0];
        float minDistance = Mathf.Abs(targetTime - nearestKeyframe);
        
        foreach (float keyframeTime in keyframeTimes)
        {
            float distance = Mathf.Abs(targetTime - keyframeTime);
            if (distance < minDistance)
            {
                minDistance = distance;
                nearestKeyframe = keyframeTime;
            }
        }
        
        // Only snap if close enough
        if (minDistance < frameSnappingThreshold)
        {
            return nearestKeyframe / TotalDuration;
        }
        
        return normalizedPosition;
    }
    
    #endregion
    
    #region Keyframe Navigation
    
    void SeekToNextKeyframe()
    {
        if (keyframeTimes.Count == 0) return;
        
        float nextKeyframe = TotalDuration;
        foreach (float keyframeTime in keyframeTimes)
        {
            if (keyframeTime > CurrentTime + 0.01f) // Small epsilon to avoid same frame
            {
                nextKeyframe = keyframeTime;
                break;
            }
        }
        
        SeekToTime(nextKeyframe);
    }
    
    void SeekToPreviousKeyframe()
    {
        if (keyframeTimes.Count == 0) return;
        
        float prevKeyframe = 0f;
        for (int i = keyframeTimes.Count - 1; i >= 0; i--)
        {
            if (keyframeTimes[i] < CurrentTime - 0.01f) // Small epsilon
            {
                prevKeyframe = keyframeTimes[i];
                break;
            }
        }
        
        SeekToTime(prevKeyframe);
    }
    
    #endregion
    
    #region UI Updates
    
    void UpdateTimelineDisplay()
    {
        if (Time.time - lastUpdateTime < UPDATE_INTERVAL) return;
        
        UpdateTimelineSlider();
        UpdateTimeDisplay();
        UpdatePlayheadPosition();
        
        lastUpdateTime = Time.time;
    }
    
    void UpdateTimelineSlider()
    {
        if (timelineSlider != null && !IsScrubbing)
        {
            timelineSlider.value = Progress;
            
            // Color feedback
            var colors = timelineSlider.colors;
            colors.normalColor = IsPlaying ? timelineActiveColor : timelineInactiveColor;
            timelineSlider.colors = colors;
        }
    }
    
    void UpdateTimeDisplay()
    {
        if (currentTimeText != null)
        {
            currentTimeText.text = FormatTime(CurrentTime);
        }
        
        if (totalTimeText != null)
        {
            totalTimeText.text = FormatTime(TotalDuration);
        }
    }
    
    void UpdateSpeedDisplay()
    {
        if (speedText != null)
        {
            speedText.text = $"{PlaybackSpeed:F1}x";
        }
        
        if (speedSlider != null)
        {
            speedSlider.value = PlaybackSpeed;
        }
    }
    
    void UpdatePlayPauseButton()
    {
        if (playPauseButton == null) return;
        
        if (playIcon != null) playIcon.gameObject.SetActive(!IsPlaying);
        if (pauseIcon != null) pauseIcon.gameObject.SetActive(IsPlaying);
    }
    
    void UpdatePlayheadPosition()
    {
        if (playheadIndicator != null && timelineSlider != null)
        {
            RectTransform sliderRect = timelineSlider.GetComponent<RectTransform>();
            float xPos = Mathf.Lerp(-sliderRect.rect.width * 0.5f, sliderRect.rect.width * 0.5f, Progress);
            playheadIndicator.anchoredPosition = new Vector2(xPos, playheadIndicator.anchoredPosition.y);
        }
    }
    
    #endregion
    
    #region Input Handling
    
    void HandleKeyboardInput()
    {
        if (!enableKeyboardShortcuts) return;
        
        if (Input.GetKeyDown(KeyCode.Space))
        {
            TogglePlayPause();
        }
        else if (Input.GetKeyDown(KeyCode.LeftArrow))
        {
            StepBackward();
        }
        else if (Input.GetKeyDown(KeyCode.RightArrow))
        {
            StepForward();
        }
        else if (Input.GetKeyDown(KeyCode.R))
        {
            ResetTimeline();
        }
        else if (Input.GetKeyDown(KeyCode.Equals) || Input.GetKeyDown(KeyCode.Plus))
        {
            IncreaseSpeed();
        }
        else if (Input.GetKeyDown(KeyCode.Minus))
        {
            DecreaseSpeed();
        }
    }
    
    void AdvancePlayback()
    {
        if (TotalDuration <= 0f) return;
        
        CurrentTime += Time.deltaTime * PlaybackSpeed;
        
        if (CurrentTime >= TotalDuration)
        {
            CurrentTime = TotalDuration;
            Pause();
            OnTimelineReset?.Invoke();
        }
    }
    
    #endregion
    
    #region Event Handlers
    
    void HandleTimelineSliderChanged(float value)
    {
        if (!IsScrubbing) return; // Only respond to manual input
        SeekToProgress(value);
    }
    
    void HandleSpeedSliderChanged(float value)
    {
        SetPlaybackSpeed(value);
    }
    
    void HandleStepChanged(int currentStep, int totalSteps)
    {
        if (totalSteps > 0)
        {
            float progress = (float)currentStep / totalSteps;
            CurrentTime = progress * TotalDuration;
        }
    }
    
    void HandleAnimationCompleted()
    {
        Pause();
        Debug.Log("Animation completed - timeline paused");
    }
    
    void HandleTimeUpdated(float time)
    {
        if (!IsScrubbing) // Don't override during scrubbing
        {
            CurrentTime = time;
        }
    }
    
    #endregion
    
    #region Utility
    
    string FormatTime(float timeInSeconds)
    {
        int minutes = Mathf.FloorToInt(timeInSeconds / 60f);
        int seconds = Mathf.FloorToInt(timeInSeconds % 60f);
        int milliseconds = Mathf.FloorToInt((timeInSeconds * 1000f) % 1000f);
        
        return $"{minutes:00}:{seconds:00}.{milliseconds:000}";
    }
    
    /// <summary>
    /// Get timeline statistics
    /// </summary>
    public TimelineStats GetStats()
    {
        return new TimelineStats
        {
            isPlaying = IsPlaying,
            isScrubbing = IsScrubbing,
            currentTime = CurrentTime,
            totalDuration = TotalDuration,
            playbackSpeed = PlaybackSpeed,
            progress = Progress,
            keyframeCount = keyframeTimes.Count
        };
    }
    
    #endregion
}

#region Data Structures

[System.Serializable]
public struct TimelineStats
{
    public bool isPlaying;
    public bool isScrubbing;
    public float currentTime;
    public float totalDuration;
    public float playbackSpeed;
    public float progress;
    public int keyframeCount;
}

#endregion