import { useEffect, useState } from 'react';
import { findIngredientImage, forgetImage, imagesEnabled, ingredientEmoji } from '../images';

/** Small square picture for an ingredient line, with an emoji while loading or when none is found. */
export default function IngredientImage({ text, size = 44, onOpen }: { text: string; size?: number; onOpen?: (url: string | null) => void }) {
  const enabled = imagesEnabled();
  const [url, setUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    let live = true;
    setUrl(null); setFailed(false);
    findIngredientImage(text).then((u) => { if (live) setUrl(u); });
    return () => { live = false; };
  }, [text, enabled]);

  const show = enabled && url && !failed;
  const body = show ? (
    <img src={url!} alt="" loading="lazy" referrerPolicy="no-referrer" onError={() => { setFailed(true); forgetImage(text); }} />
  ) : <span aria-hidden="true">{ingredientEmoji(text)}</span>;

  if (!onOpen) return <span className="ing-img" style={{ width: size, height: size }}>{body}</span>;
  return (
    <button type="button" className="ing-img" style={{ width: size, height: size }} aria-label={`See a picture of ${text}`}
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); onOpen(show ? url : null); }}>
      {body}
    </button>
  );
}
