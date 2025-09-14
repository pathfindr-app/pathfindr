using UnityEngine;

/// <summary>
/// Game configuration settings
/// </summary>
[System.Serializable]
[CreateAssetMenu(fileName = "GameSettings", menuName = "Pathfindr/Game Settings")]
public class GameSettings : ScriptableObject
{
    [Header("Pathfinding")]
    public PathfindingAlgorithm.AlgorithmType defaultAlgorithm = PathfindingAlgorithm.AlgorithmType.AStar;
    public float searchRadius = 4f;
    public float animationSpeed = 5f;
    
    [Header("Input")]
    public float drawDistanceThreshold = 0.01f;
    public float touchSensitivity = 1f;
    
    [Header("Performance")]
    public bool enableBackgroundProcessing = true;
    public int maxNodesPerFrame = 100;
    
    [Header("Visualization")]
    public bool enableParticleEffects = true;
    public bool showNodeValues = true;
    public float effectIntensity = 0.8f;
}

/// <summary>
/// Search direction for bidirectional algorithms
/// </summary>
public enum SearchDirection
{
    Forward,        // Forward search from start
    Backward        // Backward search from end
}