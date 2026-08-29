# Ayah — Quran Verse Widget

A calm widget that shows one ayah at a time, with translation from Quran.com.
A **fully self-owned, dependency-free static PWA** — no build step, no Vercel,
no subscriptions, no v0 credits.

## Where it lives
- **Live app:** https://lugine.github.io/ayah/
- **Source code:** https://github.com/lugine/ayah
- **Your local editable copy:** `~/ayah`

## Edit → ship (repeat whenever you want)
1. Edit files in `~/ayah` (plain HTML/CSS/JS — or ask me to make changes).
2. Ship it:
   ```bash
   cd ~/ayah
   git add -A
   git commit -m "describe your change"
   git push
   ```
3. GitHub Pages auto-publishes within ~1 minute. Refresh/reopen the app on
   your devices to get the update.

## What it does
- **Read** — one ayah at a time (Arabic + Saheeh International translation),
  Previous / Next / Shuffle, arrow-key navigation, a new "daily verse" each day
- **Browse** — all 114 surahs, expandable to per-ayah chips
- **Memorized** — mark verses (saved on-device), live count
- **Offline** — service worker caches the shell + viewed verses; curated
  verses work with no internet
- **Installable PWA** + light/dark themes

## Run locally
```bash
cd ~/ayah
python3 -m http.server 8137
# open http://localhost:8137
```

## Put it on your iPhone
1. Open **https://lugine.github.io/ayah/** in Safari.
2. Tap **Share → Add to Home Screen → Add** — runs full-screen like an app.

## Add it as a widget on your Mac
macOS 15.6 supports Safari web widgets:
1. Open the URL in Safari.
2. Right-click the page → **Add to Widget** if shown, or right-click the
   desktop → **Edit Widgets…** → search **"Ayah"** → drag it onto the desktop.

> Note: iOS doesn't allow websites to become home-screen *widgets* (only
> native apps do that). This free route = full-screen app icon on iPhone +
> a live desktop widget on Mac.

## Files
| File | Purpose |
|---|---|
| `index.html` | App shell + metadata |
| `styles.css` | Design (light/dark auto) |
| `app.js` | Logic + full 114-surah index + offline verses |
| `manifest.webmanifest` | PWA manifest |
| `sw.js` | Service worker (offline) |
| `icons/` | App icons (SVG sources + PNGs) |
| `test.js` | Node tests (14 checks) |

## Data & privacy
Quran text from the public Quran.com API. Memorized list + last verse live
only in your browser's `localStorage` — nothing leaves the device.