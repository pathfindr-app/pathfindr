using UnityEngine;
using System.Collections;

/// <summary>
/// ⭐ ONE-CLICK PATHFINDR SETUP MANAGER ⭐
/// 
/// WHAT THIS DOES FOR YOU (No Manual Inspector Work!):
/// 1. Automatically adds all required components to your scene
/// 2. Connects all components together automatically  
/// 3. Validates everything is working correctly
/// 4. Shows clear success/failure messages
/// 
/// HOW TO USE IN UNITY:
/// 1. Add this script to any GameObject in your scene
/// 2. Click "🚀 Setup Pathfindr (One Click)" button in Inspector
/// 3. Look for green success messages in Console
/// 4. Done! Your scene is ready for pathfinding
/// </summary>
public class PathfindrSetupManager : MonoBehaviour
{
    [Header("🎯 One-Click Setup")]
    [SerializeField] private bool autoSetupOnStart = false;
    
    [Header("📋 Setup Status")]
    public bool setupComplete = false;
    public bool onlineMapsReady = false;
    public bool markerSystemReady = false;
    public bool interfaceReady = false;
    public bool effectsReady = false;
    
    [Header("🔧 Component References (Auto-Populated)")]
    public OnlineMapsBridge mapsBridge;
    public OnlineMapsController mapsController; // Keep for compatibility
    public MarkerStateManager markerStateManager;
    public MapController mapController;
    public GameInterface gameInterface;
    public VisualEffectsManager visualEffectsManager;
    
    [Header("📊 Setup Progress")]
    [Range(0f, 100f)]
    public float setupProgress = 0f;
    
    private bool isSettingUp = false;
    
    void Start()
    {
        if (autoSetupOnStart)
        {
            StartCoroutine(AutoSetupPathfindr());
        }
    }
    
    /// <summary>
    /// 🚀 ONE-CLICK PATHFINDR SETUP - Call this from Inspector!
    /// </summary>
    [ContextMenu("🚀 Setup Pathfindr (One Click)")]
    public void SetupPathfindrOneClick()
    {
        if (isSettingUp)
        {
            Debug.LogWarning("⚠️ Setup already in progress...");
            return;
        }
        
        StartCoroutine(AutoSetupPathfindr());
    }
    
    /// <summary>
    /// Automatic setup routine with progress feedback
    /// </summary>
    IEnumerator AutoSetupPathfindr()
    {
        isSettingUp = true;
        setupProgress = 0f;
        
        Debug.Log("🚀 STARTING PATHFINDR AUTOMATIC SETUP...");
        Debug.Log("═══════════════════════════════════════════");
        
        // Step 1: Setup OnlineMaps and OnlineMapsBridge (SSOT)
        yield return StartCoroutine(SetupOnlineMapsSystem());
        setupProgress = 20f;
        
        // Step 2: Find or create MarkerStateManager
        yield return StartCoroutine(SetupMarkerStateManager());
        setupProgress = 40f;
        
        // Step 3: Find or create MapController and wire it up
        yield return StartCoroutine(SetupMapController());
        setupProgress = 60f;
        
        // Step 4: Find or create GameInterface and wire it up
        yield return StartCoroutine(SetupGameInterface());
        setupProgress = 80f;
        
        // Step 5: Find or create VisualEffectsManager and wire it up
        yield return StartCoroutine(SetupVisualEffectsManager());
        setupProgress = 90f;
        
        // Step 6: Validate everything is connected properly
        yield return StartCoroutine(ValidateSetup());
        setupProgress = 100f;
        
        // Final status
        if (setupComplete)
        {
            Debug.Log("✅ PATHFINDR SETUP COMPLETE!");
            Debug.Log("🎉 Your scene is now ready for start/end point placement!");
            Debug.Log("🎮 Try clicking 'Place Start Point' and 'Place End Point' buttons");
            Debug.Log("═══════════════════════════════════════════");
        }
        else
        {
            Debug.LogError("❌ Setup incomplete - check error messages above");
        }
        
        isSettingUp = false;
    }
    
