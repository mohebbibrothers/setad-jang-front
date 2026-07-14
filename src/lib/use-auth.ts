'use client';

/**
 * React hook mirror of `lib/auth-tokens` + `lib/auth`.
 *
 *   const { isAuthenticated, user, loading, refresh, logout } = useAuth();
 *
 *  - Subscribes to token-store change events so `isAuthenticated` reacts
 *    to login / logout / cross-tab session revocation in real time.
 *  - Lazily fetches `/auth/me/` the first time the hook is used with a
 *    valid token, and caches the result at module scope so the second
 *    tab hitting the same session doesn't hit the network again.
 */

import { useEffect, useState, useCallback, useSyncExternalStore } from 'react';
import { hasSession, onAuthChange, clearTokens } from './auth-tokens';
import { getMe, logout as apiLogout, type AuthUser } from './auth';

let cachedUser: AuthUser | null = null;

function subscribe(cb: () => void) {
  return onAuthChange(cb);
}
function getSnapshot() {
  return hasSession();
}
function getServerSnapshot() {
  return false;
}

export function useAuth() {
  const isAuthenticated = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );
  const [user, setUser] = useState<AuthUser | null>(cachedUser);
  const [loading, setLoading] = useState<boolean>(isAuthenticated && !cachedUser);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!hasSession()) {
      cachedUser = null;
      setUser(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const fresh = await getMe();
      cachedUser = fresh;
      setUser(fresh);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطا در دریافت اطلاعات کاربر');
      // If /auth/me/ still fails after the refresh cycle in api.ts we
      // definitively lack a valid session — clean up.
      cachedUser = null;
      setUser(null);
      clearTokens();
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      if (!cachedUser) refresh();
    } else {
      cachedUser = null;
      setUser(null);
      setLoading(false);
    }
  }, [isAuthenticated, refresh]);

  const logout = useCallback(async () => {
    await apiLogout();
    cachedUser = null;
    setUser(null);
  }, []);

  return { isAuthenticated, user, loading, error, refresh, logout };
}
