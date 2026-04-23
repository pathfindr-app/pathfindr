# App Store Launch Plan (iOS + Android)

This plan is tailored to Pathfindr (Capacitor, Supabase auth, RevenueCat IAP, AdMob ads). It assumes App Store + Play Store become the main entry point, with mobile web remaining as a fallback funnel.

## Goals
1. Ship iOS and Android together with parity.
2. Make app stores the primary distribution entry point.
3. Keep mobile web live as a low-friction fallback.

## Phase 1: Readiness
1. Confirm business accounts
- Apple Developer Program active
- Google Play Developer account active

2. Compliance basics
- Privacy Policy URL and Terms URL ready
- Support email ready
- In-app data collection disclosures prepared

3. Payments compliance
- iOS: all digital goods must use IAP (RevenueCat)
- Android: Google Play Billing must handle digital goods
- Web Stripe checkout should NOT appear inside iOS/Android apps

## Phase 2: Technical Setup
1. Bundle IDs and signing
- iOS bundle ID finalized
- Android applicationId finalized
- Signing keys and provisioning profiles stored securely

2. Auth and deep links
- Test OAuth redirect and deep link on device
- Confirm `pathfindr://auth` flow works end-to-end

3. Ads
- AdMob App IDs and unit IDs set for production
- Turn off test mode for release builds

4. Purchases
- RevenueCat iOS and Android keys set for production
- Entitlement and product IDs match store console configuration

## Phase 3: QA and Stability
1. Core flow QA
- Start game, complete 5 rounds, finish game
- Visualizer mode runs for 5+ minutes without state glitches
- Explorer mode marker placement and routing ok

2. Edge cases
- Network failures show retry states
- Map data failures do not corrupt state
- Purchase completes and unlocks Pro

3. Device coverage
- iOS: iPhone SE, iPhone 14/15
- Android: Pixel 6/7 and at least one mid-range device

## Phase 4: Store Prep
1. App Store assets
- App icon
- Screenshots for iPhone and iPad
- App preview video (optional, recommended)
- Description, keywords, subtitle

2. Google Play assets
- App icon
- Feature graphic
- Screenshots for phone and tablet
- Short description and full description

3. Privacy and data safety
- iOS privacy nutrition labels
- Google Play Data Safety form

## Phase 5: Release
1. Release tracks
- iOS: TestFlight, then App Store review
- Android: Internal test, then Closed test, then Production

2. Marketing entry point
- All campaigns link to app stores by default
- Mobile web shows lightweight install banner

3. Post-launch
- Monitor crashes and purchase errors
- Track funnel events: view paywall -> start checkout -> success

## Post-Launch Recommendations
1. Add lightweight in-app NPS prompt after 2+ sessions
2. Add error logging for uncaught exceptions
3. Tighten onboarding for the first 60 seconds
