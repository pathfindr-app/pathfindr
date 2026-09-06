# Pathfindr Architecture and Retention Audit

Date: 2026-07-31

## Executive summary

Pathfindr has a strong game concept and more product surface than the lobby initially reveals: multiple modes, daily and hourly challenges, replays, city leaderboards, achievements, profiles, and a custom WebGL map renderer. The main architectural risk is that nearly all expensive work still runs on the browser main thread inside one large global runtime.

The remembered future-route optimization is only partially present. The app can prefetch raw Overpass JSON for one future continuous-play city and cache raw challenge data, but it does not precompute the graph, endpoint pair, optimal route, or render buffers. Those costs are paid when the player needs them.

The highest-value sequence is:

1. Make loading, endpoint selection, and drawing responsive.
2. Make score and reward persistence server-authoritative and deterministic.
3. Repair stats and achievement progression.
4. Add a domain-specific collection loop: a Navigator Passport of city stamps.

## Critical findings

### P0: Public score and reward data is client-trusted

Several RLS policies allow unrestricted inserts with `WITH CHECK (true)`:

- `user_achievements` in `supabase/migrations/004_achievements.sql:50`
- `city_leaderboards` in `supabase/migrations/005_city_leaderboards.sql:30`
- `challenge_entries` in `supabase/migrations/007_challenges.sql:73`
- challenge creation in `supabase/migrations/011_challenge_alltime.sql:34`

This lets a modified client forge unlocks, identities, efficiency scores, paths, and potentially challenges. Advertising or a collectible economy would make this materially more attractive to abuse.

Recommendation: accept only authenticated ownership-scoped writes, move score validation and reward awarding into server-side RPCs or Edge Functions, and make completion writes idempotent by game/round/challenge ID. Treat the browser as an input collector, not the authority for progression.

### P0: Dense-map interaction can perform multiple full-graph searches per pointer event

The mouse and touch paths are unthrottled (`game.js:7369`, `game.js:7399`). Every movement can:

- scan all nodes (`game.js:11031`),
- scan all edges (`game.js:11058`),
- run one or two A* searches to construct a preview (`game.js:8365`), and
- repeat much of the work when the segment is committed.

This is the likely source of severe gameplay jank on dense cities and mobile hardware.

Recommendation: build a spatial index when the graph is processed, query only nearby nodes/edges, coalesce pointer events to one update per animation frame, skip work below a pixel-distance threshold, and cache preview paths by anchor/target. Move pathfinding into a Web Worker after establishing a serializable compact graph representation.

### P1: City loading is synchronous, broad, and opaque

`loadRoadNetwork` (`game.js:7448`) fetches a broad set of road classes from public Overpass endpoints. `processRoadData` (`game.js:7573`) then parses nodes and ways, computes every edge distance, analyzes connectivity, invalidates projection caches, and builds render buffers on the main thread.

In a live Hillsboro, Oregon run, city selection to graph-ready took about 12.8 seconds. Roughly 11.2 seconds elapsed after the city metadata returned. The resulting graph had 4,306 edges. The player only sees a generic loading state, and there are no phase timings or graph-size diagnostics.

Recommendation:

- Replace viewport-derived queries with a server-normalized city/region request and bounded graph budget.
- Cache compressed, processed graph artifacts by city + graph schema version.
- Split fetch, parse, normalize, connectivity, spatial index, and render-buffer generation into measured phases.
- Move parse/graph build into a Worker.
- Show honest loading phases and allow cancellation/retry.
- Prefer a controlled backend/cache over making every client depend directly on public Overpass availability.

### P1: Endpoint selection repeatedly runs A* on the main thread

`selectRandomEndpoints` (`game.js:7794`) samples up to three waves of 160 pairs, keeps 28 candidates, and runs full A* for route-shape evaluation. Its fallback can recompute A* for candidates already evaluated. `runAStar` (`game.js:9100`) allocates a heap, maps, set, and explored-order array on every call, even when callers only need the path geometry.

