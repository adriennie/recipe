import Dexie, { type Table } from 'dexie';

export const CATEGORIES = ['Food', 'Drink', 'Baking', 'Beauty', 'Home', 'Craft', 'Other'] as const;
export type Category = (typeof CATEGORIES)[number];

/** Fields used to sync with Supabase. `uid` is the shared ID; `dirty` = changed here and not uploaded yet. */
interface Syncable {
  uid?: string;
  dirty?: 0 | 1;
  syncedAt?: number;
}

export interface Recipe extends Syncable {
  id?: number;
  title: string;
  category: Category;
  ingredients: string[];
  steps: string[];
  rawText: string;
  favorite: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface GroceryItem extends Syncable {
  id?: number;
  text: string;
  key: string; // normalized text, used to merge duplicates
  count: number;
  checked: boolean;
  sources: string[]; // recipe titles this item came from
  section?: string; // shop section, set by Tidy my list
  createdAt: number;
  updatedAt?: number;
}

/** UUID that also works on plain-http pages (where crypto.randomUUID is missing). */
export function uuid(): string {
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  const b = crypto.getRandomValues(new Uint8Array(16));
  b[6] = (b[6] & 0x0f) | 0x40; b[8] = (b[8] & 0x3f) | 0x80;
  const h = Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

class RecipeDB extends Dexie {
  recipes!: Table<Recipe, number>;
  grocery!: Table<GroceryItem, number>;
  constructor() {
    super('recipe-reader');
    this.version(1).stores({
      recipes: '++id, title, category, favorite, updatedAt',
      grocery: '++id, key, checked, createdAt'
    });
    // v2: every row gets a uid so it can be matched with its copy in Supabase.
    this.version(2).stores({
      recipes: '++id, &uid, title, category, favorite, updatedAt',
      grocery: '++id, &uid, key, checked, createdAt'
    }).upgrade(async (tx) => {
      await tx.table('recipes').toCollection().modify((r: Recipe) => { r.uid ??= uuid(); r.dirty = 1; });
      await tx.table('grocery').toCollection().modify((g: GroceryItem) => { g.uid ??= uuid(); g.updatedAt ??= g.createdAt; g.dirty = 1; });
    });
  }
}

export const db = new RecipeDB();

// Ask the browser not to evict our data (installed Home Screen apps are kept anyway).
navigator.storage?.persist?.().catch(() => {});

// ── Change tracking for sync ───────────────────────────────
// Every local add/edit/delete is marked so the sync module knows what to upload.
// While sync is writing data that came *from* Supabase, `applyingRemote` is true and nothing is marked.

export const syncFlags = { applyingRemote: false };
const SYNC_ONLY = new Set(['dirty', 'syncedAt']);
let onLocalChange: () => void = () => {};
export const setLocalChangeListener = (fn: () => void) => { onLocalChange = fn; };

const TOMB_KEY = 'sync-deleted-v1';
export type SyncTable = 'recipes' | 'grocery_items';
export function readTombstones(): { table: SyncTable; uid: string }[] {
  try { return JSON.parse(localStorage.getItem(TOMB_KEY) || '[]'); } catch { return []; }
}
export function writeTombstones(list: { table: SyncTable; uid: string }[]) {
  try { localStorage.setItem(TOMB_KEY, JSON.stringify(list)); } catch { /* ignore */ }
}

function track<T extends Syncable & { updatedAt?: number }>(table: Table<T, number>, remote: SyncTable) {
  table.hook('creating', (_pk, obj) => {
    if (syncFlags.applyingRemote) return;
    obj.uid ??= uuid();
    obj.updatedAt = Date.now();
    obj.dirty = 1;
    delete obj.syncedAt;
    setTimeout(onLocalChange);
  });
  table.hook('updating', (mods) => {
    if (syncFlags.applyingRemote) return;
    if (Object.keys(mods).every((k) => SYNC_ONLY.has(k))) return;
    setTimeout(onLocalChange);
    return { updatedAt: Date.now(), dirty: 1 };
  });
  table.hook('deleting', (_pk, obj) => {
    if (syncFlags.applyingRemote) return;
    if (obj?.uid && obj.syncedAt) writeTombstones([...readTombstones(), { table: remote, uid: obj.uid }]);
    setTimeout(onLocalChange);
  });
}
track(db.recipes, 'recipes');
track(db.grocery, 'grocery_items');

export const normalize = (s: string) => s.trim().toLowerCase().replace(/\s+/g, ' ');

/** Add items to the grocery list, merging duplicates that are not yet checked off. */
export async function addToGrocery(texts: string[], source?: string) {
  await db.transaction('rw', db.grocery, async () => {
    for (const raw of texts) {
      const text = raw.trim();
      if (!text) continue;
      const key = normalize(text);
      const existing = await db.grocery.where('key').equals(key).filter((g) => !g.checked).first();
      if (existing) {
        const sources = source && !existing.sources.includes(source) ? [...existing.sources, source] : existing.sources;
        await db.grocery.update(existing.id!, { count: existing.count + 1, sources });
      } else {
        await db.grocery.add({ text, key, count: 1, checked: false, sources: source ? [source] : [], createdAt: Date.now() });
      }
    }
  });
}

export interface Backup { app: 'recipe-reader'; version: 1; exportedAt: string; recipes: Recipe[]; grocery: GroceryItem[] }

export async function exportBackup(): Promise<Backup> {
  return {
    app: 'recipe-reader',
    version: 1,
    exportedAt: new Date().toISOString(),
    recipes: await db.recipes.toArray(),
    grocery: await db.grocery.toArray()
  };
}

/** Adds the backup's recipes and grocery items alongside what is already saved. */
export async function importBackup(data: unknown): Promise<{ recipes: number; grocery: number }> {
  const b = data as Partial<Backup>;
  if (b?.app !== 'recipe-reader' || !Array.isArray(b.recipes) || !Array.isArray(b.grocery)) {
    throw new Error('This file is not a Recipe Reader backup.');
  }
  const strip = <T extends { id?: number } & Syncable>({ id: _id, uid: _u, dirty: _d, syncedAt: _s, ...rest }: T) => rest as T;
  await db.transaction('rw', db.recipes, db.grocery, async () => {
    await db.recipes.bulkAdd(b.recipes!.map(strip));
    await db.grocery.bulkAdd(b.grocery!.map(strip));
  });
  return { recipes: b.recipes.length, grocery: b.grocery.length };
}
