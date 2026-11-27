import { useEffect, useRef, useState } from 'react';
import Sheet from './Sheet';
import Icon from './Icon';
import { callAI, recipeForAI } from '../ai';
import { speak, stopSpeaking } from '../speech';
import type { Recipe } from '../db';

const SUGGESTIONS = ['What can I use instead?', 'How do I know it’s done?', 'I made a mistake — what now?', 'Can I prepare this ahead?'];

/** "Ask about this step": a tiny chat about the current step, answers read aloud. */
export default function AskSheet({ recipe, stepIndex, onClose }: { recipe: Recipe; stepIndex: number; onClose: () => void }) {
  const [q, setQ] = useState('');
  const [chat, setChat] = useState<{ q: string; a?: string; err?: string }[]>([]);
  const [busy, setBusy] = useState(false);
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => { end.current?.scrollIntoView({ behavior: 'smooth' }); }, [chat]);
  useEffect(() => () => stopSpeaking(), []);

  const ask = async (question: string) => {
    const text = question.trim();
    if (!text || busy) return;
    setQ(''); setBusy(true);
    setChat((c) => [...c, { q: text }]);
    const history = chat.filter((m) => m.a).slice(-3).flatMap((m) => [`Q: ${m.q}`, `A: ${m.a}`]);
    try {
      const a = await callAI<string>('ask', { recipe: recipeForAI(recipe), stepIndex, question: text, history });
      setChat((c) => c.map((m, i) => (i === c.length - 1 ? { ...m, a } : m)));
      speak(a);
    } catch (e) {
      setChat((c) => c.map((m, i) => (i === c.length - 1 ? { ...m, err: (e as Error).message } : m)));
    }
    setBusy(false);
  };

  const close = () => { stopSpeaking(); onClose(); };
  return (
    <Sheet title={<span className="ai-title"><Icon name="sparkle" size={20} /> Ask about {stepIndex >= 0 ? `step ${stepIndex + 1}` : 'this recipe'}</span>} onClose={close}>
      {stepIndex >= 0 && <p className="muted small-text quote">“{recipe.steps[stepIndex]}”</p>}
      {chat.length === 0 && (
        <div className="term-chips ask-suggest">
          {SUGGESTIONS.map((s) => <button key={s} className="chip" onClick={() => ask(s)}>{s}</button>)}
        </div>
      )}
      <div className="chat">
        {chat.map((m, i) => (
          <div key={i}>
            <p className="bubble me">{m.q}</p>
            {m.a && (
              <div className="bubble ai">
                <p>{m.a}</p>
                <button className="link small" onClick={() => speak(m.a!)}><Icon name="speaker" size={16} /> Hear again</button>
              </div>
            )}
            {m.err && <p className="error small-text">{m.err}</p>}
            {!m.a && !m.err && <p className="bubble ai thinking">Thinking…</p>}
          </div>
        ))}
        <div ref={end} />
      </div>
      <form className="add-row ask-row" onSubmit={(e) => { e.preventDefault(); ask(q); }}>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Type or tap 🎤 on the keyboard" aria-label="Your question" enterKeyHint="send" />
        <button className="btn primary" disabled={busy || !q.trim()} aria-label="Ask"><Icon name="next" /></button>
      </form>
      <p className="hint">AI answers can be wrong — use your judgement, especially with food safety.</p>
    </Sheet>
  );
}
