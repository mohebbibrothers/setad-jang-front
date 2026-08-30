/**
 * ───────────────────────────────────────────────────────────────────────────
 *  Typed API client for the Setad-Jang Django/DRF backend.
 *
 *  Design goals
 *  ─────────────
 *   1. One entry point (`apiFetch`) shared by SSR loaders, RSC prefetches
 *      and browser hooks.
 *   2. Automatic response-envelope unwrapping — every backend response
 *      follows the contract from `apps/core/responses.py`:
 *         { success: true,  status_code: 200, message, data }
 *         { success: false, status_code: 4xx, message, errors }
 *      Consumers get `data` directly on success and an `ApiError` on
 *      failure, so app code never has to double-check `success`.
 *   3. JWT-aware — reads the access token from the client-side token
 *      store (`lib/auth-tokens`) and injects `Authorization: Bearer …`
 *      on every browser-side call. On 401 it transparently attempts a
 *      single refresh + retry cycle.
 *   4. FormData-friendly — never sets `Content-Type` when the body is
 *      a FormData instance (the browser must set its own boundary).
 *   5. AbortController-safe — accepts a `signal` for live-search cases
 *      where in-flight requests need to be cancelled on each keystroke.
 *   6. Next.js-aware — supports `{ revalidate, tags }` fetch options
 *      so RSC loaders can opt into ISR without a wrapper library.
 *
 *  URL routing strategy
 *  ────────────────────
 *   - Server side (SSR / RSC)   →  <NEXT_PUBLIC_API_URL>/api/v1/<path>
 *   - Browser side              →  /api/proxy/<path>   (Next rewrite → backend)
 *
 *   The same-origin proxy sidesteps CORS entirely for the browser
 *   without forcing users to remember the backend host.
 * ───────────────────────────────────────────────────────────────────────────
 */

import { siteConfig } from './site';
import { getAccessToken, refreshAccessToken, clearTokens } from './auth-tokens';

/* ───────────────────────────────────────────────────────────────────────── */
/*  Types                                                                     */
/* ───────────────────────────────────────────────────────────────────────── */

export type ApiEnvelope<T> = {
  success: boolean;
  status_code: number;
  message: string;
  data?: T;
  errors?: Record<string, unknown>;
};

/**
 * Paginated payloads from DRF list views, wrapped by the standard
 * envelope: envelope.data === { count, next, previous, results }.
 */
export type Paginated<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

export class ApiError extends Error {
  status: number;
  errors?: Record<string, unknown>;
  /** Full envelope, when the server sent one. Useful for form-level display. */
  payload?: ApiEnvelope<unknown> | null;

  constructor(
    message: string,
    status: number,
    errors?: Record<string, unknown>,
    payload?: ApiEnvelope<unknown> | null,
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.errors = errors;
    this.payload = payload ?? null;
  }
}

export type FetchOptions = RequestInit & {
  /** Force absolute backend URL even in browser (skip same-origin proxy). */
  absolute?: boolean;
  /** Skip auth-header injection (useful for public loaders). */
  skipAuth?: boolean;
  /** Skip the 401 → refresh → retry loop. */
  skipRefresh?: boolean;
  /** Next.js `revalidate` hint (seconds) for RSC ISR. */
  revalidate?: number | false;
  /** Next.js cache tag(s) for on-demand revalidation. */
  tags?: string[];
  /** AbortSignal for in-flight cancellation (live search, etc). */
  signal?: AbortSignal;
};

/* ───────────────────────────────────────────────────────────────────────── */
/*  URL resolution                                                            */
/* ───────────────────────────────────────────────────────────────────────── */

function isServer(): boolean {
  return typeof window === 'undefined';
}

/**
 * Return the base URL prefix that every path is joined against.
 *
 * Server-side (SSR / RSC / route handlers)
 *   →  `<NEXT_PUBLIC_API_URL>/api/v1`
 *      (absolute — the Node process has no notion of "same-origin".)
 *
 * Browser
 *   →  If the API host matches the current page's origin (or is left
 *      unset / relative), we go DIRECT to `/api/v1/…` — same-origin,
 *      no CORS, no rewrite hop. This is the norm on besat.me where
 *      the Django backend is reverse-proxied behind Nginx on the SAME
 *      domain that serves the frontend; asking Nginx to route to a
 *      Next.js /api/proxy/ rewrite is a wasteful extra layer that
 *      also silently 404s if Nginx isn't wired to forward it.
 *   →  If the API host differs from the page origin (e.g. dev-time
 *      cross-origin backend, staging on a different sub-domain), we
 *      fall back to the same-origin Next.js rewrite at `/api/proxy`,
 *      which sidesteps CORS by forwarding server-side.
 */
function resolveBaseUrl(absolute: boolean): string {
  if (isServer() || absolute) {
    return `${siteConfig.apiUrl.replace(/\/+$/, '')}/api/v1`;
  }
  // Browser: pick between "direct same-origin" and "Next-proxy hop".
  try {
    const configured = (siteConfig.apiUrl || '').trim();
    if (!configured) {
      // No API host configured → treat as same-origin.
      return '/api/v1';
    }
    const apiHost = new URL(configured, window.location.origin).host;
    const pageHost = window.location.host;
    if (apiHost === pageHost) {
      // Same origin — go direct, no proxy hop needed.
      return '/api/v1';
    }
  } catch {
    // If the URL isn't parseable for any reason, fall through to the
    // proxy path — it's the safer of the two branches.
  }
  return '/api/proxy';
}

