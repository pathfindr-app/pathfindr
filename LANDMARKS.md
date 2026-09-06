# DC playable landmarks

Ten original user-provided standalone GLBs from `assets/landmarks/washington-dc` are registered in `engine/landmarks.js`. The collectible badge is the tap/keyboard target, separate from route entry, projected below the model's ground footprint so it does not cover the architecture. Hover/focus names the landmark; claiming records its stable ID, name, coordinates and collection time in the existing discovery/round/archive systems. The architecture stays on the map after its badge is collected. Collection is allowed during A*, play and results, but not loading. Procedural trees are excluded from curated model footprints.

The registry activates within 10 km of central DC in any mode that loads the shared city scene. All ten anchors are present, including National Cathedral northwest of the Mall: it is outside the initial Mall view, not relocated into it. DC remains a LIVE city, not an offline city pack. Its surrounding road/building/park data still depends on the existing providers and coverage limits. The model files themselves are same-origin and do not require third-party calls.

## Rendering and packaging

Pinned Three r160's official GLTFLoader and BufferGeometryUtils are copied by the vendor sync script with their `three` imports redirected to the existing global THREE. No second Three runtime/context. The existing shared MapLibre custom layer renders the models, with two concurrent downloads/decodes and a bounded ten-model session template cache (~3.5 MB GLB payload, one mesh/material per asset). Clones share geometry/material/embedded textures, so world cleanup skips those cached resources. Late loads check scene ownership before attaching. Failed loads leave the named collectible usable and expose `world.modelError`; revisiting retries.

GLB Y-up becomes the world renderer's Z-up. Artistic units normalize from actual mesh bounds, not diorama manifest dimensions. Registry meter spans/headings are visual approximations, not surveyed footprints. Height grows smoothly with zoom; no model animation loop or expensive per-frame geometry rebuild. OSM extrusions containing a curated anchor are removed to prevent double buildings; adjacent blocks stay. Only standalone GLBs enter dist: no Blender files, photos, previews, dioramas or source ZIP.

## Geographic references

- Washington Monument: https://www.nps.gov/wamo/planyourvisit/directions.htm
- Lincoln Memorial: https://www.loc.gov/pictures/item/dc0472/
- Jefferson Memorial: https://home.nps.gov/thje/planyourvisit/directions.htm
- WWII Memorial: https://www.nps.gov/wwii/planyourvisit/directions.htm
- Vietnam Veterans Memorial: https://www.nps.gov/vive/planyourvisit/directions.htm
- MLK Memorial: https://www.nps.gov/mlkm/planyourvisit/directions.htm
- Capitol dome geodetic coordinate: https://www.govinfo.gov/content/pkg/CDIR-2001-12-07/pdf/CDIR-2001-12-07.pdf
- National Cathedral: https://www.wikidata.org/wiki/Q668710
- Smithsonian Castle: https://de.wikipedia.org/wiki/Smithsonian_Institution_Building
- White House: https://www.gps-latitude-longitude.com/gps-coordinates-of-the-white-house

NPS navigation points are approximate site anchors, not a claim of centimeter-level building alignment. Check placement against richer future DC pack geometry before using these as surveyed footprints.
