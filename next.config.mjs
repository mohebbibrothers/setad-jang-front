/** @type {import('next').NextConfig} */

/**
 * Build an `images.remotePatterns` entry from NEXT_PUBLIC_API_URL so
 * `next/image` can render remote uploads (campaign covers, criminal
 * photos, LMS media, kindness images, tabyin attachments) from ANY
 * backend host — local dev, the staging server at
 * http://188.253.2.86:18080, or the production api.setadjang.ir
 * subdomain — without hand-editing this file.
 *
 * IMPORTANT — Next.js only allows a remote host through when the
 * pattern's `port` matches the URL's port exactly. Omitting `port`
 * implicitly matches the protocol's DEFAULT port (80 for http, 443 for
 * https). The staging backend runs on :18080, so we MUST forward the
 * explicit port from the env var; otherwise every campaign cover / R4J
 * photo / kindness image silently 400s and the gallery looks broken.
 */
function apiHostPattern() {
  const raw = process.env.NEXT_PUBLIC_API_URL;
  if (!raw) return null;
  try {
    const u = new URL(raw);
    return {
      protocol: u.protocol.replace(':', ''),
      hostname: u.hostname,
      port: u.port || '',
      pathname: '/**',
    };
  } catch {
    return null;
  }
}

const dynamicApiPattern = apiHostPattern();

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  images: {
    formats: ['image/avif', 'image/webp'],
    // A `dangerouslyAllowSVG` is intentionally NOT enabled — user-uploaded
    // media on the platform is limited to jpg / jpeg / png / webp by the
    // backend validators (apps.core.validators::validate_image_extension).
    remotePatterns: [
      // Production domains (any subdomain of setadjang.ir over HTTPS)
      { protocol: 'https', hostname: 'setadjang.ir', pathname: '/**' },
      { protocol: 'https', hostname: 'www.setadjang.ir', pathname: '/**' },
      { protocol: 'https', hostname: 'api.setadjang.ir', pathname: '/**' },
      // Production brand domains. `apiUrl` در src/lib/site.ts پیش‌فرض
      // https://besat.me است و DRF آدرسِ مدیا را نسبی برمی‌گرداند
      // (`/media/...`) که با absoluteMediaUrl به همین هاست تبدیل می‌شود؛
      // اگر این الگو نباشد، next/image در رندرِ سروری throw می‌کند و کل
      // صفحه به error boundary می‌افتد — دقیقاً همان وابستگیِ پنهان به
      // ست‌بودنِ NEXT_PUBLIC_API_URL که نباید وجود داشته باشد.
      { protocol: 'https', hostname: 'besat.me', pathname: '/**' },
      { protocol: 'https', hostname: 'www.besat.me', pathname: '/**' },
      { protocol: 'https', hostname: 'api.besat.me', pathname: '/**' },
      // Local dev — cover the common ports both frontend + backend run on
      { protocol: 'http', hostname: 'localhost', port: '', pathname: '/**' },
      { protocol: 'http', hostname: 'localhost', port: '8000', pathname: '/**' },
      { protocol: 'http', hostname: 'localhost', port: '3000', pathname: '/**' },
      { protocol: 'http', hostname: '127.0.0.1', port: '', pathname: '/**' },
      { protocol: 'http', hostname: '127.0.0.1', port: '8000', pathname: '/**' },
      { protocol: 'http', hostname: '127.0.0.1', port: '3000', pathname: '/**' },
      // Staging demo — backend runs on :18080, front on :3000
      { protocol: 'http', hostname: '188.253.2.86', port: '18080', pathname: '/**' },
      { protocol: 'http', hostname: '188.253.2.86', port: '3000', pathname: '/**' },
      { protocol: 'http', hostname: '188.253.2.86', port: '', pathname: '/**' },
      // External Tabyin / Mohtavanegar media hosts (some tabyin
      // attachments are hosted on the source CDN, not the platform)
      { protocol: 'https', hostname: 'app-service.armansky.ir', pathname: '/**' },
      { protocol: 'https', hostname: 'app-media.armansky.ir', pathname: '/**' },
      // Whatever host + port was injected via NEXT_PUBLIC_API_URL at
      // build time — keeps future environments zero-config.
      ...(dynamicApiPattern ? [dynamicApiPattern] : []),
    ],
  },
  experimental: {
    optimizePackageImports: ['lucide-react', 'framer-motion'],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(self)' },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
        ],
      },
    ];
  },
  async rewrites() {
    // Same-origin proxy — browser calls /api/proxy/xxx, Next server
    // forwards to <NEXT_PUBLIC_API_URL>/api/v1/xxx. Bypasses CORS and
    // gives the client a stable path even if the backend host changes.
    //
    // ─── The double-slash 404 bug (fixed here) ─────────────────────
    // Django requires a trailing slash on every registered route.
    // The old rewrite hard-coded that trailing slash INSIDE the
    // destination template (`/api/v1/:path*/`), while Next.js with
    // `trailingSlash: false` (our default) keeps whatever slash the
    // caller sent INSIDE `:path*`. Because every one of our client
    // paths already ends in `/`, the two slashes stacked into
    // `.../reports//` — which Nginx on besat.me rejects as 404.
    // The client-reported "Public Reports section broken" bug is
    // exactly this.
    //
    // Fix — the destination no longer appends its own trailing slash.
    // Every caller in src/lib/api.ts already sends a path ending in
    // `/` (that's the frontend contract), so the resulting URL is
    // exactly `.../<path>/` end-of-string. No double slash, no 404.
    return [
      // ─── پراکسیِ هم‌دامنه ──────────────────────────────────────────
      // مسیرِ `/api/proxy/*` دیگر rewrite نیست: یک **Route Handler** واقعی
      // است در `src/app/api/proxy/[...path]/route.ts`. دلیل: در Next،
      // rewriteهای afterFiles پیش از روت‌های داینامیک ارزیابی می‌شوند و
      // اسلشِ پایانی را می‌خورند؛ نتیجه زنجیرهٔ ۳۰۱ جنگو → ۴۰۴ روی دامنهٔ
      // فرانت بود. handler همان مسیر را با اسلش/کوئری/متدِ درست به DRF می‌دهد.
      // ─── «API پشت Vercel» (پراکسی کاملِ origin) ───────────────────
      // اگر API_UPSTREAM_URL ست شود، مرورگر فقط با همین دامنه
      // (besat.me) حرف می‌زند و سرور Next/Vercel درخواست‌های زیر را به
      // origin واقعی (مثلاً api.besat.me) پراکسی می‌کند. این برای
      // شبکه‌هایی است که دسترسی مستقیم‌شان به origin کند یا محدود
      // است؛ CORS را هم هم‌دامنه می‌کند. بدون API_UPSTREAM_URL هیچ
      // rewrite جدیدی فعال نمی‌شود (رفتار قبلی دست‌نخورده).
      // نکته: فرانت خودش در مسیرهای /api/* روت‌های محلی دارد؛ چون این
      // rewriteها بعد از فایل‌سیستم ارزیابی می‌شوند و هیچ روت محلی‌ای
      // در پیشوندهای زیر نیست (/api/v1 فقطِ بک‌اند است)، تداخلی رخ
      // نمی‌دهد.
      // ─── جنگِ اسلش: Vercel در برابر APPEND_SLASH جنگو ─────────────
      // لایه‌ی مسیردهی Vercel پیش‌فرضاً اسلشِ انتهایی را *قبل* از رسیدن
      // درخواست به rewriteها با 308 می‌تراشد (/admin/ → /admin). جنگو
      // دقیقاً برعکس است: مسیرِ بی‌اسلش را با 301 به نسخه‌ی اسلش‌دار برمی‌گرداند
      // (/admin → /admin/). نتیجه بدون اقدام: حلقه‌ی ابدیِ 308⇄301 تا ترکیدن
      // URL و 500 لبه‌ای origin — همان چیزی که روی پنل ادمین دیدیم.
      // راه‌حل: چون Vercel هر ورودی را «بدون اسلشِ آخر» به این rewriteها
      // می‌رساند، برای خانواده‌های endpointای جنگو (api/v1 و admin) اسلش
      // را این‌جا در *مقصد* دوباره می‌چسبانیم تا جنگو همیشه فرمِ نهایی‌اش
      // را ببیند و هیچ 301 بازگردانی رخ ندهد.
      // media و static عمداً بی‌اسلش می‌مانند: فایل‌ها هرگز اسلشِ آخر ندارند
      // که Vercel تراششان کند، و چسباندن اسلش به URLِ فایل یعنی 404.
      // نکته: این قراردادِ ترافیکِ production پشت Vercel است؛ ترافیکِ مستقیمِ
      // توسعه‌ی محلی (بدون تراشِ پلتفرم) از مسیر /api/proxy و api.ts عبور می‌کند.
      ...(process.env.API_UPSTREAM_URL
        ? [
            {
              source: '/api/v1/:path*',
              destination: `${process.env.API_UPSTREAM_URL}/api/v1/:path*/`,
            },
            {
              source: '/admin/:path*',
              destination: `${process.env.API_UPSTREAM_URL}/admin/:path*/`,
            },
            {
              source: '/media/:path*',
              destination: `${process.env.API_UPSTREAM_URL}/media/:path*`,
            },
            {
              source: '/static/:path*',
              destination: `${process.env.API_UPSTREAM_URL}/static/:path*`,
            },
          ]
        : []),
    ];
  },
};

export default nextConfig;
