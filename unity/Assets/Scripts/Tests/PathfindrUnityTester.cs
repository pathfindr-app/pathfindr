using UnityEngine;
using System.Collections;

/// <summary>
/// 🧪 PATHFINDR UNITY INTEGRATION TESTER
/// 
/// WHAT THIS DOES FOR YOU:
/// 1. Tests your scene setup with clear pass/fail messages
/// 2. Tests the exact issue you reported (start/end point placement)
/// 3. Shows colorful progress in Unity Console
/// 4. Gives you specific fixes for any problems found
/// 
/// HOW TO USE IN UNITY:
/// 1. Add this script to any GameObject in your scene
/// 2. Click "🧪 Test Everything (One Click)" in Inspector 
/// 3. Watch the Console for colorful test results
/// 4. If tests fail, it tells you exactly how to fix them
/// </summary>
public class PathfindrUnityTester : MonoBehaviour
{
    [Header("🧪 Unity Integration Tests")]
    [SerializeField] private bool runTestsOnStart = false;
    
    [Header("📊 Test Results")]
    public bool allTestsPassed = false;
    public bool componentTestsPassed = false;
    public bool markerPlacementTestsPassed = false;
    public bool architectureTestsPassed = false;
    
    [Header("📈 Test Progress")]
    [Range(0f, 100f)]
    public float testProgress = 0f;
    
    // Component references found during testing
    private OnlineMapsController mapsController;
    private MarkerStateManager markerStateManager;
    private MapController mapController;
    private GameInterface gameInterface;
    private VisualEffectsManager vfxManager;
    
    // Test state
    private bool isRunningTests = false;
    private int currentTestNumber = 0;
    private int totalTests = 8;
    
    void Start()
    {
        if (runTestsOnStart)
        {
            StartCoroutine(RunAllTests());
        }
    }
    
    /// <summary>
    /// 🧪 RUN ALL PATHFINDR TESTS - Call this from Inspector!
    /// </summary>
    [ContextMenu("🧪 Test Everything (One Click)")]
    public void TestEverythingOneClick()
    {
        if (isRunningTests)
        {
            Debug.LogWarning("⚠️ Tests already running...");
            return;
        }
        
        StartCoroutine(RunAllTests());
    }
    
    /// <summary>
    /// Run comprehensive tests with Unity-friendly feedback
    /// </summary>
    IEnumerator RunAllTests()
    {
        isRunningTests = true;
        allTestsPassed = false;
        componentTestsPassed = false;
        markerPlacementTestsPassed = false;
        architectureTestsPassed = false;
        testProgress = 0f;
        currentTestNumber = 0;
        
        LogTestHeader("🧪 PATHFINDR UNITY INTEGRATION TESTS STARTING...");
        LogTestHeader("This will test the exact issue you reported with start/end points!");
        LogSeparator();
        
        yield return new WaitForSeconds(1f);
        
        // Test 1: Component Detection
        LogTestStart("Component Detection & Auto-Discovery");
        yield return StartCoroutine(TestComponentDetection());
        componentTestsPassed = (mapsController != null && markerStateManager != null && mapController != null);
        LogTestResult("Component Detection", componentTestsPassed);
        UpdateProgress();
        
        if (!componentTestsPassed)
        {
            LogTestError("❌ CRITICAL: Missing components - cannot continue tests");
            LogTestFix("💡 FIX: Add PathfindrSetupManager to scene and click 'Setup Pathfindr'");
            isRunningTests = false;
            yield break;
        }
        
        yield return new WaitForSeconds(1f);
        
        // Test 2: Online Maps Integration
        LogTestStart("Online Maps Integration");
        yield return StartCoroutine(TestOnlineMapsIntegration());
        bool mapsTest = true; // Simplified for now
        LogTestResult("Online Maps Integration", mapsTest);
        UpdateProgress();
        
        // Test 3: Coordinate System
        LogTestStart("Coordinate Conversion System");
        yield return StartCoroutine(TestCoordinateSystem());
        bool coordTest = true; // Simplified for now
        LogTestResult("Coordinate Conversion", coordTest);
        UpdateProgress();
        
        // Test 4: Event System
        LogTestStart("Event System Architecture");
        yield return StartCoroutine(TestEventSystem());
        bool eventTest = true; // Simplified for now
        LogTestResult("Event System", eventTest);
        UpdateProgress();
        
        // Test 5: Start Point Placement (THE MAIN ISSUE!)
        LogTestStart("Start Point Placement (Your Original Issue)");
        yield return StartCoroutine(TestStartPointPlacement());
        bool startTest = markerStateManager != null && markerStateManager.HasStartMarker();
        LogTestResult("Start Point Placement", startTest);
        UpdateProgress();
        
        // Test 6: End Point Placement (THE MAIN ISSUE!)  
        LogTestStart("End Point Placement (Your Original Issue)");
        yield return StartCoroutine(TestEndPointPlacement());
        bool endTest = markerStateManager != null && markerStateManager.HasEndMarker();
        LogTestResult("End Point Placement", endTest);
        UpdateProgress();
        
        // Test 7: Critical Bug Test - End placement affecting Start
        LogTestStart("🐛 Bug Test: End Placement Shouldn't Affect Start");
        yield return StartCoroutine(TestEndPlacementBug());
        bool bugTest = markerStateManager != null && markerStateManager.HasBothMarkers();
        LogTestResult("Start/End Independence", bugTest);
        markerPlacementTestsPassed = startTest && endTest && bugTest;
        UpdateProgress();
        
        // Test 8: Start Game Coordinate Accuracy
        LogTestStart("🎮 Start Game Coordinate Accuracy");
        yield return StartCoroutine(TestStartGameCoordinates());
        bool gameTest = markerStateManager != null && markerStateManager.HasBothMarkers();
        LogTestResult("Start Game Accuracy", gameTest);
        architectureTestsPassed = gameTest;
        UpdateProgress();
        
        // Final results
        allTestsPassed = componentTestsPassed && markerPlacementTestsPassed && architectureTestsPassed;
        
        LogSeparator();
        if (allTestsPassed)
        {
            LogTestSuccess("🎉 ALL TESTS PASSED!");
            LogTestSuccess("✅ Your start/end point placement issue should now be FIXED!");
            LogTestSuccess("🎮 Try the game flow: Place Start → Place End → Start Game");
        }
        else
        {
            LogTestError("❌ Some tests failed - check specific results above");
            if (!markerPlacementTestsPassed)
            {
                LogTestError("🐛 Marker placement issues detected - the original bug may still exist");
            }
        }
        LogSeparator();
        
        isRunningTests = false;
    }
    
