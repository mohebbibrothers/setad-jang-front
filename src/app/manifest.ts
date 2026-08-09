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
    // ── The `name` / `short_name` game ─────────────────────────
    //
    // Chrome (Android) renders the PWA launch splash as:
    //   [ maskable icon ]
    //   [ short_name text  in system default font ]
    //
    // The system default font is NOT Vazirmatn — it's whatever
    // the OEM ships (MI Sans on Xiaomi, Roboto on Pixel), and it
    // paints Persian glyphs poorly at the tiny splash size. Since
    // we can't inject a custom font into Chrome's native splash,
    // the pragmatic fix is to give it NOTHING to paint: a single
    // U+200B (zero-width space) reads as "empty text" so Chrome
    // draws no label at all, and our own <div id="app-splash">
    // takes over the moment the HTML starts to stream. Result:
    // a clean icon-only Chrome splash → seamless handoff to the
    // Vazirmatn overlay with the proper "بعثت مردم" + soft slogan.
    //
    // The full brand name is still preserved in `name` (accessibility
    // tools, installer flow, notification titles).
    name: siteConfig.name,          // «بعثت مردم» — accessibility + installer
    short_name: '\u200B',           // ZWSP → Chrome native splash label is blank
    description: siteConfig.description,
    start_url: '/',
    display: 'standalone',
    display_override: ['standalone', 'minimal-ui'],
    categories: ['social', 'utilities', 'news'],
    scope: '/',
    background_color: '#FFFFFF',
    theme_color: siteConfig.themeColor,
    orientation: 'portrait',
    dir: 'rtl',
    lang: 'fa-IR',
    icons: [
      { src: '/favicon.ico',     sizes: '48x48',   type: 'image/x-icon',  purpose: 'any' },
      { src: '/favicon-192.png', sizes: '192x192', type: 'image/png',     purpose: 'any' },
      { src: '/favicon-512.png', sizes: '512x512', type: 'image/png',     purpose: 'any' },
      // Maskable icons carry a WHITE safe-zone ground so
      // launcher masks never paint transparent pixels black.
      { src: '/favicon-maskable-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
      { src: '/favicon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      { src: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png', purpose: 'any' },
    ],
  };
}
