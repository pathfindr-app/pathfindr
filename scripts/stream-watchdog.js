#!/usr/bin/env node

/**
 * Stream watchdog for unattended VPS runtime.
 * - Polls /api/health and /api/stream-state
 * - Restarts stack command on repeated failures or stale state
 * - Optional webhook alert
 */

const { exec } = require('child_process');
const { loadProjectEnv } = require('./lib/load-env');

loadProjectEnv(__dirname);

const CONFIG = {
  healthUrl: process.env.WATCHDOG_HEALTH_URL || 'http://127.0.0.1:3000/api/health',
  stateUrl: process.env.WATCHDOG_STATE_URL || 'http://127.0.0.1:3000/api/stream-state',
  intervalMs: Number.parseInt(process.env.WATCHDOG_INTERVAL_MS || '15000', 10),
  maxFailures: Number.parseInt(process.env.WATCHDOG_MAX_FAILURES || '4', 10),
  staleStateMs: Number.parseInt(process.env.WATCHDOG_STALE_STATE_MS || String(4 * 60 * 1000), 10),
  restartCmd: process.env.WATCHDOG_RESTART_CMD || 'pm2 restart ecosystem.config.cjs',
  restartCooldownMs: Number.parseInt(process.env.WATCHDOG_RESTART_COOLDOWN_MS || String(3 * 60 * 1000), 10),
  alertWebhookUrl: process.env.WATCHDOG_ALERT_WEBHOOK_URL || '',
};

const state = {
  consecutiveFailures: 0,
  lastRestartAt: 0,
};

function log(...args) {
  console.log('[Watchdog]', ...args);
}

function warn(...args) {
  console.warn('[Watchdog]', ...args);
}

async function postAlert(text) {
  if (!CONFIG.alertWebhookUrl) return;
  try {
    await fetch(CONFIG.alertWebhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
  } catch {
    // Avoid alert loops.
  }
}

async function getJson(url) {
  const response = await fetch(url, { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} at ${url}`);
  }
  return response.json();
}

function parseIsoTime(value) {
  if (!value) return null;
  const ms = Date.parse(value);
  return Number.isFinite(ms) ? ms : null;
}

function restartStack(reason) {
  const now = Date.now();
  if ((now - state.lastRestartAt) < CONFIG.restartCooldownMs) {
    warn('Restart skipped due to cooldown:', reason);
    return;
  }

  state.lastRestartAt = now;
  const cmd = CONFIG.restartCmd;
  warn('Restarting stack:', cmd, '| reason:', reason);
  postAlert(`Pathfindr watchdog restart: ${reason}`);

  exec(cmd, (error, stdout, stderr) => {
    if (error) {
      warn('Restart command failed:', error.message);
      if (stderr) warn(stderr.trim());
      return;
    }
    if (stdout?.trim()) log(stdout.trim());
    if (stderr?.trim()) warn(stderr.trim());
    log('Restart command completed.');
  });
}

async function runCheck() {
  try {
    const [health, streamState] = await Promise.all([
      getJson(CONFIG.healthUrl),
      getJson(CONFIG.stateUrl),
    ]);

    if (!health?.ok) {
      throw new Error('Health endpoint returned not-ok');
    }

    // Detect stale renderer updates.
    const updatedAtRaw =
      streamState?.updatedAt ||
      streamState?.state?.updated_at ||
      streamState?.current?.receivedAt ||
      null;
    const updatedAtMs = parseIsoTime(updatedAtRaw);
    if (updatedAtMs && (Date.now() - updatedAtMs) > CONFIG.staleStateMs) {
      state.consecutiveFailures += 1;
      warn(`Stream state appears stale (${Math.round((Date.now() - updatedAtMs) / 1000)}s old). Failure ${state.consecutiveFailures}/${CONFIG.maxFailures}`);
      if (state.consecutiveFailures >= CONFIG.maxFailures) {
        restartStack('stale stream-state');
        state.consecutiveFailures = 0;
      }
      return;
    }

    if (state.consecutiveFailures > 0) {
      log('Health recovered.');
    }
    state.consecutiveFailures = 0;
  } catch (error) {
    state.consecutiveFailures += 1;
    warn(`Health check failed (${state.consecutiveFailures}/${CONFIG.maxFailures}): ${error.message}`);
    if (state.consecutiveFailures >= CONFIG.maxFailures) {
      restartStack('health check failures');
      state.consecutiveFailures = 0;
    }
  }
}

async function main() {
  log('Starting stream watchdog');
  log('Health URL:', CONFIG.healthUrl);
  log('State URL:', CONFIG.stateUrl);
  log('Restart command:', CONFIG.restartCmd);

  await runCheck();
  setInterval(runCheck, Math.max(3000, CONFIG.intervalMs));
}

main().catch((error) => {
  console.error('[Watchdog] Fatal:', error.message);
  process.exit(1);
});
