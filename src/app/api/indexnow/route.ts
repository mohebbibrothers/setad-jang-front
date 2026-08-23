import { NextRequest, NextResponse } from 'next/server';
import { siteConfig } from '@/lib/site';

export const dynamic = 'force-dynamic';

/**
 * IndexNow submission endpoint.
 *
 * IndexNow is a lightweight open protocol (adopted by Bing, Yandex,
 * Naver, Seznam, Yep, and mirrored to a growing list of engines) that
 * lets a site notify search engines the INSTANT its content changes —
 * no more waiting weeks for the next crawl. Google does NOT officially
 * consume IndexNow yet, but Bing forwards a lot of its signals to
 * Google's crawler as a hint, so it still helps discovery.
 *
 * PROTOCOL
 * ────────
 *   POST https://api.indexnow.org/IndexNow
 *   Content-Type: application/json
 *   { host, key, keyLocation, urlList }
 *
 * VERIFICATION
 *   The engine fetches `https://besat.me/<key>.txt` and expects the
 *   file body to equal `<key>` verbatim. We ship that file in
 *   `public/ff3bdd090c13ad9f12a916c874a67d37.txt`.
 *
 * USAGE
 *   Call this route AFTER every meaningful content change:
 *     POST /api/indexnow
 *     { "urls": ["/", "/tabyin"] }         ← optional, defaults to the
 *                                            three homepage-milestone URLs.
 *   Optional bearer secret via env `INDEXNOW_SECRET`; if unset the route
 *   is open (safe because IndexNow itself is idempotent and rate-limited
 *   on the engine side).
 */

const INDEXNOW_KEY = 'ff3bdd090c13ad9f12a916c874a67d37';
const INDEXNOW_ENDPOINT = 'https://api.indexnow.org/IndexNow';
const MAX_URLS = 10_000; // per IndexNow spec

function hostFromSiteUrl(): string {
  try {
    return new URL(siteConfig.url).host;
  } catch {
    return 'besat.me';
  }
}

async function submit(urls: string[]) {
  const host = hostFromSiteUrl();
  const base = siteConfig.url.replace(/\/+$/, '');
  const absoluteUrls = urls
    .filter((u) => typeof u === 'string' && u.length > 0)
    .map((u) => (u.startsWith('http') ? u : `${base}${u.startsWith('/') ? '' : '/'}${u}`))
    .slice(0, MAX_URLS);

  const body = {
    host,
    key: INDEXNOW_KEY,
    keyLocation: `${base}/${INDEXNOW_KEY}.txt`,
    urlList: absoluteUrls,
  };

  const res = await fetch(INDEXNOW_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify(body),
    // No cache — this is a one-shot notification.
    cache: 'no-store',
  });

  return { status: res.status, ok: res.ok, submitted: absoluteUrls };
}

export async function GET() {
  // Default: notify the homepage + Tabyin index + Tabyin new form.
  // Anyone can hit this once after deploy — engines dedupe.
  const result = await submit(['/', '/about-besat', '/tabyin']);
  return NextResponse.json({ success: result.ok, ...result });
}

export async function POST(request: NextRequest) {
  const requiredSecret = process.env.INDEXNOW_SECRET || '';
  if (requiredSecret) {
    const auth = request.headers.get('authorization') || '';
    const bearer = auth.toLowerCase().startsWith('bearer ') ? auth.slice(7) : '';
    if (bearer !== requiredSecret) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }
  }

  let payload: { urls?: string[] } = {};
  try {
    payload = (await request.json()) as { urls?: string[] };
  } catch {
    /* empty body is fine — falls through to defaults */
  }

  const urls = Array.isArray(payload.urls) && payload.urls.length
    ? payload.urls
    : ['/', '/about-besat', '/tabyin'];

  const result = await submit(urls);
  return NextResponse.json({ success: result.ok, ...result });
}
