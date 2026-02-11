#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

function normalizeValue(raw) {
  const trimmed = raw.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

function parseLine(line) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) return null;

  const exportPrefix = trimmed.startsWith('export ') ? trimmed.slice(7).trim() : trimmed;
  const eq = exportPrefix.indexOf('=');
  if (eq <= 0) return null;

  const key = exportPrefix.slice(0, eq).trim();
  if (!key) return null;

  const value = normalizeValue(exportPrefix.slice(eq + 1));
  return { key, value };
}

function loadEnvFile(filePath, options = {}) {
  const override = options.override === true;
  if (!fs.existsSync(filePath)) {
    return { loaded: 0, filePath };
  }

  const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/);
  let loaded = 0;

  for (const line of lines) {
    const pair = parseLine(line);
    if (!pair) continue;

    if (!override && Object.prototype.hasOwnProperty.call(process.env, pair.key)) {
      continue;
    }

    process.env[pair.key] = pair.value;
    loaded += 1;
  }

  return { loaded, filePath };
}

function loadProjectEnv(fromDir, options = {}) {
  const rootDir = path.resolve(fromDir, '..');
  const envPath = options.envPath || path.join(rootDir, '.env.local');
  return loadEnvFile(envPath, options);
}

module.exports = {
  loadEnvFile,
  loadProjectEnv,
};

