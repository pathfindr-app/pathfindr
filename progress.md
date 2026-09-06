Original prompt: Critically inspect Pathfindr for architectural problems, with particular attention to performance, route precomputation/background work, and a collectible or long-term retention loop. Report findings and recommendations before implementation.

## Standing deployment preference

### Relaunch pass, 2026-09-06 (in progress, isolated worktree)
- Worktree `/Users/bradleyarakaki/Desktop/Pathfindr-launch-20260906`, branch `codex/launch-readiness-20260906`. Original checkout untouched; full recovery archive gzip-verified, baseline snapshot f287c87, production .36 rollback in LAUNCH_READINESS.md.
- Live challenge scheduler was disabled_inactivity. Enabled existing GitHub workflow and dispatched run34033089970: success; REST confirmed new Amsterdam challenge. Source generator auth now fails closed; not yet deployed.
- Compact78px amber mobile HUD, earlier eased edge zones, actual-HUD camera padding; removed repeated per-round You/A* tags while keeping animated paths/global legend.
- Collectibles reject results, retain Classic A* collection, distinct layered synth voices, 420ms claim animation and reduced-motion path. Tutorial is an isolated tap/trace/backtrack practice grid.
- Water uses more coherent waves/broader reflection lobes/less filament noise. History reuses one geometry batch across3strokes. Bundled audio skips redundant FFT readbacks. Musical branch gain has a visibility floor. A* frontier halos shrink to sharp nodes; premultiplied cooling corrected in both heat shaders.
- Removed lobby test-city shortcuts; retained city options and saved packs. Visualizer now free; Pro retains ad removal, Explorer and custom locations. Prices/paid entitlements unchanged. Print Studio excluded from game build and lobby release.
- Hosted share RPC is absent live (PGRST202). Client now tries hosted first and refuses giant fallback links (>1500chars); compact self-contained pack links still work. Scoped migration approval asked asynchronously; Supabase CLI access unresolved. This is NOT yet a completed short-link backend.
- 112 game tests pass. Browser launch-qa passes lobby/tutorial/mobile HUD/phase gate/menu; reveal-qa passes actual A* sequence and recap. Screenshots inspected. More coverage and deployment still needed; backend gaps documented in BACKEND_LAUNCH_AUDIT.md.

### Amber instrument HUD / clear menu navigation (.36)
- Published .36 to https://www.pathfindr.world; deployment dpl_DcM4SSEVfk72qKFTjQxEDcU2fJMJ, immutable URL https://pathfindralpha-o85tgg68x-pathfindr-apps-projects.vercel.app. Final full-suite rerun picked up concurrent Print Studio changes: 126/127 passed, one unrelated prints.test.cjs Hawaiian-diatrics/Maui attribution assertion (UH HMRG / PacIOOS). Print Studio is excluded from this release; do not change its work. Gameplay-only suite rerun separately.
- Staged browser QA passed 390px/320px and short landscape layouts, original text-to-LCD updates, Sound and Audio motion toggles, More controls, Resume/Escape, drawn-route leave protection before scoring, Keep playing returning directly to map with route intact, and confirmed score reset/lobby exit. No page exceptions; gameplay/menu screenshots inspected. Required stock client ran; existing localhost CORS/optional resource diagnostics only. Full suite 126 tests passed before final one-line Keep playing UX improvement; final suite rerun pending.
- Implemented approved reference as lightweight CSS casing/recessed amber LCD, no additional WebGL/Blender assets or animation loop. Mobile two-row header retains original live text for accessibility and adds aria-hidden seven-segment SVG readouts updated only on text mutations. Existing fonts, map/route rendering, Classic scoring and desktop header styling preserved.
- Replaced ambiguous instrument orbit in the options dialog with prominent Resume map, four primary controls, expandable More controls and pinned Back to lobby footer. Existing control nodes/listeners retained; sound-label observer repairs engine icon replacement. Native focus/Escape and reduced motion preserved. Classic drawn route or run score triggers inline Keep playing / Leave run confirmation; empty runs and noncompetitive modes exit directly through existing menu-exit handler.
- OS cleared previous /tmp release artifacts. Recovered all 113 .35 production files to output/releases/production35 and verified each against Vercel deployment content SHA1. Staged isolated release at output/releases/hardware36; seven scoped files added/changed, excluding unrelated Print Studio changes. .35 rollback recorded in ROLLBACK.md.

### Clean Visualizer + slightly closer orbit (.35)
- Published at www.pathfindr.world, deployment dpl_rpFNcx3XhBAY7nGUxnVpzaomfxR6, https://pathfindralpha-2lbt0kwl6-pathfindr-apps-projects.vercel.app. Two-route mobile-sized browser QA passed hidden pickups, Classic visibility restoration, endpoint framing, takeover/resume and mocked delayed handoff; no page exceptions. Stock client screenshot inspected, known localhost CORS/optional resource errors remain.
- Visualizer mode hides the pickup layer/discovery panel and rejects collection claims; skips per-pickup projection work while hidden. Classic (including its A* animation) and Explorer retain collections and saved progress. Geographic landmark models remain scenery.
- Orbit target moves from fitZoom−0.55 to fitZoom−0.35 (~15% larger map scale when endpoint guard allows). Endpoint safety margins, manual takeover and city handoff unchanged.
- 120 unit tests pass, including mode-specific claim prevention and Classic/Explorer preservation. Isolated release staged at /tmp/pathfindr-clean-viz-release.pFQvA1 from .34; only collections, camera, config, build metadata and index cache keys change. .34 rollback recorded; no migrations/Print Studio publication.

### Endpoint orbit and Visualizer handoff (.34)
- Published .34 at https://www.pathfindr.world, deployment dpl_FwhQ88pjbHehgeYDioRFSPQjufbk (https://pathfindralpha-1jdd7w3xj-pathfindr-apps-projects.vercel.app).
- Replaced frontier/head chase with a fixed endpoint composition, 550ms framing transition and gentle 1.5-degree/second orbit at 32-degree pitch. Screen-space projection guard zooms outward when endpoint markers would overlap viewport/HUD edges; no minimum zoom that crops long routes. Manual takeover/resume remains, and repeated follow calls for the same endpoints do not restart framing.
- Visualizer city load now retires the old director, stops map motion, enters LOADING, removes DOM markers and clears Miami maxBounds before jumping. First Visualizer boot also clears stale bounds/pitch/bearing. Async completion checks run ownership before hiding overlay.
- Release staged from .33 at /tmp/pathfindr-orbit-release.g6S1tf; only five scoped public files differ. Unrelated Print Studio changes excluded. .33 rollback command recorded in ROLLBACK.md. No migration or commit.
- 118 unit tests and syntax/whitespace checks pass. Mobile-sized browser QA passed two actual route animations with projected endpoint assertions, real wheel hold/resume, mode exit, and a delayed mocked city-load handoff (not a live external-city fetch). Gameplay and stock-client screenshots inspected; no gameplay page exceptions. Stock client retains existing localhost Supabase CORS/optional-resource console failures. No real-device FPS claim.

### Closer automatic Visualizer flight (.33)
- User wants a clearer automatic flyover, more zoomed in, cancelled by manual control. Director now frames route bounds rather than all explored branches, targets fitZoom+0.55 clamped 14.8–16.5, follows frontier/head with 72% focus influence, 1.6s position damping, 2.8s attitude damping, approximately 36-degree pitch and 12-degree slow sweeps. It intentionally trades whole-search visibility for a closer moving view.
- Wheel interrupts immediately alongside drag/zoom/rotation/pitch gestures. Manual hold persists across route/city disposal until Resume camera; fresh Visualizer mode entry starts automatic flight. Existing reduced-motion, hidden-tab, menu-open, load/exit guards remain. Classic camera/UI unchanged.
- 115 unit tests pass; new tests cover closer tracking, no phase snap, and manual hold across city disposal/new session. Staged two-route mobile-sized browser test passes with actual wheel takeover, Resume camera, mode exit, close zoom and pitch checks; screenshots inspected, no page exceptions. No measured real-device performance claim.
- Five scoped files staged from .32 in /tmp/pathfindr-flyover-release.ijxxaO; .32 rollback recorded. No Print Studio changes, migrations, or commits included. Deployment pending.
- .33 deployed to www.pathfindr.world: dpl_GxEaY2sj6MgyePKx2thgpc7WjhgJ, https://pathfindralpha-80mtkbpvd-pathfindr-apps-projects.vercel.app. All five changed public files byte-verified. Stock staged screenshot inspected; existing localhost CORS/optional-resource errors only.

### Night recap + facts (.32)
- User rejected the white recap, asked for less bulk and city facts, then requested the top bar be solid again. Returned mobile recap to navy with amber/cyan values, reduced score type/padding/gaps, retained >=44px controls, and suppressed redundant empty-discovery prose on mobile. Top bar is opaque #101c28, no blur.
- Restored asynchronous showFactInResults after ticker cleanup, retaining result-version guards against stale city responses. Local note is a quiet ruled section, not a nested card. Added a network-free Miami incorporation note, verified against https://wwwx.miamidade.gov/global/management/municipalities.page (pack previously returned no facts). Other cities retain their existing fact service/cache.
- 113 workspace tests pass, including offline Miami note and stale-city fact regressions. Staged mobile reveal/results browser check passes without page exceptions; dark recap, visible fact, solid header and unobstructed route endpoints inspected. Required stock client capture inspected; known localhost resource/CORS diagnostics remain. Five scoped release files staged in /tmp/pathfindr-summary-release.q8hDBK from .31; unrelated Print Studio work excluded. .31 rollback recorded. Publishing pending.
- .32 deployed to www.pathfindr.world: dpl_HJjNAtajNQgMx97oAPCFcGqdroDZ, https://pathfindralpha-7gtdx2yod-pathfindr-apps-projects.vercel.app. All five changed public files byte-verified against release artifact. No migrations or commits.

