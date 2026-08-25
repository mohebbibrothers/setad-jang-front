/**
 * ───────────────────────────────────────────────────────────────────────────
 *  Authentication client — thin, typed wrappers over `/api/v1/auth/*`.
 *
 *  All flows come straight from the multi-identifier spec described in
 *  `docs/FRONTEND_INTEGRATION_GUIDE.md` and the backend's
 *  `apps/authentication/` package.
 *
 *  Wire diagram (happy path)
 *  ─────────────────────────
 *    Signup       :  signupRequest → signupVerify   (issues tokens)
 *    Login (pwd)  :  loginPassword                  (issues tokens)
 *    Login (otp)  :  loginOtpRequest → loginOtpVerify
 *    Refresh      :  handled by api.ts on 401       (SimpleJWT)
 *    Logout       :  logout                         (invalidates refresh)
 *    Me           :  getMe / updateMe / getProfile / updateProfile
 *    Sessions     :  listSessions / revokeSession
 *
 *  Every mutation calls `setTokens()` / `clearTokens()` at the right
 *  moment so the rest of the app (via the `useAuth()` hook) always sees
 *  a consistent view of "am I signed in?".
 * ───────────────────────────────────────────────────────────────────────────
 */

import { apiFetch } from './api';
import { setTokens, clearTokens, getRefreshToken } from './auth-tokens';

/* ───────────────────────────────────────────────────────────────────────── */
/*  Constants — mirror apps/authentication/serializers.py                     */
/* ───────────────────────────────────────────────────────────────────────── */

export const OTP_CODE_LENGTH = 5;
export const IDENTIFIER_MAX_LENGTH = 254;

/* ───────────────────────────────────────────────────────────────────────── */
/*  Types                                                                     */
/* ───────────────────────────────────────────────────────────────────────── */

export type IdentifierKind = 'email' | 'phone';

/**
 * Result of the OTP-request endpoints (signup / login / forgot).
 * Backend returns an EMPTY success envelope (data: null) for these —
 * the channel message is what matters, so every field here is optional
 * and the value may be `null` at runtime. UI shows its own microcopy.
 */
export type AuthChallengeResult = {
  identifier: string;
  identifier_kind?: IdentifierKind;
  cooldown_seconds?: number;
  expires_in?: number;
  message?: string;
} | null;

export type JwtPair = { access: string; refresh: string };

/**
 * The exact `data` contract of every successful credential check —
 * verified against apps/authentication/views.py (LoginPassword /
 * LoginOTPVerify / SignupVerify):
 *
 *   data = { user: <UserMeSerializer>, tokens: { access, refresh } }
 *
 * ⚠️ The pair is NESTED under `tokens` — reading `data.access`
 * directly silently drops the session (login «succeeds» but nothing
 * is persisted). Guarded by src/lib/auth.test.ts.
 */
export type AuthSuccessResult = {
  user: AuthUser;
  tokens: JwtPair;
};

/** @deprecated kept for import compatibility — use AuthSuccessResult. */
export type TokenResponse = AuthSuccessResult;

export type AuthUser = {
  id: number | string;
  email?: string | null;
  phone_number?: string | null;
  first_name?: string;
  last_name?: string;
  full_name?: string;
  role?: string;
  is_email_verified?: boolean;
  is_active?: boolean;
  is_staff?: boolean;
  is_verified?: boolean;
  date_joined?: string;
  primary_identifier?: string;
  primary_identifier_kind?: IdentifierKind;
  identifiers?: Array<{
    id: number;
    value: string;
    kind: IdentifierKind;
    is_primary?: boolean;
    is_verified?: boolean;
  }>;
  profile?: AuthProfile;
};

export type AuthProfile = {
  /** از ProfileSerializer (source=user.phone_number) */
  phone_number?: string | null;
  first_name?: string;
  last_name?: string;
  avatar?: string | null;
  bio?: string | null;
  province?: string | null;
  city?: string | null;
  national_code?: string | null;
  birth_date?: string | null;
  gender?: string | null;
  address?: string | null;
};

/**
 * قراردادِ دقیقِ AuthSessionSerializer — از apps/authentication/
 * serializers.py خوانده شده؛ هیچ فیلدِ فرضی‌ای (device_type/location/
 * is_current) در خروجیِ واقعی وجود ندارد.
 */
