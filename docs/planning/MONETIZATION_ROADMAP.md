# Pathfindr Monetization & Launch Roadmap

## Current State
- Pure client-side web app (HTML/CSS/JS)
- No backend, no user accounts
- No analytics or tracking
- Deploys anywhere static files can be hosted

---

## 1. Monetization Strategy

### Option A: Ads

**Web (Immediate)**
| Platform | Cut | Pros | Cons |
|----------|-----|------|------|
| Google AdSense | 32% | Easy setup, huge network | Can look ugly, low CPM for games |
| Carbon Ads | 50% | Developer-focused, tasteful | Lower volume |
| Custom sponsorships | 0% | Full control, premium rates | Requires audience first |

**Mobile (After App Launch)**
| Platform | Cut | Pros | Cons |
|----------|-----|------|------|
| Google AdMob | 40% | Massive reach, easy integration | Google's rules |
| Unity Ads | 40% | Game-focused, rewarded video | Requires SDK |
| AppLovin | varies | High CPMs | More complex |

**Ad Placement Ideas (Non-Intrusive)**
- Banner at bottom during location selection
- Interstitial between rounds (every 2-3 rounds max)
- Rewarded video: "Watch ad to get a hint" or "Watch ad to see optimal path preview"
- NO ads during active gameplay (ruins flow)

### Option B: Subscriptions

**Pricing Ideas**
- Free tier: 3 games/day, ads, basic stats
- Pro ($4.99/mo or $29.99/yr):
  - Unlimited games
  - No ads
  - Full stats & achievements
  - Global leaderboards
  - Custom themes/colors
  - Exclusive cities/locations

**Platform Cuts**
| Platform | Cut | Notes |
|----------|-----|-------|
| App Store (iOS) | 15-30% | 15% if <$1M/yr revenue |
| Play Store (Android) | 15-30% | 15% for first $1M |
| Web (Stripe) | 2.9% + $0.30 | Best margins |
| Web (Paddle) | 5% + fees | Handles global taxes |

**Recommendation**: Push web subscriptions hard, use app stores for reach.

---

## 2. App Store Deployment

### Can We Ship What We Have?

**Yes, with wrappers.** Current stack (HTML/JS/WebGL/Leaflet) can be wrapped.

### Options

#### A. PWA (Progressive Web App) - Easiest
```
Effort: Low (days)
Rewrite: None
```
- Add manifest.json + service worker
- "Add to Home Screen" on mobile
- Works on Android (Play Store accepts PWAs via TWA)
- iOS support limited (no push notifications, some restrictions)

#### B. Capacitor (Recommended)
```
Effort: Medium (1-2 weeks)
Rewrite: Minimal
```
- Wraps web app in native WebView
- Full App Store + Play Store support
- Access to native APIs (push notifications, in-app purchases)
- Same codebase for web + mobile
- Ionic team maintains it, very active

#### C. React Native / Flutter
```
Effort: High (months)
Rewrite: Complete
```
- Would need to rebuild everything
- Not recommended unless we hit scaling issues with Capacitor

### Recommended Path
1. **Week 1**: PWA for Android (quick win)
2. **Week 2-3**: Capacitor build for iOS + Android
3. **Launch**: Web + PWA + App Store + Play Store simultaneously

---

## 3. User System & Stats Tracking

### What to Track

**Per-Game Stats**
- Score
- Efficiency %
- Distance drawn vs optimal
- Time to complete
- City/Location played

**Cumulative Stats (Subscription Feature)**
- Total distance pathfound (km)
- Total games played
- Cities visited (unique count + list)
- Countries visited
- US States visited
- Average efficiency
- Best efficiency
- Win streaks
- Total time played

**Achievements Ideas**
| Achievement | Requirement |
|-------------|-------------|
| First Steps | Complete first game |
| Century | Play 100 games |
| Perfectionist | Get 100% efficiency |
| Globe Trotter | Play in 10 countries |
| Coast to Coast | Play in all US time zones |
| Night Owl | Play at 3 AM local time |
| Speed Demon | Complete Round 5 in under 60 seconds |
| Marathon | Pathfind 100km total distance |
| Local Expert | Play 50 games in same city |

