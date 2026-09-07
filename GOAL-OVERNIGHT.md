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
- [ ] 30–50 distinct real OSM city fallback packs, validated connected playable networks; real scenery/labels where available, provenance/attribution and bounded asset sizes.
- [ ] Fallback integration covers Classic, Explorer, Visualizer and challenge paths without silently substituting a different city for location-specific/shared/daily challenges.
- [ ] Stronger mobile tap/trace head-follow near central padding, faster directional response, smooth damping; no route geometry changes or runaway dead-end panning.
- [ ] Main release tested and deployed; public game and Printshop checks pass; rollback baseline recorded.
- [ ] Separate New Cairo bot-mode branch with a substantial real map area.
- [ ] Four-player local match (human plus three modest bots), five shared route objectives with distinct player starts and a defined fair scoring/win condition.
- [ ] Collectible/currency-funded timed radius barriers, with endpoint protection and connectivity validation.
- [ ] Route-cut/reconnection ability with clear repair feedback and bounded disruption.
- [ ] Third paid ability: bounded-distance shortcut, explicit rules/cost and readable feedback.
- [ ] Match simulation/input commands separated from renderer; deterministic stepping, serializable state and transport boundary suitable for later authoritative online multiplayer (online service not required now).
- [ ] Playable bot build with controls/tutorial, restart, win/loss, mobile layout and inspected gameplay screenshots; systematic simulation and interaction tests.
- [ ] Read-only database/schema/persistence audit against live game backend; verify route/score/collectible identity capture and document gaps without mutating Printshop or unapproved schema.
- [ ] Concrete catalog of 100 achievements (brand visits, unique libraries and other meaningful exploration), with proposed stable keys, event requirements and thresholds; implementation in game optional per user.

## Verification discipline
Test coherent implementation batches, then systematically verify every requirement. Unit tests alone do not establish UI quality or device FPS. Record actual screenshots, network failure simulations, city-pack validation and release checks. Do not mark the overarching goal complete after only the main release; bot mode, audit and achievement catalog remain in scope.
