import { useMemo, useState } from 'react';
import { TERMS, lookupOnline, lookupTerm, type OnlineDefinition, type Term } from '../glossary';
import { speak } from '../speech';
import TermSheet from '../components/TermSheet';
import Icon from '../components/Icon';

const sorted = [...TERMS].sort((a, b) => a.term.localeCompare(b.term));

export default function Terms() {
  const [q, setQ] = useState('');
  const [open, setOpen] = useState<Term | null>(null);
  const [online, setOnline] = useState<OnlineDefinition | null | 'none' | 'loading'>(null);

  const query = q.trim().toLowerCase();
  const shown = useMemo(() => {
    if (!query) return sorted;
    const exact = lookupTerm(query);
    const list = sorted.filter((t) => [t.term, ...(t.forms ?? [])].some((f) => f.toLowerCase().includes(query)) || t.meaning.toLowerCase().includes(query));
    return exact && !list.includes(exact) ? [exact, ...list] : list;
  }, [query]);

  const searchOnline = async () => {
    setOnline('loading');
    setOnline((await lookupOnline(query)) ?? 'none');
  };

  return (
    <>
      <header className="topbar"><h1>Cooking terms</h1></header>
      <p className="muted small-text">Plain-English meanings for recipe words. Tap any term to read it, or hear it aloud.</p>

      <label className="search">
        <Icon name="search" size={18} />
        <input type="search" placeholder="Look up a word, e.g. marinate" value={q}
          onChange={(e) => { setQ(e.target.value); setOnline(null); }} />
      </label>

      {query && (
        <div className="online-box">
          {online === null && (
            <button className="link" onClick={searchOnline} disabled={!navigator.onLine}>
              <Icon name="search" size={16} /> {shown.length ? `Not it? Look up “${q.trim()}” in the dictionary` : `Look up “${q.trim()}” in the dictionary`}
            </button>
          )}
          {online === 'loading' && <p className="muted">Looking it up…</p>}
          {online === 'none' && <p className="muted">No dictionary meaning found for “{q.trim()}”.</p>}
          {online && typeof online === 'object' && (
            <div className="card pad-card">
              <h3 className="term-title">{online.word}</h3>
              <p className="term-meaning">{online.meaning}</p>
              <div className="row-btns">
                <button className="btn secondary small" onClick={() => speak(`${online.word}. ${online.meaning}`)}><Icon name="speaker" size={16} /> Read aloud</button>
              </div>
              <p className="hint">From {online.source}</p>
            </div>
          )}
          {!navigator.onLine && online === null && <p className="hint">Connect to the internet to search the dictionary.</p>}
        </div>
      )}

      <ul className="term-list">
        {shown.map((t) => (
          <li key={t.term}>
            <button onClick={() => setOpen(t)}>
              <b>{t.term}</b>
              <span className="muted">{t.meaning}</span>
            </button>
          </li>
        ))}
      </ul>

      {open && <TermSheet term={open} onClose={() => setOpen(null)} />}
    </>
  );
}
