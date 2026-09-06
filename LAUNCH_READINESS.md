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
- [ ] Compact mobile amber HUD: more visible map, accessible labels and finger targets, safe-area/landscape checks.
- [ ] Camera/input: earlier eased edge assistance with focus corridor; no camera changes to scoring/route geometry; touch/tap/backtrack tests.
- [ ] Remove per-round route identity badges, retain animated paths and compact global legend.
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

In progress. No launch-ready claim until the required flows are verified.
