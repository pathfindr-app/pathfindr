# Living-city rendering research and implementation

## References consulted before implementation

- [Blender Eevee 4.2 migration](https://developer.blender.org/docs/release_notes/4.2/eevee_migration/): emission and bloom are distinct; bloom moved to the compositor. Target a sharp core plus broad optical halo, not uniformly blurred geometry.
- [Three r160 UnrealBloomPass](https://github.com/mrdoob/three.js/blob/r160/examples/jsm/postprocessing/UnrealBloomPass.js): separable filtering and weighted blur scales. Our route bloom is bounded to an emission-only buffer; UI is excluded.
- [GPU Gems, Effective Water Simulation](https://developer.nvidia.com/gpugems/gpugems/part-i-natural-effects/chapter-1-effective-water-simulation-physical-models): layered directional waves and analytic surface derivatives. Our stylized water uses these principles for normals/specular, not a full fluid solver.
- [MapLibre 4.1 custom-layer contract](https://github.com/maplibre/maplibre-gl-js/blob/v4.1.0/src/style/style_layer/custom_style_layer.ts): shared GL context, Mercator projection matrix, context lifecycle, depth and premultiplied-alpha requirements. Match the installed version, not newer globe APIs.
- [MapLibre Three integration](https://maplibre.org/maplibre-gl-js/docs/examples/add-a-3d-model-using-threejs/): share the map canvas/context, reset renderer state, never clear the map framebuffer.
- [OSM river direction](https://wiki.openstreetmap.org/wiki/Tag:waterway%3Driver): river ways run downstream. Tidal/unknown waterways must not be presented as known currents.
- [OSM trees](https://wiki.openstreetmap.org/wiki/Tag:natural%3Dtree) and [burger cuisine](https://wiki.openstreetmap.org/wiki/Tag:cuisine%3Dburger): use available tags, preserve missing-data fallbacks, do not infer a restaurant's menu from its name.

## Art direction and constraints

Dark indigo city mass; warm readable streets; jade living green spaces; deep teal water
with restrained pearl specular. Cyan-white frontier cores cool into a persistent blue
network. Avoid random per-frame flicker and phase resets. Environment motion remains
subordinate to route legibility. Reduced-motion disables environmental movement.

Geometry is geographic, not screen-painted. Triangulation preserves polygon holes.
Water normals and fine park detail are procedural in local world meters, with
derivative-based detail attenuation. Vegetation is instanced and bounded. Landmark
meshes are original procedural stylizations, not downloaded/unlicensed models.

Collection is a separate tap interaction and never changes route distance or score.
Local collection persistence is a prototype, not a secure or synchronized currency.
No real-world travel is required. POI coverage is incomplete. Camera zoom may reveal
models progressively but must not allow unbounded landmark growth or hide roads.

Eevee is an art reference, not a claim of engine parity: this build does not implement
Eevee GI, full-scene HDR lighting, screen-space reflections, or a hydrological model.
Real-device GPU/battery profiling is still required before a fidelity/performance claim.

## Cinema pass / coastal coverage

- [OSM coastline processing](https://osmdata.openstreetmap.de/processing/coastline.html): oceans require assembled land/water polygons. An `around` lake query is not ocean coverage. Closed bay/strait polygons are now accepted; open coasts and full ocean masks remain pending, not approximated with rectangles over land.
- [AnalyserNode scaling](https://developer.mozilla.org/en-US/docs/Web/API/AnalyserNode/maxDecibels): byte-frequency amplitudes depend on the configured dB range. Analysis uses explicit bounds and attack/release envelopes. Music is the source; no fake beat loop or microphone.
- River direction is currently one nearest-centerline direction per polygon, not a curved flow field. Tidal areas use wind ripples only.
- Search expands over 2.3–5.2 seconds at normal speed; the final distance-weighted route draws in 1.15 seconds, followed by 2.2 seconds of settling. Atmospheric rings are decorative, while street ignition follows actual A* relaxation events.
- Recap uses source-over colored filaments, soft halos and traveling charge, avoiding additive white clipping. Park shader reserved-word compilation failure found in browser testing and corrected (`patchiness`).
