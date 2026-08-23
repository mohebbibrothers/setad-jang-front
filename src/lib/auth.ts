/** Typed wrappers for the backend's multi-identifier authentication API. */

import { apiFetch, apiFetchResult, type Paginated } from "./api";
import {
  clearTokens,
  getRefreshToken,
  setTokens,
  type TokenPair,
} from "./auth-tokens";

export const OTP_CODE_LENGTH = 5;
export const OTP_TTL_SECONDS = 5 * 60;
export const OTP_RESEND_SECONDS = 60;
export const IDENTIFIER_MAX_LENGTH = 254;

export type IdentifierKind = "email" | "phone";
export type UserRole = "user" | "admin";
export type AuthGender = "male" | "female" | "";

export type AuthProfile = {
  phone_number: string | null;
  national_code?: string;
  birth_date?: string | null;
  gender?: AuthGender;
  avatar?: string | null;
  bio?: string;
  province?: string;
  city?: string;
  address?: string;
};

export type AuthUser = {
  id: number;
  email: string | null;
  first_name?: string;
  last_name?: string;
  full_name: string;
  role: UserRole;
  is_email_verified: boolean;
  date_joined: string;
  profile: AuthProfile;
};

export type AuthSession = {
  id: number;
  device_label: string;
  ip_address: string | null;
  user_agent: string;
  request_id: string;
  is_revoked: boolean;
  revoked_at: string | null;
  revoked_by_email: string | null;
  last_seen_at: string;
  expires_at: string | null;
  created_at: string;
};

export type AuthResult = {
  tokens: { access: string; refresh: string };
  user: AuthUser;
};

type LegacyAuthResult = {
  access: string;
  refresh: string;
  user?: AuthUser;
};

export type AuthChallengeResult = {
  identifier: string;
  message: string;
};

function normalizeAuthResult(value: AuthResult | LegacyAuthResult): AuthResult {
  if ("tokens" in value && value.tokens?.access && value.tokens?.refresh)
    return value;
  if ("access" in value && value.access && value.refresh) {
    return {
      tokens: { access: value.access, refresh: value.refresh },
      user: value.user as AuthUser,
    };
  }
  throw new Error("پاسخ احراز هویت ناقص است.");
}

function persistAuthResult(
  value: AuthResult | LegacyAuthResult,
  persist: boolean,
): AuthResult {
  const result = normalizeAuthResult(value);
  setTokens({ ...result.tokens, persist });
  return result;
}

async function requestChallenge(
  path: string,
  identifier: string,
  authenticated = false,
): Promise<AuthChallengeResult> {
  const result = await apiFetchResult<null>(path, {
    method: "POST",
    body: JSON.stringify({ identifier, website: "" }),
    skipAuth: !authenticated,
    cache: "no-store",
  });
  return { identifier, message: result.message || "کد تأیید ارسال شد." };
}

export function signupRequest(
  identifier: string,
): Promise<AuthChallengeResult> {
  return requestChallenge("/auth/signup/request/", identifier);
}

export async function signupVerify(payload: {
  identifier: string;
  code: string;
  password: string;
  first_name?: string;
  last_name?: string;
  persist?: boolean;
}): Promise<AuthResult> {
  const { persist = false, ...body } = payload;
  const response = await apiFetch<AuthResult | LegacyAuthResult>(
    "/auth/signup/verify/",
    {
      method: "POST",
      body: JSON.stringify({ ...body, website: "" }),
      skipAuth: true,
      cache: "no-store",
    },
  );
  return persistAuthResult(response, persist);
}

export async function loginPassword(payload: {
  identifier: string;
  password: string;
  persist?: boolean;
}): Promise<AuthResult> {
  const { persist = false, ...body } = payload;
  const response = await apiFetch<AuthResult | LegacyAuthResult>(
    "/auth/login/password/",
    {
      method: "POST",
      body: JSON.stringify({ ...body, website: "" }),
      skipAuth: true,
      cache: "no-store",
    },
  );
  return persistAuthResult(response, persist);
}

export function loginOtpRequest(
  identifier: string,
): Promise<AuthChallengeResult> {
  return requestChallenge("/auth/login/otp/request/", identifier);
}

