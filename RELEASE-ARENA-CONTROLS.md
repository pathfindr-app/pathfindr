# Circuit direct controls and assisted keyboard release

Released September 7, 2026. Source commits `72f0119` and `3c7db92` on `codex/new-cairo-arena-20260907`.

- Production: `dpl_C6ZnpdoVs7d4bu4nx6XbAR15suZh`
- Immutable origin: https://pathfindralpha-acu2grw44-pathfindr-apps-projects.vercel.app
- Public game: https://www.pathfindr.world/arena/
- Exact stage: `/tmp/pathfindr-arena-controls-tIJsKK`
- Preview: `dpl_J74MEUF14R9wZb52fT3Uoy3HMHc8`
- Previous production: `dpl_8gTog7HcR5jtgqfeizAXHhfhXBMc` (main build .47).

Only seven files under public/arena changed: index.html, arena.css, core.js, keyboard.js, input.js, presentation.js, app.js. All 308 non-Arena source files were copied byte-for-byte from the verified current production source. Shared engine dependencies matched the tested worktree. Print storefront, builder, public assets and all API functions were retained; no database, payment, environment or Printshop changes.

## Verification

183 Node tests pass; whitespace checks clean. Interactive browser checks cover direct drawing, trace erasure/undo, actual A* comparison and score, player-colored markers, thinner archived trails, pause and latest build startup. The latest stock headless steering run stalled and was stopped; do not treat it as passing end-to-end assistance or physical-device performance testing. Dedicated keyboard tests cover continuity, bend lookahead, local fork tie-breaking, early-turn buffering, newest-key priority, reversal, release and pause. User feel testing remains important.

Preview: all seven Arena assets exact-match; authenticated main/fallback/Printshop/private-source checks pass. Public after release: all seven Arena assets exact-match, Classic root/immersive/manifest exact-match, all eight standard Printshop release checks pass.

## Rollback

First check no newer release needs preserving. To undo this release immediately:

```sh
vercel rollback https://pathfindralpha-bpiuvk7qb-pathfindr-apps-projects.vercel.app --yes --scope pathfindr-apps-projects
```

This restores the immediately preceding shared-site production, not a historical print baseline. Source before direct-controls work is protected at `codex/arena-before-direct-controls-20260907` (`460c168`).

## Scope limitations

Circuit remains a local one-human/three-bot prototype, not online multiplayer. Five fixed route pairs rotate exclusively; players can wait for an occupied remaining pair. Classic-style route effects reuse shared modules, but Arena's base rendering remains Canvas, not the full Classic WebGL terrain engine. Keyboard assistance uses local road identity/geometry, not automatic shortest-path solving.
