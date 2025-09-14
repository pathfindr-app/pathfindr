using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;
using TMPro;
using System;

/// <summary>
/// Advanced node visualization system for pathfinding education
/// Shows node states, heuristic values, and algorithm-specific effects
/// </summary>
public class NodeVisualizer : MonoBehaviour
{
    [Header("Node Visualization")]
    public GameObject nodeMarkerPrefab;
    public GameObject heuristicUIContainer;
    public Canvas worldSpaceCanvas;
    public Material exploredNodeMaterial;
    public Material currentNodeMaterial;
    public Material openListMaterial;
    public Material closedListMaterial;
    
    [Header("UI Configuration")]
    public bool showHeuristicValues = true;
    public bool showNodeConnections = true;
    public bool enableEducationalMode = true;
    public TMP_FontAsset uiFont;
    [Range(8f, 24f)]
    public float fontSize = 12f;
    
    [Header("Animation Settings")]
    public float nodeAppearDuration = 0.3f;
    public float nodeScalePulse = 1.2f;
    public AnimationCurve nodeAppearCurve = AnimationCurve.EaseInOut(0f, 0f, 1f, 1f);
    public AnimationCurve pulseCurve = AnimationCurve.EaseInOut(0f, 1f, 1f, 1.2f);
    
    [Header("Colors")]
    public Color exploredNodeColor = new Color(0.8f, 0.8f, 0.2f, 0.8f);
    public Color currentNodeColor = new Color(0.2f, 0.8f, 0.3f, 1f);
    public Color openListColor = new Color(0.2f, 0.4f, 0.9f, 0.6f);
    public Color closedListColor = new Color(0.6f, 0.2f, 0.2f, 0.6f);
    public Color heuristicTextColor = Color.white;
    
    // Node tracking
    private Dictionary<long, NodeVisualization> activeNodes = new Dictionary<long, NodeVisualization>();
    private Queue<GameObject> nodePool = new Queue<GameObject>();
    private Queue<GameObject> uiPool = new Queue<GameObject>();
    
    // Current state
    private Color currentAlgorithmColor = Color.green;
    private PathfindingAlgorithm.AlgorithmType currentAlgorithm;
    #pragma warning disable 0414
    private bool isVisualizationActive = false;
    #pragma warning restore 0414
    
    // Performance
    private int maxActiveNodes = 500;
    #pragma warning disable 0414
    private int maxUIElements = 100;
    #pragma warning restore 0414
    private float lastCleanupTime = 0f;
    private const float CLEANUP_INTERVAL = 2f;
    
    // Events
    public event Action<PathfindingNode> OnNodeExplored;
    #pragma warning disable 0067
    public event Action<PathfindingNode> OnNodeSelected;
    #pragma warning restore 0067
    
    void Start()
    {
        InitializeNodeVisualizer();
    }
    
    void Update()
    {
        UpdateNodeAnimations();
        
        // Periodic cleanup
        if (Time.time - lastCleanupTime > CLEANUP_INTERVAL)
        {
            CleanupExpiredNodes();
            lastCleanupTime = Time.time;
        }
    }
    
    #region Initialization
    
    void InitializeNodeVisualizer()
    {
        // Setup world space canvas if not assigned
        if (worldSpaceCanvas == null)
        {
            CreateWorldSpaceCanvas();
        }
        
        // Pre-populate object pools
        PopulateNodePool(50);
        PopulateUIPool(30);
        
        Debug.Log("NodeVisualizer initialized with educational mode");
    }
    
    void CreateWorldSpaceCanvas()
    {
        var canvasObject = new GameObject("NodeVisualizerCanvas");
        canvasObject.transform.SetParent(transform);
        
        worldSpaceCanvas = canvasObject.AddComponent<Canvas>();
        worldSpaceCanvas.renderMode = RenderMode.WorldSpace;
        worldSpaceCanvas.worldCamera = Camera.main;
        worldSpaceCanvas.sortingOrder = 10;
        
        var canvasScaler = canvasObject.AddComponent<CanvasScaler>();
        canvasScaler.uiScaleMode = CanvasScaler.ScaleMode.ScaleWithScreenSize;
        canvasScaler.referenceResolution = new Vector2(1920, 1080);
        
        // Scale canvas appropriately for world space
        canvasObject.transform.localScale = Vector3.one * 0.01f;
    }
    
    void PopulateNodePool(int poolSize)
    {
        for (int i = 0; i < poolSize; i++)
        {
            GameObject nodeObject = CreateNodeMarker();
            nodeObject.SetActive(false);
            nodePool.Enqueue(nodeObject);
        }
    }
    
