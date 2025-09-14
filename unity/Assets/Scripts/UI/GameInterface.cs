using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;
using TMPro;
using System;

/// <summary>
/// Main game UI controller
/// Unity port of React Interface.jsx component
/// </summary>
public class GameInterface : MonoBehaviour
{
    [Header("UI Panels")]
    public GameObject setupPanel;
    public GameObject gamePanel;
    public GameObject resultsPanel;
    public GameObject loadingPanel;
    
    [Header("Setup UI")]
    public Button startGameButton;
    public Dropdown algorithmDropdown;
    public Slider radiusSlider;
    public Slider speedSlider;
    public Button newLocationButton;
    public TextMeshProUGUI instructionsText;
    
    [Header("Pathfinding Control UI")]
    public Button placeStartPointButton;
    public Button placeEndPointButton;
    public Button resetPointsButton;
    public TextMeshProUGUI pathfindingModeText;
    
    [Header("Game UI")]
    public Button skipAnimationButton;
    public Button pauseButton;
    public TextMeshProUGUI phaseText;
    public TextMeshProUGUI timerText;
    public Image progressBar;
    public TextMeshProUGUI drawingInstructionsText;
    
    [Header("Results UI")]
    public TextMeshProUGUI scoreText;
    public TextMeshProUGUI algorithmStatsText;
    public TextMeshProUGUI comparisonText;
    public Button tryAgainButton;
    public Button newMapButton;
    public Image scoreGauge;
    
    [Header("Loading UI")]
    public TextMeshProUGUI loadingText;
    public Image loadingSpinner;
    
    [Header("Settings")]
    public GameSettings gameSettings;
    
    // Events
    public event Action OnStartGameClicked;
    public event Action<PathfindingAlgorithm.AlgorithmType> OnAlgorithmChanged;
    public event Action OnNewLocationClicked;
    public event Action OnTryAgainClicked;
    public event Action OnSkipAnimationClicked;
    public event Action OnPauseClicked;
    
    // Component references - using new architecture
    private MarkerStateManager markerStateManager;
    
    // State
    private MapController.GamePhase currentPhase;
    private bool isGameMode = false;
    private float gameStartTime;
    private Coroutine timerCoroutine;
    private Coroutine loadingSpinnerCoroutine;
    
    void Start()
    {
        InitializeUI();
    }
    
    void OnEnable()
    {
        // Subscribe to marker state events
        MarkerStateManager.OnMarkersReady += HandleMarkersReady;
        MarkerStateManager.OnMarkersCleared += HandleMarkersCleared;
        MarkerStateManager.OnPlacementModeChanged += HandlePlacementModeChanged;
    }
    
    void OnDisable()
    {
        // Unsubscribe from marker state events
        MarkerStateManager.OnMarkersReady -= HandleMarkersReady;
        MarkerStateManager.OnMarkersCleared -= HandleMarkersCleared;
        MarkerStateManager.OnPlacementModeChanged -= HandlePlacementModeChanged;
    }
    
    #region Initialization
    
    void InitializeUI()
    {
        // Find MarkerStateManager
        markerStateManager = FindObjectOfType<MarkerStateManager>();
        if (markerStateManager == null)
        {
            Debug.LogError("[GameInterface] MarkerStateManager not found! Please ensure it exists in the scene.");
        }
        
        // Setup button listeners
        SetupButtonListeners();
        
        // Initialize dropdown with algorithms
        SetupAlgorithmDropdown();
        
        // Initialize sliders
        SetupSliders();
        
        // Set initial UI state
        ShowSetupPanel();
    }
    
