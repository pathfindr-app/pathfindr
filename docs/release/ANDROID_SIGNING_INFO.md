# Android Signing Info Template

This file is intentionally redacted. Keep the real signing credentials outside git in a password manager plus an offline backup.

## Files to Back Up
- `android/keystore/pathfindr-release.keystore`
- `android/keystore.properties`

## Keystore Details
- Package name (applicationId): `world.pathfindr.app`
- Keystore path: `android/keystore/pathfindr-release.keystore`
- Key alias: `pathfindr`
- Keystore password: `[stored outside repo]`
- Key password: `[stored outside repo]`

## Secure Storage Notes
- Losing the keystore means you cannot update the app in Google Play.
- Do not commit the keystore, `keystore.properties`, or plaintext passwords to git.
- If the previous plaintext credentials were ever pushed or shared, rotate them before release.
