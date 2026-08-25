'use client';

/**
 * React hook mirror of `lib/auth-tokens` + `lib/auth` + `lib/auth-user-cache`.
 *
 *   const { isAuthenticated, user, loading, refresh, logout } = useAuth();
 *
 *  - Subscribes to token-store change events so `isAuthenticated` reacts
 *    to login / logout / cross-tab session revocation in real time.
 *  - Lazily fetches `/auth/me/` the first time the hook is used with a
 *    valid token.
 *  - خودِ کاربر در استورِ مشترکِ auth-user-cache زندگی می‌کند؛ پس
 *    میوتیشن‌های پروفایل (ویرایش نام، عکس، شناسه‌ها) با applyUser/
 *    applyUserPatch همان‌جا همه‌ی مصرف‌کننده‌ها (هدر، صفحه‌ی حساب…)
 *    را در همان فریم سینک می‌کنند — بدون رفرشِ دستی.
 */

import { useEffect, useState, useCallback, useSyncExternalStore } from 'react';
import { hasSession, onAuthChange, clearTokens } from './auth-tokens';
import { getMe, logout as apiLogout, type AuthUser } from './auth';
import {
  getCachedUser,
  setCachedUser,
  patchCachedUser,
  subscribeCachedUser,
} from './auth-user-cache';

function subscribeSession(cb: () => void) {
  return onAuthChange(cb);
}
function getSessionSnapshot() {
  return hasSession();
}
function getSessionServerSnapshot() {
  return false;
}
function getUserServerSnapshot() {
  return null;
}

/**
 * جایگزینیِ کشِ کاربر با UserMeِ کاملِ تازه از سرور — برای میوتیشن‌هایی
 * که قراردادشان بازگشتِ UserMeSerializer است:
 *   updateMe · identifierAddVerify · identifierMakePrimary · refresh
 */
export function applyUser(user: AuthUser | null): void {
  setCachedUser(user);
}

/**
 * مرجِ تدریجیِ کش — برای خروجی‌هایی که UserMeِ کامل نیستند
 * (مثلاً ProfileSerializer از /auth/profile/ → کلید profile).
 */
export function applyUserPatch(patch: Partial<AuthUser>): void {
  patchCachedUser(patch);
}

export function useAuth() {
  const isAuthenticated = useSyncExternalStore(
    subscribeSession,
    getSessionSnapshot,
    getSessionServerSnapshot,
  );
  const user = useSyncExternalStore(subscribeCachedUser, getCachedUser, getUserServerSnapshot);
  const [loading, setLoading] = useState<boolean>(isAuthenticated && !getCachedUser());
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!hasSession()) {
      setCachedUser(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const fresh = await getMe();
      setCachedUser(fresh);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطا در دریافت اطلاعات کاربر');
      // If /auth/me/ still fails after the refresh cycle in api.ts we
      // definitively lack a valid session — clean up.
      setCachedUser(null);
      clearTokens();
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      if (!getCachedUser()) refresh();
    } else {
      setCachedUser(null);
      setLoading(false);
    }
  }, [isAuthenticated, refresh]);

  const logout = useCallback(async () => {
    await apiLogout();
    setCachedUser(null);
  }, []);

  return { isAuthenticated, user, loading, error, refresh, logout };
}