export async function loginOtpVerify(payload: {
  identifier: string;
  code: string;
  persist?: boolean;
}): Promise<AuthResult> {
  const { persist = false, ...body } = payload;
  const response = await apiFetch<AuthResult | LegacyAuthResult>(
    "/auth/login/otp/verify/",
    {
      method: "POST",
      body: JSON.stringify({ ...body, website: "" }),
      skipAuth: true,
      cache: "no-store",
    },
  );
  return persistAuthResult(response, persist);
}

export function forgotPasswordRequest(
  identifier: string,
): Promise<AuthChallengeResult> {
  return requestChallenge("/auth/password/forgot/request/", identifier);
}

export async function forgotPasswordConfirm(payload: {
  identifier: string;
  code: string;
  new_password: string;
}): Promise<string> {
  const result = await apiFetchResult<null>("/auth/password/forgot/confirm/", {
    method: "POST",
    body: JSON.stringify({ ...payload, website: "" }),
    skipAuth: true,
    cache: "no-store",
  });
  return result.message;
}

export function identifierAddRequest(
  identifier: string,
): Promise<AuthChallengeResult> {
  return requestChallenge("/auth/identifiers/add/request/", identifier, true);
}

export function identifierAddVerify(payload: {
  identifier: string;
  code: string;
}): Promise<AuthUser> {
  return apiFetch<AuthUser>("/auth/identifiers/add/verify/", {
    method: "POST",
    body: JSON.stringify({ ...payload, website: "" }),
    cache: "no-store",
  });
}

export function identifierMakePrimary(
  identifierKind: IdentifierKind,
): Promise<AuthUser> {
  return apiFetch<AuthUser>("/auth/identifiers/make-primary/", {
    method: "POST",
    body: JSON.stringify({ identifier_kind: identifierKind }),
    cache: "no-store",
  });
}

export function getMe(): Promise<AuthUser> {
  return apiFetch<AuthUser>("/auth/me/", { cache: "no-store" });
}

export function updateMe(
  patch: Pick<Partial<AuthUser>, "first_name" | "last_name">,
): Promise<AuthUser> {
  return apiFetch<AuthUser>("/auth/me/", {
    method: "PATCH",
    body: JSON.stringify(patch),
    cache: "no-store",
  });
}

export function getProfile(): Promise<AuthProfile> {
  return apiFetch<AuthProfile>("/auth/profile/", { cache: "no-store" });
}

export function updateProfile(
  patch: Partial<AuthProfile> | FormData,
): Promise<AuthProfile> {
  const formData = typeof FormData !== "undefined" && patch instanceof FormData;
  return apiFetch<AuthProfile>("/auth/profile/", {
    method: "PATCH",
    body: formData ? patch : JSON.stringify(patch),
    cache: "no-store",
  });
}

export async function changePassword(payload: {
  old_password: string;
  new_password: string;
}): Promise<string> {
  const result = await apiFetchResult<null>("/auth/password/change/", {
    method: "POST",
    body: JSON.stringify(payload),
    cache: "no-store",
  });
  return result.message;
}

export async function listSessions(): Promise<AuthSession[]> {
  const response = await apiFetch<Paginated<AuthSession>>("/auth/sessions/", {
    cache: "no-store",
  });
  return response?.results ?? [];
}

export function revokeSession(
  sessionId: number | string,
): Promise<AuthSession> {
  return apiFetch<AuthSession>(
    `/auth/sessions/${encodeURIComponent(String(sessionId))}/revoke/`,
    {
      method: "POST",
      cache: "no-store",
    },
  );
}

export async function logout(): Promise<void> {
  const refresh = getRefreshToken();
  try {
    if (refresh) {
      await apiFetch("/auth/logout/", {
        method: "POST",
        body: JSON.stringify({ refresh }),
        skipRefresh: true,
        cache: "no-store",
      });
    }
  } catch {
    // Local sign-out must always succeed, even when the network is offline.
  } finally {
    clearTokens();
  }
}

export function tokenPairFromAuthResult(result: AuthResult): TokenPair {
  return { ...result.tokens };
}
