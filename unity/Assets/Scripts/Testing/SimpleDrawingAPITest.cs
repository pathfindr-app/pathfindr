using System.Collections.Generic;
using UnityEngine;

/// <summary>
/// Simple test to verify Online Maps Drawing API is working
/// Creates basic lines on the map using geographic coordinates
/// </summary>
public class SimpleDrawingAPITest : MonoBehaviour
{
    [Header("Test Configuration")]
    public bool createTestLinesOnStart = true;
    public Color testLineColor = Color.red;
    public float testLineWidth = 5f;

    [Header("Test Coordinates (NYC)")]
    public Vector2 nycCenter = new Vector2(-74.0060f, 40.7128f);
    public Vector2 nycNorth = new Vector2(-74.0060f, 40.7140f);
    public Vector2 nycEast = new Vector2(-74.0050f, 40.7128f);
    public Vector2 nycSouth = new Vector2(-74.0060f, 40.7116f);
    public Vector2 nycWest = new Vector2(-74.0070f, 40.7128f);

    [Header("Drawing State")]
    public List<OnlineMapsDrawingLine> testLines = new List<OnlineMapsDrawingLine>();

    private OnlineMaps map;
    private OnlineMapsDrawingElementManager drawingManager;

    void Start()
    {
        if (createTestLinesOnStart)
        {
            StartCoroutine(InitializeAndTest());
        }
    }

    /// <summary>
    /// Initialize Online Maps and create test lines
    /// </summary>
    System.Collections.IEnumerator InitializeAndTest()
    {
        // Wait for Online Maps to initialize
        yield return new WaitForSeconds(1f);

        InitializeOnlineMaps();

        if (map != null && drawingManager != null)
        {
            CreateTestLines();
        }
        else
        {
            Debug.LogError("[SimpleDrawingAPITest] Failed to initialize Online Maps components");
        }
    }

    /// <summary>
    /// Find and initialize Online Maps components
    /// </summary>
    void InitializeOnlineMaps()
    {
        map = FindObjectOfType<OnlineMaps>();
        if (map == null)
        {
            Debug.LogError("[SimpleDrawingAPITest] OnlineMaps component not found in scene!");
            return;
        }

        drawingManager = map.drawingElementManager;
        if (drawingManager == null)
        {
            Debug.LogError("[SimpleDrawingAPITest] OnlineMapsDrawingElementManager not found!");
            return;
        }

        Debug.Log($"[SimpleDrawingAPITest] Online Maps initialized successfully");
        Debug.Log($"[SimpleDrawingAPITest] Current map position: {map.position}");
        Debug.Log($"[SimpleDrawingAPITest] Current zoom: {map.floatZoom}");
    }

    /// <summary>
    /// Create test lines in a cross pattern around NYC
    /// </summary>
    void CreateTestLines()
    {
        Debug.Log("[SimpleDrawingAPITest] Creating test lines...");

        // Clear any existing test lines
        ClearTestLines();

        // Create cross pattern lines
        CreateLine("North", nycCenter, nycNorth, Color.red);
        CreateLine("East", nycCenter, nycEast, Color.green);
        CreateLine("South", nycCenter, nycSouth, Color.blue);
        CreateLine("West", nycCenter, nycWest, Color.yellow);

        // Create diagonal lines
        Vector2 nycNE = new Vector2(nycEast.x, nycNorth.y);
        Vector2 nycSE = new Vector2(nycEast.x, nycSouth.y);
        Vector2 nycSW = new Vector2(nycWest.x, nycSouth.y);
        Vector2 nycNW = new Vector2(nycWest.x, nycNorth.y);

        CreateLine("Northeast", nycCenter, nycNE, Color.cyan);
        CreateLine("Southeast", nycCenter, nycSE, Color.magenta);
        CreateLine("Southwest", nycCenter, nycSW, Color.white);
        CreateLine("Northwest", nycCenter, nycNW, Color.gray);

        Debug.Log($"[SimpleDrawingAPITest] Created {testLines.Count} test lines");
        Debug.Log($"[SimpleDrawingAPITest] Total drawing elements: {drawingManager.Count}");

        // Center map on NYC
        map.position = nycCenter;
        map.zoom = 15;
    }

    /// <summary>
    /// Create a single test line
    /// </summary>
    void CreateLine(string name, Vector2 start, Vector2 end, Color color)
    {
        List<Vector2> points = new List<Vector2> { start, end };
        OnlineMapsDrawingLine line = new OnlineMapsDrawingLine(points, color, testLineWidth);

        // Configure line properties
        line.visible = true;
        line.checkMapBoundaries = false; // Allow lines outside map bounds

        // Add to drawing manager
        drawingManager.Add(line);
        testLines.Add(line);

        Debug.Log($"[SimpleDrawingAPITest] Created {name} line: {start} → {end}");
    }

    /// <summary>
    /// Clear all test lines
    /// </summary>
    void ClearTestLines()
    {
        foreach (OnlineMapsDrawingLine line in testLines)
        {
            if (line != null)
            {
                drawingManager.Remove(line);
            }
        }
        testLines.Clear();

        Debug.Log("[SimpleDrawingAPITest] Cleared all test lines");
    }

    /// <summary>
    /// Toggle test line visibility
    /// </summary>
    void ToggleLineVisibility()
    {
        bool newVisibility = testLines.Count > 0 ? !testLines[0].visible : true;

        foreach (OnlineMapsDrawingLine line in testLines)
        {
            if (line != null)
            {
                line.visible = newVisibility;
            }
        }

        Debug.Log($"[SimpleDrawingAPITest] Set line visibility to: {newVisibility}");
    }

    /// <summary>
    /// Change test line colors randomly
    /// </summary>
    void RandomizeLineColors()
    {
        foreach (OnlineMapsDrawingLine line in testLines)
        {
            if (line != null)
            {
                line.color = new Color(Random.value, Random.value, Random.value, 1f);
            }
        }

        Debug.Log("[SimpleDrawingAPITest] Randomized line colors");
    }

    /// <summary>
    /// Manual test methods for Inspector
    /// </summary>
    [ContextMenu("🧪 Create Test Lines")]
    public void ManualCreateTestLines()
    {
        InitializeOnlineMaps();
        if (map != null && drawingManager != null)
        {
            CreateTestLines();
        }
    }

    [ContextMenu("🗑️ Clear Test Lines")]
    public void ManualClearTestLines()
    {
        ClearTestLines();
    }

    [ContextMenu("👁️ Toggle Line Visibility")]
    public void ManualToggleVisibility()
    {
        ToggleLineVisibility();
    }

    [ContextMenu("🎨 Randomize Colors")]
    public void ManualRandomizeColors()
    {
        RandomizeLineColors();
    }

    [ContextMenu("📍 Center on NYC")]
    public void CenterOnNYC()
    {
        if (map != null)
        {
            map.position = nycCenter;
            map.zoom = 15;
            Debug.Log("[SimpleDrawingAPITest] Centered map on NYC");
        }
    }

    /// <summary>
    /// Display current state in Inspector
    /// </summary>
    void OnValidate()
    {
        if (Application.isPlaying && testLines.Count > 0)
        {
            Debug.Log($"[SimpleDrawingAPITest] Active test lines: {testLines.Count}");
        }
    }
}