    void PopulateUIPool(int poolSize)
    {
        for (int i = 0; i < poolSize; i++)
        {
            GameObject uiObject = CreateHeuristicUI();
            uiObject.SetActive(false);
            uiPool.Enqueue(uiObject);
        }
    }
    
    GameObject CreateNodeMarker()
    {
        if (nodeMarkerPrefab != null)
        {
            return Instantiate(nodeMarkerPrefab, transform);
        }
        
        // Create default node marker
        var nodeObject = GameObject.CreatePrimitive(PrimitiveType.Sphere);
        nodeObject.transform.SetParent(transform);
        nodeObject.transform.localScale = Vector3.one * 0.5f;
        
        // Remove collider to improve performance
        if (nodeObject.GetComponent<Collider>())
            DestroyImmediate(nodeObject.GetComponent<Collider>());
            
        return nodeObject;
    }
    
    GameObject CreateHeuristicUI()
    {
        var uiObject = new GameObject("HeuristicUI");
        uiObject.transform.SetParent(worldSpaceCanvas.transform);
        
        // Background panel
        var panel = uiObject.AddComponent<Image>();
        panel.color = new Color(0, 0, 0, 0.7f);
        
        var rectTransform = uiObject.GetComponent<RectTransform>();
        rectTransform.sizeDelta = new Vector2(120, 80);
        
        // Main text for node values
        var textObject = new GameObject("ValueText");
        textObject.transform.SetParent(uiObject.transform);
        
        var textComponent = textObject.AddComponent<TextMeshProUGUI>();
        textComponent.font = uiFont;
        textComponent.fontSize = fontSize;
        textComponent.color = heuristicTextColor;
        textComponent.alignment = TextAlignmentOptions.Center;
        textComponent.text = "f=0\ng=0\nh=0";
        
        var textRect = textObject.GetComponent<RectTransform>();
        textRect.anchorMin = Vector2.zero;
        textRect.anchorMax = Vector2.one;
        textRect.offsetMin = Vector2.zero;
        textRect.offsetMax = Vector2.zero;
        
        return uiObject;
    }
    
    #endregion
    
    #region Node Visualization
    
    /// <summary>
    /// Show explored node with spectacular effects
    /// </summary>
    public void ShowExploredNode(PathfindingNode node)
    {
        if (node == null || activeNodes.ContainsKey(node.id)) return;
        
        if (activeNodes.Count >= maxActiveNodes)
        {
            Debug.LogWarning("Maximum active nodes reached");
            return;
        }
        
        NodeVisualization nodeViz = CreateNodeVisualization(node, NodeState.Explored);
        activeNodes[node.id] = nodeViz;
        
        // Animate node appearance
        StartCoroutine(AnimateNodeAppearance(nodeViz));
        
        OnNodeExplored?.Invoke(node);
    }
    
    /// <summary>
    /// Update node state (open list, closed list, current)
    /// </summary>
    public void UpdateNodeState(PathfindingNode node, NodeState newState)
    {
        if (node == null || !activeNodes.ContainsKey(node.id)) return;
        
        NodeVisualization nodeViz = activeNodes[node.id];
        nodeViz.state = newState;
        nodeViz.lastUpdateTime = Time.time;
        
        // Update visual appearance
        UpdateNodeAppearance(nodeViz);
        
        // Special animation for current node
        if (newState == NodeState.Current)
        {
            StartCoroutine(AnimateCurrentNode(nodeViz));
        }
    }
    
    /// <summary>
    /// Update multiple nodes with heuristic values for educational display
    /// </summary>
    public void UpdateNodeValues(List<PathfindingNode> nodes)
    {
        if (!enableEducationalMode || !showHeuristicValues) return;
        
        foreach (var node in nodes)
        {
            if (activeNodes.ContainsKey(node.id))
            {
                UpdateHeuristicDisplay(activeNodes[node.id], node);
            }
        }
    }
    
    /// <summary>
    /// Set current algorithm color for node visualization
    /// </summary>
    public void SetNodeColor(Color algorithmColor)
    {
        currentAlgorithmColor = algorithmColor;
        
        // Update all active nodes
        foreach (var nodeViz in activeNodes.Values)
        {
            UpdateNodeAppearance(nodeViz);
        }
    }
    
    /// <summary>
    /// Clear all node visualizations
    /// </summary>
    public void ClearAll()
    {
        foreach (var nodeViz in activeNodes.Values)
        {
            ReturnNodeToPool(nodeViz.nodeMarker);
            ReturnUIToPool(nodeViz.heuristicUI);
        }
        
        activeNodes.Clear();
        isVisualizationActive = false;
        
        Debug.Log("All node visualizations cleared");
    }
    
    #endregion
    
    #region Node Creation and Management
    
