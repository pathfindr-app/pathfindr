# New Cairo — Pathfindr landmark miniatures

Ten original Blender models based on the real photos in `references/`. Warm sandstone, slate, mint glass and water, brass, terracotta and small palms extend the DC and Europe painted ceramic aesthetic. The original 320 × 64 paint atlas contains no photographic pixels.

## Files

- `new-cairo.blend`: editable source, ten named collections arranged in two rows, separate studio.
- `models/<id>.glb`: standalone landmark, without the removable display plinth and decorative corner gardens.
- `models/<id>-diorama.glb`: landscaped display version.
- `textures/painted-palette.png`: embedded in every GLB and packed into Blender.
- `previews/contact-sheet.jpg`: all ten models; individual previews alongside it.
- `references/photo-board.jpg` and `sources.json`: actual photos, source pages and features used.
- `manifest.json`: geometry counts, sizes, orientation and reference notes.
- `validation.json` and `roundtrip-validation.json`: GLB checks and Blender reimport results.

## Geometry and mobile use

Standalone collection: **18,066 triangles / 1.53 MiB**. Each GLB is one mesh and one opaque material with UVs and an embedded tiny texture. Glass, pools and fountain jets use opaque painted geometry. No alpha blending or external texture requests are needed.

These are asset measurements, not phone frame-rate benchmarks. This pack has not been integrated into the live game or profiled on a device. There are no distance LODs or collision meshes. Share the atlas material during integration if many landmarks are loaded together.

## Scope and coordinates

The collection represents New Cairo, including its campus, sports and leisure destinations. Campus and resort models abbreviate larger complexes into recognizable vignettes. WHITE represents a photographed retail frontage, not the entire Waterway development. Monument silhouettes and colors are stylized, not survey reconstructions.

GLB is Y-up, front +Z; Blender is Z-up, front -Y. Origins are at local ground center. Units are artistic miniature units, not meters. Set scale and heading during map integration. Manifest dimensions describe the landscaped Blender model. The removable display base extends below zero. Actual landmark features such as fountain pools, stadium turf and the campus garden remain in the standalone model.

## Landmarks

- **Hassan Sharbatly Mosque** — Four slender octagonal minarets, gold segmented dome, windowed drum and deep rectangular front colonnade.
- **Mosheer Tantawy Mosque** — Two flared minaret crowns, mint ribbed dome and monumental entry portal; simplified prayer hall.
- **AUC · New Cairo Campus** — Abbreviated ceremonial courtyard: striped stone wings, central arched gateway, raised tower and linear reflecting pools.
- **German University in Cairo** — Abbreviated academic campus: warm rectangular blocks, horizontal glass strips and circular garden with small gazebos.
- **Petrosport Stadium** — Rectangular football pitch, red seating tiers, a covered main stand and four floodlight masts.
- **Cairo Festival City** — Fountain plaza with a repeated line of arcing jets and abbreviated cream retail facades.
- **Dusit Thani LakeView** — Arrival facade with twin squat towers, terracotta roof canopies and three sculptural urn fountains.
- **WHITE · The Waterway** — Representative WHITE retail frontage: tall glass bays, vertical fins, cafe canopy and parasol terrace.
- **Katameya Heights Clubhouse** — Clubhouse front: cream pavilions, tiled roofs, arched windows, central glazed skylight and putting green.
- **Point 90 Mall** — Sweeping faceted blue-glass frontage, concrete end piers, overhanging curved roof and arrival canopy.

## Rebuild

Place the included `scripts/assets/` directory beside `assets/`. Run Blender headlessly from the project root:

```sh
/path/to/Blender --background --python scripts/assets/render_new_cairo_pack.py -- --city new-cairo
```

The New Cairo builder reuses geometry and atlas helpers from `build_europe_landmarks.py`; all required source scripts are included. Packaging and reference boards use Pillow. Rebuilding replaces the selected pack's generated models and previews. Reference photos remain owned by their original creators and are supplied for modeling review, not as game textures or redistribution-ready game content.
