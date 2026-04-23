# Pathfindr Release Precheck

Use this before cutting a store or production web release.

## Repo hygiene

- `git status` is limited to intentional app/source changes
- `node_modules/`, `output/`, local IDE files, and OS junk are not tracked
- No secrets are present in tracked files

## Configuration

- `config.js` has a real iOS RevenueCat public API key
- AdMob production IDs are correct for both platforms
- Stripe web checkout config is correct for web
- Privacy policy and terms links resolve successfully

## Native release readiness

- Android debug and release builds complete on a machine with Android SDK installed
- iOS build/archive completes on a machine with full Xcode installed
- Deep links return to `pathfindr://auth` correctly on device
- Purchases, restores, ads, and location prompts have been tested on real devices

## Store submission

- Screenshots and listing assets are prepared
- App Store privacy labels and Play Data Safety answers are complete
- RevenueCat product IDs and entitlements match the store console setup
- Support contact and review notes are ready
