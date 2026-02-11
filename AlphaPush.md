# AlphaPush - Pre-Release Issues & Tasks

This document tracks critical issues and improvements needed before the next release.

**Timeline:** Flexible (no hard deadline)
**Last Updated:** 2026-01-18

---

## 1. Authentication & User Flow

### ~~1.1 Email Branding~~ ✅ CONFIGURED (Awaiting DNS Propagation)

**Implementation Complete:**
- [x] Created Resend account (via GitHub OAuth)
- [x] Added domain `pathfindr.world` in Resend dashboard
- [x] Added DNS records to GoDaddy:
   - [x] SPF record (TXT): `send` → `v=spf1 include:amazonses.com ~all`
   - [x] MX record: `send` → `feedback-smtp.us-east-1.amazonses.com` (Priority: 10)
   - [x] DMARC record (TXT): `_dmarc` → `v=DMARC1; p=none;`
   - [x] DKIM record (TXT): `resend._domainkey` → (auto-configured)
- [x] Created API key in Resend ("Supabase SMTP")
- [x] Configured SMTP in Supabase Dashboard → Authentication → Email → SMTP Settings:
   - Host: `smtp.resend.com`
   - Port: `465`
   - Username: `resend`
   - Password: (Resend API key)
   - Sender email: `noreply@pathfindr.world`
   - Sender name: `Pathfinder`

**Status:** DNS records added to GoDaddy, awaiting propagation (can take up to 1 hour, sometimes 48 hours globally). Resend will auto-verify once DNS propagates.

**Still TODO:**
- [ ] Customize email templates in Supabase Dashboard → Authentication → Email → Templates:
   - [ ] Password reset email (Pathfinder branding, neon colors)
   - [ ] Email confirmation/welcome email
   - [ ] Magic link (if applicable)

### ~~1.2 Forgot Password UI~~ ✅ RESOLVED

**Implementation Complete:**
- [x] Added "Forgot password?" link below password field in login modal
- [x] Created forgot password form with email input (toggles with main form)
- [x] Wired up to existing `resetPassword()` method in `auth.js`
- [x] Added success message: "Check your email for a password reset link!"
- [x] Added error handling for failed requests
- [x] Link hidden during Sign Up mode (only shows for Sign In)

### ~~1.3 Signup Flow Polish~~ ✅ ALREADY IMPLEMENTED

**Implementation Complete (found during code review):**
- [x] `showPurchasePrompt()` checks auth state first (`payments.js:586-607`)
- [x] If not logged in → shows "Create Account to Go Pro" modal (`showAuthRequiredForPurchase()`)
- [x] All "Go Pro" buttons use `showPurchasePrompt()`:
  - `game.js:8078` - Premium modal button
  - `ads.js:531` - Pro banner onclick
  - `ads.js:1065` - Go Pro ad button
  - `ads.js:1332` - Inline ad button
- [x] After successful signup/login → `proceedWithPurchaseAfterAuth()` redirects to Stripe (`auth.js:286-288`)
- [x] Post-purchase signup prompts remain as edge-case fallback (shared links, session issues)

**Benefits achieved:**
- Users must have account before purchasing
- Seamless redirect to Stripe after auth
- Email receipt can be sent immediately
- Fallback handles edge cases gracefully

---

## ~~2. Ads Not Displaying (LIVE - pathfindr.world)~~ ✅ RESOLVED

### Root Cause
**Admin users don't see ads** - by design! Not a bug.

The test account `pathfindr.game@gmail.com` is in `PathfindrConfig.admin.emails`, so:
- `isAdmin()` → `true`
- `isAdFree()` → `true` (admins are always ad-free)
- All ad display calls are skipped

### To Test Ads Properly
1. Log out and test as anonymous user
2. Or create/use a non-admin test account
3. Or temporarily remove email from admin list in `config.js`

### Additional Notes
- Ads only appear during/after rounds (`showBannerOnMenu: false`)
- Banner rotates: every 3rd impression shows "Go Pro" instead of AdSense
- If AdSense doesn't fill, falls back to "Go Pro" banner

---

## ~~3. Sound Sync Issues in Visualization Mode~~ ✅ RESOLVED

### Root Cause
- `Scanning.wav` is ~43 seconds but visualization only takes ~4-6 seconds
- Sound played once (not looped) and only faded when results showed
- Sound timing didn't match visual phases

