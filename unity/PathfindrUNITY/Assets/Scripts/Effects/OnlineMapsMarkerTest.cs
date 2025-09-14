using UnityEngine;
using System.Collections;

/// <summary>
/// Simple test component for Online Maps marker functionality
/// Add this to a GameObject and use the context menu to test markers
/// </summary>
public class OnlineMapsMarkerTest : MonoBehaviour
{
    [Header("Test Settings")]
    public bool enableDebugLogs = true;
    
    /// <summary>
    /// Test basic marker creation at map center
    /// </summary>
    [ContextMenu("Test Create Marker at Map Center")]
    public void TestCreateMarkerAtMapCenter()
    {
        if (OnlineMaps.instance != null)
        {
            Vector2 mapCenter = OnlineMaps.instance.position;
            if (enableDebugLogs)
                Debug.Log($"Testing Online Maps marker at: {mapCenter}");
            
            // Create test marker using Online Maps API
            var testMarker = OnlineMapsMarkerManager.CreateItem(mapCenter, "TEST");
            if (testMarker != null)
            {
                if (enableDebugLogs)
                    Debug.Log("SUCCESS: Online Maps marker created and should be visible!");
                testMarker.label = "TEST";
                
                // Remove after 5 seconds
                StartCoroutine(RemoveTestMarkerAfterDelay(testMarker, 5f));
            }
            else
            {
                Debug.LogError("FAILED: Could not create Online Maps marker");
            }
        }
        else
        {
            Debug.LogError("OnlineMaps.instance is null - check scene setup");
        }
    }
    
    /// <summary>
    /// Test creating markers at specific NYC coordinates
    /// </summary>
    [ContextMenu("Test NYC Markers")]
    public void TestNYCMarkers()
    {
        // Test coordinates in NYC area
        Vector2 nycCoords = new Vector2(-74.006f, 40.7128f); // NYC center
        Vector2 timesSquare = new Vector2(-73.9857f, 40.7589f); // Times Square
        
        if (enableDebugLogs)
            Debug.Log("Creating test markers in NYC area");
            
        // Create two test markers
        var marker1 = OnlineMapsMarkerManager.CreateItem(nycCoords, "NYC");
        var marker2 = OnlineMapsMarkerManager.CreateItem(timesSquare, "TS");
        
        if (marker1 != null && marker2 != null)
        {
            if (enableDebugLogs)
                Debug.Log("SUCCESS: NYC test markers created!");
            marker1.label = "NYC Center";
            marker2.label = "Times Square";
            
            // Remove after 10 seconds
            StartCoroutine(RemoveTestMarkerAfterDelay(marker1, 10f));
            StartCoroutine(RemoveTestMarkerAfterDelay(marker2, 10f));
        }
        else
        {
            Debug.LogError("Failed to create NYC test markers");
        }
    }
    
    /// <summary>
    /// Remove all existing markers for testing
    /// </summary>
    [ContextMenu("Clear All Markers")]
    public void ClearAllMarkers()
    {
        if (OnlineMapsMarkerManager.instance != null)
        {
            OnlineMapsMarkerManager.instance.RemoveAll();
            if (enableDebugLogs)
                Debug.Log("All Online Maps markers cleared");
        }
        else
        {
            Debug.LogWarning("OnlineMapsMarkerManager instance not found");
        }
    }
    
    /// <summary>
    /// Helper coroutine to remove markers after delay
    /// </summary>
    IEnumerator RemoveTestMarkerAfterDelay(OnlineMapsMarker marker, float delay)
    {
        yield return new WaitForSeconds(delay);
        if (marker != null)
        {
            OnlineMapsMarkerManager.RemoveItem(marker);
            if (enableDebugLogs)
                Debug.Log($"Test marker '{marker.label}' removed after {delay}s");
        }
    }
}