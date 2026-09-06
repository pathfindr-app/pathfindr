# Paris — Pathfindr miniature landmarks

Ten original low-poly landmarks modeled in Blender from the real photographs in `references/`. The ivory, slate, mint, brass and dusty rose palette matches the Washington, DC collection. Textures are original, subtly mottled paint; no photographic pixels are applied to the models.

## Delivery

- `paris.blend`: editable source, one named collection per landmark, with a separate studio. The library is arranged in two rows for browsing. Objects carry `asset_part` metadata for architecture versus environment.
- `models/<id>.glb`: standalone landmark without the display base, garden or decorative trees.
- `models/<id>-diorama.glb`: landscaped display variant.
- `textures/painted-palette.png`: original 320 × 64 paint atlas, embedded in every GLB and packed in the Blender file.
- `previews/contact-sheet.jpg`: complete collection; individual renders are alongside it.
- `references/sources.json` and `references/photo-board.jpg`: source URLs and actual reference images.
- `manifest.json`: names, dimensions, geometry counts, file sizes and reference features.
- `validation.json` and `roundtrip-validation.json`: structural checks and Blender reimport results.

## Mobile profile

The ten standalone models total **32,242 triangles** and **2.79 MiB** of GLB files. Each export contains one mesh, one material, UVs and an embedded texture. Materials are opaque; water and glass are represented with painted color, avoiding blended transparent layers. Counts in the contact sheet refer to the standalone models.

This is a plausible asset budget, not a measured phone performance result. Models are not yet connected to the live game. Device frame time must be measured with the map and effects running. There are no distance LODs or collision meshes in this pack.

## Coordinates and scope

GLB is Y-up, with the presentation front along +Z. Blender is Z-up, front -Y. Every exported origin is at local ground center. The display plinth extends below zero. Units are stylized miniature units, not meters; set geographic scale and heading during integration. Manifest dimensions describe the landscaped Blender version. Models are intentionally simplified, with abstract sculpture, reduced repeated details and abbreviated surroundings, rather than survey reconstructions.

## Included landmarks

- **Eiffel Tower** — Open four-legged iron silhouette, lower arches, latticework and two viewing platforms.
- **Arc de Triomphe** — Grand open passage, broad masonry piers, relief panels and attic cornice.
- **Louvre & Pyramid** — Opaque mint pyramid with geometric framing and abbreviated palace courtyard.
- **Notre-Dame** — Twin flat-topped towers, rose window, three portals, gallery and flying buttresses.
- **Sacré-Cœur** — Central tall white dome, flanking domes, rear campanile and entrance arcade.
- **Les Invalides** — Gilded ribbed dome, lantern and columned church front.
- **Panthéon** — Classical portico, pediment, colonnaded drum and slate dome.
- **Palais Garnier** — Columned opera facade, gilded rooftop figures and mint auditorium dome.
- **Centre Pompidou** — Exposed structural grid, colored service pipes and diagonal escalator.
- **Moulin Rouge** — Red windmill, open lattice sails and named cabaret facade; an archival photograph informs the composition.

## Rebuild

Copy the included `scripts/assets/` files to the repository’s scripts directory, keeping `assets/landmarks/` alongside `scripts/`. Run from the repository root:

```sh
BLENDER="/Users/bradleyarakaki/Documents/ChatGPT/Zoetrope/tools/Blender-5.2.1.app/Contents/MacOS/Blender"
"$BLENDER" --background --python scripts/assets/render_europe_pack.py -- --city paris
```

The Blender generator needs no external Python packages. Packaging uses Pillow. Existing generated files for the selected city are replaced. Reference photos remain owned by their original creators; the source manifest links to their pages. They are included for modeling review, not as game textures or redistribution-ready game content.