    void SetupButtonListeners()
    {
        if (startGameButton != null)
            startGameButton.onClick.AddListener(() => OnStartGameClicked?.Invoke());
            
        if (newLocationButton != null)
            newLocationButton.onClick.AddListener(() => OnNewLocationClicked?.Invoke());
            
        if (tryAgainButton != null)
            tryAgainButton.onClick.AddListener(() => OnTryAgainClicked?.Invoke());
            
        if (newMapButton != null)
            newMapButton.onClick.AddListener(() => OnNewLocationClicked?.Invoke());
            
        if (skipAnimationButton != null)
            skipAnimationButton.onClick.AddListener(() => OnSkipAnimationClicked?.Invoke());
            
        if (pauseButton != null)
            pauseButton.onClick.AddListener(() => OnPauseClicked?.Invoke());
            
        // Pathfinding control buttons - using new MarkerStateManager
        if (placeStartPointButton != null)
            placeStartPointButton.onClick.AddListener(HandlePlaceStartPointClicked);
            
        if (placeEndPointButton != null)
            placeEndPointButton.onClick.AddListener(HandlePlaceEndPointClicked);
            
        if (resetPointsButton != null)
            resetPointsButton.onClick.AddListener(HandleResetPointsClicked);
    }
    
    void SetupAlgorithmDropdown()
    {
        if (algorithmDropdown == null) return;
        
        algorithmDropdown.ClearOptions();
        
        List<string> algorithmNames = new List<string>
        {
            "A* Algorithm",
            "Dijkstra's Algorithm", 
            "Greedy Best-First",
            "Bidirectional Search"
        };
        
        algorithmDropdown.AddOptions(algorithmNames);
        algorithmDropdown.value = 0; // Default to A*
        
        algorithmDropdown.onValueChanged.AddListener(OnAlgorithmDropdownChanged);
    }
    
    void SetupSliders()
    {
        if (radiusSlider != null)
        {
            radiusSlider.minValue = 1f;
            radiusSlider.maxValue = 10f;
            radiusSlider.value = gameSettings?.searchRadius ?? 4f;
        }
        
        if (speedSlider != null)
        {
            speedSlider.minValue = 1f;
            speedSlider.maxValue = 10f;
            speedSlider.value = gameSettings?.animationSpeed ?? 5f;
        }
    }
    
    #endregion
    
    #region Panel Management
    
    public void ShowSetupPanel()
    {
        SetPanelActive(setupPanel, true);
        SetPanelActive(gamePanel, false);
        SetPanelActive(resultsPanel, false);
        SetPanelActive(loadingPanel, false);
        
        currentPhase = MapController.GamePhase.Setup;
        isGameMode = false;
        
        UpdateInstructions("Click on the map to place start and end points for pathfinding.");
        
        // Disable start button initially
        EnableStartGameButton(false);
    }
    
    public void ShowGamePanel()
    {
        SetPanelActive(setupPanel, false);
        SetPanelActive(gamePanel, true);
        SetPanelActive(resultsPanel, false);
        SetPanelActive(loadingPanel, false);
        
        isGameMode = true;
        gameStartTime = Time.time;
        
        // Start timer
        if (timerCoroutine != null) StopCoroutine(timerCoroutine);
        timerCoroutine = StartCoroutine(UpdateTimer());
    }
    
    public void ShowResultsPanel()
    {
        SetPanelActive(setupPanel, false);
        SetPanelActive(gamePanel, false);
        SetPanelActive(resultsPanel, true);
        SetPanelActive(loadingPanel, false);
        
        currentPhase = MapController.GamePhase.Complete;
        
        // Stop timer
        if (timerCoroutine != null)
        {
            StopCoroutine(timerCoroutine);
            timerCoroutine = null;
        }
    }
    
    public void ShowLoadingPanel(string message = "Loading...")
    {
        SetPanelActive(loadingPanel, true);
        
        if (loadingText != null)
            loadingText.text = message;
            
        // Start loading spinner
        if (loadingSpinnerCoroutine != null) StopCoroutine(loadingSpinnerCoroutine);
        loadingSpinnerCoroutine = StartCoroutine(SpinLoadingIcon());
    }
    
    public void HideLoadingPanel()
    {
        SetPanelActive(loadingPanel, false);
        
        // Stop loading spinner
        if (loadingSpinnerCoroutine != null)
        {
            StopCoroutine(loadingSpinnerCoroutine);
            loadingSpinnerCoroutine = null;
        }
    }
    
