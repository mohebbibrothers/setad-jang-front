/**
 * ───────────────────────────────────────────────────────────────────────────
 *  JWT token store — client-only.
 *
 *  The Setad-Jang backend issues short-lived access tokens + long-lived
 *  refresh tokens (SimpleJWT). This module owns their in-browser
 *  persistence and exposes the primitives that `api.ts` needs to inject
 *  `Authorization: Bearer <access>` on every call and to transparently
 *  refresh on 401.
 *
 *  Storage
 *  ────────
 *   - `sessionStorage` when the user chooses "این دستگاه امن نیست"
 *   - `localStorage`   for the default "remember me" behaviour
 *
 *  The token values are NEVER logged and never sent anywhere except in
 *  the `Authorization` header of api.setadjang.ir calls.
 *
 *  Refresh single-flight
 *  ─────────────────────
 *  Multiple in-flight 401s share a single refresh promise so we only
 *  hit `/auth/token/refresh/` once per token-expiry event, even under
 *  concurrent parallel loaders (home page kicks 6 loaders in parallel).
 * ───────────────────────────────────────────────────────────────────────────
 */

import { browserApiUrl } from './api-base';

const KEY_ACCESS = 'sj.auth.access';
const KEY_REFRESH = 'sj.auth.refresh';
const KEY_PERSIST = 'sj.auth.persist';

export type TokenPair = {
  access: string;
  refresh: string;
  /** When true, tokens persist across browser restarts (localStorage). */
  persist?: boolean;
};

/* ───────────────────────────────────────────────────────────────────────── */
/*  Storage abstraction                                                       */
/* ───────────────────────────────────────────────────────────────────────── */

function safeGet(store: Storage | null, key: string): string | null {
  if (!store) return null;
  try {
    return store.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(store: Storage | null, key: string, value: string): void {
  if (!store) return;
  try {
    store.setItem(key, value);
  } catch {
    /* quota / private mode — silently drop */
  }
}

function safeRemove(store: Storage | null, key: string): void {
  if (!store) return;
  try {
    store.removeItem(key);
  } catch {
    /* no-op */
  }
}

function pickStore(persist: boolean): Storage | null {
  if (typeof window === 'undefined') return null;
  return persist ? window.localStorage : window.sessionStorage;
}

function currentPersist(): boolean {
  if (typeof window === 'undefined') return false;
  return safeGet(window.localStorage, KEY_PERSIST) === '1';
}

/* ───────────────────────────────────────────────────────────────────────── */
/*  Public API                                                                */
/* ───────────────────────────────────────────────────────────────────────── */

export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  const persist = currentPersist();
  return safeGet(pickStore(persist), KEY_ACCESS);
}

export function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  const persist = currentPersist();
  return safeGet(pickStore(persist), KEY_REFRESH);
}

export function setTokens(pair: TokenPair): void {
  if (typeof window === 'undefined') return;
  const persist = pair.persist !== false;
  const store = pickStore(persist);
  safeSet(store, KEY_ACCESS, pair.access);
  safeSet(store, KEY_REFRESH, pair.refresh);
  safeSet(window.localStorage, KEY_PERSIST, persist ? '1' : '0');
  // Clear the opposite store so a stale token can't shadow the fresh one
  const otherStore = pickStore(!persist);
  safeRemove(otherStore, KEY_ACCESS);
  safeRemove(otherStore, KEY_REFRESH);
  notifyListeners();
}

export function clearTokens(): void {
  if (typeof window === 'undefined') return;
  for (const store of [window.localStorage, window.sessionStorage]) {
    safeRemove(store, KEY_ACCESS);
    safeRemove(store, KEY_REFRESH);
  }
  safeRemove(window.localStorage, KEY_PERSIST);
  notifyListeners();
}

export function hasSession(): boolean {
  return getAccessToken() !== null;
}

