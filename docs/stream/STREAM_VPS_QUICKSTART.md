# Pathfindr Stream VPS Quickstart (Non-Dev)

Use this now for VPS setup, even if YouTube live is still in cooldown.

## 1) One-time setup

1. Put project on VPS.
2. Run:

```bash
npm install
npm run setup:stream
```

This guided prompt saves config to `.env.local`.
Choose:

- `STREAM_BACKEND_MODE=local` (recommended now)
- `STREAM_ENABLE_YT_WORKER=false` until YouTube live + OAuth are ready
- `STREAM_PAID_ONLY=true` when you want pay-to-see behavior only

If you set `STREAM_QUEUE_API_KEY`, it protects write endpoints from random internet spam.

## 2) YouTube OAuth helper

If YouTube live is still in cooldown, skip this section for now.

Run:

```bash
npm run setup:youtube
```

The script prints a Google URL, waits for approval, and saves `YT_REFRESH_TOKEN` automatically.

## 3) Start stream automation services

```bash
npm run start:stream:all
```

This starts:

- stream API server (`/api/next-city`, `/api/requests`, `/api/stream-state`)
- YouTube worker launcher (waits until credentials are ready, then runs chat ingest automatically)
- watchdog (auto-restart trigger if health checks fail repeatedly)

Production process manager option (recommended on VPS):

```bash
npm run start:pm2
pm2 save
pm2 startup
```

When YouTube is ready later:

1. run `npm run setup:stream` and set `STREAM_ENABLE_YT_WORKER=true`
2. run `npm run setup:youtube` to store refresh token
3. restart services (`pm2 restart ecosystem.config.cjs` or rerun `npm run start:stream:all`)

## 4) Open visualizer URL for streaming

Use this in browser/OBS:

```text
http://<your-vps-or-domain>:3000/?stream=1&autostart=visualizer&streamNoEscExit=1&streamHideUI=1
```

Optional Supabase backend mode (only after Supabase functions + secrets are ready):

```text
http://<your-vps-or-domain>:3000/?stream=1&autostart=visualizer&streamBackend=supabase&streamNoEscExit=1&streamHideUI=1
```

Overlay source for OBS (browser source):

```text
http://<your-vps-or-domain>:3000/stream-overlay.html
```

Admin panel (queue controls in browser):

```text
http://<your-vps-or-domain>:3000/stream-admin.html
```

If you configured `STREAM_QUEUE_API_KEY`, enter it in the admin page once and it is saved in browser local storage.

## 5) Test queue manually

```bash
curl -X POST http://127.0.0.1:3000/api/requests \
  -H 'Content-Type: application/json' \
  -d '{"city":"Tokyo, Japan","requestedBy":"@manual","priority":1}'
```

## 6) Health checks

- `GET /api/health`
- `GET /api/queue`
- `GET /api/stream-state`
- `GET /api/stats`