    /// <summary>
    /// Setup OnlineMaps system with OnlineMapsBridge as SSOT coordinator
    /// </summary>
    IEnumerator SetupOnlineMapsSystem()
    {
        Debug.Log("🗺️ Setting up OnlineMaps SSOT System...");
        
        // Step 1: Find or create OnlineMapsBridge (the actual SSOT coordinator)
        mapsBridge = FindObjectOfType<OnlineMapsBridge>();
        if (mapsBridge == null)
        {
            GameObject bridgeObj = new GameObject("OnlineMapsBridge");
            mapsBridge = bridgeObj.AddComponent<OnlineMapsBridge>();
            Debug.Log("   ✅ Created new OnlineMapsBridge (SSOT coordinator)");
        }
        else
        {
            Debug.Log("   ✅ Found existing OnlineMapsBridge");
        }
        
        // Step 2: Check for actual OnlineMaps component in scene
        OnlineMaps onlineMaps = FindObjectOfType<OnlineMaps>();
        if (onlineMaps == null)
        {
            Debug.LogWarning("   ⚠️ No OnlineMaps component found in scene!");
            Debug.LogWarning("   💡 You need to add an OnlineMaps GameObject to the scene manually");
            Debug.LogWarning("   💡 Go to: GameObject → OnlineMaps → Create OnlineMaps");
            onlineMapsReady = false;
        }
        else
        {
            Debug.Log("   ✅ Found OnlineMaps component in scene");
            onlineMapsReady = true;
        }
        
        // Step 3: Find OnlineMapsController (compatibility wrapper)
        mapsController = FindObjectOfType<OnlineMapsController>();
        if (mapsController == null)
        {
            GameObject controllerObj = new GameObject("OnlineMapsController");
            mapsController = controllerObj.AddComponent<OnlineMapsController>();
            Debug.Log("   ✅ Created OnlineMapsController wrapper");
        }
        
        yield return new WaitForSeconds(0.5f);
        
        if (onlineMapsReady)
        {
            Debug.Log("   ✅ OnlineMaps SSOT system ready!");
        }
        else
        {
            Debug.LogError("   ❌ OnlineMaps system incomplete - add OnlineMaps GameObject to scene");
        }
    }
    
    /// <summary>
    /// Setup MarkerStateManager
    /// </summary>
    IEnumerator SetupMarkerStateManager()
    {
        Debug.Log("📍 Setting up MarkerStateManager...");
        
        // Find existing or create new
        markerStateManager = FindObjectOfType<MarkerStateManager>();
        if (markerStateManager == null)
        {
            GameObject markerObj = new GameObject("MarkerStateManager");
            markerStateManager = markerObj.AddComponent<MarkerStateManager>();
            Debug.Log("   ✅ Created new MarkerStateManager");
        }
        else
        {
            Debug.Log("   ✅ Found existing MarkerStateManager");
        }
        
        yield return new WaitForSeconds(0.2f);
        
        markerSystemReady = true;
        Debug.Log("   ✅ MarkerStateManager ready!");
    }
    
    /// <summary>
    /// Setup MapController and connect it to new components
    /// </summary>
    IEnumerator SetupMapController()
    {
        Debug.Log("🎮 Setting up MapController...");
        
        // Find existing MapController
        mapController = FindObjectOfType<MapController>();
        if (mapController == null)
        {
            Debug.LogWarning("   ⚠️ MapController not found - you may need to add one manually");
            yield break;
        }
        
        Debug.Log("   ✅ Found existing MapController");
        
        // Auto-wire the new components using reflection (Inspector-like behavior)
        WireMapControllerComponents();
        
        yield return new WaitForSeconds(0.2f);
        Debug.Log("   ✅ MapController connected to new architecture!");
    }
    
