using System.Collections;
using UnityEngine;

/// <summary>
/// Test script to verify pathfinding visualization works with OnlineMapsPathVisualizer
/// Creates test pathfinding execution and monitors visualization pipeline
/// </summary>
public class PathfindingVisualizationTester : MonoBehaviour
{
    [Header("Test Configuration")]
    public bool runTestOnStart = true;
    public bool useDrawingAPI = true; // Toggle between new and old system

    [Header("Test Parameters")]
    public Vector2 testStartCoordinate = new Vector2(-74.0060f, 40.7128f); // NYC
    public Vector2 testEndCoordinate = new Vector2(-74.0070f, 40.7138f);   // NYC nearby

    [Header("Component References")]
    public AlgorithmStepExecutor algorithmExecutor;
    public PathSegmentTimeline timeline;
    public OnlineMapsPathVisualizer pathVisualizer;
    public PathSegmentRenderer legacyRenderer;
    public MapController mapController;

    [Header("Test Results")]
    public bool testPassed = false;
    public string testResults = "";
    public int segmentsCreated = 0;
    public int linesRendered = 0;

    void Start()
    {
        if (runTestOnStart)
        {
            StartCoroutine(RunVisualizationTest());
        }
    }

    /// <summary>
    /// Comprehensive test of the pathfinding visualization pipeline
    /// </summary>
    IEnumerator RunVisualizationTest()
    {
        Debug.Log("🧪 === PATHFINDING VISUALIZATION TEST STARTED ===");
        testResults = "Test started...\n";

        // Step 1: Find and verify components
        yield return VerifyComponents();

        // Step 2: Test basic Drawing API functionality
        yield return TestBasicDrawingAPI();

        // Step 3: Test timeline integration
        yield return TestTimelineIntegration();

        // Step 4: Test coordinate system
        yield return TestCoordinateSystem();

        // Step 5: Test algorithm integration (if map data available)
        if (mapController != null && mapController.currentGraph != null)
        {
            yield return TestAlgorithmExecution();
        }
        else
        {
            testResults += "⚠️ Skipping algorithm test - no map data loaded\n";
        }

        // Final results
        LogTestResults();
        Debug.Log("🧪 === PATHFINDING VISUALIZATION TEST COMPLETED ===");
    }

    /// <summary>
    /// Verify all required components are present and properly connected
    /// </summary>
    IEnumerator VerifyComponents()
    {
        Debug.Log("🔍 Step 1: Verifying components...");
        testResults += "1. Component Verification:\n";

        // Find components if not assigned
        if (algorithmExecutor == null)
            algorithmExecutor = FindObjectOfType<AlgorithmStepExecutor>();

        if (timeline == null)
            timeline = FindObjectOfType<PathSegmentTimeline>();

        if (pathVisualizer == null)
            pathVisualizer = FindObjectOfType<OnlineMapsPathVisualizer>();

        if (legacyRenderer == null)
            legacyRenderer = FindObjectOfType<PathSegmentRenderer>();

        if (mapController == null)
            mapController = FindObjectOfType<MapController>();

        // Check Online Maps
        OnlineMaps map = FindObjectOfType<OnlineMaps>();
        OnlineMapsDrawingElementManager drawingManager = map?.drawingElementManager;

        // Log results
        testResults += $"  ✓ AlgorithmStepExecutor: {algorithmExecutor != null}\n";
        testResults += $"  ✓ PathSegmentTimeline: {timeline != null}\n";
        testResults += $"  ✓ OnlineMapsPathVisualizer: {pathVisualizer != null}\n";
        testResults += $"  ✓ PathSegmentRenderer (legacy): {legacyRenderer != null}\n";
        testResults += $"  ✓ OnlineMaps: {map != null}\n";
        testResults += $"  ✓ DrawingElementManager: {drawingManager != null}\n";
        testResults += $"  ✓ MapController: {mapController != null}\n";

        // Check timeline connections
        if (algorithmExecutor != null)
        {
            bool timelineConnected = algorithmExecutor.timeline == timeline;
            bool visualizerConnected = algorithmExecutor.pathVisualizer == pathVisualizer;

            testResults += $"  ✓ Timeline connected: {timelineConnected}\n";
            testResults += $"  ✓ Visualizer connected: {visualizerConnected}\n";
        }

        yield return new WaitForSeconds(0.5f);
    }

