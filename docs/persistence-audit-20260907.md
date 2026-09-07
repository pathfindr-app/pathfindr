# Game persistence audit — September 7, 2026

## Scope and method

Read-only queries through the authenticated Supabase SQL editor for project `wxlglepsypmpnupxexoc`. Inspected table columns, RLS policies, function presence and aggregate counts; no player names, IDs, emails or full private routes exported. No database rows, policies, migrations, payments or Printshop configuration changed. Unsaved query drafts were used; one malformed editor insertion produced a syntax error and was rerun in a clean draft.

Inspected client files were compared byte-for-byte with production: `auth.js`, `engine/collections.js`, `engine/route-archive.js`, `engine/share-data.js`, `engine/route-reports.js`, `engine/round-metrics.js` all matched. The main release at audit time is .45, deployment `dpl_Cx4CYnfmrzSPEpHH2WQgZfQyHwYW`.

## What is actually saved

| Live source | Count | Evidence / limitations |
|---|---:|---|
| `games` | 1,063 | 1,060 have a non-null/nonempty `user_path`. Columns include efficiency, city, center, zoom, round number, user and optimal paths. No dedicated collectible, timer or OSM-node-ID columns. Latest record: 2026-09-05 07:27:43 UTC. This timestamp alone does not prove a save regression; signed-out play does not call this save. |
| `replays` | 0 | Schema exists but no stored replay records. Do not advertise this table as an active replay archive. |
| `route_runs` | 4 | All have round payloads; 15 saved rounds total. Latest update: 2026-09-06 21:37:27 UTC. |
| Saved round collections | 4 rounds / 13 items | All 13 items contain `key`, `name`, `pos`, and canonical `type:node/ID`, `type:way/ID` or `type:relation/ID` keys. None contain a dedicated `brand`. |
| `route_shares` | 1 | Round payload present. Latest creation: 2026-09-06 18:08:43 UTC. |
| `challenge_entries` | 78 | All have non-null `path_data`. Zero entries currently identify score version 2; zero contain a nonempty `collectibles` array. Latest submission: 2026-09-06 17:47:54 UTC. Installed v2 RPCs do not establish that a new-version entry has been successfully saved by a real player. |
| `route_issues` | **Absent** | Not present in `public` table inventory. `report_route_issues` also absent from the inspected function inventory. |

Installed expected functions include `save_route_run`, `publish_route_share`, `submit_challenge_entry_v2`, and `get_challenge_leaderboard_v2`. RLS is enabled on all six existing inspected game tables (`games`, `replays`, `route_runs`, `route_shares`, `challenge_entries`, `user_achievements`).

## Findings

### 1. Bridge/automatic-finish reports are not reaching the intended server table

The live client queues up to 30 reports in localStorage and calls `report_route_issues`, retrying each minute and on reconnection. That RPC and table are missing. Failed calls leave the queue local; they are not a durable all-user server log. Trace-diagnostic samples are explicitly device-local/exportable and are a separate queue.

The repository contains migration 017, but its presence is not evidence of deployment. Applying it requires a scoped schema change and a review of anonymous ingestion, size limits, rate limits and retention. This audit did **not** apply it. The earlier phone report cannot be recovered from the server by this mechanism; it may still exist on that phone until local retention evicts it.

### 2. Route archives save actual collectible identities, but not a complete achievement ledger

The archive captures user/optimal coordinates, scores, distances, endpoints and collected items. Packaged maps include a graph hash; live-map snapshots retain coordinate arrays and indexed edges, but drop original OSM node IDs. Therefore an accurate lifetime/global “unique OSM nodes mapped” counter cannot be reconstructed reliably from every existing saved route.

Collection POIs initially contain OSM tags, including possible brand metadata. The collection claim and share validator keep only key/type/name/position/time. The live records confirm brand is absent. A McDonald's/Burger King achievement should not be inferred from arbitrary display-name substrings. Add normalized optional brand + source tags to accepted collection events, with canonical identity and city/country keys.

The lifetime collection panel is localStorage-based, not an account-wide server ledger. Logged-in route archives can contain collected items, but there is no dedicated deduplicated collection-event table being used here. Reconcile events by stable keys before offering cross-device progression.

### 3. Guest and failed-upload durability is limited

`submitScore` refuses signed-out saves. Route archives persist to IndexedDB for guests; an owner ID is attached at run creation or explicit pinning. Guest play is not automatically a server-backed anonymous collection history. Cloud-write errors retain the local copy but do not create a separately managed durable retry outbox. Signing in later does not, by itself, prove every earlier guest run was uploaded.

Recommended: an idempotent game event/outbox pipeline with explicit local/syncing/synced/error states, anonymous installation identity only where consent/privacy design permits, and account-merge deduplication. Never label local-only counts as community-wide verified totals.

### 4. Daily score storage exists; competitive integrity still needs work

The v2 submission and leaderboard RPCs are installed, but live data has no v2 entry yet. The client sends efficiency, elapsed time and collectible records. The checked implementation calculates weighted components from those submitted values; it does not reconstruct the route against an authoritative graph or validate each collectible's existence and availability.

Live policies allow authenticated players to INSERT their own `challenge_entries`, and an UPDATE-own-entry policy remains. That protects identity ownership, but is not proof that all score writes must pass the scoring RPC. Before serious competitive promotion: inspect table grants and enforce a single validated write path; pin challenge graph/POI versions; validate route continuity, endpoints, distances and collection IDs on a trusted service. This audit did not exploit writes or change permissions.

### 5. Ownership policies are present, not a blanket security certification

`games`: read-own and insert-own by `auth.uid() = user_id`.
`route_runs`: authenticated read-own and delete-own by owner ID; writes go through the cloud save function.
`route_shares`: authenticated read-own; guest retrieval uses share lookup RPC.
`challenge_entries`: publicly readable results, authenticated insert-own, update-own.

These observations do not validate every function body, grant, anonymous route or abuse limit. No claim of a complete security audit is made. Printshop tables and payment functions were outside this audit.

## Priority sequence

1. Review/apply the game-only diagnostic migration and confirm anonymous/paid/free report delivery with synthetic, clearly labeled fixtures and cleanup.
2. Preserve canonical OSM IDs and brand/city metadata in versioned route/collection records; add migration-free optional payload fields first where compatible.
3. Implement durable upload retry + account merge, with user-visible sync state.
4. Harden Daily submission on an authoritative graph before promising cheat-resistant ranks.
5. Enable achievements only when their required events are genuinely captured. See `achievement-catalog.md`; it defines exactly 100 proposed unlocks, not 100 already implemented features.

The local New Cairo prototype intentionally submits no scores, collections or matches to these production tables. Its future transport/authority plan is documented separately in `arena/README.md`.
