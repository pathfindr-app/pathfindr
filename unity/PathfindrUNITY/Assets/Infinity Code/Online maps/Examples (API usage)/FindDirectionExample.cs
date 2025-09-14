/*         INFINITY CODE         */
/*   https://infinity-code.com   */

using System.Collections.Generic;
using UnityEngine;

namespace InfinityCode.OnlineMapsExamples
{
    /// <summary>
    /// Search a route between two locations and draws the route.
    /// </summary>
    [AddComponentMenu("Infinity Code/Online Maps/Examples (API Usage)/FindDirectionExample")]
    public class FindDirectionExample : MonoBehaviour
    {
        /// <summary>
        /// Reference to the map. If not specified, the current instance will be used.
        /// </summary>
        public OnlineMaps map;
        
        /// <summary>
        /// Google API Key. You can find it in the Google APIs Console.
        /// </summary>
        public string googleAPIKey;

        private void Start()
        {
            // Check Google API Key
            if (string.IsNullOrEmpty(googleAPIKey))
            {
                Debug.LogWarning("Please specify Google API Key");
                return;
            }
            
            // If the map is not specified, get the current instance.
            if (map == null) map = OnlineMaps.instance;

            // Begin to search a route from Los Angeles to the specified coordinates.
            OnlineMapsGoogleRouting request = new OnlineMapsGoogleRouting(
            (
                new OnlineMapsGoogleRouting.Params(
                    "Los Angeles", // FROM (string or Vector2)
                    new Vector2(-118.178960f, 35.063995f) // TO (string or Vector2)
                    )
                {
                    key = googleAPIKey 
                }
            ));

            // Specifies that search results must be sent to OnFindDirectionComplete.
            request.OnComplete += OnFindDirectionComplete;
            request.Send();
        }

        private void OnFindDirectionComplete(string response)
        {
            // Get the result object.
            OnlineMapsGoogleRoutingResult result = OnlineMapsGoogleRouting.GetResult(response);

            // Check that the result is not null, and the number of routes is not zero.
            if (result == null || result.routes.Length == 0) 
            {
                Debug.Log("Find direction failed");
                Debug.Log(response);
                return;
            }

            // Showing the console instructions for each step.
            foreach (OnlineMapsGoogleRoutingResult.RouteLeg leg in result.routes[0].legs)
            {
                foreach (OnlineMapsGoogleRoutingResult.RouteLegStep step in leg.steps)
                {
                    Debug.Log(step.navigationInstruction.instructions);
                }
            }

            // Create a line, on the basis of points of the route.
            OnlineMapsDrawingLine route = new OnlineMapsDrawingLine(result.routes[0].polyline.points, Color.green);

            // Add the line route on the map.
            map.drawingElementManager.Add(route);
        }
    }
}