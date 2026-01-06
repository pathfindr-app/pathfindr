# Pathfindr Shipping Plan

---

## START HERE: What You Need to Gather

### Accounts to Create (Do This First)

| Service | Purpose | Cost | Link |
|---------|---------|------|------|
| **Supabase** | Auth, database, leaderboards | Free (50k MAU) | https://supabase.com |
| **Google AdMob** | Ads (all platforms) | Free (revenue share) | https://admob.google.com |
| **Stripe** | Web payments | Free (2.9% + $0.30 per transaction) | https://stripe.com |
| **Apple Developer** | iOS App Store | $99/year | https://developer.apple.com |
| **Google Play Console** | Android Play Store | $25 one-time | https://play.google.com/console |

### Keys/IDs You'll Get From Each

**Supabase:**
- Project URL (`https://xxxxx.supabase.co`)
- Anon public key
- Service role key (for webhooks)

**Google AdMob:**
- App ID (one per platform: web, iOS, Android)
- Ad Unit IDs (banner, interstitial, rewarded)

**Stripe:**
- Publishable key
- Secret key
- Webhook signing secret

**Apple Developer:**
- Team ID
- App ID
- In-App Purchase product IDs

**Google Play Console:**
- App package name
- In-App Purchase product IDs

---

## Ads Implementation

### Platform-Specific Ad Services

| Platform | Service | Why |
|----------|---------|-----|
| **iOS / Android** | Google AdMob (via Capacitor plugin) | Native ads, highest CPM |
| **Web** | Google AdSense | Web-optimized, same Google account |

Same Google account manages both. Revenue consolidates in one dashboard.

### The Capacitor Plugin (iOS/Android)
```bash
npm install @capacitor-community/admob
npx cap sync
```

### Ad Types to Implement

1. **Banner Ads** - Persistent bottom banner during gameplay
   - Show during: menu screens, between rounds
   - Hide during: active gameplay (optional, your call)

2. **Interstitial Ads** - Full-screen between rounds
   - Show after: round completion (not every round—every 2-3)
   - Frequency cap: Don't annoy players

3. **Rewarded Ads** - Optional, player chooses to watch
   - Reward: Extra hint, bonus points, cosmetic preview
   - These have highest CPM (revenue per impression)

### Ad Code Structure

```javascript
import { AdMob, BannerAdSize, BannerAdPosition } from '@capacitor-community/admob';

// Initialize on app start
async function initializeAds() {
  await AdMob.initialize({
    initializeForTesting: true, // Set false for production
  });
}

// Show banner
async function showBanner() {
  const options = {
    adId: 'ca-app-pub-xxxxx/yyyyy', // Your AdMob ad unit ID
    adSize: BannerAdSize.BANNER,
    position: BannerAdPosition.BOTTOM_CENTER,
  };
  await AdMob.showBanner(options);
}

// Show interstitial (between rounds)
async function showInterstitial() {
  await AdMob.prepareInterstitial({
    adId: 'ca-app-pub-xxxxx/zzzzz',
  });
  await AdMob.showInterstitial();
}

// Hide all ads (when user purchases)
async function hideAds() {
  await AdMob.hideBanner();
}
```

### Ad Placement Strategy

| Screen/Moment | Ad Type | Frequency |
|---------------|---------|-----------|
| Main menu | Banner | Always |
| Location selection | Banner | Always |
| After round 2 | Interstitial | Once per game |
| After round 4 | Interstitial | Once per game |
| Game over screen | Banner | Always |
| "Get hint" button | Rewarded | Player-initiated |

### Revenue Expectations (rough)

- Banner: $0.10 - $1.00 CPM (per 1000 impressions)
- Interstitial: $1.00 - $5.00 CPM
- Rewarded: $5.00 - $15.00 CPM

With 10k daily players, ~5 ads each = 50k impressions/day = $50-250/day potential

---

## Phase 1: Core Monetization & Authentication

### Authentication & User System
- **Platform:** Supabase (free tier: 50k MAU, managed PostgreSQL)
- **Why:** Handles auth, database, real-time, no DevOps overhead
- **Code complexity:** ~300-400 lines
- **User journey:**
  1. Player signs up with email/password (Supabase handles)
  2. Creates profile (username, display name)
  3. Plays games, scores auto-saved
  4. Appears on leaderboards (opt-in or default)

### Monetization Strategy
- **Model:** Free-to-play with optional ad removal (one-time purchase)
- **Ad Library:** Google AdMob (free tier available)
- **Payment Methods (Capacitor-wrapped, single codebase):**
  - Web: Stripe checkout
  - iOS: Apple In-App Purchase (30% cut)
  - Android: Google Play Billing (30% cut)
