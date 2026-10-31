import type { NextRequest } from 'next/server';

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * /api/proxy/[...path] — پراکسیِ هم‌دامنه به DRF (جایگزینِ rewrite)
 *
 * چرا Route Handler و نه `rewrites()`؟
 * ------------------------------------
 * rewriteِ قبلی دو باگِ خاموشِ زنجیره‌ای داشت:
 *
 *  ۱) **اسلشِ پایانی**: Next در نرمال‌سازیِ مسیر، `/x/` را به `/x` می‌برد و
 *     `:path*` همین بی‌اسلش را به جنگو می‌داد. Django (APPEND_SLASH) پاسخِ
 *     ۳۰۱ با `Location: /api/v1/...` می‌داد؛ مرورگر آن Location نسبی را روی
 *     **دامنهٔ فرانت** دنبال می‌کرد و به ۴۰۴ می‌رسید. علتِ واقعیِ «فیلترِ شهر
 *     خالی می‌ماند / گاهی جزئیاتِ آگهی نمی‌آمد» همین بود.
 *  ۲) **کوئری و متد**: rewrite فقط GET را خوب پوشش می‌داد و کوئری را به
 *     destination نمی‌چسباند.
 *
 * این handler:
 *  • مسیر را با اسلشِ پایانی به DRF می‌فرستد (قراردادِ پروژه: هر مسیر `/`)،
 *  • `search` را عیناً حفظ می‌کند،
 *  • متدهای GET/POST/PATCH/DELETE را با بدنه و هدرهای لازم عبور می‌دهد،
 *  • `Cache-Control` و `Content-Type` بالادست را برمی‌گرداند تا کشِ مرورگر
 *    همان سیاستِ بک‌اند بماند،
 *  • هرگز آدرسِ دیگری جز `NEXT_PUBLIC_API_URL` را صدا نمی‌زند (بدون open proxy).
 * ═══════════════════════════════════════════════════════════════════════════
 */

/** هدرهایی که باید به بالادست بروند (بقیه بی‌معنا یا خطرناک‌اند). */
const FORWARD_REQUEST_HEADERS = [
  'authorization',
  'content-type',
  'accept',
  'accept-language',
  'x-requested-with',
  'cookie',
] as const;

/** هدرهایی که از بالادست باید به مرورگر برگردند. */
const FORWARD_RESPONSE_HEADERS = [
  'content-type',
  'cache-control',
  'etag',
  'last-modified',
  'vary',
  'retry-after',
] as const;

function upstreamBase(): string {
  const raw = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000').replace(/\/+$/, '');
  return `${raw}/api/v1`;
}

/** مسیرِ قابلِ‌اعتماد: بدونِ `..`، بدونِ پروتکل، همیشه با اسلشِ پایانی. */
function buildUpstreamUrl(request: NextRequest, segments: string[]): string {
  const clean = segments.filter((s) => s !== '' && s !== '.' && s !== '..');
  const path = clean.join('/');
  const withSlash = path.endsWith('/') ? path : `${path}/`;
  const query = request.nextUrl.searchParams.toString();
  return `${upstreamBase()}/${withSlash}${query ? `?${query}` : ''}`;
}

async function forward(request: NextRequest, segments: string[]): Promise<Response> {
  const url = buildUpstreamUrl(request, segments);

  const headers = new Headers();
  for (const name of FORWARD_REQUEST_HEADERS) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }

  const method = request.method.toUpperCase();
  const hasBody = method !== 'GET' && method !== 'HEAD';

  let body: ArrayBuffer | undefined;
  if (hasBody) {
    body = await request.arrayBuffer();
  }

  let upstream: Response;
  try {
    upstream = await fetch(url, {
      method,
      headers,
      body,
      // پاسخ‌ها کشِ خودِ Next نمی‌شوند؛ سیاستِ کش بک‌اند با هدر منتقل می‌شود.
      cache: 'no-store',
      redirect: 'manual',
    });
  } catch {
    return Response.json(
      { success: false, status_code: 502, message: 'ارتباط با سامانه برقرار نشد.', data: null },
      { status: 502 },
    );
  }

  /* اگر بالادست بازهم ۳۰۱/۳۰۸ به مسیرِ خودش داد (مثلاً اسلش کم بود)، یک‌بار
     با همان Location روی دامنهٔ بک‌اند دوباره تلاش می‌کنیم تا مرورگر
     هرگز به مسیرِ `/api/v1/...` روی دامنهٔ فرانت نرود. */
  if ((upstream.status === 301 || upstream.status === 308) && upstream.headers.get('location')) {
    const location = upstream.headers.get('location') || '';
    const absolute = new URL(location, url).toString();
    try {
      upstream = await fetch(absolute, { method, headers, body, cache: 'no-store' });
    } catch {
      /* اگر تلاشِ دوم هم شکست خورد، همان پاسخِ اول را برمی‌گردانیم. */
    }
  }

  const payload = await upstream.arrayBuffer();
  const outHeaders = new Headers();
  for (const name of FORWARD_RESPONSE_HEADERS) {
    const value = upstream.headers.get(name);
    if (value) outHeaders.set(name, value);
  }
  if (!outHeaders.has('cache-control')) {
    /* پیش‌فرضِ محافظه‌کارانه: داده‌های عمومیِ تخته تا ۳۰ ثانیه در مرورگر. */
    outHeaders.set('cache-control', 'public, max-age=30');
  }

  return new Response(payload, { status: upstream.status, headers: outHeaders });
}

type Ctx = { params: Promise<{ path?: string[] }> };

async function handler(request: NextRequest, ctx: Ctx): Promise<Response> {
  const { path } = await ctx.params;
  return forward(request, path ?? []);
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
export const HEAD = handler;
