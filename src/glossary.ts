// Plain-language meanings for cooking and recipe words, built in so they work offline.
// `forms` are the other spellings/tenses that should link to the same entry.

export interface Term { term: string; forms?: string[]; meaning: string; tip?: string }

export const TERMS: Term[] = [
  // ── Techniques ─────────────────────────────────────────────
  { term: 'al dente', meaning: 'Cooked until just soft but still a little firm when you bite it. Used for pasta.', tip: 'Taste a piece a minute or two before the packet time.' },
  { term: 'bake', forms: ['baked', 'baking', 'bakes'], meaning: 'Cook in the oven with dry heat.' },
  { term: 'baste', forms: ['basted', 'basting'], meaning: 'Spoon melted fat, juices or sauce over food while it cooks so it stays moist and tasty.' },
  { term: 'batter', meaning: 'A runny mixture of flour, liquid and usually eggs, used for cakes, pancakes or coating food before frying.' },
  { term: 'beat', forms: ['beaten', 'beating'], meaning: 'Stir very fast with a spoon, whisk or mixer to make something smooth and add air.' },
  { term: 'blanch', forms: ['blanched', 'blanching'], meaning: 'Put food in boiling water for a short time, then straight into cold water to stop the cooking.', tip: 'Keeps vegetables bright green and makes tomato skins easy to peel.' },
  { term: 'blend', forms: ['blended', 'blending'], meaning: 'Mix ingredients together until they become one smooth mixture, by hand or in a blender.' },
  { term: 'bloom', forms: ['bloomed', 'blooming'], meaning: 'Let gelatin soak in cold water to soften, or briefly fry spices in oil to wake up their flavour.' },
  { term: 'boil', forms: ['boiled', 'boiling'], meaning: 'Heat liquid until big bubbles rise and break on the surface all the time.' },
  { term: 'braise', forms: ['braised', 'braising'], meaning: 'Brown food first, then cook it slowly in a covered pot with a little liquid until very tender.' },
  { term: 'bread', forms: ['breaded', 'breading'], meaning: 'Coat food in breadcrumbs (usually after dipping it in flour and egg) before cooking.' },
  { term: 'brine', forms: ['brined', 'brining'], meaning: 'Soak food in salty water before cooking so it stays juicy and seasoned.' },
  { term: 'broil', forms: ['broiled', 'broiling'], meaning: 'Cook under very strong heat from above (the oven grill).', tip: 'Watch closely — food can burn in seconds.' },
  { term: 'brown', forms: ['browned', 'browning'], meaning: 'Cook the outside of food in a hot pan until it turns golden brown, for flavour and colour.' },
  { term: 'brush', forms: ['brushed', 'brushing'], meaning: 'Spread a thin layer of liquid (oil, egg, butter) over food using a pastry brush.' },
  { term: 'butterfly', forms: ['butterflied'], meaning: 'Cut meat or prawns almost in half and open them flat like a book, so they cook faster and evenly.' },
  { term: 'caramelize', forms: ['caramelise', 'caramelized', 'caramelised', 'caramelizing', 'caramelising'], meaning: 'Cook slowly until the natural sugars turn golden brown and sweet, like with onions or sugar.' },
  { term: 'chiffonade', meaning: 'Stack leaves (like basil or spinach), roll them up tightly, and slice across into thin ribbons.' },
  { term: 'chill', forms: ['chilled', 'chilling'], meaning: 'Put in the fridge until cold.' },
  { term: 'chop', forms: ['chopped', 'chopping'], meaning: 'Cut into small pieces. They do not need to be perfectly even.' },
  { term: 'coat', forms: ['coated', 'coating'], meaning: 'Cover food all over with a layer of something, like flour, sauce or breadcrumbs.' },
  { term: 'combine', forms: ['combined'], meaning: 'Put ingredients together and mix them.' },
  { term: 'core', forms: ['cored'], meaning: 'Remove the hard middle part with seeds from fruit like apples or pears.' },
  { term: 'cream', forms: ['creamed', 'creaming'], meaning: 'Beat butter and sugar together until pale, fluffy and lighter in colour.', tip: 'Use soft (room temperature) butter. Takes about 3–5 minutes with a mixer.' },
  { term: 'crimp', forms: ['crimped'], meaning: 'Press the edges of pastry or dough together with your fingers or a fork to seal them.' },
  { term: 'crush', forms: ['crushed'], meaning: 'Press or pound into small bits, e.g. garlic with the flat side of a knife or biscuits in a bag.' },
  { term: 'cube', forms: ['cubed'], meaning: 'Cut into small even blocks, roughly the size of dice.' },
  { term: 'cure', forms: ['cured', 'curing'], meaning: 'Preserve food with salt (and sometimes sugar or smoke), like bacon or salmon.' },
  { term: 'cut in', meaning: 'Rub cold butter into flour with your fingertips or a fork until it looks like breadcrumbs.' },
  { term: 'dash', meaning: 'A very small amount — a quick shake or splash, less than 1/8 teaspoon.' },
  { term: 'deglaze', forms: ['deglazed', 'deglazing'], meaning: 'Pour liquid (stock, wine, water) into a hot pan and scrape up the browned bits stuck to the bottom. Those bits add lots of flavour.' },
  { term: 'devein', forms: ['deveined'], meaning: 'Remove the dark vein (gut) running along the back of a prawn or shrimp.' },
  { term: 'dice', forms: ['diced', 'dicing'], meaning: 'Cut into small even cubes, smaller than chopped.' },
  { term: 'dissolve', forms: ['dissolved', 'dissolves'], meaning: 'Stir something (like sugar or salt) into liquid until you can no longer see it.' },
  { term: 'dollop', meaning: 'A spoonful dropped on top, like cream on a dessert.' },
  { term: 'dot', forms: ['dotted'], meaning: 'Put small pieces (usually of butter) here and there over the top of food.' },
  { term: 'drain', forms: ['drained', 'draining'], meaning: 'Pour off the liquid, often through a colander or sieve.' },
  { term: 'dredge', forms: ['dredged', 'dredging'], meaning: 'Coat food lightly in flour or crumbs, shaking off the extra.' },
  { term: 'drizzle', forms: ['drizzled'], meaning: 'Pour a thin stream of liquid (like oil or honey) lightly over the top.' },
  { term: 'dust', forms: ['dusted', 'dusting'], meaning: 'Sprinkle a light layer of powder, like flour, cocoa or icing sugar.' },
  { term: 'emulsify', forms: ['emulsified', 'emulsion'], meaning: 'Whisk oil and a watery liquid together so they become one smooth, creamy mixture instead of separating (like mayonnaise).' },
  { term: 'fillet', forms: ['filleted', 'filet'], meaning: 'A boneless piece of meat or fish — or to cut the bones out to make one.' },
  { term: 'flambé', forms: ['flambe', 'flambéed'], meaning: 'Pour alcohol over food and light it so it burns off quickly.', tip: 'Turn off the fan, keep your face back and have a lid nearby.' },
  { term: 'flake', forms: ['flaked'], meaning: 'Break cooked food (often fish) into small pieces with a fork.' },
  { term: 'fold', forms: ['folded', 'folding', 'fold in'], meaning: 'Gently mix a light, airy ingredient into a heavier one with a spatula, cutting down through the middle and turning over, so you don\'t knock the air out.', tip: 'Don\'t stir or beat — slow, gentle scoops.' },
  { term: 'fry', forms: ['fried', 'frying', 'pan-fry', 'pan-fried', 'deep-fry', 'deep-fried', 'shallow-fry'], meaning: 'Cook in hot oil or fat. Deep-frying means the food is fully covered in oil.' },
  { term: 'garnish', forms: ['garnished'], meaning: 'Add a small finishing touch on top to make food look nice, like herbs or lemon.' },
  { term: 'glaze', forms: ['glazed', 'glazing'], meaning: 'A shiny coating brushed or poured over food, like egg wash on bread or icing on cake.' },
  { term: 'grate', forms: ['grated', 'grating'], meaning: 'Rub food against a grater to make thin shreds, like cheese or carrot.' },
  { term: 'grease', forms: ['greased'], meaning: 'Rub a thin layer of butter or oil inside a tin or dish so food doesn\'t stick.' },
  { term: 'grill', forms: ['grilled', 'grilling'], meaning: 'Cook over direct high heat on a grill or griddle pan, giving lines and a smoky taste.' },
  { term: 'grind', forms: ['ground', 'grinding'], meaning: 'Crush into a fine powder or tiny bits, like pepper, coffee or meat.' },
  { term: 'hull', forms: ['hulled'], meaning: 'Remove the green leafy top from strawberries.' },
  { term: 'infuse', forms: ['infused', 'infusing', 'infusion'], meaning: 'Soak herbs, spices or tea in a hot liquid so their flavour goes into it.' },
  { term: 'julienne', forms: ['julienned'], meaning: 'Cut into long, thin matchstick strips.' },
  { term: 'knead', forms: ['kneaded', 'kneading'], meaning: 'Push, fold and press dough with the heel of your hand over and over until it becomes smooth and stretchy.', tip: 'Usually 8–10 minutes by hand for bread.' },
  { term: 'line', forms: ['lined'], meaning: 'Cover the inside of a tin or tray with baking paper or foil.' },
  { term: 'macerate', forms: ['macerated'], meaning: 'Soak fruit in sugar, juice or alcohol so it softens and releases its juice.' },
  { term: 'marinate', forms: ['marinated', 'marinating', 'marinade', 'marinades'], meaning: 'Leave food (usually meat, fish, tofu or vegetables) soaking in a flavoured liquid or paste — the marinade — for a while before cooking, so it absorbs flavour and gets more tender.', tip: 'Cover and keep it in the fridge. Fish: 15–30 minutes. Chicken: 1–12 hours. Beef: up to 24 hours.' },
  { term: 'mash', forms: ['mashed', 'mashing'], meaning: 'Crush soft food into a smooth or lumpy paste with a fork or masher.' },
  { term: 'mince', forms: ['minced', 'mincing'], meaning: 'Chop into very, very tiny pieces (smaller than dice). Minced meat means ground meat.' },
  { term: 'parboil', forms: ['parboiled'], meaning: 'Boil food until partly cooked; it is finished later another way, like roasting.' },
  { term: 'pinch', meaning: 'The tiny amount you can hold between your thumb and finger — about 1/16 teaspoon.' },
  { term: 'pipe', forms: ['piped', 'piping'], meaning: 'Squeeze a soft mixture (icing, cream, dough) through a bag with a nozzle to make shapes.' },
  { term: 'pit', forms: ['pitted'], meaning: 'Remove the stone or seed from fruit like cherries, olives or dates.' },
  { term: 'poach', forms: ['poached', 'poaching'], meaning: 'Cook gently in liquid that is hot but only barely bubbling.' },
  { term: 'preheat', forms: ['preheated', 'pre-heat'], meaning: 'Turn the oven (or pan) on early so it reaches the right temperature before you put the food in.', tip: 'Most ovens take 10–15 minutes.' },
  { term: 'proof', forms: ['proofed', 'proofing', 'prove', 'proved', 'proving'], meaning: 'Leave yeast dough somewhere warm to rise and get bigger before baking.' },
  { term: 'purée', forms: ['puree', 'pureed', 'puréed'], meaning: 'Blend or mash food until completely smooth, like baby food.' },
  { term: 'reduce', forms: ['reduced', 'reducing', 'reduction'], meaning: 'Boil or simmer a liquid without a lid so some water evaporates, making it thicker and stronger in flavour.' },
  { term: 'render', forms: ['rendered', 'rendering'], meaning: 'Cook fatty meat (like bacon) slowly so the fat melts out.' },
  { term: 'rest', forms: ['rested', 'resting'], meaning: 'Leave cooked meat (or dough) alone for a few minutes before cutting, so juices settle and it stays moist.' },
  { term: 'roast', forms: ['roasted', 'roasting'], meaning: 'Cook in a hot oven, uncovered, until browned on the outside.' },
  { term: 'roux', meaning: 'Butter and flour cooked together, used to thicken sauces and soups.' },
  { term: 'rub in', meaning: 'Rub butter into flour with your fingertips until it looks like breadcrumbs.' },
  { term: 'sauté', forms: ['saute', 'sautéed', 'sauteed', 'sautéing', 'sauteing'], meaning: 'Cook quickly in a little oil or butter in a hot pan, stirring or tossing often.' },
  { term: 'scald', forms: ['scalded'], meaning: 'Heat milk until it is just about to boil (small bubbles at the edges), then take it off the heat.' },
  { term: 'score', forms: ['scored', 'scoring'], meaning: 'Make shallow cuts across the surface of food, like meat fat or bread dough.' },
  { term: 'sear', forms: ['seared', 'searing'], meaning: 'Brown the outside of food very quickly in a very hot pan to make a tasty crust.' },
  { term: 'season', forms: ['seasoned', 'seasoning', 'season to taste'], meaning: 'Add salt, pepper or spices to give flavour. "To taste" means add a little, taste, and add more if needed.' },
  { term: 'separate', forms: ['separated'], meaning: 'For eggs: split the yolk (yellow) from the white.' },
  { term: 'shred', forms: ['shredded', 'shredding'], meaning: 'Tear or cut into thin strips, like cooked chicken pulled apart with two forks, or grated cabbage.' },
  { term: 'sift', forms: ['sifted', 'sifting'], meaning: 'Shake dry ingredients like flour through a fine sieve to remove lumps and add air.' },
  { term: 'simmer', forms: ['simmered', 'simmering'], meaning: 'Cook liquid on low heat so it bubbles gently — small, lazy bubbles, not a rolling boil.' },
  { term: 'skim', forms: ['skimmed', 'skimming'], meaning: 'Spoon off the foam or fat floating on top of a liquid.' },
  { term: 'slice', forms: ['sliced', 'slicing'], meaning: 'Cut into thin flat pieces.' },
  { term: 'soft peaks', meaning: 'Whipped cream or egg whites that hold a shape, but the tip flops over when you lift the whisk.' },
  { term: 'stiff peaks', meaning: 'Whipped cream or egg whites so firm that the tip stands straight up when you lift the whisk.' },
  { term: 'steam', forms: ['steamed', 'steaming'], meaning: 'Cook food above boiling water (not in it), using the hot steam.' },
  { term: 'steep', forms: ['steeped', 'steeping'], meaning: 'Soak something in hot liquid to pull out its flavour, like a tea bag.' },
  { term: 'stew', forms: ['stewed', 'stewing'], meaning: 'Cook pieces of food slowly in liquid in a covered pot.' },
  { term: 'stir-fry', forms: ['stir fry', 'stir-fried', 'stir-frying'], meaning: 'Cook small pieces quickly in a very hot pan or wok, stirring all the time.' },
  { term: 'strain', forms: ['strained', 'straining'], meaning: 'Pour through a sieve to separate the liquid from the solid bits.' },
  { term: 'sweat', forms: ['sweated', 'sweating'], meaning: 'Cook vegetables (often onions) gently in a little fat until soft but not browned.' },
  { term: 'temper', forms: ['tempered', 'tempering'], meaning: 'Slowly add a little hot liquid to eggs while whisking so they warm up without scrambling. In Indian cooking (tadka), it means frying spices in hot oil and pouring them over a dish.' },
  { term: 'toast', forms: ['toasted', 'toasting'], meaning: 'Heat in a dry pan or oven until golden and fragrant, like nuts, seeds or bread.' },
  { term: 'toss', forms: ['tossed', 'tossing'], meaning: 'Mix gently by lifting and turning, like a salad with dressing.' },
  { term: 'truss', forms: ['trussed'], meaning: 'Tie meat or poultry with string so it keeps its shape while cooking.' },
  { term: 'whip', forms: ['whipped', 'whipping'], meaning: 'Beat fast to add lots of air so it becomes light and fluffy, like cream.' },
  { term: 'whisk', forms: ['whisked', 'whisking'], meaning: 'Beat or mix quickly with a whisk (a wire tool) to make smooth or add air.' },
  { term: 'zest', forms: ['zested', 'zesting'], meaning: 'The thin, coloured outer skin of citrus fruit (lemon, orange, lime), grated finely. Avoid the white part under it — it is bitter.' },

  // ── Ingredients people often wonder about ─────────────────
  { term: 'baking powder', meaning: 'A raising powder that makes cakes rise. It already contains an acid, so it works on its own.' },
  { term: 'baking soda', forms: ['bicarbonate of soda', 'bicarb', 'bicarb soda'], meaning: 'A raising powder that needs something acidic (yogurt, buttermilk, lemon) to work. About 3–4 times stronger than baking powder.' },
  { term: 'buttermilk', meaning: 'A tangy, slightly thick milk. Swap: 1 cup milk + 1 tbsp lemon juice or vinegar, left 5 minutes.' },
  { term: 'caster sugar', forms: ['superfine sugar'], meaning: 'Very fine white sugar that dissolves quickly. You can blitz normal sugar in a blender.' },
  { term: 'cornstarch', forms: ['cornflour', 'corn starch'], meaning: 'A fine white powder used to thicken sauces. Mix with cold water first to avoid lumps.' },
  { term: 'whipped cream', meaning: 'Cream beaten until thick and fluffy. Use heavy (double) cream — it won\'t whip if the fat is too low.' },
  { term: 'sour cream', meaning: 'Thick, tangy cream. Plain thick yogurt is a good swap.' },
  { term: 'cream cheese', meaning: 'A soft, smooth, mild cheese used in cheesecake and frosting.' },
  { term: 'ice cream', meaning: 'Frozen sweet cream dessert.' },
  { term: 'egg wash', meaning: 'A beaten egg (sometimes with a splash of milk) brushed on pastry or bread to make it shiny and golden.' },
  { term: 'ghee', meaning: 'Clarified butter — butter heated until the milk solids are removed. It can be heated hotter without burning.' },
  { term: 'heavy cream', forms: ['double cream', 'whipping cream', 'heavy whipping cream'], meaning: 'Thick cream with lots of fat that can be whipped.' },
  { term: 'icing sugar', forms: ['powdered sugar', "confectioners' sugar", 'confectioners sugar'], meaning: 'Sugar ground into a very fine powder, used for icing and dusting.' },
  { term: 'room temperature', meaning: 'Not cold from the fridge — left out until it feels neither cold nor warm (about 20°C / 68°F). Usually 30–60 minutes for butter and eggs.' },
  { term: 'stock', forms: ['broth', 'stock cube', 'bouillon'], meaning: 'A flavoured liquid made by simmering bones, meat or vegetables in water. Cubes or powder mixed with hot water work too.' },
  { term: 'tahini', meaning: 'A paste made from ground sesame seeds.' },
  { term: 'yeast', forms: ['instant yeast', 'active dry yeast', 'dry yeast'], meaning: 'A tiny living organism that makes bread dough rise by producing gas. Too-hot water kills it — use lukewarm.' },

  // ── Kitchen kit & amounts ─────────────────────────────────
  { term: 'colander', meaning: 'A bowl with holes for draining pasta, rice or washed vegetables.' },
  { term: 'dutch oven', meaning: 'A heavy pot with a tight lid that can go on the hob and in the oven.' },
  { term: 'ramekin', forms: ['ramekins'], meaning: 'A small round oven-safe dish for single portions.' },
  { term: 'saucepan', meaning: 'A deep round pan with one long handle, for boiling and sauces.' },
  { term: 'skillet', forms: ['frying pan'], meaning: 'A flat, shallow pan with sloped sides for frying.' },
  { term: 'spatula', meaning: 'A flat tool for flipping or scraping, or a rubber one for folding and scraping bowls.' },
  { term: 'springform', forms: ['springform pan', 'springform tin'], meaning: 'A cake tin whose side unclips, so you can lift out delicate cakes like cheesecake.' },
  { term: 'tbsp', forms: ['tablespoon', 'tablespoons', 'tbs'], meaning: 'Tablespoon — 15 ml, the size of a large serving spoon. Equals 3 teaspoons.' },
  { term: 'tsp', forms: ['teaspoon', 'teaspoons'], meaning: 'Teaspoon — 5 ml, the small spoon used for stirring tea.' },
  { term: 'bain-marie', forms: ['water bath', 'double boiler'], meaning: 'A bowl set over (or a dish set in) gently simmering water, for melting chocolate or cooking delicate things gently.' },
  { term: 'double boiler', meaning: 'A bowl set over a pan of gently simmering water, for melting chocolate or cooking gently.' }
];

