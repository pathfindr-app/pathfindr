﻿/*         INFINITY CODE         */
/*   https://infinity-code.com   */

/* Special thanks to Brian Chasalow for his help in developing this script. */

using System;
using System.Collections.Generic;
using System.Linq;
using UnityEngine;
using UnityEngine.EventSystems;
using UnityEngine.UI;

public class OnlineMapsRawImageTouchForwarder : MonoBehaviour
{
    private static List<OnlineMapsRawImageTouchForwarder> forwarders = new List<OnlineMapsRawImageTouchForwarder>();
    private static OnlineMapsRawImageTouchForwarder lastActiveForwarder;

    public RawImage image;
    public OnlineMaps map;
    public RenderTexture targetTexture;

    private OnlineMapsTileSetControl control;

    private static Vector2 pointerPos = Vector2.zero;
    private static GameObject target;

    public Camera worldCamera
    {
        get
        {
            if (image.canvas == null || image.canvas.renderMode == RenderMode.ScreenSpaceOverlay) return null;
            return image.canvas.worldCamera;
        }
    }

    public Vector2 ForwarderToMapSpace(Vector2 position)
    {
        RectTransform t = image.rectTransform;
        Vector2 sizeDelta = t.rect.size;

        Vector2 pos = Vector2.zero;

        if ((int)sizeDelta.x == 0 || (int)sizeDelta.y == 0) return pos;

        if (!RectTransformUtility.ScreenPointToLocalPointInRectangle(image.rectTransform, position, worldCamera, out pos)) return pos;

        pos += sizeDelta / 2.0f;

        if (targetTexture == null)
        {
            pos.x *= Screen.width / sizeDelta.x;
            pos.y *= Screen.height / sizeDelta.y;
        }
        else
        {
            pos.x *= targetTexture.width / sizeDelta.x;
            pos.y *= targetTexture.height / sizeDelta.y;
        }

        return pos;
    }

    private static GameObject GetTargetGameObject(Vector2 position)
    {
        PointerEventData pe = new PointerEventData(EventSystem.current);
        pe.position = position;

        List<RaycastResult> hits = new List<RaycastResult>();
        EventSystem.current.RaycastAll(pe, hits);
        for (int i = 0; i < hits.Count; i++)
        {
            GameObject go = hits[i].gameObject;
            if (forwarders.Any(f => f.gameObject == go)) return go;
        }

        return null;
    }

    private int GetTouchCountFromForwarder()
    {
        if (target != image.gameObject) return 0;

#if UNITY_EDITOR
        return OnlineMapsInput.GetMouseButton(0) ? 1 : 0;
#else
        if (OnlineMapsInput.touchSupported)
        {
            if (OnlineMapsInput.touchCount > 0) return OnlineMapsInput.touchCount;
        }
        return OnlineMapsInput.GetMouseButton(0) ? 1 : 0;
#endif
    }

    public Vector2 MapToForwarderSpace(Vector2 position)
    {
        RectTransform t = image.rectTransform;
        Vector2 sizeDelta = t.rect.size;
        if ((int)sizeDelta.x == 0 || (int)sizeDelta.y == 0) return Vector2.zero;

        float scale = image.canvas.scaleFactor;

        if (targetTexture == null)
        {
            position.x *= sizeDelta.x / Screen.width * scale;
            position.y *= sizeDelta.y / Screen.height * scale;
        }
        else
        {
            position.x *= sizeDelta.x / targetTexture.width * scale;
            position.y *= sizeDelta.y / targetTexture.height * scale;
        }

        position.x -= sizeDelta.x / 2 * scale;
        position.y -= sizeDelta.y / 2 * scale;

        Vector3 pos = (Vector3)position + image.transform.position;

        return RectTransformUtility.WorldToScreenPoint(worldCamera, pos);
    }

    protected void OnDestroy()
    {
        forwarders.Remove(this);
        if (forwarders.Count == 0)
        {
            control.OnGetInputPosition -= OnGetInputPosition;
            control.OnGetTouchCount -= OnGetTouchCount;
            OnlineMapsGUITooltipDrawer.OnDrawTooltip -= OnDrawTooltip;
        }
    }

