#!/usr/bin/env node
// Checks the Supabase setup from the terminal:  npm run test:supabase
//
// Part 1 (no login): the tables exist and strangers can't read or write.
// Part 2 (your account): add, read, edit and delete a test recipe and grocery item exactly
//         the way the app does, and show what the app has already synced to your account.
//         Test rows are deleted at the end; your own recipes are never changed.
//
// Sign in either with GitHub (a browser window opens; nothing to type here) or with
// email + password (typed into the terminal, password hidden, or TEST_EMAIL / TEST_PASSWORD).
// GitHub sign-in needs  http://localhost:8787/**  in Supabase → Authentication → URL Configuration → Redirect URLs.

import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import readline from 'node:readline';
import http from 'node:http';
import { exec } from 'node:child_process';

// ── .env ────────────────────────────────────────────────
if (existsSync('.env')) {
  for (const line of readFileSync('.env', 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}
const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY
  || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
if (!url || !key) {
  console.error('✗ Missing NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in .env');
  process.exit(1);
}

const c = { g: (s) => `\x1b[32m${s}\x1b[0m`, r: (s) => `\x1b[31m${s}\x1b[0m`, d: (s) => `\x1b[2m${s}\x1b[0m`, b: (s) => `\x1b[1m${s}\x1b[0m` };
let failed = 0;
const ok = (msg) => console.log(`  ${c.g('✓')} ${msg}`);
const bad = (msg, detail) => { failed++; console.log(`  ${c.r('✗')} ${msg}${detail ? c.d(' — ' + detail) : ''}`); };
const check = (cond, msg, detail) => (cond ? ok(msg) : bad(msg, detail));
const opts = { auth: { persistSession: false, autoRefreshToken: false } };

// ── Part 1: without an account ─────────────────────────────
console.log(c.b('\n1. Database setup (no login)'));
const anon = createClient(url, key, opts);
for (const t of ['recipes', 'grocery_items']) {
  const { error } = await anon.from(t).select('id').limit(1);
  check(!error, `table "${t}" exists`, error?.message);
}
{
  const { data } = await anon.from('recipes').select('id');
  check((data ?? []).length === 0, 'strangers see no recipes');
  const { error } = await anon.from('recipes').insert({ id: randomUUID(), user_id: randomUUID(), title: 'anon test' });
  check(!!error, 'strangers cannot add recipes', error ? undefined : 'insert was allowed!');
}
if (failed) {
  console.log(c.r('\nFix the problems above first: run supabase/schema.sql in the Supabase SQL Editor.\n'));
  process.exit(1);
}

// ── Credentials ────────────────────────────────────────────
function ask(question, hidden = false) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    if (hidden) {
      rl._writeToOutput = (s) => { if (s.includes(question)) rl.output.write(s); else if (!/[\r\n]/.test(s)) rl.output.write('*'); };
    }
    rl.question(question, (a) => { rl.close(); if (hidden) process.stdout.write('\n'); resolve(a.trim()); });
  });
}

const CALLBACK_PORT = Number(process.env.TEST_CALLBACK_PORT || 8787);

/** Opens the browser for GitHub sign-in and waits for Supabase to send it back to a local page. */
async function githubLogin(client) {
  // Check first: when GitHub is off, Supabase only shows a bare error page in the browser.
  const settings = await fetch(`${url}/auth/v1/settings`, { headers: { apikey: key } }).then((r) => r.json()).catch(() => null);
  if (settings?.external && !settings.external.github) throw new Error('provider is not enabled');
  const redirectTo = `http://localhost:${CALLBACK_PORT}/callback`;
  const { data, error } = await client.auth.signInWithOAuth({ provider: 'github', options: { redirectTo, skipBrowserRedirect: true } });
  if (error) throw error;

  const code = await new Promise((resolve, reject) => {
    const timer = setTimeout(() => { server.close(); reject(new Error('timed out after 3 minutes')); }, 180_000);
    const server = http.createServer((req, res) => {
      const u = new URL(req.url, redirectTo);
      if (u.pathname !== '/callback') { res.writeHead(404).end(); return; }
      const err = u.searchParams.get('error_description') || u.searchParams.get('error');
      const code = u.searchParams.get('code');
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(`<!doctype html><meta name=viewport content="width=device-width"><body style="font:18px system-ui;padding:40px;text-align:center">
        ${code ? '✅ Signed in. You can close this tab and go back to the terminal.' : '❌ Sign-in failed: ' + (err ?? 'no code returned')}</body>`);
      clearTimeout(timer); server.close();
      code ? resolve(code) : reject(new Error(err ?? 'no code returned'));
    });
    server.on('error', (e) => { clearTimeout(timer); reject(e.code === 'EADDRINUSE' ? new Error(`port ${CALLBACK_PORT} is busy — set TEST_CALLBACK_PORT to another port`) : e); });
    server.listen(CALLBACK_PORT, () => {
      console.log(c.d('    Opening your browser to sign in with GitHub…'));
      console.log(c.d(`    If it doesn't open, visit:\n    ${data.url}`));
      const opener = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'start ""' : 'xdg-open';
      exec(`${opener} "${data.url}"`);
    });
  });

  const { data: session, error: exErr } = await client.auth.exchangeCodeForSession(code);
  if (exErr) throw exErr;
  return session;
}

