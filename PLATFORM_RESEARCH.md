# Distribution and ads: 2026-09-04 research

## YouTube Playables (primary requirements, not generated page summaries)

- [External access](https://developers.google.com/youtube/gaming/playables/certification/requirements_privacydata): no external service calls except explicitly required Google/YouTube integrations; no login/registration UI or collection of personal information. Bundled city data is appropriate.
- [Monetization](https://developers.google.com/youtube/gaming/playables/certification/requirements_monetization): current normative text permits YouTube-provided advertising functions. Off-platform ads and purchases are prohibited. The generated summary on this page contradicts its updated body; use the body.
- [Integration](https://developers.google.com/youtube/gaming/playables/certification/requirements_integration): SDK ready events, save/load, pause/resume and audio controls required. Existing localStorage and browser visibility handling are not sufficient for certification.
- [Size/performance](https://developers.google.com/youtube/gaming/playables/certification/requirements_stability): initial download MUST <30 MiB (SHOULD <15 MiB); total default <250 MiB; each file <30 MiB; heap <=512 MB. Relative paths, constrained filenames; aim interactive <5 seconds. These differ from the generated page summary.
- [Access](https://developers.google.com/youtube/gaming/playables): interest/partner review, not a guaranteed public self-publishing channel.

## Google ads: do not infer rejection cause

- [Screens without publisher content](https://support.google.com/publisherpolicies/answer/11112688?hl=en): alerts/navigation/behavior-only screens are restricted. This is not a categorical prohibition on map games. Need the exact rejection message and affected URL.
- [AdMob interstitial placement](https://support.google.com/admob/answer/6201362?hl=en): natural content breaks; no unexpected overlays during active tasks or interference with core content. App-store build should use native AdMob integrations, subject to consent and policy.
- [AdSense placement](https://support.google.com/adsense/answer/1346295/ad-placement-policies?hl=en-GB) and [H5 Games](https://support.google.com/adsense/answer/9959170?hl=en): use supported game ad formats rather than improvising interstitials from banner units.
- Code evidence: ads.js showWebInterstitial uses the banner slot; showAdSenseInterstitial puts a 300x250 display ad in a full-screen overlay with a disabled Continue button for five seconds. This is a concrete policy risk, NOT proof of why Google rejected the site. Left unchanged because this request asks for research, not ad implementation changes.

## Proposed product split (not implemented monetization)

1. Shared engine + versioned, curated city packs. Miami Downtown/Brickell first.
2. YouTube build: bundled maps/assets, YouTube SDK services only; no existing auth, Stripe/RevenueCat, AdSense, analytics or live OSM endpoints.
3. App-store build: free curated cities with appropriately spaced native ads; optional lifetime unlock. Any-location feature remains an online feature with caching, availability caveats and ongoing cost. A $2 lifetime sale does not automatically finance unlimited remote-service use.

Curated packs improve predictability and editorial quality; they are not the only permissible way to monetize a free game. Do not promise global coverage or approval based on bundling alone.

## Miami first pack

`data/cities/miami-source.json` is real OSM JSON downloaded at build time; timestamp/checksum and attribution embedded in generated `miami.js`. Rebuild using `node scripts/build-miami.cjs` (also part of npm build). Bounded Downtown/Brickell extent, not all Miami. Pack omits private road ways and splits graph ways at its boundary. It is a game graph, not navigation guidance; routing semantics remain the existing game rules.

Current pack has roads, buildings, inland-water/park surfaces, OSM POIs and zoom-aware street/place labels. Open ocean/coastline polygons and full Biscayne Bay coverage remain missing. Source JSON ships in ordinary dist for now; exclude it from a dedicated release target once source-distribution/licensing packaging is finalized. Runtime app still has remote scripts/fonts/services: do NOT call it fully offline or YouTube-ready.