    NodeVisualization CreateNodeVisualization(PathfindingNode node, NodeState initialState)
    {
        // Get node marker from pool
        GameObject nodeMarker = GetNodeFromPool();
        if (nodeMarker == null)
        {
            Debug.LogError("Failed to get node marker from pool");
            return default(NodeVisualization);
        }
        
        // Position at node location
        Vector3 worldPos = GeoToWorldPosition(node.geoCoordinate);
        nodeMarker.transform.position = worldPos;
        nodeMarker.SetActive(true);
        
        // Get UI element if educational mode is enabled
        GameObject heuristicUI = null;
        if (enableEducationalMode && showHeuristicValues)
        {
            heuristicUI = GetUIFromPool();
            if (heuristicUI != null)
            {
                heuristicUI.transform.position = worldPos + Vector3.up * 2f;
                heuristicUI.SetActive(true);
            }
        }
        
        NodeVisualization nodeViz = new NodeVisualization
        {
            node = node,
            nodeMarker = nodeMarker,
            heuristicUI = heuristicUI,
            state = initialState,
            creationTime = Time.time,
            lastUpdateTime = Time.time,
            originalScale = nodeMarker.transform.localScale
        };
        
        UpdateNodeAppearance(nodeViz);
        
        return nodeViz;
    }
    
    void UpdateNodeAppearance(NodeVisualization nodeViz)
    {
        if (nodeViz.nodeMarker == null) return;
        
        Renderer renderer = nodeViz.nodeMarker.GetComponent<Renderer>();
        if (renderer == null) return;
        
        // Select color and material based on state
        Color nodeColor;
        Material nodeMaterial;
        
        switch (nodeViz.state)
        {
            case NodeState.Explored:
                nodeColor = ColorUtils.BlendColors(exploredNodeColor, currentAlgorithmColor, 0.3f);
                nodeMaterial = exploredNodeMaterial;
                break;
                
            case NodeState.Current:
                nodeColor = currentNodeColor;
                nodeMaterial = currentNodeMaterial;
                break;
                
            case NodeState.OpenList:
                nodeColor = openListColor;
                nodeMaterial = openListMaterial;
                break;
                
            case NodeState.ClosedList:
                nodeColor = closedListColor;
                nodeMaterial = closedListMaterial;
                break;
                
            default:
                nodeColor = currentAlgorithmColor;
                nodeMaterial = exploredNodeMaterial;
                break;
        }
        
        // Apply appearance
        if (nodeMaterial != null)
        {
            renderer.material = nodeMaterial;
        }
        renderer.material.color = nodeColor;
    }
    
    void UpdateHeuristicDisplay(NodeVisualization nodeViz, PathfindingNode node)
    {
        if (nodeViz.heuristicUI == null) return;
        
        var textComponent = nodeViz.heuristicUI.GetComponentInChildren<TextMeshProUGUI>();
        if (textComponent == null) return;
        
        // Format heuristic values for display
        string displayText = "";
        
        switch (currentAlgorithm)
        {
            case PathfindingAlgorithm.AlgorithmType.AStar:
                displayText = $"f={node.totalDistance:F1}\ng={node.distanceFromStart:F1}\nh={node.distanceToEnd:F1}";
                break;
                
            case PathfindingAlgorithm.AlgorithmType.Dijkstra:
                displayText = $"dist={node.distanceFromStart:F1}\nid={node.id}";
                break;
                
            case PathfindingAlgorithm.AlgorithmType.Greedy:
                displayText = $"h={node.distanceToEnd:F1}\nid={node.id}";
                break;
                
            case PathfindingAlgorithm.AlgorithmType.BidirectionalSearch:
                displayText = $"dist={node.distanceFromStart:F1}\ndir={node.searchDirection}\nid={node.id}";
                break;
                
            default:
                displayText = $"id={node.id}\nvisited={node.visited}";
                break;
        }
        
        textComponent.text = displayText;
        
        // Color text based on algorithm
        textComponent.color = ColorUtils.BlendColors(heuristicTextColor, currentAlgorithmColor, 0.2f);
    }
    
    #endregion
    
    #region Animation
    
    IEnumerator AnimateNodeAppearance(NodeVisualization nodeViz)
    {
        if (nodeViz.nodeMarker == null) yield break;
        
        Transform nodeTransform = nodeViz.nodeMarker.transform;
        Vector3 targetScale = nodeViz.originalScale;
        
        // Start from zero scale
        nodeTransform.localScale = Vector3.zero;
        
        float elapsed = 0f;
        while (elapsed < nodeAppearDuration)
        {
            elapsed += Time.deltaTime;
            float progress = elapsed / nodeAppearDuration;
            float curveValue = nodeAppearCurve.Evaluate(progress);
            
            nodeTransform.localScale = Vector3.Lerp(Vector3.zero, targetScale, curveValue);
            
            yield return null;
        }
        
        nodeTransform.localScale = targetScale;
    }
    
