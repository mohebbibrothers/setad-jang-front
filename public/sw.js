/**
 * Cache-buster service worker (v2).
 *
 * Purpose: force Chrome's PWA cache to invalidate on every deploy
 * AND notify open clients so they reload with the fresh shell.
 * This is what finally kills the "old screen flashes first" bug
 * on installed PWAs whose manifest was snapshotted at install.
 *
 *   • `install`  → skipWaiting() so the new SW never sits in
 *                  a "waiting" state behind the old one.
 *   • `activate` → purge every cache namespace (kills stale
 *                  shell/icon HTTP responses) AND clients.claim()
 *                  so open PWA windows switch to us immediately.
 *   • On activate we also broadcast 'SW_ACTIVATED' to every
 *     controlled client — the page listens (see layout.tsx) and
 *     reloads once, so the freshly-updated shell renders instead
 *     of the stale one Chrome had shown from cache.
 *
 * No fetch handler: we never want to serve cached responses.
 * The app is Next.js SSR/ISR and the network is the source of
 * truth for every request.
 */
const SW_VERSION = 'v2-2026-08-09';

self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    // 1. Nuke every existing cache namespace.
    const keys = await caches.keys();
    await Promise.all(keys.map((k) => caches.delete(k)));
    // 2. Take control of open PWA windows without waiting for
    //    the next navigation.
    await self.clients.claim();
    // 3. Tell every controlled client to reload once so they
    //    render the fresh shell (with the new manifest, new
    //    icons, new splash overlay) instead of whatever Chrome
    //    had cached from install-time.
    const clientList = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const client of clientList) {
      client.postMessage({ type: 'SW_ACTIVATED', version: SW_VERSION });
    }
  })());
});