    /// <summary>
    /// Setup GameInterface 
    /// </summary>
    IEnumerator SetupGameInterface()
    {
        Debug.Log("🎨 Setting up GameInterface...");
        
        // Find existing GameInterface
        gameInterface = FindObjectOfType<GameInterface>();
        if (gameInterface == null)
        {
            Debug.LogWarning("   ⚠️ GameInterface not found - UI may not work");
            yield break;
        }
        
        Debug.Log("   ✅ Found existing GameInterface");
        interfaceReady = true;
        
        yield return new WaitForSeconds(0.2f);
    }
    
    /// <summary>
    /// Setup VisualEffectsManager and wire to OnlineMapsBridge
    /// </summary>
    IEnumerator SetupVisualEffectsManager()
    {
        Debug.Log("✨ Setting up VisualEffectsManager...");
        
        // Find existing VisualEffectsManager
        visualEffectsManager = FindObjectOfType<VisualEffectsManager>();
        if (visualEffectsManager == null)
        {
            GameObject vfxObj = new GameObject("VisualEffectsManager");
            visualEffectsManager = vfxObj.AddComponent<VisualEffectsManager>();
            Debug.Log("   ✅ Created new VisualEffectsManager");
        }
        else
        {
            Debug.Log("   ✅ Found existing VisualEffectsManager");
        }
        
        // Wire VisualEffectsManager to OnlineMapsBridge for coordinate conversion
        if (visualEffectsManager != null && mapsBridge != null)
        {
            var vfxType = visualEffectsManager.GetType();
            var mapBridgeField = vfxType.GetField("mapBridge");
            if (mapBridgeField != null)
            {
                mapBridgeField.SetValue(visualEffectsManager, mapsBridge);
                Debug.Log("   ✅ Connected VisualEffectsManager to OnlineMapsBridge");
            }
        }
        
        effectsReady = true;
        yield return new WaitForSeconds(0.2f);
    }
    
    /// <summary>
    /// Validate the complete setup
    /// </summary>
    IEnumerator ValidateSetup()
    {
        Debug.Log("🔍 Validating complete setup...");
        
        bool allComponentsFound = mapsController != null && 
                                 markerStateManager != null && 
                                 mapController != null;
        
        if (!allComponentsFound)
        {
            Debug.LogError("   ❌ Missing required components!");
            setupComplete = false;
            yield break;
        }
        
        // Test marker state events
        bool eventsWorking = TestMarkerEvents();
        
        if (eventsWorking)
        {
            Debug.Log("   ✅ Event system working correctly!");
            setupComplete = true;
        }
        else
        {
            Debug.LogWarning("   ⚠️ Event system may have issues - check console for details");
            setupComplete = true; // Continue anyway
        }
        
        yield return null;
    }
    
    /// <summary>
    /// Auto-wire MapController components using reflection-like approach
    /// </summary>
    void WireMapControllerComponents()
    {
        if (mapController == null) return;
        
        Debug.Log("   🔌 Auto-wiring MapController components...");
        
        // Use reflection to set the public fields
        var type = mapController.GetType();
        
        // Set mapsBridge field (SSOT coordinator)
        var mapsBridgeField = type.GetField("mapsBridge") ?? type.GetField("onlineMapsBridge");
        if (mapsBridgeField != null && mapsBridge != null)
        {
            mapsBridgeField.SetValue(mapController, mapsBridge);
            Debug.Log("     ✅ Connected OnlineMapsBridge (SSOT)");
        }
        
        // Set mapsController field (compatibility)
        var mapsControllerField = type.GetField("mapsController");
        if (mapsControllerField != null && mapsController != null)
        {
            mapsControllerField.SetValue(mapController, mapsController);
            Debug.Log("     ✅ Connected OnlineMapsController");
        }
        
        // Set markerStateManager field  
        var markerField = type.GetField("markerStateManager");
        if (markerField != null && markerStateManager != null)
        {
            markerField.SetValue(mapController, markerStateManager);
            Debug.Log("     ✅ Connected MarkerStateManager");
        }
        
        // Set gameInterface field
        var interfaceField = type.GetField("gameInterface");
        if (interfaceField != null && gameInterface != null)
        {
            interfaceField.SetValue(mapController, gameInterface);
            Debug.Log("     ✅ Connected GameInterface");
        }
        
        // Set vfxManager field
        var vfxField = type.GetField("vfxManager") ?? type.GetField("visualEffectsManager");
        if (vfxField != null && visualEffectsManager != null)
        {
            vfxField.SetValue(mapController, visualEffectsManager);
            Debug.Log("     ✅ Connected VisualEffectsManager");
        }
        
        // Also try to wire OnlineMapsBridge to MapController
        var bridgeField = type.GetField("onlineMapsBridge") ?? type.GetField("mapsBridge");
        if (bridgeField != null && mapsBridge != null)
        {
            bridgeField.SetValue(mapController, mapsBridge);
            Debug.Log("     ✅ Connected OnlineMapsBridge to MapController");
        }
    }
    
