import { splitTerms, type Term } from '../glossary';

/** Text with recognised cooking words underlined; tapping one shows what it means. */
export default function TermText({ text, onTerm, mode = 'step' }: { text: string; onTerm: (t: Term) => void; mode?: 'step' | 'ingredient' }) {
  return (
    <>
      {splitTerms(text, mode).map((p, i) => typeof p === 'string' ? p : (
        <button key={i} type="button" className="term" onClick={(e) => { e.preventDefault(); e.stopPropagation(); onTerm(p.term); }}
          aria-label={`${p.text} — what does this mean?`}>{p.text}</button>
      ))}
    </>
  );
}
