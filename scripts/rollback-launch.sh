#!/bin/sh
set -eu
# The old game-only deployment would remove the separately maintained print shop.
echo 'Rollback paused: production also serves /prints. Restore game assets over the current shared deployment; do not promote the historical game-only artifact.' >&2
exit 1
