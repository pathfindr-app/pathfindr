using System.Collections.Generic;
using UnityEngine;
using System.Globalization;
using System.Text.RegularExpressions;

public static class GeometricUtils
{
    public static List<Vector2> CreateGeoJSONCircle(Vector2 center, float radiusInKm, int points = 64)
    {
        var coords = new Vector2(center.x, center.y); // longitude, latitude
        
        var ret = new List<Vector2>();
        float distanceX = radiusInKm / (111.320f * Mathf.Cos(coords.y * Mathf.PI / 180f));
        float distanceY = radiusInKm / 110.574f;

        float theta, x, y;
        for (int i = 0; i < points; i++)
        {
            theta = (i / (float)points) * (2 * Mathf.PI);
            x = distanceX * Mathf.Cos(theta);
            y = distanceY * Mathf.Sin(theta);

            ret.Add(new Vector2(coords.x + x, coords.y + y));
        }
        
        ret.Add(ret[0]);
        return ret;
    }

    public static Vector4 RgbStringToArray(string colorString)
    {
        if (string.IsNullOrEmpty(colorString))
            return new Vector4(0, 0, 0, 255);

        var matches = Regex.Matches(colorString, @"\d+(\.\d+)?");
        if (matches.Count < 3)
            return new Vector4(0, 0, 0, 255);

        float r = float.Parse(matches[0].Value, CultureInfo.InvariantCulture);
        float g = float.Parse(matches[1].Value, CultureInfo.InvariantCulture);
        float b = float.Parse(matches[2].Value, CultureInfo.InvariantCulture);
        float a = matches.Count >= 4 ? float.Parse(matches[3].Value, CultureInfo.InvariantCulture) * 255f : 255f;

        return new Vector4(r, g, b, a);
    }

    public static string ArrayToRgbString(Vector4 colorArray)
    {
        if (colorArray == Vector4.zero)
            return "rgb(0, 0, 0)";

        Vector4 rgb = colorArray;
        if (rgb.w > 1f) rgb.w /= 255f;

        bool hasAlpha = rgb.w < 1f;
        if (hasAlpha)
        {
            return $"rgba({rgb.x}, {rgb.y}, {rgb.z}, {rgb.w.ToString("F2", CultureInfo.InvariantCulture)})";
        }
        else
        {
            return $"rgb({rgb.x}, {rgb.y}, {rgb.z})";
        }
    }

    public static Color Vector4ToColor(Vector4 colorArray)
    {
        return new Color(
            colorArray.x / 255f,
            colorArray.y / 255f,
            colorArray.z / 255f,
            colorArray.w / 255f
        );
    }

    public static Vector4 ColorToVector4(Color color)
    {
        return new Vector4(
            color.r * 255f,
            color.g * 255f,
            color.b * 255f,
            color.a * 255f
        );
    }

    public static float CalculateDistance(Vector2 point1, Vector2 point2)
    {
        return Mathf.Sqrt(Mathf.Pow(point1.x - point2.x, 2) + Mathf.Pow(point1.y - point2.y, 2));
    }

    public static float CalculateGeoDistance(double lat1, double lon1, double lat2, double lon2)
    {
        const double EarthRadius = 6371;
        
        double dLat = (lat2 - lat1) * Mathf.PI / 180;
        double dLon = (lon2 - lon1) * Mathf.PI / 180;
        
        double a = Mathf.Sin((float)dLat / 2) * Mathf.Sin((float)dLat / 2) +
                   Mathf.Cos((float)(lat1 * Mathf.PI / 180)) * Mathf.Cos((float)(lat2 * Mathf.PI / 180)) *
                   Mathf.Sin((float)dLon / 2) * Mathf.Sin((float)dLon / 2);
        
        double c = 2 * Mathf.Atan2(Mathf.Sqrt((float)a), Mathf.Sqrt((float)(1 - a)));
        
        return (float)(EarthRadius * c);
    }
}