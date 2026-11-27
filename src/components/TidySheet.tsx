import { useState } from 'react';
import Sheet from './Sheet';
import Icon from './Icon';
import { callAI, loadStaples, saveStaples, SECTIONS, type TidyResult } from '../ai';
import { db, normalize, type GroceryItem } from '../db';

/** "Tidy my list": AI merges duplicates, sorts by shop section and leaves out things you always have. */
export default function TidySheet({ items, onClose }: { items: GroceryItem[]; onClose: () => void }) {
  const [staples, setStaples] = useState(loadStaples);
  const [result, setResult] = useState<TidyResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const byUid = new Map(items.map((g) => [g.uid!, g]));

  const run = async () => {
    saveStaples(staples);
    setBusy(true); setErr(''); setResult(null);
    try {
      const res = await callAI<TidyResult>('grocery', {
        items: items.map((g) => ({ id: g.uid, text: g.text, count: g.count })),
        staples: staples.split(/[,\n]/).map((s) => s.trim()).filter(Boolean)
      });
      // Keep only ids we actually sent, and make sure nothing got lost.
      const known = (ids: string[]) => ids.filter((id) => byUid.has(id));
      res.items = res.items.map((i) => ({ ...i, ids: known(i.ids) })).filter((i) => i.ids.length);
      res.skipped = res.skipped.map((s) => ({ ...s, ids: known(s.ids) })).filter((s) => s.ids.length);
      const covered = new Set([...res.items, ...res.skipped].flatMap((x) => x.ids));
      for (const g of items) if (!covered.has(g.uid!)) res.items.push({ text: g.text, section: g.section ?? 'Other', ids: [g.uid!] });
      setResult(res);
    } catch (e) { setErr((e as Error).message); }
    setBusy(false);
  };

  const apply = async () => {
    if (!result) return;
    await db.transaction('rw', db.grocery, async () => {
      for (const item of result.items) {
        const originals = item.ids.map((id) => byUid.get(id)!).filter(Boolean);
        const sources = Array.from(new Set(originals.flatMap((o) => o.sources)));
        const [keep, ...rest] = originals;
        // Reuse the first original so its sync history is kept; delete the merged-in ones.
        await db.grocery.update(keep.id!, { text: item.text, key: normalize(item.text), count: 1, sources, section: item.section });
        if (rest.length) await db.grocery.bulkDelete(rest.map((o) => o.id!));
      }
      // Things you always have are ticked off rather than deleted, so you can still see them.
      for (const s of result.skipped) for (const id of s.ids) await db.grocery.update(byUid.get(id)!.id!, { checked: true });
    });
    onClose();
  };

  const grouped = result ? SECTIONS.map((sec) => ({ sec, list: result.items.filter((i) => i.section === sec) })).filter((g) => g.list.length) : [];
  const merges = result ? result.items.filter((i) => i.ids.length > 1).length : 0;

  return (
    <Sheet title={<span className="ai-title"><Icon name="sparkle" size={20} /> Tidy my list</span>} onClose={onClose}>
      {!result && (
        <>
          <p className="muted small-text">Merges duplicates (“2 eggs” + “1 egg” → “3 eggs”), sorts everything by shop section, and ticks off things you always have at home.</p>
          <div className="field">
            <label htmlFor="staples">Always at home <span className="hint">comma separated</span></label>
            <textarea id="staples" rows={2} value={staples} onChange={(e) => setStaples(e.target.value)} />
          </div>
          <button className="btn primary block" disabled={busy} onClick={run}>{busy ? 'Tidying…' : `Tidy ${items.length} item${items.length === 1 ? '' : 's'}`}</button>
        </>
      )}
      {err && <p className="error">{err}</p>}
      {result && (
        <>
          <p className="muted small-text">{items.length} items → {result.items.length}{merges ? ` · ${merges} merged` : ''}{result.skipped.length ? ` · ${result.skipped.length} already at home` : ''}</p>
          {grouped.map((g) => (
            <div key={g.sec} className="tidy-group">
              <h3 className="sub">{g.sec}</h3>
              <ul className="plain-list small">
                {g.list.map((i, k) => <li key={k}>{i.text}{i.ids.length > 1 && <span className="muted"> · merged {i.ids.length}</span>}</li>)}
              </ul>
            </div>
          ))}
          {result.skipped.length > 0 && (
            <div className="tidy-group">
              <h3 className="sub">Already at home (will be ticked off)</h3>
              <ul className="plain-list small muted">{result.skipped.map((s, k) => <li key={k}>{s.ids.map((id) => byUid.get(id)?.text).join(', ')} — {s.reason}</li>)}</ul>
            </div>
          )}
          <div className="row-btns">
            <button className="btn primary" onClick={apply}>Apply</button>
            <button className="btn ghost" onClick={() => setResult(null)}>Back</button>
          </div>
        </>
      )}
    </Sheet>
  );
}
