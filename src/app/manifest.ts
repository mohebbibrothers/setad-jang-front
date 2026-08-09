import type { MetadataRoute } from 'next';
import { siteConfig } from '@/lib/site';

/**
 * PWA manifest.
 *
 *  ── Icon strategy ─────────────────────────────────────────────
 *  Android's "Add to Home Screen" installer chooses ONE maskable
 *  icon and crops it to whatever launcher shape the device uses —
 *  circle on Pixels, squircle on Samsung, rounded-square on
 *  Xiaomi, and so on. If the maskable icon is a transparent PNG
 *  the launcher fills the transparent pixels with SOLID BLACK,
 *  which is exactly the "black background around the logo" bug
 *  we were seeing on the client's Xiaomi phone.
 *
 *  Fix: ship dedicated `favicon-maskable-{192,512}.png` assets
 *  that carry the logo INSIDE the 65% central safe zone on a
 *  full-opaque white ground. Every launcher mask then crops
 *  cleanly to white behind the logo — never black.
 *
 *  ── Splash screen strategy ────────────────────────────────────
 *  Chrome on Android generates the PWA splash screen from
 *  `background_color`, the largest maskable icon, and
 *  `theme_color`. Making the background WHITE (matching the icon
 *  ground) means the launch splash reads as a single continuous
 *  card — the icon fades in on its own colour instead of a hard
 *  black-to-white flash.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: siteConfig.name,
    short_name: siteConfig.shortName,
    description: siteConfig.description,
    start_url: '/',
    // display_override lets modern Chrome show a chrome-less
    // launch experience while gracefully falling back to
    // standalone on older browsers. `window-controls-overlay`
    // in particular tells desktop PWAs to draw over the title
    // bar area — irrelevant on Android but harmless.
    display: 'standalone',
    display_override: ['standalone', 'minimal-ui'],
    // categories help app-store crawlers and Chrome's app menu
    // classify the PWA correctly under "Social" / "Utilities".
    categories: ['social', 'utilities', 'news'],
    // scope keeps the PWA from navigating out to arbitrary URLs
    // after install — clicks that leave `/` open in the system
    // browser as expected.
    scope: '/',
    // WHITE, not the previous brand teal: matches the maskable
    // icon's white safe-zone ground so the launch splash reads
    // as a single continuous card behind the logo.
    background_color: '#FFFFFF',
    theme_color: siteConfig.themeColor,
    orientation: 'portrait',
    dir: 'rtl',
    lang: 'fa-IR',
    icons: [
      { src: '/favicon.ico',     sizes: '48x48',   type: 'image/x-icon',  purpose: 'any' },
      // "any" — used for browser tabs / bookmarks / notifications.
      { src: '/favicon-192.png', sizes: '192x192', type: 'image/png',     purpose: 'any' },
      { src: '/favicon-512.png', sizes: '512x512', type: 'image/png',     purpose: 'any' },
      // "maskable" — the launcher will CROP these to its native
      // shape, so they carry a white safe-zone ground and place
      // the logo in the central 65% square.
      { src: '/favicon-maskable-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
      { src: '/favicon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      { src: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png', purpose: 'any' },
    ],
  };
}
