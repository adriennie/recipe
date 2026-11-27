import { useCallback, useEffect, useRef, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { go } from '../router';
import { speak, stopSpeaking, speechSupported } from '../speech';
import Icon from '../components/Icon';
import IngredientImage from '../components/IngredientImage';
import ImageSheet from '../components/ImageSheet';
import TermText from '../components/TermText';
import TermSheet from '../components/TermSheet';
import Sheet from '../components/Sheet';
import Art from '../components/Art';
import AskSheet from '../components/AskSheet';
import { aiAvailable } from '../ai';
import { termsIn, type Term } from '../glossary';

/** Keeps the screen on while cooking (re-acquired when the app comes back to the front). */
function useWakeLock() {
  useEffect(() => {
    let lock: WakeLockSentinel | null = null;
    const get = async () => {
      try { if ('wakeLock' in navigator && document.visibilityState === 'visible') lock = await navigator.wakeLock.request('screen'); }
      catch { /* not allowed right now */ }
    };
    get();
    const onVis = () => { if (document.visibilityState === 'visible') get(); };
    document.addEventListener('visibilitychange', onVis);
    return () => { document.removeEventListener('visibilitychange', onVis); lock?.release().catch(() => {}); };
  }, []);
}

export default function CookMode({ id }: { id: number }) {
  const r = useLiveQuery(() => db.recipes.get(id), [id], null);
  const [i, setI] = useState(-1); // -1 = not started, steps.length = finished
  const [speaking, setSpeaking] = useState(false);
  const [showIng, setShowIng] = useState(false);
  const [term, setTerm] = useState<Term | null>(null);
  const [image, setImage] = useState<{ text: string; url: string | null } | null>(null);
  const [asking, setAsking] = useState(false);
  const stepRef = useRef<HTMLDivElement>(null);
  useWakeLock();

  useEffect(() => { if (r === undefined) go('/'); }, [r]);
  useEffect(() => () => stopSpeaking(), []);
  useEffect(() => { stepRef.current?.focus(); }, [i]);

  const say = useCallback((text: string) => {
    setSpeaking(true);
    speak(text, () => setSpeaking(false));
  }, []);

  const total = r?.steps.length ?? 0;
  const goTo = useCallback((n: number) => {
    if (!r) return;
    setI(n);
    if (n >= 0 && n < total) say(`Step ${n + 1}. ${r.steps[n]}`);
    else if (n >= total) say('All done. Enjoy!');
  }, [r, total, say]);

  // Arrow keys / space work with a Bluetooth keyboard or page-turner.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (term || showIng || image || asking) return;
      if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); if (i < total) goTo(i + 1); }
      if (e.key === 'ArrowLeft' && i > 0) goTo(i - 1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [i, total, goTo, term, showIng, image, asking]);

  if (!r) return null;

  const exit = () => { stopSpeaking(); go(`/recipe/${id}`); };
  const pct = i < 0 ? 0 : Math.min(100, ((i + 1) / total) * 100);
  const readIngredients = () => say(r.ingredients.length ? `You will need: ${r.ingredients.join('. ')}.` : 'No ingredients listed.');

  return (
    <div className="cook">
      <header className="cook-top">
        <button className="icon-btn" onClick={exit} aria-label="Exit cook mode"><Icon name="close" /></button>
        <div className="cook-title">{r.title}</div>
        {aiAvailable && (
          <button className="icon-btn ai-btn" onClick={() => { stopSpeaking(); setAsking(true); }} aria-label="Ask AI about this step"><Icon name="sparkle" /></button>
        )}
        <button className="icon-btn" onClick={() => setShowIng(true)} aria-label="Show ingredients"><Icon name="list" /></button>
      </header>
      <div className="progress" role="progressbar" aria-valuenow={Math.max(0, i + 1)} aria-valuemin={0} aria-valuemax={total}>
        <div style={{ width: pct + '%' }} />
      </div>

      <div className="cook-body" ref={stepRef} tabIndex={-1} aria-live="polite">
        {i < 0 ? (
          <div className="cook-start">
            <span className="art-tile cook-art"><Art name="oven" size={84} /></span>
            <p className="cook-count">{total} steps</p>
            <p className="cook-text">Ready when you are. Tap <b>Start</b> to hear step 1. Each next step is read only when you tap <b>Next</b>.</p>
            {!speechSupported && <p className="error">This browser can't read aloud, but you can still follow the steps.</p>}
            <button className="link" onClick={readIngredients}><Icon name="speaker" size={18} /> Read ingredients aloud</button>
          </div>
        ) : i >= total ? (
          <div className="cook-start">
            <p className="cook-count">Finished</p>
            <p className="cook-text">All done. Enjoy!</p>
            <button className="btn secondary" onClick={() => goTo(0)}>Start over</button>
          </div>
        ) : (
          <>
            <p className="cook-count">Step {i + 1} of {total}</p>
            <p className="cook-text"><TermText text={r.steps[i]} onTerm={setTerm} /></p>
            {aiAvailable && (
              <button className="chip ask-chip" onClick={() => { stopSpeaking(); setAsking(true); }}>
                <Icon name="sparkle" size={16} /> Ask about this step
              </button>
            )}
            {termsIn(r.steps[i]).length > 0 && (
              <div className="term-chips">
                {termsIn(r.steps[i]).map((t) => (
                  <button key={t.term} className="chip term-chip" onClick={() => setTerm(t)}>
                    <span aria-hidden="true">?</span> What does “{t.term}” mean?
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <p className="cook-hint">Keep this screen open — iPhone pauses web speech if you leave the app or lock the phone.</p>

      <footer className="cook-controls">
        <button className="btn ghost" disabled={i <= 0} onClick={() => goTo(i - 1)} aria-label="Previous step">
          <Icon name="back" /> Back
        </button>
        {speaking ? (
          <button className="btn ghost" onClick={() => { stopSpeaking(); setSpeaking(false); }} aria-label="Stop reading"><Icon name="stop" /></button>
        ) : (
          <button className="btn ghost" disabled={i < 0 || i >= total} onClick={() => goTo(i)} aria-label="Repeat step"><Icon name="repeat" /></button>
        )}
        {i >= total ? (
          <button className="btn primary next" onClick={exit}>Done</button>
        ) : (
          <button className="btn primary next" onClick={() => goTo(i + 1)}>
            {i < 0 ? 'Start' : i === total - 1 ? 'Finish' : 'Next'} <Icon name="next" />
          </button>
        )}
      </footer>

      {showIng && (
        <Sheet title="Ingredients" onClose={() => setShowIng(false)}>
          <ul className="ing-list">
            {r.ingredients.map((x, k) => (
              <li key={k}>
                <IngredientImage text={x} size={52} onOpen={(url) => setImage({ text: x, url })} />
                <span><TermText text={x} mode="ingredient" onTerm={setTerm} /></span>
              </li>
            ))}
          </ul>
          <button className="btn secondary block" onClick={readIngredients}><Icon name="speaker" size={18} /> Read aloud</button>
        </Sheet>
      )}
      {image && <ImageSheet text={image.text} url={image.url} onClose={() => setImage(null)} />}
      {term && <TermSheet term={term} autoSpeak onClose={() => setTerm(null)} />}
      {asking && <AskSheet recipe={r} stepIndex={i >= 0 && i < total ? i : -1} onClose={() => setAsking(false)} />}
    </div>
  );
}
