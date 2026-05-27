#!/usr/bin/env node
// One-time AI drafting. Run locally: `npm run draft` (optionally `npm run draft -- --only=15`).
// Reads ANTHROPIC_API_KEY from .env, generates each section's prose, and writes it into the
// body of content/sections/NN-slug.mdx WITHOUT touching the frontmatter. After running once
// and committing, the key is never needed again — the deployed site is fully static.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Anthropic from '@anthropic-ai/sdk';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SECTIONS_DIR = path.join(ROOT, 'content', 'sections');
const PROMPT_FILE = path.join(__dirname, 'prompts', 'section-prompt.md');

// --- tiny .env loader (no dependency) ---
function loadEnv() {
  const envPath = path.join(ROOT, '.env');
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}
loadEnv();

const API_KEY = process.env.ANTHROPIC_API_KEY;
if (!API_KEY) {
  console.error(
    '\nMissing ANTHROPIC_API_KEY.\n' +
      '  1. cp .env.example .env\n' +
      '  2. paste your key from https://console.anthropic.com/ into .env\n' +
      '  3. run `npm run draft` again\n',
  );
  process.exit(1);
}

const MODEL = process.env.DRAFT_MODEL || 'claude-sonnet-4-6';
const onlyArg = process.argv.find((a) => a.startsWith('--only='));
const only = onlyArg ? Number(onlyArg.split('=')[1]) : null;

const FRONTMATTER_RE = /^---\r?\n[\s\S]*?\r?\n---\r?\n?/;

function parseFrontmatter(raw) {
  const m = raw.match(FRONTMATTER_RE);
  if (!m) throw new Error('No frontmatter found');
  const block = m[0];
  const fields = {};
  for (const line of block.split('\n')) {
    const fm = line.match(/^(number|slug|title|summary):\s*(.*)$/);
    if (fm) fields[fm[1]] = fm[2].replace(/^["']|["']$/g, '').trim();
  }
  return { block, fields };
}

const client = new Anthropic({ apiKey: API_KEY });
const system = fs.readFileSync(PROMPT_FILE, 'utf8');

const files = fs
  .readdirSync(SECTIONS_DIR)
  .filter((f) => f.endsWith('.mdx'))
  .sort();

let written = 0;
for (const file of files) {
  const full = path.join(SECTIONS_DIR, file);
  const raw = fs.readFileSync(full, 'utf8');
  const { block, fields } = parseFrontmatter(raw);
  const number = Number(fields.number);
  if (only !== null && number !== only) continue;

  process.stdout.write(`Drafting ${number}. ${fields.title} … `);

  const userPrompt =
    `Write the body prose for this section.\n\n` +
    `Section number: ${number}\n` +
    `Section title: ${fields.title}\n` +
    `One-line summary: ${fields.summary}\n`;

  const resp = await client.messages.create({
    model: MODEL,
    max_tokens: 4096,
    // Cache the fixed framing so the 17 sequential calls reuse it cheaply.
    system: [{ type: 'text', text: system, cache_control: { type: 'ephemeral' } }],
    messages: [{ role: 'user', content: userPrompt }],
  });

  const body = resp.content
    .filter((b) => b.type === 'text')
    .map((b) => b.text)
    .join('')
    .trim();

  fs.writeFileSync(full, `${block}\n${body}\n`);
  written++;
  console.log('done');
}

console.log(`\nDrafted ${written} section(s). Review, then commit content/sections/.`);
