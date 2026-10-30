// Offline-Speicher: legt alle Dateien beim ersten Besuch ab.
// Bei Änderungen an der App die Versionsnummer erhöhen.
const CACHE = "valcompanion-v21";
const FILES = [
  "./",
  "index.html",
  "manifest.webmanifest",
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
  if (e.request.method !== "GET") return;
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
