# Visualizer continuity and local multiplayer goal

Source: /Users/bradleyarakaki/.codex/attachments/4b9962c4-3dc7-4778-a95a-ea48df31e248/pasted-text-1.txt.
User clarified that these notes, not the later camera addendum, are the primary objective.

## Protected baseline and release order
- Baseline commit c4c220a, production .44 dpl_AAk8jKraGafbD89GKDmjz1hcox8Y.
- First branch codex/visualizer-continuity-20260907, separate worktree Pathfindr-visualizer-20260907.
- Commit and deploy the main Visualizer/fallback/camera changes first, preserving current Printshop source and functions byte-for-byte.
- Then create a separate bot/multiplayer branch from the verified main release. Keep experimental mode reversible and isolated from Classic.

## Acceptance checklist (unchecked means unfinished, not implicitly waived)
- [ ] Visualizer always top-down, including intros/transitions/manual gestures.
- [ ] Subtle readable cartographic neon/LCD city-name treatment in quiet Visualizer UI; no font replacement or emoji.
- [x] Expandable Visualizer places-visited travel log, informed by user's physical instrument-panel reference; actual watched cities and scan counts, compact by default, accessible on mobile. Verified desktop/390px, reload persistence, Escape, corrupt/blocked storage tests; not yet deployed.
- [ ] Clear Play/Pause control and discoverable exit; pause/resume is correct across async transitions.
- [ ] Continuous pleasing animation across route preparation, endpoint placement and city transitions; no blank waiting scene, robust to disconnect/rate limits/slow frames.
- [x] 30–50 distinct real OSM city fallback packs, validated connected playable networks; real scenery/labels where available, provenance/attribution and bounded asset sizes. 36 verified by fallback-cities.test.cjs; main .45 release includes all packs.
- [ ] Fallback integration covers Classic, Explorer, Visualizer and challenge paths without silently substituting a different city for location-specific/shared/daily challenges.
- [ ] Stronger mobile tap/trace head-follow near central padding, faster directional response, smooth damping; no route geometry changes or runaway dead-end panning.
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

## Verification discipline
Test coherent implementation batches, then systematically verify every requirement. Unit tests alone do not establish UI quality or device FPS. Record actual screenshots, network failure simulations, city-pack validation and release checks. Do not mark the overarching goal complete after only the main release; bot mode, audit and achievement catalog remain in scope.
