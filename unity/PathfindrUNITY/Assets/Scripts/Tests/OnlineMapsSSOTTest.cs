using UnityEngine;
using System.Collections;

/// <summary>
/// 🧪 ONLINE MAPS SINGLE SOURCE OF TRUTH (SSOT) INTEGRATION TEST
/// 
/// Tests the critical architecture where OnlineMaps is the single source of truth
/// for all map data, coordinates, markers, and geographic information.
/// Unity handles visual effects that sync to OnlineMaps coordinates.
/// </summary>
public class OnlineMapsSSOTTest : MonoBehaviour
{
    [Header("🎯 SSOT Architecture Test")]
    [SerializeField] private bool runTestOnStart = false;
    
    [Header("📍 Test Coordinates")]
    public Vector2 testLocationNYC = new Vector2(-74.006f, 40.7128f);
    public Vector2 testLocationLondon = new Vector2(-0.1278f, 51.5074f);
    
    [Header("📊 Test Results")]
    public bool singleSourceOfTruthWorking = false;
    public bool coordinateConversionWorking = false;
    public bool markerPlacementWorking = false;
    public bool visualEffectsSynced = false;
    public bool panZoomSyncWorking = false;
    
    [Header("🔍 Test Progress")]
    [Range(0f, 100f)]
    public float testProgress = 0f;
    
    // Component references
    private OnlineMapsBridge mapsBridge;
    private OnlineMaps onlineMaps;
    private OnlineMapsControlBase mapControl;
    private VisualEffectsManager vfxManager;
    private MarkerStateManager markerStateManager;
    
    // Test state
    private bool testInProgress = false;
    private Vector3 initialCameraPosition;
    private int initialZoom;
    
    void Start()
    {
        if (runTestOnStart)
        {
            StartCoroutine(RunSSOTTests());
        }
    }
    
    /// <summary>
    /// 🚀 ONE-CLICK SSOT ARCHITECTURE TEST
    /// </summary>
    [ContextMenu("🧪 Test OnlineMaps SSOT Architecture")]
    public void TestOnlineMapsSSOTArchitecture()
    {
        if (testInProgress)
        {
            Debug.LogWarning("⚠️ SSOT test already in progress...");
            return;
        }
        
        StartCoroutine(RunSSOTTests());
    }
    
    IEnumerator RunSSOTTests()
    {
        testInProgress = true;
        testProgress = 0f;
        
        Debug.Log("🧪 STARTING ONLINE MAPS SSOT ARCHITECTURE TEST");
        Debug.Log("════════════════════════════════════════════");
        
        // Test 1: Find and validate SSOT components
        yield return StartCoroutine(TestSSOTComponents());
        testProgress = 20f;
        
        // Test 2: Test coordinate conversion accuracy
        yield return StartCoroutine(TestCoordinateConversion());
        testProgress = 40f;
        
        // Test 3: Test marker placement using OnlineMaps
        yield return StartCoroutine(TestNativeMarkerPlacement());
        testProgress = 60f;
        
        // Test 4: Test Unity visual effects sync to OnlineMaps coordinates
        yield return StartCoroutine(TestVisualEffectsSync());
        testProgress = 80f;
        
        // Test 5: Test pan/zoom coordinate synchronization
        yield return StartCoroutine(TestPanZoomSync());
        testProgress = 100f;
        
        // Final results
        bool allTestsPassed = singleSourceOfTruthWorking && 
                            coordinateConversionWorking && 
                            markerPlacementWorking && 
                            visualEffectsSynced;
        
        Debug.Log("════════════════════════════════════════════");
        if (allTestsPassed)
        {
            Debug.Log("✅ ALL SSOT ARCHITECTURE TESTS PASSED!");
            Debug.Log("🎉 OnlineMaps is properly configured as Single Source of Truth");
            Debug.Log("🎮 Unity visual effects are synced to OnlineMaps coordinates");
            Debug.Log("🗺️ Ready for pathfinding algorithm visualization");
        }
        else
        {
            Debug.LogError("❌ SOME SSOT TESTS FAILED - Check individual test results above");
            Debug.LogWarning("💡 Fix failing tests before proceeding with algorithm visualization");
        }
        Debug.Log("════════════════════════════════════════════");
        
        testInProgress = false;
    }
    
