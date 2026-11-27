import Dexie, { type Table } from 'dexie';

export const CATEGORIES = ['Food', 'Drink', 'Baking', 'Beauty', 'Home', 'Craft', 'Other'] as const;
export type Category = (typeof CATEGORIES)[number];

export interface Recipe {
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

export interface GroceryItem {
  id?: number;
  text: string;
  key: string; // normalized text, used to merge duplicates
  count: number;
  checked: boolean;
  sources: string[]; // recipe titles this item came from
  createdAt: number;
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
  }
}

export const db = new RecipeDB();

// Ask the browser not to evict our data (installed Home Screen apps are kept anyway).
navigator.storage?.persist?.().catch(() => {});

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
  const strip = <T extends { id?: number }>({ id: _id, ...rest }: T) => rest as T;
  await db.transaction('rw', db.recipes, db.grocery, async () => {
    await db.recipes.bulkAdd(b.recipes!.map(strip));
    await db.grocery.bulkAdd(b.grocery!.map(strip));
  });
  return { recipes: b.recipes.length, grocery: b.grocery.length };
}
