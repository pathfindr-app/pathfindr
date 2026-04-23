# Cosmic Mode POC (Standalone)

This is a completely separate prototype page.

## Run

```bash
npm start
```

Then open:

- `/cosmic/` (or `/cosmic.html`)

## What this POC includes

- Earth-perspective 3D sky dome (observer latitude/longitude + sidereal rotation)
- WebGL2 shader renderer (nebula backdrop, point-sprite stars, bloom/composite pipeline)
- Catalog-derived Milky Way density map (HYG, mag <= 12) sampled in true RA/Dec
- Real star catalog subset from **HYG v4.1** (mag <= 7.0)
- Constellation line geometry from **d3-celestial**
- Precomputed star graph + A* pathfinding gameplay
- Compass, mission HUD, observer controls, and live-time speed controls
- Clickable **Star Facts** panel (constellation, spectral type, magnitude, distance)
- Zodiac constellation names rendered directly in the sky view
- Per-star animation profile driven by spectral class + distance + brightness
- FX quality toggle (`FX High/Med/Low`, hotkey `V`) with automatic 2D fallback
- Independent UI/runtime files (`cosmic.html`, `cosmic/cosmic.js`, `cosmic/cosmic.css`)

## Rebuild data bundle

```bash
./scripts/build-cosmic-poc-data.py
```

Output:

- `cosmic/data/cosmic-poc-data.json`

The script auto-downloads source files to `/tmp` if missing.
