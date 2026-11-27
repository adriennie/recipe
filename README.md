# Recipe Reader

An installable web app (PWA) for iPhone:

- **Save any recipe** (food, drinks, beauty, cleaning, crafts) by pasting it. The app splits it into ingredients and steps, and you can edit both.
- **Cook Mode** reads one step aloud **only when you tap Next**, with Back, Repeat and Stop buttons, and keeps the screen awake.
- **Ingredients for each recipe**, where you tick the ones you need and add **only those** to the grocery list.
- **A separate grocery to-do list**: add your own items, tick them off, edit them by tapping, and duplicates are merged.
- Search, favorites, category filters, voice and speed settings, and backup export/import.
- Works offline. Everything is stored on the phone; there are no accounts and no server.

## Run it on your Mac

```bash
npm install
npm run dev
```

Open http://localhost:5173. While the dev server runs, your iPhone can open the "Network" address it prints, as long as it's on the same Wi-Fi. Read-aloud works there, but offline mode and installing need HTTPS (see below).

## Put it on your iPhone (free)

Installing to the Home Screen needs an HTTPS address. The simplest free option:

1. `npm run build`, which creates the `dist/` folder.
2. Go to https://app.netlify.com/drop and drag the `dist/` folder onto the page. You get an `https://….netlify.app` link.
3. On your iPhone, open that link in **Safari**, then tap **Share → Add to Home Screen**.

Vercel, Cloudflare Pages and GitHub Pages also work. The app uses relative paths, so any folder or subpath is fine.

**Better voices:** iPhone Settings → Accessibility → Spoken Content → Voices → download an *Enhanced* or *Premium* voice, then choose it in the app's Settings tab.

## Known iPhone limits (web apps)

- Speech **stops if you leave the app or lock the phone**, because iOS pauses web speech in the background. Keep Cook Mode open; it keeps the screen on for you.
- Spoken steps may **pause your music** instead of playing over it.
- Lock-screen controls and Siri aren't available to web apps.

A native Swift version would remove these limits.

## Project layout

| File | What it does |
|---|---|
| `src/parser.ts` | Splits pasted text into title, ingredients and steps |
| `src/db.ts` | IndexedDB storage (Dexie), grocery merging, backup |
| `src/speech.ts` | Read-aloud using the browser's speech synthesis |
| `src/screens/*` | Recipes, editor, recipe detail, Cook Mode, grocery list, settings |
| `scripts/make-icons.mjs` | Regenerates the app icons (`npm run icons`) |
