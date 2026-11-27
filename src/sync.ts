// Two-way sync between the on-phone database (Dexie) and Supabase.
// The phone stays the main copy, so the app works offline and without an account.
// When signed in: local changes are uploaded, then everything in the account is downloaded.
// If the same item changed in two places, the most recent edit wins.

import { createClient, type Session, type SupabaseClient } from '@supabase/supabase-js';
import { useSyncExternalStore } from 'react';
import type { Table } from 'dexie';
import {
  db, syncFlags, setLocalChangeListener, readTombstones, writeTombstones,
  type Recipe, type GroceryItem, type SyncTable, type Category
} from './db';

const env = import.meta.env;
const url: string | undefined = env.NEXT_PUBLIC_SUPABASE_URL || env.VITE_SUPABASE_URL;
const key: string | undefined = env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || env.VITE_SUPABASE_PUBLISHABLE_KEY
  || env.NEXT_PUBLIC_SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY;

export const supabase: SupabaseClient | null = url && key
  ? createClient(url, key, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } })
  : null;

// ── Status that the UI can subscribe to ──────────────────────
export interface SyncStatus {
  configured: boolean;
  email: string | null;
  state: 'signed-out' | 'idle' | 'syncing' | 'offline' | 'error';
  lastSync: number | null;
  error: string | null;
  /** Opened from a "reset password" email; the app should ask for a new password. */
  recovering: boolean;
}

let status: SyncStatus = { configured: !!supabase, email: null, state: 'signed-out', lastSync: readLastSync(), error: null, recovering: false };
const listeners = new Set<() => void>();
function setStatus(patch: Partial<SyncStatus>) {
  status = { ...status, ...patch };
  listeners.forEach((l) => l());
}
export function useSyncStatus(): SyncStatus {
  return useSyncExternalStore((l) => { listeners.add(l); return () => listeners.delete(l); }, () => status);
}

function readLastSync(): number | null {
  try { return Number(localStorage.getItem('sync-last')) || null; } catch { return null; }
}

// ── Mapping between the phone's shape and the database columns ─
interface RemoteRecipe {
  id: string; user_id: string; title: string; category: string; ingredients: string[]; steps: string[];
  raw_text: string; favorite: boolean; created_at: string; updated_at: string;
}
interface RemoteGrocery {
  id: string; user_id: string; text: string; key: string; count: number; checked: boolean;
  sources: string[]; created_at: string; updated_at: string;
  section?: string | null; // column added by supabase/ai.sql
}

const iso = (ms: number | undefined) => new Date(ms ?? Date.now()).toISOString();
const ms = (s: string) => Date.parse(s);

const recipeMap = {
  toRemote: (r: Recipe, userId: string): RemoteRecipe => ({
    id: r.uid!, user_id: userId, title: r.title, category: r.category, ingredients: r.ingredients, steps: r.steps,
    raw_text: r.rawText ?? '', favorite: !!r.favorite, created_at: iso(r.createdAt), updated_at: iso(r.updatedAt)
  }),
  fromRemote: (x: RemoteRecipe): Recipe => ({
    uid: x.id, title: x.title, category: x.category as Category, ingredients: x.ingredients ?? [], steps: x.steps ?? [],
    rawText: x.raw_text ?? '', favorite: x.favorite, createdAt: ms(x.created_at), updatedAt: ms(x.updated_at)
  })
};

const groceryMap = {
  toRemote: (g: GroceryItem, userId: string): RemoteGrocery => ({
    id: g.uid!, user_id: userId, text: g.text, key: g.key, count: g.count, checked: g.checked, sources: g.sources ?? [],
    created_at: iso(g.createdAt), updated_at: iso(g.updatedAt ?? g.createdAt),
    // Only send a section once one exists, so sync keeps working before supabase/ai.sql is run.
    ...(g.section ? { section: g.section } : {})
  }),
  fromRemote: (x: RemoteGrocery): GroceryItem => ({
    uid: x.id, text: x.text, key: x.key, count: x.count, checked: x.checked, sources: x.sources ?? [],
    createdAt: ms(x.created_at), updatedAt: ms(x.updated_at), ...(x.section ? { section: x.section } : {})
  })
};

type Local = (Recipe | GroceryItem) & { updatedAt?: number };
interface Spec<L extends Local, R extends { id: string; updated_at: string }> {
  remote: SyncTable;
  table: Table<L, number>;
  toRemote: (l: L, userId: string) => R;
  fromRemote: (r: R) => L;
}
const recipeSpec: Spec<Recipe, RemoteRecipe> = { remote: 'recipes', table: db.recipes, ...recipeMap };
const grocerySpec: Spec<GroceryItem, RemoteGrocery> = { remote: 'grocery_items', table: db.grocery, ...groceryMap };

