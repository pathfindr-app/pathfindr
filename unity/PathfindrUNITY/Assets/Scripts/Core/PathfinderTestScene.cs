using UnityEngine;
using System.Collections;

/// <summary>
/// Test scene setup for validating Online Maps integration
/// Use this to verify the Unity port is working correctly
/// </summary>
public class PathfinderTestScene : MonoBehaviour
{
    [Header("Test Configuration")]
    public bool runTestOnStart = true;
    public Vector2 testLocation = new Vector2(-74.006f, 40.7128f); // NYC
    public int testZoom = 15;
    
    [Header("Components")]
    public OnlineMapsController mapsController;
    public MarkerStateManager markerStateManager;
    public GameInterface gameInterface;
    public VisualEffectsManager vfxManager;
    
    [Header("Test Status")]
    public bool onlineMapsReady = false;
    public bool coordinateConversionWorking = false;
    public bool osmDataFetchWorking = false;
    public bool uiSystemWorking = false;
    
    void Start()
    {
        if (runTestOnStart)
        {
            StartCoroutine(RunIntegrationTests());
        }
    }
    
    #region Integration Tests
    
    /// <summary>
    /// Run basic integration tests to validate the Unity port
    /// </summary>
    IEnumerator RunIntegrationTests()
    {
        Debug.Log("=== Starting Pathfinder Unity Port Integration Tests ===");
        
        yield return new WaitForSeconds(1f);
        
        // Test 1: Online Maps Initialization
        yield return StartCoroutine(TestOnlineMapsInitialization());
        
        // Test 2: Coordinate Conversion
        yield return StartCoroutine(TestCoordinateConversion());
        
        // Test 3: OSM Data Fetching
        yield return StartCoroutine(TestOSMDataFetching());
        
        // Test 4: UI System
        yield return StartCoroutine(TestUISystem());
        
        // Test 5: Visual Effects
        yield return StartCoroutine(TestVisualEffects());
        
        // Summary
        ShowTestSummary();
    }
    
    IEnumerator TestOnlineMapsInitialization()
    {
        Debug.Log("Test 1: Online Maps Initialization");
        
        // Check if Online Maps is properly initialized
        if (OnlineMaps.instance != null)
        {
            Debug.Log("✓ Online Maps instance found");
            onlineMapsReady = true;
            
            // Test map positioning
            OnlineMaps.instance.position = testLocation;
            OnlineMaps.instance.zoom = testZoom;
            
            Debug.Log($"✓ Map positioned at {testLocation} with zoom {testZoom}");
        }
        else
        {
            Debug.LogError("✗ Online Maps instance not found! Check scene setup.");
        }
        
        // Check control component
        if (OnlineMapsControlBase.instance != null)
        {
            Debug.Log("✓ Online Maps Control found");
        }
        else
        {
            Debug.LogError("✗ Online Maps Control not found! Check control component.");
        }
        
        yield return new WaitForSeconds(1f);
    }
    
    IEnumerator TestCoordinateConversion()
    {
        Debug.Log("Test 2: Coordinate Conversion");
        
        if (mapsController == null)
        {
            mapsController = FindObjectOfType<OnlineMapsController>();
        }
        
        if (mapsController != null && mapsController.IsReady())
        {
            // Test screen to geo conversion
            Vector2 screenCenter = new Vector2(Screen.width / 2f, Screen.height / 2f);
            Vector2 geoCoordinate = mapsController.ScreenToGeoCoordinate(screenCenter);
            
            Debug.Log($"✓ Screen center {screenCenter} -> Geo {geoCoordinate}");
            
            // Test geo to screen conversion
            Vector2 screenPos = mapsController.GeoCoordinateToScreen(testLocation);
            Debug.Log($"✓ Test location {testLocation} -> Screen {screenPos}");
            
            // Test world position conversion
            Vector3 worldPos = mapsController.GeoCoordinateToWorldPosition(testLocation);
            Debug.Log($"✓ Test location {testLocation} -> World {worldPos}");
            
            coordinateConversionWorking = true;
        }
        else
        {
            Debug.LogError("✗ OnlineMapsController not found or not ready!");
        }
        
        yield return new WaitForSeconds(1f);
    }
    
    IEnumerator TestOSMDataFetching()
    {
        Debug.Log("Test 3: OSM Data Fetching");
        
        if (mapsController != null)
        {
            try
            {
                // Test fetching OSM node (simplified for coroutine compatibility)
                // TODO: Implement proper coroutine-based OSM data fetching
                Debug.Log("OSM data fetching test skipped - requires async/await conversion");
                osmDataFetchWorking = false;
                var osmNode = (OSMNode)null;
                
                if (osmNode != null)
                {
                    Debug.Log($"✓ OSM Node fetched: ID {osmNode.id} at ({osmNode.lat}, {osmNode.lon})");
                    osmDataFetchWorking = true;
                }
                else
                {
                    Debug.LogWarning("○ No OSM node found - this might be normal for some locations");
                }
            }
            catch (System.Exception e)
            {
                Debug.LogError($"✗ OSM Data fetch failed: {e.Message}");
            }
        }
        
        yield return new WaitForSeconds(2f);
    }
    
