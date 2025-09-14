using System.Collections;
using System.Collections.Generic;
using UnityEngine;

/// <summary>
/// Manages spectacular visual effects for pathfinding algorithm visualization
/// Integrates with OnlineMaps coordinate system for accurate positioning
/// Handles algorithm-specific effects, route drawing, and node exploration
/// </summary>
public class VisualEffectsManager : MonoBehaviour
{
    [Header("Algorithm Effects")]
    public bool enableParticleEffects = true;
    public Color aStarColor = Color.green;
    public Color dijkstraColor = Color.blue;
    public Color greedyColor = Color.yellow;
    public Color bidirectionalColor = Color.red;

    [Header("Route Drawing")]
    public LineRenderer playerRouteRenderer;
    public LineRenderer optimalRouteRenderer;
    public Material routeMaterial;
    public float routeWidth = 0.1f;

    [Header("Node Visualization")]
    public GameObject nodeMarkerPrefab;
    public ParticleSystem nodeExplorationPrefab;
    public ParticleSystem pathCompletionPrefab;

    [Header("Coordinate System")]
    public OnlineMapsBridge mapBridge;

    // State management
    private Color currentAlgorithmColor = Color.white;
    private List<GameObject> activeNodeMarkers = new List<GameObject>();
    private List<ParticleSystem> activeParticles = new List<ParticleSystem>();
    private List<Vector2> playerRoutePoints = new List<Vector2>();
    
    // Route drawing state
    private bool isDrawingPlayerRoute = false;

    void Start()
    {
        InitializeComponents();
    }

    void InitializeComponents()
    {
        // Find OnlineMapsBridge if not assigned
        if (mapBridge == null)
        {
            mapBridge = FindObjectOfType<OnlineMapsBridge>();
            if (mapBridge == null)
            {
                Debug.LogWarning("VisualEffectsManager: No OnlineMapsBridge found - coordinate conversion will not work");
            }
        }

        // Initialize route renderers if not assigned
        if (playerRouteRenderer == null)
        {
            CreateRouteRenderer("PlayerRoute", ref playerRouteRenderer, Color.cyan);
        }
        
        if (optimalRouteRenderer == null)
        {
            CreateRouteRenderer("OptimalRoute", ref optimalRouteRenderer, Color.green);
        }
    }

    void CreateRouteRenderer(string name, ref LineRenderer renderer, Color color)
    {
        GameObject routeObj = new GameObject(name);
        routeObj.transform.SetParent(transform);
        
        renderer = routeObj.AddComponent<LineRenderer>();
        renderer.material = routeMaterial ?? new Material(Shader.Find("Sprites/Default"));
        renderer.material.color = color;
        renderer.startWidth = routeWidth;
        renderer.endWidth = routeWidth;
        renderer.useWorldSpace = true;
        renderer.positionCount = 0;
    }

    #region Algorithm-Specific Effects

    public void SetAlgorithmColor(Color color)
    {
        currentAlgorithmColor = color;
    }

    public void CreateFocusedBeamEffect(Vector2 geoCoordinate, Color color)
    {
        if (!enableParticleEffects) return;
        
        Vector3 worldPos = GetWorldPosition(geoCoordinate);
        if (worldPos != Vector3.zero)
        {
            // Create A* focused beam effect
            CreateParticleEffect(worldPos, color, "AStar_Beam");
        }
    }

    public void CreateRippleEffect(Vector2 geoCoordinate, Color color)
    {
        if (!enableParticleEffects) return;
        
        Vector3 worldPos = GetWorldPosition(geoCoordinate);
        if (worldPos != Vector3.zero)
        {
            // Create Dijkstra ripple effect
            CreateParticleEffect(worldPos, color, "Dijkstra_Ripple");
        }
    }

    public void CreatePursuitEffect(Vector2 geoCoordinate, Color color)
    {
        if (!enableParticleEffects) return;
        
        Vector3 worldPos = GetWorldPosition(geoCoordinate);
        if (worldPos != Vector3.zero)
        {
            // Create Greedy pursuit effect
            CreateParticleEffect(worldPos, color, "Greedy_Pursuit");
        }
    }