### Visualizer camera / mobile instruments / city handoff (.31)
- User requested gentle 3D Visualizer sweeps and frontier/route tracking; then mobile cartographic UI, subtle non-glass translucent top bar, fixing stuck 5/5 city changes and restoring A* speed. User explicitly rejected the initial rectangular field-controls design and chose extending the existing neon Route hub instead. That rejected menu was removed, replaced by instrument-menu.css with native-dialog focus/Escape and compact orbit controls.
- New visualizer-camera.js uses the existing game clock, 2.3-second exponential damping, a 20-node frontier average, 12% action-biased framing, approximately 24-degree pitch and slow six-degree bearing sweeps. Manual gestures pause until Resume camera; 3D toggle takes control, options dialog freezes movement, reduced motion/hidden page do not move; loading/mode exit remove listeners. No parallel camera RAF or per-node flyTo.
- Mobile top bar is 87% opaque without blur/refraction; marginal rules and original fonts retained. Results use a pale route-survey slip with dark readable labels and amber/cyan route-pattern samples. New menu extends the Route hub's cyan/coral outline rather than using a settings-card grid.
- Round-five transition is awaited under the round lock. Loading overlay appears before any reserve wait; ready roads are usable while optional scenery loads. Reserve wait capped at 12 seconds, failure returns saved result with Retry, cancellation invalidates late responses. Score/count committed only after preparation; map movement stopped before handoff. Added Back to lobby during preparation. Removed the extra 1.1 exploration-duration multiplier (pre-.29 A* speed).
- 109 workspace unit tests pass (includes concurrent unrelated tests). New camera and handoff unit tests cover damping, manual/reduced-motion/hidden/disabled states, held transition lock, ready roads, cancellation, and preserved results on failure. Browser camera two-run/hold/resume/exit checks pass; staged mobile handoff failure/retry/cancel and Classic fullscreen/touch erase/undo pass; pre-search reveal remains passing. Stock game screenshot inspected, known localhost optional-resource/backend CORS errors only. No real-device frame-rate claim.
- Isolated release /tmp/pathfindr-atlas-release.bDPCTA from .30, nine scoped public files changed/added. Print Studio work excluded; no migration or commit. .30 rollback saved in ROLLBACK.md. Final visual/menu verification and deployment pending.
- Final menu screenshot inspected after fixing inherited fullscreen-button stretching and compass icon; staged Classic fullscreen/touch erase/undo still pass. Stock staged capture inspected. Initial test-only handoff mock lacked warm(), corrected mock; final handoff failure/retry/cancel check passes without page exceptions. Deployment started.
- .31 live at https://www.pathfindr.world, deployment dpl_F7yGRcEYm3DxHTNqiZuBw5aU5Yy6 (https://pathfindralpha-pslox0lff-pathfindr-apps-projects.vercel.app). Nine changed/new public files byte-verified against staged release. User phone testing remains important; no actual-device performance claim.

### Guided trace .29 (in progress)
- User requests forgiving near-end auto-complete and protection against accidental intersection branches; also wider reveal opening and slightly slower A*. New trace-guide.js gates abrupt branch changes while lateral pointer drift is under 16px touch / 12px mouse relative to incoming road. Real turns unlock beyond threshold; ordinary gradual curves/backtracking remain. This prevents new junk branches, not retroactive score edits.
- Trace finish assist checks screen proximity (56px touch / 42px mouse), geographic distance <=60m, connected route <=80m and <=1.6x direct (18m minimum budget). Bounded Dijkstra visits <=160 nodes; never invents bridge/rail connections. Releases stroke on successful assist before pointer-up; exact route distance counts normally. Diagnostic finishAssisted recorded device-locally, no server/migration change.
- Reveal focus now fitZoom+0.25 (previous +0.85 to +1.4), final overview fitZoom-0.5; A* exploration duration +10%, final-route trace unchanged.
- Unit policy cases pass; actual mobile-sized browser trace using a real Miami edge auto-completes and reaches results while pointer is held. Stock client passed. Combined staged QA/deployment pending. Use .28 isolated stage as baseline, not main dist (.27) or unrelated Print Studio work.
- 99 workspace tests pass. Staged real-edge mouse + CDP touch completion pass, plus reveal camera QA at wider framing. Touch run exposed tiny (<7px) finish motions being skipped by jitter gate; allow bounded finish check through that gate and add regression test. New finish diagnostic confirmed for touch. Screenshot results and wider start/pullback inspected. Stage /tmp/pathfindr-trace-release.6geW3H differs from .28 only in eight approved trace/camera/version files. Publishing; .28 rollback recorded. No new server logging claim; diagnostics remain device-local.
- .29 deployed: `dpl_Eq8euitdYZuEfB7N6Lx8zyYQAkPC`, https://pathfindralpha-1wwkzu3k1-pathfindr-apps-projects.vercel.app, aliased www.pathfindr.world. No Print Studio edits/migrations/commits shipped. Latest release artifact is /tmp/pathfindr-trace-release.6geW3H; main dist remains .27.

### Endpoint camera .28
- User wants return to start at route completion, then slow zoom-out during reveal. Added reveal-camera.js: 650ms smooth return, continuous pullback using the search clock, bounds include user detours + optimal route, honors manual gesture interruption / round invalidation / reduced motion. Tilt eases to top-down for readability. Connected Classic/US/global submission and Explorer comparison; Visualizer unchanged.
- 93 workspace tests pass (includes concurrent unrelated Print Studio tests); new camera tests cover both stages, interruption, stale-round cancellation and reduced motion. Stock web-game client and adapted mobile reveal QA pass. Screenshots inspected start focus, full-route reveal and panel-safe results.
- Concurrent Print Studio changes found in index.html, build script and other files. Preserve them locally. Camera release staged from verified .27 dist plus only game.js, game-adapter.js, reveal-camera.js, config.js/build-info.json and camera script/cache changes to baseline index. Do NOT run build and publish unrelated Print Studio changes. Staging: /tmp/pathfindr-camera-release.Cs5wVa. .27 rollback recorded; deployment pending.
- .28 DEPLOYED: dpl_2i8nPin2jNRpUUBFAAaRDn3WGZQt, https://pathfindralpha-4frcophto-pathfindr-apps-projects.vercel.app, www.pathfindr.world. Staged mobile QA passed separately before release; directory diff confirmed exactly six camera-related files changed from .27. Main dist remains .27 intentionally; do not mistake it for latest production. No Print Studio changes shipped, no migrations or commits.

### Smooth city .27 (in progress)
- Current user requests: smooth Visualizer phases matching Classic; earlier eased trace/tap edge pan; quiet rooftop and façade materials; hide ambient street grid in tilted 3D. User rejected dense grid/window shader during iteration: removed all grid/hash window detail from final roof/facade fragments. No fonts/UI changed.
- Fix Visualizer missing live optimalPath assignment, theme-index change during commit, duplicate settling history draw, instantaneous road dim/restore and heat decay changes, screenshot overlays, three-second dead gap. History layers crossfade geographically, keep cyan animated dashes; live cooldown follows motion clock. Endpoint selection and A* use shared generators, Visualizer yields after 4ms batches and checks run/graph cancellation. Classic synchronous API preserved.
- Camera assistance bands scale to 27% of width / 25% usable height (caps 220px), smoothstep spatial gain, exponential acceleration/braking, smoothstep tap ease. Off-map/UI/mismatched-tip stops remain immediate for safety.
- Rooftops one batched GPU draw, façades one extra draw only when tilted. Shared MapLibre depth, height-cap support, city-disable guard. Ambient roads fade 3–25° pitch (GPU roads/glow and native streets); active route/algorithm overlays remain legible, not depth-occluded.
- 83 unit tests pass. Stock client completed; existing localhost Supabase CORS/optional endpoint errors remain, no new game exceptions. Classic QA passes 320/390/1100 recap layouts, menu/input modes, next round and hidden/tilted scenes. Flow QA still under verification; software WebGL timings are not real-device performance evidence. Production .26 rollback recorded; deployment pending.
- Final Flow QA passes three cycles, stable live palette across settling, restoring road opacity, exit cancellation, early tap camera nudge at x=300 on 390px viewport; roof/façade shader errors null, screenshots inspected after noise removal. Software renderer p50 ~317ms/p95 ~567ms (not mobile/GPU benchmark; no FPS improvement claim). Test runs use 2x replay speed for multi-cycle coverage; first 1x run exceeded 60-second multi-cycle timeout on software rendering. Added pitch-opacity regression. Deployment next.
- .27 shipped: 84 tests pass, build successful, deployment `dpl_8zsDu3tSmtgWTzQnpKF9Ai33xGFJ`, https://pathfindralpha-66mehgmk0-pathfindr-apps-projects.vercel.app, aliased https://www.pathfindr.world. No database migration, commit, or font/UI redesign. Mobile hardware frame profiling remains unverified.

