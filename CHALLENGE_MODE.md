# Challenge Mode - Technical Documentation

This document describes how the hourly challenge system works in Pathfindr. Use this to understand, debug, or extend the challenge feature.

---

## Overview

Challenges are timed competitions where players compete to find the shortest route in a specific city. New challenges are created automatically every hour and remain active for 36 hours, allowing players to catch up on missed challenges.

**Key characteristics:**
- One attempt per challenge per user (Wordle-style)
- Timer starts on first click, not when map loads (fair timing)
- Players are ranked by efficiency (user distance / optimal distance)
- Time is used as a tiebreaker

---

## Database Schema

### `challenges` table
```sql
id              UUID PRIMARY KEY
challenge_type  TEXT ('hourly', 'daily', 'weekly')
title           TEXT (optional)
city_name       TEXT
center_lat      DECIMAL
center_lng      DECIMAL
zoom_level      INTEGER (default 15)
start_lat       DECIMAL
start_lng       DECIMAL
end_lat         DECIMAL
end_lng         DECIMAL
difficulty      TEXT ('easy', 'medium', 'hard')
active_from     TIMESTAMPTZ
active_until    TIMESTAMPTZ
created_at      TIMESTAMPTZ
```

### `challenge_entries` table
```sql
id              UUID PRIMARY KEY
challenge_id    UUID (FK to challenges)
user_id         UUID (FK to auth.users)
username        TEXT
efficiency      DECIMAL(5,2)
duration_ms     INTEGER
path_data       JSONB (optional - stores user's path)
created_at      TIMESTAMPTZ
```

### Key Database Functions
- `get_active_challenges(p_type, p_limit)` - Returns all active challenges with participant counts
- `submit_challenge_entry(...)` - Submits a user's attempt, returns rank
- `get_challenge_leaderboard(p_challenge_id, p_limit)` - Returns ranked leaderboard

---

## Client-Side State Management (SSOT)

Challenge state is stored in `GameState.challengeState`:

```javascript
GameState.challengeState = {
    activeChallenge: null,      // Current challenge object (null when not in challenge)
    activeChallenges: [],       // All active challenges from API
    userEntries: new Map(),     // Map<challengeId, entry> for completed challenges
    startTime: null,            // Set on first user click
    optimalPath: null,          // A* result after completion
    optimalDistance: null,      // For efficiency calculation
    preloadCache: new Map(),    // Map<challengeId, {city, data, timestamp}>
};
```

**SSOT Invariant:** If `GameState.gameMode !== 'challenge'`, both `activeChallenge` and `startTime` must be null.

The `resetChallengeState()` function is the **single point for cleanup**:
```javascript
function resetChallengeState() {
    GameState.challengeState.activeChallenge = null;
    GameState.challengeState.startTime = null;
    GameState.challengeState.optimalPath = null;
    GameState.challengeState.optimalDistance = null;
}
```

---

## Challenge Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           CHALLENGE FLOW                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  1. User clicks "Challenge" button on mode selector                          │
│     └─► updateChallengeButton() fetches active challenges                    │
│     └─► preloadTopChallenges(3) starts background preloading                 │
│                                                                              │
│  2. User sees challenge list, clicks one                                     │
│     └─► showChallengeInfoScreen(challenge)                                   │
│     └─► preloadChallengeCity(challenge) starts preloading this city          │
│                                                                              │
│  3. User clicks "Start Challenge"                                            │
│     └─► beginChallengeGame(challenge)                                        │
│         ├─► Sets GameState.gameMode = 'challenge'                            │
│         ├─► Sets activeChallenge, clears startTime                           │
│         ├─► setDifficulty('medium') - 200m click radius                      │
│         ├─► Loads road network (uses preloadCache if available)              │
│         ├─► Finds start/end nodes from challenge coordinates                 │
│         ├─► Initializes userPathNodes = [startNode]                          │
│         ├─► setHUDMode('competitive')                                        │
│         ├─► GameController.enterPhase(GamePhase.PLAYING)                     │
│         ├─► enableDrawing()                                                  │
│         └─► redrawUserPath() - shows click radius indicator                  │
│                                                                              │
│  4. User draws path by clicking                                              │
│     └─► handlePathClick(e)                                                   │
│         ├─► First click sets challengeState.startTime = Date.now()           │
│         └─► addPointToUserPath() routes along roads via micro-A*             │
│                                                                              │
│  5. User reaches end node                                                    │
│     └─► addPointToUserPath() detects completion                              │
│     └─► submitRoute() is called automatically                                │
│         ├─► Runs A* visualization                                            │
│         ├─► calculateAndShowScore()                                          │
│         │   ├─► Calculates efficiency                                        │
│         │   ├─► submitChallengeEntry() saves to database                     │
│         │   └─► showChallengeResults(efficiency, rank)                       │
│         └─► Results overlay appears                                          │
│                                                                              │
│  6. User chooses next action:                                                │
│     ├─► "Next Challenge" → goToNextChallenge()                               │
│     │   └─► Finds next uncompleted challenge, shows info screen              │
│     ├─► "View Leaderboard" → showChallengeLeaderboard()                      │
│     └─► "Back to Menu" → exitChallengeMode()                                 │
│         └─► resetChallengeState() clears all challenge state                 │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Key Functions Reference

### Entry Points
| Function | Purpose |
|----------|---------|
| `updateChallengeButton()` | Fetches active challenges, updates UI, triggers preloading |
| `showChallengeList()` | Displays scrollable list of active challenges |
| `showChallengeInfoScreen(challenge)` | Shows challenge details before starting |