// ── Sync steps ─────────────────────────────────────────────
async function push<L extends Local, R extends { id: string; updated_at: string }>(s: Spec<L, R>, userId: string) {
  const dirty = await s.table.filter((r) => r.dirty === 1 && !!r.uid).toArray();
  if (!dirty.length) return;
  for (let i = 0; i < dirty.length; i += 200) {
    const batch = dirty.slice(i, i + 200);
    const { error } = await supabase!.from(s.remote).upsert(batch.map((r) => s.toRemote(r, userId)));
    if (error) throw error;
    const now = Date.now();
    await db.transaction('rw', s.table, async () => {
      for (const r of batch) {
        const cur = await s.table.get(r.id!);
        // Only mark clean if it wasn't edited again while uploading.
        if (cur && cur.updatedAt === r.updatedAt) await s.table.update(r.id!, { dirty: 0, syncedAt: now } as never);
      }
    });
  }
}

async function pushDeletes() {
  const tombs = readTombstones();
  if (!tombs.length) return;
  const done = new Set<string>();
  for (const t of ['recipes', 'grocery_items'] as SyncTable[]) {
    const ids = tombs.filter((x) => x.table === t).map((x) => x.uid);
    if (!ids.length) continue;
    const { error } = await supabase!.from(t).delete().in('id', ids);
    if (error) throw error;
    ids.forEach((id) => done.add(id));
  }
  writeTombstones(readTombstones().filter((x) => !done.has(x.uid)));
}

async function fetchAll<R>(table: SyncTable): Promise<R[]> {
  const out: R[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabase!.from(table).select('*').order('created_at').range(from, from + 999);
    if (error) throw error;
    out.push(...(data as R[]));
    if (!data || data.length < 1000) return out;
  }
}

async function pull<L extends Local, R extends { id: string; updated_at: string }>(s: Spec<L, R>) {
  const remote = await fetchAll<R>(s.remote);
  const deleted = new Set(readTombstones().map((t) => t.uid));
  const now = Date.now();
  syncFlags.applyingRemote = true;
  try {
    await db.transaction('rw', s.table, async () => {
      const local = await s.table.toArray();
      const byUid = new Map(local.filter((l) => l.uid).map((l) => [l.uid!, l]));
      const seen = new Set<string>();
      for (const r of remote) {
        seen.add(r.id);
        if (deleted.has(r.id)) continue;
        const l = byUid.get(r.id);
        const incoming = { ...s.fromRemote(r), dirty: 0 as const, syncedAt: now };
        if (!l) await s.table.add(incoming);
        else if (l.dirty === 1 && (l.updatedAt ?? 0) >= ms(r.updated_at)) continue; // newer local edit wins; uploaded next round
        else if ((l.updatedAt ?? 0) !== ms(r.updated_at) || l.dirty === 1) await s.table.put({ ...incoming, id: l.id });
        else if (!l.syncedAt) await s.table.update(l.id!, { syncedAt: now } as never);
      }
      // Rows that were synced before but are gone from the account were deleted on another device.
      const gone = local.filter((l) => l.uid && l.syncedAt && l.dirty !== 1 && !seen.has(l.uid)).map((l) => l.id!);
      if (gone.length) await s.table.bulkDelete(gone);
    });
  } finally {
    syncFlags.applyingRemote = false;
  }
}

// ── Public API ────────────────────────────────────────────
let running = false;
let again = false;

export async function syncNow(): Promise<void> {
  if (!supabase) return;
  if (running) { again = true; return; }
  const { data } = await supabase.auth.getSession();
  const session = data.session;
  if (!session) { setStatus({ state: 'signed-out', email: null }); return; }
  if (!navigator.onLine) { setStatus({ state: 'offline' }); return; }

  running = true;
  setStatus({ state: 'syncing', error: null, email: session.user.email ?? null });
  try {
    await push(recipeSpec, session.user.id);
    await push(grocerySpec, session.user.id);
    await pushDeletes();
    await pull(recipeSpec);
    await pull(grocerySpec);
    const t = Date.now();
    try { localStorage.setItem('sync-last', String(t)); } catch { /* ignore */ }
    setStatus({ state: 'idle', lastSync: t });
  } catch (e) {
    setStatus({ state: 'error', error: friendlyError(e) });
  } finally {
    running = false;
    if (again) { again = false; void syncNow(); }
  }
}

function friendlyError(e: unknown): string {
  const m = (e as { message?: string })?.message ?? String(e);
  if (/relation .* does not exist|Could not find the table/i.test(m)) return 'The database tables are missing. Run supabase/schema.sql in the Supabase SQL Editor.';
  if (/Failed to fetch|NetworkError|Load failed/i.test(m)) return "Couldn't reach the server. Check your internet connection.";
  return m;
}

