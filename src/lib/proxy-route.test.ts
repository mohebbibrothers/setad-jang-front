import { afterEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/proxy/[...path]/route';

/**
 * پراکسیِ هم‌دامنه — قراردادی که با باگِ خاموش شکسته شده بود:
 *   ۱) مسیر باید **با اسلشِ پایانی** به DRF برود (وگرنه جنگو ۳۰۱ می‌دهد و
 *      مرورگر Location را روی دامنهٔ فرانت دنبال می‌کند → ۴۰۴)؛
 *   ۲) کوئری باید دست‌نخورده بماند؛
 *   ۳) مقصد همیشه `NEXT_PUBLIC_API_URL` است (بدونِ open proxy).
 */

const fetchMock = vi.fn();

function call(url: string) {
  const req = new NextRequest(new URL(url, 'http://localhost:3100'));
  /* Next برای catch-all، قطعه‌های مسیر را در params.path می‌دهد. */
  const path = new URL(url, 'http://localhost:3100').pathname
    .replace(/^\/api\/proxy\/?/, '')
    .split('/')
    .filter(Boolean);
  return GET(req, { params: Promise.resolve({ path }) }) as Promise<Response>;
}

describe('/api/proxy/[...path]', () => {
  afterEach(() => {
    fetchMock.mockReset();
    vi.unstubAllGlobals();
  });

  it('مسیر را با اسلشِ پایانی و کوئری/صفر مینویسد', async () => {
    vi.stubGlobal('fetch', fetchMock);
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    );
    const res = await call('/api/proxy/geo/cities/?province=%D8%AA%D9%87%D8%B1%D8%A7%D9%86');
    const [calledUrl, init] = fetchMock.mock.calls[0];
    expect(String(calledUrl)).toContain('/api/v1/geo/cities/?province=');
    expect(String(calledUrl)).toMatch(/cities\/\?/); // اسلش پیش از «?»
    expect(init.method).toBe('GET');
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('application/json');
  });

  it('قطعیِ بالادست → ۵۰۲ با پیامِ فارسی (صفحه زنده می‌ماند)', async () => {
    vi.stubGlobal('fetch', fetchMock);
    fetchMock.mockRejectedValue(new TypeError('network down'));
    const res = await call('/api/proxy/kindness-wall/listings/?page_size=2');
    expect(res.status).toBe(502);
    const body = (await res.json()) as { message?: string };
    expect(body.message).toContain('ارتباط');
  });

  it('هدر کشِ بالادست حفظ می‌شود', async () => {
    vi.stubGlobal('fetch', fetchMock);
    fetchMock.mockResolvedValue(
      new Response('{}', {
        status: 200,
        headers: { 'content-type': 'application/json', 'cache-control': 'public, max-age=86400' },
      }),
    );
    const res = await call('/api/proxy/geo/provinces/');
    expect(res.headers.get('cache-control')).toContain('86400');
  });
});
