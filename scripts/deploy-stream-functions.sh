#!/usr/bin/env bash
set -euo pipefail

# Deploy Pathfindr stream queue edge functions to Supabase.
# Usage:
#   ./scripts/deploy-stream-functions.sh
#   ./scripts/deploy-stream-functions.sh <project-ref>
#
# Optional env:
#   SUPABASE_PROJECT_REF=<project-ref>

if ! command -v supabase >/dev/null 2>&1; then
  echo "Supabase CLI not found. Install it first: https://supabase.com/docs/guides/cli"
  exit 1
fi

PROJECT_REF="${1:-${SUPABASE_PROJECT_REF:-}}"

if [[ -n "$PROJECT_REF" ]]; then
  PROJECT_ARGS=(--project-ref "$PROJECT_REF")
  echo "Deploying to Supabase project: $PROJECT_REF"
else
  PROJECT_ARGS=()
  echo "Deploying using currently linked Supabase project"
fi

supabase functions deploy stream-queue-request "${PROJECT_ARGS[@]}"
supabase functions deploy stream-queue-next "${PROJECT_ARGS[@]}"
supabase functions deploy stream-state "${PROJECT_ARGS[@]}"

echo "Done: stream queue functions deployed."