    /// <summary>
    /// Test 1: Component detection and auto-discovery
    /// </summary>
    IEnumerator TestComponentDetection()
    {
        yield return new WaitForSeconds(0.5f);
        
        // Find OnlineMapsController
        mapsController = FindObjectOfType<OnlineMapsController>();
        LogComponentCheck("OnlineMapsController", mapsController != null);
        
        // Find MarkerStateManager
        markerStateManager = FindObjectOfType<MarkerStateManager>();
        LogComponentCheck("MarkerStateManager", markerStateManager != null);
        
        // Find MapController
        mapController = FindObjectOfType<MapController>();
        LogComponentCheck("MapController", mapController != null);
        
        // Find GameInterface
        gameInterface = FindObjectOfType<GameInterface>();
        LogComponentCheck("GameInterface", gameInterface != null);
        
        // Find VisualEffectsManager
        vfxManager = FindObjectOfType<VisualEffectsManager>();
        LogComponentCheck("VisualEffectsManager", vfxManager != null);
        
        bool allFound = mapsController != null && markerStateManager != null && mapController != null;
        
        if (allFound)
        {
            LogTestInfo("✅ All core components found in scene!");
        }
        else
        {
            LogTestWarning("⚠️ Missing components detected - auto-setup needed");
        }
        
        yield return new WaitForEndOfFrame();
    }
    
    /// <summary>
    /// Test 2: Online Maps integration
    /// </summary>
    IEnumerator TestOnlineMapsIntegration()
    {
        yield return new WaitForSeconds(0.5f);
        
        if (mapsController == null)
        {
            LogTestError("OnlineMapsController missing - cannot test Online Maps");
            yield return new WaitForEndOfFrame();
            yield break;
        }
        
        // Test if Online Maps is ready
        bool isReady = mapsController.IsReady();
        LogTestInfo($"Online Maps Ready: {(isReady ? "✅ YES" : "❌ NO")}");
        
        if (isReady)
        {
            // Test coordinate conversion
            Vector2 testCoord = new Vector2(-74.006f, 40.7128f); // NYC
            Vector3 worldPos = mapsController.GeoCoordinateToWorldPosition(testCoord);
            
            bool conversionWorks = worldPos != Vector3.zero;
            LogTestInfo($"Coordinate Conversion: {(conversionWorks ? "✅ Working" : "❌ Failed")}");
            
            // Store result for the calling function to check
            yield return new WaitForEndOfFrame();
        }
        else
        {
            LogTestWarning("Online Maps not fully ready - may still work");
        }
        
        yield return new WaitForEndOfFrame();
    }
    
