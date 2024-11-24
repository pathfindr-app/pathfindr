using UnityEngine;
using System;

public class MapInitializer : MonoBehaviour
{
    [SerializeField] private OnlineMaps map;
    
    private void Start()
    {
        // Initialize map if not already assigned
        if (map == null) map = GetComponent<OnlineMaps>();
        
        // Set initial position (example: New York City)
        map.position = new Vector2(-73.935242f, 40.730610f); // Longitude, Latitude
        map.zoom = 15; // City level zoom
    }
} 