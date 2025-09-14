using UnityEngine;
using System.Collections;

/// <summary>
/// Test script to verify the new Online Maps First architecture
/// Tests marker placement, state synchronization, and event flow
/// </summary>
public class MarkerPlacementTest : MonoBehaviour
{
    [Header("Test Configuration")]
    public bool runTestsOnStart = false;
    public float testDelay = 2f;
    
    [Header("Test Results")]
    public bool allTestsPassed = false;
    public string lastTestResult = "";
    
    // Component references
    private OnlineMapsController mapsController;
    private MarkerStateManager markerStateManager;
    private GameInterface gameInterface;
    
    // Test state
    private int currentTestStep = 0;
    private bool testInProgress = false;
    
    void Start()
    {
        if (runTestsOnStart)
        {
            StartCoroutine(RunAllTests());
        }
    }
    
    /// <summary>
    /// Run comprehensive test of marker placement system
    /// </summary>
    [ContextMenu("Run All Architecture Tests")]
    public void RunAllArchitectureTests()
    {
        if (!testInProgress)
        {
            StartCoroutine(RunAllTests());
        }
        else
        {
            Debug.LogWarning("[MarkerPlacementTest] Tests already in progress");
        }
    }
    
    /// <summary>
    /// Test suite for new architecture
    /// </summary>
    IEnumerator RunAllTests()
    {
        testInProgress = true;
        allTestsPassed = false;
        currentTestStep = 0;
        
        Debug.Log("=== STARTING PATHFINDR ARCHITECTURE TESTS ===");
        
        // Initialize component references
        if (!InitializeComponents())
        {
            lastTestResult = "FAILED: Component initialization";
            testInProgress = false;
            yield break;
        }
        
        yield return new WaitForSeconds(1f);
        
        // Test 1: Component Integration
        Debug.Log("TEST 1: Component Integration");
        if (!TestComponentIntegration())
        {
            lastTestResult = "FAILED: Component integration test";
            testInProgress = false;
            yield break;
        }
        currentTestStep++;
        yield return new WaitForSeconds(testDelay);
        
        // Test 2: Start Marker Placement
        Debug.Log("TEST 2: Start Marker Placement");
        if (!TestStartMarkerPlacement())
        {
            lastTestResult = "FAILED: Start marker placement test";
            testInProgress = false;
            yield break;
        }
        currentTestStep++;
        yield return new WaitForSeconds(testDelay);
        
        // Test 3: End Marker Placement  
        Debug.Log("TEST 3: End Marker Placement");
        if (!TestEndMarkerPlacement())
        {
            lastTestResult = "FAILED: End marker placement test";
            testInProgress = false;
            yield break;
        }
        currentTestStep++;
        yield return new WaitForSeconds(testDelay);
        
        // Test 4: State Synchronization
        Debug.Log("TEST 4: State Synchronization");
        if (!TestStateSynchronization())
        {
            lastTestResult = "FAILED: State synchronization test";
            testInProgress = false;
            yield break;
        }
        currentTestStep++;
        yield return new WaitForSeconds(testDelay);
        
        // Test 5: Marker Replacement
        Debug.Log("TEST 5: Marker Replacement");
        if (!TestMarkerReplacement())
        {
            lastTestResult = "FAILED: Marker replacement test";
            testInProgress = false;
            yield break;
        }
        currentTestStep++;
        yield return new WaitForSeconds(testDelay);
        
        // Test 6: Clear and Reset
        Debug.Log("TEST 6: Clear and Reset");
        if (!TestClearAndReset())
        {
            lastTestResult = "FAILED: Clear and reset test";
            testInProgress = false;
            yield break;
        }
        currentTestStep++;
        
        // All tests passed!
        allTestsPassed = true;
        lastTestResult = "SUCCESS: All architecture tests passed!";
        testInProgress = false;
        
        Debug.Log("=== ALL PATHFINDR ARCHITECTURE TESTS PASSED! ===");
        Debug.Log("🎉 Start/End point placement issues should now be resolved!");
    }
    
