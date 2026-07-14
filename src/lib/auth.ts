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
 * Loose payload used by the request-OTP / signup-request endpoints —
 * they only return a message + cooldown/expiry hint, no token data.
 */
export type AuthChallengeResult = {
  identifier: string;
  identifier_kind?: IdentifierKind;
  cooldown_seconds?: number;
  expires_in?: number;
  message?: string;
};

export type TokenResponse = {
  access: string;
  refresh: string;
  user?: AuthUser;
};

export type AuthUser = {
  id: number | string;
  email?: string | null;
  phone_number?: string | null;
  first_name?: string;
  last_name?: string;
  full_name?: string;
  is_active?: boolean;
  is_staff?: boolean;
  is_verified?: boolean;
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
  first_name?: string;
  last_name?: string;
  avatar?: string | null;
  bio?: string | null;
  province?: string | null;
  city?: string | null;
  national_code?: string | null;
  birth_date?: string | null;
};

export type AuthSession = {
  id: number | string;
  user_agent?: string;
  ip_address?: string;
  device_type?: string;
  location?: string;
  is_current?: boolean;
  created_at?: string;
  last_seen_at?: string;
  expires_at?: string;
};

/* ───────────────────────────────────────────────────────────────────────── */
/*  Persist helper                                                            */
/* ───────────────────────────────────────────────────────────────────────── */

function persistFromResponse(response: TokenResponse, persist = true): TokenResponse {
  if (response.access && response.refresh) {
    setTokens({ access: response.access, refresh: response.refresh, persist });
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
}): Promise<TokenResponse> {
  const { persist = true, ...body } = payload;
  const response = await apiFetch<TokenResponse>('/auth/signup/verify/', {
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
}): Promise<TokenResponse> {
  const { persist = true, ...body } = payload;
  const response = await apiFetch<TokenResponse>('/auth/login/password/', {
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
}): Promise<TokenResponse> {
  const { persist = true, ...body } = payload;
  const response = await apiFetch<TokenResponse>('/auth/login/otp/verify/', {
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

export function identifierAddVerify(payload: {
  identifier: string;
  code: string;
}): Promise<{ message?: string }> {
  return apiFetch('/auth/identifiers/add/verify/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function identifierMakePrimary(identifier: string): Promise<{ message?: string }> {
  return apiFetch('/auth/identifiers/make-primary/', {
    method: 'POST',
    body: JSON.stringify({ identifier }),
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

export function listSessions(): Promise<AuthSession[]> {
  return apiFetch<AuthSession[] | { results: AuthSession[] }>('/auth/sessions/')
    .then((res) => (Array.isArray(res) ? res : res.results ?? []));
}

export function revokeSession(sessionId: number | string): Promise<{ message?: string }> {
  return apiFetch(`/auth/sessions/${sessionId}/revoke/`, { method: 'POST' });
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