const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[-\s]+/g, ' ').trim();

const index = new Map<string, Term>();
for (const t of TERMS) for (const f of [t.term, ...(t.forms ?? [])]) if (!index.has(norm(f))) index.set(norm(f), t);

/** Finds a built-in term by its word or one of its forms. */
export function lookupTerm(word: string): Term | undefined {
  const n = norm(word);
  return index.get(n) ?? index.get(n.replace(/(es|s|ed|ing)$/, '')) ?? index.get(n.replace(/(d|s)$/, ''));
}

// Words that are too basic or have everyday meanings ("the rest of", "brown sugar", "a loaf of bread")
// stay searchable on the Terms page but are not underlined inside recipes.
const NO_LINK = new Set(['bake', 'boil', 'chop', 'slice', 'combine', 'chill', 'drain', 'toss', 'coat', 'crush', 'brush',
  'fry', 'grill', 'roast', 'steam', 'toast', 'mash', 'rest', 'dot', 'line', 'core', 'pit', 'score', 'brown', 'bread',
  'separate', 'cure', 'cube', 'pipe', 'stew', 'glaze', 'tsp', 'tbsp', 'pinch', 'dash', 'stock', 'batter', 'grind',
  'dissolve', 'beat', 'blend', 'mince', 'spatula', 'saucepan', 'ice cream']);