    /// <summary>
    /// Test basic Online Maps Drawing API functionality
    /// </summary>
    IEnumerator TestBasicDrawingAPI()
    {
        Debug.Log("🎨 Step 2: Testing basic Drawing API...");
        testResults += "\n2. Drawing API Test:\n";

        OnlineMaps map = FindObjectOfType<OnlineMaps>();
        if (map?.drawingElementManager == null)
        {
            testResults += "  ❌ Drawing API not available\n";
            yield break;
        }

        // Create test line
        var testPoints = new System.Collections.Generic.List<Vector2>
        {
            testStartCoordinate,
            testEndCoordinate
        };

        OnlineMapsDrawingLine testLine = new OnlineMapsDrawingLine(testPoints, Color.red, 5f);
        testLine.checkMapBoundaries = false;

        map.drawingElementManager.Add(testLine);

        testResults += $"  ✓ Test line created: {testStartCoordinate} → {testEndCoordinate}\n";
        testResults += $"  ✓ Line visible: {testLine.visible}\n";
        testResults += $"  ✓ Drawing elements: {map.drawingElementManager.Count}\n";

        yield return new WaitForSeconds(1f);

        // Remove test line
        map.drawingElementManager.Remove(testLine);
        testResults += "  ✓ Test line removed\n";

        yield return new WaitForSeconds(0.5f);
    }

    /// <summary>
    /// Test PathSegmentTimeline integration
    /// </summary>
    IEnumerator TestTimelineIntegration()
    {
        Debug.Log("⏱️ Step 3: Testing timeline integration...");
        testResults += "\n3. Timeline Integration Test:\n";

        if (timeline == null)
        {
            testResults += "  ❌ Timeline not available\n";
            yield break;
        }

        // Clear timeline
        timeline.ClearTimeline();
        testResults += "  ✓ Timeline cleared\n";

        // Add test segments
        timeline.AddPathSegment(testStartCoordinate, testEndCoordinate, "path");

        Vector2 midPoint = Vector2.Lerp(testStartCoordinate, testEndCoordinate, 0.5f);
        timeline.AddPathSegment(testEndCoordinate, midPoint, "route");

        segmentsCreated = timeline.segments.Count;
        testResults += $"  ✓ Segments added: {segmentsCreated}\n";
        testResults += $"  ✓ Timeline duration: {timeline.totalDuration:F1}ms\n";

        // Test active segments retrieval
        var activeSegments = timeline.GetActiveSegmentsAtTime(0f);
        testResults += $"  ✓ Active segments at t=0: {activeSegments.Count}\n";

        yield return new WaitForSeconds(0.5f);
    }

    /// <summary>
    /// Test coordinate system accuracy
    /// </summary>
    IEnumerator TestCoordinateSystem()
    {
        Debug.Log("🌍 Step 4: Testing coordinate system...");
        testResults += "\n4. Coordinate System Test:\n";

        OnlineMapsBridge bridge = FindObjectOfType<OnlineMapsBridge>();
        if (bridge != null)
        {
            // Test coordinate conversion
            Vector3 worldPos = bridge.GeoCoordinateToWorldPosition(testStartCoordinate);
            Vector2 backToGeo = bridge.WorldPositionToGeoCoordinate(worldPos);

            float conversionError = Vector2.Distance(testStartCoordinate, backToGeo);

            testResults += $"  ✓ Original: {testStartCoordinate}\n";
            testResults += $"  ✓ World: {worldPos}\n";
            testResults += $"  ✓ Back to geo: {backToGeo}\n";
            testResults += $"  ✓ Conversion error: {conversionError:F8}\n";

            if (conversionError < 0.00001f)
            {
                testResults += "  ✅ Coordinate precision: EXCELLENT\n";
            }
            else if (conversionError < 0.001f)
            {
                testResults += "  ⚠️ Coordinate precision: ACCEPTABLE\n";
            }
            else
            {
                testResults += "  ❌ Coordinate precision: POOR\n";
            }
        }
        else
        {
            testResults += "  ℹ️ OnlineMapsBridge not found - using Drawing API directly\n";
            testResults += "  ✓ Drawing API uses geographic coordinates directly\n";
        }

        yield return new WaitForSeconds(0.5f);
    }