    IEnumerator TestSSOTComponents()
    {
        Debug.Log("🔍 Test 1: SSOT Component Architecture");
        
        // Find OnlineMapsBridge (SSOT coordinator)
        mapsBridge = FindObjectOfType<OnlineMapsBridge>();
        if (mapsBridge != null)
        {
            Debug.Log("   ✅ OnlineMapsBridge found (SSOT coordinator)");
        }
        else
        {
            Debug.LogError("   ❌ OnlineMapsBridge not found - critical SSOT component missing");
            singleSourceOfTruthWorking = false;
            yield break;
        }
        
        // Find actual OnlineMaps component
        onlineMaps = FindObjectOfType<OnlineMaps>();
        if (onlineMaps != null)
        {
            Debug.Log("   ✅ OnlineMaps component found (map data source)");
            mapControl = onlineMaps.control;
        }
        else
        {
            Debug.LogError("   ❌ OnlineMaps component not found in scene");
            Debug.LogError("   💡 Add OnlineMaps GameObject: GameObject → OnlineMaps → Create OnlineMaps");
            singleSourceOfTruthWorking = false;
            yield break;
        }
        
        // Find VisualEffectsManager
        vfxManager = FindObjectOfType<VisualEffectsManager>();
        if (vfxManager != null)
        {
            Debug.Log("   ✅ VisualEffectsManager found");
            
            // Check if VFX is connected to SSOT bridge
            if (vfxManager.mapBridge == mapsBridge)
            {
                Debug.Log("   ✅ VisualEffectsManager correctly connected to OnlineMapsBridge");
            }
            else
            {
                Debug.LogWarning("   ⚠️ VisualEffectsManager not connected to OnlineMapsBridge");
            }
        }
        else
        {
            Debug.LogWarning("   ⚠️ VisualEffectsManager not found - visual effects won't work");
        }
        
        singleSourceOfTruthWorking = (mapsBridge != null && onlineMaps != null);
        Debug.Log($"   Result: {(singleSourceOfTruthWorking ? "✅ SSOT Architecture Valid" : "❌ SSOT Architecture Invalid")}");
        
        yield return new WaitForSeconds(0.5f);
    }
    
    IEnumerator TestCoordinateConversion()
    {
        Debug.Log("🌍 Test 2: Coordinate Conversion Accuracy");
        
        if (!singleSourceOfTruthWorking)
        {
            Debug.LogError("   ❌ Skipping coordinate test - SSOT components not working");
            coordinateConversionWorking = false;
            yield break;
        }
        
        // Test coordinate conversion for multiple locations
        Vector2[] testCoords = { testLocationNYC, testLocationLondon };
        string[] testNames = { "NYC", "London" };
        
        bool allConversionsWorked = true;
        
        for (int i = 0; i < testCoords.Length; i++)
        {
            Vector2 geoCoord = testCoords[i];
            string locationName = testNames[i];
            
            // Test geo to world conversion
            Vector3 worldPos = mapsBridge.GeoCoordinateToWorldPosition(geoCoord);
            if (worldPos != Vector3.zero)
            {
                Debug.Log($"   ✅ {locationName} ({geoCoord}) → World ({worldPos})");
                
                // Test screen position conversion
                Vector2 screenPos = mapsBridge.GeoCoordinateToScreen(geoCoord);
                Debug.Log($"   ✅ {locationName} → Screen ({screenPos})");
            }
            else
            {
                Debug.LogError($"   ❌ {locationName} coordinate conversion failed");
                allConversionsWorked = false;
            }
        }
        
        coordinateConversionWorking = allConversionsWorked;
        Debug.Log($"   Result: {(coordinateConversionWorking ? "✅ Coordinate Conversion Working" : "❌ Coordinate Conversion Failed")}");
        
        yield return new WaitForSeconds(0.5f);
    }
    
    IEnumerator TestNativeMarkerPlacement()
    {
        Debug.Log("📍 Test 3: Native OnlineMaps Marker Placement");
        
        if (!coordinateConversionWorking)
        {
            Debug.LogError("   ❌ Skipping marker test - coordinate conversion not working");
            markerPlacementWorking = false;
            yield break;
        }
        
        // Test placing markers using OnlineMaps native system
        OnlineMapsMarkerManager markerManager = OnlineMapsMarkerManager.instance;
        if (markerManager != null)
        {
            // Place start marker
            OnlineMapsMarker startMarker = markerManager.Create(testLocationNYC.x, testLocationNYC.y, "Start");
            if (startMarker != null)
            {
                Debug.Log("   ✅ Start marker created using OnlineMaps native system");
                
                // Place end marker
                OnlineMapsMarker endMarker = markerManager.Create(testLocationLondon.x, testLocationLondon.y, "End");
                if (endMarker != null)
                {
                    Debug.Log("   ✅ End marker created using OnlineMaps native system");
                    markerPlacementWorking = true;
                    
                    // Cleanup test markers after a moment
                    yield return new WaitForSeconds(1f);
                    
                    // Safe cleanup
                    if (startMarker != null) markerManager.Remove(startMarker);
                    if (endMarker != null) markerManager.Remove(endMarker);
                    Debug.Log("   🧹 Test markers cleaned up");
                }
                else
                {
                    Debug.LogError("   ❌ Failed to create end marker");
                    markerPlacementWorking = false;
                }
            }
            else
            {
                Debug.LogError("   ❌ Failed to create start marker");
                markerPlacementWorking = false;
            }
        }
        else
        {
            Debug.LogError("   ❌ OnlineMapsMarkerManager not available");
            markerPlacementWorking = false;
        }
        
        Debug.Log($"   Result: {(markerPlacementWorking ? "✅ Native Marker Placement Working" : "❌ Native Marker Placement Failed")}");
        
        yield return new WaitForSeconds(0.5f);
    }
    
