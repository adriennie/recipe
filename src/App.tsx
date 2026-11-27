import { useRoute } from './router';
import RecipeList from './screens/RecipeList';
import RecipeEditor from './screens/RecipeEditor';
import RecipeDetail from './screens/RecipeDetail';
import CookMode from './screens/CookMode';
import Grocery from './screens/Grocery';
import Settings from './screens/Settings';
import Terms from './screens/Terms';
import Ideas from './screens/Ideas';
import TabBar from './components/TabBar';

export default function App() {
  const route = useRoute();

  if (route.name === 'cook') return <div className="page-zoom" key={`cook-${route.id}`}><CookMode id={route.id} /></div>;

  // A new key per screen replays the entrance animation each time you navigate.
  const pageKey = route.name + ('id' in route ? `-${route.id}` : '');
  // Opening something (recipe, editor, ideas) slides in from the right; switching tabs just fades up.
  const deeper = ['recipe', 'new', 'edit', 'ideas'].includes(route.name);

  return (
    <div className="app">
      <main className={'screen page ' + (deeper ? 'page-push' : 'page-fade')} key={pageKey}>
        {route.name === 'list' && <RecipeList />}
        {route.name === 'new' && <RecipeEditor />}
        {route.name === 'edit' && <RecipeEditor id={route.id} />}
        {route.name === 'recipe' && <RecipeDetail id={route.id} />}
        {route.name === 'grocery' && <Grocery />}
        {route.name === 'settings' && <Settings />}
        {route.name === 'terms' && <Terms />}
        {route.name === 'ideas' && <Ideas />}
      </main>
      <TabBar active={route.name === 'grocery' || route.name === 'settings' || route.name === 'terms' ? route.name : 'recipes'} />
    </div>
  );
}