    public void CreateWaveEffect(Vector2 geoCoordinate, Color color)
    {
        if (!enableParticleEffects) return;
        
        Vector3 worldPos = GetWorldPosition(geoCoordinate);
        if (worldPos != Vector3.zero)
        {
            // Create Bidirectional wave effect
            CreateParticleEffect(worldPos, color, "Bidirectional_Wave");
        }
    }

    public void CreatePathCompletionEffect(Color color)
    {
        if (!enableParticleEffects || pathCompletionPrefab == null) return;
        
        // Create celebration effect at the end of the path
        ParticleSystem completion = Instantiate(pathCompletionPrefab);
        var main = completion.main;
        main.startColor = color;
        completion.Play();
        
        activeParticles.Add(completion);
        
        // Auto-cleanup after a few seconds
        StartCoroutine(CleanupParticleAfterDelay(completion, 5f));
    }

    public void CreateNodeExplorationBurst(Vector2 geoCoordinate, Color color)
    {
        if (!enableParticleEffects) return;
        
        Vector3 worldPos = GetWorldPosition(geoCoordinate);
        if (worldPos != Vector3.zero)
        {
            CreateParticleEffect(worldPos, color, "Node_Exploration");
        }
    }

    #endregion

    #region Route Drawing

    public void StartPlayerRouteDrawing()
    {
        isDrawingPlayerRoute = true;
        playerRoutePoints.Clear();
        
        if (playerRouteRenderer != null)
        {
            playerRouteRenderer.positionCount = 0;
        }
    }

    public void ExtendPlayerRoute(Vector2 geoCoordinate)
    {
        if (!isDrawingPlayerRoute) return;
        
        playerRoutePoints.Add(geoCoordinate);
        UpdateRouteRenderer(playerRouteRenderer, playerRoutePoints);
    }

    public void CompletePlayerRouteDrawing()
    {
        isDrawingPlayerRoute = false;
    }

    public void DrawRoute(List<Vector2> routePoints, PathfindrRouteType routeType)
    {
        LineRenderer renderer = (routeType == PathfindrRouteType.PlayerRoute) ? playerRouteRenderer : optimalRouteRenderer;
        UpdateRouteRenderer(renderer, routePoints);
    }

    public IEnumerator AnimateRoute(List<Vector2> routePoints, PathfindrRouteType routeType)
    {
        LineRenderer renderer = (routeType == PathfindrRouteType.PlayerRoute) ? playerRouteRenderer : optimalRouteRenderer;
        
        // Animated route drawing
        renderer.positionCount = 0;
        
        for (int i = 0; i < routePoints.Count; i++)
        {
            Vector3 worldPos = GetWorldPosition(routePoints[i]);
            if (worldPos != Vector3.zero)
            {
                renderer.positionCount = i + 1;
                renderer.SetPosition(i, worldPos);
                
                // Add a small delay for animation effect
                yield return new WaitForSeconds(0.1f);
            }
        }
    }

    void UpdateRouteRenderer(LineRenderer renderer, List<Vector2> geoPoints)
    {
        if (renderer == null || geoPoints == null) return;
        
        List<Vector3> worldPoints = new List<Vector3>();
        
        foreach (Vector2 geoPoint in geoPoints)
        {
            Vector3 worldPos = GetWorldPosition(geoPoint);
            if (worldPos != Vector3.zero)
            {
                worldPoints.Add(worldPos);
            }
        }
        
        renderer.positionCount = worldPoints.Count;
        renderer.SetPositions(worldPoints.ToArray());
    }

    #endregion

    #region Node Markers

    public void ShowStartNodeMarker(Vector2 geoCoordinate)
    {
        ShowNodeMarker(geoCoordinate, Color.green, "StartNode");
    }

    public void ShowEndNodeMarker(Vector2 geoCoordinate)
    {
        ShowNodeMarker(geoCoordinate, Color.red, "EndNode");
    }

