# Android Signing Info (DO NOT COMMIT)

This file contains sensitive signing credentials. Store these securely (password manager + offline backup) and keep the keystore file safe.

## Files to Back Up
- `android/keystore/pathfindr-release.keystore`
- `android/keystore.properties`

## Keystore Details
- Package name (applicationId): `world.pathfindr.app`
- Keystore path: `android/keystore/pathfindr-release.keystore`
- Key alias: `pathfindr`
- Keystore password: `8MAED73Thh*IvUFDhMlreQDN`
- Key password: `8MAED73Thh*IvUFDhMlreQDN`

## Notes
- Losing the keystore means you cannot update the app in Google Play.
- Do not commit the keystore or keystore.properties to git.