export type AuthSession = {
  id: number | string;
  /** برچسب کوتاهِ دستگاه که بک‌اند از UA می‌سازد («Mobile browser»…) */
  device_label?: string;
  ip_address?: string | null;
  user_agent?: string;
  request_id?: string;
  is_revoked?: boolean;
  revoked_at?: string | null;
  revoked_by_email?: string | null;
  last_seen_at?: string;
  expires_at?: string | null;
  created_at?: string;
  /** فلگِ سروری: این نشست همان نشستِ حاملِ توکنِ درخواست است (از claimِ sid) */
  is_current?: boolean;
};

/* ───────────────────────────────────────────────────────────────────────── */
/*  Persist helper                                                            */
/* ───────────────────────────────────────────────────────────────────────── */

function persistFromResponse(response: AuthSuccessResult, persist = true): AuthSuccessResult {
  const pair = response?.tokens;
  if (pair?.access && pair?.refresh) {
    setTokens({ access: pair.access, refresh: pair.refresh, persist });
  }
  return response;
}

/* ───────────────────────────────────────────────────────────────────────── */
/*  Signup — 2-step OTP                                                       */
/* ───────────────────────────────────────────────────────────────────────── */

export function signupRequest(identifier: string): Promise<AuthChallengeResult> {
  return apiFetch<AuthChallengeResult>('/auth/signup/request/', {
    method: 'POST',
    body: JSON.stringify({ identifier }),
    skipAuth: true,
  });
}

export async function signupVerify(payload: {
  identifier: string;
  code: string;
  password: string;
  first_name?: string;
  last_name?: string;
  persist?: boolean;
}): Promise<AuthSuccessResult> {
  const { persist = true, ...body } = payload;
  const response = await apiFetch<AuthSuccessResult>('/auth/signup/verify/', {
    method: 'POST',
    body: JSON.stringify(body),
    skipAuth: true,
  });
  return persistFromResponse(response, persist);
}

/* ───────────────────────────────────────────────────────────────────────── */
/*  Login — password                                                          */
/* ───────────────────────────────────────────────────────────────────────── */

export async function loginPassword(payload: {
  identifier: string;
  password: string;
  persist?: boolean;
}): Promise<AuthSuccessResult> {
  const { persist = true, ...body } = payload;
  const response = await apiFetch<AuthSuccessResult>('/auth/login/password/', {
    method: 'POST',
    body: JSON.stringify(body),
    skipAuth: true,
  });
  return persistFromResponse(response, persist);
}

/* ───────────────────────────────────────────────────────────────────────── */
/*  Login — OTP (2-step)                                                      */
/* ───────────────────────────────────────────────────────────────────────── */

export function loginOtpRequest(identifier: string): Promise<AuthChallengeResult> {
  return apiFetch<AuthChallengeResult>('/auth/login/otp/request/', {
    method: 'POST',
    body: JSON.stringify({ identifier }),
    skipAuth: true,
  });
}

export async function loginOtpVerify(payload: {
  identifier: string;
  code: string;
  persist?: boolean;
}): Promise<AuthSuccessResult> {
  const { persist = true, ...body } = payload;
  const response = await apiFetch<AuthSuccessResult>('/auth/login/otp/verify/', {
    method: 'POST',
    body: JSON.stringify(body),
    skipAuth: true,
  });
  return persistFromResponse(response, persist);
}

/* ───────────────────────────────────────────────────────────────────────── */
/*  Password recovery                                                         */
/* ───────────────────────────────────────────────────────────────────────── */

export function forgotPasswordRequest(identifier: string): Promise<AuthChallengeResult> {
  return apiFetch<AuthChallengeResult>('/auth/password/forgot/request/', {
    method: 'POST',
    body: JSON.stringify({ identifier }),
    skipAuth: true,
  });
}

export function forgotPasswordConfirm(payload: {
  identifier: string;
  code: string;
  new_password: string;
}): Promise<{ message?: string }> {
  return apiFetch('/auth/password/forgot/confirm/', {
    method: 'POST',
    body: JSON.stringify(payload),
    skipAuth: true,
  });
}

/* ───────────────────────────────────────────────────────────────────────── */
/*  Identifier management (authenticated)                                     */
/* ───────────────────────────────────────────────────────────────────────── */

export function identifierAddRequest(identifier: string): Promise<AuthChallengeResult> {
  return apiFetch<AuthChallengeResult>('/auth/identifiers/add/request/', {
    method: 'POST',
    body: JSON.stringify({ identifier }),
  });
}

/**
 * تأیید اتصال شناسه — بک‌اند در پاسخِ موفق UserMeSerializerِ کامل
 * برمی‌گرداند (data = کاربرِ تازه)؛ مصرف‌کننده با همان، کشِ کاربر را
 * یک‌جا سینک می‌کند.
 */