// In-memory storage so the GitHub (PKCE) sign-in can keep its one-time verifier.
const memory = new Map();
const me = createClient(url, key, {
  auth: {
    flowType: 'pkce', persistSession: true, autoRefreshToken: false, detectSessionInUrl: false,
    storage: { getItem: (k) => memory.get(k) ?? null, setItem: (k, v) => memory.set(k, v), removeItem: (k) => memory.delete(k) }
  }
});

let email = process.env.TEST_EMAIL;
let password = process.env.TEST_PASSWORD;
let method = process.env.TEST_LOGIN || (email && password ? 'email' : '');
console.log(c.b('\n2. Your account'));
if (!method) {
  if (!process.stdin.isTTY) {
    console.log(c.d('    (Skipping: run in a terminal, or set TEST_LOGIN=github, or TEST_EMAIL and TEST_PASSWORD.)\n'));
    process.exit(0);
  }
  const pick = await ask('  Sign in with [1] GitHub (opens browser) or [2] email & password? (1): ');
  method = pick === '2' ? 'email' : 'github';
}

let auth;
if (method === 'github') {
  try { auth = await githubLogin(me); }
  catch (e) {
    const m = e.message ?? String(e);
    bad('sign in with GitHub', /not enabled|Unsupported provider/i.test(m)
      ? 'turn GitHub on in Supabase → Authentication → Sign In / Providers → GitHub'
      : m);
    console.log(c.d(`    Also check http://localhost:${CALLBACK_PORT}/** is in Supabase → Authentication → URL Configuration → Redirect URLs.`));
    process.exit(1);
  }
} else {
  email ||= await ask('  Email: ');
  password ||= await ask('  Password (hidden): ', true);
  const { data, error } = await me.auth.signInWithPassword({ email, password });
  if (error) {
    bad('sign in', /confirm/i.test(error.message) ? 'confirm your email first (check your inbox)' : error.message);
    process.exit(1);
  }
  auth = data;
}
const uid = auth.user.id;
ok(`signed in as ${auth.user.email ?? auth.user.user_metadata?.user_name ?? auth.user.id} (${auth.user.app_metadata?.provider ?? method})`);

const { data: mine } = await me.from('recipes').select('title, updated_at').order('updated_at', { ascending: false });
const { count: gcount } = await me.from('grocery_items').select('id', { count: 'exact', head: true });
console.log(c.d(`    Already synced from the app: ${mine?.length ?? 0} recipe(s), ${gcount ?? 0} grocery item(s)`));
for (const r of (mine ?? []).slice(0, 5)) console.log(c.d(`      • ${r.title}  (${new Date(r.updated_at).toLocaleString()})`));

const recipeId = randomUUID();
const groceryId = randomUUID();
const now = new Date().toISOString();
try {
  // Same shape the app uploads (src/sync.ts)
  let { error } = await me.from('recipes').upsert({
    id: recipeId, user_id: uid, title: 'Sync test recipe', category: 'Food',
    ingredients: ['1 cup flour', '2 eggs'], steps: ['Mix.', 'Bake.'], raw_text: '', favorite: false,
    created_at: now, updated_at: now
  });
  check(!error, 'upload a recipe', error?.message);

  const { data: got } = await me.from('recipes').select('*').eq('id', recipeId).single();
  check(got?.title === 'Sync test recipe' && got?.ingredients?.length === 2 && got?.steps?.[1] === 'Bake.', 'download it back with ingredients and steps');

  const later = new Date(Date.now() + 1000).toISOString();
  ({ error } = await me.from('recipes').upsert({ ...got, title: 'Sync test recipe (edited)', favorite: true, updated_at: later }));
  const { data: edited } = await me.from('recipes').select('title, favorite, updated_at').eq('id', recipeId).single();
  check(!error && edited?.title.endsWith('(edited)') && edited?.favorite && Date.parse(edited.updated_at) === Date.parse(later), 'edit it (newer edit replaces older)', error?.message);

  ({ error } = await me.from('grocery_items').upsert({
    id: groceryId, user_id: uid, text: 'Sync test milk', key: 'sync test milk', count: 1, checked: false,
    sources: ['Sync test recipe'], created_at: now, updated_at: now
  }));
  check(!error, 'add a grocery item', error?.message);
  ({ error } = await me.from('grocery_items').update({ checked: true, updated_at: later }).eq('id', groceryId));
  const { data: g } = await me.from('grocery_items').select('checked').eq('id', groceryId).single();
  check(!error && g?.checked === true, 'tick it off', error?.message);

  // Privacy: the same row must be invisible without your login
  const { data: peek } = await anon.from('recipes').select('id').eq('id', recipeId);
  check((peek ?? []).length === 0, 'your recipe is hidden from people who are not signed in');
  const { data: stolen } = await anon.from('recipes').update({ title: 'hacked' }).eq('id', recipeId).select();
  check((stolen ?? []).length === 0, 'and they cannot change it');

  // Someone else's user_id must be rejected
  ({ error } = await me.from('recipes').insert({ id: randomUUID(), user_id: randomUUID(), title: 'not mine' }));
  check(!!error, "you can't save rows into someone else's account");
} finally {
  await me.from('grocery_items').delete().eq('id', groceryId);
  const { error } = await me.from('recipes').delete().eq('id', recipeId);
  const { data: left } = await me.from('recipes').select('id').eq('id', recipeId);
  check(!error && (left ?? []).length === 0, 'delete the test rows (cleanup)', error?.message);
  await me.auth.signOut();
}

console.log(failed ? c.r(`\n${failed} check(s) failed.\n`) : c.g('\nAll checks passed — Supabase is ready for syncing.\n'));
process.exit(failed ? 1 : 0);