    IEnumerator AnimateCurrentNode(NodeVisualization nodeViz)
    {
        if (nodeViz.nodeMarker == null) yield break;
        
        Transform nodeTransform = nodeViz.nodeMarker.transform;
        Vector3 originalScale = nodeViz.originalScale;
        Vector3 pulseScale = originalScale * nodeScalePulse;
        
        float pulseDuration = 0.5f;
        float elapsed = 0f;
        
        while (elapsed < pulseDuration && nodeViz.state == NodeState.Current)
        {
            elapsed += Time.deltaTime;
            float progress = elapsed / pulseDuration;
            float curveValue = pulseCurve.Evaluate(progress);
            
            nodeTransform.localScale = Vector3.Lerp(originalScale, pulseScale, curveValue);
            
            yield return null;
        }
        
        // Return to original scale
        if (nodeViz.nodeMarker != null)
        {
            nodeTransform.localScale = originalScale;
        }
    }
    
    void UpdateNodeAnimations()
    {
        // Update any ongoing node animations
        // This can include floating animations, rotation, color pulsing, etc.
        
        foreach (var nodeViz in activeNodes.Values)
        {
            if (nodeViz.nodeMarker != null && nodeViz.state == NodeState.Current)
            {
                // Rotate current node for visibility
                nodeViz.nodeMarker.transform.Rotate(Vector3.up, 90f * Time.deltaTime);
            }
        }
    }
    
    #endregion
    
    #region Pool Management
    
    GameObject GetNodeFromPool()
    {
        if (nodePool.Count > 0)
        {
            return nodePool.Dequeue();
        }
        
        // Create new node if pool is empty
        return CreateNodeMarker();
    }
    
    GameObject GetUIFromPool()
    {
        if (uiPool.Count > 0)
        {
            return uiPool.Dequeue();
        }
        
        // Create new UI if pool is empty
        return CreateHeuristicUI();
    }
    
    void ReturnNodeToPool(GameObject nodeObject)
    {
        if (nodeObject != null)
        {
            nodeObject.SetActive(false);
            nodePool.Enqueue(nodeObject);
        }
    }
    
    void ReturnUIToPool(GameObject uiObject)
    {
        if (uiObject != null)
        {
            uiObject.SetActive(false);
            uiPool.Enqueue(uiObject);
        }
    }
    
    #endregion
    
    #region Cleanup
    
    void CleanupExpiredNodes()
    {
        List<long> nodesToRemove = new List<long>();
        float currentTime = Time.time;
        
        foreach (var kvp in activeNodes)
        {
            NodeVisualization nodeViz = kvp.Value;
            
            // Remove nodes that haven't been updated in a while
            if (currentTime - nodeViz.lastUpdateTime > 10f)
            {
                nodesToRemove.Add(kvp.Key);
                ReturnNodeToPool(nodeViz.nodeMarker);
                ReturnUIToPool(nodeViz.heuristicUI);
            }
        }
        
        foreach (int nodeId in nodesToRemove)
        {
            activeNodes.Remove(nodeId);
        }
        
        if (nodesToRemove.Count > 0)
        {
            Debug.Log($"Cleaned up {nodesToRemove.Count} expired node visualizations");
        }
    }
    
    #endregion
    
    #region Utility
    
    Vector3 GeoToWorldPosition(Vector2 geoCoordinate)
    {
        // Simple conversion - should integrate with Online Maps
        float x = geoCoordinate.x * 1000f;
        float z = geoCoordinate.y * 1000f;
        return new Vector3(x, 1f, z);
    }
    
    /// <summary>
    /// Get visualization statistics
    /// </summary>
    public NodeVisualizationStats GetStats()
    {
        return new NodeVisualizationStats
        {
            activeNodes = activeNodes.Count,
            nodePoolSize = nodePool.Count,
            uiPoolSize = uiPool.Count,
            educationalModeEnabled = enableEducationalMode,
            showingHeuristicValues = showHeuristicValues
        };
    }
    
    #endregion
}

#region Data Structures

[System.Serializable]
public struct NodeVisualization
{
    public PathfindingNode node;
    public GameObject nodeMarker;
    public GameObject heuristicUI;
    public NodeState state;
    public float creationTime;
    public float lastUpdateTime;
    public Vector3 originalScale;
}

[System.Serializable]
public struct NodeVisualizationStats
{
    public int activeNodes;
    public int nodePoolSize;
    public int uiPoolSize;
    public bool educationalModeEnabled;
    public bool showingHeuristicValues;
}

public enum NodeState
{
    Explored,
    Current,
    OpenList,
    ClosedList,
    Path,
    StartNode,
    EndNode
}

#endregion