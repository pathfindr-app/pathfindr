#!/usr/bin/env node

/**
 * Pathfindr stream runtime server.
 * - Serves static app files
 * - Provides /api/next-city and /api/stream-state endpoints for 24/7 stream mode
 * - Keeps a simple persistent queue in tmp/stream-runtime.json
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { loadProjectEnv } = require('./lib/load-env');

loadProjectEnv(__dirname);

const ROOT = path.join(__dirname, '..');
const PORT = Number.parseInt(process.env.PORT || '3000', 10);
const HOST = process.env.HOST || '0.0.0.0';
const QUEUE_API_KEY = process.env.STREAM_QUEUE_API_KEY || '';
const parsedMaxProcessedIds = Number.parseInt(process.env.STREAM_MAX_PROCESSED_IDS || '10000', 10);
const MAX_PROCESSED_IDS = Number.isFinite(parsedMaxProcessedIds) ? parsedMaxProcessedIds : 10000;
const paidOnlyModeRaw = String(process.env.STREAM_PAID_ONLY || '').trim().toLowerCase();
const PAID_ONLY_MODE = paidOnlyModeRaw === '1' || paidOnlyModeRaw === 'true' || paidOnlyModeRaw === 'yes' || paidOnlyModeRaw === 'on';

const RUNTIME_DIR = path.join(ROOT, 'tmp');
const RUNTIME_FILE = path.join(RUNTIME_DIR, 'stream-runtime.json');
const MAX_BODY_BYTES = 64 * 1024;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.wav': 'audio/wav',
  '.mp3': 'audio/mpeg',
  '.map': 'application/json; charset=utf-8',
};

function nowIso() {
  return new Date().toISOString();
}

function safeEqual(a, b) {
  const left = Buffer.from(String(a || ''), 'utf8');
  const right = Buffer.from(String(b || ''), 'utf8');
  if (left.length !== right.length) return false;
  return crypto.timingSafeEqual(left, right);
}

function isWriteAuthorized(req) {
  if (!QUEUE_API_KEY) return true;
  const keyFromHeader = req.headers['x-stream-key'] || '';
  const bearer = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  return safeEqual(keyFromHeader, QUEUE_API_KEY) || safeEqual(bearer, QUEUE_API_KEY);
}

function makeId() {
  if (typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function ensureRuntimeStore() {
  if (!fs.existsSync(RUNTIME_DIR)) {
    fs.mkdirSync(RUNTIME_DIR, { recursive: true });
  }

  if (!fs.existsSync(RUNTIME_FILE)) {
    const initial = {
      queue: [],
      current: null,
      currentRequest: null,
      processedMessageIds: [],
      events: [],
      updatedAt: nowIso(),
    };
    fs.writeFileSync(RUNTIME_FILE, JSON.stringify(initial, null, 2), 'utf8');
  }
}

function loadStore() {
  ensureRuntimeStore();
  try {
    const raw = fs.readFileSync(RUNTIME_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    parsed.queue = Array.isArray(parsed.queue) ? parsed.queue : [];
    parsed.processedMessageIds = Array.isArray(parsed.processedMessageIds) ? parsed.processedMessageIds : [];
    parsed.events = Array.isArray(parsed.events) ? parsed.events : [];
    return parsed;
  } catch (error) {
    console.warn('[StreamServer] Failed to read runtime store, resetting:', error.message);
    return {
      queue: [],
      current: null,
      currentRequest: null,
      processedMessageIds: [],
      events: [],
      updatedAt: nowIso(),
    };
  }
}

function saveStore(store) {
  store.updatedAt = nowIso();
  fs.writeFileSync(RUNTIME_FILE, JSON.stringify(store, null, 2), 'utf8');
}

function sendJson(res, statusCode, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
    'Cache-Control': 'no-store',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, x-stream-key, Authorization',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  });
  res.end(body);
}

function sendNoContent(res) {
  res.writeHead(204, {
    'Cache-Control': 'no-store',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, x-stream-key, Authorization',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  });
  res.end();
}

function sendText(res, statusCode, text) {
  res.writeHead(statusCode, {
    'Content-Type': 'text/plain; charset=utf-8',
    'Content-Length': Buffer.byteLength(text),
    'Cache-Control': 'no-store',
  });
  res.end(text);
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let total = 0;
    const chunks = [];

    req.on('data', (chunk) => {
      total += chunk.length;
      if (total > MAX_BODY_BYTES) {
        reject(new Error('Request body too large'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });

    req.on('end', () => {
      const raw = Buffer.concat(chunks).toString('utf8').trim();
      if (!raw) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(raw));
      } catch (error) {
        reject(new Error('Invalid JSON body'));
      }
    });

    req.on('error', (error) => reject(error));
  });
}

function normalizeCityRequest(payload) {
  if (!payload || typeof payload !== 'object') return null;

  const cityText = payload.city || payload.name || payload.location;
  const name = typeof cityText === 'string' ? cityText.trim() : '';
  const lat = payload.lat ?? payload.latitude;
  const lng = payload.lng ?? payload.lon ?? payload.longitude;
  const parsedLat = Number(lat);
  const parsedLng = Number(lng);

  if (!name && (!Number.isFinite(parsedLat) || !Number.isFinite(parsedLng))) {
    return null;
  }

  const priorityRaw = Number(payload.priority);
  const priorityScoreRaw = Number(payload.priorityScore);
  const zoomRaw = Number(payload.zoom);
  const priorityTier = (payload.priorityTier === 'paid' || payload.priorityTier === 'free')
    ? payload.priorityTier
    : ((Number.isFinite(priorityScoreRaw) && priorityScoreRaw > 0) ? 'paid' : 'free');
  const priority = Number.isFinite(priorityScoreRaw)
    ? priorityScoreRaw
    : (Number.isFinite(priorityRaw) ? priorityRaw : (priorityTier === 'paid' ? 100 : 0));

  return {
    id: makeId(),
    messageId: (typeof payload.messageId === 'string' && payload.messageId.trim()) ? payload.messageId.trim() : null,
    name: name || `${parsedLat.toFixed(4)}, ${parsedLng.toFixed(4)}`,
    lat: Number.isFinite(parsedLat) ? parsedLat : null,
    lng: Number.isFinite(parsedLng) ? parsedLng : null,
    zoom: Number.isFinite(zoomRaw) ? zoomRaw : 15,
    requestedBy: typeof payload.requestedBy === 'string' ? payload.requestedBy.trim().slice(0, 80) : null,
    source: typeof (payload.sourceType || payload.source) === 'string'
      ? String(payload.sourceType || payload.source).trim().slice(0, 80)
      : 'manual',
    priorityTier: priorityTier,
    priority: priority,
    createdAt: nowIso(),
  };
}

function pickNextQueueIndex(queue) {
  if (!Array.isArray(queue) || queue.length === 0) return -1;
  let bestIndex = 0;

  for (let i = 1; i < queue.length; i++) {
    const a = queue[i];
    const b = queue[bestIndex];

    if ((a.priority || 0) > (b.priority || 0)) {
      bestIndex = i;
      continue;
    }

    if ((a.priority || 0) === (b.priority || 0)) {
      if ((a.createdAt || '') < (b.createdAt || '')) {
        bestIndex = i;
      }
    }
  }

  return bestIndex;
}

function appendEvent(store, event) {
  store.events.push({
    ...event,
    at: nowIso(),
  });
  if (store.events.length > 200) {
    store.events = store.events.slice(store.events.length - 200);
  }
}

function addProcessedMessageId(store, messageId) {
  if (!messageId) return;
  if (!Array.isArray(store.processedMessageIds)) {
    store.processedMessageIds = [];
  }
  if (store.processedMessageIds.includes(messageId)) return;
  store.processedMessageIds.push(messageId);
  if (store.processedMessageIds.length > MAX_PROCESSED_IDS) {
    store.processedMessageIds = store.processedMessageIds.slice(store.processedMessageIds.length - MAX_PROCESSED_IDS);
  }
}

function hasDuplicateMessage(store, messageId) {
  if (!messageId) return false;
  if (Array.isArray(store.processedMessageIds) && store.processedMessageIds.includes(messageId)) {
    return true;
  }
  return store.queue.some((item) => item.messageId && item.messageId === messageId);
}

function queueStats(queue) {
  const stats = {
    total: 0,
    paid: 0,
    free: 0,
    sources: {},
  };

  for (const item of queue) {
    stats.total += 1;
    const tier = item.priorityTier || (item.priority > 0 ? 'paid' : 'free');
    if (tier === 'paid') stats.paid += 1;
    else stats.free += 1;

    const source = item.source || 'unknown';
    stats.sources[source] = (stats.sources[source] || 0) + 1;
  }

  return stats;
}

function getSafePath(urlPath) {
  let decoded;
  try {
    decoded = decodeURIComponent(urlPath.split('?')[0]);
  } catch {
    return null;
  }
  const normalized = path.normalize(decoded).replace(/^(\.\.[/\\])+/, '');
  const relative = normalized === '/' ? 'index.html' : normalized.replace(/^[/\\]/, '');
  const abs = path.resolve(ROOT, relative);
  const relativeToRoot = path.relative(ROOT, abs);
  if (relativeToRoot.startsWith('..') || path.isAbsolute(relativeToRoot)) return null;
  return abs;
}

function serveFile(req, res) {
  const filePath = getSafePath(req.url || '/');
  if (!filePath) {
    sendText(res, 400, 'Bad request');
    return;
  }

  let candidate = filePath;
  if (fs.existsSync(candidate) && fs.statSync(candidate).isDirectory()) {
    candidate = path.join(candidate, 'index.html');
  }

  if (!fs.existsSync(candidate) || !fs.statSync(candidate).isFile()) {
    sendText(res, 404, 'Not found');
    return;
  }

  const ext = path.extname(candidate).toLowerCase();
  const mime = MIME_TYPES[ext] || 'application/octet-stream';
  const data = fs.readFileSync(candidate);
  res.writeHead(200, {
    'Content-Type': mime,
    'Content-Length': data.length,
    'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=3600',
  });
  res.end(data);
}

async function handleApi(req, res) {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const { pathname } = url;
  const isWrite = req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH' || req.method === 'DELETE';

  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, x-stream-key, Authorization',
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    });
    res.end();
    return;
  }

  if (isWrite && pathname !== '/api/stream-state' && !isWriteAuthorized(req)) {
    sendJson(res, 401, { ok: false, error: 'Unauthorized' });
    return;
  }

  if (pathname === '/api/health' && req.method === 'GET') {
    const store = loadStore();
    const stats = queueStats(store.queue);
    sendJson(res, 200, {
      ok: true,
      time: nowIso(),
      queueDepth: store.queue.length,
      queuePaid: stats.paid,
      queueFree: stats.free,
      processedMessageIds: (store.processedMessageIds || []).length,
      hasCurrentState: !!store.current,
      paidOnlyMode: PAID_ONLY_MODE,
    });
    return;
  }

  if (pathname === '/api/requests' && req.method === 'POST') {
    const body = await parseBody(req);
    const store = loadStore();
    const items = Array.isArray(body) ? body : [body];
    const accepted = [];
    let duplicateCount = 0;
    let rejectedFreeCount = 0;

    for (const item of items) {
      const normalized = normalizeCityRequest(item);
      if (!normalized) continue;

      const priorityTier = normalized.priorityTier || (normalized.priority > 0 ? 'paid' : 'free');
      const isPaid = priorityTier === 'paid';
      const isManualOverride = normalized.source === 'manual_admin' || normalized.source === 'manual';
      if (PAID_ONLY_MODE && !isPaid && !isManualOverride) {
        rejectedFreeCount += 1;
        continue;
      }

      if (hasDuplicateMessage(store, normalized.messageId)) {
        duplicateCount += 1;
        continue;
      }

      store.queue.push(normalized);
      accepted.push(normalized);
    }

    appendEvent(store, {
      type: 'queue_enqueued',
      count: accepted.length,
      rejectedFreeCount,
    });
    saveStore(store);

    sendJson(res, 200, {
      ok: true,
      accepted: accepted.length,
      duplicates: duplicateCount,
      rejectedFree: rejectedFreeCount,
      paidOnlyMode: PAID_ONLY_MODE,
      queueDepth: store.queue.length,
      requests: accepted.map((item) => ({
        id: item.id,
        name: item.name,
        priority: item.priority,
      })),
    });
    return;
  }

  if (pathname === '/api/queue' && req.method === 'GET') {
    const store = loadStore();
    sendJson(res, 200, {
      ok: true,
      queueDepth: store.queue.length,
      queue: store.queue.slice(0, 100).map((item) => ({
        id: item.id,
        messageId: item.messageId || null,
        name: item.name,
        priority: item.priority,
        priorityTier: item.priorityTier || (item.priority > 0 ? 'paid' : 'free'),
        requestedBy: item.requestedBy,
        source: item.source,
        createdAt: item.createdAt,
      })),
    });
    return;
  }

  if (pathname === '/api/requests' && req.method === 'GET') {
    const store = loadStore();
    sendJson(res, 200, {
      ok: true,
      queueDepth: store.queue.length,
      queue: store.queue.slice(0, 100),
      processedMessageIds: (store.processedMessageIds || []).length,
      updatedAt: store.updatedAt,
    });
    return;
  }

  if (pathname === '/api/next-city' && req.method === 'GET') {
    const store = loadStore();
    const nextIndex = pickNextQueueIndex(store.queue);

    if (nextIndex < 0) {
      sendNoContent(res);
      return;
    }

    const next = store.queue.splice(nextIndex, 1)[0];
    addProcessedMessageId(store, next.messageId);
    store.currentRequest = {
      id: next.id,
      name: next.name,
      requestedBy: next.requestedBy || null,
      priority: next.priority || 0,
      priorityTier: next.priorityTier || (next.priority > 0 ? 'paid' : 'free'),
      dequeuedAt: nowIso(),
    };
    appendEvent(store, {
      type: 'queue_dequeued',
      requestId: next.id,
      name: next.name,
      messageId: next.messageId || null,
    });
    saveStore(store);

    sendJson(res, 200, {
      requestId: next.id,
      requestedBy: next.requestedBy,
      queueDepth: store.queue.length,
      city: {
        name: next.name,
        lat: next.lat,
        lng: next.lng,
        zoom: next.zoom,
      },
    });
    return;
  }

  if (pathname === '/api/stream-state' && req.method === 'POST') {
    const body = await parseBody(req);
    const store = loadStore();
    store.current = {
      ...body,
      receivedAt: nowIso(),
    };
    appendEvent(store, {
      type: 'renderer_state',
      event: body.event || null,
      city: body.city?.name || null,
    });
    saveStore(store);
    sendJson(res, 200, { ok: true });
    return;
  }

  if (pathname === '/api/stream-state' && req.method === 'GET') {
    const store = loadStore();
    sendJson(res, 200, {
      ok: true,
      queueDepth: store.queue.length,
      current: store.current,
      currentRequest: store.currentRequest || null,
      updatedAt: store.updatedAt,
      recentEvents: store.events.slice(-20),
    });
    return;
  }

  if (pathname === '/api/admin/clear-queue' && req.method === 'POST') {
    const store = loadStore();
    const cleared = store.queue.length;
    store.queue = [];
    appendEvent(store, {
      type: 'queue_cleared',
      count: cleared,
    });
    saveStore(store);
    sendJson(res, 200, { ok: true, cleared });
    return;
  }

  if (pathname === '/api/admin/remove-request' && req.method === 'POST') {
    const body = await parseBody(req);
    const requestId = (body.id || body.requestId || '').toString().trim();
    if (!requestId) {
      sendJson(res, 400, { ok: false, error: 'Missing request id' });
      return;
    }

    const store = loadStore();
    const before = store.queue.length;
    store.queue = store.queue.filter((item) => item.id !== requestId);
    const removed = before - store.queue.length;

    appendEvent(store, {
      type: 'queue_removed',
      requestId,
      removed,
    });
    saveStore(store);
    sendJson(res, 200, { ok: true, removed, queueDepth: store.queue.length });
    return;
  }

  if (pathname === '/api/admin/promote-request' && req.method === 'POST') {
    const body = await parseBody(req);
    const requestId = (body.id || body.requestId || '').toString().trim();
    const priority = Number(body.priority);
    if (!requestId || !Number.isFinite(priority)) {
      sendJson(res, 400, { ok: false, error: 'Missing request id or priority' });
      return;
    }

    const store = loadStore();
    const item = store.queue.find((entry) => entry.id === requestId);
    if (!item) {
      sendJson(res, 404, { ok: false, error: 'Request not found' });
      return;
    }

    item.priority = priority;
    if (priority > 0) item.priorityTier = 'paid';

    appendEvent(store, {
      type: 'queue_promoted',
      requestId,
      priority,
    });
    saveStore(store);
    sendJson(res, 200, { ok: true, requestId, priority });
    return;
  }

  if (pathname === '/api/events' && req.method === 'GET') {
    const store = loadStore();
    sendJson(res, 200, {
      ok: true,
      events: store.events.slice(-100),
      updatedAt: store.updatedAt,
    });
    return;
  }

  if (pathname === '/api/stats' && req.method === 'GET') {
    const store = loadStore();
    const stats = queueStats(store.queue);
    sendJson(res, 200, {
      ok: true,
      queue: stats,
      processedMessageIds: (store.processedMessageIds || []).length,
      currentRequest: store.currentRequest || null,
      updatedAt: store.updatedAt,
    });
    return;
  }

  sendJson(res, 404, { ok: false, error: 'Not found' });
}

const server = http.createServer(async (req, res) => {
  try {
    if ((req.url || '').startsWith('/api/')) {
      await handleApi(req, res);
      return;
    }
    serveFile(req, res);
  } catch (error) {
    console.error('[StreamServer] Request failed:', error.message);
    sendJson(res, 500, { ok: false, error: 'Internal server error' });
  }
});

server.listen(PORT, HOST, () => {
  ensureRuntimeStore();
  console.log(`[StreamServer] Running on http://${HOST}:${PORT}`);
  console.log(`[StreamServer] Runtime store: ${RUNTIME_FILE}`);
});
