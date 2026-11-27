// Supabase Edge Function: the app's single door to the AI.
// - Uses a free model through any OpenAI-compatible API (default: Google Gemini free tier).
// - Only signed-in users (Supabase checks the login token before this code runs).
// - Each person gets AI_DAILY_LIMIT requests per day (default 40).
// - The AI key is a Supabase secret and never reaches the browser.
//
// Secrets:  npx supabase secrets set AI_API_KEY=<your Gemini key>
//           (optional) AI_BASE_URL=...  AI_MODEL=...  to use Groq, OpenRouter, etc.
// Deploy:   npx supabase functions deploy ai

import { createClient } from '@supabase/supabase-js';
import { AIError, DEFAULT_PROVIDER, runTask, TASKS, type Provider } from './tasks.ts';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};
const reply = (status: number, data: unknown) =>
  new Response(JSON.stringify(data), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

// Clean up a key pasted with spaces, line breaks or quotes around it.
const API_KEY = (Deno.env.get('AI_API_KEY') ?? Deno.env.get('GEMINI_API_KEY') ?? '').trim()
  .replace(/^["'\u201c\u2018]+|["'\u201d\u2019]+$/g, '').trim();
// A key with curly quotes, "…" or invisible characters can't be sent in a header.
const KEY_PROBLEM = !API_KEY ? 'AI is not set up yet (missing AI_API_KEY secret).'
  : /[^\x21-\x7e]/.test(API_KEY) ? 'The AI_API_KEY secret contains a hidden or curly character (like “ ” or …). Set it again by pasting only the key.'
  : '';
const provider: Provider = {
  baseUrl: Deno.env.get('AI_BASE_URL')?.trim() || DEFAULT_PROVIDER.baseUrl,
  model: Deno.env.get('AI_MODEL')?.trim() || DEFAULT_PROVIDER.model,
  // Comma-separated backups; set AI_FALLBACK_MODELS to "" to turn them off.
  fallbackModels: (Deno.env.get('AI_FALLBACK_MODELS') ?? (Deno.env.get('AI_BASE_URL') ? '' : DEFAULT_PROVIDER.fallbackModels.join(',')))
    .split(',').map((m) => m.trim()).filter(Boolean),
  apiKey: API_KEY,
  // Speed settings. With the default Gemini setup: a fast "lite" model and no thinking for quick tasks.
  // For other providers these are off unless you set them.
  fastModel: Deno.env.get('AI_FAST_MODEL')?.trim() ?? (Deno.env.get('AI_BASE_URL') ? '' : DEFAULT_PROVIDER.fastModel),
  thinkingQuick: Deno.env.get('AI_THINKING_QUICK')?.trim() ?? (Deno.env.get('AI_BASE_URL') ? '' : DEFAULT_PROVIDER.thinkingQuick),
  thinkingNormal: Deno.env.get('AI_THINKING_NORMAL')?.trim() ?? (Deno.env.get('AI_BASE_URL') ? '' : DEFAULT_PROVIDER.thinkingNormal)
};
const DAILY_LIMIT = Number(Deno.env.get('AI_DAILY_LIMIT') ?? 40);

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return reply(405, { error: 'Use POST' });
  if (KEY_PROBLEM) return reply(500, { error: KEY_PROBLEM });

  const authHeader = req.headers.get('Authorization') ?? '';
  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: authHeader } }
  });
  const { data: { user } } = await supabase.auth.getUser(authHeader.replace(/^Bearer\s+/i, ''));
  if (!user) return reply(401, { error: 'Please sign in to use AI features.' });

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return reply(400, { error: 'Bad request' }); }
  const task = String(body.task ?? '');
  if (!TASKS[task]) return reply(400, { error: `Unknown task "${task}"` });

  const { data: allowed, error: quotaErr } = await supabase.rpc('use_ai_quota', { daily_limit: DAILY_LIMIT });
  if (quotaErr) return reply(500, { error: 'AI usage table is missing — run supabase/ai.sql.' });
  if (!allowed) return reply(429, { error: `You've used today's ${DAILY_LIMIT} AI requests. Try again tomorrow.` });

  try {
    const started = Date.now();
    const result = await runTask(provider, task, body);
    console.log(`ai ${task} ok in ${Date.now() - started} ms`); // visible in Supabase → Edge Functions → Logs
    return reply(200, { result });
  } catch (e) {
    if (e instanceof AIError) {
      console.error('AI error', e.status, e.message);
      if (e.status === 429) return reply(503, { error: 'The free AI limit is used up for now. Try again in a few minutes (or tomorrow).' });
      if (e.status === 503) return reply(503, { error: e.message });
      if (e.status === 401 || e.status === 403) return reply(500, { error: `The AI key was rejected: ${e.message.slice(0, 200)}` });
      if (e.status === 404) return reply(500, { error: `AI model "${provider.model}" not found. Set AI_MODEL to a current model.` });
      return reply(502, { error: e.status === 502 ? e.message : `AI error (${e.status}): ${e.message.slice(0, 300)}` });
    }
    const msg = e instanceof Error ? e.message : String(e);
    return reply(400, { error: msg });
  }
});
