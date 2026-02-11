#!/usr/bin/env node

/**
 * YouTube chat ingest worker for Pathfindr stream queue.
 *
 * Responsibilities:
 * - Authenticate with YouTube Data API via OAuth refresh token
 * - Resolve liveChatId from active broadcast (or use explicit env)
 * - Poll live chat messages continuously
 * - Parse !city requests
 * - Prioritize paid requests (Super Chats / Super Stickers)
 * - Push normalized requests into stream queue API
 */

const fs = require('fs');
const path = require('path');
const { loadProjectEnv } = require('./lib/load-env');

const ROOT = path.join(__dirname, '..');
const TMP_DIR = path.join(ROOT, 'tmp');
const DEFAULT_WORKER_STATE_FILE = path.join(TMP_DIR, 'youtube-worker-state.json');
loadProjectEnv(__dirname);
const WORKER_STATE_FILE = process.env.YT_WORKER_STATE_FILE || DEFAULT_WORKER_STATE_FILE;

function boolEnv(name, defaultValue = false) {
  const value = process.env[name];
  if (value == null || value === '') return defaultValue;
  const normalized = String(value).trim().toLowerCase();
  return normalized === '1' || normalized === 'true' || normalized === 'yes' || normalized === 'on';
}

function intEnv(name, defaultValue) {
  const parsed = Number.parseInt(process.env[name] || '', 10);
  return Number.isFinite(parsed) ? parsed : defaultValue;
}

const CONFIG = {
  // YouTube OAuth
  ytClientId: process.env.YT_CLIENT_ID || '',
  ytClientSecret: process.env.YT_CLIENT_SECRET || '',
  ytRefreshToken: process.env.YT_REFRESH_TOKEN || '',
  ytLiveChatId: process.env.YT_LIVE_CHAT_ID || '',
  ytLiveBroadcastId: process.env.YT_LIVE_BROADCAST_ID || '',

  // Queue targets
  queueApiUrl: process.env.STREAM_QUEUE_API_URL || 'http://127.0.0.1:3000/api/requests',
  queueApiKey: process.env.STREAM_QUEUE_API_KEY || '',

  // Worker behavior
  pollFallbackMs: intEnv('YT_POLL_FALLBACK_MS', 5000),
  retryDelayMs: intEnv('YT_RETRY_DELAY_MS', 10000),
  userCooldownMs: intEnv('STREAM_USER_COOLDOWN_MS', 2 * 60 * 1000),
  cityDedupeMs: intEnv('STREAM_CITY_DEDUPE_MS', 10 * 60 * 1000),
  collapsePaidDuplicates: boolEnv('STREAM_COLLAPSE_PAID_DUPLICATES', false),
  maxMessageCache: intEnv('STREAM_MAX_MESSAGE_CACHE', 5000),
  maxWindowEntries: intEnv('STREAM_MAX_WINDOW_ENTRIES', 3000),
  persistStateMs: intEnv('YT_WORKER_PERSIST_STATE_MS', 8000),
  dryRun: boolEnv('STREAM_DRY_RUN', false),
  verbose: boolEnv('STREAM_VERBOSE', true),
  paidOnlyMode: boolEnv('STREAM_PAID_ONLY', false),
};

const GOOGLE_OAUTH_URL = 'https://oauth2.googleapis.com/token';
const YT_API_BASE = 'https://www.googleapis.com/youtube/v3';

const state = {
  accessToken: null,
  accessTokenExpiresAt: 0,
  liveChatId: CONFIG.ytLiveChatId || null,
  nextPageToken: null,
  seenMessageIds: new Set(),
  userLastQueuedAt: new Map(),
  cityLastQueuedAt: new Map(),
  persistDirty: false,
  lastPersistAt: 0,
};

function log(...args) {
  if (CONFIG.verbose) console.log('[YTWorker]', ...args);
}

