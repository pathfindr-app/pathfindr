# Pathfindr Store Release Evaluation

## Status Snapshot

Last updated: April 22, 2026

This repo is materially closer to store-ready than it was at the start of this pass.

What is now true:

- `@capacitor/ios` has been added and the `ios/` project now exists
- Capacitor packages are aligned on major version 8
- `npm run build` succeeds
- `npm run build:mobile` succeeds and syncs both Android and iOS
- Android and iOS native config now include store-relevant permissions / metadata for deep links, ads, and location usage text
- Legal pages now reflect one-time premium purchases and native billing
- In-app account deletion has been added in UI plus a new Supabase `delete-account` function
- Native premium access is now cached from RevenueCat so iOS / Android purchases can unlock Pro in-app without depending on the old web-only purchase flag
- Supabase function CORS has been expanded for Capacitor WebView origins

What is still blocked externally or environment-wise:

- iOS native purchases are still blocked by the placeholder RevenueCat iOS API key in [`config.js`](/Users/bradleyarakaki/Desktop/Pathfindr/config.js)
- iOS native compilation could not be run on this machine because full Xcode is not installed
- Android native compilation is blocked by a missing Android SDK on this machine
- Real-device QA for auth, purchases, ads, and location is still required on both platforms
- Store listing assets and console metadata are still incomplete

## What Was Completed

### Native project and dependency setup

- Added iOS platform support and generated [`ios/`](/Users/bradleyarakaki/Desktop/Pathfindr/ios)
- Upgraded Capacitor toolchain in [`package.json`](/Users/bradleyarakaki/Desktop/Pathfindr/package.json) and synced native projects
- Updated AdMob plugin to a Capacitor 8-compatible release

### Monetization and premium access fixes

- Fixed a real native launch issue in [`payments.js`](/Users/bradleyarakaki/Desktop/Pathfindr/payments.js): native premium entitlement is now cached locally and used by the app as a valid Pro signal
- Updated [`auth.js`](/Users/bradleyarakaki/Desktop/Pathfindr/auth.js) and [`config.js`](/Users/bradleyarakaki/Desktop/Pathfindr/config.js) so premium checks work for native purchases, not just the old `has_purchased` web flag
- Switched AdMob testing to production-safe defaults with local opt-in testing instead of shipping `testing: true`

### Compliance and store policy work

- Added in-app account deletion UI in [`index.html`](/Users/bradleyarakaki/Desktop/Pathfindr/index.html)
- Added account deletion client flow in [`auth.js`](/Users/bradleyarakaki/Desktop/Pathfindr/auth.js)
- Added Supabase edge function at [`supabase/functions/delete-account/index.ts`](/Users/bradleyarakaki/Desktop/Pathfindr/supabase/functions/delete-account/index.ts)
- Updated [`website/privacy.html`](/Users/bradleyarakaki/Desktop/Pathfindr/website/privacy.html) and [`website/terms.html`](/Users/bradleyarakaki/Desktop/Pathfindr/website/terms.html) to describe:
  - one-time premium purchase instead of auto-renewing subscription wording
  - Apple / Google native billing via RevenueCat
  - account deletion availability
  - ad / analytics / location data use at a more realistic level

### Native configuration hardening

- Added Android permissions for location, network state, and `AD_ID` in [`android/app/src/main/AndroidManifest.xml`](/Users/bradleyarakaki/Desktop/Pathfindr/android/app/src/main/AndroidManifest.xml)
- Added iOS URL scheme, AdMob app ID, location usage string, and tracking usage string in [`ios/App/App/Info.plist`](/Users/bradleyarakaki/Desktop/Pathfindr/ios/App/App/Info.plist)
- Expanded Capacitor-safe origins in:
  - [`supabase/functions/create-checkout/index.ts`](/Users/bradleyarakaki/Desktop/Pathfindr/supabase/functions/create-checkout/index.ts)
  - [`supabase/functions/get-random-city/index.ts`](/Users/bradleyarakaki/Desktop/Pathfindr/supabase/functions/get-random-city/index.ts)
  - [`supabase/functions/get-city-facts/index.ts`](/Users/bradleyarakaki/Desktop/Pathfindr/supabase/functions/get-city-facts/index.ts)

## Verification Results

### Verified

- `npm run build` completed successfully
- `npm run build:mobile` completed successfully
- `npx cap sync` completed successfully for both Android and iOS

### Android compile attempt

I ran Android compilation twice.

