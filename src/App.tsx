import { useRoute } from './router';
import RecipeList from './screens/RecipeList';
import RecipeEditor from './screens/RecipeEditor';
import RecipeDetail from './screens/RecipeDetail';
import CookMode from './screens/CookMode';
import Grocery from './screens/Grocery';
import Settings from './screens/Settings';
import TabBar from './components/TabBar';

export default function App() {
  const route = useRoute();

  if (route.name === 'cook') return <CookMode id={route.id} />;

  return (
    <div className="app">
      <main className="screen">
        {route.name === 'list' && <RecipeList />}
        {route.name === 'new' && <RecipeEditor />}
        {route.name === 'edit' && <RecipeEditor id={route.id} />}
        {route.name === 'recipe' && <RecipeDetail id={route.id} />}
        {route.name === 'grocery' && <Grocery />}
        {route.name === 'settings' && <Settings />}
      </main>
      <TabBar active={route.name === 'grocery' ? 'grocery' : route.name === 'settings' ? 'settings' : 'recipes'} />
    </div>
  );
}
