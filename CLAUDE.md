# Pathfindr - AI Context Document

## What Is This?

Pathfindr is a browser-based game where players draw routes on real-world maps and compete against the A* pathfinding algorithm. The game has a distinct **Blade Runner / cyberpunk aesthetic** with neon colors, organic electricity effects, and synth-wave audio.

## Core Gameplay Loop

1. **Location Selection** - Player chooses to play in their local area (GPS), random US cities, or global cities
2. **Route Drawing** - Player clicks on the map to draw what they think is the shortest path between START (green) and END (pink) markers
3. **A* Visualization** - When the route reaches the end, the A* algorithm runs with a stunning visual exploration animation
4. **Scoring** - Player is scored based on how close their route is to the optimal path (efficiency percentage)
5. **5 Rounds** - Game consists of 5 rounds, with cumulative scoring and persistent visualization of previous rounds

## Technical Stack

- **Leaflet.js** - Map rendering with OpenStreetMap tiles
- **Overpass API** - Fetches real road network data for the current viewport
- **Canvas API** - All custom rendering (roads, paths, effects) on overlay canvases
- **Web Audio API** - Synthesized sounds and WAV file playback

## Key Files

- `game.js` - All game logic (~4500 lines)
- `styles.css` - Blade Runner themed UI
- `index.html` - Minimal HTML structure
- `Scanning1.wav`, `Found1.wav` - Audio effects

## Architecture Highlights

### State Management
- `GameState` object holds all game state (map, nodes, edges, paths, visualization state)
- `ScreenCoordCache` - Caches screen coordinates for edges to avoid recalculating every frame
- `RoundHistory` - Stores completed round data for persistent visualization across all 5 rounds

### Road Network
- Nodes stored in `Map<nodeId, {lat, lng}>`
- Edges stored in `Map<nodeId, Array<{neighbor, weight}>>`
- `edgeList` array for iteration, `edgeLookup` Map for O(1) edge access by key
- Edge keys formatted as `"minNodeId-maxNodeId"` for consistency

### Visualization Systems

1. **AmbientViz** - Ambient particles and effects during gameplay
2. **ElectricitySystem** - Organic electric effects (flicker, arcs, pulses)
3. **RoundHistory rendering** - Shows previous rounds with per-round colors
4. **A* Visualization** - Heat-mapped exploration with decay and frontier rendering

### Performance Optimizations

- **Coordinate caching** - `ScreenCoordCache` stores screen coords, refreshes only on map move/zoom
- **Batched rendering** - Edges grouped by heat level, drawn with single stroke() calls
- **Sprite-based glows** - Pre-rendered glow sprites instead of runtime shadowBlur
- **Heat floor** - Explored edges maintain minimum visibility (never fully fade)

## Visual Style Guide

### Colors
- **Cyan** (`#00f0ff`) - A* exploration, optimal paths
- **Orange** (`#ff6b35`) - User-drawn routes
- **Purple** (`#b829dd`) - Medium heat, explored areas
- **Pink** (`#ff2a6d`) - End marker, low heat
- **Green** (`#39ff14`) - Start marker

### Round Colors (persistent visualization)
1. Cyan
2. Magenta
3. Purple
4. Blue
5. Gold

### Effects
- Organic electricity with flicker (layered sine waves + noise)
- Energy pulses traveling along paths
- Radial gradient ambient road glow (warm center, cool edges)
- Heat decay with floor value for persistence

## Key Constants (CONFIG object)

```javascript
CONFIG.viz.heatDecay = 0.992      // Slow decay for persistence
CONFIG.viz.heatFloor = 0.15       // Minimum heat (never fully fades)
CONFIG.viz.batchSize = 4          // Nodes processed per frame during A*
CONFIG.viz.explorationDelay = 8   // ms between batches
```

## Common Tasks

### Adding new visual effects
- Use `ctx.globalCompositeOperation = 'lighter'` for additive glow
- Batch similar draws into single beginPath/stroke calls
- Use pre-rendered sprites from `AmbientViz.sprites` when possible
- Add flicker using: `0.85 + Math.sin(time * 25) * 0.05 + Math.sin(time * 7) * 0.05`

### Modifying road network loading
- `loadRoadNetwork()` handles Overpass API calls with automatic retry
- `processRoadData()` builds the node/edge graph
- Always call `ScreenCoordCache.invalidate()` after loading new data

### Working with user paths
- `GameState.userPathNodes` - Array of node IDs (snapped to roads)
- `addPointToUserPath()` - Uses micro A* to route clicks along roads
- `redrawUserPath()` - Renders with electricity animation
- Path auto-completes when user reaches END marker

## Error Handling

- Road network loading retries 3 times with exponential backoff
- Invalid paths handled gracefully (disconnected graph components tracked)
- Audio context initialized on user interaction to comply with browser policies

## Performance Notes

- Avoid per-edge stroke() calls - always batch
- `latLngToContainerPoint()` is expensive - use ScreenCoordCache
- Keep particle counts limited (`CONFIG.viz.maxParticles = 80`)
- Heat maps use Map objects for O(1) lookup

## City Facts System

The game displays interesting facts about cities during Explorer and Visualizer modes.