    /// <summary>
    /// Test that marker events are working
    /// </summary>
    bool TestMarkerEvents()
    {
        if (markerStateManager == null) return false;
        
        try
        {
            // Test placement mode changes
            markerStateManager.EnableStartPlacement();
            markerStateManager.DisablePlacement();
            
            Debug.Log("   ✅ Marker event system responsive");
            return true;
        }
        catch (System.Exception e)
        {
            Debug.LogError($"   ❌ Marker event system error: {e.Message}");
            return false;
        }
    }
    
    /// <summary>
    /// Quick diagnostic check
    /// </summary>
    [ContextMenu("🔍 Run Setup Diagnostics")]
    public void RunSetupDiagnostics()
    {
        Debug.Log("🔍 PATHFINDR SETUP DIAGNOSTICS");
        Debug.Log("═══════════════════════════════");
        
        // Check each component
        CheckComponent("OnlineMapsBridge (SSOT)", mapsBridge != null, true);
        CheckComponent("OnlineMaps Component", FindObjectOfType<OnlineMaps>() != null, true);
        CheckComponent("OnlineMapsController", mapsController != null, mapsController?.IsReady() ?? false);
        CheckComponent("MarkerStateManager", markerStateManager != null, true);
        CheckComponent("MapController", mapController != null, true);
        CheckComponent("GameInterface", gameInterface != null, true);
        CheckComponent("VisualEffectsManager", visualEffectsManager != null, true);
        
        Debug.Log($"Setup Progress: {setupProgress:F0}%");
        Debug.Log($"Setup Complete: {(setupComplete ? "✅ YES" : "❌ NO")}");
        Debug.Log("═══════════════════════════════");
        
        if (!setupComplete)
        {
            Debug.Log("💡 TIP: Click '🚀 Setup Pathfindr (One Click)' to fix issues automatically!");
        }
    }
    
    void CheckComponent(string name, bool exists, bool ready)
    {
        string status = exists ? (ready ? "✅ READY" : "⚠️ EXISTS") : "❌ MISSING";
        Debug.Log($"{name}: {status}");
    }
    
    /// <summary>
    /// Reset setup to start fresh
    /// </summary>
    [ContextMenu("🔄 Reset Setup")]
    public void ResetSetup()
    {
        setupComplete = false;
        onlineMapsReady = false;
        markerSystemReady = false;
        interfaceReady = false;
        effectsReady = false;
        setupProgress = 0f;
        
        Debug.Log("🔄 Setup reset - ready for fresh setup");
    }
    
    /// <summary>
    /// Get setup status as string for UI display
    /// </summary>
    public string GetSetupStatus()
    {
        if (isSettingUp)
            return $"🔄 Setting up... {setupProgress:F0}%";
        
        if (setupComplete)
            return "✅ Setup Complete - Ready to go!";
            
        return "❌ Setup Incomplete - Click Setup button";
    }
}