### Fix Applied
1. **Scanning sound now loops** with random start position for variation (`game.js:2070-2100`)
2. **Fades out when exploration ends** - before path tracing begins (`game.js:6494-6495`)
3. **pathFound plays at correct moment** - when path reaches destination (`game.js:6525-6526`)

```
scanning() loops ──────────► fadeOut(300ms)
                                   │
Exploration ──────────────────────►│ Path trace ───► pathFound() ──► Results
   (varies)                              ~2s              │
                                                    (at destination)
```

---

## ~~4. Trackpad Zoom Too Slow (Mac & Windows)~~ ✅ RESOLVED

### Fix Applied
Changed `wheelPxPerZoomLevel` from `120` to `60` in `game.js:4989`.

```javascript
wheelPxPerZoomLevel: 60,  // Was 120 - now more responsive
```

Lower value = fewer pixels of scroll needed per zoom level = faster/more responsive zoom.

---

## ~~5. Road Network Desync on Desktop Zoom~~ ✅ RESOLVED

### Root Cause
Leaflet's CSS transform-based zoom animation was incompatible with our canvas rendering:
- Leaflet animates zoom using CSS transforms on the tile pane
- Canvas overlays are outside Leaflet's DOM tree and don't inherit transforms
- Canvas redraws at final coordinates while tiles are mid-animation
- Result: tiles smoothly scale, canvas jumps to final position

### Fix Applied
Disabled zoom animation on desktop only (`game.js:4990-4992`):

```javascript
// Disable zoom animation on desktop only - fixes canvas desync with wheel zoom
// Mobile pinch zoom works fine with animation, so keep it smooth there
zoomAnimation: isMobile,
```

- **Desktop** (`isMobile = false`): Instant zoom, no desync
- **Mobile** (`isMobile = true`): Keeps smooth animated pinch zoom (was already working)

This is a pragmatic fix - desktop loses smooth zoom animation but gains perfect sync.

---

## Priority Order (Remaining)

| # | Issue | Impact | Effort |
|---|-------|--------|--------|
| 1 | Signup Flow Polish | Conversion | Medium |
| 2 | Email Templates | Polish | Low |

### Completed ✅
- ~~Road Network Desync~~ - Fixed with `zoomAnimation: isMobile`
- ~~Trackpad Zoom Slow~~ - Fixed with `wheelPxPerZoomLevel: 60`
- ~~Ads Not Displaying~~ - Was working, admin bypass by design
- ~~Sound Sync~~ - Fixed with looping + proper fade timing
- ~~Forgot Password UI~~ - Added link + form in auth modal
- ~~Email Branding~~ - Configured Resend SMTP, DNS propagating

---

## Configuration & Access

| Service | Access | Notes |
|---------|--------|-------|
| Supabase Dashboard | ✅ Full access | Can change auth settings, email templates |
| GoDaddy DNS | ✅ Owns domain | Need to add email DNS records |
| Google AdSense | ? | Need to verify account status |

---

## Testing Checklist

Before release, verify on:
- [ ] Chrome (Mac) - trackpad zoom, road sync
- [ ] Chrome (Windows) - trackpad zoom, road sync
- [ ] Safari (Mac) - all features
- [ ] Safari (iOS) - touch interactions
- [ ] Firefox (Mac/Windows) - general compatibility
- [ ] Edge (Windows) - general compatibility
- [ ] Mobile Chrome (Android) - touch interactions

---

## Decisions Made

| Question | Decision |
|----------|----------|
| Signup flow | ✅ Require signup BEFORE purchase |
| Email provider | ✅ Resend with custom SMTP |
| Email branding | ✅ Full branding (`noreply@pathfindr.world`) |

## Open Questions

~~1. **Desktop zoom**: Why does mobile pinch zoom work but desktop mouse wheel doesn't?~~
   - **ANSWERED**: Leaflet's zoom animation uses CSS transforms that canvases don't inherit. Mobile touch zoom likely uses different event handling. Fixed by disabling animation on desktop.

~~2. **Ads implementation**: Need to check browser console and code to find the specific issue~~
   - **ANSWERED**: Ads work fine - admin users are excluded by design (`isAdFree()` returns true for admins)

---

## Notes

- All code changes are in `game.js` (monolithic ~4500 lines)
- Auth code is in separate `auth.js`
- Payment code is in `payments.js`
- Supabase Edge Functions in `supabase/functions/`