    private static void OnDrawTooltip(GUIStyle style, string text, Vector2 position)
    {
        foreach (OnlineMapsRawImageTouchForwarder forwarder in forwarders)
        {
            RectTransform t = forwarder.image.rectTransform;

            float scale = forwarder.image.canvas.scaleFactor;

            Vector2 p = position;

            if (forwarder.targetTexture == null)
            {
                p.x *= t.sizeDelta.x / Screen.width * scale;
                p.y *= t.sizeDelta.y / Screen.height * scale;
            }
            else
            {
                p.x *= t.sizeDelta.x / forwarder.targetTexture.width * scale;
                p.y *= t.sizeDelta.y / forwarder.targetTexture.height * scale;
            }

            p -= t.sizeDelta / 2 * scale;

            Vector3 pos = (Vector3)p + forwarder.image.transform.position;

            p = RectTransformUtility.WorldToScreenPoint(forwarder.worldCamera, pos);

            GUIContent tip = new GUIContent(text);
            Vector2 size = style.CalcSize(tip);
            GUI.Label(new Rect(p.x - size.x / 2 - 5, Screen.height - p.y - size.y - 20, size.x + 10, size.y + 5), text, style);
        }
    }

    private static Vector2 OnGetInputPosition()
    {
        if (target == null) return Vector2.zero;

        for (int i = 0; i < forwarders.Count; i++)
        {
            var forwarder = forwarders[i];
            if (target != forwarder.image.gameObject) continue;

            lastActiveForwarder = forwarder;

            Vector2 pos;
            if (forwarder.ProcessTouch(pointerPos, out pos)) return pos;
        }

        return Vector2.zero;
    }

    private static Vector2[] OnGetMultitouchInputPositions()
    {
        if (lastActiveForwarder == null) lastActiveForwarder = forwarders[0];

        Vector2[] touches = OnlineMapsInput.touches.Select(t => t.position).ToArray();

        Vector2 p;
        for (int i = 0; i < touches.Length; i++)
        {
            lastActiveForwarder.ProcessTouch(touches[i], out p, false);
            touches[i] = p;
        }

        return touches;
    }

    private static int OnGetTouchCount()
    {
        if (target == null) return 0;

        for (int i = 0; i < forwarders.Count; i++)
        {
            var forwarder = forwarders[i];
            if (target != forwarder.image.gameObject) continue;

            return forwarder.GetTouchCountFromForwarder();
        }
        
        return 0;
    }

    private void OnUpdateBefore()
    {
        pointerPos = OnlineMapsInput.mousePosition;
        if (OnlineMapsInput.touchSupported && OnlineMapsInput.touchCount > 0)
        {
            pointerPos = Vector2.zero;
            for (int i = 0; i < OnlineMapsInput.touchCount; i++)
            {
                Touch touch = OnlineMapsInput.touches[i];
                pointerPos += touch.position;
            }

            pointerPos /= OnlineMapsInput.touchCount;
        }

        target = GetTargetGameObject(pointerPos);
    }

    private bool ProcessTouch(Vector2 inputTouch, out Vector2 localPosition, bool checkRect = true)
    {
        localPosition = Vector2.zero;

        RectTransform t = image.rectTransform;
        Vector2 sizeDelta = t.rect.size;
        if ((int)sizeDelta.x == 0 || (int)sizeDelta.y == 0) return false;

        if (!RectTransformUtility.ScreenPointToLocalPointInRectangle(image.rectTransform, inputTouch, worldCamera, out localPosition)) return false;
        if (checkRect && !t.rect.Contains(localPosition)) return false;

        localPosition += sizeDelta / 2.0f;

        if (targetTexture == null)
        {
            localPosition.x *= Screen.width / sizeDelta.x;
            localPosition.y *= Screen.height / sizeDelta.y;
        }
        else
        {
            localPosition.x *= targetTexture.width / sizeDelta.x;
            localPosition.y *= targetTexture.height / sizeDelta.y;
        }

        return true;
    }

    private void Start()
    {
        if (map == null) map = OnlineMaps.instance;
        control = map.control as OnlineMapsTileSetControl;

        if (forwarders.Count == 0)
        {
            control.OnUpdateBefore += OnUpdateBefore;
            control.OnGetTouchCount += OnGetTouchCount;
            control.OnGetInputPosition += OnGetInputPosition;
            control.OnGetMultitouchInputPositions += OnGetMultitouchInputPositions;

            map.notInteractUnderGUI = false;
            control.checkScreenSizeForWheelZoom = false;

            OnlineMapsGUITooltipDrawer.OnDrawTooltip += OnDrawTooltip;
        }

        forwarders.Add(this);
    }
}