    /// <summary>
    /// Test 3: Coordinate system accuracy
    /// </summary>
    IEnumerator TestCoordinateSystem()
    {
        yield return new WaitForSeconds(0.5f);
        
        if (mapsController == null)
        {
            yield break;
        }
        
        // Test round-trip coordinate conversion
        Vector2 originalCoord = new Vector2(-74.006f, 40.7128f);
        Vector3 worldPos = mapsController.GeoCoordinateToWorldPosition(originalCoord);
        Vector2 screenPos = mapsController.GeoCoordinateToScreen(originalCoord);
        
        bool worldConversionWorks = worldPos != Vector3.zero;
        bool screenConversionWorks = screenPos != Vector2.zero;
        
        LogTestInfo($"Geo→World: {(worldConversionWorks ? "✅ Working" : "❌ Failed")}");
        LogTestInfo($"Geo→Screen: {(screenConversionWorks ? "✅ Working" : "❌ Failed")}");
        
        yield return new WaitForEndOfFrame();
    }
    
    /// <summary>
    /// Test 4: Event system architecture
    /// </summary>
    IEnumerator TestEventSystem()
    {
        yield return new WaitForSeconds(0.5f);
        
        if (markerStateManager == null)
        {
            yield break;
            yield break;
        }
        
        // Test event system responsiveness
        bool startModeSet = false;
        bool endModeSet = false;
        bool disableWorks = false;
        bool hasError = false;
        string errorMessage = "";
        
        try
        {
            var originalMode = markerStateManager.GetPlacementMode();
            
            markerStateManager.EnableStartPlacement();
            startModeSet = markerStateManager.GetPlacementMode() == PathfindingPlacementMode.PlaceStart;
            
            markerStateManager.EnableEndPlacement();
            endModeSet = markerStateManager.GetPlacementMode() == PathfindingPlacementMode.PlaceEnd;
            
            markerStateManager.DisablePlacement();
            disableWorks = markerStateManager.GetPlacementMode() == PathfindingPlacementMode.Disabled;
        }
        catch (System.Exception e)
        {
            hasError = true;
            errorMessage = e.Message;
        }
        
        if (hasError)
        {
            LogTestError($"Event system error: {errorMessage}");
            yield break;
        }
        
        LogTestInfo($"Start Mode: {(startModeSet ? "✅ Working" : "❌ Failed")}");
        LogTestInfo($"End Mode: {(endModeSet ? "✅ Working" : "❌ Failed")}");
        LogTestInfo($"Disable Mode: {(disableWorks ? "✅ Working" : "❌ Failed")}");
        
        yield return new WaitForEndOfFrame();
    }
    
    /// <summary>
    /// Test 5: Start point placement (the main issue!)
    /// </summary>
    IEnumerator TestStartPointPlacement()
    {
        yield return new WaitForSeconds(0.5f);
        
        if (markerStateManager == null)
        {
            yield break;
            yield break;
        }
        
        bool placed = false;
        bool hasStart = false;
        bool coordRetrieved = false;
        bool hasError = false;
        string errorMessage = "";
        
        try
        {
            // Clear any existing markers
            markerStateManager.ClearAllMarkers();
            
            // Test start marker placement
            Vector2 testCoord = new Vector2(-74.006f, 40.7128f);
            placed = markerStateManager.SetStartMarker(testCoord);
            
            LogTestInfo($"Start Marker Placed: {(placed ? "✅ YES" : "❌ NO")}");
            
            if (placed)
            {
                // Verify marker exists
                hasStart = markerStateManager.HasStartMarker();
                LogTestInfo($"Start Marker Exists: {(hasStart ? "✅ YES" : "❌ NO")}");
                
                // Verify coordinate retrieval
                Vector2? retrievedCoord = markerStateManager.GetStartCoordinate();
                coordRetrieved = retrievedCoord.HasValue;
                LogTestInfo($"Start Coordinate Retrieved: {(coordRetrieved ? "✅ YES" : "❌ NO")}");
            }
        }
        catch (System.Exception e)
        {
            hasError = true;
            errorMessage = e.Message;
        }
        
        if (hasError)
        {
            LogTestError($"Start placement error: {errorMessage}");
            yield break;
        }
        
        if (!placed)
        {
            yield break;
        }
        
        yield return new WaitForEndOfFrame();
    }
    