    /// <summary>
    /// Initialize component references
    /// </summary>
    bool InitializeComponents()
    {
        mapsController = FindObjectOfType<OnlineMapsController>();
        markerStateManager = FindObjectOfType<MarkerStateManager>();
        gameInterface = FindObjectOfType<GameInterface>();
        
        if (mapsController == null)
        {
            Debug.LogError("[Test] OnlineMapsController not found in scene!");
            return false;
        }
        
        if (markerStateManager == null)
        {
            Debug.LogError("[Test] MarkerStateManager not found in scene!");
            return false;
        }
        
        if (gameInterface == null)
        {
            Debug.LogError("[Test] GameInterface not found in scene!");
            return false;
        }
        
        Debug.Log("✅ All required components found");
        return true;
    }
    
    /// <summary>
    /// Test component integration
    /// </summary>
    bool TestComponentIntegration()
    {
        // Test OnlineMapsController
        if (!mapsController.IsReady())
        {
            Debug.LogError("[Test] OnlineMapsController is not ready");
            return false;
        }
        
        // Test coordinate conversion
        Vector2 testCoord = new Vector2(-74.006f, 40.7128f); // NYC
        Vector3 worldPos = mapsController.GeoCoordinateToWorldPosition(testCoord);
        
        if (worldPos == Vector3.zero)
        {
            Debug.LogError("[Test] Coordinate conversion failed");
            return false;
        }
        
        Debug.Log($"✅ Coordinate conversion working: {testCoord} -> {worldPos}");
        return true;
    }
    
    /// <summary>
    /// Test start marker placement
    /// </summary>
    bool TestStartMarkerPlacement()
    {
        Vector2 mapCenter = mapsController.GetMapCenter();
        
        // Place start marker
        bool placed = markerStateManager.SetStartMarker(mapCenter);
        
        if (!placed)
        {
            Debug.LogError("[Test] Failed to place start marker");
            return false;
        }
        
        // Verify marker exists
        if (!markerStateManager.HasStartMarker())
        {
            Debug.LogError("[Test] Start marker not detected after placement");
            return false;
        }
        
        // Verify coordinate retrieval
        Vector2? startCoord = markerStateManager.GetStartCoordinate();
        if (!startCoord.HasValue)
        {
            Debug.LogError("[Test] Could not retrieve start coordinate");
            return false;
        }
        
        Debug.Log($"✅ Start marker placed and verified at: {startCoord.Value}");
        return true;
    }
    
    /// <summary>
    /// Test end marker placement
    /// </summary>
    bool TestEndMarkerPlacement()
    {
        Vector2 mapCenter = mapsController.GetMapCenter();
        Vector2 endPosition = new Vector2(mapCenter.x + 0.01f, mapCenter.y + 0.01f);
        
        // Place end marker
        bool placed = markerStateManager.SetEndMarker(endPosition);
        
        if (!placed)
        {
            Debug.LogError("[Test] Failed to place end marker");
            return false;
        }
        
        // Verify marker exists
        if (!markerStateManager.HasEndMarker())
        {
            Debug.LogError("[Test] End marker not detected after placement");
            return false;
        }
        
        // Verify coordinate retrieval
        Vector2? endCoord = markerStateManager.GetEndCoordinate();
        if (!endCoord.HasValue)
        {
            Debug.LogError("[Test] Could not retrieve end coordinate");
            return false;
        }
        
        Debug.Log($"✅ End marker placed and verified at: {endCoord.Value}");
        return true;
    }
    
