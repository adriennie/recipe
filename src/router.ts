import { useEffect, useState } from 'react';

export type Route =
  | { name: 'list' }
  | { name: 'new' }
  | { name: 'edit'; id: number }
  | { name: 'recipe'; id: number }
  | { name: 'cook'; id: number }
  | { name: 'grocery' }
  | { name: 'settings' };

export function parseHash(hash: string): Route {
  const parts = hash.replace(/^#\/?/, '').split('/');
  const id = Number(parts[1]);
  switch (parts[0]) {
    case 'new': return { name: 'new' };
    case 'edit': return id ? { name: 'edit', id } : { name: 'list' };
    case 'recipe': return id ? { name: 'recipe', id } : { name: 'list' };
    case 'cook': return id ? { name: 'cook', id } : { name: 'list' };
    case 'grocery': return { name: 'grocery' };
    case 'settings': return { name: 'settings' };
    default: return { name: 'list' };
  }
}

export const go = (path: string) => { location.hash = path; };

export function useRoute(): Route {
  const [route, setRoute] = useState(() => parseHash(location.hash));
  useEffect(() => {
    const on = () => { setRoute(parseHash(location.hash)); window.scrollTo(0, 0); };
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  return route;
}
