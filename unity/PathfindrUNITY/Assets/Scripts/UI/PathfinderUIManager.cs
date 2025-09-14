using UnityEngine;
using UnityEngine.UIElements;

/// <summary>
/// Connects UI Toolkit elements to MapController pathfinding system
/// Bridges the visual UI created in UI Builder to the existing backend code
/// </summary>
public class PathfinderUIManager : MonoBehaviour
{
    [Header("References")]
    public UIDocument uiDocument;
    public MapController mapController;
    
    [Header("Debug")]
    public bool enableDebugLogs = true;
    
    // UI Element References
    private Button placeStartBtn;
    private Button placeEndBtn;
    private Button resetPointsBtn;
    private Button startGameBtn;
    
    // UI Panels
    private VisualElement setupPanel;
    private VisualElement gamePanel;
    private VisualElement resultsPanel;
    private VisualElement loadingPanel;
    
    void Start()
    {
        InitializeUI();
        ConnectEvents();
    }
    
    #region Initialization
    
    void InitializeUI()
    {
        // Try to find UIDocument component if not manually assigned
        if (uiDocument == null)
        {
            uiDocument = GetComponent<UIDocument>();
            if (enableDebugLogs)
            {
                    }
        }
        
        // Force auto-assignment in Inspector during runtime
        if (uiDocument == null)
        {
            uiDocument = FindObjectOfType<UIDocument>();
            if (uiDocument != null && enableDebugLogs)
            {
                Debug.Log("Found UIDocument via FindObjectOfType");
            }
        }
        
        if (uiDocument == null)
        {
            Debug.LogError("UIDocument not found! Make sure UIDocument component is added to this GameObject or assign it manually.");
            return;
        }
        
        if (enableDebugLogs)
        {
        }
        
        var root = uiDocument.rootVisualElement;
        
        // Query UI buttons by the names we set in UI Builder
        placeStartBtn = root.Q<Button>("place-start-btn");
        placeEndBtn = root.Q<Button>("place-end-btn");
        resetPointsBtn = root.Q<Button>("reset-points-btn");
        startGameBtn = root.Q<Button>("start-game-btn");
        
        // Query UI panels
        setupPanel = root.Q<VisualElement>("setup-panel");
        gamePanel = root.Q<VisualElement>("game-panel");
        resultsPanel = root.Q<VisualElement>("results-panel");
        loadingPanel = root.Q<VisualElement>("loading-panel");
        
        // Validate UI elements were found
        ValidateUIElements();
        
        if (enableDebugLogs)
        {
            }
    }
    
    void ValidateUIElements()
    {
        if (placeStartBtn == null) Debug.LogWarning("place-start-btn not found in UI");
        if (placeEndBtn == null) Debug.LogWarning("place-end-btn not found in UI");
        if (resetPointsBtn == null) Debug.LogWarning("reset-points-btn not found in UI");
        if (startGameBtn == null) Debug.LogWarning("start-game-btn not found in UI");
        
        if (setupPanel == null) Debug.LogWarning("setup-panel not found in UI");
        if (gamePanel == null) Debug.LogWarning("game-panel not found in UI");
        if (resultsPanel == null) Debug.LogWarning("results-panel not found in UI");
        if (loadingPanel == null) Debug.LogWarning("loading-panel not found in UI");
    }
    
    #endregion
    
    #region Event Connection
    
    void ConnectEvents()
    {
        if (mapController == null)
        {
            Debug.LogError("MapController not assigned! Please assign MapController reference in inspector.");
            return;
        }
        
        // Connect pathfinding control buttons to MapController methods
        if (placeStartBtn != null)
        {
            placeStartBtn.clicked += OnPlaceStartPointClicked;
        }
        
        if (placeEndBtn != null)
        {
            placeEndBtn.clicked += OnPlaceEndPointClicked;
        }
        
        if (resetPointsBtn != null)
        {
            resetPointsBtn.clicked += OnResetPointsClicked;
        }
        
        if (startGameBtn != null)
        {
            startGameBtn.clicked += OnStartGameClicked;
        }
        
        if (enableDebugLogs)
        {
            }
    }
    
    #endregion
    
    #region Button Event Handlers
    
    void OnPlaceStartPointClicked()
    {
        
        mapController?.EnableStartPointPlacement();
    }
    
    void OnPlaceEndPointClicked()
    {
        
        mapController?.EnableEndPointPlacement();
    }
    
    void OnResetPointsClicked()
    {
        
        mapController?.ResetPathfindingPoints();
    }
    
    void OnStartGameClicked()
    {
        
        mapController?.StartGameMode();
    }
    
    #endregion
    
    #region Panel Management (Optional - for future expansion)
    
    /// <summary>
    /// Show setup panel and hide others
    /// </summary>
    public void ShowSetupPanel()
    {
        SetPanelVisibility(setupPanel, true);
        SetPanelVisibility(gamePanel, false);
        SetPanelVisibility(resultsPanel, false);
        SetPanelVisibility(loadingPanel, false);
    }
    
    /// <summary>
    /// Show game panel and hide others
    /// </summary>
    public void ShowGamePanel()
    {
        SetPanelVisibility(setupPanel, false);
        SetPanelVisibility(gamePanel, true);
        SetPanelVisibility(resultsPanel, false);
        SetPanelVisibility(loadingPanel, false);
    }
    
    /// <summary>
    /// Show results panel and hide others
    /// </summary>
    public void ShowResultsPanel()
    {
        SetPanelVisibility(setupPanel, false);
        SetPanelVisibility(gamePanel, false);
        SetPanelVisibility(resultsPanel, true);
        SetPanelVisibility(loadingPanel, false);
    }
    
    /// <summary>
    /// Show loading panel (overlay on current panel)
    /// </summary>
    public void ShowLoadingPanel(bool show)
    {
        SetPanelVisibility(loadingPanel, show);
    }
    
    void SetPanelVisibility(VisualElement panel, bool visible)
    {
        if (panel != null)
        {
            panel.style.display = visible ? DisplayStyle.Flex : DisplayStyle.None;
        }
    }
    
    #endregion
    
    #region Public Interface (for future GameInterface integration)
    
    /// <summary>
    /// Enable or disable the Start Game button based on pathfinding readiness
    /// </summary>
    public void EnableStartGameButton(bool enabled)
    {
        if (startGameBtn != null)
        {
            startGameBtn.SetEnabled(enabled);
            
            if (enableDebugLogs)
            {
                Debug.Log($"Start Game button {(enabled ? "enabled" : "disabled")}");
            }
        }
    }
    
    /// <summary>
    /// Update UI based on pathfinding mode status
    /// </summary>
    public void UpdatePathfindingModeStatus(string status)
    {
        // This could update a status label in the future
        if (enableDebugLogs)
        {
            Debug.Log($"Pathfinding mode: {status}");
        }
    }
    
    #endregion
    
    #region Cleanup
    
    void OnDestroy()
    {
        // Clean up event listeners to prevent memory leaks
        if (placeStartBtn != null)
        {
            placeStartBtn.clicked -= OnPlaceStartPointClicked;
        }
        
        if (placeEndBtn != null)
        {
            placeEndBtn.clicked -= OnPlaceEndPointClicked;
        }
        
        if (resetPointsBtn != null)
        {
            resetPointsBtn.clicked -= OnResetPointsClicked;
        }
        
        if (startGameBtn != null)
        {
            startGameBtn.clicked -= OnStartGameClicked;
        }
        
        if (enableDebugLogs)
        {
            Debug.Log("PathfinderUIManager cleaned up event listeners");
        }
    }
    
    #endregion
}