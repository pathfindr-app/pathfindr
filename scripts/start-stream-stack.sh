#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

if [[ -f "$ROOT_DIR/.env.local" ]]; then
  set -a
  # shellcheck disable=SC1091
  source "$ROOT_DIR/.env.local"
  set +a
fi

echo "[StreamStack] Starting stream API server..."
node scripts/stream-server.js &
STREAM_SERVER_PID=$!

echo "[StreamStack] Starting YouTube worker launcher..."
node scripts/youtube-worker-launcher.js &
YT_WORKER_PID=$!

echo "[StreamStack] Starting stream watchdog..."
node scripts/stream-watchdog.js &
WATCHDOG_PID=$!

cleanup() {
  echo
  echo "[StreamStack] Stopping processes..."
  kill "$STREAM_SERVER_PID" "$YT_WORKER_PID" "$WATCHDOG_PID" 2>/dev/null || true
}

trap cleanup EXIT INT TERM

echo "[StreamStack] Running."
echo "[StreamStack] stream-server PID: $STREAM_SERVER_PID"
echo "[StreamStack] youtube-worker PID: $YT_WORKER_PID"
echo "[StreamStack] watchdog PID: $WATCHDOG_PID"

if command -v wait >/dev/null 2>&1; then
  wait
else
  # Fallback loop
  while true; do
    sleep 1
  done
fi
