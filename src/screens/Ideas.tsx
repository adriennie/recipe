import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, addToGrocery } from '../db';
import { callAI, minutesText, type CookIdeas } from '../ai';
import { go } from '../router';
import Icon from '../components/Icon';

const KEY = 'pantry-text';
const load = () => { try { return localStorage.getItem(KEY) ?? ''; } catch { return ''; } };

/** "What can I cook?": match saved recipes to what's at home, plus one new idea. */
export default function Ideas() {
  const recipes = useLiveQuery(() => db.recipes.toArray(), []);
  const [pantry, setPantry] = useState(load);
  const [res, setRes] = useState<CookIdeas | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [added, setAdded] = useState<Set<string>>(new Set());

  const byUid = new Map((recipes ?? []).map((r) => [r.uid!, r]));

  const find = async () => {
    try { localStorage.setItem(KEY, pantry); } catch { /* ignore */ }
    setBusy(true); setErr(''); setRes(null);
    try {
      const r = await callAI<CookIdeas>('cook', {
        pantry,
        recipes: (recipes ?? []).filter((x) => x.uid).map((x) => ({ id: x.uid, title: x.title, ingredients: x.ingredients }))
      });
      r.matches = r.matches.filter((m) => byUid.has(m.id));
      setRes(r);
    } catch (e) { setErr((e as Error).message); }
    setBusy(false);
  };

  const saveIdea = async () => {
    if (!res) return;
    const now = Date.now();
    const id = await db.recipes.add({
      title: res.idea.title, category: 'Food', ingredients: res.idea.ingredients, steps: res.idea.steps,
      rawText: '', favorite: false, createdAt: now, updatedAt: now
    });
    go(`/recipe/${id}`);
  };

  return (
    <>
      <header className="topbar">
        <a className="icon-btn" href="#/" aria-label="Back"><Icon name="back" /></a>
        <h1 className="h-sm ai-title"><Icon name="sparkle" size={20} /> What can I cook?</h1>
        <span className="icon-btn" />
      </header>

      <div className="field">
        <label htmlFor="pantry">What do you have at home?</label>
        <textarea id="pantry" rows={4} value={pantry} onChange={(e) => setPantry(e.target.value)}
          placeholder="e.g. eggs, half an onion, rice, spinach, yogurt, chilli powder" />
        <p className="hint">Tip: tap 🎤 on your keyboard and just say it.</p>
      </div>
      <button className="btn primary block" disabled={busy || !pantry.trim()} onClick={find}>
        {busy ? 'Looking…' : 'Find recipes'}
      </button>
      {err && <p className="error">{err}</p>}

      {res && (
        <>
          <section className="section">
            <h2>From your recipes</h2>
            {res.matches.length === 0 ? <p className="muted">None of your saved recipes fit — try the idea below.</p> : (
              <ul className="cards">
                {res.matches.map((m) => {
                  const r = byUid.get(m.id)!;
                  return (
                    <li key={m.id} className="card pad-card">
                      <a href={`#/recipe/${r.id}`}><h3>{r.title}</h3></a>
                      <p className="small-text">{m.note}</p>
                      {m.missing.length === 0 ? <p className="good small-text">✓ You have everything</p> : (
                        <>
                          <p className="small-text muted">Missing: {m.missing.join(', ')}</p>
                          <button className="link" disabled={added.has(m.id)} onClick={async () => {
                            await addToGrocery(m.missing, r.title);
                            setAdded((s) => new Set(s).add(m.id));
                          }}><Icon name="cart" size={16} /> {added.has(m.id) ? 'Added to grocery list' : 'Add missing to grocery list'}</button>
                        </>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <section className="section card pad-card idea">
            <span className="tag">New idea · {minutesText(res.idea.minutes)}</span>
            <h3>{res.idea.title}</h3>
            <p className="small-text muted">{res.idea.why}</p>
            <h4 className="sub">Ingredients</h4>
            <ul className="plain-list small">{res.idea.ingredients.map((x, i) => <li key={i}>{x}</li>)}</ul>
            <h4 className="sub">Steps</h4>
            <ol className="plain-list small">{res.idea.steps.map((x, i) => <li key={i}>{x}</li>)}</ol>
            <button className="btn primary" onClick={saveIdea}>Save this recipe</button>
          </section>
        </>
      )}
    </>
  );
}