    void SetPanelActive(GameObject panel, bool active)
    {
        if (panel != null)
            panel.SetActive(active);
    }
    
    #endregion
    
    #region Game Phase UI Updates
    
    public void UpdateGamePhase(MapController.GamePhase newPhase)
    {
        currentPhase = newPhase;
        
        switch (newPhase)
        {
            case MapController.GamePhase.Setup:
                ShowSetupPanel();
                break;
                
            case MapController.GamePhase.Drawing:
                UpdatePhaseText("Draw your route!");
                ShowDrawingInstructions();
                break;
                
            case MapController.GamePhase.PlayerAnimation:
                UpdatePhaseText("Playing your route...");
                HideDrawingInstructions();
                EnableSkipButton(true);
                break;
                
            case MapController.GamePhase.AlgorithmAnimation:
                UpdatePhaseText("Showing optimal route...");
                EnableSkipButton(true);
                break;
                
            case MapController.GamePhase.Complete:
                UpdatePhaseText("Complete!");
                EnableSkipButton(false);
                break;
        }
    }
    
    void UpdatePhaseText(string text)
    {
        if (phaseText != null)
            phaseText.text = text;
    }
    
    public void ShowDrawingInstructions()
    {
        if (drawingInstructionsText != null)
        {
            drawingInstructionsText.text = "Click to place waypoints and build your route. Click near the end point to finish.";
            drawingInstructionsText.gameObject.SetActive(true);
        }
    }
    
    public void HideDrawingInstructions()
    {
        if (drawingInstructionsText != null)
        {
            drawingInstructionsText.gameObject.SetActive(false);
        }
    }
    
    #endregion
    
    #region Button Controls
    
    public void EnableStartGameButton(bool enabled)
    {
        if (startGameButton != null)
        {
            startGameButton.interactable = enabled;
            
            // Update button text based on state
            var buttonText = startGameButton.GetComponentInChildren<TextMeshProUGUI>();
            if (buttonText != null)
            {
                buttonText.text = enabled ? "Start Game" : "Place Start & End Points";
            }
        }
    }
    
    public void EnableSkipButton(bool enabled)
    {
        if (skipAnimationButton != null)
        {
            skipAnimationButton.gameObject.SetActive(enabled);
        }
    }
    
    #endregion
    
    #region Results Display
    
    public void ShowResults(float playerScore)
    {
        ShowResultsPanel();
        
        // Display score
        if (scoreText != null)
        {
            scoreText.text = $"Score: {playerScore:F1}%";
        }
        
        // Update score gauge
        if (scoreGauge != null)
        {
            scoreGauge.fillAmount = playerScore / 100f;
            
            // Color based on score
            if (playerScore >= 80f)
                scoreGauge.color = Color.green;
            else if (playerScore >= 60f)
                scoreGauge.color = Color.yellow;
            else
                scoreGauge.color = Color.red;
        }
    }
    
    public void ShowAlgorithmStats(AlgorithmStats stats)
    {
        if (algorithmStatsText != null && stats != null)
        {
            algorithmStatsText.text = $"Algorithm: {stats.algorithmType}\\n" +
                                     $"Nodes Explored: {stats.nodesExplored}\\n" +
                                     $"Path Length: {stats.pathLength}\\n" +
                                     $"Time: {stats.executionTime:F3}s";
        }
    }
    
    public void ShowComparison(float playerDistance, float optimalDistance)
    {
        if (comparisonText != null)
        {
            float efficiency = (optimalDistance / playerDistance) * 100f;
            comparisonText.text = $"Your route: {playerDistance:F2} km\\n" +
                                 $"Optimal route: {optimalDistance:F2} km\\n" +
                                 $"Efficiency: {efficiency:F1}%";
        }
    }
    
    #endregion
    
    #region Settings UI
    
    void OnAlgorithmDropdownChanged(int value)
    {
        PathfindingAlgorithm.AlgorithmType algorithm = (PathfindingAlgorithm.AlgorithmType)value;
        OnAlgorithmChanged?.Invoke(algorithm);
    }
    
