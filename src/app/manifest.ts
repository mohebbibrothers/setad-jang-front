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
    // ── name / short_name strategy ─────────────────────────────
    //
    // Android launcher uses `short_name` (falling back to `name`)
    // as the label rendered UNDER the home-screen icon. If we
    // send an empty / ZWSP string here, the launcher shows the
    // icon with NO caption at all — which is exactly the
    // "the label disappeared" bug the client just reported. So
    // `short_name` must always be a real, human-readable label.
    //
    // Chrome's PWA launch splash ALSO renders the short_name
    // (in a system default font that looks poor for Persian).
    // We can't have both — we CAN'T remove the ugly splash text
    // without also removing the home-screen label. Since a
    // labelless icon is far worse UX than a slightly-imperfect
    // splash caption, we go back to a proper short_name and
    // rely on our own <div id="app-splash"> Vazirmatn overlay
    // to cover Chrome's native splash the instant HTML streams.
    name: siteConfig.name, // «بعثت مردم» — installer + a11y
    short_name: 'بعثت', // home-screen icon caption + Chrome splash label
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
      { src: '/favicon.ico', sizes: '48x48', type: 'image/x-icon', purpose: 'any' },
      { src: '/favicon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/favicon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      // Maskable icons carry a WHITE safe-zone ground so
      // launcher masks never paint transparent pixels black.
      {
        src: '/favicon-maskable-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/favicon-maskable-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
      { src: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png', purpose: 'any' },
    ],
  };
}
