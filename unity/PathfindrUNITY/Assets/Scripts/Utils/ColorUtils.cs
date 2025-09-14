using System.Collections.Generic;
using UnityEngine;

public static class ColorUtils
{
    public static readonly Dictionary<string, Color> ThemeColors = new Dictionary<string, Color>
    {
        { "primary", new Color(70f/255f, 183f/255f, 128f/255f, 1f) },      // #46B780
        { "background", new Color(64f/255f, 65f/255f, 86f/255f, 1f) },      // #404156
        { "surface", new Color(42f/255f, 43f/255f, 55f/255f, 1f) },         // #2A2B37
        { "accent", new Color(255f/255f, 107f/255f, 53f/255f, 1f) },        // #FF6B35
        { "white", Color.white },
        { "black", Color.black },
        { "gray", new Color(168f/255f, 175f/255f, 179f/255f, 1f) }           // #A8AFB3
    };

    public static Color LerpColor(Color startColor, Color endColor, float t)
    {
        return Color.Lerp(startColor, endColor, t);
    }

    public static Color LerpColorArray(Color[] colors, float t)
    {
        if (colors == null || colors.Length == 0)
            return Color.black;
        
        if (colors.Length == 1)
            return colors[0];

        float scaledT = t * (colors.Length - 1);
        int index = Mathf.FloorToInt(scaledT);
        float localT = scaledT - index;

        if (index >= colors.Length - 1)
            return colors[colors.Length - 1];

        return Color.Lerp(colors[index], colors[index + 1], localT);
    }

    public static Color AdjustBrightness(Color color, float brightness)
    {
        return new Color(
            Mathf.Clamp01(color.r * brightness),
            Mathf.Clamp01(color.g * brightness),
            Mathf.Clamp01(color.b * brightness),
            color.a
        );
    }

    public static Color AdjustAlpha(Color color, float alpha)
    {
        return new Color(color.r, color.g, color.b, Mathf.Clamp01(alpha));
    }

    public static Color BlendColors(Color color1, Color color2, float blendFactor)
    {
        return Color.Lerp(color1, color2, blendFactor);
    }

    public static Color[] CreateGradient(Color startColor, Color endColor, int steps)
    {
        Color[] gradient = new Color[steps];
        for (int i = 0; i < steps; i++)
        {
            float t = i / (float)(steps - 1);
            gradient[i] = Color.Lerp(startColor, endColor, t);
        }
        return gradient;
    }

    public static bool IsValidColor(Color color)
    {
        return color.r >= 0f && color.r <= 1f &&
               color.g >= 0f && color.g <= 1f &&
               color.b >= 0f && color.b <= 1f &&
               color.a >= 0f && color.a <= 1f;
    }

    public static Color SanitizeColor(Color color)
    {
        return new Color(
            Mathf.Clamp01(color.r),
            Mathf.Clamp01(color.g),
            Mathf.Clamp01(color.b),
            Mathf.Clamp01(color.a)
        );
    }

    public static string ColorToHex(Color color)
    {
        Color32 c = color;
        return $"#{c.r:X2}{c.g:X2}{c.b:X2}";
    }

    public static Color HexToColor(string hex)
    {
        if (string.IsNullOrEmpty(hex))
            return Color.black;

        hex = hex.Replace("#", "");
        
        if (hex.Length != 6)
            return Color.black;

        try
        {
            byte r = System.Convert.ToByte(hex.Substring(0, 2), 16);
            byte g = System.Convert.ToByte(hex.Substring(2, 2), 16);
            byte b = System.Convert.ToByte(hex.Substring(4, 2), 16);
            
            return new Color32(r, g, b, 255);
        }
        catch
        {
            return Color.black;
        }
    }

    public static ColorPalette ResetToDefaultPalette()
    {
        return ConfigurationManager.INITIAL_COLORS;
    }

    public static ColorPalette BlendPalettes(ColorPalette palette1, ColorPalette palette2, float t)
    {
        return new ColorPalette
        {
            startNodeFill = Color.Lerp(palette1.startNodeFill, palette2.startNodeFill, t),
            startNodeBorder = Color.Lerp(palette1.startNodeBorder, palette2.startNodeBorder, t),
            endNodeFill = Color.Lerp(palette1.endNodeFill, palette2.endNodeFill, t),
            endNodeBorder = Color.Lerp(palette1.endNodeBorder, palette2.endNodeBorder, t),
            path = Color.Lerp(palette1.path, palette2.path, t),
            route = Color.Lerp(palette1.route, palette2.route, t),
            player = Color.Lerp(palette1.player, palette2.player, t)
        };
    }

    public static Color GetAnimatedPathColor(Color baseColor, float animationProgress)
    {
        float brightness = 1.0f + (0.6f * animationProgress);
        return AdjustBrightness(baseColor, brightness);
    }

    public static Color GetThemeColor(string colorKey)
    {
        return ThemeColors.ContainsKey(colorKey) ? ThemeColors[colorKey] : Color.magenta;
    }
}