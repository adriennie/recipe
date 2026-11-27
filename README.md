# 🍳 Recipe Reader

**Paste a recipe, then hear it one step at a time, only when you tap Next. It shows a picture of every ingredient and explains cooking words like "marinate".**

Recipe Reader is a free web app that runs in your browser and installs on your iPhone like a regular app. It works offline and keeps everything on your phone. Sign in if you want your recipes backed up and synced across devices.

**▶ Open the app: https://adriennie.github.io/recipe/**
(This link goes live after the first deploy. See [Publish the website](#publish-the-website).)

---

## Features

### 📋 Save any recipe
- Paste a recipe from anywhere: a website, notes, a message or a caption.
- The app **splits it into ingredients and steps** for you, and you can edit both before saving.
- Works for food and more: **Food, Drink, Baking, Beauty, Home, Craft, Other**.
- Search by name or ingredient, mark favorites ★, and filter by type.

### 🔊 Cook Mode: read aloud step by step
- One step on screen at a time, in large text.
- A step is read aloud **only when you tap Next**. Nothing plays on its own.
- **Back**, **Repeat** and **Stop** buttons, plus a progress bar ("Step 3 of 8").
- Open the ingredients with pictures at any time from the list button.
- **Keeps the screen awake** while you cook.
- Hear the ingredient list read aloud at any time.
- Choose the voice and reading speed in Settings.

### 🧾 Ingredient list with pictures
- Every recipe shows its own ingredients or materials, **each with a picture** so you know what to look for in the shop.
- Tap a picture to see it bigger.
- **Tick only what you need** and tap *Add to grocery list*. Only the ticked items are added.
- Pictures come from [TheMealDB](https://www.themealdb.com) (about 1,000 foods), then Wikipedia for anything else (like witch hazel). If none is found, an emoji is shown. Only the ingredient name is sent, and pictures are saved on the phone for offline use. You can turn pictures off in Settings.

### ❓ "What does marinate mean?"
- Cooking words in recipes (marinate, sauté, fold, deglaze, simmer, zest, cream…) are **underlined**. Tap one for a plain-English meaning and a tip.
- In Cook Mode, each step shows a **"What does … mean?"** button, and the meaning is **read aloud** when you tap it.
- The **Terms** tab lists about 130 cooking words, kitchen tools and amounts (tbsp, pinch, room temperature…), with search.
- If a word isn't in the list, look it up in the online dictionary from the Terms tab.

### 🛒 Grocery to-do list
- A **separate shopping list** you can use with or without recipes.
- Add your own items, tick them off, tap an item to edit it, and clear checked items.
- Items added from a recipe show which recipe they came from, with a small picture.
- Duplicates are merged ("Eggs ×2").

### ✨ AI helpers (optional, needs sign-in)
- **Ask about this step:** in Cook Mode tap ✨ and ask anything ("What can I use instead of buttermilk?", "How do I know the onions are done?", "I added too much salt"). The AI knows the recipe and the step you're on, and **reads the answer aloud**.
- **Time & nutrition:** total, hands-on and waiting time, plus rough calories, protein, carbs, fat, fibre and sugar per serving.
- **Make it quicker:** a faster version of the recipe with what changed, saved as a new recipe. The original stays as it is.
- **Tidy my list:** merges duplicates ("2 eggs" + "1 egg" → "3 eggs"), sorts the grocery list by shop section, and ticks off what you always have at home.
- **What can I cook?:** say what's in your kitchen, and it picks matching saved recipes (and adds what's missing to your list) plus one new recipe idea.

### ☁️ Your data & sync
- Everything is saved on your device first, so the app works offline and without an account.
- **Sign in (GitHub, or email + password) to sync** your recipes and grocery list to the cloud ([Supabase](https://supabase.com)) and across devices: iPhone, iPad and computer.
- Changes upload automatically. If the same item was changed on two devices, the latest edit wins.
- Each account can only see its own data, enforced by the database's row level security.
- **Export / Import backup** from Settings also works without an account.

---

## Install on iPhone

1. Open the app link in **Safari**.
2. Tap **Share** (the square with an arrow) → **Add to Home Screen** → **Add**.
3. Open it from the new icon. It runs full screen and works offline.

**Tip: nicer voices.** On your iPhone go to Settings → Accessibility → Spoken Content → Voices, download an *Enhanced* or *Premium* voice, then choose it in the app's **Settings** tab.

On Android, open the link in Chrome and tap **Install app**. On a computer, Chrome and Edge show an install icon in the address bar.

---

## Set up the database (Supabase)

Sync is optional. Without these steps the app still works, saving only on the device.

1. **Create the tables.** In your Supabase project open **SQL Editor → New query**, paste everything from [`supabase/schema.sql`](supabase/schema.sql), and click **Run**.
2. **Add your keys locally.** Copy `.env.example` to `.env` and fill in the values from **Project Settings → API** (or the **Connect** button):
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
   ```
   `.env` is git-ignored and never committed.
3. **Add the same two values to GitHub** so the website build gets them: repository **Settings → Secrets and variables → Actions → Variables tab → New repository variable**, once for each name above.
4. **Set where email links go back to.** In Supabase open **Authentication → URL Configuration**:
   - **Site URL:** `https://adriennie.github.io/recipe/`
   - **Redirect URLs:** add `https://adriennie.github.io/recipe/**`, `http://localhost:5173/**` and `http://localhost:8787/**` (the last one is for the terminal test)

   The links in confirmation and password-reset emails then open the app.

**Turn on "Continue with GitHub" (optional):**

1. On GitHub open **Settings → Developer settings → OAuth Apps → New OAuth App** (https://github.com/settings/developers):
   - **Application name:** Recipe Reader
   - **Homepage URL:** `https://adriennie.github.io/recipe/`
   - **Authorization callback URL:** `https://<project-ref>.supabase.co/auth/v1/callback` (your Supabase project URL followed by `/auth/v1/callback`)
2. Click **Register application**, then **Generate a new client secret**. Copy the **Client ID** and the **Client secret**.
3. In Supabase open **Authentication → Sign In / Providers → GitHub**, switch it on, paste both values and click **Save**.

**Test it from the terminal:**

```bash
npm run test:supabase
```

It checks that the tables exist and that strangers can't read or write. Then it signs in, either **with GitHub** (your browser opens; approve it and come back to the terminal) or with email and password (the password is hidden). It adds, reads, edits and deletes a test recipe and grocery item in your account. It also lists what the app has already synced, and deletes its test rows at the end.

New accounts must confirm their email before the first sign-in (Supabase's default). You can turn this off under **Authentication → Sign In / Providers → Email → Confirm email**.

## Set up the AI features (free)

The AI runs in a **Supabase Edge Function** ([`supabase/functions/ai`](supabase/functions/ai)), so the AI key stays on the server and never reaches the website. Only signed-in users can use it, with a daily limit per person (default 40 requests).

It uses **Google Gemini's free tier** (`gemini-3.8-flash`) by default: no credit card needed. It works with any OpenAI-compatible service, so if a free plan changes you can switch provider with a setting instead of changing code.

1. **Run the extra SQL:** in Supabase open **SQL Editor → New query**, paste [`supabase/ai.sql`](supabase/ai.sql) and click **Run**.
2. **Get a free Gemini API key:** go to https://aistudio.google.com, then **Get API key → Create API key**, and copy it with the copy button.
3. **Save the key and deploy** from this folder in the terminal. The first command reads the key straight from your clipboard and removes stray characters:
   ```bash
   npx supabase secrets set AI_API_KEY="$(pbpaste | tr -cd '!-~')"
   ```
   ```bash
   npx supabase functions deploy ai
   ```
   (First time only: run `npx supabase login` and `npx supabase link --project-ref <project-ref>` before these.)
4. *(Optional)* change the daily limit: `npx supabase secrets set AI_DAILY_LIMIT=60`.

**Free tier notes:** Google may use what you send on the free tier to improve its products, so recipes are fine but don't type anything private. Free tiers have per-minute and per-day limits, and free models are sometimes overloaded. When that happens the function retries once, then tries Google's other free models (`gemini-3.6-flash`, then `gemini-3.5-flash-lite`). Only if all of them are busy does the app say "The free AI is very busy right now". To change the backups, set `AI_FALLBACK_MODELS` (comma-separated).

**Speed:** quick jobs (Cook Mode questions, Tidy my list, Time & nutrition) use Google's fastest free model, `gemini-3.5-flash-lite`, with "thinking" turned off. Bigger jobs (Make it quicker, What can I cook?) use `gemini-3.8-flash` with light thinking. You can change these with `AI_FAST_MODEL`, `AI_THINKING_QUICK` and `AI_THINKING_NORMAL` (`none`, `low`, `medium` or `high`). Each request's time is logged in Supabase under **Edge Functions → ai → Logs**.

**Switching to another free provider** (no code changes, no redeploy):

| Provider | Free plan | Settings |
|---|---|---|
| Google Gemini (default) | Free tier, no card | `AI_API_KEY` only |
| Groq | Free plan, about 1,000 requests a day | `AI_BASE_URL=https://api.groq.com/openai/v1` `AI_MODEL=openai/gpt-oss-120b` `AI_API_KEY=<Groq key>` |
| Your own computer (Ollama) | Free forever; needs an always-on machine reachable from the internet | `AI_BASE_URL=https://<your-server>/v1` `AI_MODEL=<model name>` |

Set them with `npx supabase secrets set NAME=value`. If a model is retired, set `AI_MODEL` to a current one from the provider's model list.

## Publish the website

The site is built and deployed to **GitHub Pages** automatically by [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) every time you push to `main`.

**One-time setup:**

1. The code lives in [github.com/adriennie/recipe](https://github.com/adriennie/recipe).
2. Push your changes to `main`:
   ```bash
   git push origin main
   ```
3. On GitHub, open the repository's **Settings → Pages**, and under **Build and deployment → Source** choose **GitHub Actions**.
4. Open the **Actions** tab and wait for *Deploy web app to GitHub Pages* to finish (about a minute). If it ran before you changed the setting in step 3, click **Re-run all jobs**.
5. Your app is live at **https://adriennie.github.io/recipe/**.

After that, every push to `main` updates the website. You can also start a deploy by hand from **Actions → Deploy web app to GitHub Pages → Run workflow**.

> The app uses relative paths and hash-based links (`#/grocery`), so it works from any repository name or subfolder with no extra setup.

---

## Develop locally

Requires [Node.js](https://nodejs.org) 20 or newer.

```bash
npm install
npm run dev
```

Open http://localhost:5173. Your iPhone can open the **Network** address that `npm run dev` prints, as long as it's on the same Wi-Fi. Installing to the Home Screen and offline mode need the HTTPS GitHub Pages link.

| Command | What it does |
|---|---|
| `npm run dev` | Start the dev server with live reload |
| `npm run build` | Type-check and build the website into `dist/` |
| `npm run preview` | Serve the built `dist/` folder locally |
| `npm run icons` | Regenerate the app icons in `public/` |
| `npm run test:supabase` | Check the Supabase tables, security and sync with your account |

### Tech stack
- **React 18 + TypeScript + Vite**
- **vite-plugin-pwa** (Workbox) for installing and working offline
- **Dexie.js** for IndexedDB storage
- **Web Speech API** (`speechSynthesis`) for reading aloud
- **Screen Wake Lock API** to keep the screen on
- **Supabase** (Postgres + Auth, `@supabase/supabase-js`) for accounts and sync
- **Google Gemini free tier** (any OpenAI-compatible API works) in a Supabase Edge Function for the AI helpers
- **TheMealDB** and **Wikipedia** for ingredient pictures, and the **Free Dictionary API** for word lookups (all free, no keys)
- Plain CSS with automatic light and dark mode

### Project layout

| Path | Purpose |
|---|---|
| `src/parser.ts` | Splits pasted text into title, ingredients and steps |
| `src/db.ts` | On-device storage, change tracking, grocery merging, backup export/import |
| `src/sync.ts` | Supabase client, sign in/up, two-way sync |
| `supabase/schema.sql` | Database tables and row level security policies |
| `supabase/ai.sql` | Grocery shop sections and the daily AI usage limit |
| `supabase/functions/ai/` | Edge Function that calls the AI (`tasks.ts` holds each feature's instructions) |
| `src/ai.ts` | Calls the AI function from the app |
| `src/speech.ts` | Read-aloud and voice settings |
| `src/glossary.ts` | Built-in cooking terms, term detection and online dictionary lookup |
| `src/images.ts` | Finds ingredient pictures (TheMealDB, then Wikipedia, then emoji) |
| `src/screens/` | Recipes, editor, recipe page, Cook Mode, grocery list, cooking terms, settings |
| `src/components/` | Tab bar, icons, ingredient pictures, underlined terms, bottom sheets |
| `public/` | App icons |
| `.github/workflows/deploy.yml` | Builds the site and deploys it to GitHub Pages |

---

## Known limits on iPhone

These are iOS rules for web apps, not bugs in this app:

- **Speech stops when you leave the app or lock the phone.** Keep Cook Mode open; it keeps the screen on for you.
- **Spoken steps may pause your music** instead of playing over it.
- **No lock-screen buttons or Siri commands**, because iOS doesn't allow these for web apps.
- Without an account, data lives only on the device. If you delete the Home Screen app, its data goes too, so sign in or export a backup first.

A native iPhone app (Swift) would remove the first three limits.
