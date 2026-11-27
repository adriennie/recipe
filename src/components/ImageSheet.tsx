import Sheet from './Sheet';
import { largeImage, ingredientEmoji, ingredientName } from '../images';

export default function ImageSheet({ text, url, onClose }: { text: string; url: string | null; onClose: () => void }) {
  const name = ingredientName(text) || text;
  return (
    <Sheet title={<span className="term-title">{name}</span>} onClose={onClose}>
      <div className="big-img">
        {url ? <img src={largeImage(url)} alt={name} referrerPolicy="no-referrer" /> : <span aria-hidden="true">{ingredientEmoji(text)}</span>}
      </div>
      <p className="muted center">{text}</p>
      {!url && <p className="hint center">No picture found{navigator.onLine ? '' : ' — connect to the internet to look one up'}.</p>}
    </Sheet>
  );
}