    /// <summary>
    /// Test state synchronization
    /// </summary>
    bool TestStateSynchronization()
    {
        // Verify both markers exist
        if (!markerStateManager.HasBothMarkers())
        {
            Debug.LogError("[Test] Both markers should exist at this point");
            return false;
        }
        
        // Verify start marker still exists after end placement
        if (!markerStateManager.HasStartMarker())
        {
            Debug.LogError("[Test] Start marker disappeared after end marker placement!");
            return false;
        }
        
        // Create nodes from markers
        var startNode = markerStateManager.CreateStartNode();
        var endNode = markerStateManager.CreateEndNode();
        
        if (startNode == null || endNode == null)
        {
            Debug.LogError("[Test] Failed to create nodes from markers");
            return false;
        }
        
        Debug.Log($"✅ State synchronization verified - nodes created from markers");
        Debug.Log($"   Start Node: {startNode.geoCoordinate}, ID: {startNode.id}");
        Debug.Log($"   End Node: {endNode.geoCoordinate}, ID: {endNode.id}");
        
        return true;
    }
    
    /// <summary>
    /// Test marker replacement (the old issue)
    /// </summary>
    bool TestMarkerReplacement()
    {
        Vector2 mapCenter = mapsController.GetMapCenter();
        Vector2 newStartPosition = new Vector2(mapCenter.x - 0.005f, mapCenter.y - 0.005f);
        
        // Replace start marker
        bool replaced = markerStateManager.SetStartMarker(newStartPosition);
        
        if (!replaced)
        {
            Debug.LogError("[Test] Failed to replace start marker");
            return false;
        }
        
        // Verify end marker still exists (this was the original problem!)
        if (!markerStateManager.HasEndMarker())
        {
            Debug.LogError("[Test] End marker disappeared during start marker replacement!");
            return false;
        }
        
        // Verify new start coordinate
        Vector2? newStartCoord = markerStateManager.GetStartCoordinate();
        if (!newStartCoord.HasValue)
        {
            Debug.LogError("[Test] Could not retrieve replaced start coordinate");
            return false;
        }
        
        Debug.Log($"✅ Marker replacement successful - end marker preserved!");
        Debug.Log($"   New start position: {newStartCoord.Value}");
        
        return true;
    }
    
    /// <summary>
    /// Test clear and reset functionality
    /// </summary>
    bool TestClearAndReset()
    {
        // Clear all markers
        markerStateManager.ClearAllMarkers();
        
        // Verify markers are cleared
        if (markerStateManager.HasStartMarker() || markerStateManager.HasEndMarker())
        {
            Debug.LogError("[Test] Markers not properly cleared");
            return false;
        }
        
        // Verify HasBothMarkers returns false
        if (markerStateManager.HasBothMarkers())
        {
            Debug.LogError("[Test] HasBothMarkers should return false after clear");
            return false;
        }
        
        Debug.Log("✅ Clear and reset functionality verified");
        return true;
    }
    
    /// <summary>
    /// Quick test for specific coordinate behavior
    /// </summary>
    [ContextMenu("Test Specific Coordinates")]
    public void TestSpecificCoordinates()
    {
        if (markerStateManager == null || mapsController == null)
        {
            InitializeComponents();
        }
        
        Debug.Log("=== TESTING SPECIFIC COORDINATES ===");
        
        // Test NYC coordinates
        Vector2 nycCoord = new Vector2(-74.006f, 40.7128f);
        bool placed = markerStateManager.SetStartMarker(nycCoord);
        
        if (placed)
        {
            Vector2? retrieved = markerStateManager.GetStartCoordinate();
            Debug.Log($"NYC Test - Placed: {nycCoord}, Retrieved: {retrieved}");
            Debug.Log($"Match: {(retrieved.HasValue && Vector2.Distance(nycCoord, retrieved.Value) < 0.001f)}");
        }
        
        markerStateManager.ClearAllMarkers();
    }
    
    /// <summary>
    /// Get test progress as percentage
    /// </summary>
    public float GetTestProgress()
    {
        if (!testInProgress) return allTestsPassed ? 100f : 0f;
        
        return (currentTestStep / 6f) * 100f;
    }
}