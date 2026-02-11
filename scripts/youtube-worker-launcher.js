#!/usr/bin/env node

/**
 * Guarded launcher for YouTube chat worker.
 * Keeps process alive when YouTube credentials are not ready yet.
 */

const path = require('path');
const { spawn } = require('child_process');
const { loadProjectEnv } = require('./lib/load-env');

const ROOT = path.join(__dirname, '..');
const WORKER_SCRIPT = path.join(__dirname, 'youtube-chat-worker.js');

function intEnv(name, fallback) {
  const parsed = Number.parseInt(process.env[name] || '', 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function parseWorkerMode() {
  const value = String(process.env.STREAM_ENABLE_YT_WORKER || 'auto').trim().toLowerCase();
  if (['0', 'false', 'no', 'off', 'disabled'].includes(value)) return 'off';
  if (['1', 'true', 'yes', 'on', 'enabled'].includes(value)) return 'on';
  return 'auto';
}

function missingConfigKeys() {
  const missing = [];
  if (!process.env.YT_CLIENT_ID) missing.push('YT_CLIENT_ID');
  if (!process.env.YT_CLIENT_SECRET) missing.push('YT_CLIENT_SECRET');
  if (!process.env.YT_REFRESH_TOKEN) missing.push('YT_REFRESH_TOKEN');
  return missing;
}

function log(...args) {
  console.log('[YTWorkerLauncher]', ...args);
}

function warn(...args) {
  console.warn('[YTWorkerLauncher]', ...args);
}

const CONFIG = {
  checkIntervalMs: intEnv('YT_LAUNCHER_CHECK_INTERVAL_MS', 30000),
  restartDelayMs: intEnv('YT_LAUNCHER_RESTART_DELAY_MS', 8000),
};

const runtime = {
  child: null,
  shutdownRequested: false,
  restartTimer: null,
  lastStatusKey: '',
};

function loadRuntimeEnv() {
  loadProjectEnv(__dirname, { override: true });
}

function statusKey(mode, missing, isRunning) {
  const normalizedMissing = missing.join(',');
  return `${mode}|${normalizedMissing}|${isRunning ? 'running' : 'idle'}`;
}

function logStatus(mode, missing) {
  const key = statusKey(mode, missing, Boolean(runtime.child));
  if (key === runtime.lastStatusKey) return;
  runtime.lastStatusKey = key;

  if (mode === 'off') {
    log('YouTube worker disabled by STREAM_ENABLE_YT_WORKER=off.');
    return;
  }

  if (missing.length > 0) {
    warn(`Waiting for YouTube credentials: ${missing.join(', ')}`);
    return;
  }

  if (runtime.child) {
    log('YouTube worker is running.');
  } else {
    log('YouTube credentials detected. Launching worker.');
  }
}

function stopWorker(signal = 'SIGTERM') {
  if (!runtime.child) return;
  try {
    runtime.child.kill(signal);
  } catch (error) {
    warn('Failed to stop worker:', error.message);
  }
}

function scheduleRestart() {
  if (runtime.restartTimer || runtime.shutdownRequested) return;
  runtime.restartTimer = setTimeout(() => {
    runtime.restartTimer = null;
    evaluateAndStart();
  }, Math.max(1000, CONFIG.restartDelayMs));
}

function spawnWorker() {
  if (runtime.child || runtime.shutdownRequested) return;

  runtime.child = spawn(process.execPath, [WORKER_SCRIPT], {
    cwd: ROOT,
    stdio: 'inherit',
    env: process.env,
  });

  runtime.child.on('exit', (code, signal) => {
    const exited = runtime.child;
    runtime.child = null;

    if (runtime.shutdownRequested) return;

    if (code === 0) {
      warn(`Worker exited normally${signal ? ` (${signal})` : ''}. Restarting...`);
    } else {
      warn(`Worker exited with code ${code ?? 'unknown'}${signal ? ` (${signal})` : ''}. Restarting...`);
    }

    if (exited) {
      scheduleRestart();
    }
  });
}

function evaluateAndStart() {
  if (runtime.shutdownRequested) return;

  loadRuntimeEnv();
  const mode = parseWorkerMode();
  const missing = missingConfigKeys();
  logStatus(mode, missing);

  if (mode === 'off') {
    stopWorker();
    return;
  }

  if (missing.length > 0) {
    stopWorker();
    return;
  }

  spawnWorker();
}

function shutdown() {
  runtime.shutdownRequested = true;
  if (runtime.restartTimer) {
    clearTimeout(runtime.restartTimer);
    runtime.restartTimer = null;
  }

  if (!runtime.child) {
    process.exit(0);
    return;
  }

  const child = runtime.child;
  child.once('exit', () => process.exit(0));
  stopWorker('SIGTERM');

  setTimeout(() => {
    if (runtime.child) {
      stopWorker('SIGKILL');
    }
  }, 4000);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

evaluateAndStart();
setInterval(evaluateAndStart, Math.max(5000, CONFIG.checkIntervalMs));