/** بدنهٔ JWT بدونِ هیچ کتابخانه‌ای؛ `null` یعنی توکنِ بدشکل. */
function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const part = token.split('.')[1];
    if (!part) return null;
    const padded = part.replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(
      atob(padded.padEnd(padded.length + ((4 - (padded.length % 4)) % 4), '='))
        .split('')
        .map((c) => `%${c.charCodeAt(0).toString(16).padStart(2, '0')}`)
        .join(''),
    );
    const parsed = JSON.parse(json) as Record<string, unknown>;
    return typeof parsed === 'object' && parsed !== null ? parsed : null;
  } catch {
    return null;
  }
}

/**
 * آیا access token منقضی (یا غیرقابل‌خواندن) است؟
 *
 * چرا لازم است: اگر مرورگر یک توکنِ کهنه (مثلاً از قبل از مهاجرت سرور) داشته
 * باشد، اولین درخواست ۴۰۱ می‌گیرد و کلِ زنجیرهٔ refresh/clear راه می‌افتد.
 * با این تابع همان ابتدا توکنِ مرده دور ریخته می‌شود و کاربر به‌جای «بیرون
 * انداخته شدن»، یک وضعیتِ تمیزِ «وارد نشده» می‌بیند.
 *
 * `skewSeconds` برای اختلافِ ساعتِ مرورگر/سرور است (پیش‌فرض ۳۰ ثانیه).
 */
export function isAccessTokenExpired(skewSeconds = 30): boolean {
  const token = getAccessToken();
  if (!token) return true;
  const payload = decodeJwtPayload(token);
  const exp = payload?.exp;
  // «نمی‌دانم» ≠ «منقضی». توکنِ ناخوانا (فرمتِ دیگر، mock در تست) را پاک
  // نمی‌کنیم؛ تصمیمش با سرور است. حذفِ توکنی که درکش نمی‌کنیم، همان «بیرون
  // انداختنِ» بی‌دلیل است که می‌خواستیم حذف شود.
  if (typeof exp !== 'number') return false;
  return exp * 1000 <= Date.now() + skewSeconds * 1000;
}

/** توکن‌های مرده را قبل از هر درخواست دور می‌ریزد؛ خروجی: آیا نشستی باقی ماند. */
export function dropDeadTokens(): boolean {
  if (typeof window === 'undefined') return false;
  if (!getAccessToken() && !getRefreshToken()) return false;
  // اگر access منقضی است ولی refresh داریم، نشست را نگه می‌داریم: api.ts با
  // اولین ۴۰۱ خودش refresh می‌کند (که حالا از مسیرِ هم‌دامنه انجام می‌شود).
  if (!getRefreshToken()) {
    clearTokens();
    return false;
  }
  if (isAccessTokenExpired()) {
    const payload = decodeJwtPayload(getRefreshToken() as string);
    const exp = payload?.exp;
    // فقط وقتی پاک می‌کنیم که *قطعاً* بدانیم refresh هم مرده است.
    if (typeof exp === 'number' && exp * 1000 <= Date.now()) {
      clearTokens();
      return false;
    }
  }
  return true;
}

/* ───────────────────────────────────────────────────────────────────────── */
/*  Refresh — single-flight                                                   */
/* ───────────────────────────────────────────────────────────────────────── */

let inFlight: Promise<string | null> | null = null;

/**
 * نتیجهٔ آخرین تلاشِ refresh — مصرف‌کننده (`api.ts`) باید بداند «قطعی» بود یا
 * «گذرا». قبلاً هر شکستی (حتی قطعیِ شبکه) باعث `clearTokens()` می‌شد و همان
 * چیزی بود که کاربر را وسطِ کار بیرون می‌انداخت.
 */
type RefreshOutcome = 'ok' | 'definitive' | 'transient';
let lastOutcome: RefreshOutcome = 'ok';

/** آیا شکستِ آخری که رخ داد، شکستِ قطعی (توکن مرده) بود؟ */
export function lastRefreshFailureWasDefinitive(): boolean {
  return lastOutcome === 'definitive';
}

