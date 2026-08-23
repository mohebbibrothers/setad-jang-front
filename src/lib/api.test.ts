/**
 * تست‌های کلاینت API — تمرکز روی قراردادهایی که شکستنشان بی‌صداست:
 * باز کردن پاکت، تبدیل خطا به ApiError، و چرخه‌ی refresh روی ۴۰۱.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { apiFetch, safeApiFetch, ApiError, isApiError, firstErrorMessage } from './api';

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

const envelope = (data: unknown) => ({
  success: true,
  status_code: 200,
  message: 'ok',
  data,
});

describe('apiFetch', () => {
  const originalFetch = globalThis.fetch;
  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('پاکت را باز می‌کند و مستقیم data را برمی‌گرداند', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => jsonResponse(envelope({ id: 7 }))),
    );
    await expect(apiFetch('/health/', { skipAuth: true })).resolves.toEqual({ id: 7 });
  });

  it('اسلش ابتدایی نداشتن مسیر را جبران می‌کند', async () => {
    const fetchMock = vi.fn(async (_url: RequestInfo | URL, _init?: RequestInit) =>
      jsonResponse(envelope(null)),
    );
    vi.stubGlobal('fetch', fetchMock);
    await apiFetch('health/', { skipAuth: true });
    expect(String(fetchMock.mock.calls[0][0])).toMatch(/\/health\/$/);
  });

  it('پاسخ ناموفق را به ApiError با پیام سرور تبدیل می‌کند', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        jsonResponse(
          { success: false, status_code: 400, message: 'کد نامعتبر است', errors: { code: ['x'] } },
          400,
        ),
      ),
    );

    const err = await apiFetch('/auth/login/otp/verify/', {
      method: 'POST',
      skipAuth: true,
    }).catch((e: unknown) => e);

    expect(isApiError(err)).toBe(true);
    expect((err as ApiError).status).toBe(400);
    expect((err as ApiError).message).toBe('کد نامعتبر است');
    expect((err as ApiError).errors).toEqual({ code: ['x'] });
  });

  it('پاسخ ۲۰۰ ولی success=false را هم خطا می‌شمارد', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => jsonResponse({ success: false, status_code: 200, message: 'نه' }, 200)),
    );
    await expect(apiFetch('/x/', { skipAuth: true })).rejects.toBeInstanceOf(ApiError);
  });

  it('خطای شبکه را به ApiError با status=0 تبدیل می‌کند', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new TypeError('Failed to fetch');
      }),
    );
    const err = await apiFetch('/x/', { skipAuth: true }).catch((e: unknown) => e);
    expect((err as ApiError).status).toBe(0);
  });

  it('روی FormData هدر Content-Type را ست نمی‌کند (مرز را مرورگر می‌سازد)', async () => {
    const fetchMock = vi.fn(async (_url: RequestInfo | URL, _init?: RequestInit) =>
      jsonResponse(envelope(null)),
    );
    vi.stubGlobal('fetch', fetchMock);

    const fd = new FormData();
    fd.append('file', new Blob(['x']), 'a.txt');
    await apiFetch('/upload/', { method: 'POST', body: fd, skipAuth: true });

    const headers = fetchMock.mock.calls[0][1]?.headers as Record<string, string>;
    expect(headers['Content-Type']).toBeUndefined();
  });

  it('روی بدنه‌ی JSON هدر Content-Type را ست می‌کند', async () => {
    const fetchMock = vi.fn(async (_url: RequestInfo | URL, _init?: RequestInit) =>
      jsonResponse(envelope(null)),
    );
    vi.stubGlobal('fetch', fetchMock);

    await apiFetch('/x/', { method: 'POST', body: JSON.stringify({ a: 1 }), skipAuth: true });

    const headers = fetchMock.mock.calls[0][1]?.headers as Record<string, string>;
    expect(headers['Content-Type']).toBe('application/json');
  });
});

describe('safeApiFetch', () => {
  const originalFetch = globalThis.fetch;
  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('به‌جای throw، روی خطا null می‌دهد تا SSR کل صفحه را پایین نیاورد', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => jsonResponse({ success: false, message: 'x' }, 500)),
    );
    await expect(safeApiFetch('/x/', { skipAuth: true })).resolves.toBeNull();
  });
});

describe('firstErrorMessage', () => {
  it('اولین پیام میدانی را از errors بیرون می‌کشد', () => {
    const err = new ApiError('کلی', 400, { identifier: ['شناسه نامعتبر است'] });
    expect(firstErrorMessage(err)).toBe('شناسه نامعتبر است');
  });

  it('برای ورودی غیرخطا null می‌دهد', () => {
    expect(firstErrorMessage('nope')).toBeNull();
  });
});

describe('چرخه‌ی refresh روی ۴۰۱', () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });

  it('پس از ۴۰۱ یک بار refresh می‌زند و درخواست را دوباره می‌فرستد', async () => {
    const { setTokens } = await import('./auth-tokens');
    setTokens({ access: 'old-access', refresh: 'refresh-1', persist: true });

    let call = 0;
    const fetchMock = vi.fn(async (url: RequestInfo | URL) => {
      const u = String(url);
      if (u.includes('/auth/token/refresh/')) {
        return jsonResponse(envelope({ access: 'new-access', refresh: 'refresh-2' }));
      }
      call += 1;
      return call === 1
        ? jsonResponse({ success: false, message: 'expired' }, 401)
        : jsonResponse(envelope({ ok: true }));
    });
    vi.stubGlobal('fetch', fetchMock);

    await expect(apiFetch('/auth/me/')).resolves.toEqual({ ok: true });

    const urls = fetchMock.mock.calls.map((c) => String(c[0]));
    expect(urls.filter((u) => u.includes('/auth/token/refresh/'))).toHaveLength(1);
    expect(urls.filter((u) => u.includes('/auth/me/'))).toHaveLength(2);
  });

  it('اگر refresh شکست بخورد، توکن‌ها پاک می‌شوند و خطا بالا می‌آید', async () => {
    const { setTokens, getAccessToken } = await import('./auth-tokens');
    setTokens({ access: 'old', refresh: 'bad', persist: true });

    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: RequestInfo | URL) =>
        String(url).includes('/auth/token/refresh/')
          ? jsonResponse({ success: false, message: 'invalid' }, 401)
          : jsonResponse({ success: false, message: 'expired' }, 401),
      ),
    );

    await expect(apiFetch('/auth/me/')).rejects.toBeInstanceOf(ApiError);
    expect(getAccessToken()).toBeNull();
  });
});
