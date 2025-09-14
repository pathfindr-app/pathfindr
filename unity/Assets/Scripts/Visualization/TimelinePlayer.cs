using UnityEngine;
using UnityEngine.UI;

/// <summary>
/// Timeline playback control system - mirrors React's animation controls
/// Provides play/pause, speed control, and scrubbing functionality
/// Works with PathSegmentTimeline for synchronized visualization playback
/// </summary>
public class TimelinePlayer : MonoBehaviour
{
    [Header("Timeline Control")]
    public PathSegmentTimeline timeline;
    public PathSegmentRenderer renderer;
    
    [Header("Playback State")]
    public bool isPlaying = false;
    public bool isPaused = false;
    public float playbackSpeed = 1f;
    public float currentTime = 0f;
    public float totalDuration = 0f;
    
    [Header("Playback Settings")]
    [Range(0.1f, 4f)]
    public float minPlaybackSpeed = 0.1f;
    [Range(0.1f, 4f)]
    public float maxPlaybackSpeed = 4f;
    public bool loopPlayback = false;
    public bool autoStartOnNewTimeline = true;
    
    [Header("UI Integration (Optional)")]
    public Button playPauseButton;
    public Slider timelineSlider;
    public Slider speedSlider;
    public Text timeDisplayText;
    public Text speedDisplayText;
    
    [Header("Debug")]
    public bool enableDebugLogs = false;
    
    // Events
    public System.Action OnPlaybackStarted;
    public System.Action OnPlaybackPaused;
    public System.Action OnPlaybackFinished;
    public System.Action<float> OnTimeChanged;
    
    // Internal state
    private float lastUpdateTime;
    private bool wasPlayingBeforeScrub = false;
    
    void Start()
    {
        InitializePlayer();
        SetupUIControls();
    }
    
    void InitializePlayer()
    {
        if (timeline == null)
            timeline = FindObjectOfType<PathSegmentTimeline>();
            
        if (renderer == null)
            renderer = FindObjectOfType<PathSegmentRenderer>();
            
        if (timeline == null)
        {
            Debug.LogError("[TimelinePlayer] PathSegmentTimeline not found!");
            return;
        }
        
        // Subscribe to timeline changes if applicable
        UpdateTimelineDuration();
        
        if (enableDebugLogs)
        {
            Debug.Log("[TimelinePlayer] Initialized with timeline player controls");
        }
    }
    
    void SetupUIControls()
    {
        // Play/Pause button
        if (playPauseButton != null)
        {
            playPauseButton.onClick.AddListener(TogglePlayback);
        }
        
        // Timeline scrubbing slider
        if (timelineSlider != null)
        {
            timelineSlider.onValueChanged.AddListener(OnTimelineSliderChanged);
            timelineSlider.minValue = 0f;
            timelineSlider.maxValue = 1f;
        }
        
        // Speed control slider
        if (speedSlider != null)
        {
            speedSlider.onValueChanged.AddListener(OnSpeedSliderChanged);
            speedSlider.minValue = minPlaybackSpeed;
            speedSlider.maxValue = maxPlaybackSpeed;
            speedSlider.value = playbackSpeed;
        }
    }
    
    void Update()
    {
        if (timeline == null) return;
        
        // Update timeline duration if it changed
        if (Mathf.Abs(totalDuration - timeline.totalDuration) > 0.1f)
        {
            UpdateTimelineDuration();
        }
        
        // Update playback time
        if (isPlaying && !isPaused)
        {
            float deltaTime = Time.deltaTime * playbackSpeed * 1000f; // Convert to milliseconds
            currentTime = Mathf.Clamp(currentTime + deltaTime, 0f, totalDuration);
            
            // Update timeline position
            if (totalDuration > 0)
            {
                timeline.SeekToPosition(currentTime / totalDuration);
            }
            
            // Check if playback finished
            if (currentTime >= totalDuration)
            {
                if (loopPlayback)
                {
                    SeekToStart();
                }
                else
                {
                    StopPlayback();
                }
            }
            
            // Broadcast time change
            OnTimeChanged?.Invoke(currentTime);
        }
        
        // Update UI
        UpdateUI();
    }
    
    #region Playback Control
    
