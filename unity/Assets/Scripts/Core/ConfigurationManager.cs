using System.Collections.Generic;
using UnityEngine;

[System.Serializable]
public struct ViewState
{
    public double longitude;
    public double latitude;
    public float zoom;
    public float pitch;
    public float bearing;

    public ViewState(double lon, double lat, float z, float p, float b)
    {
        longitude = lon;
        latitude = lat;
        zoom = z;
        pitch = p;
        bearing = b;
    }
}

[System.Serializable]
public struct ColorPalette
{
    public Color startNodeFill;
    public Color startNodeBorder;
    public Color endNodeFill;
    public Color endNodeBorder;
    public Color path;
    public Color route;
    public Color player;
}

[System.Serializable]
public struct LocationData
{
    public string name;
    public double latitude;
    public double longitude;

    public LocationData(string n, double lat, double lon)
    {
        name = n;
        latitude = lat;
        longitude = lon;
    }
}

public static class ConfigurationManager
{
    public const string MAP_STYLE = "./map_style.json";

    public static readonly ViewState INITIAL_VIEW_STATE = new ViewState(
        -0.127,     // longitude
        51.507,     // latitude  
        13f,        // zoom
        0f,         // pitch
        0f          // bearing
    );

    public static readonly ColorPalette INITIAL_COLORS = new ColorPalette
    {
        startNodeFill = new Color(70f/255f, 183f/255f, 128f/255f, 1f),
        startNodeBorder = new Color(1f, 1f, 1f, 1f),
        endNodeFill = new Color(152f/255f, 4f/255f, 12f/255f, 1f),
        endNodeBorder = new Color(0f, 0f, 0f, 1f),
        path = new Color(70f/255f, 183f/255f, 128f/255f, 1f),
        route = new Color(165f/255f, 13f/255f, 32f/255f, 1f),
        player = new Color(1f, 165f/255f, 0f, 1f)
    };

    public static readonly List<LocationData> LOCATIONS = new List<LocationData>
    {
        new LocationData("New York", 40.712, -74.006),
        new LocationData("Tokyo", 35.682, 139.759),
        new LocationData("Paris", 48.856, 2.352),
        new LocationData("Rome", 41.902, 12.496),
        new LocationData("Prague", 50.086, 14.420),
        new LocationData("London", 51.507, -0.127),
        new LocationData("Dubai", 25.276, 55.296),
        new LocationData("Singapore", 1.352, 103.820),
        new LocationData("San Francisco", 37.774, -122.419),
        new LocationData("Berlin", 52.520, 13.405),
        new LocationData("Sydney", -33.868, 151.209),
        new LocationData("Amsterdam", 52.367, 4.900),
        new LocationData("Stockholm", 59.329, 18.068),
        new LocationData("Hong Kong", 22.319, 114.169),
        new LocationData("Rio de Janeiro", -22.906, -43.172),
        new LocationData("Shanghai", 31.230, 121.473),
        new LocationData("Barcelona", 41.385, 2.173)
    };

    public static LocationData GetLocationByName(string locationName)
    {
        return LOCATIONS.Find(loc => loc.name == locationName);
    }

    public static LocationData GetRandomLocation()
    {
        return LOCATIONS[Random.Range(0, LOCATIONS.Count)];
    }
}