function warn(...args) {
  console.warn('[YTWorker]', ...args);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function markStateDirty() {
  state.persistDirty = true;
}

function compactMapSize(map, maxEntries) {
  if (map.size <= maxEntries) return;
  const keep = Array.from(map.entries()).slice(-maxEntries);
  map.clear();
  for (const [k, v] of keep) map.set(k, v);
}

function loadWorkerState() {
  try {
    if (!fs.existsSync(WORKER_STATE_FILE)) return;
    const raw = fs.readFileSync(WORKER_STATE_FILE, 'utf8');
    const parsed = JSON.parse(raw);

    if (typeof parsed.nextPageToken === 'string' && parsed.nextPageToken) {
      state.nextPageToken = parsed.nextPageToken;
    }
    if (Array.isArray(parsed.seenMessageIds)) {
      state.seenMessageIds = new Set(parsed.seenMessageIds.slice(-CONFIG.maxMessageCache));
    }
    if (Array.isArray(parsed.userLastQueuedAt)) {
      state.userLastQueuedAt = new Map(parsed.userLastQueuedAt);
    }
    if (Array.isArray(parsed.cityLastQueuedAt)) {
      state.cityLastQueuedAt = new Map(parsed.cityLastQueuedAt);
    }
  } catch (error) {
    warn('Could not load worker state, starting fresh:', error.message);
  }
}

function persistWorkerState(force = false) {
  const now = Date.now();
  if (!force && !state.persistDirty) return;
  if (!force && (now - state.lastPersistAt) < CONFIG.persistStateMs) return;

  compactMapSize(state.userLastQueuedAt, CONFIG.maxWindowEntries);
  compactMapSize(state.cityLastQueuedAt, CONFIG.maxWindowEntries);
  compactSeenSet();

  const payload = {
    nextPageToken: state.nextPageToken,
    seenMessageIds: Array.from(state.seenMessageIds).slice(-CONFIG.maxMessageCache),
    userLastQueuedAt: Array.from(state.userLastQueuedAt.entries()),
    cityLastQueuedAt: Array.from(state.cityLastQueuedAt.entries()),
    updatedAt: new Date().toISOString(),
  };

  try {
    if (!fs.existsSync(TMP_DIR)) {
      fs.mkdirSync(TMP_DIR, { recursive: true });
    }
    fs.writeFileSync(WORKER_STATE_FILE, JSON.stringify(payload, null, 2), 'utf8');
    state.persistDirty = false;
    state.lastPersistAt = now;
  } catch (error) {
    warn('Failed to persist worker state:', error.message);
  }
}

function requireConfig() {
  const missing = [];
  if (!CONFIG.ytClientId) missing.push('YT_CLIENT_ID');
  if (!CONFIG.ytClientSecret) missing.push('YT_CLIENT_SECRET');
  if (!CONFIG.ytRefreshToken) missing.push('YT_REFRESH_TOKEN');
  if (!CONFIG.queueApiUrl) missing.push('STREAM_QUEUE_API_URL');

  if (missing.length > 0) {
    throw new Error(`Missing required env vars: ${missing.join(', ')}`);
  }
}

async function refreshAccessToken() {
  const body = new URLSearchParams({
    client_id: CONFIG.ytClientId,
    client_secret: CONFIG.ytClientSecret,
    refresh_token: CONFIG.ytRefreshToken,
    grant_type: 'refresh_token',
  });

  const response = await fetch(GOOGLE_OAUTH_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });

  const json = await response.json();
  if (!response.ok) {
    throw new Error(`OAuth refresh failed: ${json.error || response.status}`);
  }

  state.accessToken = json.access_token;
  const expiresIn = Number(json.expires_in || 3600);
  state.accessTokenExpiresAt = Date.now() + Math.max(60, expiresIn - 60) * 1000;
}

async function ensureAccessToken() {
  if (!state.accessToken || Date.now() >= state.accessTokenExpiresAt) {
    await refreshAccessToken();
  }
  return state.accessToken;
}

async function ytGet(endpoint, query, retryAuth = true) {
  const token = await ensureAccessToken();
  const params = new URLSearchParams(query);
  const url = `${YT_API_BASE}/${endpoint}?${params.toString()}`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  });

  if ((response.status === 401 || response.status === 403) && retryAuth) {
    await refreshAccessToken();
    return ytGet(endpoint, query, false);
  }

  const json = await response.json();
  if (!response.ok) {
    const errText = json?.error?.message || response.statusText || 'unknown error';
    throw new Error(`YouTube API ${endpoint} failed: ${errText}`);
  }
  return json;
}

