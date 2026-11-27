// Cover photo, cooking time and difficulty for recipe cards.
import { useEffect, useState } from 'react';
import type { Recipe } from './db';

// ── Cover photo ─────────────────────────────────────────────
// 1) TheMealDB dish photo whose name best matches the title  2) Wikipedia page image  3) none (styled placeholder)
const KEY = 'recipe-images-v2';
const read = (): Record<string, string> => { try { return JSON.parse(localStorage.getItem(KEY) || '{}'); } catch { return {}; } };
const write = (c: Record<string, string>) => { try { localStorage.setItem(KEY, JSON.stringify(c)); } catch { /* full */ } };

const STOP = new Set(['the', 'a', 'and', 'with', 'of', 'in', 'my', 'easy', 'quick', 'best', 'style', 'homemade', 'simple', 'recipe', 'test']);
const words = (s: string) => s.toLowerCase().replace(/\(.*?\)/g, ' ').replace(/[^\p{L}\s-]/gu, ' ').split(/[\s-]+/).filter((w) => w.length > 2 && !STOP.has(w));

async function mealDb(title: string, q: string): Promise<string | null> {
  const w = words(title);
  try {
    const j = await (await fetch(`https://www.themealdb.com/api/json/v1/1/search.php?s=${encodeURIComponent(q)}`)).json();
    const meals: { strMeal: string; strMealThumb: string }[] = j.meals ?? [];
    const score = (m: { strMeal: string }) => words(m.strMeal).filter((x) => w.includes(x)).length;
    const best = meals.sort((a, b) => score(b) - score(a))[0];
    return best && score(best) > 0 ? best.strMealThumb : null;
  } catch { return null; }
}

async function wikipedia(q: string): Promise<string | null> {
  try {
    const t = encodeURIComponent(q.charAt(0).toUpperCase() + q.slice(1)).replace(/%20/g, '_');
    const r = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${t}?redirect=true`);
    if (!r.ok) return null;
    const j = await r.json();
    const src: string | undefined = j.thumbnail?.source;
    // Ask Wikimedia for a sharper standard size than the 330px default.
    return j.type !== 'disambiguation' && src && !/\.svg\.png/i.test(src) ? src.replace(/\/330px-/, '/960px-') : null;
  } catch { return null; }
}

/** Dish names usually end the title ("Mughlai-style White Chicken Korma" → "chicken korma", "korma"). */
async function lookup(title: string): Promise<string | null> {
  const w = words(title);
  if (!w.length) return null;
  const last2 = w.slice(-2).join(' ');
  const last = w[w.length - 1];
  const steps: (() => Promise<string | null>)[] = [
    () => mealDb(title, last2), () => wikipedia(last2),
    () => mealDb(title, last), () => wikipedia(last),
    () => wikipedia(w.join(' ')),
    // Last resort: any dish sharing a main word (e.g. another chicken dish).
    ...w.slice(0, -1).reverse().map((x) => () => mealDb(title, x))
  ];
  for (const step of steps) {
    const url = await step();
    if (url) return url;
  }
  return null;
}

const inflight = new Map<string, Promise<string | null>>();
export function findRecipeImage(title: string): Promise<string | null> {
  const k = title.trim().toLowerCase();
  const cache = read();
  if (k in cache) return Promise.resolve(cache[k] || null);
  if (!navigator.onLine) return Promise.resolve(null);
  if (!inflight.has(k)) {
    inflight.set(k, (async () => {
      const url = await lookup(title);
      const c = read(); c[k] = url ?? ''; write(c);
      inflight.delete(k);
      return url;
    })());
  }
  return inflight.get(k)!;
}

export function useRecipeImage(title: string): string | null {
  const [url, setUrl] = useState<string | null>(() => read()[title.trim().toLowerCase()] || null);
  useEffect(() => {
    let live = true;
    findRecipeImage(title).then((u) => { if (live) setUrl(u); });
    return () => { live = false; };
  }, [title]);
  return url;
}

// ── Time & difficulty ───────────────────────────────────────
/** Uses the AI estimate if one was made, otherwise adds up times written in the steps. */
export function recipeMinutes(r: Recipe): number {
  try {
    const ai = JSON.parse(localStorage.getItem(`ai:analyze:${r.uid}:${r.updatedAt}`) || 'null');
    if (ai?.totalMinutes) return ai.totalMinutes;
  } catch { /* ignore */ }
  let total = 0;
  for (const s of r.steps) {
    for (const m of s.matchAll(/(\d+(?:\.\d+)?)(?:\s*[-–to]+\s*(\d+(?:\.\d+)?))?\s*(hours?|hrs?|h\b|minutes?|mins?|m\b)/gi)) {
      const n = Number(m[2] ?? m[1]);
      total += /^h/i.test(m[3]) ? n * 60 : n;
    }
  }
  if (!total) total = Math.max(10, r.steps.length * 5);
  return Math.min(Math.round(total), 24 * 60);
}

export function difficulty(r: Recipe): 'Easy' | 'Medium' | 'Hard' {
  const n = r.steps.length + r.ingredients.length / 2;
  return n <= 9 ? 'Easy' : n <= 20 ? 'Medium' : 'Hard';
}

export function shortTime(m: number): string {
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60), mm = m % 60;
  return mm ? `${h} h ${mm} min` : `${h} h`;
}
