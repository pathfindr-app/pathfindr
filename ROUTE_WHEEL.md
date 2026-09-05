# Route wheel (.13)

Shared vanilla implementation; no framework dependency added. The design skill's isolated interaction, reduced-motion, contrast and transform-only guidance was applied to the existing stack.

Research:
- Venantes: https://www.wowinterface.com/downloads/info6155-Venantes.html — central sphere with surrounding controls; inspiration, not copied assets.
- Material: https://m2.material.io/components/buttons-floating-action-button — six-action maximum for a non-scrolling action menu.
- W3C: https://www.w3.org/WAI/WCAG21/Understanding/target-size.html — enhanced 44px target guidance. Our actions are 76×64px, with visible labels and stable positions.

Tap/Trace/Undo/Finish/Recenter/Settings expand above a centered thumb-reachable sphere. It is a disclosure containing native buttons, not an ARIA menu requiring menu-item semantics. Closed actions are inert. Escape restores focus, outside pointer closes without consuming map gestures, and mode selection closes the wheel. Settings remains a native dialog. Reduced motion disables transitions. The UI layer matches existing route controls (890), above map labels and below recap/dialog layers.

Targeting uses bounded screen-space pixels instead of a fixed meter radius. Route reach also increases when zoomed out, capped at four times difficulty distance; connectivity, routed-detour limits and tracing corridor checks remain. Head indicator uses the existing canvas animation loop, not an additional timer.

Finish requires a second press within five seconds. Confirmation follows the graph from the current tip, preserving the manual prefix. Disconnected tails are reported and never replaced with straight lines. Assisted rounds earn zero points, are excluded from round leaderboard/challenge submission, and carry an assisted flag in saved/exported results.

Diagnostics: only explicit confirmed finishes or disconnected-tail failures are queued. Reports contain build, game mode, city, input mode, zoom and map endpoint coordinates (not device GPS). No account identifiers, emails or full trails. Queue is capped at 30 and retries every minute or on reconnect, with UUID deduplication. Free/paid/guest all use the same path; Playables runtime upload is disabled when ytgame exists.

Backend prerequisite: apply ONLY `supabase/migrations/017_route_issues.sql` through the project's approved database workflow. Do not blindly push all pending migrations: 016 sharing is unrelated and still pending. The new inbox has RLS, no client read/direct-write grants, a bounded insert RPC, deduplication and a global intake budget. Validate anonymous and authenticated inserts and denied reads before claiming central logging is live. This migration has not been applied by this change.

Production is unchanged. Current published .12 remains recoverable via the deployment documented in ROLLBACK.md. New local build ID: pathfindr-route-wheel-20260904.13.
