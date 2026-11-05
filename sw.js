// Vocabulario: erst Netz, bei fehlendem Netz die gespeicherte Version
const CACHE = "vocabulario-v1";
const DATEIEN = ["./", "./index.html", "./manifest.json", "./icon-192.png", "./icon-512.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(DATEIEN)).catch(() => {}));
  self.skipWaiting();
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener("fetch", (e) => {
  const r = e.request;
  if (r.method !== "GET" || new URL(r.url).origin !== self.location.origin) return;
  e.respondWith(
    fetch(r).then((res) => {
      const kopie = res.clone();
      caches.open(CACHE).then((c) => c.put(r, kopie));
      return res;
    }).catch(() => caches.match(r).then((m) => m || caches.match("./index.html")))
  );
});