/**
 * Attempt to exchange the stored refresh token for a fresh access token.
 * Returns the new access token on success, or `null` if the refresh failed.
 *
 * Failure taxonomy — this distinction matters
 * ────────────────────────────────────────────
 *  • DEFINITIVE (401 / 403, or a 2xx that carries no `access`):
 *    the refresh token is dead. We purge the store immediately so that
 *    every other caller — `api.ts`, `useAuth`, a second tab — instantly
 *    sees a signed-out state instead of re-trying with a token that can
 *    never succeed again.
 *
 *  • TRANSIENT (network error, timeout, 5xx):
 *    the token is probably still valid and the user is merely offline or
 *    the backend is restarting. We keep the tokens so the session survives
 *    and the next call can retry. Logging someone out because of a blip
 *    would be user-hostile.
 */
export async function refreshAccessToken(): Promise<string | null> {
  if (typeof window === 'undefined') return null;
  if (inFlight) return inFlight;

  const refresh = getRefreshToken();
  if (!refresh) {
    // بدونِ refresh token هیچ راهی برای بازسازی نیست → قطعی
    lastOutcome = 'definitive';
    return null;
  }

  inFlight = (async () => {
    // ⚠️ همین خط قبلاً مستقیم به هاستِ بک‌اند می‌رفت (`siteConfig.apiUrl`) و
    // تنها درخواستِ cross-originِ مرورگر بود؛ با CORSِ بسته در production
    // preflight شکست می‌خورد، refresh «شکست» می‌شد و کاربر فوراً بیرون می‌افتاد.
    // حالا مثل بقیهٔ درخواست‌ها از مسیرِ هم‌دامنه عبور می‌کند.
    const url = browserApiUrl('/auth/token/refresh/');
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'Accept-Language': 'fa-IR',
        },
        body: JSON.stringify({ refresh }),
      });

      if (!res.ok) {
        // 401/403 → refresh token rejected for good. Anything else (5xx,
        // 429, gateway errors) is treated as transient.
        if (res.status === 401 || res.status === 403) {
          lastOutcome = 'definitive';
          clearTokens();
        } else {
          lastOutcome = 'transient';
        }
        return null;
      }

      const envelope = await res.json().catch(() => null);
      const data = envelope?.data ?? envelope;
      const newAccess: string | undefined = data?.access;
      const newRefresh: string = data?.refresh ?? refresh;

      if (!newAccess) {
        // A 2xx without an access token means the contract broke or the
        // session was invalidated server-side — also definitive.
        lastOutcome = 'definitive';
        clearTokens();
        return null;
      }

      setTokens({
        access: newAccess,
        refresh: newRefresh,
        persist: currentPersist(),
      });
      lastOutcome = 'ok';
      return newAccess;
    } catch {
      // Network-level failure (offline, CORS, DNS, restart) — keep the session,
      // let the caller retry. «قطعی» فقط وقتی است که سرور خودش توکن را رد کند.
      lastOutcome = 'transient';
      return null;
    }
  })();

  try {
    return await inFlight;
  } finally {
    inFlight = null;
  }
}

/* ───────────────────────────────────────────────────────────────────────── */
/*  Cross-tab / cross-component notification                                  */
/*                                                                            */
/*  React hooks (useAuth, useSession, etc.) subscribe via `onAuthChange`     */
/*  so any window that mutates the token store (login / logout / refresh)    */
/*  broadcasts to every other tab and every listener in the current tab.    */
/* ───────────────────────────────────────────────────────────────────────── */

type Listener = () => void;
const listeners = new Set<Listener>();

function notifyListeners() {
  listeners.forEach((fn) => {
    try {
      fn();
    } catch {
      /* isolate one bad listener from the others */
    }
  });
}

export function onAuthChange(fn: Listener): () => void {
  listeners.add(fn);
  // Cross-tab: storage events fire in OTHER tabs when localStorage changes
  const storageHandler = (e: StorageEvent) => {
    if (e.key === KEY_ACCESS || e.key === KEY_REFRESH || e.key === KEY_PERSIST) fn();
  };
  if (typeof window !== 'undefined') {
    window.addEventListener('storage', storageHandler);
  }
  return () => {
    listeners.delete(fn);
    if (typeof window !== 'undefined') {
      window.removeEventListener('storage', storageHandler);
    }
  };
}
