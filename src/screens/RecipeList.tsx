import { useMemo, useRef, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, CATEGORIES, type Recipe } from '../db';
import Icon from '../components/Icon';
import { aiAvailable } from '../ai';
import { difficulty, recipeMinutes, shortTime, useRecipeImage } from '../recipeMeta';
import Art, { CATEGORY_ART } from '../components/Art';

/** Home: greeting, search, featured carousel, categories and the recipe list. */
export default function RecipeList() {
  const recipes = useLiveQuery(() => db.recipes.orderBy('updatedAt').reverse().toArray(), []);
  const [q, setQ] = useState('');
  const [cat, setCat] = useState<string>('All');
  const [favOnly, setFavOnly] = useState(false);

  const cats = useMemo(() => ['All', ...CATEGORIES.filter((c) => (recipes ?? []).some((r) => r.category === c))], [recipes]);
  const shown = (recipes ?? []).filter((r) => {
    if (favOnly && !r.favorite) return false;
    if (cat !== 'All' && r.category !== cat) return false;
    const s = q.trim().toLowerCase();
    return !s || r.title.toLowerCase().includes(s) || r.ingredients.some((i) => i.toLowerCase().includes(s));
  });
  // Featured: favourites first, then the most recent — up to 4.
  const featured = useMemo(() => {
    const all = recipes ?? [];
    return [...all.filter((r) => r.favorite), ...all.filter((r) => !r.favorite)].slice(0, 4);
  }, [recipes]);

  return (
    <div className="home">
      <header className="home-head">
        <div>
          <h1 className="hello">Let’s Cook<br />Something <span className="gold-text">Good.</span></h1>
          <p className="muted hello-sub">Discover your next favorite recipe.</p>
        </div>
        <div className="head-btns">
          {aiAvailable && <a className="round-btn art-btn" href="#/ideas" aria-label="What can I cook?"><Art name="chef-hat" size={44} /></a>}
          <a className="round-btn gold" href="#/new" aria-label="Add a recipe"><Icon name="plus" size={24} /></a>
        </div>
      </header>

      {recipes === undefined ? null : recipes.length === 0 ? (
        <div className="empty soft-card">
          <div className="empty-art art-tile"><Art name="chef-hat" size={88} /></div>
          <h2>Your cookbook is empty</h2>
          <p>Paste any recipe — food, drinks, skincare, cleaning mixes — and it will be read to you one step at a time.</p>
          <a className="btn primary" href="#/new"><Icon name="plus" size={18} /> Add your first recipe</a>
        </div>
      ) : (
        <>
          <label className="search-pill">
            <Icon name="search" size={22} />
            <input type="search" placeholder="Search your recipes…" value={q} onChange={(e) => setQ(e.target.value)} />
            <button type="button" className={'filter-btn' + (favOnly ? ' on' : '')} onClick={() => setFavOnly((v) => !v)}
              aria-pressed={favOnly} aria-label={favOnly ? 'Show all recipes' : 'Show favorites only'}>
              <Icon name={favOnly ? 'heart' : 'filter'} size={22} filled={favOnly} />
            </button>
          </label>

          {!q && !favOnly && cat === 'All' && <Featured list={featured} />}

          <div className="cat-row" role="tablist" aria-label="Categories">
            {cats.map((c) => (
              <button key={c} role="tab" aria-selected={cat === c} className={'cat-tile' + (cat === c ? ' on' : '')} onClick={() => setCat(c)}>
                <Art name={CATEGORY_ART[c] ?? 'dough'} size={44} className="cat-art" />
                <span>{c}</span>
              </button>
            ))}
          </div>

          {aiAvailable && (
            <a className="ideas-card soft-card" href="#/ideas">
              <span className="ideas-icon"><Art name="whisk" size={44} /></span>
              <span className="ideas-text"><b className="serif">What can I cook?</b><span className="muted">Tell me what’s in your kitchen</span></span>
              <Icon name="next" size={20} />
            </a>
          )}

          <div className="list-head">
            <h2>{favOnly ? 'Favorites' : cat === 'All' ? 'Your Recipes' : cat}</h2>
            <span className="muted">{shown.length}</span>
          </div>
          {shown.length === 0 ? <p className="muted center pad">No recipes match.</p> : (
            <ul className="recipe-rows">
              {shown.map((r) => <Row key={r.id} r={r} />)}
            </ul>
          )}
        </>
      )}
    </div>
  );
}

function Meta({ r }: { r: Recipe }) {
  return (
    <span className="meta">
      <Icon name="clock" size={17} /> {shortTime(recipeMinutes(r))}
      <span className="dot-sep">•</span>
      <Icon name="bars" size={17} /> {difficulty(r)}
    </span>
  );
}

function Cover({ title, category, className }: { title: string; category: string; className: string }) {
  const url = useRecipeImage(title);
  const [failed, setFailed] = useState(false);
  return (
    <div className={className}>
      {url && !failed
        ? <img src={url} alt="" loading="lazy" referrerPolicy="no-referrer" onError={() => setFailed(true)} />
        : <Art name={CATEGORY_ART[category] ?? 'dough'} size={className === 'hero-img' ? 120 : 60} className="cover-art" />}
    </div>
  );
}

function Featured({ list }: { list: Recipe[] }) {
  const [idx, setIdx] = useState(0);
  const track = useRef<HTMLDivElement>(null);
  if (!list.length) return null;
  const onScroll = () => {
    const el = track.current;
    if (el) setIdx(Math.round(el.scrollLeft / el.clientWidth));
  };
  return (
    <section className="featured" aria-label="Featured recipes">
      <div className="featured-track" ref={track} onScroll={onScroll}>
        {list.map((r) => (
          <a key={r.id} className="hero-card soft-card" href={`#/recipe/${r.id}`}>
            <Cover title={r.title} category={r.category} className="hero-img" />
            <div className="hero-body">
              <div className="hero-text">
                <h2 className="hero-title">{r.title}</h2>
                <Meta r={r} />
              </div>
              <button className={'bookmark' + (r.favorite ? ' on' : '')} aria-label={r.favorite ? 'Remove from favorites' : 'Add to favorites'}
                onClick={(e) => { e.preventDefault(); db.recipes.update(r.id!, { favorite: !r.favorite }); }}>
                <Icon name="bookmark" size={22} filled={r.favorite} />
              </button>
            </div>
          </a>
        ))}
      </div>
      {list.length > 1 && (
        <div className="dots" aria-hidden="true">
          {list.map((_, i) => <span key={i} className={i === idx ? 'on' : ''} />)}
        </div>
      )}
    </section>
  );
}

function Row({ r }: { r: Recipe }) {
  return (
    <li>
      <a className="recipe-row soft-card" href={`#/recipe/${r.id}`}>
        <Cover title={r.title} category={r.category} className="row-img" />
        <div className="row-text">
          <h3>{r.title || 'Untitled recipe'}</h3>
          <Meta r={r} />
        </div>
        <button className={'heart-btn' + (r.favorite ? ' on' : '')} aria-label={r.favorite ? 'Remove from favorites' : 'Add to favorites'}
          onClick={(e) => { e.preventDefault(); db.recipes.update(r.id!, { favorite: !r.favorite }); }}>
          <Icon name="heart" size={22} filled={r.favorite} />
        </button>
      </a>
    </li>
  );
}
