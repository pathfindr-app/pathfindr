# Route sharing — build .8

## What works locally

- Lobby: create a Miami named-place challenge, open a code/file/link, browse saved runs.
- Every scored round records coordinates for both routes, distances, score, difficulty, start/end, collectible placements and collected identities/coordinates/timestamps. A run contains up to five ordered rounds and their map snapshots.
- Save marks a run as a favorite. Round and whole-run exports are separate choices. IndexedDB is the guest/offline cache, not the intended sole backend.
- Public HTTPS builds can emit self-contained links. File/localhost builds show portable codes instead of unusable localhost links. Large live-map snapshots use file/code fallback until hosted sharing is activated.
- Friend attempts load the exact road snapshot or matching Miami road checksum, validate connectivity first, hide/remove the author's solution, do not submit ranked scores, and do not award lifetime collectibles repeatedly.
- Route previews are static vector comparisons, not recorded animation/video replays. Custom creation currently searches bundled Miami labels; other cities can be shared after playing a round.

## Supabase activation (not applied by this task)

The existing project is configured in config.js. Read-only REST checks returned PGRST205/404 for both new tables on September 4, 2026. Existing games/replays tables remain untouched.

1. Review and apply **only** `supabase/migrations/016_route_sharing.sql` in the project's SQL editor or established migration workflow. Do not blindly replay older migrations against production.
2. Verify with two test accounts and a guest: account B cannot read/update account A's private run; guest cannot enumerate either table; guest can resolve a published ID; revoked IDs return null; retries with the same request ID return the same share; challenge JSON contains no solution fields.
3. Test a signed-in private save on device A and retrieve on device B. Network/missing-schema failures currently surface in Saved routes; local records remain available. Use Save again to retry cloud sync after an outage.
4. Deploy the updated web build to the public HTTPS origin. `#share=<UUID>` links use that origin; local development shows a share ID usable through Open share.

Hosted publishing requires an existing authenticated account (not a paid account). Guest publishing is not enabled; add an abuse-controlled anonymous-auth flow separately if desired. Receiving/playing needs no account. SQL limits: 100 private runs/account, 20 shares/day, 500 shares/account, 4 MB payload ceiling. Existing signup abuse controls and production API rate limits still need launch review.

`route_runs` is owner-only via RLS. `route_shares` is immutable and unlisted: guest access is a lookup-only function, not table enumeration. Publishing is explicit and shows a precise-location privacy notice. Owner revocation RPC is present; a share-management UI is not yet implemented. Local data removal does not revoke a published share.

Sources used for access-rule design: https://supabase.com/docs/guides/database/postgres/row-level-security and https://supabase.com/docs/guides/database/functions . No service-role key is exposed to the browser. Imported scores are unverified and never confer ranked results.

## Verification

23 Node tests pass, including payload round trips, solution stripping, invalid imports, decompression limits, graph identity/connectivity, and multi-round archive behavior. Required Playwright client output/share-import-smoke shows the imported challenge dialog (only existing local resource404). In-app browser verified Miami named-place creation, export/import, an explicit two-round QA graph, pickup collection without lifetime increase, round recap, saving, both rounds finishing, whole-run results, and library persistence after reload.

Live SQL permissions, cross-device Supabase persistence, native share sheet, mobile layout, and production hosted links are not yet end-to-end verified. No database migration or web deployment was performed.