### Top-down buildings / game chrome .26 (in progress)
- Remove window façade atlas and roof-cap batch, add stable teal/rose/plum/ink building tints + thin top-down footprint outlines (fade by 18° pitch so ground edges don't pretend to be roof outlines).
- New scoped game-chrome.css replaces mobile HUD card with an edge rail and results with a scorecard, preserving font settings, existing actions, and routes/collectibles data.
- User reports previous-city facts on next-city arrival. Found unguarded async ticker/transition responses and continuous-city path not restarting ticker. Add generation guards, immediate stale-text clearing, next-city ticker activation; regression tests pending.
- 80 tests pass including delayed ticker, stopped request, transition replacement and result-fact invalidation. Scorecard QA passed top-down style, 320/390/1100 results layouts, menu/input toggles, Next Round and tilted/hidden scenes; screenshot inspection led to fixing the QA fixture's omitted distance DOM update. Also reframe results on map resize for phone rotation. Final recheck/deployment pending.
- Final scorecard QA passes after resize handling, using original web fonts (not blocked). Screenshots inspected: both route endpoints remain above the mobile recap; fixture distance correctly shown after explicit DOM update. Score count-up is mid-animation in the earliest 320 screenshot, reaches final value later. Stock client attempted but hit known external startup timeout; adapted full gameplay client passed without page exceptions. Build succeeds; deploying .26.
- DEPLOYED .26: `dpl_66Z83bxhApWbYtH9aPaH5DAPNxR9`, https://pathfindralpha-j8gq50uqm-pathfindr-apps-projects.vercel.app, www.pathfindr.world. Seven changed production assets byte-verified against dist, 80 tests/build pass. .25 rollback saved. No font change, migrations or Git commit.

### Coordinate frame .25 (in progress)
- User likes hub vibe but wants aligned sides, stronger animation, geographic edge markings on web/mobile.
- Aligned hub border, bilateral opening sequence, bounded lock-on pulse and spring compass turn; reduced motion disables pseudo-element animation too.
- New shared SVG edge-coordinate frame samples actual MapLibre unproject coordinates. Screen-fixed ticks, not a north-up graticule. Updates only on dirty camera/resize/phase renders; pointer-transparent, hidden in lobby/loading, no network or RAF loop.
- Kept actual coral/cyan style and vanilla stack over generic design skill defaults. Preparing regression/mobile visual checks and standing production deployment.
- Completed: 76 tests/build pass. FRAME_QA adapted game client passes 1100/390/320 screenshots, actual coordinate values against map.unproject, pan/rotation changes, no idle updates, pointer transparency, reduced motion and menu hiding. Screenshots inspected; bottom readout adjusted clear of open wheel. Stock lobby client succeeded after startup retries; existing localhost CORS/404 remain.
- Deployed .25: dpl_FdHz3nuhDCswkX3x4PRtUJDwd4cc / https://pathfindralpha-93h3q2ydj-pathfindr-apps-projects.vercel.app, aliased www.pathfindr.world. All 9 changed public assets byte-verified. Rollback .24 recorded.
- User noticed font/UI differences in test screenshots. FRAME_QA deliberately aborts Google fonts and optional Capacitor download to avoid startup hangs; screenshot fallback typography was NOT a shipped design edit. Verified .24 main styles, lobby, mobile shell, city UI CSS and font URLs are IDENTICAL using authenticated Vercel curl. Unauthenticated old preview returns an HTML auth page with HTTP 200; /index.html redirects, so compare root / for fonts. No font edits in this turn.

### City instrument .24 (in progress)
- User requests cooler buildings/radial, no Street Sparks, collectible libraries, and correct US/global selection.
- Removed hard-coded Miami random-mode seed; v3 reserves ignore legacy packs. Consumed restored slots are cleared even when replacement is pending. Scenery failure retains selected-city roads.
- Libraries sourced from amenity=library in live queries and Miami pack, book SVG/chime/recap/share type. Historical spark claims retained; no new spark spawns including old challenges.
- Batched façade atlas + roof caps (low quality stays single plain extrusion); no per-building draw calls. Coral/cyan navigation wheel retains existing action listeners, hitboxes and confirmation safety.
- Final regression suite: 73 passing. Adapted skill client `output/instrument-qa.mjs` passes library hover/collection/recap, 390px/320px wheel fit, Tap/Trace, first Finish confirmation + Escape cancellation, quality/scene visibility, and actual exit/selector flow through Denver/Paris coordinate fixtures. Screenshots inspected; façade scale enlarged after first pass. No page exceptions or world shader errors.
- Stock skill client lobby screenshot inspected. Known localhost-only Supabase CORS / local resource 404 console errors remain; no server settings or migrations changed. Live-provider uptime is not established by geographic fixtures.
- Build succeeds. Production .24 deployed as `dpl_Ht98mX23ccjJKcNBWZa4294bEGEC`, https://pathfindralpha-2cg6qficf-pathfindr-apps-projects.vercel.app, aliased www.pathfindr.world. Both public-domain build IDs and all 13 changed shipped assets verified against local dist. .23 rollback documented in ROLLBACK.md. No Git commit or database migration.

### Neon water .23 implementation

DEPLOYED .23: `dpl_GkJeVj4aRcVYwC5NXGxfXeskLUgA`, https://pathfindralpha-g53bxxjj5-pathfindr-apps-projects.vercel.app, READY/aliased www.pathfindr.world. 69 tests/build pass. Retried final browser QA successfully in output/water-release-*.png: inspected mobile water, high/balanced/reduced-motion zoomout; no shader/page errors. Public build-info .23, index.html, world-renderer.js, Miami pack and coastal-water geometry byte-verified. .22 rollback preserved. No migrations or Git commit. Vercel skill used with established production CLI.

User requested more reflective/watery digital-neon water. Researched NVIDIA GPU Gems analytic wave normals/Fresnel and official OSM coastline orientation. Updated shared shader with broader domain-warped swells, decreasing fine-wave slopes, analytic cyan/coral environment-light reflections, pixel-footprint filtered specular glints and subdued emissive filaments. Stylized analytic environment, NOT reflections of actual buildings. No new reflection target/pass/texture. Balanced4waves/high6; reduced-motion uses existing frozen clock. No measured real-device FPS claim.

Visual QA discovered Miami Bay missing geometry altogether. Downloaded pinned OSM coastlines from Overpass Kumi (primary endpoint unreachable), added offline Shapely polygonization script and checked-in coastal-water geometry. Normal Node build includes geometry without Python or runtime requests. Bayfront/Brickell/Brickell Key land exclusion tests pass. ODbL/source timestamp retained. Shader upgrades apply shared across modes; coastline coverage fix only Miami. Roads hash remains unaffected. Bundled source is ~190KB, derived polygon424 exterior+52 island vertices.

69 unit tests passed. Stock game skill client + output/water-qa.mjs screenshots test desktop/mobile, pitched/top-down zoom-out, high/balanced, reduced motion; no shader/page errors. Before screenshot shows bay unshaded; coastal pass confirms coverage. Final polished shader QA before deployment. Vercel deployment skill uses existing production CLI; preserve .22 rollback. DC/live coastline coverage and device GPU profiling remain separate work.

User explicitly requested: "push to prod always please". For future completed and verified game changes, deploy to the existing Vercel production project by default, retain rollback, and verify public assets. This does not authorize unrelated database migrations or unfinished changes.

Production .22 deployed: `dpl_5tXpezyVVdxaS59pPDDSHsoMbTNy`, https://pathfindralpha-hp1a7jtx2-pathfindr-apps-projects.vercel.app, READY and aliased www.pathfindr.world. 67 tests/build/diff checks pass. Live build-info, index.html, game.js, edge-pan.js, trace-input.js, game-adapter.js, route-reports.js, route-cinema.js and city-ui.css byte-verified against dist. Previous .21 recorded in ROLLBACK.md. Vercel deployment skill used with established production CLI. No migrations or Git commit; diagnostics remain device-local.

## Trace assistance and moving route identities (.22 implementation)

Requests: continuous edge scrolling while tracing; gentle camera follow for taps; distinct constantly moving player/A* dash patterns; easier trace restart, focus halo and troubleshooting logs.

- engine/edge-pan.js: screen-space quadratic edge velocity, 64px band, 180px/s capped diagonal speed. Adapter reserves HUD/bottom control area, excludes UI targets, eases velocity over120ms, pans through map projection (pitch/bearing preserved), only while near route head. Samples routing every7px camera travel rather than every animation tick. Tap success nudges head to inset viewport, 220ms (instant reduced motion). No new road connectivity or route selection rules.
- Trace owns gesture after start, stops edge loop on release/cancel/second pointer/hidden/phase change. Nearby restarts within96px touch/64px mouse check reachable snapped road + corridor before capture, then reuse existing commit/microA* validation. Whole-stroke undo includes reconnect. Far gestures remain MapLibre pan. Warm focus halo shows pointer location without hiding street geometry.
- Warm player dash-dot [20,9,2,9] at34px/s; cyan A* short dash [8,10] at26px/s. Active player, optimal reveal, shared summary/history rendering and legend updated. Uses existing render clock, independent of music; reduced motion freezes offsets. Dimmed solid player inner glow to expose gaps.
- Diagnostic summaries: last30strokes, attempts/accept/reject, resume/interruption, last requested/head coordinates and pixel mismatch, city/build/zoom/pitch/viewport/input. Export from Graphics. LOCAL ONLY separate key pathfindr-trace-diagnostics-v1; no attempted unsupported RPC batches, no Supabase migration. Existing finish-auto reporting queue unchanged. This does not claim to solve all snapping divergence; logs support further tuning.
- 67 tests passed including edge velocities, animated/reduced dash patterns, nearby resume ownership and undo, and local diagnostic queue bounds/isolation. Adapted skill browser runs verified real Miami edge camera eastward movement and stopping after release, nearby restart, focus halo, persisted resume diagnostic, undo and round-results flow; no pageerrors. Screenshot inspection caught wide A* casing masking overlapping user route: narrowed to6px and widened player dash to9px summary/8px active. Final overlap QA in output/trace-overlap-verified. Result test injects a local route fixture, so displayed score/distance is not a scoring assertion. No deployment. DC still LIVE/not preloaded, global community ledger not implemented.

## Production .21 deployed and verified

User requested push to prod. Vercel existing authenticated project deployed dist after 63 passing tests/build/diff checks. Deployment `dpl_AqBaWaaLTjpN84DzKLrdsfv6NA3q`, https://pathfindralpha-kublhj20i-pathfindr-apps-projects.vercel.app, READY and aliased https://www.pathfindr.world. Public build-info .21, index.html, mapping-progress.js, route-archive.js, lobby.css, lobby.js and lobby-map.svg byte-match packaged files. Preserved website/cosmic sidepages and selective DC model assets. No database migrations or Git commit/push. Previous .19 recorded in ROLLBACK.md with one-command production rollback. Deployment skill used with established production CLI rather than unrelated claimable preview.

## Mapping mission and progress (.21 local implementation notes)

- Added explicit mission: Map the world, one smart route at a time; immediate objective: find the shortest route and build a personal atlas.
- engine/mapping-progress.js derives personal unique segment miles (Haversine), cities and completed rounds from saved result records. Undirected coordinate-pair deduplication at six decimals, run ID deduplication; assisted and malformed routes excluded. Milestones 10/25/50/100/250/500/1000 miles then thousand-mile steps. Not a world completion percentage, community counter, or OSM contribution. Segments with different subdivisions may overlap: this is route-segment coverage, not GIS union coverage.
- Archive localOnly listing avoids a cloud fetch just to paint the progress meter. Return-to-lobby refresh, storage-warning and empty states. No backend/schema changes. Local saved records only; logged-in visibility follows archive ownership. Clearing browser data removes unsynced records.
- 63 unit tests pass, including distance, reverse/repeat dedup, assisted exclusion, malformed data and milestone advancement. Browser fixture checks empty state, IndexedDB reload persistence and mobile/desktop rendering. Initial headless launch lacked GL flags; rerunning with the skill client's SwiftShader flags. No deployment.

## Night-atlas lobby redesign (.20 local, September 4)

Latest request: substantially redesign the web/mobile lobby around Pathfindr's own aesthetic, not a generic design-skill dashboard.

- Added isolated engine/lobby.css and engine/lobby.js: prominent Classic launch, direct Miami/DC launch, distinct accessible Play/Atlas/Profile tabs, keyboard navigation, and responsive 320px+ layout. Retained existing gameplay/auth/sharing handlers and guest/pro behavior.
- Added scripts/build-lobby-art.cjs to generate a 423KB Miami SVG from bundled OSM geometry plus two real connected street paths. This is illustrative artwork, not a scored route or live map. No new external map requests or WebGL context. Two tiny canvas lights are capped at 30fps / 1.5 DPR and stop offscreen, in inactive panels, hidden documents, or reduced motion. Existing Atlas globe also stops drawing outside Atlas.
- Lobby-first startup and background city warming are preserved. DC remains a LIVE map with bundled landmark models, not an offline DC city pack. Initial challenge badge now says CHECKING; unavailable auth reports unavailable instead of staying misleadingly LIVE.
- Design skill informed spacing, touch targets, focus, and motion/performance safeguards; user aesthetic overrides its generic one-accent/React direction. Existing vanilla architecture retained.
- Validation: 59 unit tests passed; build and diff checks passed. Stock web-game client plus adapted output/lobby-design-qa.mjs cover mobile/desktop, 320px overflow, tabs/keyboard, sign-in, saved routes, reduced motion, Miami play -> return to lobby, and DC play with all 10 models. Real cached OSM fixtures used for reliable DC requests. Known local production-backend CORS and Vercel analytics 404 remain; no new uncaught page errors in completed runs.
- Production remains .19. This .20 redesign has NOT been deployed; no database migration or Git commit made. Real-device QA and authenticated member account visual review still needed.

## Lobby-first startup (.19 verified, deployed)

Production READY: dpl_EfiF2rBVsBTjP5mTrxXRhHaXwduJ, https://pathfindralpha-qh4r9v7wb-pathfindr-apps-projects.vercel.app, aliased www.pathfindr.world. Public build-info verified.19 and game.js/mobile-ui.js/styles.css/index.html byte-match local. No Git commit/push or database migration performed. CLI existing authenticated project used rather than unrelated claimable preview. Previous .13 rollback remains available.

Final output/lobby-phase-fixed PASS: held Capacitor to prove lobby paints before runtime, deliberately blocked fonts/mapCSS, early Classic tap acknowledged/replayed; Miami playable, actual Menu > Back to lobby returns to MENU and screenshot shows lobby after1s. Screenshots inspected; no pageerrors;58tests/build/diff pass. Stock skillclient output/lobby-stock screenshot inspected. Earlier test direct showModeSelector failed; real mobilebutton also pointed to overflow toggle, fixed to menu-exit. Visual inspection then caught exitToMenu missing GameController MENU transition; fixed and verified .19. .17 and .18 intermediate releases reachedproduction; final.19 deployment pending. User explicitly asked production withDCselectable likeMiami. DCoption now says10collectible3Dlandmarks/live map. AlltenGLBs+fiveengine/loaderfiles production-byteverified in.17 (unchangedin.19). No Supabase migrations. Baseline production.13 retainedinROLLBACK.md.

User reports blank mobile startup while maps prepare. Identified HTML lobby hidden behind video until JS init/intro end, three blocking head SDK scripts, external map CSS and Google Fonts @import gating paint. Initial HTML now shows lobby, intro preload none/noautoplay, init preserves visible lobby, head SDKs moved below lobby preserving dependency order, external CSS/fonts nonblocking media swap. Tiny early click capture acknowledges/replays last lobby button after runtime listeners initialize. Background city warming unchanged. Testing held runtime + failed font/mapCSS on mobile, queued Classic selection, Miami play and return-to-lobby. No deployment.

## DC landmarks (.16 local, verified)

Final QA output/dc-polished PASS: all10 models loaded, no model/page errors; mobile Washington Monument and Lincoln screenshots inspected. Claimed Washington Monument during actual A* with unchanged route nodes; results retained named collection while architecture remained. Badge projected below footprint; procedural trees excluded.55 tests, build and diff check pass. DC QA uses downloaded real OSM roads/scene fixtures for repeatability after primary provider429. Earlier live attempt loaded10models but test missed delayed StartGame modal; fixed harness. Existing localhost Supabase CORS / missing reportRPC404 remain, no serverreport or specific phonebridge resolution claimed. No production deployment. Optional next QA: all10individual orientations, real-device performance and wider/offline DC pack (current live scene1.6km around center; Cathedral outside Mall viewport).

Integrated ten user/other-agent standalone GLBs with geographic registry, shared pinned GLTFLoader (existing global THREE), two concurrent decodes, ten-template session cache, stale scene ownership checks, zoom reveal, OSM duplicate-building suppression, and named collectible badges. Shared city-scene hook covers live/pack loads, starts models before optional environment fetch. Selective build includes only standalone meshes, not source photos/Blender/ZIP/dioramas.54 unit tests pass; initial build passes; stock skill client dc-smoke screenshot inspected. Actual DC gameplay QA running. Still no deployment or server migration. Finish reports remain phone-side until inbox017 enabled, specific bridge not retrievable here.

## A* collectibles (.15 local)

Final history QA PASS: output/history-final round2 retained1prior round, real soundtrack historyDrive~.202 in sampled quiet passage; audio-off restored0. Live/off screenshots inspected, no pageerrors.51tests/finalbuild/diff pass. No realdevice performance or flash certification claimed. Production/server unchanged.

User clarified musical emphasis should be PREVIOUS rounds' lingering animations. Added bass/onset-driven history gain with sqrt(roundCount) attenuation and lower gain during active A*. History route halos wider/brighter and packets2× (capped), predecessor-tree revealed segments retained across rounds for continued charge propagation, shared~144historical-network segment budget. Explorer routes get same gain/charges. Same-map shared challenges previously cleared RoundHistory everyround; now only clear initial/differentmap. Tests51pass; first historyQA used prior loaded script and failed on missing history; rerun output/history-final uses fixed script. Required stockclient output/history-smoke ran and screenshot inspected. Changes still LOCAL, production.13 unchanged. Pending serverreport task requires Supabase inbox017 enabling/access; don't claim future uploads are working yet.

Fixed both collections visibility and claim phase gates to include visualizing; loading remains blocked, duplicates rejected.50tests pass. Required stock client output/collection-smoke run; adapted output/collection-qa.mjs completed realBrickellBridge A* pickup tap, verified unchanged route node count, pickup present in recap. Gameplay+recap screenshots inspected output/collection-verified, no pageerrors (known local backend errors remain). Includes pending .14 audio changes; NOT deployed. User's second bridge report was on PHONE and they accept not retrieving it now. They now want future reports onserver. Existing queue retains30reports with coords/build/time; RPC report_route_issues remains missing until migration017 applied. No server change made; SupabaseCLI unavailable, no configured Supabase connector found. Need authorized Supabase access/setup to enable ONLY017, not unrelated016. Do not imply report delivery verified. User's specific bridge remains undiagnosed without its payload.

## Musical routes (.14 local)

Final QA PASS: output/music-final completed tap/undo/finish, actual atlas playback charges, nonempty tree, Audio motion off/on, and reducedmotion clear. Final screenshot inspected; no pageerrors.49tests and finalbuild/diff checks pass. Local only, no deployment/migration. Longer complex-network visual tuning and real-device flash/frame-time profiling remain useful next checks.

User approved researched proposal for soundtrack-driven route charges, cooling and explored-network propagation. Used develop-web-game skill; preserved unrelated assets/audio deletion/node_modules/native changes. No SQL or production deployment. Prior published build .13 remains unchanged.

Added scripts/analyze-soundtrack.py (ffmpeg+NumPy), generated755KiB atlas for12Music tracks with SHA256 provenance,21.5Hz interpolated bass/mid/high envelopes and positive log-spectral flux peaks spaced >=380ms. Runtime uses actual audio.currentTime; unknown music uses live2048FFT flux fallback. Source track/seeks reset event cursor; mute/off/hidden/reduced-motion clear bounded8charge queue. Atlas loaded locally before audio module. Research and exact mathematical/implementation limits in MUSICAL_ROUTES.md. npm run analyze:music regenerates;49tests validate track hashes, spacing, arc length, decay, tree branching, mute/seek/reducedmotion and prior game regressions.

engine/musical-routes.js adds distance-based layered residue/body/filament and attached transient sparks. Active drawing focuses final35%; summary/reveal charge entire route. Removed random usertrail wobble/timer-driven summary dots so geometry stays stable. Bounded20metric caches; no new render loops/GL context/per-node timers. A* predecessor maps are stored in WeakMap and visual tree prepared peranimation, branch amplitude divided sqrt(children), graph-distance arrival/cooling masked to revealed edges,360rendersegment cap. Actual extras are Canvas strokes, not new HDR meshes; don't claim Blender fidelity/FPS or certified flash safety.

Required stock skill client ran output/music-smoke; lobby screenshot/state inspected. Adapted same client output/music-qa.mjs uses realBrickellBridge with existing tap/undo/assisted-result flow, captures actual soundtrack events over4frames, tests off/on/reducedmotion and reports nonempty predecessor tree. output/music-verified images/state inspected: source soundtrack,6–8packets,tree5edges. Reducedmotion500ms check initially failed under slowsoftwareWebGL; added immediate mediachange handler and state-based wait, rerunning output/music-final. Known localhost SupabaseCORS/analytics/diagnosticRPC failures, not new backend setup. No physical-device benchmark.

## Route wheel / trail head / assisted finishes (.13, local only)

PUBLISHED on user's explicit request, with Supabase migration explicitly deferred. Release commit1e88ee9, production READY dpl_6LohRHoWt2pT8d8MLyAZ4k4qq6eV, https://pathfindralpha-3j28dnpos-pathfindr-apps-projects.vercel.app aliased www.pathfindr.world.45tests/build pass. Existing ancillary website/cosmic/stream assets preserved. No migrations applied, no Git push/native sync. .12 production rollback target saved in ROLLBACK.md. Diagnostics remain queued on missing RPC failures.

Final responsive QA completed: output/wheel-responsive desktop1280 and narrow320 reduced-motion screenshots inspected; controls fit, label layering correct, assisted results reached; no pageerrors. Final build/diff checks pass. Production and database unchanged.

User requested visible animated head, zoom-scaled targeting, Venantes-inspired radial controls, two-tap auto-finish and anonymous issue logging. Read design-taste-frontend and develop-web-game completely. Research verified Venantes, Material's six-action guidance and W3C 44px enhanced touch targets; sources/design/backend notes in ROUTE_WHEEL.md. Kept vanilla stack, isolated wheel module, transform/opacity transitions and reduced motion. Original controls retain listeners; settings dialog works on all widths. Wheel z890 matches existing control layer after screenshot exposed labels drawing above it.

Head renders in existing draw loop. Snap hit area is screen-space, larger for coarse pointers/zoom-out; route reach grows to a capped4× difficulty limit, all connectivity/trace-corridor checks retained. Two-tap5sec Finish keeps manual prefix, computes graph tail and submits an assisted zero-point unranked round. Missing tail reports failure without fake connection. Assisted flag persists/exported; ranked round/challenge calls skipped.

Private diagnostic queue bounded30, no account/email/GPS/fulltrail; guest/free/paid same RPC path, failed requests retained and UUID retries deduplicated. Supabase migration017 is prepared but NOT APPLIED: central logging not active until approved backend setup. Do not apply unrelated pending016 blindly. Runtime upload disabled with ytgame. No production deployment or Git commit this turn; .12 still live.

45 tests pass; npm build and syntax/diff checks pass. Required stock skill client output/wheel-smoke ran and lobby screenshot/state/errors inspected. Adapted same client output/wheel-qa.mjs tests real bundled BrickellBridge: tap advances, wheelUndo reduces path, mode selection, Escape disarms, firstFinish tap does not finish, second completes to zero-point assisted results. Screenshots inspected output/wheel-final (head/open) and wheel-qa(results), wheel-verified(confirm). Known local CORS/analytics404 and missing diagnosticsRPC; no pageerror in completed run. Responsive/reduced-motion screenshot test output/wheel-responsive pending at this entry. Headless software WebGL timing is NOT real-device performance evidence. Preserve unrelated new assets/, audio deletion, node_modules lock, ios and audit files.

## Mobile interface + bridge input (.12)

PUBLISHED: Vercel READY dpl_DejfKgXbG8Np9RwXiCdYPoj4ETNB, https://pathfindralpha-ky08x2omu-pathfindr-apps-projects.vercel.app, aliased www.pathfindr.world. Live build-info reports pathfindr-mobile-roads-20260904.12; mobile CSS/JS, route-input and game assets returned200. Rollback to .11 retained.

- Design skill guided restrained map-first mobile shell: 74px header, bottom four-control dock, native accessible settings dialog reparenting existing controls (listeners/state preserved), smaller pickups, quieter history, restyled recap and camera padding. Existing vanilla stack retained; no framework dependency added. Desktop controls restore when viewport widens; reduced motion remains supported.
- Found reproducible real Brickell Avenue Bridge trace failure: map label span intercepted pointerdown at start marker. Playing-phase labels now pass pointer input to the map (hover remains outside playing, keyboard focus retained). Candidate selection considers up to8 edges plus nearest node and rejects unrouteable/excessive-detour targets. Road continuity capped to a tie-breaker; preview A* search bounded by permitted segment distance. Removed disconnected straight-line fallback. Gameplay remains bidirectional geometry-based; no misleading one-way arrows added.
- Miami build preserved bridge/tunnel/layer metadata and aligned live/bundled road classes including motorway and links; now14619nodes/3470ways. Road cache dataVersion2 invalidates older missing-highway caches. Pack checksum changes intentionally: older frozen Miami challenges may require recreating, never silently substitute a different graph.
- 42 tests pass with regressions for stacked-road snap, gesture corridor, continuity, no fake connections, pack metadata/classes and label hit testing. Build/syntax/diff checks passed. Required skill client mobile-refresh-smoke produced lobby screenshot/state/errors inspected (intro interception prevented Classic click). Adapted copy of that client with390x844 phone emulation in output/mobile-qa.mjs verified Miami map/settings/trace screenshots,4000buildings/247labels/61surfaces; known localhost Supabase CORS/analytics404 only, no pageerror. Real bridge fixture first reproduced0progress then after label fix traced19nodes/0.14km before release and reachedresults at874score. Screenshots inspected output/mobile-bridge-fixed. Final touch tap/undo test pending. No real-device FPS claim; headless software WebGL slow. User's exact screenshot endpoints unknown; not every interchange exhaustively exercised.

Final mobile QA: output/mobile-bridge-release inspected .12 screenshots/state/errors. Touch tap progressed0.0703km, Undo restored0, Clear completed, pointer trace traversed0.1407km/19nodes then released into results (874score); no pageerror. Test-script prior exact accessible-name mismatch corrected to Clear route. Headless trace uses mouse pointer under phone emulation; real physical touch stroke still needs device validation. Release commit2581507. Production .12 pending at this log entry. Rollback to .11 recorded in ROLLBACK.md. No SQL migration, native sync or Git push.

## Production deployment attempt

SUCCESS after user supplied their verified GitHub email pathfindr.game@gmail.com: configured repo-local identity (global unchanged), created release commit cd4c706 without rewriting history or pushing Git. Deployment dpl_7t3fvhzFgBcPyqfCZjfyuCUegZpf is READY and aliased to www.pathfindr.world. URL https://pathfindralpha-nk4r7i2pl-pathfindr-apps-projects.vercel.app. Live HTTP checks returned200 for root, build-info(.11), city-scene/world-renderer/lobby-preload, Miami pack, auth-callback, ads.txt and privacy. Mobile rendering/performance is for user's device test; no claim of measured FPS. Previous production rollback recorded in ROLLBACK.md remains available. No database migration applied. Existing audio deletion, node_modules lock and native files remain uncommitted.

- User authorized production publication and completed Vercel login. Existing target verified: pathfindr-apps-projects/pathfindralpha, production www.pathfindr.world. 36 tests and build passed. Deployed built dist with existing website, cosmic, stream HTML, ads.txt and vercel routing preserved; no environment files, native folders, tests or SQL migrations uploaded.
- Attempt dpl_42dnQzMxJwPTqJHKQM7dnASnp5X3 / https://pathfindralpha-55zrrkgnn-pathfindr-apps-projects.vercel.app was BLOCKED, not live. API readyStateReason: commit author lacks deployment permission; seatBlock TEAM_ACCESS_REQUIRED. CLI52 displayed UNKNOWN and kept waiting. Do not bypass attribution/team permission checks. User must resolve team access in Vercel before retry.
- Previous production dpl_4QUi8v4t37MoKDcKvoJX7w1gDSiX remains live. Production rollback URL/command recorded in ROLLBACK.md. www.pathfindr.world/build-info.json still404, confirming .11 not published. No Git commit/push or database migration performed.

## Complete city reserves (.11)

Final verification: 36 tests, production build, JavaScript syntax and diff checks passed. Final browser client navigation timed out (no final artifacts); earlier complete-reserve-smoke artifacts were inspected. Do not claim all-mode visual QA complete.

- US/Global reserves no longer expire after five minutes. Consumption immediately starts replacement, with a visible-page 30s maintenance tick for failed requests. Bundled Miami provides a complete cold-start fallback for either geographic pool; this can repeat when downloads are slow. Fresh random cities replace it only after both roads and scene preparation succeed. No promise that every rapid click yields a distinct city.
- Persist complete reserves (roads, city identity, buildings, labels, world geometry) through existing IndexedDB road cache using v2 keys; v1 road-only reserves ignored. Restore primes scene cache at handoff, including after in-memory eviction. Cache remains bounded. Network failure never replaces a complete reserve with road-only data.
- Shared City.prepare retries another Overpass server. Shared City.load shows street labels extracted from road data while live details load/fail. This applies to Classic/Global, Explorer/custom locations, and Visualizer; ordinary Visualizer now takes complete reserves through a WeakMap handoff. Stream overrides keep their explicit location behavior. Continuous Classic transitions use complete reserves when the older next-city preload has no ready scenery. Custom/GPS/stream first visits still depend on live data; no universal offline-city claim.
- Tests cover reserve refill, immediate seed under slow network, persistence, detail failure, server retry, restored scene reuse and source-level mode integration. Prior intermediate 35 tests/build passed; final verification pending below. Required client complete-reserve-smoke lobby screenshot/state/errors inspected: US complete Miami fallback, Global ready Shibuya, existing localhost Supabase CORS/resource404. Later required complete-reserve-final capture pending. In-app Global reached Istanbul but scene completeness not confirmed; possible mixed cached scripts/user interaction. Added changed-script query versions. Direct file URL browser testing blocked by browser policy, not bypassed. Full Explorer/Visualizer visual verification and device latency/FPS remain unverified. Recovery baseline unchanged.

## Search recap afterglow (.10)

- RESULTS now retains the live search renderer instead of switching to ambient-only history. Shared wall-clock cooling keeps 97%+ energy through the 120ms handoff, then decays toward a 22% gain floor. Removed the dark recap backdrop and duplicate current-round history drawing. Canvas fallback decay is elapsed-time based; shimmer no longer samples random brightness each frame.
- Added up to 24 fading light packets along explored edges, using existing sprites and the existing frame loop. No radial shockwaves or extra animation loop. Reduced motion disables packets. Next-round cleanup clears live heat and packet references; autonomous visualizer behavior stays separate.
- 31 tests passed, including cooling continuity, frame independence, bounded packets and renderer/cleanup contracts. Build, syntax and diff checks passed. In-app synthetic 6x6 Cooling QA challenge completed at 1000/100%; inspected recap screenshot with explored side streets still glowing under labeled final routes. Later screenshot was back in lobby (possible user interaction); long-duration and real-device performance are not exhaustively verified.
- Required client artifacts in output/search-cooling-smoke inspected: challenge modal screenshot, menu text state, existing local resource404/Supabase CORS errors. Its challenge-start selector timed out; do not claim automated gameplay pass. No measured FPS claim, deploy, database migration or baseline replacement.

## First-city lobby preparation (.9)

Verification update: requiredheadlessclientattemptfailedatscreenshotwith30stimeout; noartifactsproduced. In-appDenvergameplayscreenshotwasinspected. Do notclaimautomatedbrowserpassorquantifiedlatencyimprovement.

- Lobby warms separate US/Global first-city slots after400ms, reuses in-flight/ready work when selected, retains unusedslot5min, replenishes consumedslot onnextlobbyvisit. Roads useIndexedDB first then20s boundedrequest; CityDBselection8s timeoutfallback. Optional citydetails conversion/cache startsafterroads and doesnotgatehandoff. Hiddenlobbydoesnotstartbackgroundwork; visibilityreturnreschedules. NoGPSorMiamirequestsadded; streammodeexcluded.
- New module engine/lobby-preload.js puredependencyfactory, fourtests coverdedup,earlyclickjoin,optionalnonblockingdetails,failurefallback,replenishment. Total27testspass; build+syntax+diffchecks passed. BrowserUSselectionreachedDenverinstructionsandgameplay,screenshotinspected. Requiredclient output/lobby-preload-smoke pending atthislogwrite; inspectitsartifactsbeforefinal.
- This movescityselection,roadfetch,anddetailconversionahead—not fullgraphinstantiation/GPUuploads/first-routegeneration intoaworker. No measuredzeroloadclaim. Source lobby-preload recordedinPathfindrPerformance.graphProcessing; textstateexposeslobbyslots. Build.9 recoverybaselineunchanged.

## Route sharing (.8)

- Added share-data, route-archive, share-game, share-cloud, share-ui. New schema/data separation from renderer. Local cache plus existing Supabase integration; user correctly requested backend rather than local-only. Migration016 is prepared but NOT applied: live read-only table checks return404/PGRST205; no Supabase CLI installed (npx --no-install failed). Do not claim hosted shares or cloud sync are deployed.
- Captures full rounds + up to5round run, route coordinates/distances/scores/difficulty, start/end, targets and collected metadata. Immutable export strips solutions for challenge; bounded import/decompression, exactgraph connectivity/packchecksum checks. Miami creator uses label datalists; othercities sharecompletedrounds. No paywall change. Friend attempts excluded rankedwrites and lifetime collectible rewards.
- 23tests + build/diffchecks pass. Required client initial share-feature-smoke lobby click timed out behind intro; later share-import-smoke successfully rendered importedchallenge and screenshot inspected. Onlyexistinglocalresource404. In-app manual chain: createMiamiBayfrontPark→BrickellPark, exportcode, import, play; thenexplicit3node2roundQAfixture import, collectQAStreetSpark(lifetimetotalstayed9), completebothrounds1000each, save, fullrunpreviewwithcorrectroundspecificcollectibles, reloadlibraryretains2roundsavedrun. Screenshots inspected recap and dialogs; dialogmarginfixedcenter. QA run remains in local browserlibrary; notsentbackend.
- SHARING.md detailsactivation andlimits. Remaining: apply/reviewSQL016withadminconnection; realtwo-userRLS/cloudtests; publicwebdeployment; native/mobileQA; retry/merge robustness, sharemanagement/revocationUI, guesthostedpublishingabusecontrols. ExistingdirtyPathfindr1.wavdeletionandotherbaselinechangespreserved. Baselinerecoveryunchanged.

## Discovery recap (.7)

- Added name/type hover and keyboard-focus tooltips, Escape dismissal, viewport-edge alignment. Existing separate tap-to-collect behavior unchanged.
- Compact horizontal named collectible recap; groups repeated names with counts. Per-round journal stores item identity/type/name/coordinates/time; resets on city load, round change, replay. Lifetime totals unchanged. Results-phase claims update recap immediately.
- 17 tests pass, build and syntax/diff checks pass. Required client output/collection-recap-smoke screenshot/state inspected (lobby, existing resource404). In-app Miami gameplay loads; existing saved claims and current viewport had no available pickups, so hover and populated recap not visually verified yet. User was also interacting during test; do not infer unsolicited changes are bugs.
- Share-route discussion: current roundScores is metrics only, RoundHistory is transient renderer state, signed-in score submission has coordinates. Need separate versioned durable run/round archive, frozen challenge/map identity, event journal and local save library. No sharing backend or archive implemented in this turn.

## Live labels + background preparation (.6)

Verified live Washington (non-bundled) during active round: DOM labels Pollinator Garden, 12th Street Northwest, Constitution Avenue Northwest. Required client finished output/live-atlas-smoke; lobby screenshot/state inspected, only existing localanalytics404.16tests/build/diffpassed. Multi-city transition with all GPU activation timing not exhaustively tested; do not claim fully instant or off-main-thread preparation.

- Shared engine/place-data.js extracts district/water/park/street names for BOTH Miami build pipeline and downloaded city details. Live Overpass query now includes named roads and district place nodes. Cache-hit and network paths apply labels with same map renderer/hover UI.
- City.prepare is map-independent, deduplicates in-flight downloads, caches 5 converted city detail bundles. Foreground scene has generation guard; preload never mutates visible map. Requests timeout22s; incomplete Overpass responses rejected. GPU meshes still instantiate when city activates, not on a worker.
- Competitive current-city route endpoint precompute already existed. Next-city roads now begin in round1; once roads arrive/cachehit, prepare buildings/environment/POIs/labels. Cached/in-flight same-city details reused by activation. Early city transition reuses pending road promise, rejects stale graph transitions; transition delay2s->350ms. Subsequent cities now schedule next-round and next-city preparation immediately.
- Maintains existing5rounds/city and Miami finitepack session; doesn't secretly change everyround'scity. No guaranteedzero-load: offline/provider failures fallback; next-city graph building and GPU uploads remain activation work. No full worker graph/geometry pipeline implemented. Text-state exposes preparedrounds,nextcity,roadready,detailstatus.
- 16 tests pass including shared labels and deduplicated prepare/no active-map mutation. Live browser verification in progress; required client output/live-atlas-smoke. Build `.6`, rollbackbaselineunchanged.

## Route ownership / synchronized labels (.5)

Correction to test status below: client completed normally just before attempted TERM (PID already absent). Inspected output/route-identity-smoke/shot-0.png and state; lobby build .5 loaded, only existing local analytics404. This is smoke coverage, not gameplay/hover coverage.

Live check: observed Miami round2 with score907, visible ownership legend, saved-round tags, and music activity. Found offscreen history tags stacking at viewport edge; tag rendering now skips offscreen anchors. Headless client stalled >2min, stopped own PID65401 to avoid performance contention; no new screenshot artifact from that client. Live screenshot inspected, but final recap/hover behavior still needs dedicated visual check. Do not claim measured FPS gain or full touch/hover validation.

- User asks clear user/algorithm distinction during reveal and persisted rounds, stronger recap contrast, and anchored hoverable place labels.
- Place label layout now dirty-on-move/resize, projected in MapLibre render event with no trailing RAF. Hover/focus scales an inner span only; parent geographic transform unchanged. Text receives keyboard focus and title, stops collection/route click propagation.
- Competitive routes: amber solid user, cyan dashed algorithm, explicit on-map tags and persistent legend. History tags carry round numbers. User base drawn before algorithm to preserve shared-street comparison. Autonomous visualizer retains its theme.
- Summary slate surface/background and border strengthened; lighter label text; matching route swatches; compact dimensions retained.
- 14 Node tests pass including map-render label scheduling; build/syntax/diff pass. Live Miami labels loaded and title text verified. Full latest hover/recap visual inspection remains in progress; required client started in output/route-identity-smoke.
- Build `pathfindr-route-identity-20260904.5`, baseline recovery unchanged. No deployment/native sync/paywall edits.

## 2026-09-04 Miami atlas (.4) and compact recap

Final live check: completed Miami round 1 at 948/95%, user0.67km vs optimal0.63km. Screenshot inspected: compact bottom dock around105px high at1280x720, both complete routes and endpoint visible above it. New all-route-bounds adjustment landed after that tab loaded; code/build verified but that latest camera adjustment not separately reloaded. Required headless smoke still navigation-timeout; do not call it passed.

- User chooses Miami as first prebuilt city, asks YouTube/AdSense research and free-city/ad + $2 global model. See PLATFORM_RESEARCH.md for primary sources, current June2026 normative requirements, and concrete custom-AdSense-interstitial risk. Pricing/ads unchanged. Need exact rejection notice before diagnosing approval failure.
- Downloaded bounded real OSM source via GET (POST path failed previously); data/cities/miami-source.json ~10MB. Build script generates 2.7MB JS city pack: 13,020 road nodes, 3,222 split road ways, 4,000 capped buildings, 61 surface areas, 230 named labels. Retains source timestamp/hash/attribution. No invented coastline. Open ocean/Biscayne Bay polygons still missing.
- Miami destination uses bundled roads/world and bypasses corresponding APIs, disables continuous random-city switching, constrains camera to pack bounds. New DOM labels are zoom-aware, capped and collision-tested, updated on map movement rather than every frame. Other runtime remote dependencies still present; NOT offline/YouTube-certified.
- Latest user asks quicker results and less occlusion. Interactive settling reduced 2200ms to120ms (autonomous visualizer unchanged). Compact responsive recap dock hides generic facts/redundant meta, keeps score/efficiency/distances/Next. Camera now bounds all user/optimal points, not just endpoints.
- 13 Node regression tests including bounded/self-contained Miami graph pass. Build/syntax/diff checks pass. Browser confirmed Miami loads and park/water/street labels render; park shader now visually works. Required headless client attempted but navigation timed out again; in-app browser works. Avoid simultaneous heavy test runs due prior performance reports.
- Build ID `pathfindr-miami-atlas-20260904.4`; original archive unchanged. No deploy, purchase/ad changes or native sync. Current app preview should use localhost4173, not file://.

## 2026-09-04 Living city + route cinema (.2/.3)

Latest correction: user rejects circular shockwaves; removed their render call. Keep secondary street heat echoes, not radial rings. Reports performance regression: prior 47ms map interval is evidence of poor pacing but not isolated GPU timing. Headless test exited (two navigation timeouts), no competing test processes left. Budget static-camera environment repaints to ~30Hz independently of route/input; removed repeated per-pickup endpoint projections. Not yet profiled on device. User asks about real-world labels; explain OSM names feasible with zoom-aware labels, district data additional query. Latest new shader build has not yet been visually confirmed after fixing reserved word; do not claim all runtime validation complete.

- Build now `pathfindr-route-cinema-20260904.3`; baseline rollback unchanged. No deployment or migration.
- Researched GPU Gems water normals, Blender emission/compositor, pinned Three r160 and MapLibre 4.1, OSM water/POI semantics; see RENDERING_RESEARCH.md.
- New world-data/world-renderer: bounded multipolygon conversion with holes; four batched material groups, procedural water and parks, instanced vegetation, procedural landmark meshes. Reuses map GL context. Fixed park shader compile failure from reserved GLSL name `patch` after actual browser test.
- Selective multiscale route emission, half-float where supported. Not full-scene Eevee parity.
- Separate local-only tap collections: street sparks, tagged burger places, monuments; idempotent persistence, discovery drawer, per-type synthesized SFX, no route score/distance mutation. Bottom Undo, reverse-trace erasing, Cmd/Ctrl+Z.
- Road particles now move in meters with adjacency lookup. Managed A* timeline, actual relaxation events. Latest user feedback explicitly asks slower search but FAST final-route draw: 2.3–5.2s search, 1.15s final trace, 2.2s settling at 1x. Added three outward atmospheric rings and heat echoes; slower cooling. Final path no longer fades with heat. Recap changed from white additive tubes to thin saturated filaments with traveling charges.
- Music FFT has explicit dB range, stronger lighting/material response and status/activity feedback. No microphone. Reduced motion still respected.
- Live browser observed search rings and new recap (862 / 86%, then 806 / 81%, 1668 total). User actively playing preview while tests run; do not assume unissued clicks are state bugs or reload their session unnecessarily.
- Twelve regression tests pass. Previous scripted Washington capture revealed shader error (fixed); new verification output goes to output/route-cinema-verified. Local analytics404 and Supabase localhost CORS failures are pre-existing external limitations.
- Remaining: global ocean/coastline polygon source; curved river flow field; real-device profiling; final stronger-audio visual check. Closed bay/strait polygons supported but NOT global oceans. Passport/daily/share/rewarded-ad redesign still pending; paywall deferred. Optional failed cache-showcase script removed, no fixture dependencies introduced.

## Audit Progress

- 2026-07-31: Began evidence-first architecture and product-loop audit on `main`.
- Initial observation: architecture documentation is materially stale (`CLAUDE.md` describes Leaflet and roughly 4,500 lines; current production uses MapLibre/WebGL and `game.js` is over 16,000 lines).
- Current worktree contains pre-existing unrelated state: deleted `Pathfindr1.wav`, untracked `ios/`, and untracked `output/`. Preserve these unless explicitly brought into scope.

## Audit TODO

- [x] Trace road-network fetch, graph construction, endpoint selection, A*, and round transitions.
- [x] Confirm what is and is not precomputed during active rounds.
- [x] Profile live runtime behavior, including mobile-relevant paths and console errors.
- [x] Inspect persistence, achievements, challenges, economy, collectibles, and purchase architecture.
- [x] Produce prioritized findings with evidence and an implementation sequence.

## Audit Findings

- Live Hillsboro test: approximately 12.8 seconds from city selection to a 4,306-edge graph becoming ready; about 11.2 seconds followed the city metadata response.
- Starting the round consumed about 313 ms synchronously while endpoint candidates were scored with repeated A* searches.
- Future-city preloading stores raw Overpass JSON only; graph processing, render buffers, endpoint selection, and optimal paths are not precomputed.
- Pointer preview can scan every node/edge and run multiple A* searches on every unthrottled mouse/touch movement.
- Active gameplay can start with an endpoint off-screen; the hidden results panel still extends below the map.
- Dashboard globe animation can continue alongside the game controller animation loop.
- Progression is disconnected: several achievement requirements and stats are hardcoded/unimplemented, profile totals scan full history client-side, and achievement checks can race score persistence.
- Permissive RLS policies allow client-forged achievement, leaderboard, challenge-entry, and challenge data.
- Recommended retention direction: a server-awarded Navigator Passport of performance-tiered city stamps and regional sets.
- Full report: `ARCHITECTURE_AUDIT.md`.

## Remaining Work

- Implement the Worker and processed-city cache phase before adding the collection economy.

## Performance Implementation - 2026-07-31

- Added a uniform spatial index for road nodes and edges. Interactive snapping now searches nearby grid cells instead of scanning the entire city graph.
- Coalesced mouse/touch preview updates to one animation-frame callback and ignored movement below three pixels.
- Added a bounded cache for repeated anchor-to-road-endpoint preview routes.
- Reduced endpoint shape evaluation from 28 to 12 finalists, cached each shape result, and disabled unused explored-node collection for those searches.
- Added graph-processing and endpoint-selection timing diagnostics through `window.PathfindrPerformance` and console logs.
- Stopped the dashboard globe animation when the lobby is hidden, the map preview is selected, or the document is backgrounded.
- Browser validation covered three graphs from 2,540 to 5,015 edges. Graph processing measured 17.3-45.6ms and endpoint selection measured 5.0-8.0ms.
- Verified indexed preview rendering and committed route segments in Golden Gate Park and Philadelphia.
- Public Overpass availability remains the dominant city-start delay; local tests observed HTTP 504s and 20-second request aborts before successful retries.

## Persistent Cache and Background Routes - 2026-07-31

- Added a versioned IndexedDB road-response cache keyed by exact query bounds, with seven-day expiry and an eight-city eviction cap.
- Normal city loads now use the persistent cache before contacting Overpass and report whether graph data came from cache or network.
- Continuous-play and challenge preloaders now reuse/persist the same cache, validate HTTP responses, and abort stalled requests after 20 seconds.
- Split endpoint generation from marker/UI mutation so future rounds can be prepared without changing the active round.
- Each selected candidate now carries its complete optimal path and explored-node order for later visualization.
- Round N+1 is prepared with `requestIdleCallback` while round N is playable, guarded by city and graph-version tokens.
- Prepared rounds are invalidated on graph changes and game resets, then consumed without rerunning endpoint selection or A*.
- Browser validation on a 10,463-edge Kansas City graph measured 66.4ms graph processing, 14.0ms foreground selection, 17.7ms background round-two preparation, and 0.7ms round-two activation.
- Round three began preparing automatically after the prepared round-two candidate was consumed.

## Route Diversity Fix - 2026-07-31

- Fixed endpoint selection using the previous route's fitted camera bounds, which progressively trapped later rounds inside the same corridor.
- Endpoint sampling now uses stable bounds calculated from the city's largest connected road component.
- Applied routes retain undirected endpoint-pair and road-edge signatures for the last four rounds.
- Exact endpoint pairs are excluded from future candidates.
- Candidate scoring now rewards endpoint displacement and penalizes road-edge containment overlap with recent routes.
- Shape-qualified routes must remain at or below 58% recent-route overlap; fallback selection prefers candidates at or below 78%.
- Expanded final shape evaluation from 12 to 20 candidates to preserve route quality while enforcing diversity.
- Five-round Las Vegas validation produced five unique endpoint pairs with overlaps of 0%, 0%, 0%, 33%, and 6%.

## City V2 foundation — 2026-09-04

User authorized implementation, optional architectural replacement where justified,
audio-reactive visuals, preserved UI styling, and no paywall changes. Prioritize a
recoverable visual/input foundation before the remaining commercial features.

- Before edits, archived the complete dirty workspace (including Git, ignored files,
  dependencies, and user changes) outside the repo. Baseline version 1.0.0 / commit
  a3b0b238e33acf16afd1ad1194a2864b31839bab. Archive SHA-256 verified twice.
- Created branch `codex/visual-city-v2`, version `1.1.0-dev`, build ID
  `pathfindr-city-v2-20260904.1`. See ROLLBACK.md and build-info.json. Recovery script
  validates the archive before swapping folders and preserves the displaced build.
- Added engine modules for native MapLibre buildings, soundtrack analysis, elapsed-time
  distance-weighted route reveal, pointer-captured Trace input, and a legacy-game adapter.
  Existing route graph/scoring and neon UI remain; this is not a wholesale rewrite.
- Building requests are optional, abortable, capped at 4,000 polygons, and cached for five
  cities. Opaque city mode hides the redundant raster base. Native roads/buildings share
  the map camera; legacy WebGL/Canvas route effects still exist.
- Tap and Trace can be switched during play. Trace starts only at the route tip, batches
  movement to one frame, rejects off-corridor computed detours, submits on release, and
  undoes whole strokes. Prevented click-flash, haptic, and segment-animation storms.
- Audio uses existing music through one analyser, never the microphone. Bass/mid/energy
  drive bounded glow/light changes. Independent preference, mute/paused behavior, and
  reduced-motion handling. Lighting writes skip insignificant changes.
- Fixed hidden-results viewport overflow, added adaptive endpoint padding and Recenter,
  kept facts out of the active drawing controls, and disabled inline recap ads that
  covered Next Round. Paywall/prices unchanged; existing other ad placements unchanged.
- Added stale-scene/duplicate-submit guards around route visualization and score entry.
- Corrected build packaging for engine, music/SFX, data/vendor, and analytics assets.

### Verified

- `npm test`: six Node regression tests pass (distance reveal, cancellation/reduced
  motion, building conversion, camera padding, trace lifecycle/undo, audio connection/bands/muting).
- `npm run build`, JavaScript syntax, and `git diff --check` pass.
- Live browser: Charlotte and Milwaukee building geometry; full-height framing; 3D
  pitch toggle; a traced 0.08 km stroke then undo to zero; Tap route completion with
  869 score / 87% efficiency; Next Round resets distance and depth button at round two.
- Required web-game client: lobby screenshot and text state inspected in
  output/city-v2-verified. Audio connection is established. Only local Vercel insights
  404 in this captured smoke test; live city facts/backend requests also failed in some
  local runs. Subsequent scripted destination run was less reliable (intro selector
  timeout); direct in-app gameplay is the stronger evidence.
- Final scripted city-load capture reached Dallas with 831 buildings and no city-scene
  error. Inspected screenshot and state in output/city-v2-city-load. Confirmed production
  Supabase functions explicitly reject localhost via CORS; fallback city selection works.
- Final Nashville browser run completed at 858 / 86%, with an unobstructed recap and
  Next Round. Recap camera padding now reserves panel height, with reduced-motion-safe
  transitions. GeoJSON sources retain OSM attribution after hiding the raster layer.

### Remaining / intentionally not claimed complete

- Real-device iOS/Android touch, pinch, audio-autoplay, frame-time, battery, and memory
  profiling. No measured FPS/performance improvement claim yet. Buildings depend on
  optional Overpass availability, with default heights where OSM omits height data.
- Navigator Passport, guest Daily Challenge, friend route sharing, and rewarded-ad
  redesign are NOT implemented in this foundation pass. Existing backend RLS/security
  concerns in the audit still apply. Paywall discussion remains deferred.
- No deployment, native sync, database migration, or commit was made.

### Simplified challenge sharing (September 4)
- Round Share and Share this run now open challenge links immediately, stripping solutions through the existing challenge serializer. Link dialog offers Copy link and native Share when available; removed publish/code/file choices from this flow. Existing saved-route viewing and imports remain.
- Links retain public HTTPS origin; local/native previews use www.pathfindr.world. Large payloads automatically use the existing authenticated hosted API, with a clear error if unavailable. Migration016 remains unactivated; large hosted shares are not verified live.
- 90 Node tests pass. Required game client and isolated browser interaction QA pass; desktop/mobile screenshots inspected. Verified clipboard success/denial, mocked native sharing/cancel/failure, round/run entry points, encoded-link recipient import and play handoff, mocked large hosted link fallback; no page exceptions. Actual device share sheet not exercised. Artifacts output/share-simple. No deploy or migration this turn.

### Share the recorded round/run correction
- User clarified Share should produce one link to that round/run. Removed automatic result-to-challenge conversion from recap and full-run Share. Links preserve route, score, collectibles, and the original round count; dialog labels Share round / Share run. Explicit friend-challenge creation remains available in the saved-route viewer.
- Seven sharing unit tests pass. Browser checks verify round link decodes to one result with score/path, full-run link contains both fixture rounds, recipient sees recorded score, plus copy/share fallbacks. Required client screenshot inspected. No deployment. Existing hosted-backend limitation for oversized links remains.

### Classic fullscreen, trace erase, end pullback (.30)
- Classic requests native fullscreen on Start Game; Menu provides a toggle and F toggles it on desktop. Exiting fullscreen does not end Classic. Browser-denied/unsupported fullscreen leaves normal gameplay intact; retained existing controls and typography.
- Trace backtracking walks the contiguous route tail with a wider touch corridor and creates a partial-edge endpoint. Removed distance is recalculated; stroke Undo restores the previous path. Adjacent reverse steps erase rather than add a scoring penalty.
- Reveal now pulls back from the player's finish view for 1.1 seconds until the route fits, then starts A* with a stationary camera. Reduced motion skips the transition; manual gestures cancel camera control.
- 100 Node tests, syntax checks, and diff whitespace checks pass. Stock web-game lobby capture inspected (existing localhost backend CORS/optional resource errors). Staged Playwright checks pass for native fullscreen/F/menu, real-road CDP touch partial erase/undo, touch auto-finish, and pre-search camera sequence; no page exceptions. Mobile screenshots inspected. Real-device fullscreen support/performance still needs user testing.
- Release staged at /tmp/pathfindr-classic-release.91AX3s from the verified .29 production artifact, with only nine scoped public files updated. Concurrent Print Studio work excluded. .29 production rollback recorded in ROLLBACK.md. No database migration or Git commit.
- Published .30 to https://www.pathfindr.world; deployment dpl_6HcgTKMrMekMu2qUYpZsR8Zbnopk. All nine changed public files byte-verified against the release artifact.
