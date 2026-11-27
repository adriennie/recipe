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
        {route.name === 'terms' && <Terms />}
        {route.name === 'ideas' && <Ideas />}
      </main>
      <TabBar active={route.name === 'grocery' || route.name === 'settings' || route.name === 'terms' ? route.name : 'recipes'} />
    </div>
  );
}
