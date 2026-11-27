# 🍳 Recipe Reader

**Paste a recipe, then hear it one step at a time, only when you tap Next.**

Recipe Reader is a free web app that runs in your browser and installs on your iPhone like a regular app. It works offline and keeps everything on your phone: no account, no ads, no server.

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
- **Keeps the screen awake** while you cook.
- Hear the ingredient list read aloud at any time.
- Choose the voice and reading speed in Settings.

### 🧾 Ingredient list for each recipe
- Every recipe shows its own ingredients or materials.
- **Tick only what you need** and tap *Add to grocery list*. Only the ticked items are added.

### 🛒 Grocery to-do list
- A **separate shopping list** you can use with or without recipes.
- Add your own items, tick them off, tap an item to edit it, and clear checked items.
- Items added from a recipe show which recipe they came from.
- Duplicates are merged ("Eggs ×2").

### 💾 Your data
- Saved on your device (IndexedDB) and available offline.
- **Export / Import backup** from Settings, so you can move recipes to a new phone.

---

## Install on iPhone

1. Open the app link in **Safari**.
2. Tap **Share** (the square with an arrow) → **Add to Home Screen** → **Add**.
3. Open it from the new icon. It runs full screen and works offline.

**Tip: nicer voices.** On your iPhone go to Settings → Accessibility → Spoken Content → Voices, download an *Enhanced* or *Premium* voice, then choose it in the app's **Settings** tab.

On Android, open the link in Chrome and tap **Install app**. On a computer, Chrome and Edge show an install icon in the address bar.

---

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

### Tech stack
- **React 18 + TypeScript + Vite**
- **vite-plugin-pwa** (Workbox) for installing and working offline
- **Dexie.js** for IndexedDB storage
- **Web Speech API** (`speechSynthesis`) for reading aloud
- **Screen Wake Lock API** to keep the screen on
- Plain CSS with automatic light and dark mode

### Project layout

| Path | Purpose |
|---|---|
| `src/parser.ts` | Splits pasted text into title, ingredients and steps |
| `src/db.ts` | Storage, grocery merging, backup export/import |
| `src/speech.ts` | Read-aloud and voice settings |
| `src/screens/` | Recipes, editor, recipe page, Cook Mode, grocery list, settings |
| `src/components/` | Tab bar and icons |
| `public/` | App icons |
| `.github/workflows/deploy.yml` | Builds the site and deploys it to GitHub Pages |

---

## Known limits on iPhone

These are iOS rules for web apps, not bugs in this app:

- **Speech stops when you leave the app or lock the phone.** Keep Cook Mode open; it keeps the screen on for you.
- **Spoken steps may pause your music** instead of playing over it.
- **No lock-screen buttons or Siri commands**, because iOS doesn't allow these for web apps.
- Data lives on the device. If you delete the Home Screen app, its data goes too, so export a backup first.

A native iPhone app (Swift) would remove the first three limits.