    /// <summary>
    /// Start playback from current position
    /// </summary>
    public void StartPlayback()
    {
        if (timeline == null || totalDuration <= 0f)
        {
            if (enableDebugLogs)
            {
                Debug.LogWarning("[TimelinePlayer] Cannot start playback - no timeline data");
            }
            return;
        }
        
        isPlaying = true;
        isPaused = false;
        
        OnPlaybackStarted?.Invoke();
        
        if (enableDebugLogs)
        {
            Debug.Log($"[TimelinePlayer] Playback started at {currentTime:F1}ms, speed: {playbackSpeed}x");
        }
    }
    
    /// <summary>
    /// Pause playback
    /// </summary>
    public void PausePlayback()
    {
        isPaused = true;
        
        OnPlaybackPaused?.Invoke();
        
        if (enableDebugLogs)
        {
            Debug.Log($"[TimelinePlayer] Playback paused at {currentTime:F1}ms");
        }
    }
    
    /// <summary>
    /// Stop playback and reset to start
    /// </summary>
    public void StopPlayback()
    {
        isPlaying = false;
        isPaused = false;
        
        OnPlaybackFinished?.Invoke();
        
        if (enableDebugLogs)
        {
            Debug.Log("[TimelinePlayer] Playback stopped");
        }
    }
    
    /// <summary>
    /// Toggle play/pause state
    /// </summary>
    public void TogglePlayback()
    {
        if (!isPlaying)
        {
            StartPlayback();
        }
        else if (isPaused)
        {
            isPaused = false;
            if (enableDebugLogs)
            {
                Debug.Log("[TimelinePlayer] Playback resumed");
            }
        }
        else
        {
            PausePlayback();
        }
    }
    
    #endregion
    
    #region Timeline Control
    
    /// <summary>
    /// Seek to specific time position in milliseconds
    /// </summary>
    public void SeekToTime(float timeMs)
    {
        currentTime = Mathf.Clamp(timeMs, 0f, totalDuration);
        
        if (timeline != null && totalDuration > 0)
        {
            timeline.SeekToPosition(currentTime / totalDuration);
        }
        
        OnTimeChanged?.Invoke(currentTime);
        
        if (enableDebugLogs)
        {
            Debug.Log($"[TimelinePlayer] Seeked to {currentTime:F1}ms");
        }
    }
    
    /// <summary>
    /// Seek to normalized position (0-1)
    /// </summary>
    public void SeekToNormalizedPosition(float normalizedPosition)
    {
        normalizedPosition = Mathf.Clamp01(normalizedPosition);
        SeekToTime(normalizedPosition * totalDuration);
    }
    
    /// <summary>
    /// Seek to start of timeline
    /// </summary>
    public void SeekToStart()
    {
        SeekToTime(0f);
    }
    
    /// <summary>
    /// Seek to end of timeline
    /// </summary>
    public void SeekToEnd()
    {
        SeekToTime(totalDuration);
    }
    
    /// <summary>
    /// Skip forward by specified time
    /// </summary>
    public void SkipForward(float skipTimeMs = 1000f)
    {
        SeekToTime(currentTime + skipTimeMs);
    }
    
    /// <summary>
    /// Skip backward by specified time
    /// </summary>
    public void SkipBackward(float skipTimeMs = 1000f)
    {
        SeekToTime(currentTime - skipTimeMs);
    }
    
    #endregion
    
    #region Speed Control
    
    /// <summary>
    /// Set playback speed multiplier
    /// </summary>
    public void SetPlaybackSpeed(float speed)
    {
        playbackSpeed = Mathf.Clamp(speed, minPlaybackSpeed, maxPlaybackSpeed);
        
        if (enableDebugLogs)
        {
            Debug.Log($"[TimelinePlayer] Playback speed set to {playbackSpeed:F1}x");
        }
    }
    
    /// <summary>
    /// Increase playback speed
    /// </summary>
    public void IncreaseSpeed()
    {
        SetPlaybackSpeed(playbackSpeed * 1.5f);
    }
    
    /// <summary>
    /// Decrease playback speed
    /// </summary>
    public void DecreaseSpeed()
    {
        SetPlaybackSpeed(playbackSpeed / 1.5f);
    }
    
    /// <summary>
    /// Reset to normal speed
    /// </summary>
    public void ResetSpeed()
    {
        SetPlaybackSpeed(1f);
    }
    
