# Codex Summary (2026-02-03)

## Scope
This document summarizes the flow/state fixes applied after code review, for sharing with Claude Co-code.

## Files Touched
- `game.js`
- `dist/game.js` (rebuilt via `node scripts/build.js`)

## Summary of Fixes
1. Challenge timestamps now treat form input as local time before converting to ISO (removes forced UTC shift).
2. Road network loading now uses a request-id guard to prevent stale async results from overwriting current state.
3. Visualizer init now re-checks `visualizerState.active` and `gameMode` after async load before starting loops.
4. Visualizer loop now uses `loopRunning` to prevent re-entrancy, and pending timeouts are cleared on city change.
5. Continuous play now re-enters `GamePhase.PLAYING` after city swap (both preloaded and fetched paths).
6. Continuous play preload now uses a request-id guard and ignores late results after disable or new preload.

## Detailed Changes (by area)
- Challenge creation timestamps:
  - In `handleChallengeCreation`, timestamps are now built with local time strings (no trailing `Z`).
  - Location: `game.js` around the challenge creation handler.

- Road network loading:
  - Added `GameState.roadLoadRequestId` and a `requestId` param to `loadRoadNetwork`.
  - Added `isStale()` guard checks before applying data, before retries, and inside catch.
  - Location: `game.js` in `loadRoadNetwork`.

- Visualizer flow guards:
  - Added `visualizerState.loopRunning` to prevent overlapping loops.
  - Cleared `loopTimeout` before reloading a new city while visualizer is active.
  - After `loadRoadNetwork` resolves in `startVisualizerMode`, re-checks active and mode before entering IDLE/loop.
  - Location: `game.js` in `startVisualizerMode`, `runVisualizerLoop`, and `navigateToCity`.

- Continuous play phase consistency:
  - After transitioning to a new city, now calls `GameController.enterPhase(GamePhase.PLAYING)` once endpoints are ready.
  - Location: `game.js` in `transitionToNextCity` and `loadRoadNetworkForContinuous`.

- Continuous play preload safety:
  - Added `continuousPlay.preloadRequestId` and guard checks in `preloadNextCity`.
  - Incremented the request id on enable/disable to invalidate in-flight preloads.
  - Location: `game.js` in `preloadNextCity`, `enableContinuousPlay`, and `disableContinuousPlay`.

## Build
- Rebuilt `dist/` with:
  - `node scripts/build.js`

## Local Dev Server (for testing)
Use one of the following from the repo root:
1. `npx serve .`
2. `python3 -m http.server 8000`
3. `npm install -D serve` then `npm start`

