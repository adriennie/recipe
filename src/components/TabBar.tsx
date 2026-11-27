import Icon from './Icon';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';

export default function TabBar({ active }: { active: 'recipes' | 'grocery' | 'settings' }) {
  const left = useLiveQuery(() => db.grocery.filter((g) => !g.checked).count(), [], 0);
  const tab = (id: typeof active, href: string, icon: string, label: string, badge?: number) => (
    <a href={href} className={'tab' + (active === id ? ' active' : '')} aria-current={active === id ? 'page' : undefined}>
      <span className="tab-icon"><Icon name={icon} />{badge ? <span className="badge">{badge}</span> : null}</span>
      <span>{label}</span>
    </a>
  );
  return (
    <nav className="tabbar">
      {tab('recipes', '#/', 'book', 'Recipes')}
      {tab('grocery', '#/grocery', 'cart', 'Grocery', left)}
      {tab('settings', '#/settings', 'gear', 'Settings')}
    </nav>
  );
}
