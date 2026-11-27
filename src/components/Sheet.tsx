import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import Icon from './Icon';

/** Bottom sheet that slides up, and slides back down before closing (backdrop tap, ✕ or Escape). */
export default function Sheet({ title, onClose, children }: { title: ReactNode; onClose: () => void; children: ReactNode }) {
  const [closing, setClosing] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>();
  const close = useCallback(() => {
    if (timer.current) return;
    setClosing(true);
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    timer.current = setTimeout(onClose, reduce ? 0 : 200);
  }, [onClose]);
  useEffect(() => () => clearTimeout(timer.current), []);
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [close]);
  return (
    <div className={'sheet-backdrop' + (closing ? ' closing' : '')} onClick={close}>
      <div className="sheet" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="sheet-grip" aria-hidden="true" />
        <div className="section-head">
          <h2>{title}</h2>
          <button className="icon-btn" onClick={close} aria-label="Close"><Icon name="close" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}
