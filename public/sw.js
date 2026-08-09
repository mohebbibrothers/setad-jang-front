/**
 * Minimal service worker.
 *
 * Purpose is INTENTIONALLY narrow: force Chrome's PWA cache to
 * invalidate on every new deploy so the freshly-installed app
 * doesn't flash the previous session's stale HTML/icons.
 *
 *   • `skipWaiting()` at install → the new SW replaces the old
 *     one immediately, never sits in a "waiting" state.
 *   • `clients.claim()` at activate → the new SW takes over
 *     open tabs on the very next navigation, no full reload
 *     required.
 *   • `activate` also purges every existing cache namespace so
 *     any previously-cached shell HTML / icon / JS bundle is
 *     evicted the instant the new SW activates.
 *
 * No offline shell, no runtime caching, no fetch handler — the
 * app is server-driven (Next.js SSR/ISR) and we don't want the
 * SW to serve stale content ever. If you later want offline
 * support, add a `fetch` handler with a network-first strategy
 * scoped to `/` and drop the wholesale cache purge below.
 */
self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});
