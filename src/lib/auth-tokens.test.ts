/**
 * تست‌های ذخیره‌ساز توکن.
 *
 * دو رفتار حساس اینجا قفل می‌شوند:
 *   • انتخاب localStorage در برابر sessionStorage بر اساس «مرا به خاطر بسپار»
 *   • single-flight بودن refresh (چند ۴۰۱ هم‌زمان فقط یک درخواست بزنند)
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  setTokens,
  getAccessToken,
  getRefreshToken,
  clearTokens,
  hasSession,
  refreshAccessToken,
  onAuthChange,
} from './auth-tokens';

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

describe('ذخیره‌سازی توکن', () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });

  it('با persist=true در localStorage می‌نویسد (ماندگار بین اجراهای مرورگر)', () => {
    setTokens({ access: 'a', refresh: 'r', persist: true });
    expect(getAccessToken()).toBe('a');
    expect(getRefreshToken()).toBe('r');
    expect(window.sessionStorage.length).toBe(0);
  });

  it('با persist=false در sessionStorage می‌نویسد (با بستن تب پاک می‌شود)', () => {
    setTokens({ access: 'a', refresh: 'r', persist: false });
    expect(getAccessToken()).toBe('a');
    // نباید ردی از توکن در localStorage بماند جز پرچم persist
    const leaked = Object.keys(window.localStorage).filter((k) => k.includes('access'));
    expect(leaked).toHaveLength(0);
  });

  it('hasSession وضعیت واقعی را گزارش می‌کند', () => {
    expect(hasSession()).toBe(false);
    setTokens({ access: 'a', refresh: 'r', persist: true });
    expect(hasSession()).toBe(true);
    clearTokens();
    expect(hasSession()).toBe(false);
  });

  it('clearTokens هر دو انبار را پاک می‌کند', () => {
    setTokens({ access: 'a', refresh: 'r', persist: true });
    clearTokens();
    expect(getAccessToken()).toBeNull();
    expect(getRefreshToken()).toBeNull();
  });

  it('شنونده‌ی تغییر احراز هویت صدا زده می‌شود و قابل لغو است', () => {
    const seen: unknown[] = [];
    const off = onAuthChange(() => seen.push(1));

    setTokens({ access: 'a', refresh: 'r', persist: true });
    expect(seen.length).toBeGreaterThan(0);

    const count = seen.length;
    off();
    clearTokens();
    expect(seen.length).toBe(count);
  });
});

describe('refreshAccessToken', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });
  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('بدون refresh token اصلاً درخواست نمی‌زند', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    await expect(refreshAccessToken()).resolves.toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('access جدید را ذخیره و برمی‌گرداند', async () => {
    setTokens({ access: 'old', refresh: 'r1', persist: true });
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        jsonResponse({
          success: true,
          status_code: 200,
          message: 'ok',
          data: { access: 'fresh', refresh: 'r2' },
        }),
      ),
    );

    await expect(refreshAccessToken()).resolves.toBe('fresh');
    expect(getAccessToken()).toBe('fresh');
  });

  it('single-flight است: چند فراخوانی هم‌زمان فقط یک درخواست شبکه می‌زنند', async () => {
    setTokens({ access: 'old', refresh: 'r1', persist: true });

    const fetchMock = vi.fn(
      async () =>
        new Promise<Response>((res) =>
          setTimeout(
            () =>
              res(
                jsonResponse({
                  success: true,
                  status_code: 200,
                  message: 'ok',
                  data: { access: 'fresh', refresh: 'r2' },
                }),
              ),
            10,
          ),
        ),
    );
    vi.stubGlobal('fetch', fetchMock);

    const results = await Promise.all([
      refreshAccessToken(),
      refreshAccessToken(),
      refreshAccessToken(),
    ]);

    expect(results).toEqual(['fresh', 'fresh', 'fresh']);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('روی ۴۰۱ (رد قطعی refresh) توکن‌ها را پاک می‌کند', async () => {
    setTokens({ access: 'old', refresh: 'bad', persist: true });
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => jsonResponse({ success: false }, 401)),
    );

    await expect(refreshAccessToken()).resolves.toBeNull();
    expect(getAccessToken()).toBeNull();
  });

  it('روی ۲۰۰ بدون access هم قطعی تلقی می‌شود و پاک می‌کند', async () => {
    setTokens({ access: 'old', refresh: 'r', persist: true });
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => jsonResponse({ success: true, status_code: 200, message: 'ok', data: {} })),
    );

    await expect(refreshAccessToken()).resolves.toBeNull();
    expect(getAccessToken()).toBeNull();
  });

  it('روی خطای شبکه، نشست را نگه می‌دارد (کاربر صرفاً آفلاین است)', async () => {
    setTokens({ access: 'old', refresh: 'r', persist: true });
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new TypeError('Failed to fetch');
      }),
    );

    await expect(refreshAccessToken()).resolves.toBeNull();
    expect(getAccessToken()).toBe('old');
  });

  it('روی ۵۰۳ (خطای گذرای سرور) هم نشست را نگه می‌دارد', async () => {
    setTokens({ access: 'old', refresh: 'r', persist: true });
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => jsonResponse({ success: false }, 503)),
    );

    await expect(refreshAccessToken()).resolves.toBeNull();
    expect(getAccessToken()).toBe('old');
  });
});
