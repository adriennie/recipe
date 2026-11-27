// Splits pasted recipe text into a title, ingredients/materials and steps.
// It works from headings when present ("Ingredients", "Method", ...) and falls back to line shapes.

export interface ParsedRecipe { title: string; ingredients: string[]; steps: string[] }

const ING_HEAD = /^(ingredients?|materials?|supplies|you('ll)? (will )?need|what you('ll)? need|items?( needed)?|shopping list|for the [\w\s]+)\s*:?$/i;
const STEP_HEAD = /^(instructions?|method|directions?|steps?|preparation|prep|how to( make| use| do)?( it)?|procedure|process|to make)\s*:?$/i;
const IGNORE_HEAD = /^(notes?|tips?|nutrition( facts)?|serves?\b.*|servings?\b.*|yield\b.*|prep time\b.*|cook time\b.*|total time\b.*|equipment)\s*:?$/i;

const BULLET = /^\s*([-*•·▪◦‣–—]|•|\[\s?\]|☐|✓|✔)\s*/;
const NUMBERED = /^\s*(step\s*)?(\d{1,2})\s*[.):\-–]\s+|^\s*step\s*\d{1,2}\s*[:.\-–]?\s*/i;
const QTY = /^\s*(\d+([.,/]\d+)?|\d+\s+\d\/\d|[½⅓⅔¼¾⅛⅜⅝⅞]|a |an |one |two |three |four |five |half |pinch|handful|dash|few )/i;
const UNIT = /\b(cups?|tbsp|tbs|tablespoons?|tsp|teaspoons?|g|grams?|kg|ml|l|litres?|liters?|oz|ounces?|lbs?|pounds?|cloves?|pinch|dash|drops?|slices?|cans?|packets?|sticks?|bunch)\b/i;
const VERB_START = /^(add|mix|stir|heat|preheat|bake|cook|boil|simmer|whisk|pour|place|put|combine|chop|cut|slice|fry|saute|sauté|blend|serve|remove|let|leave|bring|cover|season|apply|rinse|wash|wait|spread|fold|knead|roll|transfer|turn|set|allow|top|garnish|drain|melt|beat|cream|grease|line|sprinkle|massage|shake|store|fill|repeat|then|finally|first|next|once|when|while|after|before|in a|using|take)\b/i;

const cleanLine = (l: string) => l.replace(BULLET, '').replace(NUMBERED, '').trim();

/** Splits a long paragraph into sentences so each one can be its own step. */
function sentences(p: string): string[] {
  return p.split(/(?<=[.!?])\s+(?=[A-Z0-9])/).map((s) => s.trim()).filter(Boolean);
}

function looksLikeIngredient(line: string): boolean {
  const l = cleanLine(line);
  if (!l) return false;
  if (VERB_START.test(l) && l.length > 25) return false;
  if (QTY.test(l) || UNIT.test(l.split(' ').slice(0, 3).join(' '))) return l.length < 90;
  return BULLET.test(line) && l.length < 60 && !/[.!?]$/.test(l);
}

export function parseRecipe(text: string): ParsedRecipe {
  const lines = text.replace(/\r/g, '').split('\n').map((l) => l.trim());
  let title = '';
  const ingredients: string[] = [];
  const steps: string[] = [];
  let section: 'none' | 'ing' | 'step' | 'skip' = 'none';
  const loose: string[] = []; // lines seen before any heading
  let sawHeading = false;

  for (const line of lines) {
    if (!line) continue;
    const bare = line.replace(/[#*_=]+/g, '').trim();
    if (ING_HEAD.test(bare)) { section = 'ing'; sawHeading = true; continue; }
    if (STEP_HEAD.test(bare)) { section = 'step'; sawHeading = true; continue; }
    if (IGNORE_HEAD.test(bare)) { section = 'skip'; sawHeading = true; continue; }

    if (section === 'ing') {
      // Sub-headings like "For the sauce:" stay out of the list.
      if (/:$/.test(bare) && bare.split(' ').length <= 5) continue;
      const c = cleanLine(line);
      if (c) ingredients.push(c);
    } else if (section === 'step') {
      const c = cleanLine(line);
      if (!c) continue;
      if (NUMBERED.test(line) || BULLET.test(line)) steps.push(c);
      else steps.push(...sentences(c));
    } else if (section === 'none') {
      loose.push(line);
    }
  }

  // Title: first loose line if it is short and not an ingredient or a step.
  if (loose.length && loose[0].length <= 70 && !looksLikeIngredient(loose[0]) && !NUMBERED.test(loose[0])) {
    title = cleanLine(loose.shift()!.replace(/[#*_]+/g, ''));
  }

  if (!sawHeading || (ingredients.length === 0 && steps.length === 0)) {
    // No headings: guess line by line.
    for (const line of loose) {
      const c = cleanLine(line);
      if (!c) continue;
      if (looksLikeIngredient(line) && steps.length === 0) ingredients.push(c);
      else if (NUMBERED.test(line) || BULLET.test(line)) steps.push(c);
      else steps.push(...sentences(c));
    }
  } else if (ingredients.length === 0) {
    // Headings for steps only: loose bullet lines before them are probably ingredients.
    for (const line of loose) if (looksLikeIngredient(line)) ingredients.push(cleanLine(line));
  }

  return { title, ingredients, steps };
}
