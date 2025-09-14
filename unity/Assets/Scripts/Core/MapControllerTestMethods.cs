using System.Collections;
using UnityEngine;

/// <summary>
/// Additional testing methods for MapController
/// This is a partial class extension to add testing functionality
/// </summary>
public partial class MapController
{
    /// <summary>
    /// Test algorithm animation manually
    /// </summary>
    [ContextMenu("Test Algorithm Animation")]
    public void TestAlgorithmAnimation()
    {
        if (startNode != null && endNode != null)
        {
            Debug.Log("Manually triggering algorithm animation for testing");
            
            // Create a simple test route for visualization if none exists
            if (playerRoute.Count == 0)
            {
                playerRoute.Add(startNode.geoCoordinate);
                playerRoute.Add(endNode.geoCoordinate);
                Debug.Log("Created test player route for animation");
            }
            
            // Force algorithm ready state for testing
            if (!algorithmReady && backgroundWaypoints.Count == 0)
            {
                Debug.Log("Background algorithm not ready - triggering it now");
                StartCoroutine(ProcessBackgroundAlgorithm());
                StartCoroutine(WaitAndTriggerAnimation());
            }
            else
            {
                TransitionToAlgorithmAnimation();
            }
        }
        else
        {
            Debug.LogWarning("Cannot test animation - start/end nodes not set. Use 'Place Start/End Point at Map Center' first.");
        }
    }
    
    /// <summary>
    /// Helper coroutine to wait for background algorithm and then trigger animation
    /// </summary>
    IEnumerator WaitAndTriggerAnimation()
    {
        yield return new WaitForSeconds(2f); // Give background algorithm time
        TransitionToAlgorithmAnimation();
    }
    
    /// <summary>
    /// Complete reset of game state for testing
    /// </summary>
    [ContextMenu("Reset Game State")]
    public void ResetGameStateComplete()
    {
        currentPhase = GamePhase.Setup;
        gameMode = false;
        playerRoute.Clear();
        algorithmRoute.Clear();
        isDrawingRoute = false;
        algorithmReady = false;
        
        // Stop any running coroutines
        if (backgroundAlgorithmCoroutine != null)
        {
            StopCoroutine(backgroundAlgorithmCoroutine);
            backgroundAlgorithmCoroutine = null;
        }
        
        // Clear background waypoints
        backgroundWaypoints.Clear();
        backgroundTimer = 0f;
        
        if (vfxManager != null)
            vfxManager.ClearAll();
            
        if (gameInterface != null)
            gameInterface.HideDrawingInstructions();
            
        Debug.Log("Game state completely reset for testing");
    }
}