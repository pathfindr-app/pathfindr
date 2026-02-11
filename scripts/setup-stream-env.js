#!/usr/bin/env node

/**
 * Guided local setup for stream service secrets.
 * Writes/updates .env.local in project root.
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const ROOT = path.join(__dirname, '..');
const ENV_PATH = path.join(ROOT, '.env.local');

const FIELDS = [
  {
    key: 'STREAM_BACKEND_MODE',
    label: 'Stream backend mode',
    required: false,
    validate: (value) => /^(local|supabase)$/i.test(value),
    hint: 'Use "local" now. Switch to "supabase" later after credentials are ready.',
    defaultValue: 'local',
  },
  {
    key: 'STREAM_QUEUE_API_URL',
    label: 'Queue API URL',
    required: false,
    validate: (value) => /^https?:\/\/.+/i.test(value),
    hint: 'Default local queue endpoint',
    defaultValue: 'http://127.0.0.1:3000/api/requests',
  },
  {
    key: 'STREAM_QUEUE_API_KEY',
    label: 'Queue API Key (recommended)',
    required: false,
    validate: (value) => value.length >= 12,
    hint: 'Any long random string. Leave blank if you want no write protection.',
  },
  {
    key: 'STREAM_ENABLE_YT_WORKER',
    label: 'Enable YouTube chat worker now',
    required: false,
    validate: (value) => /^(1|0|true|false|yes|no|on|off|auto)$/i.test(value),
    hint: 'Use "false" until YouTube live + OAuth credentials are ready.',
    defaultValue: 'false',
  },
  {
    key: 'STREAM_PAID_ONLY',
    label: 'Paid-only queue mode',
    required: false,
    validate: (value) => /^(1|0|true|false|yes|no|on|off)$/i.test(value),
    hint: 'Set "true" to only accept paid YouTube requests. Manual admin requests still work.',
    defaultValue: 'false',
  },
  {
    key: 'SUPABASE_URL',
    label: 'Supabase Project URL (optional for now)',
    required: false,
    validate: (value) => /^https?:\/\/.+/i.test(value),
    hint: 'Example: https://your-project-ref.supabase.co',
  },
  {
    key: 'SUPABASE_SERVICE_ROLE_KEY',
    label: 'Supabase Service Role/Secret Key (optional for now)',
    required: false,
    validate: (value) => value.length >= 20,
    hint: 'Use the backend key from Supabase Settings -> API',
  },
  {
    key: 'YT_CLIENT_ID',
    label: 'YouTube OAuth Client ID (optional for now)',
    required: false,
    validate: (value) => value.includes('.apps.googleusercontent.com'),
    hint: 'From Google Cloud OAuth credentials',
  },
  {
    key: 'YT_CLIENT_SECRET',
    label: 'YouTube OAuth Client Secret (optional for now)',
    required: false,
    validate: (value) => value.length >= 10,
    hint: 'From Google Cloud OAuth credentials',
  },
  {
    key: 'YT_REFRESH_TOKEN',
    label: 'YouTube OAuth Refresh Token (optional for now)',
    required: false,
    validate: (value) => value.length >= 20,
    hint: 'Generated once during OAuth consent flow',
  },
];

function escapeRegExp(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function getEnvValue(content, key) {
  const re = new RegExp(`^${escapeRegExp(key)}=(.*)$`, 'm');
  const match = content.match(re);
  if (!match) return '';
  const raw = match[1].trim();
  if (
    (raw.startsWith('"') && raw.endsWith('"')) ||
    (raw.startsWith("'") && raw.endsWith("'"))
  ) {
    return raw.slice(1, -1);
  }
  return raw;
}

function upsertEnvValue(content, key, value) {
  const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`^${escaped}=.*$`, 'm');
  const nextLine = `${key}=${value}`;

  if (re.test(content)) {
    return content.replace(re, nextLine);
  }

  if (!content.trim()) return `${nextLine}\n`;
  return `${content.replace(/\s*$/, '\n')}${nextLine}\n`;
}

function maskValue(value) {
  if (!value) return '(not set)';
  if (value.length <= 8) return '********';
  return `${value.slice(0, 4)}...${value.slice(-4)}`;
}

function createPrompt() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const ask = (question) =>
    new Promise((resolve) => {
      rl.question(question, (answer) => resolve(answer));
    });

  return { rl, ask };
}

async function promptForField(ask, field, existingValue) {
  const effectiveCurrent = existingValue || field.defaultValue || '';
  const existingDisplay = existingValue
    ? ` [current: ${maskValue(existingValue)}]`
    : '';

  while (true) {
    const answer = await ask(
      `${field.label}${existingDisplay}\n${field.hint}\nEnter value${
        effectiveCurrent ? ' (press Enter to keep current/default)' : ''
      }: `
    );

    const trimmed = answer.trim();
    const chosen = trimmed || effectiveCurrent;

    if (!field.required && !trimmed && !existingValue && !field.defaultValue) {
      return null;
    }

    if (!chosen && field.required) {
      console.log(`\n${field.key} is required.\n`);
      continue;
    }

    if (chosen && field.validate && !field.validate(chosen)) {
      console.log(`\nThat value does not look valid for ${field.key}. Try again.\n`);
      continue;
    }

    return chosen;
  }
}

async function main() {
  let content = '';
  if (fs.existsSync(ENV_PATH)) {
    content = fs.readFileSync(ENV_PATH, 'utf8');
  }

  const { rl, ask } = createPrompt();

  try {
    console.log('\nPathfindr Stream Setup\n');
    console.log(`Writing secrets to: ${ENV_PATH}\n`);

    for (const field of FIELDS) {
      const existing = getEnvValue(content, field.key);
      const value = await promptForField(ask, field, existing);
      if (value === null) {
        console.log(`${field.key} skipped.\n`);
        continue;
      }
      content = upsertEnvValue(content, field.key, value);
      console.log(`${field.key} saved.\n`);
    }

    fs.writeFileSync(ENV_PATH, content, 'utf8');
    console.log('Done. .env.local updated successfully.\n');
  } finally {
    rl.close();
  }
}

main().catch((error) => {
  console.error('\nSetup failed:', error.message);
  process.exit(1);
});