async function resolveLiveChatId() {
  if (state.liveChatId) return state.liveChatId;

  if (CONFIG.ytLiveBroadcastId) {
    const byId = await ytGet('liveBroadcasts', {
      part: 'snippet',
      id: CONFIG.ytLiveBroadcastId,
      maxResults: '1',
    });
    const liveChatId = byId?.items?.[0]?.snippet?.liveChatId;
    if (liveChatId) {
      state.liveChatId = liveChatId;
      return liveChatId;
    }
  }

  const active = await ytGet('liveBroadcasts', {
    part: 'snippet',
    mine: 'true',
    broadcastStatus: 'active',
    maxResults: '5',
  });

  const liveChatId = active?.items?.[0]?.snippet?.liveChatId;
  if (!liveChatId) {
    throw new Error('No active live broadcast with liveChatId found.');
  }

  state.liveChatId = liveChatId;
  return liveChatId;
}

function normalizeCityName(input) {
  if (typeof input !== 'string') return null;
  let city = input.trim();
  if (!city) return null;

  city = city
    .replace(/\s+/g, ' ')
    .replace(/^[\-:;,.\s]+/, '')
    .replace(/[\-:;,.\s]+$/, '');

  if (city.length < 2 || city.length > 80) return null;
  if (/https?:\/\//i.test(city)) return null;

  return city;
}

function parseCityCommand(text) {
  if (typeof text !== 'string' || !text.trim()) return null;
  const match = text.trim().match(/^!city\s+(.+)$/i);
  if (!match) return null;
  return normalizeCityName(match[1]);
}

function parseImplicitPaidCity(text) {
  if (typeof text !== 'string') return null;
  const clean = normalizeCityName(text);
  if (!clean) return null;
  if (clean.length > 50) return null;
  if (/[@#]/.test(clean)) return null;
  return clean;
}

function computePaidPriority(amountMicros) {
  const safeMicros = Number.isFinite(Number(amountMicros)) ? Number(amountMicros) : 0;
  const dollars = safeMicros / 1_000_000;
  return 100 + Math.max(1, Math.round(Math.log2(dollars + 1) * 20));
}

function compactSeenSet() {
  if (state.seenMessageIds.size <= CONFIG.maxMessageCache) return;
  const keep = Array.from(state.seenMessageIds).slice(-CONFIG.maxMessageCache);
  state.seenMessageIds = new Set(keep);
  markStateDirty();
}

function compactWindowMap(map, ttlMs) {
  const now = Date.now();
  let changed = false;
  for (const [key, ts] of map.entries()) {
    if (now - ts > ttlMs) {
      map.delete(key);
      changed = true;
    }
  }
  if (changed) {
    markStateDirty();
  }
}

function isDuplicateOrCooldown({ city, userKey, isPaid }) {
  const now = Date.now();
  compactWindowMap(state.userLastQueuedAt, CONFIG.userCooldownMs * 2);
  compactWindowMap(state.cityLastQueuedAt, CONFIG.cityDedupeMs * 2);

  const cityKey = city.toLowerCase();

  if (!isPaid) {
    const lastUser = state.userLastQueuedAt.get(userKey);
    if (lastUser && now - lastUser < CONFIG.userCooldownMs) {
      return { blocked: true, reason: 'user_cooldown' };
    }
  }

  const collapseDuplicates = !isPaid || CONFIG.collapsePaidDuplicates;
  if (collapseDuplicates) {
    const lastCity = state.cityLastQueuedAt.get(cityKey);
    if (lastCity && now - lastCity < CONFIG.cityDedupeMs) {
      return { blocked: true, reason: 'city_duplicate' };
    }
  }

  return { blocked: false };
}

function markQueued({ city, userKey }) {
  const now = Date.now();
  state.userLastQueuedAt.set(userKey, now);
  state.cityLastQueuedAt.set(city.toLowerCase(), now);
  markStateDirty();
}

async function enqueueRequest(request) {
  if (CONFIG.dryRun) {
    log('DRY RUN enqueue:', request);
    return;
  }

  const headers = { 'Content-Type': 'application/json' };
  if (CONFIG.queueApiKey) {
    headers['x-stream-key'] = CONFIG.queueApiKey;
  }

  const response = await fetch(CONFIG.queueApiUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify(request),
  });

  const text = await response.text();
  if (!response.ok) {
    throw new Error(`Queue API failed (${response.status}): ${text}`);
  }
}

function extractMessageText(item) {
  return (
    item?.snippet?.textMessageDetails?.messageText ||
    item?.snippet?.displayMessage ||
    ''
  );
}

async function handleMessage(item) {
  const id = item?.id;
  if (!id || state.seenMessageIds.has(id)) return;

  state.seenMessageIds.add(id);
  markStateDirty();
  compactSeenSet();

  const snippet = item?.snippet || {};
  const type = snippet.type || 'unknown';
  const author = item?.authorDetails || {};
  const displayName = author.displayName || 'Unknown';
  const userId = author.channelId || author.channelUrl || displayName;
  const requestedBy = `@${displayName}`;

  let city = null;
  let isPaid = false;
  let priorityScore = 0;
  let amountMicros = null;
  let currency = null;
  let sourceType = 'chat';

  const text = extractMessageText(item);
  const commandCity = parseCityCommand(text);

  if (type === 'textMessageEvent') {
    city = commandCity;
    sourceType = 'chat';
  } else if (type === 'superChatEvent') {
    isPaid = true;
    sourceType = 'super_chat';
    amountMicros = Number(snippet?.superChatDetails?.amountMicros || 0);
    currency = snippet?.superChatDetails?.currency || null;
    priorityScore = computePaidPriority(amountMicros);
    city = commandCity || parseImplicitPaidCity(snippet?.superChatDetails?.userComment || text);
  } else if (type === 'superStickerEvent') {
    isPaid = true;
    sourceType = 'super_sticker';
    amountMicros = Number(snippet?.superStickerDetails?.amountMicros || 0);
    currency = snippet?.superStickerDetails?.currency || null;
    priorityScore = computePaidPriority(amountMicros);
    city = commandCity;
  } else {
    return;
  }

  if (!city) return;

  if (CONFIG.paidOnlyMode && !isPaid) {
    log(`Skipped free request from ${requestedBy} in paid-only mode.`);
    return;
  }

  const guard = isDuplicateOrCooldown({
    city,
    userKey: userId,
    isPaid,
  });
  if (guard.blocked) {
    log(`Skipped ${city} from ${requestedBy}: ${guard.reason}`);
    return;
  }

  const payload = {
    city,
    requestedBy,
    priorityTier: isPaid ? 'paid' : 'free',
    priorityScore,
    sourceType,
    messageId: id,
    userId,
    displayName,
    amountMicros,
    currency,
    // Local stream server compatibility:
    priority: priorityScore,
    source: sourceType,
    metadata: {
      youtubeType: type,
      publishedAt: snippet?.publishedAt || null,
    },
  };

  await enqueueRequest(payload);
  markQueued({ city, userKey: userId });

  const paidTag = isPaid ? ` [PAID ${currency || ''} ${amountMicros || 0}]` : '';
  log(`Queued city "${city}" from ${requestedBy}${paidTag}`);
}

async function pollLoop() {
  const liveChatId = await resolveLiveChatId();
  log('Using liveChatId:', liveChatId);
  log('Queue target:', CONFIG.queueApiUrl);

  while (true) {
    try {
      const query = {
        liveChatId,
        part: 'id,snippet,authorDetails',
        maxResults: '200',
      };
      if (state.nextPageToken) query.pageToken = state.nextPageToken;

      const data = await ytGet('liveChat/messages', query);
      const items = Array.isArray(data.items) ? data.items : [];

      for (const item of items) {
        await handleMessage(item);
      }

      if (data.nextPageToken) {
        state.nextPageToken = data.nextPageToken;
        markStateDirty();
      }

      persistWorkerState(false);

      const delay = Number(data.pollingIntervalMillis || CONFIG.pollFallbackMs);
      await sleep(Math.max(1500, delay));
    } catch (error) {
      warn('Polling error:', error.message);
      persistWorkerState(true);
      await sleep(CONFIG.retryDelayMs);
    }
  }
}

async function main() {
  requireConfig();
  loadWorkerState();
  log('Worker starting...');
  log('Worker state file:', WORKER_STATE_FILE);
  await pollLoop();
}

process.on('SIGINT', () => {
  persistWorkerState(true);
  process.exit(0);
});

process.on('SIGTERM', () => {
  persistWorkerState(true);
  process.exit(0);
});

process.on('beforeExit', () => {
  persistWorkerState(true);
});

main().catch((error) => {
  console.error('[YTWorker] Fatal:', error.message);
  persistWorkerState(true);
  process.exit(1);
});
