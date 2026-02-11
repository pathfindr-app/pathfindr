#!/usr/bin/env node

/**
 * Interactive OAuth helper for YouTube Data API.
 * Generates consent URL, captures auth code via local callback, and prints refresh token.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { loadProjectEnv } = require('./lib/load-env');

const ROOT = path.join(__dirname, '..');
const ENV_PATH = path.join(ROOT, '.env.local');

loadProjectEnv(__dirname);

const CLIENT_ID = process.env.YT_CLIENT_ID || '';
const CLIENT_SECRET = process.env.YT_CLIENT_SECRET || '';
const PORT = Number.parseInt(process.env.YT_OAUTH_PORT || '8787', 10);
const REDIRECT_URI = `http://127.0.0.1:${PORT}/oauth2callback`;
const SCOPES = [
  'https://www.googleapis.com/auth/youtube.readonly',
];

const AUTH_BASE = 'https://accounts.google.com/o/oauth2/v2/auth';
const TOKEN_URL = 'https://oauth2.googleapis.com/token';

function requireConfig() {
  const missing = [];
  if (!CLIENT_ID) missing.push('YT_CLIENT_ID');
  if (!CLIENT_SECRET) missing.push('YT_CLIENT_SECRET');
  if (missing.length) {
    throw new Error(`Missing required env vars: ${missing.join(', ')}`);
  }
}

function buildAuthUrl(state) {
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    response_type: 'code',
    scope: SCOPES.join(' '),
    access_type: 'offline',
    prompt: 'consent',
    include_granted_scopes: 'true',
    state,
  });
  return `${AUTH_BASE}?${params.toString()}`;
}

function askQuestion(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

async function exchangeCodeForToken(code) {
  const body = new URLSearchParams({
    code,
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    redirect_uri: REDIRECT_URI,
    grant_type: 'authorization_code',
  });

  const response = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });

  const json = await response.json();
  if (!response.ok) {
    throw new Error(`Token exchange failed: ${json.error_description || json.error || response.status}`);
  }
  return json;
}

function upsertEnvValue(content, key, value) {
  const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`^${escaped}=.*$`, 'm');
  const line = `${key}=${value}`;
  if (re.test(content)) return content.replace(re, line);
  if (!content.trim()) return `${line}\n`;
  return `${content.replace(/\s*$/, '\n')}${line}\n`;
}

function saveRefreshToken(token) {
  let content = '';
  if (fs.existsSync(ENV_PATH)) {
    content = fs.readFileSync(ENV_PATH, 'utf8');
  }
  content = upsertEnvValue(content, 'YT_REFRESH_TOKEN', token);
  fs.writeFileSync(ENV_PATH, content, 'utf8');
}

async function waitForCallback(stateValue) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      server.close(() => reject(new Error('OAuth callback timed out.')));
    }, 5 * 60 * 1000);

    const server = http.createServer((req, res) => {
      const url = new URL(req.url, `http://127.0.0.1:${PORT}`);
      if (url.pathname !== '/oauth2callback') {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not found');
        return;
      }

      const code = url.searchParams.get('code');
      const state = url.searchParams.get('state');
      const error = url.searchParams.get('error');

      if (error) {
        res.writeHead(400, { 'Content-Type': 'text/plain' });
        res.end(`OAuth failed: ${error}`);
        clearTimeout(timeout);
        server.close(() => reject(new Error(`OAuth failed: ${error}`)));
        return;
      }

      if (!code || state !== stateValue) {
        res.writeHead(400, { 'Content-Type': 'text/plain' });
        res.end('Invalid OAuth callback.');
        return;
      }

      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end('YouTube authorization complete. You can close this tab.');

      clearTimeout(timeout);
      server.close(() => resolve(code));
    });

    server.listen(PORT, '127.0.0.1', () => {
      console.log(`[OAuth] Listening on ${REDIRECT_URI}`);
    });

    server.on('error', (error) => {
      clearTimeout(timeout);
      reject(error);
    });
  });
}

async function main() {
  requireConfig();

  const state = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const authUrl = buildAuthUrl(state);

  console.log('\nYouTube OAuth Setup\n');
  console.log('1) Open this URL in your browser and authorize:');
  console.log(authUrl);
  console.log('\n2) After approving, this script will capture the callback automatically.\n');

  const proceed = await askQuestion('Press Enter once ready to continue...');
  void proceed;

  const code = await waitForCallback(state);
  const tokens = await exchangeCodeForToken(code);

  if (!tokens.refresh_token) {
    throw new Error('No refresh_token returned. Ensure prompt=consent and first-time grant.');
  }

  saveRefreshToken(tokens.refresh_token);

  console.log('\nSuccess.');
  console.log('YT_REFRESH_TOKEN has been saved to .env.local');
  console.log('You can now run: npm run start:chat\n');
}

main().catch((error) => {
  console.error('\nOAuth setup failed:', error.message);
  process.exit(1);
});
