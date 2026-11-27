// Calls the "ai" Supabase Edge Function, which talks to a free AI model with a key kept on the server.
import { supabase } from './sync';
import type { Recipe } from './db';

export const aiAvailable = !!supabase;

export const SECTIONS = ['Produce', 'Meat & fish', 'Dairy & eggs', 'Bakery', 'Pantry', 'Spices & oils', 'Frozen', 'Drinks', 'Household & beauty', 'Other'];

export interface Analysis {
  isEdible: boolean; servings: number; activeMinutes: number; waitingMinutes: number; totalMinutes: number;
  perServing: { calories: number; proteinG: number; carbsG: number; fatG: number; fiberG: number; sugarG: number };
  highlights: string[]; note: string;
}
export interface Faster { originalMinutes: number; newMinutes: number; changes: string[]; recipe: { title: string; ingredients: string[]; steps: string[] } }
export interface TidyResult { items: { text: string; section: string; ids: string[] }[]; skipped: { ids: string[]; reason: string }[] }
export interface CookIdeas {
  matches: { id: string; missing: string[]; note: string }[];
  idea: { title: string; why: string; minutes: number; ingredients: string[]; steps: string[] };
}

export const recipeForAI = (r: Pick<Recipe, 'title' | 'ingredients' | 'steps'>) => ({ title: r.title, ingredients: r.ingredients, steps: r.steps });

// Development only: lets tests supply fake AI answers. Vite removes this from production builds.
type Mock = (task: string, body: Record<string, unknown>) => unknown;
let devMock: Mock | null = null;
if (import.meta.env.DEV) (window as unknown as { __setAIMock: (fn: Mock | null) => void }).__setAIMock = (fn) => { devMock = fn; };

export async function callAI<T>(task: 'ask' | 'analyze' | 'faster' | 'grocery' | 'cook', body: Record<string, unknown>): Promise<T> {
  if (import.meta.env.DEV && devMock) return (await new Promise((r) => setTimeout(r, 150)), devMock(task, body)) as T;
  if (!supabase) throw new Error('AI needs the Supabase connection set up.');
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Sign in (Settings → Account & sync) to use AI features.');
  if (!navigator.onLine) throw new Error("You're offline. AI features need the internet.");
  const { data, error } = await supabase.functions.invoke('ai', { body: { task, ...body } });
  if (error) {
    // Read the friendly message the function sent back, if any.
    const ctx = (error as { context?: Response }).context;
    let msg = '';
    try { msg = ctx ? (await ctx.json()).error : ''; } catch { /* not JSON */ }
    if (!msg && /Failed to send|fetch/i.test(error.message)) msg = "Couldn't reach the AI. It may not be deployed yet (see README → AI features).";
    throw new Error(msg || error.message);
  }
  return (data as { result: T }).result;
}

// ── small per-device caches ────────────────────────────────
export function cached<T>(key: string): T | null {
  try { return JSON.parse(localStorage.getItem('ai:' + key) || 'null'); } catch { return null; }
}
export function remember(key: string, value: unknown) {
  try { localStorage.setItem('ai:' + key, JSON.stringify(value)); } catch { /* full */ }
}

export function loadStaples(): string {
  try { return localStorage.getItem('staples') ?? 'salt, pepper, oil, water, sugar'; } catch { return ''; }
}
export function saveStaples(s: string) {
  try { localStorage.setItem('staples', s); } catch { /* ignore */ }
}

export function minutesText(m: number): string {
  if (!m || m < 1) return '—';
  const h = Math.floor(m / 60), mm = Math.round(m % 60);
  return h ? `${h} h${mm ? ` ${mm} min` : ''}` : `${mm} min`;
}
