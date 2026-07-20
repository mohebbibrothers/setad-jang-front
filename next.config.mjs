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
      { protocol: 'https', hostname: 'setadjang.ir',    pathname: '/**' },
      { protocol: 'https', hostname: 'www.setadjang.ir', pathname: '/**' },
      { protocol: 'https', hostname: 'api.setadjang.ir', pathname: '/**' },
      // Local dev — cover the common ports both frontend + backend run on
      { protocol: 'http',  hostname: 'localhost',   port: '',      pathname: '/**' },
      { protocol: 'http',  hostname: 'localhost',   port: '8000',  pathname: '/**' },
      { protocol: 'http',  hostname: 'localhost',   port: '3000',  pathname: '/**' },
      { protocol: 'http',  hostname: '127.0.0.1',   port: '',      pathname: '/**' },
      { protocol: 'http',  hostname: '127.0.0.1',   port: '8000',  pathname: '/**' },
      { protocol: 'http',  hostname: '127.0.0.1',   port: '3000',  pathname: '/**' },
      // Staging demo — backend runs on :18080, front on :3000
      { protocol: 'http',  hostname: '188.253.2.86', port: '18080', pathname: '/**' },
      { protocol: 'http',  hostname: '188.253.2.86', port: '3000',  pathname: '/**' },
      { protocol: 'http',  hostname: '188.253.2.86', port: '',      pathname: '/**' },
      // External Tabyin / Mohtavanegar media hosts (some tabyin
      // attachments are hosted on the source CDN, not the platform)
      { protocol: 'https', hostname: 'app-service.armansky.ir', pathname: '/**' },
      { protocol: 'https', hostname: 'app-media.armansky.ir',   pathname: '/**' },
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
          { key: 'X-Frame-Options',          value: 'SAMEORIGIN' },
          { key: 'X-Content-Type-Options',   value: 'nosniff' },
          { key: 'Referrer-Policy',          value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy',       value: 'camera=(), microphone=(), geolocation=(self)' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
        ],
      },
    ];
  },
  async rewrites() {
    // Same-origin proxy — browser calls /api/proxy/xxx, Next server
    // forwards to <NEXT_PUBLIC_API_URL>/api/v1/xxx. Bypasses CORS and
    // gives the client a stable path even if the backend host changes.
    return [
      {
        source: '/api/proxy/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/:path*/`,
      },
    ];
  },
};

export default nextConfig;
