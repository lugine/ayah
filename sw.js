/* Ayah service worker — network-first for the shell (so updates flow),
   network-first for Quran.com data, cache fallback for offline use */
const VERSION = "v20";
const SHELL_CACHE = `ayah-shell-${VERSION}`;
const API_CACHE = `ayah-api-${VERSION}`;

const SHELL_ASSETS = [
  "./",
  "./index.html",
  "./widget.html",
  "./widget-page.js",
  "./styles.css",
  "./app.js",
  "./manifest.webmanifest",
  "./icons/icon.svg",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/maskable-512.png",
  "./icons/apple-touch-icon-180.png",
  "./icons/favicon-32.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) => cache.addAll(SHELL_ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  const keep = new Set([SHELL_CACHE, API_CACHE]);
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => !keep.has(k)).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Data from Quran.com: network-first, cache fallback (works offline for seen verses)
  if (url.hostname === "api.quran.com") {
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(API_CACHE).then((c) => c.put(req, copy));
          }
          return res;
        })
        .catch(() => caches.match(req))
    );
    return;
  }

  // Same-origin requests
  if (url.origin === self.location.origin) {
    // Page navigations: network-first (always get the latest HTML when online;
    // fall back to cache when offline)
    if (req.mode === "navigate") {
      event.respondWith(
        fetch(req)
          .then((res) => {
            const copy = res.clone();
            caches.open(SHELL_CACHE).then((c) => c.put(req, copy));
            return res;
          })
          .catch(() =>
            caches.match(req).then((m) => m || caches.match("./index.html"))
          )
      );
      return;
    }

    // Everything else (CSS/JS/icons): network-first so pushed updates apply
    // on the very next open; falls back to cache when offline.
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (res && res.ok) {
            const copy = res.clone();
            caches.open(SHELL_CACHE).then((c) => c.put(req, copy).catch(() => {}));
          }
          return res;
        })
        .catch(() =>
          caches.open(SHELL_CACHE).then((cache) => cache.match(req))
        )
    );
    return;
  }

  // Everything else (links out, etc.) — pass through
  return;
});