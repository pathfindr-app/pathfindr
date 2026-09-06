# Washington, DC — Pathfindr miniature landmarks

Ten original low-poly landmarks, modeled in Blender from real architectural photographs. Art direction follows the existing `engine/city-scene.js`, `engine/world-renderer.js`, and city UI palette: midnight slate, ivory, muted mint, brass, dusty rose and cherry blossom pink. Flat facets, softened edges and a subtly mottled original paint atlas keep these small-scale miniatures readable.

## Files

- `washington-dc.blend` — editable source library; one named collection per landmark, separate studio. Models are arranged for browsing. Objects retain descriptive names and `asset_part` metadata (`architecture` or `environment`).
- `models/<id>.glb` — standalone landmark, without the display plinth, garden, path or cherry trees. One mesh, one textured material.
- `models/<id>-diorama.glb` — landscaped display version. One mesh, one textured material.
- `previews/` — rendered landscaped versions; `contact-sheet.jpg` shows the whole set.
- `textures/painted-palette.png` — original 320 × 64 UV paint atlas, embedded in every GLB and packed in the Blender file. No external texture fetches needed.
- `manifest.json` — names, file paths, triangle counts, file sizes, display dimensions and axis conventions.
- `references/sources.json` — real reference photographs and their source-page URLs. These photos are reference material, not game textures. Source photographs retain their original owners' rights; do not ship them as part of the game asset bundle without checking the source's license.

## Included

U.S. Capitol; White House; Washington Monument; Lincoln Memorial; Jefferson Memorial; Smithsonian Castle; Washington National Cathedral; World War II Memorial; Vietnam Veterans Memorial; Martin Luther King Jr. Memorial.

These are stylized miniatures, not measured architectural reconstructions. Fine sculpture is abstracted; no legible names or quotations are invented for the memorials. The Washington Monument flag ring is simplified. Lincoln's perimeter has 36 columns and the WWII Memorial has 56 pillars. Memorial interiors and unseen facade details are simplified.

## Import

GLB coordinates are Y-up with the presentation front facing +Z. Blender is Z-up, front -Y. Origins are at ground center; the diorama plinth extends below zero. Standalone buildings retain their original placement above the modeled steps/plaza. Units are artistic miniature units, not meters: choose scale and geographic heading per landmark before placement. Dimensions in the manifest describe the landscaped Blender version.

The GLBs use standard glTF PBR materials, with UV0 and embedded PNG base color. No Blender-only procedural shader nodes are required. This is an asset delivery; the live game renderer has not been changed to load them.

## Rebuild

From the repository root:

```sh
"/Users/bradleyarakaki/Documents/ChatGPT/Zoetrope/tools/Blender-5.2.1.app/Contents/MacOS/Blender" --background --python scripts/assets/build_dc_landmarks.py
python3 scripts/assets/dc_contact_sheet.py
```

The generator is deterministic and uses no external Python packages inside Blender. The contact sheet uses Pillow. Existing output files in this pack are replaced when rebuilding.
