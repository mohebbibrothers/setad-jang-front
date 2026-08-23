"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { getMe, logout as apiLogout, type AuthUser } from "./auth";
import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  onAuthChange,
} from "./auth-tokens";
import { isApiError } from "./api";

let cachedUser: AuthUser | null = null;
let cachedSessionKey: string | null = null;
let pendingUserRequest: Promise<AuthUser> | null = null;

function loadCurrentUser(): Promise<AuthUser> {
  if (!pendingUserRequest) {
    pendingUserRequest = getMe().finally(() => {
      pendingUserRequest = null;
    });
  }
  return pendingUserRequest;
}

function subscribe(callback: () => void) {
  return onAuthChange(callback);
}

function getSnapshot(): string | null {
  return getRefreshToken() || getAccessToken();
}

function getServerSnapshot(): null {
  return null;
}

export function useAuth() {
  const sessionKey = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );
  const isAuthenticated = Boolean(sessionKey);
  const cacheIsCurrent = Boolean(
    sessionKey && cachedSessionKey === sessionKey && cachedUser,
  );

  const [user, setUser] = useState<AuthUser | null>(
    cacheIsCurrent ? cachedUser : null,
  );
  const [loading, setLoading] = useState(isAuthenticated && !cacheIsCurrent);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const currentKey = getSnapshot();
    if (!currentKey) {
      cachedUser = null;
      cachedSessionKey = null;
      setUser(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const fresh = await loadCurrentUser();
      cachedUser = fresh;
      cachedSessionKey = getSnapshot();
      setUser(fresh);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "خطا در دریافت اطلاعات کاربر",
      );
      if (isApiError(cause) && cause.status === 401) {
        cachedUser = null;
        cachedSessionKey = null;
        setUser(null);
        clearTokens();
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!sessionKey) {
      cachedUser = null;
      cachedSessionKey = null;
      setUser(null);
      setLoading(false);
      return;
    }

    if (cachedSessionKey === sessionKey && cachedUser) {
      setUser(cachedUser);
      setLoading(false);
      return;
    }

    void refresh();
  }, [sessionKey, refresh]);

  const logout = useCallback(async () => {
    await apiLogout();
    cachedUser = null;
    cachedSessionKey = null;
    setUser(null);
  }, []);

  return { isAuthenticated, user, loading, error, refresh, logout };
}