### Backend Requirements

**Minimum Viable Backend**
- User authentication (email/password, Google, Apple)
- Database for user profiles + game history
- API endpoints for stats + leaderboards

**Options**

| Service | Effort | Cost | Notes |
|---------|--------|------|-------|
| Firebase | Low | Free tier generous | Google ecosystem, real-time DB |
| Supabase | Low | Free tier good | Open source Firebase alternative, PostgreSQL |
| PlanetScale | Medium | Free tier | MySQL, good for scale |
| Custom (Node + Postgres) | High | $5-20/mo VPS | Full control |

**Recommendation**: Start with **Supabase**
- Free tier handles 50k users
- Built-in auth (Google, Apple, email)
- PostgreSQL = real queries
- Row-level security
- Easy to migrate away if needed

### Data Schema (Rough)

```sql
-- Users
users (
  id, email, display_name, avatar_url,
  subscription_tier, subscription_expires,
  created_at, last_played_at
)

-- Game Sessions
games (
  id, user_id,
  city, country, state,
  lat, lng,
  round_scores[], total_score,
  total_distance_drawn, total_distance_optimal,
  efficiency_avg,
  duration_seconds,
  played_at
)

-- Achievements
user_achievements (
  user_id, achievement_id, unlocked_at
)

-- Leaderboards (materialized view or separate table)
leaderboards (
  user_id, period (daily/weekly/alltime),
  total_score, games_played, avg_efficiency
)
```

---

## 4. Launch Checklist

### Before Viral Push
- [ ] Analytics (Plausible, Fathom, or Google Analytics)
- [ ] Error tracking (Sentry)
- [ ] Basic ad integration (web)
- [ ] Social sharing (screenshot + share button)
- [ ] Open Graph meta tags (Twitter cards, etc.)
- [ ] Performance testing at scale

### For Subscriptions
- [ ] Backend deployed (Supabase)
- [ ] User auth working
- [ ] Stats tracking implemented
- [ ] Payment integration (Stripe for web)
- [ ] Subscription UI in game

### For App Stores
- [ ] Capacitor project setup
- [ ] App icons (all sizes)
- [ ] Screenshots for store listings
- [ ] Privacy policy URL
- [ ] Terms of service URL
- [ ] Apple Developer account ($99/yr)
- [ ] Google Play Developer account ($25 one-time)
- [ ] In-app purchase setup (both stores)

---

## 5. Revenue Projections (Napkin Math)

**Assumptions**
- 100k MAU (Monthly Active Users) after viral moment
- 2% convert to paid ($4.99/mo)
- 50% web, 50% mobile

**Monthly Revenue**
- 2,000 subscribers × $4.99 = $9,980
- Web (1,000 × $4.99 × 0.97 Stripe) = $4,840
- Mobile (1,000 × $4.99 × 0.70 after store cut) = $3,493
- **Total subscriptions: ~$8,333/mo**

**Ad Revenue (Free Users)**
- 98,000 free users
- Assume 5 sessions/mo, 2 ad impressions/session
- 980,000 impressions × $2 CPM = $1,960/mo

**Total: ~$10,000/mo** at 100k MAU with 2% conversion

---

## 6. Immediate Next Steps

1. **Add Plausible/Analytics** - Know your numbers before going viral
2. **Add social sharing** - Screenshot button + share to Twitter/etc
3. **Set up Supabase** - Even just for anonymous game tracking initially
4. **Capacitor proof-of-concept** - Verify the game runs well in wrapper
5. **Design subscription tier** - What's free vs paid

---

## Questions to Decide

1. **Free tier limits**: Games per day? Or unlimited with ads?
2. **Subscription price**: $4.99/mo? $2.99? Annual discount?
3. **Ads**: Interstitials between rounds? Or just banners?
4. **Leaderboards**: Global? Friends? Regional?
5. **Launch timing**: Soft launch first? Or go big immediately?

---

*This is a living document. Update as decisions are made.*
