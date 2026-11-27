import Icon from './Icon';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';

export default function TabBar({ active }: { active: 'recipes' | 'grocery' | 'terms' | 'settings' }) {
  const left = useLiveQuery(() => db.grocery.filter((g) => !g.checked).count(), [], 0);
  const tab = (id: typeof active, href: string, icon: string, label: string, badge?: number) => (
    <a href={href} className={'tab' + (active === id ? ' active' : '')} aria-current={active === id ? 'page' : undefined}>
      <span className="tab-icon"><Icon name={icon} size={26} />{badge ? <span className="badge">{badge}</span> : null}</span>
      <span>{label}</span>
    </a>
  );
  return (
    <nav className="tabbar">
      {tab('recipes', '#/', 'home', 'Home')}
      {tab('grocery', '#/grocery', 'cart', 'Grocery', left)}
      {tab('terms', '#/terms', 'book', 'Terms')}
      {tab('settings', '#/settings', 'user', 'Profile')}
    </nav>
  );
}