- **Purchase tracking:** Boolean flag `users.has_purchased`
  - One-time purchase is simpler than subscriptions (no renewal logic)
  - Once purchased, ads disabled forever
- **Future monetization:** Game modes, cosmetics, special effects (subscription or one-time)

### Deployment Strategy
- **Single JavaScript codebase, three deployments:**
  1. **Web:** Vue domain, Stripe integration
  2. **iOS:** Wrapped with Capacitor, Apple IAP
  3. **Android:** Wrapped with Capacitor, Google Play IAP
- **Why Capacitor:** Game already works in mobile browser, no need for native rewrite
- **Payment abstraction:** Environment detection routes to correct IAP/payment provider
- **App store presence prevents IP theft:** Clones become obviously unofficial

---

## Phase 2: Data Capture & Analytics

### Core Data Model

#### Users Table
```sql
- id (UUID, from auth)
- email (unique)
- username (unique, display name)
- country (inferred from IP or profile)
- platform (web/ios/android)
- has_purchased (boolean)
- created_at
- last_played_at
```

#### Games Table (Individual game sessions)
```sql
- id (UUID)
- user_id (FK to users)
- session_id (FK to sessions)
- start_time, end_time
- round_number (1-5)
- location_name (city/area name)
- center_lat, center_lng (game center point)
- zoom_level (map zoom when played)
- user_path (JSON array: [{lat, lng}, ...])
- optimal_path (JSON array: [{lat, lng}, ...])
- efficiency_percentage (0-100%)
- road_network_state (JSON: nodes + edges)
- efficiency_heatmap (JSON: edge_id → heat_value)
- created_at
```

#### Sessions Table (Play session metadata)
```sql
- id (UUID)
- user_id (FK to users)
- platform (web/ios/android)
- device_info (browser, OS, resolution)
- start_time, end_time
- rounds_completed (1-5)
- total_score
- country (where they played)
- errors_encountered (JSON array)
```

#### Feature Usage Table
```sql
- id (UUID)
- user_id (FK to users)
- session_id (FK to sessions)
- feature_name (sound_type, animation_type, game_mode)
- duration_used (seconds)
- created_at
```

#### Transactions Table (Revenue tracking)
```sql
- id (UUID)
- user_id (FK to users)
- amount (decimal)
- currency (USD, EUR, etc.)
- platform (stripe/apple/google)
- status (success/failed/refunded)
- created_at
```

#### Leaderboards Table (Materialized view, updated after each game)
```sql
- id (UUID)
- user_id (FK to users)
- username
- best_efficiency (float)
- avg_efficiency (float)
- total_games (int)
- countries_visited (int)
- updated_at
```

#### World Exploration Table (Aggregated, for heatmaps)
```sql
- id (UUID)
- lat, lng
- visit_count (how many players played here)
- avg_efficiency
- game_count
```

### Data We're Capturing

**Player Behavior:**
- Session duration (start/end time)
- Completion rate (rounds completed)
- Return patterns (session frequency)
- Feature usage (which animations, sounds, modes)

**Geographic:**
- Countries/regions played in
- Specific coordinates of all games
- GPS coordinates of drawn routes
- Heat map of global play activity

**Performance:**
- Device/platform/browser info
- Error logs and crashes
- Device performance notes

**Revenue:**
- Purchase timing and platform
- Currency/regional data
- Refund tracking

**Engagement:**
- Which features are used most
- Difficulty perception (score distribution)
- Churn points (where players quit)

---

## Phase 3: Player Journey Visualization (The Fun Stats)

### The Interactive Walkthrough Feature

**Concept:** Players can explore their personal "journey map" showing everywhere they've played.

**Features:**
1. **World Map View**
   - Interactive map showing all cities/locations they've played
   - Pins for each game, colored by efficiency
   - Hover to see: city name, efficiency %, date played
   - Click to replay that game

2. **Timeline View**
   - Chronological list of games played
   - Sortable by efficiency, location, date
   - Filter by country, date range

3. **Game Replay**
   - Click on past game → see exact map state
   - Show their drawn path + optimal path side-by-side
   - Show efficiency heatmap overlay
   - Replay animation (optional: play A* visualization again)

4. **Statistics Dashboard**
   - Total games played
   - Avg/best efficiency
   - Countries visited
   - Favorite locations
   - Progress over time (efficiency trending)

5. **Passport Feature** (future)
   - "I've played in 47 cities across 18 countries"
   - Shareable badge/card
   - Could link to other games using same data model

### Why We Store Full Data

