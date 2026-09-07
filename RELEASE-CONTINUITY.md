# Visualizer continuity release — .45

- Source commit: `bce2434`, branch `codex/visualizer-continuity-20260907`.
- Build: `pathfindr-visualizer-continuity-20260907.45`.
- Production deployment: `dpl_Cx4CYnfmrzSPEpHH2WQgZfQyHwYW`.
- Production URL: https://www.pathfindr.world
- Immutable deployment: https://pathfindralpha-c9d3ryl3d-pathfindr-apps-projects.vercel.app
- Exact staged source: `/tmp/pathfindr-continuity-gEweRG`.
- Prior shared deployment: `dpl_AAk8jKraGafbD89GKDmjz1hcox8Y`, build .44.
- Prior exact source: `/tmp/pathfindr-lobby-perf-vh9Um2`.

Emergency rollback of this release, including its matching unchanged Printshop:

```sh
vercel rollback https://pathfindralpha-d93g2j64k-pathfindr-apps-projects.vercel.app --yes --scope pathfindr-apps-projects
```

Recheck current production before using this command later: it must not discard a newer independent release. Never substitute a historical Printshop-only baseline.

## Evidence

- 142 game tests pass, including 36-pack SHA256/node-connectivity/provenance validation and disconnected US/global startup.
- All packs contain real OSM data. New Cairo's largest connected component has 32,587 nodes. Catalog is 36 cities; each pack is below 20 MB. Only two starters are eagerly loaded; other packs are fetched on demand, with bounded in-memory retention. This is API-independent fallback, not a guarantee of cold-start access to every city without internet.
- In-app browser, map providers deliberately disconnected: Boston → Paris handoff reaches a new graph with matching labels/scenery and pitch zero. Completed scan log verified across cities and reloads. Drawer tested at desktop and 390×844; Escape closes it without leaving Visualizer.
- Preview `dpl_4jvEbmUhwgW3UbomoQniVp8P1ecH`: authenticated game, city assets, storefront, builder, CSS/JS, Maui asset, policies and private-server-file checks pass. Ordinary preview checker is blocked by Vercel login, not a missing storefront.
- Staging hashes verified against current production before copying; 256 unrelated source files preserved byte-for-byte. Printshop functions/configuration retained; no payments or database changes made.
- No measured real-iPad frame-rate claim. Stock headless client encountered localhost CORS and navigation/selector timeouts; successful UI evidence is the in-app browser, not those failed runs.

## Remaining overarching goal

Separate New Cairo four-player bot prototype, three abilities, architecture/interaction tests, read-only live persistence audit and 100-achievement catalog are not delivered by this release. Exact ranked challenges are intentionally never replaced by an unrelated fallback city. Additional all-mode and device-level checks remain tracked in GOAL-OVERNIGHT.md.
