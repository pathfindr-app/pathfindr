# Pathfindr Marketing Plan

*Created: January 2026*
*Status: Pre-Launch (Alpha)*

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [The Game](#the-game)
3. [Origin Story](#origin-story)
4. [Target Demographics](#target-demographics)
5. [Genre Positioning](#genre-positioning)
6. [Marketing Strategy](#marketing-strategy)
7. [Revenue Model & Projections](#revenue-model--projections)
8. [App Store Optimization](#app-store-optimization)
9. [The Economics of Game Ads](#the-economics-of-game-ads)
10. [Acquisition Considerations](#acquisition-considerations)
11. [Action Plan & Timeline](#action-plan--timeline)
12. [Full Interview Transcript](#full-interview-transcript)

---

## Executive Summary

**Pathfindr** is a browser/mobile game where players draw routes on real-world maps and compete against the A* pathfinding algorithm. The game exists at the intersection of puzzle gaming, geography exploration, and algorithm visualization—wrapped in a distinctive neon cyberpunk aesthetic.

**The Opportunity:** A viral A* visualization video has 2.8 million views and is still growing. Pathfindr inserts the player directly into that satisfying moment, turning passive watching into active competition.

**The Strategy:** Engineer one viral moment through organic content (Reddit, TikTok, X), capture users with a polished product, prove monetization, then scale.

**Budget:** $100/month initially, reinvest revenue aggressively
**Time Commitment:** 10 hours/week on marketing

---

## The Game

### Core Loop
1. Player sees START (green) and END (pink) markers on a real-world map
2. Player draws what they think is the shortest route by clicking along roads
3. When the route reaches END, the A* algorithm visualizes its exploration
4. Player is scored on efficiency (how close to optimal)
5. 5 rounds per game, cumulative scoring

### Game Modes
- **Competitive Mode (Free):** Standard 5-round tournament with progressive difficulty
- **Explorer Mode (Premium):** Free-roam, place custom markers anywhere
- **Visualizer Mode (Premium):** Passive cinematic mode, watch A* solve random routes

### Technical Foundation
- Real OpenStreetMap road data via Overpass API
- 50+ cities worldwide (25 US, 25 Global)
- Leaflet.js mapping with custom Canvas overlays
- WebGL-accelerated visualization effects
- Web Audio API synthesized sounds

### The Pitch (Options)
- "Draw what you think is the shortest route. Then watch the algorithm show you what optimal actually looks like."
- "Can you out-navigate a GPS?"
- "GeoGuessr meets pathfinding. You vs. the algorithm."

---

## Origin Story

> *"I saw a video of the A* algorithm that went viral on Reddit—it has 2.8 million views on YouTube now. What struck me was that part of the appeal is guessing what the final route would be. I thought: what if we inserted the human directly into that moment?*
>
> *I'm not a developer. I'm an underwater photographer from Maui. But I built this entire game with AI—specifically Claude—over months of iteration. I went from Blender scripts to React (too many state problems) to Unity (too complex) to finally vanilla JavaScript that actually worked.*
>
> *This project represents stability I'm looking for in my life. I left Maui, went to North Carolina, recorded a music album with a friend, found healing, came back, and kept building. Despite not knowing how to write code, I shipped it anyway."*

**Why this matters for marketing:** The origin story is authentic, relatable, and demonstrates the democratization of game development through AI. This is marketable.

---

## Target Demographics

### Primary Segments

| Segment | Age | Platforms | Why They'll Play | Messaging |
|---------|-----|-----------|------------------|-----------|
| **Casual Mobile Gamers** | 18-45 | iOS, Android, TikTok | Quick sessions, satisfying visuals | "5 rounds, real cities, beat the algorithm" |
| **Puzzle/Strategy Fans** | 25-40 | Reddit, X, Steam-curious | Skill expression, no RNG | "Pure skill, satisfying visualization" |
| **Data Viz / Algorithm Nerds** | 20-35 | Reddit, HN, X | Watching A* is inherently satisfying | "Watch A* explore real street networks" |
| **Geography Enthusiasts** | 25-50 | Reddit, YouTube, GeoGuessr audience | Real-world maps, city exploration | "Play in your city or explore the world" |
| **Older Generation** | 50-70 | Facebook | Map nostalgia, spatial reasoning pride | "Remember reading maps? Prove you still can." |
| **Chill/Study Crowd** | 16-30 | TikTok, YouTube, Spotify listeners | Ambient, relaxing, background content | "Algorithm ASMR for your second monitor" |

### Secondary Segments
- CS students/educators (algorithm learning)
- GIS professionals (real-world spatial data)
- People who say "everything is made by AI now" (the AI-built angle)
- Parents looking for "games that aren't trash" for kids

### Who Has Responded Well (Early Feedback)
- "Wow, this looks really cool" (visual impact)
- Dads saying "my kid would like this"
- People who enjoy GeoGuessr

### Who Hasn't Connected
- Non-gamers who "don't get it"
- People who don't do relaxing/puzzle games

---

## Genre Positioning

Pathfindr sits at a unique intersection:

```
        PUZZLE GAMES              EDUCATIONAL GAMES
        (Tetris, 2048)            (Brilliant, Duolingo)
              \                        /
               \                      /
                \    PATHFINDR       /
                 \       *          /
                  \     / \        /
                   \   /   \      /
                    \ /     \    /
        AESTHETIC           GEO/EXPLORATION
        EXPERIENCES         GAMES
        (Geometry Wars,     (GeoGuessr,
         Rez Infinite)       Google Earth)
```

### Comparable Titles
| Game | What They Do Well | How Pathfindr Differs |
|------|-------------------|----------------------|
| **GeoGuessr** | Real-world geography as gameplay | Routes, not locations; algorithm competition |
| **Mini Metro** | Minimalist transit puzzle, beautiful | Real cities, not abstracted; competitive scoring |
| **Wordle** | Shareable results, simple mechanic | Visual spectacle, skill-based not luck |
| **Geometry Wars** | Neon aesthetic as identity | Geography-based, not arena shooter |
| **Flow Free** | Path-drawing puzzle mechanics | Real maps, algorithm visualization |

### Differentiation
- **No other maze game uses real-world streets**
- **The A* visualization is uniquely beautiful**
- **Human intuition vs. mathematical optimization is a compelling narrative**

---

## Marketing Strategy

### Philosophy
No budget for traditional marketing. Engineer one viral moment. Be ready to capture it.

### What We're Doing
1. **Organic content creation** (TikTok, Reels, Reddit, X)
2. **Community engagement** (Reddit threads, comments, genuine participation)
3. **Strategic Reddit posts** (r/oddlysatisfying, r/dataisbeautiful, r/MapPorn, r/gamedev)
4. **Volume on TikTok** (1-2 clips per day, lottery ticket approach)

### What We're NOT Doing
- Paid ads (until something works organically)
- "Building in public" indie dev Twitter persona
- Cold outreach to influencers
- Complex funnels or landing pages
- Over-polishing before launch

### Platform Strategy

| Platform | Content Type | Frequency | Goal |
|----------|--------------|-----------|------|
| **TikTok/Reels** | 15-sec gameplay clips, algorithm explosions | 1-2/day | Viral lottery tickets |
| **Reddit** | Raw visualizations, "I made this" posts | 2-3/week | Community discovery |
| **X (Twitter)** | Clips, minimal caption, no hashtags | 3-5/week | Tech/gaming audience |
| **YouTube** | Longer gameplay, maybe dev story later | 1/week | Evergreen discovery |
| **Facebook** | Older demographic content, later | Post-mobile | Map nostalgia angle |

### Content Pillars

**Pillar 1: Human vs. Algorithm**
- Compare player routes to A* solutions
- "This player was only 3% off optimal"
- The David vs. Goliath narrative

**Pillar 2: City Showcase**
- Beautiful clips of different cities (Tokyo neon, NYC grid, Paris chaos)
- "Play in YOUR city" localized content
- Geography enthusiast appeal

**Pillar 3: The Visualization**
- Raw A* exploration animations
- ASMR-style compilations
- Satisfying content for its own sake

**Pillar 4: Aesthetic Experience**
- Lean into Blade Runner vibes
- Synth-wave audio clips
- "Cyberpunk city navigation" framing

### Brand Voice
- **Professional, not "indie dev Twitter"**
- **Let the game speak for itself**
- **No revenue updates, no building-in-public cringe**
- **Appear on camera when it makes sense, but not the center of attention**

---

## Revenue Model & Projections

### Monetization Structure

| Tier | Price | What's Included |
|------|-------|-----------------|
| **Free** | $0 | Competitive mode (5 rounds), ads between rounds |
| **Premium** | $2.99 (lifetime) | Explorer mode, Visualizer mode, no ads |

### Revenue Streams
1. **Interstitial ads** (after each round for free users)
2. **Premium purchases** ($2.99 one-time)
3. *(Future: visual packs, subscriptions, etc.)*

### Projections at 50,000 Downloads

| Scenario | Conversion Rate | Premium Rev (Net) | Ad Revenue | **Total** |
|----------|-----------------|-------------------|------------|-----------|
| **Low** | 1.5% | $1,570 | $985 | **$2,555** |
| **Medium** | 3.5% | $3,663 | $1,737 | **$5,400** |
| **High** | 6% | $6,279 | $3,008 | **$9,287** |
| **Best Case** | 10% | $10,465 | $5,400 | **$15,865** |

*Assumes 30% platform cut (could be 15% under small business programs)*

### Revenue Per Download

| Scenario | Revenue Per User |
|----------|------------------|
| Low | $0.05 |
| Medium | $0.11 |
| High | $0.19 |
| Best | $0.32 |

**Implication:** If revenue per user exceeds $0.50, paid acquisition becomes viable.

### Scaling Projections

| Downloads | Low Est. | Medium Est. | High Est. |
|-----------|----------|-------------|-----------|
| 10,000 | $500 | $1,100 | $1,900 |
| 50,000 | $2,555 | $5,400 | $9,287 |
| 100,000 | $5,100 | $10,800 | $18,574 |
| 500,000 | $25,500 | $54,000 | $92,870 |
| 1,000,000 | $51,000 | $108,000 | $185,740 |

---

## App Store Optimization

### Pre-Launch Checklist

- [ ] **App name includes keywords** (e.g., "Pathfindr: Route Puzzle & Maps")
- [ ] **Subtitle optimized** for search terms
- [ ] **100-character keyword field** filled (iOS) - no spaces after commas
- [ ] **10 screenshots** - first one is the hook (algorithm explosion, not menu)
- [ ] **15-30 second preview video** showing core gameplay
- [ ] **Icon tested at small sizes** (must be recognizable at 30x30px)
- [ ] **Description** with hook in first 2 sentences
- [ ] **Category selected** strategically (Games > Puzzle)
- [ ] **In-app review prompt** triggers after Round 5 completion
- [ ] **Share functionality** for scores

### Keyword Strategy

**High potential keywords:**
- maze game
- map game
- geography game
- route puzzle
- algorithm game
- pathfinding
- brain game

**Sample keyword field (iOS, 100 chars):**
```
maze,geography,algorithm,navigation,brain,teaser,strategy,cities,roads,shortest,path,route,puzzle
```

### What Gets You Featured

- High-quality, polished app (no crashes)
- Using new platform features
- Unique concept (you have this)
- Good story behind it (you have this)
- Apply: developer.apple.com/app-store/promote/

---

## The Economics of Game Ads

### Ad Types & Payouts

| Ad Type | Description | Typical eCPM |
|---------|-------------|--------------|
| **Banner Ads** | Small, always visible | $0.50 - $2 |
| **Interstitial** | Full-screen between rounds | $4 - $15 |
| **Rewarded Video** | User opts in for reward | $10 - $40 |

*eCPM = earnings per 1,000 impressions*

### Factors That Affect eCPM
- **Country:** US/UK pays 5-10x more than India/Brazil
- **Platform:** iOS > Android > Web
- **Ad network:** AdMob, Unity Ads, IronSource vary
- **Engagement:** Higher retention = better rates

### User Acquisition Economics

| Platform | Typical CPI (Cost Per Install) |
|----------|-------------------------------|
| Facebook/Instagram | $1.50 - $4.00 |
| TikTok | $1.00 - $3.00 |
| Google Ads | $1.00 - $2.50 |
| Apple Search Ads | $2.00 - $5.00 |

**The equation:** LTV (Lifetime Value) must exceed CPI for paid ads to work.

**Current reality:** Without proven LTV, paid acquisition is not viable. Focus on organic.

---

## Acquisition Considerations

*Note: Decision made to ship independently rather than sell.*

### If Revisited Later

**Potential acquirers:**
- GeoGuessr (complementary product)
- Mapbox (maps + gaming showcase)
- Niantic (location-based gaming)
- Apple Arcade (exclusive game deals)
- Educational platforms (Brilliant, etc.)

**Valuation factors:**
- 0 users/revenue = idea + code only = $10-50K if any interest
- 50K users + $5K revenue = $50-150K realistic
- 500K+ users = meaningful acquisition target

**Best leverage:** Launch first, prove traction, then approach.

---

## Action Plan & Timeline

### Phase 1: Alpha Test (Now → 2 Weeks)

- [ ] Ship alpha to 10-15 trusted testers
- [ ] Collect feedback on first 30 seconds, confusion points
- [ ] Fix critical issues only
- [ ] Record 5-10 gameplay clips (Tokyo, NYC, Paris, London, hometown)
- [ ] Get screen recording setup (OBS or browser-based)

### Phase 2: Content Prep (Week 2-3)

- [ ] Edit clips: 15-sec for TikTok/Reels, 30-sec for X/Reddit
- [ ] Raw gameplay, maybe lo-fi music, no narration yet
- [ ] Create THE hook clip: draw → algorithm explodes → score
- [ ] Set up accounts: TikTok, Instagram, X (lurk first on Reddit)

### Phase 3: Launch Push (Week 3-4)

- [ ] Reddit: Post visualization to r/oddlysatisfying or r/dataisbeautiful (no link)
- [ ] Respond naturally when people ask "what is this"
- [ ] TikTok/Reels: 1-2 clips per day for 2 weeks
- [ ] X: Clips with minimal caption
- [ ] Coordinate launch day: everything drops, everyone you know downloads

### Phase 4: Capture & Iterate

- [ ] Landing page ready with "Play Now" + mobile waitlist
- [ ] Track metrics: rounds per user, return rate, premium conversion
- [ ] Respond to comments, learn what resonates
- [ ] If traction appears, boost with $100 budget

### Weekly Rhythm (10 Hours)

| Day | Task | Hours |
|-----|------|-------|
| Monday | Record 2-3 new gameplay clips | 2 |
| Tuesday | Edit clips, post to TikTok/Reels | 1.5 |
| Wednesday | Reddit engagement, relevant threads | 1.5 |
| Thursday | Post to X, respond to traction | 1 |
| Friday | Write longer-form content | 2 |
| Weekend | Review analytics, adjust | 2 |

### Success Metrics

| Timeframe | Goal |
|-----------|------|
| Alpha (2 weeks) | 15 testers, critical bugs fixed, 5 clips ready |
| Launch month | 1,000 organic users, measure retention |
| Month 2-3 | 10,000 users, first premium revenue |
| Month 6 | 50,000 users, clear LTV data |
| Year 1 | 100,000+ users, $10K+ revenue |

---

## Full Interview Transcript

### Section 1: Origin & Vision

**Why did you build Pathfindr?**

> I saw a video of the A* algorithm on Reddit that went viral—2.8 million views on YouTube now. I got interested because the tool used was Blender, which I knew. I tried to recreate it with Claude, originally planning to sell it as a Blender marketplace tool.
>
> Over time I realized the real appeal was guessing what the final route would be. What if we inserted the human directly into that moment? It took a long time—tried React (state management nightmares), Unity (too complex)—but finally got here with vanilla JS and AI assistance.

**What does success look like in 6 months?**

> Capturing some of that original virality. Even 1,000 paying customers would be life-changing. I think this could be a top-of-App-Store thing with the right post at the right time.

**What does success look like in 2 years?**

> Expand game modes, take community feedback, make it more accurate. Maybe VR/AR eventually. See how far this can be pushed.

**Is this a side project or serious business?**

> Serious business attempt. I need this to give me stability. I've been through a lot—left Maui, went to NC, recorded a music album, found healing, came back to finish this. I believe in it. I haven't given up despite not knowing how to code.

### Section 2: Resources & Constraints

**Marketing budget?**

> Zero to start. Maybe $100/month. Once revenue comes in, reinvest aggressively.

**Time available?**

> 10 hours per week throughout the week.

**Skills you have?**

> Video editing, writing, some social media, public speaking. Not afraid of camera.

**Skills you need help with?**

> I need someone to say "do this, do this, do this" and keep me on track. That's what I need AI for.

**Existing audience?**

> None really. Have emails from other businesses but want to find the Pathfindr audience organically.

### Section 3: Brand & Positioning

**One-sentence description?**

> Still hard—essentially a game where you see two points on a real map and guess the shortest distance. Score based on how close to the algorithm.

**Games/brands you admire?**

> GeoGuessr—one of the few games I've played multiple times and subscribed to.

**What you DON'T want?**

> SaaS bro, business startup Twitter vibes. Want to be professional. Let the game speak for itself. Not some indie dev posting monthly revenue updates.

**Is the aesthetic locked in?**

> Could evolve over time. Could offer different visual packs. Maybe more female-friendly versions later. But for v1, sticking with what we have.

### Section 4: Target Audience

**Who do you imagine playing?**

> Wide range. Older generation on Facebook who remember maps. Data visualization enthusiasts. GIS world. Younger generation looking for something relaxing. Casual mobile gamers. People like me who occasionally browse the app store for something interesting.

**Early feedback?**

> "Wow this looks cool." Some dads saying their kids would like it. Some people just don't get it (typically non-gamers).

**Educational angle important?**

> Not about teaching the algorithm. Want the map to educate about geography, landmarks, history. Keep the algorithm magic behind the curtain.

### Section 5: Platforms & Channels

**Where are you active?**

> X and Reddit mostly. Off Instagram lately.

**What platforms will you use?**

> Facebook, TikTok, Instagram, X, Reddit. Not refusing anything.

**Comfortable on camera?**

> Yes.

**Press/influencer connections?**

> None really. Coming out of left field. Background is underwater photography for 10 years.

### Section 6: Competition & Differentiation

**Competitors?**

> Maze games exist with lots of downloads but none use the real world. GeoGuessr is adjacent but different mechanic.

**What makes Pathfindr different?**

> Real-world streets as mazes. The visualization is uniquely beautiful. No maze game looks like this.

### Section 7: Current State

**Where is the game now?**

> Nearly alpha-ready. 3 days from shipping to 10-15 testers. Web first, mobile coming soon.

**Marketing tried?**

> Nothing yet. No users.

**Biggest obstacle?**

> Penetrating the noise. Social media is hard. Easy to get banned. Feels like pay-to-play.

### Section 8: Wild Cards

**Anything unique about you/project?**

> Built entirely with AI despite not being a developer. Underwater photographer. Left Maui, recorded a music album, came back to finish this.

**Unlimited budget dream?**

> Five more geospatial games. First cartographers to reach billions. Gather data, map a better world.

**Most proud of?**

> That I didn't give up. That it's actually about to ship.

---

## Final Notes

**The Mindset:**

You're not competing with Candy Crush's budget. You're engineering one moment where the right clip hits the right audience at the right time. Everything else is preparation.

The visualization is your weapon. It's inherently shareable. Use it.

**The Commitment:**

> "This is my baby for good or mediocre. Either way we are finishing it and shipping."

---

*Document created during marketing strategy session, January 2026.*
*For questions or updates, continue this conversation.*