export function identifierAddVerify(payload: {
  identifier: string;
  code: string;
}): Promise<AuthUser> {
  return apiFetch<AuthUser>('/auth/identifiers/add/verify/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * تغییر شناسه‌ی اصلی — قرارداد از IdentifierMakePrimarySerializer:
 * بدنه فقط { identifier_kind: 'email' | 'phone' } است (نه مقدارِ
 * شناسه!) و پاسخِ موفق دوباره UserMeِ کامل است.
 */
export function identifierMakePrimary(identifierKind: IdentifierKind): Promise<AuthUser> {
  return apiFetch<AuthUser>('/auth/identifiers/make-primary/', {
    method: 'POST',
    body: JSON.stringify({ identifier_kind: identifierKind }),
  });
}

/* ───────────────────────────────────────────────────────────────────────── */
/*  Me / Profile                                                              */
/* ───────────────────────────────────────────────────────────────────────── */

export function getMe(): Promise<AuthUser> {
  return apiFetch<AuthUser>('/auth/me/');
}

export function updateMe(patch: Partial<AuthUser>): Promise<AuthUser> {
  return apiFetch<AuthUser>('/auth/me/', {
    method: 'PATCH',
    body: JSON.stringify(patch),
  });
}

export function getProfile(): Promise<AuthProfile> {
  return apiFetch<AuthProfile>('/auth/profile/');
}

export function updateProfile(patch: Partial<AuthProfile> | FormData): Promise<AuthProfile> {
  const body = patch instanceof FormData ? patch : JSON.stringify(patch);
  return apiFetch<AuthProfile>('/auth/profile/', { method: 'PATCH', body });
}

export function changePassword(payload: {
  old_password: string;
  new_password: string;
}): Promise<{ message?: string }> {
  return apiFetch('/auth/password/change/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/* ───────────────────────────────────────────────────────────────────────── */
/*  Sessions                                                                  */
/* ───────────────────────────────────────────────────────────────────────── */

export type SessionsPage = {
  results: AuthSession[];
  count: number;
  /** آیا صفحه‌ی بعدی هست؟ (برای «نمایش بیشتر») */
  next: string | null;
};

/**
 * نشست‌ها — خروجیِ بک‌اند صفحه‌بندی‌شده است:
 * envelope.data = { count, next, previous, results }  (StandardPagination)
 * تابع هر دو شکلِ ممکن (آرایه‌ی خام/شیٔ صفحه‌بندی) را نرمال می‌کند.
 */
export function listSessionsPage(page = 1): Promise<SessionsPage> {
  const qs = page > 1 ? `?page=${page}` : '';
  return apiFetch<AuthSession[] | (Partial<SessionsPage> & { results?: AuthSession[] })>(
    `/auth/sessions/${qs}`,
  ).then((res) => {
    if (Array.isArray(res)) return { results: res, count: res.length, next: null };
    return {
      results: res?.results ?? [],
      count: res?.count ?? res?.results?.length ?? 0,
      next: res?.next ?? null,
    };
  });
}

/** سازگاریِ عقب‌رو: فقط لیستِ صفحه‌ی اول برمی‌گرداند */
export function listSessions(): Promise<AuthSession[]> {
  return listSessionsPage(1).then((p) => p.results);
}

/**
 * لغوی یک نشست — بک‌اند AuthSessionِ به‌روزشده (is_revoked=true) برمی‌گرداند
 * و همان را جایگزینِ ردیفِ لیست می‌کنیم (سینکِ دقیق بدون رفرشِ کامل).
 */
export function revokeSession(sessionId: number | string): Promise<AuthSession> {
  return apiFetch<AuthSession>(`/auth/sessions/${sessionId}/revoke/`, { method: 'POST' });
}

/* ───────────────────────────────────────────────────────────────────────── */
/*  Logout                                                                    */
/* ───────────────────────────────────────────────────────────────────────── */

/**
 * Best-effort logout — invalidates the refresh token on the server
 * and clears local storage. Never throws; local state is cleared even
 * if the server call fails (offline, expired token, etc.).
 */
export async function logout(): Promise<void> {
  const refresh = getRefreshToken();
  try {
    if (refresh) {
      await apiFetch('/auth/logout/', {
        method: 'POST',
        body: JSON.stringify({ refresh }),
        skipRefresh: true,
      });
    }
  } catch {
    /* swallow — the important thing is the local clear below */
  } finally {
    clearTokens();
  }
}