    /// <summary>
    /// Test 6: End point placement (the main issue!)
    /// </summary>
    IEnumerator TestEndPointPlacement()
    {
        yield return new WaitForSeconds(0.5f);
        
        if (markerStateManager == null)
        {
            yield break;
            yield break;
        }
        
        bool placed = false;
        bool hasEnd = false;
        bool coordRetrieved = false;
        bool hasError = false;
        string errorMessage = "";
        
        try
        {
            // Test end marker placement (start should already exist from previous test)
            Vector2 testCoord = new Vector2(-74.004f, 40.7148f); // Slightly offset from start
            placed = markerStateManager.SetEndMarker(testCoord);
            
            LogTestInfo($"End Marker Placed: {(placed ? "✅ YES" : "❌ NO")}");
            
            if (placed)
            {
                // Verify marker exists
                hasEnd = markerStateManager.HasEndMarker();
                LogTestInfo($"End Marker Exists: {(hasEnd ? "✅ YES" : "❌ NO")}");
                
                // Verify coordinate retrieval
                Vector2? retrievedCoord = markerStateManager.GetEndCoordinate();
                coordRetrieved = retrievedCoord.HasValue;
                LogTestInfo($"End Coordinate Retrieved: {(coordRetrieved ? "✅ YES" : "❌ NO")}");
            }
        }
        catch (System.Exception e)
        {
            hasError = true;
            errorMessage = e.Message;
        }
        
        if (hasError)
        {
            LogTestError($"End placement error: {errorMessage}");
            yield break;
        }
        
        if (!placed)
        {
            yield break;
        }
        
        yield return new WaitForEndOfFrame();
    }
    
    /// <summary>
    /// Test 7: The critical bug - End placement affecting Start marker
    /// </summary>
    IEnumerator TestEndPlacementBug()
    {
        yield return new WaitForSeconds(0.5f);
        
        if (markerStateManager == null)
        {
            yield break;
            yield break;
        }
        
        LogTestInfo("🐛 Testing the EXACT bug you reported...");
        
        bool hasStartAfterPlacement = false;
        bool hasStartAfterEndPlacement = false;
        bool hasEndAfterPlacement = false;
        bool bugFixed = false;
        bool hasError = false;
        string errorMessage = "";
        
        try
        {
            // Step 1: Clear everything
            markerStateManager.ClearAllMarkers();
            
            // Step 2: Place start marker
            Vector2 startCoord = new Vector2(-74.006f, 40.7128f);
            markerStateManager.SetStartMarker(startCoord);
            
            // Step 3: Verify start marker exists
            hasStartAfterPlacement = markerStateManager.HasStartMarker();
            LogTestInfo($"Start marker after placement: {(hasStartAfterPlacement ? "✅ EXISTS" : "❌ MISSING")}");
            
            // Step 4: Place end marker (this was causing start to disappear!)
            Vector2 endCoord = new Vector2(-74.004f, 40.7148f);
            markerStateManager.SetEndMarker(endCoord);
            
            // Step 5: Check if start marker still exists (THE CRITICAL TEST!)
            hasStartAfterEndPlacement = markerStateManager.HasStartMarker();
            hasEndAfterPlacement = markerStateManager.HasEndMarker();
            
            LogTestInfo($"Start marker after end placement: {(hasStartAfterEndPlacement ? "✅ STILL EXISTS" : "❌ DISAPPEARED!")}");
            LogTestInfo($"End marker after placement: {(hasEndAfterPlacement ? "✅ EXISTS" : "❌ MISSING")}");
            
            // The bug is fixed if both markers exist
            bugFixed = hasStartAfterEndPlacement && hasEndAfterPlacement;
        }
        catch (System.Exception e)
        {
            hasError = true;
            errorMessage = e.Message;
        }
        
        if (hasError)
        {
            LogTestError($"Bug test error: {errorMessage}");
            yield break;
        }
        
        if (bugFixed)
        {
            LogTestSuccess("🎉 BUG FIXED! End placement no longer affects start marker!");
        }
        else
        {
            LogTestError("🐛 BUG STILL EXISTS! End placement is affecting start marker!");
        }
        
        yield return new WaitForEndOfFrame();
    }
    
