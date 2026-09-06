# Relaunch backend audit — 2026-09-06

## Verified live

- GitHub workflow `hourly-challenge.yml` was `disabled_inactivity`. Re-enabled the existing workflow and dispatched run `34033089970`; it succeeded. Public `get_active_challenges` returned Amsterdam challenge `840809ab-44ce-4f07-9ff4-6d1d5b6a0209` with its 36-hour window.
- Hosted-share lookup RPC `get_route_share` returns PGRST202 (not deployed). Migration 016 is source only; do not present hosted sharing as working until deployment and roundtrip verification.
- Public configuration contains the intended Supabase anonymous client key. No service-role credential is being added to the browser.

## Implemented in this branch, not deployed yet

- Generator authentication now fails closed when CRON_SECRET is unset.
- Challenge retrieval distinguishes service errors from an empty schedule.
- Game build excludes unrelated Print Studio source.

## Remaining release gates

- Apply approved sharing schema/functions with database access, then verify a guest/signed-in friend link on a separate browser profile. Never publish a fake short URL.
- Deploy generator auth fix. GitHub cron can be disabled again after inactivity; move scheduling to a managed database/platform cron or establish an operational alert. Re-enabling today is recovery, not a permanent infrastructure solution.
- Challenge scores are client-computed. Existing submission SQL relies on RLS for identity and does not independently recompute shortest paths. Do not market leaderboards as tamper-proof or attach prizes without authoritative validation.
- Validate live purchase/restore, OAuth redirect, and leaderboard writes with designated test accounts; no real purchase or customer-record mutation performed in this audit.
- Collection/coverage totals are device-local. They are not a server-verified currency or global OSM node count. Preserve honest labels.
- Supabase CLI project listing did not return within four minutes; terminated only those diagnostic processes. Deployment access remains unconfirmed.

## References

- [GitHub inactivity and workflow enablement](https://docs.github.com/en/actions/how-tos/manage-workflow-runs/disable-and-enable-workflows).
- [Supabase function privileges and search_path](https://supabase.com/docs/guides/database/functions).
- [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security).