1. First attempt failed because the machine only had Java 25, which Gradle / Android tooling in this project does not support cleanly.
2. I installed Homebrew `openjdk@21` and retried with a compatible `JAVA_HOME`.
3. Second attempt got past the Java blocker and into real Gradle configuration, then failed because the Android SDK is not installed on this machine.

Current Android build blocker:

- Missing Android SDK / `ANDROID_HOME`

This is now an environment blocker, not a repo wiring blocker.

### iOS compile attempt

I attempted `xcodebuild`, but this machine only has Command Line Tools active and does not appear to have full Xcode installed.

Current iOS build blocker:

- Full Xcode is not installed / configured, so native compilation cannot be executed here

This is also an environment blocker, not a repo structure blocker.

## Remaining Critical Blockers

### 1. iOS RevenueCat key is still missing

[`config.js`](/Users/bradleyarakaki/Desktop/Pathfindr/config.js) still contains:

- `YOUR_REVENUECAT_IOS_API_KEY`

Impact:

- iOS premium purchase flow will not initialize successfully
- App Store review should be considered blocked until this is configured and tested

### 2. Machine setup still prevents final native build verification

Android:

- Install Android SDK and set `ANDROID_HOME` or `sdk.dir`

iOS:

- Install full Xcode
- Point `xcode-select` to the Xcode developer directory

### 3. Android signing credentials must stay outside the repo

[`docs/release/ANDROID_SIGNING_INFO.md`](/Users/bradleyarakaki/Desktop/Pathfindr/docs/release/ANDROID_SIGNING_INFO.md) is now a redacted template only.

Release signing secrets should live in secure storage outside git, and previously exposed credentials should be rotated before any wider sharing or store release workflow.

### 4. Store assets and console setup are still incomplete

Still needed outside the repo:

- App Store Connect app setup
- Google Play Console setup and testing tracks
- screenshots
- feature graphic
- app icon master / export set
- descriptions, subtitle, keywords, age rating, Data Safety, and privacy nutrition labels

## High-Priority QA Still Needed

### Native auth and deep links

Need real-device testing for:

- Google sign-in
- Apple sign-in on iOS
- Facebook / Discord sign-in if those buttons remain visible in production
- OAuth callback returning to the app via `pathfindr://`

### Native purchases

Need real-device testing for:

- iOS purchase flow with the real RevenueCat iOS key
- Android Play Billing purchase
- restore purchases
- premium unlock persistence across relaunch
- premium removal of ads in all relevant screens

### Ads and permissions

Need real-device testing for:

- AdMob production units on Android and iOS
- ATT behavior on iOS if tracking / ad personalization is used
- local geolocation mode on both platforms

## Readiness By Platform

## Android

### Current state

Android is now structurally close.

What is ready in-repo:

- native project exists
- Gradle config exists
- sync works
- permissions are better aligned for ads and location
- Android RevenueCat key exists
- premium logic is no longer web-only

What still blocks submission:

- Android SDK not installed on this machine, so compile / packaging was not fully verified here
- real Play Billing and AdMob device tests still needed
- store listing / Data Safety / release track setup still needed

### Android confidence

Repo readiness: medium-high  
Submission readiness today: medium-low

## iOS

### Current state

iOS moved from “not set up” to “project exists but not fully validated.”

What is ready in-repo:

- iOS project exists
- sync works
- Info.plist includes URL scheme, AdMob app ID, and usage descriptions
- native premium logic is prepared

What still blocks submission:

- RevenueCat iOS key missing
- full Xcode not installed on this machine, so compile / archive was not verified
- Sign in with Apple, IAP, ads, and location all still need real-device validation

### iOS confidence

Repo readiness: medium  
Submission readiness today: low

## Priority Order From Here

1. Install Android SDK and verify Android debug + release builds locally
2. Install full Xcode and verify iOS build locally
3. Add real iOS RevenueCat public API key
4. Deploy updated Supabase functions, especially `delete-account`
5. Run device QA for auth, purchases, restore, ads, and local mode
6. Remove plaintext signing secrets from tracked docs
7. Finish App Store / Play Store metadata, screenshots, and compliance forms

## Bottom Line

Pathfindr is no longer in the “missing native foundations” state.

It is now:

- **repo-ready enough to continue serious Android release work**
- **repo-ready enough to begin serious iOS validation work**
- **still blocked from actual store submission by missing environment tooling, real iOS billing config, device QA, and console / asset completion**