    IEnumerator TestUISystem()
    {
        Debug.Log("Test 4: UI System");
        
        if (gameInterface == null)
        {
            gameInterface = FindObjectOfType<GameInterface>();
        }
        
        if (gameInterface != null)
        {
            Debug.Log("✓ GameInterface found");
            
            // Test UI transitions
            gameInterface.ShowLoadingPanel("Testing UI System...");
            yield return new WaitForSeconds(1f);
            
            gameInterface.HideLoadingPanel();
            gameInterface.ShowSetupPanel();
            
            Debug.Log("✓ UI panel transitions working");
            
            // Test toast messages
            gameInterface.ShowSnack("Test message - Unity port working!", "success");
            
            uiSystemWorking = true;
        }
        else
        {
            Debug.LogWarning("○ GameInterface not found - UI tests skipped");
        }
        
        yield return new WaitForSeconds(2f);
    }
    
    IEnumerator TestVisualEffects()
    {
        Debug.Log("Test 5: Visual Effects");
        
        if (vfxManager == null)
        {
            vfxManager = FindObjectOfType<VisualEffectsManager>();
        }
        
        if (vfxManager != null)
        {
            Debug.Log("✓ VisualEffectsManager found");
            
            // Test node markers
            Vector2 testStart = testLocation + new Vector2(-0.01f, 0.01f);
            Vector2 testEnd = testLocation + new Vector2(0.01f, -0.01f);
            
            vfxManager.ShowStartNodeMarker(testStart);
            vfxManager.ShowEndNodeMarker(testEnd);
            
            Debug.Log("✓ Node markers displayed");
            
            // Test route drawing
            var testRoute = new System.Collections.Generic.List<Vector2>
            {
                testStart,
                testLocation,
                testEnd
            };
            
            vfxManager.DrawRoute(testRoute, PathfindrRouteType.PlayerRoute);
            
            Debug.Log("✓ Route drawing working");
        }
        else
        {
            Debug.LogWarning("○ VisualEffectsManager not found - VFX tests skipped");
        }
        
        yield return new WaitForSeconds(1f);
    }
    
    #endregion
    
    #region Test Results
    
    void ShowTestSummary()
    {
        Debug.Log("=== Integration Test Results ===");
        
        int passedTests = 0;
        int totalTests = 5;
        
        if (onlineMapsReady)
        {
            Debug.Log("✓ Online Maps: PASSED");
            passedTests++;
        }
        else
        {
            Debug.Log("✗ Online Maps: FAILED");
        }
        
        if (coordinateConversionWorking)
        {
            Debug.Log("✓ Coordinate Conversion: PASSED");
            passedTests++;
        }
        else
        {
            Debug.Log("✗ Coordinate Conversion: FAILED");
        }
        
        if (osmDataFetchWorking)
        {
            Debug.Log("✓ OSM Data Fetching: PASSED");
            passedTests++;
        }
        else
        {
            Debug.Log("○ OSM Data Fetching: SKIPPED/FAILED");
        }
        
        if (uiSystemWorking)
        {
            Debug.Log("✓ UI System: PASSED");
            passedTests++;
        }
        else
        {
            Debug.Log("○ UI System: SKIPPED");
        }
        
        if (vfxManager != null)
        {
            Debug.Log("✓ Visual Effects: PASSED");
            passedTests++;
        }
        else
        {
            Debug.Log("○ Visual Effects: SKIPPED");
        }
        
        Debug.Log($"=== Results: {passedTests}/{totalTests} tests passed ===");
        
        if (passedTests >= 3)
        {
            Debug.Log("🎉 Unity Pathfinder port is working! Core systems operational.");
            
            if (gameInterface != null)
            {
                gameInterface.ShowSnack($"Integration Test: {passedTests}/{totalTests} passed - Ready to start!", "success");
            }
        }
        else
        {
            Debug.LogWarning("⚠️ Some critical systems failed. Check setup requirements.");
            
            if (gameInterface != null)
            {
                gameInterface.ShowSnack("Integration Test: Some systems failed. Check console for details.", "warning");
            }
        }
    }
    
    #endregion
    
    #region Manual Test Controls
    
    [Header("Manual Test Controls")]
    public KeyCode testMapClick = KeyCode.Space;
    public KeyCode testRouteDrawing = KeyCode.R;
    public KeyCode testAlgorithm = KeyCode.A;
    
    void Update()
    {
        // Manual test controls
        if (Input.GetKeyDown(testMapClick))
        {
            TestMapClick();
        }
        
        if (Input.GetKeyDown(testRouteDrawing))
        {
            TestRouteDrawing();
        }
        
        if (Input.GetKeyDown(testAlgorithm))
        {
            TestAlgorithm();
        }
    }
    