export function authErrorMessage(e: unknown): string {
  const m = (e as { message?: string })?.message ?? String(e);
  if (/Invalid login credentials/i.test(m)) return 'Wrong email or password.';
  if (/Email not confirmed/i.test(m)) return 'Please confirm your email first — check your inbox for the link, then sign in.';
  if (/User already registered/i.test(m)) return 'An account with this email already exists. Try signing in.';
  if (/Password should be/i.test(m)) return 'Password must be at least 6 characters.';
  if (/provider is not enabled|Unsupported provider/i.test(m)) return 'GitHub sign-in is not turned on yet. In Supabase: Authentication → Sign In / Providers → GitHub.';
  return friendlyError(e);
}

export async function signIn(email: string, password: string) {
  const { error } = await supabase!.auth.signInWithPassword({ email, password });
  if (error) throw error;
}

/** Returns true if the account is ready, false if the user must confirm their email first. */
export async function signUp(email: string, password: string): Promise<boolean> {
  const { data, error } = await supabase!.auth.signUp({
    email, password, options: { emailRedirectTo: location.origin + location.pathname }
  });
  if (error) throw error;
  // Supabase hides "already registered" by returning a user with no identities.
  if (data.user && data.user.identities?.length === 0) throw new Error('User already registered');
  return !!data.session;
}

/** Sends the browser to GitHub to sign in; it comes back to this page already signed in. */
export async function signInWithGitHub() {
  // If GitHub isn't turned on, Supabase shows a bare error page, so check first.
  try {
    const r = await fetch(`${url}/auth/v1/settings`, { headers: { apikey: key! } });
    const settings = await r.json();
    if (settings?.external && !settings.external.github) throw new Error('provider is not enabled');
  } catch (e) {
    if (/not enabled/.test((e as Error).message)) throw e; // otherwise carry on and let Supabase decide
  }
  const { error } = await supabase!.auth.signInWithOAuth({
    provider: 'github',
    options: { redirectTo: location.origin + location.pathname }
  });
  if (error) throw error;
}

// A failed GitHub sign-in comes back as #error=...; remember it and show Settings.
let oauthError: string | null = null;
function captureOAuthError() {
  const params = new URLSearchParams(location.hash.replace(/^#\/?/, '') + '&' + location.search.slice(1));
  const err = params.get('error_description') || params.get('error');
  if (!err) return;
  oauthError = err.replace(/\+/g, ' ');
  history.replaceState(null, '', location.pathname + '#/settings');
}

/** Returns (once) the error from a failed GitHub sign-in, if any. */
export function takeOAuthError(): string | null {
  const e = oauthError;
  oauthError = null;
  return e;
}

export async function sendPasswordReset(email: string) {
  const { error } = await supabase!.auth.resetPasswordForEmail(email, { redirectTo: location.origin + location.pathname });
  if (error) throw error;
}

/** Uploads anything pending, signs out and removes this account's data from the phone (it stays in the account). */
export async function signOut(): Promise<void> {
  await syncNow();
  if (status.state === 'error' || status.state === 'offline') {
    throw new Error('Some changes have not been uploaded yet. Connect to the internet and try again so nothing is lost.');
  }
  await supabase!.auth.signOut();
  syncFlags.applyingRemote = true;
  try { await db.transaction('rw', db.recipes, db.grocery, async () => { await db.recipes.clear(); await db.grocery.clear(); }); }
  finally { syncFlags.applyingRemote = false; }
  writeTombstones([]);
  try { localStorage.removeItem('sync-last'); } catch { /* ignore */ }
  setStatus({ state: 'signed-out', email: null, lastSync: null, error: null });
}

// ── Automatic triggers ────────────────────────────────────
let timer: ReturnType<typeof setTimeout> | undefined;
const soon = (ms = 1500) => { clearTimeout(timer); timer = setTimeout(() => void syncNow(), ms); };

export function startSync() {
  if (!supabase) return;
  captureOAuthError();
  supabase.auth.onAuthStateChange((event, session: Session | null) => {
    if (!session) { setStatus({ state: 'signed-out', email: null }); return; }
    setStatus({ email: session.user.email ?? null });
    if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN') soon(100);
    if (event === 'PASSWORD_RECOVERY') { setStatus({ recovering: true }); location.hash = '/settings'; }
  });
  setLocalChangeListener(() => soon());
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') soon(300); });
  window.addEventListener('online', () => soon(300));
  // Pick up changes from other devices while the app is open.
  setInterval(() => { if (document.visibilityState === 'visible') void syncNow(); }, 60_000);
}

export async function updatePassword(password: string) {
  const { error } = await supabase!.auth.updateUser({ password });
  if (error) throw error;
  setStatus({ recovering: false });
}
