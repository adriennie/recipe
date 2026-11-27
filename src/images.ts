// Finds a picture for an ingredient line.
// 1) TheMealDB ingredient photos (≈1000 foods, free, no key)  2) Wikipedia's page image  3) an emoji.
// Results are remembered on the device; the images themselves are cached by the service worker for offline use.

const LIST_KEY = 'mealdb-ingredients-v1';
const CACHE_KEY = 'ingredient-images-v1';
const PREF_KEY = 'show-ingredient-images';

export function imagesEnabled(): boolean {
  try { return localStorage.getItem(PREF_KEY) !== 'off'; } catch { return true; }
}
export function setImagesEnabled(on: boolean) {
  try { localStorage.setItem(PREF_KEY, on ? 'on' : 'off'); } catch { /* ignore */ }
}

const read = <T,>(k: string, fallback: T): T => { try { return JSON.parse(localStorage.getItem(k) || 'null') ?? fallback; } catch { return fallback; } };
const write = (k: string, v: unknown) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* full or blocked */ } };

const QTY_WORDS = /\b(\d+([.,/]\d+)?|[½⅓⅔¼¾⅛]|a|an|one|two|three|four|five|six|half|few|some|of|cups?|tbsps?|tbs|tablespoons?|tsps?|teaspoons?|g|grams?|kg|ml|l|litres?|liters?|oz|ounces?|lbs?|pounds?|cloves?|pinch(es)?|dash(es)?|drops?|slices?|cans?|tins?|packets?|packs?|sticks?|bunch(es)?|handfuls?|pieces?|sprigs?|heads?|stalks?|jars?|bottles?|bags?|scoops?)\b/gi;
const DESCRIPTORS = /\b(fresh(ly)?|ripe|large|small|medium|big|chopped|diced|minced|sliced|finely|roughly|thinly|peeled|grated|melted|softened|cold|warm|hot|boiling|lukewarm|room temperature|organic|extra|optional|to taste|beaten|whole|halved|quartered|crushed|ground|dried|frozen|cooked|raw|plain|pure|good quality|about|approx(imately)?|or more|plus more|for serving|for garnish|divided|packed|heaped|level|rounded|sifted|cubed|shredded|toasted|unsalted|salted|skinless|boneless)\b/gi;