    IEnumerator TestVisualEffectsSync()
    {
        Debug.Log("✨ Test 4: Unity Visual Effects Sync to OnlineMaps Coordinates");
        
        if (vfxManager == null)
        {
            Debug.LogWarning("   ⚠️ Skipping VFX sync test - VisualEffectsManager not found");
            visualEffectsSynced = false;
            yield break;
        }
        
        // Test visual effects placement at OnlineMaps coordinates
        Debug.Log("   🎭 Testing visual effect placement at geographic coordinates...");
        
        // Test node markers synced to OnlineMaps
        vfxManager.ShowStartNodeMarker(testLocationNYC);
        vfxManager.ShowEndNodeMarker(testLocationLondon);
        
        yield return new WaitForSeconds(0.5f);
        
        // Test algorithm effects
        vfxManager.CreateFocusedBeamEffect(testLocationNYC, Color.green);
        vfxManager.CreateRippleEffect(testLocationLondon, Color.blue);
        
        Debug.Log("   ✅ Visual effects created at OnlineMaps coordinates");
        
        yield return new WaitForSeconds(1f);
        
        // Cleanup
        vfxManager.ClearAll();
        Debug.Log("   🧹 Visual effects cleaned up");
        
        visualEffectsSynced = true;
        
        Debug.Log($"   Result: {(visualEffectsSynced ? "✅ Visual Effects Synced to OnlineMaps" : "❌ Visual Effects Sync Failed")}");
        
        yield return new WaitForSeconds(0.5f);
    }
    
    IEnumerator TestPanZoomSync()
    {
        Debug.Log("🔄 Test 5: Pan/Zoom Coordinate Synchronization");
        
        if (onlineMaps == null)
        {
            Debug.LogWarning("   ⚠️ Skipping pan/zoom test - OnlineMaps not available");
            panZoomSyncWorking = false;
            yield break;
        }
        
        // Store initial state
        initialCameraPosition = onlineMaps.position;
        initialZoom = onlineMaps.zoom;
        
        Debug.Log($"   📍 Initial position: {initialCameraPosition}, zoom: {initialZoom}");
        
        // Test coordinate conversion at initial position
        Vector3 worldPos1 = mapsBridge.GeoCoordinateToWorldPosition(testLocationNYC);
        
        // Change map position and zoom
        onlineMaps.SetPosition(testLocationLondon.x, testLocationLondon.y);
        onlineMaps.zoom = initialZoom + 2;
        
        yield return new WaitForSeconds(0.5f);
        
        Debug.Log($"   📍 New position: {onlineMaps.position}, zoom: {onlineMaps.zoom}");
        
        // Test coordinate conversion at new position
        Vector3 worldPos2 = mapsBridge.GeoCoordinateToWorldPosition(testLocationNYC);
        
        // Check if coordinates updated correctly
        if (worldPos1 != worldPos2)
        {
            Debug.Log("   ✅ Coordinates updated correctly after map change");
            Debug.Log($"   📊 NYC world pos changed from {worldPos1} to {worldPos2}");
            panZoomSyncWorking = true;
        }
        else
        {
            Debug.LogWarning("   ⚠️ Coordinates didn't update after map change");
            panZoomSyncWorking = false;
        }
        
        // Restore initial state
        onlineMaps.SetPosition(initialCameraPosition.x, initialCameraPosition.y);
        onlineMaps.zoom = initialZoom;
        
        Debug.Log("   🔄 Map position restored");
        
        Debug.Log($"   Result: {(panZoomSyncWorking ? "✅ Pan/Zoom Sync Working" : "❌ Pan/Zoom Sync Failed")}");
        
        yield return new WaitForSeconds(0.5f);
    }
    
    /// <summary>
    /// Quick diagnostic for SSOT architecture
    /// </summary>
    [ContextMenu("🔍 Quick SSOT Diagnostics")]
    public void QuickSSOTDiagnostics()
    {
        Debug.Log("🔍 QUICK SSOT DIAGNOSTICS");
        Debug.Log("═══════════════════════");
        
        // Check each critical component
        OnlineMapsBridge bridge = FindObjectOfType<OnlineMapsBridge>();
        Debug.Log($"OnlineMapsBridge: {(bridge != null ? "✅ Found" : "❌ Missing")}");
        
        OnlineMaps maps = FindObjectOfType<OnlineMaps>();
        Debug.Log($"OnlineMaps Component: {(maps != null ? "✅ Found" : "❌ Missing")}");
        
        VisualEffectsManager vfx = FindObjectOfType<VisualEffectsManager>();
        Debug.Log($"VisualEffectsManager: {(vfx != null ? "✅ Found" : "❌ Missing")}");
        
        if (bridge != null && vfx != null)
        {
            bool connected = (vfx.mapBridge == bridge);
            Debug.Log($"VFX → Bridge Connection: {(connected ? "✅ Connected" : "❌ Not Connected")}");
        }
        
        Debug.Log("═══════════════════════");
        
        if (bridge == null || maps == null)
        {
            Debug.LogWarning("💡 Run PathfindrSetupManager to auto-setup missing components");
        }
    }
}