import { useState } from 'react';
import Sheet from './Sheet';
import Icon from './Icon';
import { callAI, cached, minutesText, recipeForAI, remember, type Analysis, type Faster } from '../ai';
import { db, type Recipe } from '../db';
import { go } from '../router';

const fmt = (n: number) => (n >= 10 ? Math.round(n) : Math.round(n * 10) / 10);

/** "AI helpers" on the recipe page: time & nutrition, and a quicker version. */
export default function RecipeAI({ recipe }: { recipe: Recipe }) {
  const key = `analyze:${recipe.uid}:${recipe.updatedAt}`;
  const [analysis, setAnalysis] = useState<Analysis | null>(() => cached<Analysis>(key));
  const [faster, setFaster] = useState<Faster | null>(null);
  const [busy, setBusy] = useState<'' | 'analyze' | 'faster'>('');
  const [err, setErr] = useState('');
  const [open, setOpen] = useState<'' | 'analyze' | 'faster'>('');

  const run = async (task: 'analyze' | 'faster') => {
    setErr(''); setOpen(task);
    if (task === 'analyze' && analysis) return;
    setBusy(task);
    try {
      const res = await callAI<Analysis | Faster>(task, { recipe: recipeForAI(recipe) });
      if (task === 'analyze') { setAnalysis(res as Analysis); remember(key, res); }
      else setFaster(res as Faster);
    } catch (e) { setErr((e as Error).message); }
    setBusy('');
  };

  const saveFaster = async () => {
    if (!faster) return;
    const now = Date.now();
    const id = await db.recipes.add({
      title: faster.recipe.title, category: recipe.category, ingredients: faster.recipe.ingredients, steps: faster.recipe.steps,
      rawText: '', favorite: false, createdAt: now, updatedAt: now
    });
    go(`/recipe/${id}`);
  };

  return (
    <section className="section">
      <h2 className="ai-title"><Icon name="sparkle" size={20} /> AI helpers</h2>
      {analysis && (
        <div className="stat-row">
          <span className="stat"><Icon name="clock" size={16} /> {minutesText(analysis.totalMinutes)}</span>
          {analysis.isEdible && <span className="stat">~{analysis.perServing.calories} kcal</span>}
          {analysis.isEdible && <span className="stat">{fmt(analysis.perServing.proteinG)} g protein</span>}
          <span className="muted small-text">per serving · estimate</span>
        </div>
      )}
      <div className="row-btns">
        <button className="btn secondary" onClick={() => run('analyze')}><Icon name="clock" size={18} /> Time & nutrition</button>
        <button className="btn secondary" onClick={() => run('faster')}><Icon name="sparkle" size={18} /> Make it quicker</button>
      </div>

      {open === 'analyze' && (
        <Sheet title="Time & nutrition" onClose={() => setOpen('')}>
          {busy === 'analyze' ? <p className="muted">Working it out…</p> : err ? <p className="error">{err}</p> : analysis && (
            <>
              <div className="stat-grid">
                <div><b>{minutesText(analysis.totalMinutes)}</b><span>total</span></div>
                <div><b>{minutesText(analysis.activeMinutes)}</b><span>hands-on</span></div>
                <div><b>{minutesText(analysis.waitingMinutes)}</b><span>waiting</span></div>
              </div>
              {analysis.isEdible ? (
                <>
                  <h3 className="sub">Per serving <span className="muted">(makes about {analysis.servings})</span></h3>
                  <table className="nutri">
                    <tbody>
                      <tr><td>Calories</td><td>{analysis.perServing.calories} kcal</td></tr>
                      <tr><td>Protein</td><td>{fmt(analysis.perServing.proteinG)} g</td></tr>
                      <tr><td>Carbs</td><td>{fmt(analysis.perServing.carbsG)} g</td></tr>
                      <tr><td>Sugar</td><td>{fmt(analysis.perServing.sugarG)} g</td></tr>
                      <tr><td>Fat</td><td>{fmt(analysis.perServing.fatG)} g</td></tr>
                      <tr><td>Fibre</td><td>{fmt(analysis.perServing.fiberG)} g</td></tr>
                    </tbody>
                  </table>
                </>
              ) : <p className="muted">Not food or drink, so no nutrition.</p>}
              {analysis.highlights.length > 0 && <ul className="plain-list small">{analysis.highlights.map((h, i) => <li key={i}>{h}</li>)}</ul>}
              {analysis.note && <p className="muted small-text">{analysis.note}</p>}
              <p className="hint">Rough AI estimate — not medical or dietary advice.</p>
            </>
          )}
        </Sheet>
      )}

      {open === 'faster' && (
        <Sheet title="Quicker version" onClose={() => setOpen('')}>
          {busy === 'faster' ? <p className="muted">Finding shortcuts…</p> : err ? <p className="error">{err}</p> : faster && (
            <>
              <div className="stat-grid two">
                <div><b className="strike">{minutesText(faster.originalMinutes)}</b><span>before</span></div>
                <div><b className="good">{minutesText(faster.newMinutes)}</b><span>now</span></div>
              </div>
              <h3 className="sub">What changed</h3>
              <ul className="plain-list small">{faster.changes.map((c, i) => <li key={i}>{c}</li>)}</ul>
              <h3 className="sub">Ingredients</h3>
              <ul className="plain-list small">{faster.recipe.ingredients.map((x, i) => <li key={i}>{x}</li>)}</ul>
              <h3 className="sub">Steps</h3>
              <ol className="plain-list small">{faster.recipe.steps.map((x, i) => <li key={i}>{x}</li>)}</ol>
              <div className="row-btns">
                <button className="btn primary" onClick={saveFaster}>Save as new recipe</button>
                <button className="btn ghost" onClick={() => { setFaster(null); run('faster'); }}>Try again</button>
              </div>
              <p className="hint">Your original recipe stays as it is.</p>
            </>
          )}
        </Sheet>
      )}
    </section>
  );
}