    #endregion
    
    #region UI Event Handlers
    
    void OnTimelineSliderChanged(float value)
    {
        // Pause playback during scrubbing
        if (isPlaying && !isPaused)
        {
            wasPlayingBeforeScrub = true;
            PausePlayback();
        }
        
        SeekToNormalizedPosition(value);
    }
    
    void OnSpeedSliderChanged(float value)
    {
        SetPlaybackSpeed(value);
    }
    
    #endregion
    
    #region UI Updates
    
    void UpdateUI()
    {
        // Update play/pause button
        if (playPauseButton != null)
        {
            Text buttonText = playPauseButton.GetComponentInChildren<Text>();
            if (buttonText != null)
            {
                buttonText.text = (isPlaying && !isPaused) ? "⏸" : "▶";
            }
        }
        
        // Update timeline slider
        if (timelineSlider != null && totalDuration > 0)
        {
            timelineSlider.value = currentTime / totalDuration;
        }
        
        // Update speed slider
        if (speedSlider != null)
        {
            speedSlider.value = playbackSpeed;
        }
        
        // Update time display
        if (timeDisplayText != null)
        {
            timeDisplayText.text = FormatTime(currentTime) + " / " + FormatTime(totalDuration);
        }
        
        // Update speed display
        if (speedDisplayText != null)
        {
            speedDisplayText.text = $"{playbackSpeed:F1}x";
        }
    }
    
    string FormatTime(float timeMs)
    {
        float seconds = timeMs / 1000f;
        int minutes = Mathf.FloorToInt(seconds / 60f);
        int secs = Mathf.FloorToInt(seconds % 60f);
        int ms = Mathf.FloorToInt((seconds % 1f) * 100f);
        
        return $"{minutes:D2}:{secs:D2}.{ms:D2}";
    }
    
    #endregion
    
    #region Internal Methods
    
    void UpdateTimelineDuration()
    {
        if (timeline != null)
        {
            totalDuration = timeline.totalDuration;
            
            // Auto-start if enabled and we have new timeline data
            if (autoStartOnNewTimeline && totalDuration > 0f && !isPlaying)
            {
                SeekToStart();
                if (enableDebugLogs)
                {
                    Debug.Log($"[TimelinePlayer] New timeline detected: {totalDuration:F1}ms duration");
                }
            }
        }
    }
    
    #endregion
    
    #region Public Interface
    
    /// <summary>
    /// Get current playback progress as normalized value (0-1)
    /// </summary>
    public float GetNormalizedProgress()
    {
        return totalDuration > 0 ? currentTime / totalDuration : 0f;
    }
    
    /// <summary>
    /// Check if timeline has data
    /// </summary>
    public bool HasTimelineData()
    {
        return timeline != null && totalDuration > 0f;
    }
    
    /// <summary>
    /// Get playback state info
    /// </summary>
    public string GetPlaybackInfo()
    {
        return $"Time: {FormatTime(currentTime)}/{FormatTime(totalDuration)}, Speed: {playbackSpeed:F1}x, Playing: {isPlaying && !isPaused}";
    }
    
    #endregion
    
    #region Debug Methods
    
    /// <summary>
    /// Test playback controls
    /// </summary>
    [ContextMenu("🧪 Test Playback Controls")]
    public void TestPlaybackControls()
    {
        Debug.Log($"[TimelinePlayer] {GetPlaybackInfo()}");
        Debug.Log($"[TimelinePlayer] Timeline data available: {HasTimelineData()}");
        
        if (HasTimelineData())
        {
            if (!isPlaying)
            {
                Debug.Log("[TimelinePlayer] Starting test playback");
                StartPlayback();
            }
            else
            {
                Debug.Log("[TimelinePlayer] Pausing test playback");
                PausePlayback();
            }
        }
    }
    
    #endregion
    
    void OnDestroy()
    {
        // Clean up UI event listeners
        if (playPauseButton != null)
            playPauseButton.onClick.RemoveListener(TogglePlayback);
        if (timelineSlider != null)
            timelineSlider.onValueChanged.RemoveListener(OnTimelineSliderChanged);
        if (speedSlider != null)
            speedSlider.onValueChanged.RemoveListener(OnSpeedSliderChanged);
    }
}