    /// <summary>
    /// Test full algorithm execution with visualization
    /// </summary>
    IEnumerator TestAlgorithmExecution()
    {
        Debug.Log("🤖 Step 5: Testing algorithm execution...");
        testResults += "\n5. Algorithm Execution Test:\n";

        if (algorithmExecutor == null || mapController?.currentGraph == null)
        {
            testResults += "  ❌ Algorithm executor or graph not available\n";
            yield break;
        }

        // Find nodes near test coordinates
        var startNode = mapController.currentGraph.FindNearestNode(testStartCoordinate);
        var endNode = mapController.currentGraph.FindNearestNode(testEndCoordinate);

        if (startNode == null || endNode == null)
        {
            testResults += "  ❌ Could not find nodes for test coordinates\n";
            yield break;
        }

        testResults += $"  ✓ Start node: {startNode.id} at {startNode.geoCoordinate}\n";
        testResults += $"  ✓ End node: {endNode.id} at {endNode.geoCoordinate}\n";

        // Create A* algorithm
        AStarAlgorithm astar = new AStarAlgorithm();

        // Start algorithm execution
        timeline.ClearTimeline();
        int initialSegments = timeline.segments.Count;

        algorithmExecutor.StartAlgorithm(astar, startNode, endNode);
        testResults += "  ✓ Algorithm execution started\n";

        // Wait for algorithm to complete (with timeout)
        float timeout = 10f;
        float elapsed = 0f;

        while (algorithmExecutor.isExecuting && elapsed < timeout)
        {
            yield return new WaitForSeconds(0.1f);
            elapsed += 0.1f;
        }

        int finalSegments = timeline.segments.Count;
        testResults += $"  ✓ Algorithm completed in {elapsed:F1}s\n";
        testResults += $"  ✓ Segments created: {finalSegments - initialSegments}\n";
        testResults += $"  ✓ Total steps: {algorithmExecutor.totalStepsExecuted}\n";
        testResults += $"  ✓ Nodes explored: {algorithmExecutor.totalNodesExplored}\n";

        // Check visualization
        if (pathVisualizer != null)
        {
            string stats = pathVisualizer.GetVisualizationStats();
            testResults += $"  ✓ Visualization: {stats}\n";
        }

        segmentsCreated = finalSegments;
        testPassed = (finalSegments > initialSegments) && !algorithmExecutor.isExecuting;

        yield return new WaitForSeconds(1f);
    }

    /// <summary>
    /// Log final test results
    /// </summary>
    void LogTestResults()
    {
        Debug.Log("📋 === TEST RESULTS ===");
        Debug.Log(testResults);

        if (testPassed)
        {
            Debug.Log("✅ PATHFINDING VISUALIZATION TEST: PASSED");
        }
        else
        {
            Debug.Log("❌ PATHFINDING VISUALIZATION TEST: FAILED OR INCOMPLETE");
        }

        Debug.Log($"📊 Segments created: {segmentsCreated}");
        Debug.Log("====================");
    }

    /// <summary>
    /// Manual test trigger for Inspector
    /// </summary>
    [ContextMenu("🧪 Run Visualization Test")]
    public void RunTest()
    {
        StartCoroutine(RunVisualizationTest());
    }

    /// <summary>
    /// Force visualizer to Drawing API mode
    /// </summary>
    [ContextMenu("🎨 Switch to Drawing API")]
    public void SwitchToDrawingAPI()
    {
        if (algorithmExecutor != null)
        {
            // Disable legacy renderer
            if (algorithmExecutor.renderer != null)
            {
                algorithmExecutor.renderer.enabled = false;
            }

            // Enable/create path visualizer
            if (algorithmExecutor.pathVisualizer == null)
            {
                algorithmExecutor.pathVisualizer = algorithmExecutor.gameObject.AddComponent<OnlineMapsPathVisualizer>();
                algorithmExecutor.pathVisualizer.timeline = algorithmExecutor.timeline;
            }

            algorithmExecutor.pathVisualizer.enabled = true;
            Debug.Log("✅ Switched to OnlineMapsPathVisualizer (Drawing API)");
        }
    }

    /// <summary>
    /// Switch to legacy LineRenderer system
    /// </summary>
    [ContextMenu("🖼️ Switch to Legacy Renderer")]
    public void SwitchToLegacyRenderer()
    {
        if (algorithmExecutor != null)
        {
            // Disable path visualizer
            if (algorithmExecutor.pathVisualizer != null)
            {
                algorithmExecutor.pathVisualizer.enabled = false;
            }

            // Enable/create legacy renderer
            if (algorithmExecutor.renderer == null)
            {
                algorithmExecutor.renderer = algorithmExecutor.gameObject.AddComponent<PathSegmentRenderer>();
                algorithmExecutor.renderer.timeline = algorithmExecutor.timeline;
            }

            algorithmExecutor.renderer.enabled = true;
            Debug.Log("✅ Switched to PathSegmentRenderer (Legacy LineRenderer)");
        }
    }
}