// One regex over every linkable form, longest first so "stir-fry" wins over "fry" and "fold in" over "fold".
const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/[-\s]+/g, '[-\\s]+');
const allForms = Array.from(index.entries())
  .filter(([, t]) => !NO_LINK.has(t.term))
  .map(([k]) => k)
  .sort((a, b) => b.length - a.length);
const TERM_RE = new RegExp(`(?<![\\p{L}])(${allForms.map(escape).join('|')})(?![\\p{L}])`, 'giu');

export type Piece = string | { text: string; term: Term };

// In ingredient lines only ingredient words are linked, so "1 cup cream" doesn't point at "to cream butter".
const INGREDIENT_TERMS = new Set(['baking powder', 'baking soda', 'buttermilk', 'caster sugar', 'cornstarch', 'egg wash', 'ghee',
  'heavy cream', 'whipped cream', 'sour cream', 'cream cheese', 'icing sugar', 'room temperature', 'tahini', 'yeast', 'zest', 'al dente', 'purée']);

/** Splits text into plain strings and recognised terms (each term linked once per text). */
export function splitTerms(text: string, mode: 'step' | 'ingredient' = 'step'): Piece[] {
  const out: Piece[] = [];
  const seen = new Set<Term>();
  let last = 0;
  const plain = text.normalize('NFD').replace(/[\u0300-\u036f]/g, ''); // same length index as text for most Latin text
  const src = plain.length === text.length ? plain : text;
  for (const m of src.matchAll(TERM_RE)) {
    const term = lookupTerm(m[0]);
    if (!term || seen.has(term) || (mode === 'ingredient' && !INGREDIENT_TERMS.has(term.term))) continue;
    seen.add(term);
    if (m.index! > last) out.push(text.slice(last, m.index));
    out.push({ text: text.slice(m.index!, m.index! + m[0].length), term });
    last = m.index! + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

export function termsIn(text: string, mode: 'step' | 'ingredient' = 'step'): Term[] {
  return splitTerms(text, mode).filter((p): p is { text: string; term: Term } => typeof p !== 'string').map((p) => p.term);
}

export interface OnlineDefinition { word: string; meaning: string; source: string }

/** Looks a word up online (Free Dictionary API) when it isn't in the built-in list. */
export async function lookupOnline(word: string): Promise<OnlineDefinition | null> {
  const w = word.trim().toLowerCase();
  if (!w) return null;
  try {
    const r = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(w)}`);
    if (!r.ok) return null;
    const j = await r.json();
    const meanings: { partOfSpeech: string; definitions: { definition: string }[] }[] =
      (j as { meanings?: [] }[]).flatMap((e) => e.meanings ?? []);
    // Prefer verbs (recipe words are usually actions) and skip circular ones like "To prepare a chiffonade."
    const all = [...meanings.filter((m) => m.partOfSpeech === 'verb'), ...meanings.filter((m) => m.partOfSpeech !== 'verb')]
      .flatMap((m) => m.definitions.map((d) => d.definition));
    const stem = w.slice(0, Math.max(4, w.length - 3));
    const def = all.find((d) => !d.toLowerCase().includes(stem)) ?? all[0];
    return def ? { word: j[0].word ?? w, meaning: def, source: 'Free Dictionary' } : null;
  } catch {
    return null;
  }
}