On the same 4,306-edge live graph, starting the game consumed about 313 ms synchronously. That is already a visible pause on desktop and will scale poorly with graph density and lower-end phones.

Recommendation: score cheap geometric/network proxies first, run a small bounded number of final path searches, reuse computed results, and add a pathfinding mode that does not collect visualization history. Generate the next round's endpoint/path candidate during the current round's idle time in a Worker.

### P1: The current preloading system is not route precomputation

`preloadNextCity` (`game.js:14612`) runs only after continuous play reaches round two. It fetches raw Overpass JSON for one randomly selected future city. Challenge preloading likewise stores raw responses. Graph construction, endpoint selection, optimal pathfinding, and WebGL buffer creation remain deferred.

The challenge cache also has timestamps that are not enforced as an eviction policy, so browsing can accumulate raw graph payloads.

Recommendation: use a small versioned artifact pipeline:

`raw response -> normalized compact graph -> spatial index -> render buffers -> endpoint/path candidates`

Persist the reusable normalized graph in IndexedDB, keep only the current and next city in memory, and precompute the next round immediately after the current round becomes interactive. Cancel or lower the priority of background work on user input.

## High-priority correctness and UX findings

### Active gameplay can begin with an endpoint off-screen

In the live desktop run, the start marker was above the viewport after the game began. The results surface, although not in its visible state, still occupied about 295 pixels below the map and escaped the intended viewport. The route therefore starts in a broken visual state even when pathfinding itself succeeds.

Recommendation: give the game viewport a stable clipped layout, remove hidden results from layout/interaction, call `map.resize()` after every panel transition, and fit endpoints only after layout settles. Add desktop and mobile assertions that both markers are inside the usable map rectangle.

### A second perpetual animation loop survives the lobby

The dashboard globe schedules its own continuous `requestAnimationFrame` loop in `index.html:1559` and `index.html:1565`. The game has a separate central controller loop. The dashboard loop is not clearly cancelled when the splash/lobby is hidden, so it can continue consuming CPU/GPU while the map is active.

Recommendation: give every animated surface explicit mount/unmount lifecycle methods and one owner. Pause lobby animation, facts tickers, and decorative work whenever the game is active or the document is hidden.

### Audio competes with city startup

Sound initialization fetches and decodes several large WAV files, including an approximately 7.3 MB scanning sound, while gameplay is initializing. The music directory is about 56 MB. This work can contend for bandwidth, memory, and decode time with graph loading.

Recommendation: use compressed web audio formats, load only the first small feedback sounds after user interaction, defer music until the map is interactive, and use an asset manifest with size budgets. Avoid eagerly decoding long ambience files.

### Cancellation and observability are incomplete

The central game controller exposes an abort controller, but road loading creates its own controller. Frame reporting counts cumulative overruns but does not identify duration, phase, graph size, or cause. There is no deterministic `render_game_to_text`/`advanceTime` hook and no automated gameplay test suite.

Recommendation: propagate one request/session cancellation token through fetch, worker, graph processing, and rendering. Record p50/p95 phase timings and graph sizes. Add a small performance harness for one sparse and one dense fixture city with budgets for load, pointer preview, round generation, and submit.

## Structural findings

- `game.js` is about 16,000 lines, `styles.css` about 10,000, and `index.html` about 2,100 with substantial inline application logic. Global `GameState` owns network, graph, map, rendering, modes, progression, and debugging.
- `CLAUDE.md` describes an older Leaflet-era architecture and substantially understates the code size. The live implementation is MapLibre plus custom WebGL.
- There is no bundling, typing, linting, or test script. Production loads multiple runtime CDNs, including `@capacitor/core@latest`, creating a nondeterministic web dependency.
- Build is mainly file copying, while the web host serves the repository root. This makes it easy for local and deployed artifacts to diverge.
- `CityFacts.TESTING_MODE` is enabled in production and triggers aggressive background lookup/logging.

Recommendation: do not begin with a wholesale rewrite. First extract pure modules around graph normalization, spatial indexing, pathfinding, session persistence, and reward calculation. Those boundaries can be covered with fixture tests and then moved into Workers without replacing the MapLibre/WebGL presentation layer.