/** "2 tbsp unsalted butter, softened (room temp)" → "butter" */
export function ingredientName(line: string): string {
  let s = line.toLowerCase().replace(/\(.*?\)/g, ' ').split(/[,;:]| - | – /)[0];
  s = s.replace(QTY_WORDS, ' ').replace(DESCRIPTORS, ' ').replace(/[^\p{L}\s'-]/gu, ' ').replace(/\s+/g, ' ').trim();
  return singular(s);
}

function singular(s: string): string {
  return s.split(' ').map((w, i, a) => {
    if (i !== a.length - 1 || w.length < 4 || /ss$|us$|is$/.test(w)) return w;
    if (/ies$/.test(w)) return w.slice(0, -3) + 'y';
    if (/(oes|ches|shes|xes)$/.test(w)) return w.slice(0, -2);
    if (/ves$/.test(w)) return w.slice(0, -3) + 'f';
    return w.endsWith('s') ? w.slice(0, -1) : w;
  }).join(' ');
}

let listPromise: Promise<string[]> | null = null;
function mealDbNames(): Promise<string[]> {
  const cached = read<{ at: number; names: string[] } | null>(LIST_KEY, null);
  if (cached && Date.now() - cached.at < 30 * 864e5) return Promise.resolve(cached.names);
  listPromise ??= fetch('https://www.themealdb.com/api/json/v1/1/list.php?i=list')
    .then((r) => r.json())
    .then((j) => {
      const names: string[] = (j.meals ?? []).map((m: { strIngredient: string }) => m.strIngredient?.trim())
        .filter((n: string) => n && n.length >= 3 && !/[,()]/.test(n));
      write(LIST_KEY, { at: Date.now(), names });
      return names;
    })
    .catch(() => { listPromise = null; return cached?.names ?? []; });
  return listPromise;
}

const reEsc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Longest TheMealDB name that appears as whole words in the line (plural allowed). */
function matchMealDb(line: string, name: string, names: string[]): string | null {
  const hay = ' ' + line.toLowerCase().replace(/\(.*?\)/g, ' ').split(/[,;]/)[0] + ' ';
  let best: string | null = null;
  for (const n of names) {
    const ln = n.toLowerCase();
    if (ln === name) return n;
    if ((!best || n.length > best.length) && new RegExp(`[^\\p{L}]${reEsc(ln)}(e?s)?[^\\p{L}]`, 'u').test(hay)) best = n;
  }
  return best;
}

async function wikipediaImage(name: string): Promise<string | null> {
  try {
    const title = encodeURIComponent(name.charAt(0).toUpperCase() + name.slice(1)).replace(/%20/g, '_');
    const r = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${title}?redirect=true`);
    if (!r.ok) return null;
    const j = await r.json();
    if (j.type === 'disambiguation') return null;
    const src: string | undefined = j.thumbnail?.source;
    // Skip diagrams, logos and chemical structures (Wikipedia serves those as rendered SVGs).
    if (!src || /\.svg\.png/i.test(src)) return null;
    return src;
  } catch { return null; }
}

const inflight = new Map<string, Promise<string | null>>();

/** Returns an image URL for an ingredient line, or null if none was found. */
export function findIngredientImage(line: string): Promise<string | null> {
  const name = ingredientName(line);
  if (!name) return Promise.resolve(null);
  const cache = read<Record<string, string>>(CACHE_KEY, {});
  if (name in cache) return Promise.resolve(cache[name] || null);
  if (!navigator.onLine) return Promise.resolve(null);
  if (inflight.has(name)) return inflight.get(name)!;
  const p = (async () => {
    const names = await mealDbNames();
    const hit = matchMealDb(line, name, names);
    const url = hit
      ? `https://www.themealdb.com/images/ingredients/${encodeURIComponent(hit)}-Small.png`
      : await wikipediaImage(name);
    const c = read<Record<string, string>>(CACHE_KEY, {});
    c[name] = url ?? '';
    write(CACHE_KEY, c);
    inflight.delete(name);
    return url;
  })();
  inflight.set(name, p);
  return p;
}

/** A bigger version of the picture for the full-screen view. */
export const largeImage = (url: string) => url.replace(/-Small\.png$/, '.png');

export function forgetImage(line: string) {
  const c = read<Record<string, string>>(CACHE_KEY, {});
  c[ingredientName(line)] = '';
  write(CACHE_KEY, c);
}

export function clearImageCache() {
  try { localStorage.removeItem(CACHE_KEY); } catch { /* ignore */ }
}

const EMOJI: [RegExp, string][] = [
  [/egg/, '🥚'], [/milk|cream|yogurt|yoghurt/, '🥛'], [/butter|ghee/, '🧈'], [/cheese|paneer/, '🧀'], [/flour|oat|wheat/, '🌾'],
  [/sugar|honey|syrup/, '🍯'], [/salt/, '🧂'], [/garlic/, '🧄'], [/onion|shallot/, '🧅'], [/potato/, '🥔'], [/carrot/, '🥕'],
  [/tomato/, '🍅'], [/chil|pepper/, '🌶️'], [/lemon|lime/, '🍋'], [/orange/, '🍊'], [/apple/, '🍎'], [/banana/, '🍌'],
  [/berr/, '🫐'], [/strawberr/, '🍓'], [/avocado/, '🥑'], [/rice/, '🍚'], [/pasta|noodle|spaghetti/, '🍝'], [/bread/, '🍞'],
  [/chicken/, '🍗'], [/beef|steak|meat|lamb|pork/, '🥩'], [/bacon/, '🥓'], [/fish|salmon|tuna/, '🐟'], [/prawn|shrimp/, '🦐'],
  [/water/, '💧'], [/oil/, '🫒'], [/chocolate|cocoa/, '🍫'], [/coffee/, '☕'], [/tea\b/, '🍵'], [/nut|almond|peanut/, '🥜'],
  [/mushroom/, '🍄'], [/corn/, '🌽'], [/broccoli/, '🥦'], [/cucumber/, '🥒'], [/lettuce|spinach|leaf|leaves|herb|basil|mint|coriander|cilantro|parsley/, '🌿'],
  [/ginger/, '🫚'], [/coconut/, '🥥'], [/wine/, '🍷'], [/ice/, '🧊'], [/rose|flower/, '🌹'], [/soap|oil|essential/, '🧴']
];

export function ingredientEmoji(line: string): string {
  const l = line.toLowerCase();
  return EMOJI.find(([re]) => re.test(l))?.[1] ?? '🥄';
}
