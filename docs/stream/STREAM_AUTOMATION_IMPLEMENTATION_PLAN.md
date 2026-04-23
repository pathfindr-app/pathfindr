# Pathfindr 24/7 Interactive YouTube Stream Automation Plan

Status: Draft v1  
Date: 2026-02-09  
Owner: Pathfindr

## 0) Current Execution Status

Deployment decision:

- VPS-first (selected). No always-on local machine available right now.

In-progress blockers owned outside code:

- YouTube live activation waiting period must complete before first stream key can be used.
- Supabase service credentials still need to be finalized in runtime environment.
- OBS scene/profile and reconnect behavior still need to be configured on VPS host.

Important note:

- Stream stack can run now without Supabase credentials. Supabase is treated as optional backend until secrets are available.

External setup tracker (must continue in parallel with coding):

- [ ] YouTube: complete live activation window, create persistent stream setup, verify stream key flow
- [ ] YouTube: complete YPP/Supers eligibility path (when available)
- [ ] Supabase: confirm `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` in runtime secrets
- [ ] OBS: configure 24/7 scene, auto reconnect, audio chain, and test failover
- [ ] VPS: harden host (auto-start services, restart policy, monitoring hook)

Code progress completed in repo:

- stream-mode boot flags in renderer (`game.js`)
- stream backend switch in renderer query params:
  - `streamBackend=local` (default, uses VPS `/api/*`)
  - `streamBackend=supabase` (uses Supabase Edge Functions)
- runtime stream API server for VPS (`scripts/stream-server.js`)
  - `GET /api/next-city`
  - `POST /api/requests`
  - `POST /api/stream-state`
  - `GET /api/stream-state`
  - `GET /api/queue`
  - `GET /api/stats`
  - optional `STREAM_PAID_ONLY=true` enforcement for monetized queue mode
- YouTube chat ingest worker (`scripts/youtube-chat-worker.js`)
  - OAuth refresh token flow
  - live chat polling + request parsing (`!city ...`)
  - paid priority handling for Super Chat/Super Sticker events
- OBS overlay page (`stream-overlay.html`) polling stream state endpoint
- Browser admin panel (`stream-admin.html`) for queue operations (enqueue/remove/promote/clear)
- Stream watchdog (`scripts/stream-watchdog.js`) for automatic recovery checks
- YouTube worker launcher (`scripts/youtube-worker-launcher.js`)
  - keeps service healthy when YouTube creds are missing
  - auto-starts worker once creds are added
- shared `.env.local` loader for stream scripts (`scripts/lib/load-env.js`)
- Supabase queue schema migration (`supabase/migrations/015_stream_requests.sql`)
- Supabase Edge Functions:
  - `supabase/functions/stream-queue-request`
  - `supabase/functions/stream-queue-next`
  - `supabase/functions/stream-state`
- npm scripts:
  - `npm run start:stream`
  - `npm run start:chat`
  - `npm run start:watchdog`
  - `npm run start:stream:all`
  - `npm run setup:stream`
  - `npm run setup:youtube`
  - `npm run deploy:stream:functions`
- env template:
  - `.env.stream.example`
- non-dev runbook:
  - `docs/stream/STREAM_VPS_QUICKSTART.md`
- process config:
  - `ecosystem.config.cjs` (PM2 auto-restart profile)
  - includes `.env.local` loading for all stream services

## 1) Objective

Build a fully automated 24/7 YouTube live stream for Pathfindr Visualizer that:

- runs continuously with auto-recovery
- accepts viewer location requests from live chat
- prioritizes paid requests (Super Chats) fairly and transparently
- displays clear branding + app funnel CTA
- plays licensed background music without manual operator work

## 2) Scope

In scope:

- stream automation, orchestration, monitoring, and restart logic
- chat ingestion and request queueing
- request-to-city handoff into the existing visualizer loop
- music playback pipeline and rights workflow
- moderation and abuse protection

Out of scope (for MVP):

- fully custom payment system off YouTube
- lottery/sweepstakes style winner selection
- multi-platform streaming (Twitch/TikTok) in first release

## 3) Current Code Hooks (already in repo)

Primary integration points:

- visualizer start/loop/next city: `game.js` (`startVisualizerMode`, `runVisualizerLoop`, `loadNextVisualizerCity`)
- visualizer state and cadence: `game.js` (`GameState.visualizerState`)
- mode selection and gating: `game.js` (`selectGameMode`, `checkPremiumAccess`)
- fullscreen behavior to harden for unattended operation: `game.js` (`requestVisualizerFullscreen`, `fullscreenchange` handler)
- facts ticker + HUD overlay slots: `index.html`, `styles.css`