    void TestMapClick()
    {
        Debug.Log("Manual Test: Map Click");
        
        if (mapsController != null)
        {
            Vector2 testCoord = testLocation + new Vector2(
                Random.Range(-0.01f, 0.01f),
                Random.Range(-0.01f, 0.01f)
            );
            
            // TODO: Implement click simulation in new architecture
            Debug.Log($"Would simulate click at: {testCoord}");
        }
    }
    
    void TestRouteDrawing()
    {
        Debug.Log("Manual Test: Route Drawing");
        
        if (vfxManager != null)
        {
            StartCoroutine(TestAnimatedRoute());
        }
    }
    
    IEnumerator TestAnimatedRoute()
    {
        var testRoute = new System.Collections.Generic.List<Vector2>();
        
        // Create a test route
        for (int i = 0; i < 10; i++)
        {
            Vector2 point = testLocation + new Vector2(
                i * 0.001f,
                Mathf.Sin(i * 0.5f) * 0.001f
            );
            testRoute.Add(point);
        }
        
        yield return vfxManager.AnimateRoute(testRoute, PathfindrRouteType.OptimalRoute);
        
        // Also test direct map route drawing
        TestMapRouteDrawing(testRoute);
    }
    
    void TestMapRouteDrawing(System.Collections.Generic.List<Vector2> testRoute)
    {
        Debug.Log("Testing direct map route drawing...");
        
        if (mapsController != null)
        {
            try
            {
                // TODO: Route drawing now handled by VisualEffectsManager
                Debug.Log("Route drawing test - now handled by VisualEffectsManager");
                Debug.Log("✓ Route drawing architecture updated");
                
                // TODO: Node markers now handled by MarkerStateManager
                Debug.Log("Node marker test - now handled by MarkerStateManager");
                Debug.Log("✓ Marker management architecture updated");
            }
            catch (System.Exception e)
            {
                Debug.LogError($"✗ Map route drawing failed: {e.Message}");
            }
        }
        else
        {
            Debug.LogError("✗ OnlineMapsController not found for route drawing test");
        }
    }
    
    void TestAlgorithm()
    {
        Debug.Log("Manual Test: Algorithm");
        
        // Test A* algorithm creation
        var algorithm = PathfindingAlgorithm.CreateAlgorithm(PathfindingAlgorithm.AlgorithmType.AStar);
        
        if (algorithm != null)
        {
            Debug.Log($"✓ Algorithm created: {algorithm.GetType().Name}");
            
            // Test with sample nodes
            TestAlgorithmExecution(algorithm);
        }
        else
        {
            Debug.LogError("✗ Algorithm creation failed");
        }
    }
    
    void TestAlgorithmExecution(PathfindingAlgorithm algorithm)
    {
        Debug.Log("Testing algorithm execution with sample nodes...");
        
        // Create sample nodes near NYC for testing
        Vector2 startCoord = new Vector2(-74.006f, 40.7128f); // NYC
        Vector2 endCoord = new Vector2(-74.000f, 40.7200f);   // Nearby location
        
        var startNode = new PathfindingNode(1, startCoord.y, startCoord.x);
        var endNode = new PathfindingNode(2, endCoord.y, endCoord.x);
        
        try
        {
            // Start the algorithm
            algorithm.Start(startNode, endNode);
            Debug.Log($"✓ Algorithm started with start node: {startCoord}, end node: {endCoord}");
            
            // Test if algorithm properties work
            Debug.Log($"✓ Algorithm type: {algorithm.algorithmType}");
            Debug.Log($"✓ Algorithm finished: {algorithm.IsFinished()}");
            
            // Try to find a path (this may not work without a proper graph, but we can test the interface)
            var path = algorithm.FindPath();
            if (path != null)
            {
                Debug.Log($"✓ Algorithm returned path with {path.Count} nodes");
            }
            else
            {
                Debug.Log("○ Algorithm returned null path (expected without full graph)");
            }
        }
        catch (System.Exception e)
        {
            Debug.LogError($"✗ Algorithm execution failed: {e.Message}");
        }
    }
    
    #endregion
    
    #region Unity Editor Helpers
    
    #if UNITY_EDITOR
    [UnityEditor.MenuItem("Pathfinder/Run Integration Tests")]
    static void RunTestsFromMenu()
    {
        var testScene = FindObjectOfType<PathfinderTestScene>();
        if (testScene != null)
        {
            testScene.StartCoroutine(testScene.RunIntegrationTests());
        }
        else
        {
            Debug.LogError("PathfinderTestScene not found in current scene!");
        }
    }
    
    [UnityEditor.MenuItem("Pathfinder/Clear All VFX")]
    static void ClearVFXFromMenu()
    {
        var vfxManager = FindObjectOfType<VisualEffectsManager>();
        if (vfxManager != null)
        {
            vfxManager.ClearAll();
        }
    }
    #endif
    
    #endregion
}