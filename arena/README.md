# New Cairo Circuit — local prototype

Separate branch: `codex/new-cairo-arena-20260907`, based on the verified .45 main release (`59e1a12`). No Classic, Printshop, payment or database logic is replaced. Serve the repository and open `/arena/`; the real New Cairo pack is fetched from the same origin, with no map API dependency.

## Play

Five fixed S → E pairs, four players initially assigned different pairs. Starting districts are at least 1.2 km apart; all four initial endpoints are distinct. Completing a pair earns its efficiency score, plays a 3.2-second actual A* comparison, and assigns an unfinished unoccupied pair at its own start. No fictional line joins separate pairs. Everyone completes the same five pairs in a different order. If all a player's remaining pairs are occupied, they wait for one to open; an idle human can therefore prevent bots completing that last pair until the eight-minute timeout. This is a local rules prototype, not a ranked fairness claim.

Tap and trace edit the path immediately: there is no speed-limited avatar or movement queue. Trace uses Classic's actual gesture lifecycle, backtracking, corridor guidance and edge-pan helpers. Retracing erases, Undo restores the last edit/stroke, including an erased stroke. WASD and arrows draw along adjacent streets in screen direction; reversing erases. Release stops drawing. Existing road edges are subdivided to at most 12 m for finger precision without adding bridge-crossing junctions. Individual tap connections remain capped at 950 m. Bots draw short connected sections with modest reaction delays rather than driving along a queued route.

Tap charge diamonds within 180 meters of your head, or use Collect nearby. Pickups and destinations grant two charge. Starting charge is three. Drag away from an active trace to pan; pinch, wheel or the zoom controls navigate. Focus frames your head and assigned end. Space pauses, F toggles fullscreen, Escape cancels ability targeting. Backgrounding the tab pauses the match.

- **Barrier / 3 charge:** a 100-meter radius closes intersecting road edges for ten seconds, affecting everyone. No placement within 280 meters of any destination or within 140 meters of a player. Every player's repair target and remaining checkpoint chain must remain reachable. At most three simultaneous barriers. Invalid placements cost nothing.
- **Cut / 4 charge:** target a rival with an exposed trail. Rewind a short section of their laid route and require reconnection to its former head. No finished-player or already-repairing target; completed repairs grant 12 seconds of protection. A cut without a valid repair path is rejected. This prototype disrupts the recently laid part of a route, not arbitrarily old archived legs.
- **Shortcut / 5 charge:** draw a direct connection to a playable street node within 220 meters. No crossing active barriers or bypassing a repair. Currency is spent only after validation.

First to finish all five wins; a 25-second grace window lets the rest finish. The match also ends at eight minutes. Standings sort by destinations completed, then finish time, then accumulated efficiency score. Each leg earns up to 1,000 route-efficiency points against its own optimal start-to-goal distance. Shortcuts cannot inflate that above 1,000. There are no online ranks, account requirements or persistence claims.

## Authority and transport boundary

Keyboard steering now follows gentle bends on the current road, buffers early turns within 600 ms / 65 screen pixels, and eases at junctions. A new direction overrides road following; releasing stops immediately. This is local intent assistance, not automatic shortest-path completion. See [keyboard UX rationale](../docs/circuit-input-ux.md) for research, heuristics and limitations.

`core.js` is a dependency-free deterministic authority using fixed 50 ms timer/bot ticks and synchronous local input dispatch. Original OSM node IDs remain intact; synthetic subdivision IDs name their original edge and never join geometric crossings. Distances use a local meter projection. Commands carry player ID and monotonically increasing sequence. Duplicate commands are ignored. The authority owns route edits, validation, resource spending, pickups, expiry, scoring and finish order. Renderer input is never trusted as route distance or earned currency. Snapshot rule version is 2; old vehicle-movement snapshots are incompatible.

`localTransport` is the replaceable client adapter. `app.js` translates gestures into commands and draws state; it does not set scores, positions or credits. Snapshot version, graph hash, PRNG state and simulation clock support deterministic restore/replay. Tests cover pause, replay, duplicate pickup commands, rejection without charges, barrier reachability/expiry, repair protection, shortcut limits and full bot matches.

For real online play:

1. Move the same authority behind an authenticated WebSocket room service; do not accept a client-supplied player ID. Bind connection to slot server-side.
2. Validate command shape, rate, ownership and increasing sequence on the server. Stamp authoritative ticks; cap per-tick work. Never accept client snapshots or self-reported charge/score as authority.
3. Broadcast compact snapshots at 10–20 Hz with acknowledged sequence. Interpolate remote positions around a 100 ms buffer; predict only local movement along an acknowledged route and reconcile corrections gently.
4. Use graph hash + rule version in the match handshake. Keep a bounded command journal, reconnect grace period and periodic snapshots. Resume transport sequence from the last acknowledged command.
5. Measure p95 round-trip latency, tick overruns, rejected inputs and reconciliation distance. Load-test rooms before matchmaking. Spectators must be read-only.

No network service is implemented or implied by this prototype. Local snapshot restore currently assumes a trusted snapshot produced by this authority; a future remote service must validate its persisted payloads. The browser pauses while hidden, so its clock is not suitable as a competitive server clock.

## Rendering and testing

One visible canvas, cached vector base layer, bounded pixel ratio and separate semantic HTML controls. Presentation reuses Classic's route cinema, motion preference, zoom-fidelity and search-cooling modules. Each player has a fixed color shared by its distinct head shape, S/E markers, laid path, actual A* expansion and optimal path. The five baseline A* results/expansion trees are prepared once and also used for scoring. Large expansion trees are sampled to at most about 3,000 rendered edges, without changing the underlying search or score. Cached Path2D batches and cached projected route points avoid rebuilding geometry while the camera is stationary. HUD updates read local state without serializing route archives ten times a second. This is still a Canvas presentation, not Classic's entire WebGL terrain renderer or a measured iPad FPS guarantee.

Reduced-motion suppresses pulsing/shake. Fonts use Classic's nonblocking web-font load; no external textures or icon requests. `render_game_to_text()` exposes play-relevant state; `advanceTime(ms)` supports the game-test client. Never deploy test output directories.

Run `node --test tests/arena.test.cjs` and the full `npm test`. Browser checks are required in addition to the simulation tests: a green rule test does not establish touch usability or measured device frame rate.

Map provenance and source timestamp are carried by `data/cities/fallback/new-cairo.json`, © OpenStreetMap contributors, ODbL 1.0. The playable component contains more than 32,000 real nodes.
