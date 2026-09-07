# Visualizer continuity and local multiplayer goal

Source: /Users/bradleyarakaki/.codex/attachments/4b9962c4-3dc7-4778-a95a-ea48df31e248/pasted-text-1.txt.
User clarified that these notes, not the later camera addendum, are the primary objective.

## Protected baseline and release order
- Baseline commit c4c220a, production .44 dpl_AAk8jKraGafbD89GKDmjz1hcox8Y.
- First branch codex/visualizer-continuity-20260907, separate worktree Pathfindr-visualizer-20260907.
- Commit and deploy the main Visualizer/fallback/camera changes first, preserving current Printshop source and functions byte-for-byte.
- Then create a separate bot/multiplayer branch from the verified main release. Keep experimental mode reversible and isolated from Classic.

## Acceptance checklist (unchecked means unfinished, not implicitly waived)
- [x] Visualizer always top-down, including intros/transitions/manual gestures. Session maxPitch lock in visualizer-camera.js; every director/transition uses pitch zero; camera tests and actual .45/.47 rendering verify it.
- [x] Subtle readable cartographic neon/LCD city-name treatment in quiet Visualizer UI; no font replacement or emoji. Actual .47 Washington identity/coordinates screenshot inspected; existing main typography preserved.
- [x] Expandable Visualizer places-visited travel log, informed by user's physical instrument-panel reference; actual watched cities and scan counts, compact by default, accessible on mobile. Verified desktop/390px, reload persistence, Escape, corrupt/blocked storage tests; not yet deployed.
- [x] Clear Play/Pause control and discoverable exit; pause/resume is correct across async transitions. .45 async gates before/after preparation and city transition; current .47 actual Pause/Play/Back to lobby verified, plus prior recorded reduced-motion/pause tests.
- [x] Continuous pleasing animation across route preparation, endpoint placement and city transitions; no blank waiting scene, robust to disconnect/rate limits/slow frames. One-job cooperative lookahead, overlapping markers/reveal, outgoing scene cover, complete fallback scene readiness and graph cancellation guards; .45 disconnected Boston-to-Paris handoff evidence in RELEASE-CONTINUITY.md. .47 fixes the subsequently discovered Boston regional-polygon crash and verifies gameplay after clipping. No universal physical-device FPS guarantee is claimed.
- [x] 30–50 distinct real OSM city fallback packs, validated connected playable networks; real scenery/labels where available, provenance/attribution and bounded asset sizes. 36 verified by fallback-cities.test.cjs; main .45 release includes all packs.
- [x] Fallback integration covers Classic, Explorer, Visualizer and challenge paths without silently substituting a different city for location-specific/shared/daily challenges. Four-mode exact-loader tests; actual Classic Boston/Portland, Explorer New Cairo, Visualizer Washington and earlier disconnected handoff. Shared loader pins pack/hash; unavailable ranked maps now fail before stale-node lookup, with actual clean-lobby failure UI verified. Exact challenges are not replaced by unrelated fallback routes.
- [x] Stronger mobile tap/trace head-follow near central padding, faster directional response, smooth damping; no route geometry changes or runaway dead-end panning. Actual 390×844 Washington tap grew route to 0.08km and centered at (195,424). Trace test found short-stroke follow had not settled on lift; 89cfc86 adds normal-release settling, verified actual 0.09km stroke/8 nodes ending at (195,424). Five adapter tests exercise real callbacks, including cancelled gestures, controls and disconnected-finger convergence; earlier pure-math tests cover 30/60/120Hz.
- [x] Main release tested and deployed; public game and Printshop checks pass; rollback baseline recorded. RELEASE-CONTINUITY.md records .45 and exact prior shared deployment.
- [x] Separate New Cairo bot-mode branch with a substantial real map area. codex/new-cairo-arena-20260907, created after main release; 32,587-node connected component.
- [x] Four-player local match (human plus three modest bots), five shared route objectives with distinct player starts and a defined fair scoring/win condition. arena/core.js, README and full human/bot course tests.
- [x] Collectible/currency-funded timed radius barriers, with endpoint protection and connectivity validation. Simulation tests and actual placed-barrier browser check.
- [x] Route-cut/reconnection ability with clear repair feedback and bounded disruption. Simulation repair tests and browser KITE cut/RECONNECT check.
- [x] Third paid ability: bounded-distance shortcut, explicit rules/cost and readable feedback. 220m/5-charge limit, simulation and actual mobile activation verified.
- [x] Match simulation/input commands separated from renderer; deterministic stepping, serializable state and transport boundary suitable for later authoritative online multiplayer (online service not required now). Snapshot/replay tests; local transport only, not a shipped online authority.
- [x] Playable bot build with controls/tutorial, restart, win/loss, mobile layout and inspected gameplay screenshots; systematic simulation and interaction tests. 10 arena tests; actual desktop/mobile controls, completed match and restart; inspected output/arena-checkpoint screenshot. No physical-iPad FPS claim.
- [x] Read-only database/schema/persistence audit against live game backend; verify route/score/collectible identity capture and document gaps without mutating Printshop or unapproved schema. docs/persistence-audit-20260907.md; missing route_issues RPC/table is documented, NOT silently fixed.
- [x] Concrete catalog of 100 achievements (brand visits, unique libraries and other meaningful exploration), with proposed stable keys, event requirements and thresholds; implementation in game optional per user. docs/achievement-catalog.md, exactly 100 unique keys.

## September 7 completion-audit status

152 tests pass. Main .45 source and deployment evidence re-read; all four prototype preview assets match source bytes. Remaining unchecked main-runtime requirements still need scope-matched verification, especially actual mobile tap/trace camera behavior and all-mode disconnected routing. A mobile Classic browser test loaded Washington with real scenery, then browser CDP commands timed out; that is not a passed camera test. Keep the goal active. The Places visited drawer is now live (the older 'not yet deployed' line above is superseded).

Follow-up: 157 tests now pass, and the camera interaction checks above supersede the earlier incomplete camera evidence. Normal US startup crashed the in-app page twice; controlled Washington startup with map APIs disconnected succeeds. Root cause remains unproven (live reserve/city-dependent startup versus host browser resource issue), so robustness/all-mode completion is still open. Stock headless diagnostic also hit navigation timeout; no headless success is claimed.

## Verification discipline
Test coherent implementation batches, then systematically verify every requirement. Unit tests alone do not establish UI quality or device FPS. Record actual screenshots, network failure simulations, city-pack validation and release checks. Do not mark the overarching goal complete after only the main release; bot mode, audit and achievement catalog remain in scope.

## Final acceptance — .47

All explicit brief deliverables are accounted for above and in RELEASE-CONTINUITY.md, RELEASE-ARENA.md, RELEASE-CAMERA-SETTLE.md and RELEASE-BOUNDED-SCENERY.md. The startup investigation found Boston's 421,074-coordinate Gulf of Maine relation; bounding before triangulation and preclipping packs resolved the reproduced crash. 169 tests pass; current production source and shared-site checks pass. The earlier open-crash and unfinished-runtime paragraphs are chronological notes superseded by the .47 evidence. Audit findings remain documented product follow-up work, not silently claimed repaired. The optional achievement implementation and eventual online service are not part of this delivered local-prototype brief.
