import { useEffect } from 'react';
import type { Term } from '../glossary';
import { speak, stopSpeaking } from '../speech';
import Sheet from './Sheet';
import Icon from './Icon';

export const termSpeech = (t: Term) => `${t.term}. ${t.meaning}${t.tip ? ' Tip: ' + t.tip : ''}`;

/** Explains one cooking word. In Cook Mode it is read aloud as soon as it opens. */
export default function TermSheet({ term, onClose, autoSpeak = false }: { term: Term; onClose: () => void; autoSpeak?: boolean }) {
  useEffect(() => {
    if (autoSpeak) speak(termSpeech(term));
  }, [term, autoSpeak]);
  const close = () => { if (autoSpeak) stopSpeaking(); onClose(); };
  return (
    <Sheet title={<span className="term-title">{term.term}</span>} onClose={close}>
      <p className="term-meaning">{term.meaning}</p>
      {term.tip && <p className="term-tip"><b>Tip:</b> {term.tip}</p>}
      <div className="row-btns">
        <button className="btn secondary" onClick={() => speak(termSpeech(term))}><Icon name="speaker" size={18} /> Read aloud</button>
        <a className="btn ghost" href="#/terms" onClick={() => stopSpeaking()}>All cooking terms</a>
      </div>
    </Sheet>
  );
}
