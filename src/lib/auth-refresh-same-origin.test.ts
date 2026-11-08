/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  «خوش آمدید» و بعد خروجِ فوری — قراردادِ ضدِ رگرسیون
 *
 *  ریشهٔ باگ: `refreshAccessToken` آدرس را از `siteConfig.apiUrl` می‌ساخت،
 *  یعنی `https://api.besat.me/...`؛ در حالی‌که بقیهٔ درخواست‌های مرورگر از
 *  پروکسیِ هم‌دامنه (`/api/proxy/...`) می‌رفتند. با `CORS_ALLOWED_ORIGINS`
 *  خالی در production، آن preflight شکست می‌خورد → refresh «شکست» → تخلیهٔ
 *  توکن‌ها → کاربر همان لحظه بیرون می‌افتاد.
 *
 *  این تست سه چیز را پین می‌کند:
 *    1. آدرسِ refresh هرگز cross-origin نیست (همیشه نسبی/هم‌دامنه)
 *    2. شکستِ گذرا (شبکه/۵xx) نشست را پاک نمی‌کند
 *    3. شکستِ قطعی (۴۰۱) پاک می‌کند
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const API_HOST = 'https://api.besat.me';

function makeJwt(expSecondsFromNow: number, claims: Record<string, unknown> = {}): string {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = btoa(
    JSON.stringify({ exp: Math.floor(Date.now() / 1000) + expSecondsFromNow, ...claims }),
  );
  return `${header}.${payload}.signature`;
}

async function loadModules() {
  vi.resetModules();
  // مرورگر را شبیه‌سازی می‌کنیم: هاستِ صفحه besat.me و API روی زیردامنه
  Object.defineProperty(window, 'location', {
    writable: true,
    value: { origin: 'https://besat.me', host: 'besat.me', href: 'https://besat.me/' },
  });
  process.env.NEXT_PUBLIC_API_URL = API_HOST;
  const authTokens = await import('./auth-tokens');
  const api = await import('./api');
  return { authTokens, api };
}

describe('refresh goes through the same-origin proxy', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
    sessionStorage.clear();
  });

  afterEach(() => {
    delete process.env.NEXT_PUBLIC_API_URL;
    vi.restoreAllMocks();
  });

  it('never calls the API host directly from the browser', async () => {
    const { authTokens } = await loadModules();
    const calls: string[] = [];
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) => {
        calls.push(String(input));
        return new Response(JSON.stringify({ access: 'new-access', refresh: 'new-refresh' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }),
    );

    authTokens.setTokens({ access: makeJwt(60), refresh: makeJwt(3600), persist: true });
    const fresh = await authTokens.refreshAccessToken();

    expect(fresh).toBe('new-access');
    expect(calls).toHaveLength(1);
    const url = calls[0];
    expect(url.startsWith('https://api.besat.me')).toBe(false);
    expect(url).toContain('/auth/token/refresh/');
    expect(url.startsWith('/api/')).toBe(true);
  });

  it('keeps the session when the refresh fails with a transient error (5xx)', async () => {
    const { authTokens } = await loadModules();
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('upstream down', { status: 502 })),
    );

    authTokens.setTokens({ access: makeJwt(60), refresh: makeJwt(3600), persist: true });
    const fresh = await authTokens.refreshAccessToken();

    expect(fresh).toBeNull();
    expect(authTokens.lastRefreshFailureWasDefinitive()).toBe(false);
    // نشست باید سرِ جایش باشد
    expect(authTokens.getAccessToken()).not.toBeNull();
    expect(authTokens.getRefreshToken()).not.toBeNull();
  });

  it('keeps the session when the request throws (offline / CORS / DNS)', async () => {
    const { authTokens } = await loadModules();
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new TypeError('Failed to fetch');
      }),
    );

    authTokens.setTokens({ access: makeJwt(60), refresh: makeJwt(3600), persist: true });
    await authTokens.refreshAccessToken();

    expect(authTokens.lastRefreshFailureWasDefinitive()).toBe(false);
    expect(authTokens.getAccessToken()).not.toBeNull();
  });

  it('clears the session only on a definitive failure (401)', async () => {
    const { authTokens } = await loadModules();
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('{"detail":"invalid"}', { status: 401 })),
    );

    authTokens.setTokens({ access: makeJwt(60), refresh: makeJwt(3600), persist: true });
    await authTokens.refreshAccessToken();

    expect(authTokens.lastRefreshFailureWasDefinitive()).toBe(true);
    expect(authTokens.getAccessToken()).toBeNull();
    expect(authTokens.hasSession()).toBe(false);
  });
});

describe('dead tokens are dropped before they can cause a 401', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  afterEach(() => {
    delete process.env.NEXT_PUBLIC_API_URL;
  });

  it('detects an expired access token without any network call', async () => {
    const { authTokens } = await loadModules();
    authTokens.setTokens({ access: makeJwt(-600), refresh: makeJwt(3600), persist: true });
    expect(authTokens.isAccessTokenExpired()).toBe(true);
  });

  it('does NOT delete a token it cannot parse (the server decides)', async () => {
    const { authTokens } = await loadModules();
    authTokens.setTokens({ access: 'not-a-jwt', refresh: makeJwt(3600), persist: true });
    // «نمی‌دانم» با «منقضی» یکی نیست: پاک‌کردنِ کورکورانه = بیرون‌انداختنِ بی‌دلیل
    expect(authTokens.isAccessTokenExpired()).toBe(false);
    expect(authTokens.dropDeadTokens()).toBe(true);
    expect(authTokens.getAccessToken()).toBe('not-a-jwt');
  });

  it('keeps a valid session alive', async () => {
    const { authTokens } = await loadModules();
    authTokens.setTokens({ access: makeJwt(600), refresh: makeJwt(3600), persist: true });
    expect(authTokens.isAccessTokenExpired()).toBe(false);
    expect(authTokens.dropDeadTokens()).toBe(true);
    expect(authTokens.getAccessToken()).not.toBeNull();
  });

  it('clears the session when the refresh token is dead too', async () => {
    const { authTokens } = await loadModules();
    authTokens.setTokens({ access: makeJwt(-600), refresh: makeJwt(-60), persist: true });
    expect(authTokens.dropDeadTokens()).toBe(false);
    expect(authTokens.hasSession()).toBe(false);
  });
});
