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

import { siteConfig } from './site';

const KEY_ACCESS  = 'sj.auth.access';
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

/* ───────────────────────────────────────────────────────────────────────── */
/*  Refresh — single-flight                                                   */
/* ───────────────────────────────────────────────────────────────────────── */

let inFlight: Promise<string | null> | null = null;

/**
 * Attempt to exchange the stored refresh token for a fresh access token.
 * Returns the new access token on success, or `null` if the refresh
 * fails (which should trigger a logout/redirect at the call site).
 */
export async function refreshAccessToken(): Promise<string | null> {
  if (typeof window === 'undefined') return null;
  if (inFlight) return inFlight;

  const refresh = getRefreshToken();
  if (!refresh) return null;

  inFlight = (async () => {
    const url = `${siteConfig.apiUrl.replace(/\/+$/, '')}/api/v1/auth/token/refresh/`;
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
      if (!res.ok) return null;
      const envelope = await res.json().catch(() => null);
      const data = envelope?.data ?? envelope;
      const newAccess: string | undefined = data?.access;
      const newRefresh: string = data?.refresh ?? refresh;
      if (!newAccess) return null;
      setTokens({
        access: newAccess,
        refresh: newRefresh,
        persist: currentPersist(),
      });
      return newAccess;
    } catch {
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
    try { fn(); } catch { /* isolate one bad listener from the others */ }
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