    public float GetSearchRadius()
    {
        return radiusSlider != null ? radiusSlider.value : 4f;
    }
    
    public float GetAnimationSpeed()
    {
        return speedSlider != null ? speedSlider.value : 5f;
    }
    
    #endregion
    
    #region Progress and Timer
    
    public void UpdateProgress(float progress)
    {
        if (progressBar != null)
        {
            progressBar.fillAmount = Mathf.Clamp01(progress);
        }
    }
    
    IEnumerator UpdateTimer()
    {
        while (isGameMode && timerText != null)
        {
            float elapsed = Time.time - gameStartTime;
            int minutes = Mathf.FloorToInt(elapsed / 60f);
            int seconds = Mathf.FloorToInt(elapsed % 60f);
            
            timerText.text = $"{minutes:00}:{seconds:00}";
            
            yield return new WaitForSeconds(0.1f);
        }
    }
    
    IEnumerator SpinLoadingIcon()
    {
        while (loadingSpinner != null && loadingSpinner.gameObject.activeInHierarchy)
        {
            loadingSpinner.transform.Rotate(0, 0, -90f * Time.deltaTime);
            yield return null;
        }
    }
    
    #endregion
    
    #region Utility Methods
    
    public void UpdateInstructions(string text)
    {
        if (instructionsText != null)
            instructionsText.text = text;
    }
    
    public void ResetUI()
    {
        ShowSetupPanel();
        EnableStartGameButton(false);
        UpdateProgress(0f);
        
        if (timerCoroutine != null)
        {
            StopCoroutine(timerCoroutine);
            timerCoroutine = null;
        }
    }
    
    #endregion
    
    #region Snackbar/Toast Messages
    
    [Header("Toast Messages")]
    public GameObject toastPanel;
    public TextMeshProUGUI toastText;
    public float toastDuration = 3f;
    
    public void ShowSnack(string message, string type = "info")
    {
        StartCoroutine(ShowToastMessage(message, type));
    }
    
    IEnumerator ShowToastMessage(string message, string type)
    {
        if (toastPanel == null || toastText == null) yield break;
        
        // Set message
        toastText.text = message;
        
        // Set color based on type
        switch (type.ToLower())
        {
            case "error":
                toastText.color = Color.red;
                break;
            case "warning":
                toastText.color = Color.yellow;
                break;
            case "success":
                toastText.color = Color.green;
                break;
            default:
                toastText.color = Color.white;
                break;
        }
        
        // Show toast
        toastPanel.SetActive(true);
        
        // Animate in
        var canvasGroup = toastPanel.GetComponent<CanvasGroup>();
        if (canvasGroup != null)
        {
            float fadeTime = 0.3f;
            float elapsed = 0f;
            
            while (elapsed < fadeTime)
            {
                canvasGroup.alpha = elapsed / fadeTime;
                elapsed += Time.deltaTime;
                yield return null;
            }
            canvasGroup.alpha = 1f;
        }
        
        // Wait
        yield return new WaitForSeconds(toastDuration);
        
        // Animate out
        if (canvasGroup != null)
        {
            float fadeTime = 0.3f;
            float elapsed = 0f;
            
            while (elapsed < fadeTime)
            {
                canvasGroup.alpha = 1f - (elapsed / fadeTime);
                elapsed += Time.deltaTime;
                yield return null;
            }
            canvasGroup.alpha = 0f;
        }
        
        // Hide toast
        toastPanel.SetActive(false);
    }
    
    #endregion
    
    #region Pathfinding Control - New Architecture
    
    /// <summary>
    /// Handle place start point button click
    /// </summary>
    void HandlePlaceStartPointClicked()
    {
        if (markerStateManager != null)
        {
            markerStateManager.EnableStartPlacement();
            UpdateInstructions("Click on the map to place the start point.");
        }
        else
        {
            Debug.LogError("[GameInterface] MarkerStateManager not available");
        }
    }
    
