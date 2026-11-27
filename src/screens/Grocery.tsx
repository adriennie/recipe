import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, addToGrocery, normalize, type GroceryItem } from '../db';
import Icon from '../components/Icon';
import IngredientImage from '../components/IngredientImage';
import TidySheet from '../components/TidySheet';
import { aiAvailable, SECTIONS } from '../ai';

export default function Grocery() {
  const items = useLiveQuery(() => db.grocery.orderBy('createdAt').toArray(), []);
  const [text, setText] = useState('');
  const [editing, setEditing] = useState<number | null>(null);
  const [tidy, setTidy] = useState(false);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    await addToGrocery([text]);
    setText('');
  };

  const todo = (items ?? []).filter((g) => !g.checked);
  const done = (items ?? []).filter((g) => g.checked);

  const clearChecked = () => db.grocery.bulkDelete(done.map((g) => g.id!));
  const clearAll = async () => { if (confirm('Clear the whole grocery list?')) await db.grocery.clear(); };

  return (
    <>
      <header className="topbar">
        <h1>Grocery list</h1>
        {items && items.length > 0 && <button className="link danger-text" onClick={clearAll}>Clear all</button>}
      </header>

      <form className="add-row" onSubmit={add}>
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Add an item, e.g. milk" aria-label="New grocery item" enterKeyHint="done" />
        <button className="btn primary" type="submit" disabled={!text.trim()} aria-label="Add"><Icon name="plus" /></button>
      </form>

      {items && items.length === 0 && (
        <div className="empty">
          <div className="empty-art"><Icon name="cart" size={40} /></div>
          <h2>Your list is empty</h2>
          <p>Type items above, or open a recipe and add just the ingredients you need.</p>
        </div>
      )}

      {aiAvailable && todo.length > 1 && (
        <button className="btn secondary block tidy-btn" onClick={() => setTidy(true)}><Icon name="sparkle" size={18} /> Tidy my list</button>
      )}

      {todo.some((g) => g.section) ? (
        // Grouped by shop section once the list has been tidied; new items without a section go under "Other".
        SECTIONS.map((sec) => {
          const list = todo.filter((g) => (g.section && SECTIONS.includes(g.section) ? g.section : 'Other') === sec);
          return list.length ? (
            <div key={sec} className="aisle">
              <h3 className="aisle-head">{sec}</h3>
              <ul className="grocery">{list.map((g) => <Row key={g.id} g={g} editing={editing === g.id} setEditing={setEditing} />)}</ul>
            </div>
          ) : null;
        })
      ) : (
        <ul className="grocery">
          {todo.map((g) => <Row key={g.id} g={g} editing={editing === g.id} setEditing={setEditing} />)}
        </ul>
      )}
      {tidy && <TidySheet items={todo} onClose={() => setTidy(false)} />}

      {done.length > 0 && (
        <section className="section">
          <div className="section-head">
            <h2 className="muted">In the cart <span className="count">{done.length}</span></h2>
            <button className="link" onClick={clearChecked}>Clear checked</button>
          </div>
          <ul className="grocery">
            {done.map((g) => <Row key={g.id} g={g} editing={editing === g.id} setEditing={setEditing} />)}
          </ul>
        </section>
      )}
    </>
  );
}

function Row({ g, editing, setEditing }: { g: GroceryItem; editing: boolean; setEditing: (id: number | null) => void }) {
  const [val, setVal] = useState(g.text);
  const save = async () => {
    const t = val.trim();
    if (t && t !== g.text) await db.grocery.update(g.id!, { text: t, key: normalize(t) });
    setEditing(null);
  };
  return (
    <li className={'g-row' + (g.checked ? ' checked' : '')}>
      <input type="checkbox" checked={g.checked} aria-label={`Mark ${g.text} as bought`}
        onChange={() => db.grocery.update(g.id!, { checked: !g.checked })} />
      <IngredientImage text={g.text} />
      {editing ? (
        <input className="g-edit" autoFocus value={val} onChange={(e) => setVal(e.target.value)}
          onBlur={save} onKeyDown={(e) => { if (e.key === 'Enter') save(); if (e.key === 'Escape') setEditing(null); }} />
      ) : (
        <button className="g-text" onClick={() => { setVal(g.text); setEditing(g.id!); }}>
          <span>{g.text}{g.count > 1 && <b className="qty"> ×{g.count}</b>}</span>
          {g.sources.length > 0 && <span className="sources">{g.sources.join(' · ')}</span>}
        </button>
      )}
      <button className="icon-btn subtle" aria-label={`Delete ${g.text}`} onClick={() => db.grocery.delete(g.id!)}><Icon name="close" size={18} /></button>
    </li>
  );
}