- **Replay capability:** Store user path + optimal path + heatmap
- **Future-proofing:** Can't recreate data we didn't capture
- **Cross-game potential:** Location history becomes currency in ecosystem
- **Storage is cheap:** ~2.5GB for 10k players × 50 games each (well within free tier)

### Privacy Considerations

- Players can opt-in/out of leaderboards
- Journey map is private by default (can share if they want)
- Global heatmap is aggregate (can't identify individuals)
- Comply with GDPR (data deletion requests)

---

## Phase 4: Sound & Audio

### Current State
- Generative sounds (Web Audio API synthesis)
- Need to understand existing implementation

### Next Steps
1. **Audit existing sounds** - Document how current synthesis works
2. **Identify high-impact sounds** - Which ones need upgrade most
3. **Higher fidelity samples** - Source/create better quality
4. **Synthesis improvements** - Replicate existing generative sounds with better tools
5. **Does NOT block shipping** - Can iterate on audio post-launch

---

## Implementation Order

### Phase 1: Foundation

#### Step 1: Project Setup (Day 1)
- [ ] Create Supabase account + new project
- [ ] Create Google AdMob account
- [ ] Create Stripe account
- [ ] Initialize Capacitor in project: `npm init && npm install @capacitor/core @capacitor/cli && npx cap init`
- [ ] Add iOS platform: `npm install @capacitor/ios && npx cap add ios`
- [ ] Add Android platform: `npm install @capacitor/android && npx cap add android`

#### Step 2: Supabase Integration (Day 2-3)
- [ ] Create database tables (users, games, sessions, leaderboards)
- [ ] Add Supabase JS client to game: `npm install @supabase/supabase-js`
- [ ] Build login/signup UI (modal overlay, Blade Runner styled)
- [ ] Wire up auth flow (signup, login, logout, session persistence)
- [ ] Test auth works in browser

#### Step 3: Ads Integration (Day 4-5)
- [ ] Get AdMob App IDs (create apps for iOS + Android in AdMob console)
- [ ] Create Ad Unit IDs (banner, interstitial)
- [ ] Install Capacitor AdMob: `npm install @capacitor-community/admob`
- [ ] Add ad initialization code
- [ ] Add banner ads to menu/between rounds
- [ ] Add interstitial ads after rounds 2 and 4
- [ ] Test ads in simulator/emulator
- [ ] Set up Google AdSense for web version

#### Step 4: Score & Leaderboard System (Day 6-7)
- [ ] Add score submission after each round
- [ ] Store full game data (paths, coordinates, efficiency)
- [ ] Build leaderboard query + display UI
- [ ] Add session tracking (start/end, device info)

#### Step 5: Payments Integration (Day 8-10)
- [ ] Stripe: Create product + price for "Remove Ads"
- [ ] Stripe: Add checkout flow for web
- [ ] Apple: Create App ID + In-App Purchase product ($99 dev account required)
- [ ] Apple: Integrate Capacitor IAP plugin
- [ ] Google: Create app listing + In-App Purchase product ($25 account required)
- [ ] Google: Integrate Capacitor IAP plugin
- [ ] Build payment abstraction layer (detects platform, routes to correct provider)
- [ ] Webhook: Update `has_purchased` flag on successful payment
- [ ] Conditional: Hide ads when `has_purchased = true`

### Phase 2: Enhancement (1 week)
1. Add session tracking (device, platform, duration)
2. Add feature usage analytics
3. Add world exploration heatmap
4. Build player stats dashboard

### Phase 3: Journey Map (2 weeks)
1. Build interactive world map visualization
2. Build timeline view
3. Implement game replay feature
4. Add passport/sharing features

### Phase 4: App Store Submission (1 week)
1. Polish and testing
2. Submit to Apple App Store
3. Submit to Google Play
4. Marketing/press

---

## Key Decisions Made

✅ **Capacitor for app wrapping** - Single codebase, no native rewrite needed
✅ **Supabase for backend** - Managed auth, database, real-time
✅ **One-time purchase model** - Simpler than subscriptions, ads removal
✅ **Store full GPS data** - Enables rich player journey features
✅ **Monetize day one** - Ads + premium option, not free→paid later
✅ **Launch web first** - Validates market, then wrap for stores

---

## Open Questions

- [ ] Which sounds need highest fidelity first?
- [ ] Should journey map be public/private by default?
- [ ] Passport feature - worth doing pre-launch or post?
- [ ] Regional pricing for IAP? (different prices by country)
- [ ] Analytics dashboard - for players, for devs, or both?

---

## Success Metrics (to track post-launch)

- Conversion rate (free → paid)
- Retention (DAU, MAU, churn)
- Average session length
- Countries/cities represented
- Revenue per user
- Most-played locations
- Feature usage (which sounds/animations most popular)
