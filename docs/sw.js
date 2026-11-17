// Offline-Speicher: legt alle Dateien beim ersten Besuch ab.
// Bei Änderungen an der App die Versionsnummer erhöhen.
const CACHE = "valcompanion-v64";
const FILES = [
  "./",
  "index.html",
  "manifest.webmanifest",
  "css/app.css",
  "js/i18n.js",
  "js/core.js",
  "js/dice.js",
  "js/build.js",
  "js/online.js",
  "js/achievements.js",
  "js/ui.js",
  "js/main.js",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "fonts/averia-serif-libre-latin-400-normal.woff2",
  "fonts/averia-serif-libre-latin-700-normal.woff2",
  "fonts/averia-serif-libre-latin-400-italic.woff2",
  "fonts/germania-one-latin-400-normal.woff2",
  "img/wood.jpg",
  "img/panel.png",
];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Erst das Netz fragen (für Updates), sonst den Offline-Speicher nehmen.
self.addEventListener("fetch", e => {
  // Nur eigene Dateien der App offline speichern. Anfragen an Firebase, Google usw. gehen unverändert ins Netz.
  if (e.request.method !== "GET" || new URL(e.request.url).origin !== self.location.origin) return;
  e.respondWith(
    fetch(e.request)
      .then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy));
        return res;
      })
      .catch(() => caches.match(e.request).then(r => r || caches.match("index.html")))
  );
});