## 4) Target Architecture

```mermaid
flowchart LR
  A["YouTube Live Chat"] --> B["Chat Ingest Service"]
  B --> C["Request Parser + Policy Filter"]
  C --> D["Priority Queue Engine"]
  D --> E["Stream Controller API"]
  E --> F["Pathfindr Renderer (Stream Mode)"]
  E --> G["Overlay State Service"]
  G --> H["OBS Browser Source Overlay"]
  F --> I["OBS Scene/Encoder"]
  M["Music Playlist Service"] --> I
  I --> J["YouTube RTMP Ingest"]
  K["Health Watchdog"] --> E
  K --> I
  L["Metrics + Alerts"] <-- E
  L <-- K
```

## 5) Automation Principles

- Single source of truth: queue state is persisted (local runtime store now, Supabase/Postgres later).
- Idempotent workers: all consumers safe to restart.
- Deterministic scheduling: no hidden/manual operator actions.
- Graceful degradation: if chat fails, stream still runs with random city mode.
- Auditability: every request has source, priority, and outcome recorded.

## 6) Product Rules (Viewer Requests)

Command format:

- `!city <name>` examples: `!city tokyo`, `!city seattle`

Request tiers:

- Tier 1: Super Chat/Super Sticker requests (priority queue)
- Tier 2: normal chat requests (standard queue)

Fairness policy:

- within each tier: FIFO
- weighted priority by paid tier for Tier 1
- max 1 active request per user every X minutes
- duplicate city collapse window (for example 10 minutes)

On-screen transparency:

- show `NOW PLAYING: <city>` and `Requested by @user`
- show `QUEUE: <n> pending`
- publish rules in channel description and pinned message

## 7) Build Walkthrough (Implementation Sequence)

### Phase A - Stream Mode in Renderer (MVP foundation)

Goal: app can boot directly into unattended visualizer mode.

Tasks:

- add stream query flags in `game.js`:
  - `stream=1`
  - `autostart=visualizer`
  - `streamNoEscExit=1`
  - `streamHideUI=1`
- bypass splash/menu when `stream=1`
- disable fullscreen-exit side effects for unattended mode
- add remote city override hook:
  - poll `/api/next-city`
  - if none, continue random city behavior
- add overlay data endpoint push:
  - current city
  - requester
  - queue depth
  - uptime

Acceptance criteria:

- app starts in visualizer without user click
- no accidental exits from ESC/mouse movement
- can receive and apply externally queued city

### Phase B - Queue + Chat Ingestion Service

Goal: fully automated request intake from YouTube chat.

Components:

- `services/chat-ingest` (Node)
- `services/queue-api` (Node or Supabase Edge)

Data model (minimum):

- `stream_requests`:
  - `id`
  - `platform` (`youtube`)
  - `message_id` (unique)
  - `user_id`, `display_name`
  - `request_text`, `normalized_city`
  - `priority_tier` (`paid` / `free`)
  - `priority_score`
  - `status` (`queued` / `accepted` / `rejected` / `played` / `expired`)
  - `source_amount_micros`, `source_currency`
  - `created_at`, `played_at`
- `stream_state`:
  - `id=singleton`
  - `current_city`
  - `current_request_id`
  - `queue_depth_paid`
  - `queue_depth_free`
  - `updated_at`

Parsing and policy:

- accept only `!city ...`
- sanitize and normalize location string
- reject invalid/blocked terms
- geocode to supported city object or nearest known target

Acceptance criteria:

- live chat commands enter queue in under 3 seconds
- paid events are detected and prioritized correctly
- dedupe and rate limits enforced

### Phase C - Stream Controller + Playback Orchestration

Goal: no manual operation during stream runtime.

Tasks:

- create `services/stream-controller`:
  - chooses next request from queue
  - writes next city payload for renderer
  - marks request lifecycle transitions
- integrate with OBS:
  - scene health check
  - stream state polling
  - auto reconnect on drop
- add fallback mode:
  - if queue empty, random city autoplay
  - if APIs fail, continue visualizer locally

Acceptance criteria:

- continuous city transitions for 24h with no operator action
- stream recovers from service restarts without losing queue state

### Phase D - Moderation + Safety

Goal: safe request system for public chat.

Tasks:

- blocklist and regex filters
- per-user cooldown
- max queue length per tier
- optional auto-ban/escalation hooks
- moderator override endpoint:
  - skip request
  - force city
  - clear abusive burst

Acceptance criteria:

- abusive spam does not stall queue
- moderators can override in under 10 seconds

### Phase E - Production Reliability

Goal: true 24/7 reliability.

Tasks:

- process supervision (pm2/systemd/launchd)
- heartbeat watchdog (renderer, queue API, OBS, RTMP status)
- auto restart policy:
  - worker crash restart
  - browser stale-frame refresh
  - OBS reconnect
- alerting:
  - Discord/Slack webhook on critical incidents
  - daily uptime report

Acceptance criteria:

- 7-day soak test with >= 99% uptime
- mean time to recover < 2 minutes for single-service failure

## 8) Music Plan (Automated + Rights-Safe)

### Music architecture

- background playlist service outputs to OBS audio input
- loop with crossfade
- optional sidechain/ducking for SFX moments
- loudness target for stable live output

### Source strategy

Primary lane:

- Suno-generated tracks in a curated internal catalog

Fallback lanes:

- YouTube Creator Music licensed tracks
- YouTube Audio Library tracks where applicable

### Suno workflow (practical)

- generate tracks under paid plan only (commercial rights for tracks made while subscribed)
- store provenance metadata per track:
  - track ID
  - generation date
  - account/plan status
  - prompt and edits
- export and normalize masters
- run automated content-ID precheck on private/unlisted test stream
- only promote tracks to production playlist after pass

Important rights note:

- commercial rights and ownership claims can vary by plan and terms updates
- copyright registration/protectability for AI outputs may still be limited or jurisdiction-dependent
- keep a dated rights log for each production track

## 9) Compliance + Policy Checklist (pre-launch)

- YouTube Partner Program and fan-funding eligibility confirmed
- clear public rules for paid priority (not chance-based)
- no lottery/sweepstakes mechanics without legal review
- rights evidence attached for every music asset
- moderation policy documented for chat abuse
- privacy policy update for chat data handling and retention

## 10) Operational Runbook

Start-of-day (automated):

- validate YouTube live status + chat ID
- validate queue DB connectivity
- validate renderer heartbeat
- validate OBS encoding and dropped frames
- validate music source available

Self-healing actions:

- if chat ingest fails: restart ingest worker, continue autoplay mode
- if renderer stalls: refresh browser source
- if OBS disconnects: reconnect stream, preserve queue state
- if queue corrupts: fail closed to random city mode

Human escalation:

- page on-call only after N failed automatic recoveries in M minutes

## 11) Milestones and Timeline

Week 1:

- Phase A complete
- stream-mode local dry run

Week 2:

- Phase B complete
- private live test with real chat

Week 3:

- Phase C + D complete
- 24h unattended soak test

Week 4:

- Phase E complete
- 7-day reliability test
- public launch

## 12) Concrete Deliverables

Code:

- stream mode flags + city override in `game.js`
- new services: `chat-ingest`, `queue-api`, `stream-controller`
- overlay widget in `index.html` + `styles.css`

Infra:

- process manager config
- restart/watchdog scripts
- alert webhook config

Ops docs:

- incident runbook
- moderation playbook
- music rights ledger template

## 13) Launch KPIs

- uptime %
- average request-to-play latency
- chat request volume/hour
- paid-to-free request ratio
- app CTA click-through rate
- stream watch time and concurrent viewers

## 14) Next Decisions Needed

- choose deployment target:
  - dedicated local machine
  - cloud GPU VM
- choose queue backend:
  - Supabase (recommended, already in project)
  - separate Postgres/Redis
- lock paid-priority rule set:
  - tier mapping
  - cooldown durations
  - max queue share per user

---

## Source Snapshot (for policy/API assumptions)

Verified on 2026-02-09:

- YouTube `liveChatMessages.streamList` low-latency streaming endpoint and reconnect via `nextPageToken`: https://developers.google.com/youtube/v3/live/docs/liveChatMessages/streamList
- YouTube `liveChatMessage` types (`superChatEvent`, `superStickerEvent`): https://developers.google.com/youtube/v3/live/docs/liveChatMessages
- YouTube `superChatEvents.list` details: https://developers.google.com/youtube/v3/live/docs/superChatEvents
- YouTube `liveBroadcast.snippet.liveChatId` lookup: https://developers.google.com/youtube/v3/live/docs/liveBroadcasts
- YouTube Data API quota baseline reference: https://developers.google.com/youtube/v3/determine_quota_cost
- YouTube Super Chat availability/eligibility policy: https://support.google.com/youtube/answer/9277801?hl=en
- YouTube contest policy reference (for avoiding chance-based mechanics): https://support.google.com/youtube/answer/1620498?hl=en
- Suno ownership/commercial-use Help Center article: https://help.suno.com/en/articles/2416769
- Suno commercial-use explanation: https://help.suno.com/en/articles/9601985
- Suno Terms of Service: https://about.suno.com/terms