### Game Flow
| Function | Purpose |
|----------|---------|
| `beginChallengeGame(challenge)` | Sets up map, loads roads, enables drawing |
| `handlePathClick(e)` | Handles user clicks, starts timer on first click |
| `addPointToUserPath(lat, lng)` | Routes clicks along roads, detects completion |
| `submitRoute()` | Runs A* visualization, triggers scoring |
| `calculateAndShowScore()` | Calculates efficiency, submits entry, shows results |

### Results & Navigation
| Function | Purpose |
|----------|---------|
| `showChallengeResults(efficiency, rank)` | Displays results overlay with buttons |
| `goToNextChallenge()` | Navigates to next uncompleted challenge |
| `showChallengeLeaderboard(challengeId)` | Shows full leaderboard for a challenge |
| `exitChallengeMode()` | Cleans up and returns to menu |

### State Management
| Function | Purpose |
|----------|---------|
| `resetChallengeState()` | Clears all challenge-specific state (SSOT cleanup) |

### Preloading
| Function | Purpose |
|----------|---------|
| `preloadChallengeCity(challenge)` | Fetches road network in background |
| `preloadTopChallenges(count)` | Preloads first N uncompleted challenges |

### Database
| Function | Purpose |
|----------|---------|
| `fetchActiveChallenges()` | Gets all active challenges from Supabase |
| `fetchUserChallengeEntries(challengeIds)` | Gets user's completed entries |
| `submitChallengeEntry(efficiency, pathData)` | Saves attempt to database |
| `fetchChallengeLeaderboard(challengeId, limit)` | Gets ranked leaderboard |

---

## Preloading System

Road network data is preloaded in the background to reduce wait times:

```javascript
GameState.challengeState.preloadCache  // Map<challengeId, {city, data, timestamp}>
```

**Preload triggers:**
1. `updateChallengeButton()` - When challenge list loads, preloads top 3 uncompleted
2. `showChallengeInfoScreen()` - When user views a challenge, preloads that city

**Usage in `beginChallengeGame()`:**
```javascript
const preloadedData = GameState.challengeState.preloadCache?.get(challenge.id);
if (preloadedData) {
    processRoadData(preloadedData.data);  // Instant load
    ScreenCoordCache.invalidate();
} else {
    await loadRoadNetwork(location);       // Fresh fetch (3-10 seconds)
}
```

---

## Automated Hourly Challenge Creation

Challenges are created automatically via a Supabase Edge Function triggered by GitHub Actions cron.

### Edge Function: `create-hourly-challenge`
- Location: `supabase/functions/create-hourly-challenge/index.ts`
- Selects random city from curated pool (US and Global)
- Generates start/end coordinates offset from city center
- Sets 36-hour active window
- Called every hour via GitHub Actions

### GitHub Actions Workflow
- File: `.github/workflows/hourly-challenge.yml`
- Schedule: `0 * * * *` (every hour at minute 0)
- Calls the Edge Function with auth token

### City Pools
The Edge Function uses curated city pools (subset of game's cities) to ensure good Overpass API coverage:
- US cities: Major metros with reliable road data
- Global cities: International cities with good OSM coverage
- Ratio: ~2 US : 1 Global (every 3rd hour is global)

---

## Difficulty Settings

Challenges use **medium** difficulty (hardcoded in `beginChallengeGame()`):

```javascript
CONFIG.segmentDistance = {
    hard: 0.1,     // 100 meters - too restrictive for challenges
    medium: 0.2,   // 200 meters - used for challenges
    easy: 0.5      // 500 meters
};
```

The difficulty controls how far users can click from their current position.

---

## Important Implementation Details

### Click Radius Indicator
The orange circle showing valid click area must render even with just 1 node (the start):
```javascript
// In redrawUserPath()
if (GameController.phase === GamePhase.PLAYING && GameState.userPathNodes.length >= 1) {
    renderClickRadiusIndicator(ctx, time);
}
```

### Timer Fairness
Timer starts on **first user click**, not when map loads:
```javascript
// In handlePathClick()
if (GameState.gameMode === 'challenge' && !GameState.challengeState.startTime) {
    GameState.challengeState.startTime = Date.now();
}
```

### One Attempt Enforcement
- `fetchUserChallengeEntries()` checks if user has already completed
- `userEntries` Map tracks completed challenges
- UI shows "Completed" badge and score for finished challenges

---

## Common Issues & Solutions

### Issue: Clicks don't register
**Cause:** `redrawUserPath()` was returning early with 1 node, so click radius indicator wasn't showing.
**Fix:** Render click radius before the early return.

### Issue: Same city loads repeatedly
**Cause:** `activeChallenge` wasn't being cleared between challenges.
**Fix:** `resetChallengeState()` called in `exitChallengeMode()` and `goToNextChallenge()`.

### Issue: Challenge auto-completes without user input
**Cause:** Old code called `runChallengeVisualization()` which auto-played A*.
**Fix:** Removed auto-play, now calls `enableDrawing()` and waits for user.

---

## Future Improvements

- [ ] Weekly challenges with multiple attempts (best score counts)
- [ ] Challenge categories (speed run, accuracy, etc.)
- [ ] Friend challenges / custom challenges
- [ ] Replay system to watch top players' routes
- [ ] Achievement badges for challenge milestones

---

## Related Files

| File | Contents |
|------|----------|
| `game.js` | All challenge client-side logic (~lines 10000-11000) |
| `auth.js` | Supabase client, user authentication |
| `styles.css` | Challenge UI styling (search "challenge") |
| `supabase/functions/create-hourly-challenge/` | Automated challenge creation |
| `supabase/migrations/012_hourly_challenges.sql` | Database schema |
| `.github/workflows/hourly-challenge.yml` | Cron job for hourly creation |