/**
 * Public, browser-safe view of resolveBaseUrl for modules that cannot go
 * through apiFetch (e.g. XHR-based uploads with real progress events).
 *
 * HARD RULE: never hard-code `/api/proxy` or `/api/v1` outside api.ts —
 * on besat.me Nginx routes `/api/*` STRAIGHT to Django, so a hand-written
 * `/api/proxy/...` never reaches the Next.js rewrite and dies as a 404
 * inside Django URLconf (this was the production upload-404 bug).
 */
export function resolveBrowserApiBaseUrl(): string {
  return resolveBaseUrl(false);
}

/* ───────────────────────────────────────────────────────────────────────── */
/*  Header helpers                                                            */
/* ───────────────────────────────────────────────────────────────────────── */

function buildHeaders(
  init: RequestInit,
  headersOverride: HeadersInit | undefined,
  skipAuth: boolean,
): HeadersInit {
  const isFormData = init.body instanceof FormData;
  const base: Record<string, string> = {
    Accept: 'application/json',
    'Accept-Language': 'fa-IR',
  };
  // Never set Content-Type on FormData — browser must control boundary.
  if (init.body && !isFormData) base['Content-Type'] = 'application/json';

  // JWT — browser only (server-side calls run without user context here).
  if (!skipAuth && !isServer()) {
    const token = getAccessToken();
    if (token) base['Authorization'] = `Bearer ${token}`;
  }

  return { ...base, ...(headersOverride as Record<string, string> | undefined) };
}

/* ───────────────────────────────────────────────────────────────────────── */
/*  Core client                                                               */
/* ───────────────────────────────────────────────────────────────────────── */

async function rawFetch(
  url: string,
  init: RequestInit,
  next: object | undefined,
): Promise<Response> {
  return fetch(url, {
    ...init,
    ...(next ? ({ next } as unknown as RequestInit) : {}),
  });
}

export async function apiFetch<T = unknown>(path: string, options: FetchOptions = {}): Promise<T> {
  const {
    absolute = false,
    skipAuth = false,
    skipRefresh = false,
    revalidate,
    tags,
    headers,
    ...init
  } = options;

  const base = resolveBaseUrl(absolute);
  const url = `${base}${path.startsWith('/') ? path : `/${path}`}`;

  const nextOptions: { revalidate?: number | false; tags?: string[] } = {};
  if (revalidate !== undefined) nextOptions.revalidate = revalidate;
  if (tags) nextOptions.tags = tags;
  const nextArg = Object.keys(nextOptions).length ? nextOptions : undefined;

  const runOnce = async () => {
    const requestInit = { ...init, headers: buildHeaders(init, headers, skipAuth) };
    let res: Response;
    try {
      res = await rawFetch(url, requestInit, nextArg);
    } catch (err) {
      throw new ApiError(err instanceof Error ? err.message : 'خطای شبکه', 0);
    }
    let payload: ApiEnvelope<T> | null = null;
    try {
      payload = (await res.json()) as ApiEnvelope<T>;
    } catch {
      /* non-JSON (HTML error page) — leave payload = null */
    }
    return { res, payload };
  };

  let { res, payload } = await runOnce();

  // 401 → attempt one refresh + retry cycle (browser only)
  if (
    res.status === 401 &&
    !isServer() &&
    !skipAuth &&
    !skipRefresh &&
    // Never enter a refresh loop while calling the refresh endpoint itself
    !path.startsWith('/auth/token/refresh/')
  ) {
    const refreshed = await refreshAccessToken().catch(() => null);
    if (refreshed) {
      ({ res, payload } = await runOnce());
    } else {
      // Refresh failed → hard sign-out so subsequent calls don't loop
      clearTokens();
    }
  }

  if (!res.ok || (payload && payload.success === false)) {
    throw new ApiError(
      payload?.message || `درخواست با خطا مواجه شد (${res.status})`,
      res.status,
      payload?.errors,
      payload,
    );
  }

  return (payload?.data ?? (payload as unknown)) as T;
}

/**
 * Safe SSR fetch — returns `null` instead of throwing so RSC loaders
 * can render an EmptyState instead of taking the whole page down when
 * the backend is unreachable or returns 5xx.
 */
export async function safeApiFetch<T = unknown>(
  path: string,
  options: FetchOptions = {},
): Promise<T | null> {
  try {
    return await apiFetch<T>(path, options);
  } catch {
    return null;
  }
}

/* ───────────────────────────────────────────────────────────────────────── */
/*  Small convenience helpers                                                 */
/* ───────────────────────────────────────────────────────────────────────── */

export function isApiError(err: unknown): err is ApiError {
  return err instanceof ApiError;
}

/** Extract a flat message string from a DRF `errors` object. */
export function firstErrorMessage(err: unknown): string | null {
  if (!isApiError(err)) return null;
  const e = err.errors;
  if (!e) return err.message || null;
  for (const key of Object.keys(e)) {
    const v = e[key];
    if (typeof v === 'string') return v;
    if (Array.isArray(v) && v.length && typeof v[0] === 'string') return v[0] as string;
  }
  return err.message || null;
}