### Architecture
- **Wikipedia API** → **OpenAI (gpt-4o-mini)** → **Supabase PostgreSQL cache**
- Facts are fetched via Supabase Edge Function (`supabase/functions/get-city-facts/`)
- Once fetched, facts are cached permanently in the `city_facts` table

### Testing Mode (IMPORTANT!)
```javascript
CityFacts.TESTING_MODE = true;  // In game.js
```
When `TESTING_MODE` is true:
- Every city visited triggers an API call (cached locally per session)
- The Edge Function checks Supabase first; only calls Wikipedia/OpenAI if no cached facts exist
- This builds up the Supabase database with facts during testing
- Console logs track unique cities queried this session

**Goal**: By the time testing is complete, we should have a comprehensive database of facts for all US and global cities in the game.

**Set to `false` in production** to reduce unnecessary API calls.

### Relevant Files
- `game.js` - `CityFacts` module (client-side)
- `supabase/functions/get-city-facts/index.ts` - Edge Function
- `supabase/migrations/001_city_facts.sql` - Database schema

---

## Challenge Mode Architecture

Challenges are timed competitions where players compete to find the shortest route in a specific city.

### State Management (SSOT)

Challenge state follows a Single Source of Truth hierarchy:

```
GameState.gameMode === 'challenge'     // Mode is active
GameState.challengeState.activeChallenge // Current challenge object (null when not in challenge)
GameState.challengeState.startTime       // Set on first user click (for fair timing)
```

**Invariant**: If `gameMode !== 'challenge'`, both `activeChallenge` and `startTime` must be null.

The `resetChallengeState()` function is the single point for cleanup, ensuring consistency.

### Key Functions

- `beginChallengeGame(challenge)` - Sets up map, loads road network, enables drawing
- `showChallengeResults(efficiency, rank)` - Shows results with Next Challenge button
- `goToNextChallenge()` - Navigates to next uncompleted challenge
- `exitChallengeMode()` - Cleans up and returns to menu (calls `resetChallengeState()`)
- `resetChallengeState()` - Clears all challenge-specific state

### Challenge Flow

```
User clicks challenge → showChallengeInfoScreen() → beginChallengeGame()
                                                           ↓
                                                    [User draws path]
                                                           ↓
                                      handlePathClick() starts timer on first click
                                                           ↓
                                      User reaches end → submitRoute() → A* visualization
                                                           ↓
                                      calculateAndShowScore() → showChallengeResults()
                                                           ↓
                              ┌─────────────────────────────┼─────────────────────────────┐
                              ↓                             ↓                             ↓
                     "Next Challenge"              "View Leaderboard"              "Back to Menu"
                     goToNextChallenge()           showChallengeLeaderboard()      exitChallengeMode()
```

### Preloading System

To reduce wait times between challenges, road network data is preloaded in background:

```javascript
GameState.challengeState.preloadCache  // Map<challengeId, {city, data, timestamp}>
```

**Preload triggers**:
1. `updateChallengeButton()` - Preloads top 3 uncompleted challenges when list loads
2. `showChallengeInfoScreen()` - Preloads current challenge while user reads info

**Usage in `beginChallengeGame()`**:
```javascript
const preloadedData = GameState.challengeState.preloadCache?.get(challenge.id);
if (preloadedData) {
    processRoadData(preloadedData.data);  // Instant load
} else {
    await loadRoadNetwork(location);       // Fresh fetch (3-10 seconds)
}
```

### Important Notes

- Timer starts on first user click, not when map loads (fair timing)
- Challenge uses competitive mode HUD layout (`setHUDMode('competitive')`)
- When user reaches end node, `submitRoute()` handles A* visualization and scoring
- Always call `resetChallengeState()` when exiting to prevent stale references
- Click radius indicator renders even with just 1 node (start) - critical for UX
- `redrawUserPath()` is called after `enableDrawing()` to show initial click radius

---

## Git Authentication (IMPORTANT!)

Git push uses the `~/.netrc` file for authentication with GitHub. This file contains a Personal Access Token (PAT) for the `pathfindr-app` GitHub account.

### If git push fails with "Permission denied"

The token in `~/.netrc` has expired or is invalid. To fix:

1. **Go to GitHub**: https://github.com/settings/personal-access-tokens
2. **Create a new Fine-grained token**:
   - Token name: `pathfindr-push` (or similar)
   - Expiration: 30+ days
   - Resource owner: `pathfindr-app`
   - Repository access: "Only select repositories" → `pathfindr-app/pathfindr`
   - Permissions: **Contents** → "Read and write" (this is required for push)
3. **Copy the generated token** (starts with `github_pat_`)
4. **Update `~/.netrc`**:
   ```
   machine github.com login pathfindr-app password <YOUR_NEW_TOKEN>
   ```

### Current Token Info
- Token name: `pathfindr-push`
- Expires: February 22, 2026
- Permissions: Contents (read/write), Metadata (read-only)
- Repository: pathfindr-app/pathfindr only

### DO NOT
- Do not ask the user to manually push - handle authentication issues yourself
- Do not use SSH keys - this project uses HTTPS with PAT via `.netrc`

---

*This document is intended to help AI assistants understand the codebase quickly. The aesthetic is intentionally over-the-top cyberpunk - lean into the neon, the electricity, the Blade Runner vibes.*
