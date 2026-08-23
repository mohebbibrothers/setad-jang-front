/** Browser-only JWT storage with refresh single-flight semantics. */

import { resolveApiUrl } from "./api-url";

const KEY_ACCESS = "sj.auth.access";
const KEY_REFRESH = "sj.auth.refresh";
const KEY_PERSIST = "sj.auth.persist";

export type TokenPair = {
  access: string;
  refresh: string;
  persist?: boolean;
};

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
    /* private mode/quota */
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
  if (typeof window === "undefined") return null;
  return persist ? window.localStorage : window.sessionStorage;
}

function currentPersist(): boolean {
  if (typeof window === "undefined") return false;
  return safeGet(window.localStorage, KEY_PERSIST) === "1";
}

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return safeGet(pickStore(currentPersist()), KEY_ACCESS);
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return safeGet(pickStore(currentPersist()), KEY_REFRESH);
}

export function setTokens(pair: TokenPair): void {
  if (typeof window === "undefined") return;
  const persist = pair.persist === true;
  const store = pickStore(persist);
  safeSet(store, KEY_ACCESS, pair.access);
  safeSet(store, KEY_REFRESH, pair.refresh);
  safeSet(window.localStorage, KEY_PERSIST, persist ? "1" : "0");

  const other = pickStore(!persist);
  safeRemove(other, KEY_ACCESS);
  safeRemove(other, KEY_REFRESH);
  notifyListeners();
}

export function clearTokens(): void {
  if (typeof window === "undefined") return;
  for (const store of [window.localStorage, window.sessionStorage]) {
    safeRemove(store, KEY_ACCESS);
    safeRemove(store, KEY_REFRESH);
  }
  safeRemove(window.localStorage, KEY_PERSIST);
  notifyListeners();
}

export function hasSession(): boolean {
  return Boolean(getAccessToken() || getRefreshToken());
}

let inFlight: Promise<string | null> | null = null;

export async function refreshAccessToken(): Promise<string | null> {
  if (typeof window === "undefined") return null;
  if (inFlight) return inFlight;

  const refresh = getRefreshToken();
  if (!refresh) return null;

  inFlight = (async () => {
    try {
      const response = await fetch(resolveApiUrl("/auth/token/refresh/"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "Accept-Language": "fa-IR",
        },
        body: JSON.stringify({ refresh }),
        cache: "no-store",
      });
      if (!response.ok) return null;

      const payload = await response.json().catch(() => null);
      const data = payload?.data ?? payload;
      const access = typeof data?.access === "string" ? data.access : null;
      const rotatedRefresh =
        typeof data?.refresh === "string" ? data.refresh : refresh;
      if (!access) return null;

      setTokens({ access, refresh: rotatedRefresh, persist: currentPersist() });
      return access;
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

type Listener = () => void;
const listeners = new Set<Listener>();

function notifyListeners(): void {
  listeners.forEach((listener) => {
    try {
      listener();
    } catch {
      /* isolate subscribers */
    }
  });
}

export function onAuthChange(listener: Listener): () => void {
  listeners.add(listener);
  const storageHandler = (event: StorageEvent) => {
    if ([KEY_ACCESS, KEY_REFRESH, KEY_PERSIST].includes(event.key || ""))
      listener();
  };
  if (typeof window !== "undefined")
    window.addEventListener("storage", storageHandler);
  return () => {
    listeners.delete(listener);
    if (typeof window !== "undefined")
      window.removeEventListener("storage", storageHandler);
  };
}
