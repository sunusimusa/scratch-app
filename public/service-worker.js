/* =====================================================
   SERVICE WORKER – SCRATCH GAME (FINAL)
   FIX SOUND • FIX CACHE • PWA SAFE
===================================================== */

const CACHE_NAME = "scratch-game-v1";

/* FILES TO CACHE */
const ASSETS = [
  "/",
  "/index.html",
  "/style.css",
  "/index.js",
  "/script.js",

  /* 🔊 SOUNDS */
  "/sounds/click.mp3",
  "/sounds/win.mp3",
  "/sounds/lose.mp3",
  "/sounds/error.mp3"
];

/* ================= INSTALL ================= */
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

/* ================= ACTIVATE ================= */
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      )
    )
  );
  self.clients.claim();
});

/* ================= FETCH ================= */
self.addEventListener("fetch", event => {
  const req = event.request;

  /* 🚫 DON'T CACHE API */
  if (req.url.includes("/api/")) {
    return;
  }

  event.respondWith(
    caches.match(req).then(cached => {
      return cached || fetch(req);
    })
  );
});
