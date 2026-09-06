# Release boundaries

Game and Printshop are separately maintained projects. Do not build, modify, migrate,
or publish Printshop source as part of game work.

The current Vercel project `pathfindralpha` nevertheless serves both `/` and `/prints`,
including print API functions. Replacing it with a game-only artifact removes the shop.
Until hosting is split into separate projects behind stable routing, preserve the
current deployed shop byte-for-byte and preserve its API functions/routing when
releasing the game. If this cannot be established, stop before promotion.

Never apply the entire Supabase migrations directory for a game task: migration 018
belongs to Printshop. Apply only the specifically approved game migration after
checking live schema. Do not modify print tables, credentials, payments or fulfillment.

Historical game-only staging/rollback scripts are disabled intentionally. The source
baseline and recovery archive remain valid for local game recovery, not whole-site rollback.
