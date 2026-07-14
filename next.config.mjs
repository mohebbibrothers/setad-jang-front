/** @type {import('next').NextConfig} */

/**
 * Pull the API host from NEXT_PUBLIC_API_URL so `next/image` can render
 * remote uploads (campaign covers, criminal photos, LMS media, kindness
 * images, tabyin attachments) from ANY backend host — local dev, the
 * staging server at http://188.253.2.86:18080, or the production
 * api.setadjang.ir subdomain — without touching this file.
 */
function apiHostPattern() {
  const raw = process.env.NEXT_PUBLIC_API_URL;
  if (!raw) return null;
  try {
    const u = new URL(raw);
    const pattern = {
      protocol: u.protocol.replace(':', ''),
      hostname: u.hostname,
    };
    if (u.port) pattern.port = u.port;
    return pattern;
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
    remotePatterns: [
      // Production domains
      { protocol: 'https', hostname: '**.setadjang.ir' },
      { protocol: 'https', hostname: 'api.setadjang.ir' },
      // Local dev
      { protocol: 'http', hostname: 'localhost' },
      { protocol: 'http', hostname: '127.0.0.1' },
      // Staging demo (http://188.253.2.86:18080)
      { protocol: 'http', hostname: '188.253.2.86' },
      // External Tabyin/Mohtavanegar media host
      { protocol: 'https', hostname: 'app-service.armansky.ir' },
      // Any host injected via NEXT_PUBLIC_API_URL at build time
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
