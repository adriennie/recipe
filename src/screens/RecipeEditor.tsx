import { useEffect, useState } from 'react';
import { db, CATEGORIES, type Category } from '../db';
import { parseRecipe } from '../parser';
import { go } from '../router';
import Icon from '../components/Icon';

const toLines = (s: string) => s.split('\n').map((l) => l.trim()).filter(Boolean);

export default function RecipeEditor({ id }: { id?: number }) {
  const [raw, setRaw] = useState('');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<Category>('Food');
  const [ingredients, setIngredients] = useState('');
  const [steps, setSteps] = useState('');
  const [favorite, setFavorite] = useState(false);
  const [split, setSplit] = useState(!!id);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    db.recipes.get(id).then((r) => {
      if (!r) return go('/');
      setRaw(r.rawText); setTitle(r.title); setCategory(r.category);
      setIngredients(r.ingredients.join('\n')); setSteps(r.steps.join('\n')); setFavorite(r.favorite);
    });
  }, [id]);

  const runSplit = (text = raw) => {
    const p = parseRecipe(text);
    if (p.title && !title) setTitle(p.title);
    setIngredients(p.ingredients.join('\n'));
    setSteps(p.steps.join('\n'));
    setSplit(true);
    setError('');
  };

  const save = async () => {
    const st = toLines(steps);
    if (!title.trim()) return setError('Give your recipe a name.');
    if (st.length === 0) return setError('Add at least one step.');
    const now = Date.now();
    const data = { title: title.trim(), category, ingredients: toLines(ingredients), steps: st, rawText: raw, favorite, updatedAt: now };
    if (id) { await db.recipes.update(id, data); go(`/recipe/${id}`); }
    else { const newId = await db.recipes.add({ ...data, createdAt: now }); go(`/recipe/${newId}`); }
  };

  return (
    <>
      <header className="topbar">
        <a className="icon-btn" href={id ? `#/recipe/${id}` : '#/'} aria-label="Cancel"><Icon name="back" /></a>
        <h1 className="h-sm">{id ? 'Edit recipe' : 'New recipe'}</h1>
        <span className="icon-btn" />
      </header>

      {!id && (
        <section className="field">
          <label htmlFor="raw">Paste your recipe</label>
          <textarea id="raw" rows={split ? 4 : 10} value={raw}
            placeholder={'Chocolate Mug Cake\n\nIngredients\n- 4 tbsp flour\n- 2 tbsp cocoa\n\nMethod\n1. Mix everything in a mug.\n2. Microwave for 90 seconds.'}
            onChange={(e) => setRaw(e.target.value)}
            onPaste={(e) => { const t = e.clipboardData.getData('text'); if (t && !raw.trim()) setTimeout(() => runSplit(t), 0); }} />
          <button className="btn secondary" disabled={!raw.trim()} onClick={() => runSplit()}>
            {split ? 'Split again' : 'Split into ingredients & steps'}
          </button>
        </section>
      )}

      {(split || id) && (
        <>
          <section className="field">
            <label htmlFor="title">Name</label>
            <input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Banana bread" />
          </section>
          <section className="field">
            <label htmlFor="cat">Type</label>
            <select id="cat" value={category} onChange={(e) => setCategory(e.target.value as Category)}>
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </section>
          <section className="field">
            <label htmlFor="ing">Ingredients / materials <span className="hint">one per line</span></label>
            <textarea id="ing" rows={Math.max(4, toLines(ingredients).length + 1)} value={ingredients} onChange={(e) => setIngredients(e.target.value)} />
          </section>
          <section className="field">
            <label htmlFor="steps">Steps <span className="hint">one per line — each line is read aloud on its own</span></label>
            <textarea id="steps" rows={Math.max(5, toLines(steps).length + 2)} value={steps} onChange={(e) => setSteps(e.target.value)} />
          </section>
          {error && <p className="error" role="alert">{error}</p>}
          <div className="actions">
            <button className="btn primary block" onClick={save}>Save recipe</button>
          </div>
        </>
      )}
    </>
  );
}