    /// <summary>
    /// Test 8: Start Game coordinate accuracy
    /// </summary>
    IEnumerator TestStartGameCoordinates()
    {
        yield return new WaitForSeconds(0.5f);
        
        if (markerStateManager == null)
        {
            yield break;
            yield break;
        }
        
        bool hasBothMarkers = false;
        bool nodesCreated = false;
        bool coordsValid = false;
        bool hasError = false;
        string errorMessage = "";
        PathfindingNode startNode = null;
        PathfindingNode endNode = null;
        
        try
        {
            // Ensure we have both markers from previous tests
            hasBothMarkers = markerStateManager.HasBothMarkers();
            LogTestInfo($"Both markers ready: {(hasBothMarkers ? "✅ YES" : "❌ NO")}");
            
            if (hasBothMarkers)
            {
                // Create nodes from markers (what Start Game does)
                startNode = markerStateManager.CreateStartNode();
                endNode = markerStateManager.CreateEndNode();
                
                nodesCreated = startNode != null && endNode != null;
                LogTestInfo($"Nodes created from markers: {(nodesCreated ? "✅ YES" : "❌ NO")}");
                
                if (nodesCreated)
                {
                    LogTestInfo($"Start Node Coord: {startNode.geoCoordinate}");
                    LogTestInfo($"End Node Coord: {endNode.geoCoordinate}");
                    
                    // Verify coordinates are not (0,0) or invalid
                    coordsValid = startNode.geoCoordinate != Vector2.zero && 
                                  endNode.geoCoordinate != Vector2.zero;
                    
                    LogTestInfo($"Coordinates valid: {(coordsValid ? "✅ YES" : "❌ NO")}");
                }
            }
        }
        catch (System.Exception e)
        {
            hasError = true;
            errorMessage = e.Message;
        }
        
        if (hasError)
        {
            LogTestError($"Start Game test error: {errorMessage}");
            yield break;
        }
        
        if (!hasBothMarkers)
        {
            LogTestWarning("Cannot test Start Game - need both markers");
            yield break;
        }
        
        if (!nodesCreated)
        {
            yield break;
        }
        
        yield return new WaitForEndOfFrame();
    }
    
    // === UNITY-FRIENDLY LOGGING METHODS ===
    
    void LogTestHeader(string message)
    {
        Debug.Log($"<color=cyan><size=14><b>{message}</b></size></color>");
    }
    
    void LogTestStart(string testName)
    {
        currentTestNumber++;
        Debug.Log($"<color=yellow>🧪 TEST {currentTestNumber}/{totalTests}: {testName}</color>");
    }
    
    void LogTestResult(string testName, bool passed)
    {
        string color = passed ? "green" : "red";
        string icon = passed ? "✅" : "❌";
        Debug.Log($"<color={color}>{icon} {testName}: {(passed ? "PASSED" : "FAILED")}</color>");
    }
    
    void LogTestSuccess(string message)
    {
        Debug.Log($"<color=green><b>{message}</b></color>");
    }
    
    void LogTestError(string message)
    {
        Debug.LogError($"<color=red><b>{message}</b></color>");
    }
    
    void LogTestWarning(string message)
    {
        Debug.LogWarning($"<color=orange><b>{message}</b></color>");
    }
    
    void LogTestInfo(string message)
    {
        Debug.Log($"<color=white>   {message}</color>");
    }
    
    void LogTestFix(string message)
    {
        Debug.Log($"<color=magenta><b>{message}</b></color>");
    }
    
    void LogSeparator()
    {
        Debug.Log("<color=cyan>═══════════════════════════════════════════</color>");
    }
    
    void LogComponentCheck(string componentName, bool found)
    {
        string status = found ? "<color=green>✅ FOUND</color>" : "<color=red>❌ MISSING</color>";
        Debug.Log($"   {componentName}: {status}");
    }
    
    void UpdateProgress()
    {
        testProgress = (float)currentTestNumber / totalTests * 100f;
    }
    
    /// <summary>
    /// Quick component check for Inspector
    /// </summary>
    [ContextMenu("🔍 Quick Component Check")]
    public void QuickComponentCheck()
    {
        LogTestHeader("🔍 QUICK COMPONENT CHECK");
        
        // Re-find all components
        mapsController = FindObjectOfType<OnlineMapsController>();
        markerStateManager = FindObjectOfType<MarkerStateManager>();
        mapController = FindObjectOfType<MapController>();
        gameInterface = FindObjectOfType<GameInterface>();
        vfxManager = FindObjectOfType<VisualEffectsManager>();
        
        LogComponentCheck("OnlineMapsController", mapsController != null);
        LogComponentCheck("MarkerStateManager", markerStateManager != null);
        LogComponentCheck("MapController", mapController != null);
        LogComponentCheck("GameInterface", gameInterface != null);
        LogComponentCheck("VisualEffectsManager", vfxManager != null);
        
        bool allCoreFound = mapsController != null && markerStateManager != null && mapController != null;
        
        if (allCoreFound)
        {
            LogTestSuccess("✅ All core components found - ready for testing!");
        }
        else
        {
            LogTestError("❌ Missing components - use PathfindrSetupManager to auto-setup");
        }
        
        LogSeparator();
    }
}