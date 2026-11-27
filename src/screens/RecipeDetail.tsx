import { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, addToGrocery } from '../db';
import { go } from '../router';
import Icon from '../components/Icon';
import IngredientImage from '../components/IngredientImage';
import ImageSheet from '../components/ImageSheet';
import TermText from '../components/TermText';
import TermSheet from '../components/TermSheet';
import type { Term } from '../glossary';
import RecipeAI from '../components/RecipeAI';
import { aiAvailable } from '../ai';

export default function RecipeDetail({ id }: { id: number }) {
  const r = useLiveQuery(() => db.recipes.get(id), [id], null);
  const [picked, setPicked] = useState<Set<number>>(new Set());
  const [toast, setToast] = useState('');
  const [term, setTerm] = useState<Term | null>(null);
  const [image, setImage] = useState<{ text: string; url: string | null } | null>(null);

  useEffect(() => { if (r === undefined) go('/'); }, [r]);
  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(''), 2500); return () => clearTimeout(t); }, [toast]);
  if (!r) return null;

  const toggle = (i: number) => setPicked((p) => { const n = new Set(p); n.has(i) ? n.delete(i) : n.add(i); return n; });
  const allOn = picked.size === r.ingredients.length && r.ingredients.length > 0;

  const addPicked = async () => {
    const items = r.ingredients.filter((_, i) => picked.has(i));
    await addToGrocery(items, r.title);
    setToast(`Added ${items.length} item${items.length === 1 ? '' : 's'} to your grocery list`);
    setPicked(new Set());
  };

  const remove = async () => {
    if (!confirm(`Delete "${r.title}"? This can't be undone.`)) return;
    await db.recipes.delete(id);
    go('/');
  };

  return (
    <>
      <header className="topbar">
        <a className="icon-btn" href="#/" aria-label="Back"><Icon name="back" /></a>
        <div className="topbar-actions">
          <button className={'icon-btn' + (r.favorite ? ' fav' : '')} aria-label={r.favorite ? 'Remove from favorites' : 'Add to favorites'}
            onClick={() => db.recipes.update(id, { favorite: !r.favorite })}>
            <Icon name="star" filled={r.favorite} />
          </button>
          <a className="icon-btn" href={`#/edit/${id}`} aria-label="Edit"><Icon name="edit" /></a>
          <button className="icon-btn danger" aria-label="Delete" onClick={remove}><Icon name="trash" /></button>
        </div>
      </header>

      <span className="tag">{r.category}</span>
      <h1 className="title">{r.title}</h1>

      <a className="btn primary block big" href={`#/cook/${id}`}><Icon name="play" size={20} filled /> Start cooking</a>

      <section className="section">
        <div className="section-head">
          <h2>Ingredients <span className="count">{r.ingredients.length}</span></h2>
          {r.ingredients.length > 0 && (
            <button className="link" onClick={() => setPicked(allOn ? new Set() : new Set(r.ingredients.map((_, i) => i)))}>
              {allOn ? 'Select none' : 'Select all'}
            </button>
          )}
        </div>
        {r.ingredients.length === 0 ? <p className="muted">No ingredients listed.</p> : (
          <>
            <p className="muted small-text">Tick what you need to buy, then add just those to your grocery list.</p>
            <ul className="checklist">
              {r.ingredients.map((ing, i) => (
                <li key={i}>
                  <label className={picked.has(i) ? 'on' : ''}>
                    <input type="checkbox" checked={picked.has(i)} onChange={() => toggle(i)} />
                    <IngredientImage text={ing} onOpen={(url) => setImage({ text: ing, url })} />
                    <span><TermText text={ing} mode="ingredient" onTerm={setTerm} /></span>
                  </label>
                </li>
              ))}
            </ul>
            <button className="btn secondary block" disabled={picked.size === 0} onClick={addPicked}>
              <Icon name="cart" size={18} /> Add {picked.size || ''} to grocery list
            </button>
          </>
        )}
      </section>

      {aiAvailable && <RecipeAI recipe={r} />}

      <section className="section">
        <h2>Steps <span className="count">{r.steps.length}</span></h2>
        <p className="muted small-text">Tap an <span className="term-sample">underlined word</span> to see what it means.</p>
        <ol className="steps">
          {r.steps.map((s, i) => <li key={i}><span><TermText text={s} onTerm={setTerm} /></span></li>)}
        </ol>
      </section>

      {term && <TermSheet term={term} onClose={() => setTerm(null)} />}
      {image && <ImageSheet text={image.text} url={image.url} onClose={() => setImage(null)} />}
      {toast && <div className="toast" role="status">{toast} · <a href="#/grocery">View</a></div>}
    </>
  );
}