    /// <summary>
    /// Handle place end point button click
    /// </summary>
    void HandlePlaceEndPointClicked()
    {
        if (markerStateManager != null)
        {
            markerStateManager.EnableEndPlacement();
            UpdateInstructions("Click on the map to place the end point.");
        }
        else
        {
            Debug.LogError("[GameInterface] MarkerStateManager not available");
        }
    }
    
    /// <summary>
    /// Handle reset points button click
    /// </summary>
    void HandleResetPointsClicked()
    {
        if (markerStateManager != null)
        {
            markerStateManager.ClearAllMarkers();
            markerStateManager.DisablePlacement();
            UpdateInstructions("Click on the map to place start and end points for pathfinding.");
            EnableStartGameButton(false);
        }
        else
        {
            Debug.LogError("[GameInterface] MarkerStateManager not available");
        }
    }
    
    /// <summary>
    /// Handle when both markers are ready
    /// </summary>
    void HandleMarkersReady()
    {
        EnableStartGameButton(true);
        UpdateInstructions("Both start and end points placed. Ready to start pathfinding!");
    }
    
    /// <summary>
    /// Handle when markers are cleared
    /// </summary>
    void HandleMarkersCleared()
    {
        EnableStartGameButton(false);
        UpdateInstructions("Click on the map to place start and end points for pathfinding.");
    }
    
    /// <summary>
    /// Handle placement mode changes
    /// </summary>
    void HandlePlacementModeChanged(PathfindingPlacementMode newMode)
    {
        // Update pathfinding mode text if available
        if (pathfindingModeText != null)
        {
            switch (newMode)
            {
                case PathfindingPlacementMode.PlaceStart:
                    pathfindingModeText.text = "Placing Start Point";
                    pathfindingModeText.color = Color.green;
                    break;
                case PathfindingPlacementMode.PlaceEnd:
                    pathfindingModeText.text = "Placing End Point";
                    pathfindingModeText.color = Color.red;
                    break;
                case PathfindingPlacementMode.Disabled:
                    pathfindingModeText.text = "Normal Navigation";
                    pathfindingModeText.color = Color.white;
                    break;
            }
        }
        
        // Update button states based on placement mode
        UpdateButtonStates(newMode);
    }
    
    /// <summary>
    /// Update button states based on placement mode
    /// </summary>
    void UpdateButtonStates(PathfindingPlacementMode mode)
    {
        // Update button appearances to show which mode is active
        if (placeStartPointButton != null)
        {
            var buttonText = placeStartPointButton.GetComponentInChildren<TextMeshProUGUI>();
            if (buttonText != null)
            {
                buttonText.text = mode == PathfindingPlacementMode.PlaceStart ? "Placing Start..." : "Place Start Point";
            }
        }
        
        if (placeEndPointButton != null)
        {
            var buttonText = placeEndPointButton.GetComponentInChildren<TextMeshProUGUI>();
            if (buttonText != null)
            {
                buttonText.text = mode == PathfindingPlacementMode.PlaceEnd ? "Placing End..." : "Place End Point";
            }
        }
    }
    
    #endregion
    
    #region Cleanup
    
    void OnDestroy()
    {
        // Stop all coroutines
        if (timerCoroutine != null) StopCoroutine(timerCoroutine);
        if (loadingSpinnerCoroutine != null) StopCoroutine(loadingSpinnerCoroutine);
        
        // Remove button listeners
        if (startGameButton != null) startGameButton.onClick.RemoveAllListeners();
        if (newLocationButton != null) newLocationButton.onClick.RemoveAllListeners();
        if (tryAgainButton != null) tryAgainButton.onClick.RemoveAllListeners();
        if (newMapButton != null) newMapButton.onClick.RemoveAllListeners();
        if (skipAnimationButton != null) skipAnimationButton.onClick.RemoveAllListeners();
        if (pauseButton != null) pauseButton.onClick.RemoveAllListeners();
        if (algorithmDropdown != null) algorithmDropdown.onValueChanged.RemoveAllListeners();
    }
    
    #endregion
}