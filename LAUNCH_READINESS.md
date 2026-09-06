# Pathfindr relaunch — 2026-09-06

## Protection and scope

- Original checkout and branch remain at `/Users/bradleyarakaki/Desktop/Pathfindr`, `codex/visual-city-v2`, HEAD `1e88ee91a7bc221b4dbe0beee3ae79fdb43c259d`.
- Isolated worktree: `/Users/bradleyarakaki/Desktop/Pathfindr-launch-20260906`, branch `codex/launch-readiness-20260906`.
- Full original-workspace archive: `/Users/bradleyarakaki/Desktop/Pathfindr-recovery/prelaunch-workspace-20260906.tar.gz`; `gzip -t` passes; SHA256 `975ed942466309ac85caf36b8b6e42d9d7917d49051bff88d0a181a6c54d3ec3`.
- Protected source snapshot commit on the new branch: `f287c87`.
- Live fallback: build `pathfindr-amber-instrument-20260905.36`, deployment `dpl_DcM4SSEVfk72qKFTjQxEDcU2fJMJ`.
- Production rollback: `vercel rollback https://pathfindralpha-o85tgg68x-pathfindr-apps-projects.vercel.app --scope pathfindr-apps-projects`.
- No destructive database changes, billing-price changes, or publication of unrelated Print Studio work.

## Work plan and acceptance checks

- [ ] Collectibles: distinct type identities, layered SFX, entry/claim animation, no collection in results or Visualizer; preserved saved progress and reduced-motion support.
- [x] Compact mobile amber HUD: 78px housing; browser checks at390px and320px. Physical-device validation still needed.
- [ ] Camera/input: earlier eased edge assistance with focus corridor; no camera changes to scoring/route geometry; touch/tap/backtrack tests.
- [x] Remove per-round route identity badges, retain animated paths and compact global legend.
- [ ] Water: coherent reflective neon surface without noisy repetition, quality-tier/performance checks.
- [ ] A* and audio: readable high-fidelity frontier/cooling, less CPU/overdraw, music-driven lingering paths without blown-out emission.
- [ ] Lobby: remove Miami/DC test shortcuts, finish Play/Atlas/Profile empty and error states; honest community progress.
- [ ] Onboarding: short interactive tutorial, replayable help, no mandatory login, safe first-game flow.
- [ ] Daily challenges: diagnose live service/cron/schema, deterministic valid routes, clear failures, submissions/leaderboard verification.
- [ ] Shared challenges: share/copy an actual URL, roundtrip replay of the same challenge, guest-friendly path and graceful network errors.
- [ ] Growth paywall: core play/onboarding/sharing frictionless; preserve existing paid purchases, clear premium value and restore flow.
- [ ] Backend: audit auth/RLS/RPC validation, CORS, public keys vs secrets, rate limits, score trust, retries and error states. Record deployed versus merely proposed fixes.
- [ ] Regression: desktop/mobile, account states, Classic/Visualizer/Explorer, full run and next city, tutorial, collections, sharing, daily, audio controls.
- [ ] Release: scoped artifact, tests, production verification and recovery instructions; disclose remaining launch blockers.

## Findings

- Daily entry point primarily queries hourly challenge RPC, then collapses service failures to empty list.
- Hosted share requires signed-in user and migration 016; fallback explicitly emits long portable codes. Current default is not the requested friend URL workflow.
- Hourly generator accepts requests without a cron secret when CRON_SECRET is absent (fail-open source configuration).

## Evidence and outcomes

Polish release .37 is live, not full relaunch sign-off.

- Build: `pathfindr-launch-polish-20260906.37`.
- Deployment: `dpl_3j8T1BxyZ8421M7qnAXAs7SWdASo`, https://pathfindralpha-d0cdfu4q4-pathfindr-apps-projects.vercel.app, aliased to https://www.pathfindr.world.
- All 17 changed/new public files verified byte-for-byte against the staged artifact.
- 112 game tests passed; staged actual A* reveal/recap and mobile tutorial/HUD/menu checks passed. Public production mobile-sized launch QA also passed with no page exceptions. Required stock browser client ran; screenshots inspected. Localhost-only CORS and optional analytics/resource diagnostics remain in stock logs.
- Daily generator recovered live: workflow34033089970 and new Amsterdam challenge confirmed by public RPC. Scheduler remains subject to GitHub inactivity; durable scheduling is a remaining infrastructure task.
- Shared links now prefer hosted storage and reject giant (>1500character) fallback URLs. Compact packed-map URLs still work. **Hosted sharing is not fixed live:** RPC/schema016 absent; database deployment access/approval required. No migration applied.
- Backend purchase/restore and authoritative score validation require further testing/access. See BACKEND_LAUNCH_AUDIT.md. No launch-ready or measured real-device FPS claim.
- Roll back production from this worktree with `npm run rollback`. Source before this pass remains untouched in the original checkout; source snapshot commit `f287c87` also retained.
