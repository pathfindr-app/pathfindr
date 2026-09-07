# Bounded scenery / challenge identity — .47

- Source: `7fb4457`, branch `codex/new-cairo-arena-20260907`.
- Build: `pathfindr-bounded-scenery-20260907.47`.
- Production: `dpl_8gTog7HcR5jtgqfeizAXHhfhXBMc`.
- Immutable URL: https://pathfindralpha-bpiuvk7qb-pathfindr-apps-projects.vercel.app
- Public: https://www.pathfindr.world ; isolated prototype: https://www.pathfindr.world/arena/
- Exact source stage: `/tmp/pathfindr-bounded-scenery-EMadYw`.
- Prior shared deployment: `dpl_HftYU5dtYSYEfFmEShwzcvM6mgr3`, exact stage `/tmp/pathfindr-camera-settle-afq8GE`.

## Cause and fix

Direct Boston installation reproduced the page stall/crash. Its Gulf of Maine relation contained 421,074 coordinates spanning longitude -71.06 to -65.62 and latitude 41.70 to 44.73. Whole-city surfaces totaled 437,119 points. The renderer triangulated the entire regional relation. D3 planar rectangle clipping now runs before triangulation, with tests for island holes and split concave exteriors. All 36 bundled packs are preprocessed to the playable road extent plus scenery margin. Boston now has 14,485 surface points and a 3,362,197-byte pack versus approximately 13.8 MB before. Every road hash is unchanged. Scene revision separately invalidates cached pack assets.

Live API scenery uses the same runtime clipping guard. No water flow direction is invented. This does not certify every arbitrary future OSM polygon or device frame rate.

Challenge loading now refuses a resolved-but-unsuccessful road request instead of touching the prior graph. Cancelled loads cannot disturb a newer session. Current-session failure clears the attempted challenge and uses normal exit cleanup, avoiding a bogus Resume Run.

## Verification

- 169 tests pass, including clipping topology, actual Boston pack, synthetic huge off-city ring, exact graph loading in all four modes, challenge cancellation/failure, mobile camera and arena rules.
- Actual 390×844 Boston: installation and gameplay succeed after the fix. Desktop zoom-out screenshot inspected: streets, buildings, parks, labels and Fort Point Channel water shader remain visible.
- Current-source normal Global selector starts New Cairo in Explorer. Current-source Visualizer starts Washington, displays city/coordinates, pauses, resumes and exits. Normal US selection afterward starts Portland without the earlier crash.
- Challenge failure UI inspected: Play lobby selected, correct unavailable-map message, active=false, started=false, no Resume Run. QA URLs hash local source files to avoid mixed cached revisions.
- Stock headless runner still timed out on navigation; it is not used as successful gameplay evidence. Browser checks above are the successful runtime evidence.
- Preview `dpl_DK6pUBCb2vfwRVteTS7XedUEsgwQ`: authenticated shared-game, packs, Printshop and private-file checks pass; exact Boston bytes verified. Standard preview checker encounters Vercel login.
- Production baseline revalidated before deploy. 266 unrelated source files retained byte-for-byte, including Circuit, Printshop and functions. Public post-deployment checks: eight Printshop checks pass, all four Circuit files match, main entry/game/world-data/world-renderer/fallback loader/config/build-info/manifest/Boston match the exact stage.
- No Printshop changes, payment toggles or database mutation.

## Rollback

Inspect current production first; do not discard a newer independent release.

```sh
vercel rollback https://pathfindralpha-7jvpyl4w9-pathfindr-apps-projects.vercel.app --yes --scope pathfindr-apps-projects
```

Then recheck public game and Printshop routes. This returns the immediately previous complete shared deployment.

## Scope boundaries

Fallback packs remove map-provider dependence for their maps, not internet dependence for every uncached asset. Exact ranked/shared challenges are never silently swapped to a different city; unavailable exact maps fail safely. The Cairo mode is local human-versus-bots, not online multiplayer. The read-only persistence audit documents missing diagnostics ingestion, brand metadata and competitive-validation gaps; it did not repair schema. The 100 achievements are proposals with event contracts, not implemented unlocks. Physical-iPad frame-rate certification was not performed.