## Retention audit

Pathfindr already has the pieces of a retention system, but they are disconnected:

- 27 achievement definitions
- daily and hourly challenges
- global and city leaderboards
- replay/ghost data
- profile totals and route history

The progression layer is currently unreliable:

- Achievement checks implement only rounds, games, cities, and best efficiency. Requirements for regions, streaks, distance, time-of-day, local play, speed, and rolling averages resolve to zero.
- `get_user_stats` hardcodes regions, streaks, and distance to zero in `supabase/migrations/008_user_stats_view.sql:51`.
- The profile downloads and parses every game and full `user_path` payload client-side to derive totals.
- Score submission is asynchronous, but achievement checks run immediately afterward without awaiting persistence (`game.js:10672`, `game.js:10725`). A newly completed round can therefore miss its unlock check.
- Achievements appear as transient toasts; there is no collection/progress screen or meaningful use for points.

### Recommended collection loop: Navigator Passport

The best fit is a city-stamp collection, not generic coins or loot.

1. Complete an expedition to earn that city's passport stamp.
2. Performance determines a visible stamp tier: bronze, silver, gold, or iridescent.
3. City stamps fill regional pages and sets, making the next destination obvious.
4. Daily and hourly challenges award featured stamp treatments or upgrade progress.
5. Route traits can add descriptive marks such as Grid Reader, River Crosser, or Coastal Navigator.
6. The profile globe becomes the collection map, with completed, discovered, and target cities.

This loop reinforces the actual fantasy of Pathfindr: learning cities and improving spatial judgment. It does not require power-selling or random rewards. Premium can add cosmetic passport themes, deeper route archives, and collection presentation without compromising competitive integrity.

### Minimal progression data model

- `expeditions`: one server-authoritative completion record with normalized city/region, mode, score inputs, and timestamps.
- `collectible_definitions`: stable stamp/set metadata, availability, art key, and rules version.
- `player_collectibles`: user, collectible, tier, source expedition, awarded timestamp; unique on user + collectible or source.
- `player_progress`: denormalized counters and streaks updated transactionally with expedition completion.
- `reward_events`: immutable idempotency ledger for audit and recovery.

One RPC should validate and commit the expedition, leaderboard entry, stat counters, achievements, and collectible award in a transaction. The response should contain every newly earned item so the client only presents results.

## Delivery sequence

### Phase 1: Stabilize and measure

- Fix game viewport/results layout and endpoint framing.
- Add phase timings and dense/sparse fixture benchmarks.
- Stop hidden animation loops and defer audio.
- Add ownership-safe RLS and server-authoritative score writes.

### Phase 2: Make routing scale

- Introduce a compact graph representation and spatial index.
- Coalesce pointer work and cache previews.
- Move graph processing/A* to a Worker.
- Cache normalized city artifacts in IndexedDB/backend storage.
- Precompute one next-round candidate and one next-city artifact under an explicit memory budget.

### Phase 3: Repair progression

- Normalize expedition/round data.
- Compute stats server-side and remove full-history profile scans.
- Make score, achievements, leaderboards, and rewards one transactional flow.
- Add an achievement/passport screen with visible progress.

### Phase 4: Launch the Passport loop

- Start with a small, art-manageable city stamp set.
- Tie daily play to collection progress, not punishment for missed days.
- Instrument first stamp, set progress, next-day return, challenge participation, and premium conversion.
- Expand regions and traits only after the core completion loop shows repeat engagement.

## Validation performed

- Static architecture, graph, rendering, persistence, achievement, challenge, payment, and asset review.
- Live production flow through splash, lobby, city selection, graph load, and game start.
- Console inspection during the tested path: no runtime errors were observed in that flow.
- Measured one live graph load and one endpoint-selection/start transition.
- The standalone Playwright harness timed out navigating to production; the in-app browser completed the same flow. A separate mobile viewport override did not apply, so mobile conclusions are based on shared runtime code and static responsive inspection rather than an independent mobile performance trace.
