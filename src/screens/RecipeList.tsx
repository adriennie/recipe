import { useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Recipe } from '../db';
import Icon from '../components/Icon';
import { aiAvailable } from '../ai';

export default function RecipeList() {
  const recipes = useLiveQuery(() => db.recipes.orderBy('updatedAt').reverse().toArray(), []);
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<string>('All');

  const cats = useMemo(() => Array.from(new Set((recipes ?? []).map((r) => r.category))), [recipes]);
  const shown = (recipes ?? []).filter((r) => {
    if (filter === 'Favorites' && !r.favorite) return false;
    if (filter !== 'All' && filter !== 'Favorites' && r.category !== filter) return false;
    const s = q.trim().toLowerCase();
    return !s || r.title.toLowerCase().includes(s) || r.ingredients.some((i) => i.toLowerCase().includes(s));
  });

  return (
    <>
      <header className="topbar">
        <h1>Recipes</h1>
        <a className="btn primary small" href="#/new"><Icon name="plus" size={18} /> New</a>
      </header>

      {aiAvailable && (
        <a className="card ideas-banner" href="#/ideas">
          <Icon name="sparkle" size={22} />
          <span><b>What can I cook?</b><br /><span className="muted small-text">Tell me what's in your kitchen</span></span>
          <Icon name="next" size={18} />
        </a>
      )}

      {recipes && recipes.length > 0 && (
        <>
          <label className="search">
            <Icon name="search" size={18} />
            <input type="search" placeholder="Search recipes or ingredients" value={q} onChange={(e) => setQ(e.target.value)} />
          </label>
          <div className="chips" role="tablist">
            {['All', 'Favorites', ...cats].map((c) => (
              <button key={c} className={'chip' + (filter === c ? ' on' : '')} onClick={() => setFilter(c)}>
                {c === 'Favorites' ? '★ Favorites' : c}
              </button>
            ))}
          </div>
        </>
      )}

      {recipes === undefined ? null : recipes.length === 0 ? (
        <div className="empty">
          <div className="empty-art"><Icon name="book" size={40} /></div>
          <h2>No recipes yet</h2>
          <p>Paste any recipe — food, drinks, skincare, cleaning mixes — and it will be read to you one step at a time.</p>
          <a className="btn primary" href="#/new"><Icon name="plus" size={18} /> Add your first recipe</a>
        </div>
      ) : shown.length === 0 ? (
        <p className="muted center pad">No recipes match.</p>
      ) : (
        <ul className="cards">
          {shown.map((r) => <RecipeCard key={r.id} r={r} />)}
        </ul>
      )}
    </>
  );
}

function RecipeCard({ r }: { r: Recipe }) {
  return (
    <li>
      <a className="card recipe-card" href={`#/recipe/${r.id}`}>
        <div className="card-main">
          <span className="tag">{r.category}</span>
          <h3>{r.title || 'Untitled recipe'}</h3>
          <p className="muted">{r.ingredients.length} ingredients · {r.steps.length} steps</p>
        </div>
        {r.favorite && <span className="fav-mark" aria-label="Favorite"><Icon name="star" size={18} filled /></span>}
      </a>
    </li>
  );
}