    public void ShowExploredNode(Vector2 geoCoordinate)
    {
        // Create a brief visual indication of node exploration
        Vector3 worldPos = GetWorldPosition(geoCoordinate);
        if (worldPos != Vector3.zero && enableParticleEffects)
        {
            CreateParticleEffect(worldPos, currentAlgorithmColor, "Explored_Node", 0.5f);
        }
    }

    void ShowNodeMarker(Vector2 geoCoordinate, Color color, string markerName)
    {
        Vector3 worldPos = GetWorldPosition(geoCoordinate);
        if (worldPos == Vector3.zero) return;
        
        GameObject marker = nodeMarkerPrefab != null ? Instantiate(nodeMarkerPrefab) : GameObject.CreatePrimitive(PrimitiveType.Sphere);
        marker.name = markerName;
        marker.transform.position = worldPos;
        marker.transform.localScale = Vector3.one * 0.1f;
        
        // Set marker color
        Renderer markerRenderer = marker.GetComponent<Renderer>();
        if (markerRenderer != null)
        {
            markerRenderer.material.color = color;
        }
        
        activeNodeMarkers.Add(marker);
    }

    #endregion

    #region Visual Helpers

    public void HighlightDrawingArea()
    {
        // Visual feedback for drawing area (optional implementation)
        Debug.Log("VisualEffectsManager: Highlighting drawing area");
    }

    #endregion

    #region Cleanup and Utilities

    public void ClearAll()
    {
        ClearAllForReset();
    }

    public void ClearAllForReset()
    {
        // Clear route renderers
        if (playerRouteRenderer != null) playerRouteRenderer.positionCount = 0;
        if (optimalRouteRenderer != null) optimalRouteRenderer.positionCount = 0;
        
        // Clear node markers
        foreach (GameObject marker in activeNodeMarkers)
        {
            if (marker != null) DestroyImmediate(marker);
        }
        activeNodeMarkers.Clear();
        
        // Clear particle effects
        foreach (ParticleSystem particles in activeParticles)
        {
            if (particles != null) DestroyImmediate(particles.gameObject);
        }
        activeParticles.Clear();
        
        // Reset state
        playerRoutePoints.Clear();
        isDrawingPlayerRoute = false;
    }

    Vector3 GetWorldPosition(Vector2 geoCoordinate)
    {
        if (mapBridge != null)
        {
            return mapBridge.GeoCoordinateToWorldPosition(geoCoordinate);
        }
        
        // Fallback: basic coordinate conversion (should not be used in production)
        Debug.LogWarning("VisualEffectsManager: Using fallback coordinate conversion - OnlineMapsBridge not connected");
        return new Vector3(geoCoordinate.x * 1000f, 0.1f, geoCoordinate.y * 1000f);
    }

    void CreateParticleEffect(Vector3 worldPosition, Color color, string effectName, float duration = 2f)
    {
        ParticleSystem particles;
        
        if (nodeExplorationPrefab != null)
        {
            particles = Instantiate(nodeExplorationPrefab);
        }
        else
        {
            // Create basic particle system if no prefab
            GameObject particleObj = new GameObject($"ParticleEffect_{effectName}");
            particles = particleObj.AddComponent<ParticleSystem>();
            
            var main = particles.main;
            main.startColor = color;
            main.startSize = 0.1f;
            main.startLifetime = duration;
            main.maxParticles = 50;
        }
        
        particles.transform.position = worldPosition;
        particles.name = $"VFX_{effectName}";
        
        var mainModule = particles.main;
        mainModule.startColor = color;
        
        particles.Play();
        activeParticles.Add(particles);
        
        // Auto-cleanup
        StartCoroutine(CleanupParticleAfterDelay(particles, duration + 1f));
    }

    IEnumerator CleanupParticleAfterDelay(ParticleSystem particles, float delay)
    {
        yield return new WaitForSeconds(delay);
        
        if (particles != null)
        {
            activeParticles.Remove(particles);
            DestroyImmediate(particles.gameObject);
        }
    }

    #endregion
}

// Support enums
public enum PathfindrRouteType
{
    PlayerRoute,
    OptimalRoute,
    AlgorithmExploration
}