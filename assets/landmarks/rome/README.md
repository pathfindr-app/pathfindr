# Rome — Pathfindr miniature landmarks

Ten original low-poly landmarks modeled in Blender from the real photographs in `references/`. The ivory, slate, mint, brass and dusty rose palette matches the Washington, DC collection. Textures are original, subtly mottled paint; no photographic pixels are applied to the models.

## Delivery

- `rome.blend`: editable source, one named collection per landmark, with a separate studio. The library is arranged in two rows for browsing. Objects carry `asset_part` metadata for architecture versus environment.
- `models/<id>.glb`: standalone landmark without the display base, garden or decorative trees.
- `models/<id>-diorama.glb`: landscaped display variant.
- `textures/painted-palette.png`: original 320 × 64 paint atlas, embedded in every GLB and packed in the Blender file.
- `previews/contact-sheet.jpg`: complete collection; individual renders are alongside it.
- `references/sources.json` and `references/photo-board.jpg`: source URLs and actual reference images.
- `manifest.json`: names, dimensions, geometry counts, file sizes and reference features.
- `validation.json` and `roundtrip-validation.json`: structural checks and Blender reimport results.

## Mobile profile

The ten standalone models total **32,947 triangles** and **2.78 MiB** of GLB files. Each export contains one mesh, one material, UVs and an embedded texture. Materials are opaque; water and glass are represented with painted color, avoiding blended transparent layers. Counts in the contact sheet refer to the standalone models.

This is a plausible asset budget, not a measured phone performance result. Models are not yet connected to the live game. Device frame time must be measured with the map and effects running. There are no distance LODs or collision meshes in this pack.

## Coordinates and scope

GLB is Y-up, with the presentation front along +Z. Blender is Z-up, front -Y. Every exported origin is at local ground center. The display plinth extends below zero. Units are stylized miniature units, not meters; set geographic scale and heading during integration. Manifest dimensions describe the landscaped Blender version. Models are intentionally simplified, with abstract sculpture, reduced repeated details and abbreviated surroundings, rather than survey reconstructions.

St. Peter’s Basilica is in **Vatican City** and is labeled accordingly. The Roman Forum and Piazza Navona assets focus on the Temple of Saturn and Fountain of the Four Rivers respectively.

## Included landmarks

- **Colosseum** — Elliptical arena, true arcade openings, concentric seating and partially surviving upper wall.
- **Pantheon** — Brick rotunda, shallow concrete dome with open oculus and columned portico.
- **Trevi Fountain** — Palazzo facade, central grotto sculpture and broad mint fountain basin.
- **Spanish Steps** — Sweeping lower flight, divided central flights, twin church towers and obelisk; archival reference.
- **Castel Sant’Angelo** — Cylindrical mausoleum, battlements, papal apartments, angel and short bridge approach.
- **St Peter’s · Vatican City** — Broad facade, dome, saints, obelisk and two open colonnade arms. This landmark is in Vatican City.
- **Roman Forum · Saturn** — The Temple of Saturn represents the Roman Forum: surviving columns, entablature, podium and fallen masonry.
- **Vittoriano** — White stepped monument, curved colonnade, equestrian figure and abbreviated rooftop quadriga pavilions.
- **Piazza Navona · Four Rivers** — Fountain of the Four Rivers represents Piazza Navona: rock, four abstract figures, obelisk and basin.
- **Pyramid of Cestius** — Steep marble pyramid, sparse masonry courses and abbreviated adjoining Aurelian wall.

## Rebuild

Copy the included `scripts/assets/` files to the repository’s scripts directory, keeping `assets/landmarks/` alongside `scripts/`. Run from the repository root:

```sh
BLENDER="/Users/bradleyarakaki/Documents/ChatGPT/Zoetrope/tools/Blender-5.2.1.app/Contents/MacOS/Blender"
"$BLENDER" --background --python scripts/assets/render_europe_pack.py -- --city rome
```

The Blender generator needs no external Python packages. Packaging uses Pillow. Existing generated files for the selected city are replaced. Reference photos remain owned by their original creators; the source manifest links to their pages. They are included for modeling review, not as game textures or redistribution-ready game content.
