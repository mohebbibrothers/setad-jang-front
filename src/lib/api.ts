/**
 * Shared, envelope-aware API transport for RSC/SSR and browser clients.
 *
 * - Server requests go directly to NEXT_PUBLIC_API_URL.
 * - Browser requests use /api/v1 on the production same-origin deployment,
 *   or /api/proxy when the API is hosted elsewhere.
 * - JWT access tokens are injected in the browser.
 * - One single-flight refresh/retry is attempted after a 401.
 * - Abort errors stay abort errors (important for live search).
 * - Every request has a bounded timeout instead of hanging an SSR render.
 */

import { clearTokens, getAccessToken, refreshAccessToken } from "./auth-tokens";
import { resolveApiUrl } from "./api-url";

export type ApiEnvelope<T> = {
  success: boolean;
  status_code: number;
  message: string;
  data?: T;
  errors?: unknown;
};

export type Paginated<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

export type ApiResult<T> = {
  data: T;
  message: string;
  statusCode: number;
  headers: Headers;
};

export class ApiError extends Error {
  status: number;
  errors?: unknown;
  payload?: ApiEnvelope<unknown> | null;

  constructor(
    message: string,
    status: number,
    errors?: unknown,
    payload?: ApiEnvelope<unknown> | null,
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.errors = errors;
    this.payload = payload ?? null;
  }
}

export type FetchOptions = RequestInit & {
  absolute?: boolean;
  skipAuth?: boolean;
  skipRefresh?: boolean;
  revalidate?: number | false;
  tags?: string[];
  timeoutMs?: number;
};

const DEFAULT_TIMEOUT_MS = 15_000;

function isServer(): boolean {
  return typeof window === "undefined";
}

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException
    ? error.name === "AbortError"
    : Boolean(
        error &&
          typeof error === "object" &&
          "name" in error &&
          error.name === "AbortError",
      );
}

function isEnvelope<T>(value: unknown): value is ApiEnvelope<T> {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<ApiEnvelope<T>>;
  return (
    typeof candidate.success === "boolean" &&
    typeof candidate.status_code === "number" &&
    typeof candidate.message === "string"
  );
}

function buildHeaders(
  init: RequestInit,
  override: HeadersInit | undefined,
  skipAuth: boolean,
): Headers {
  const headers = new Headers(override);
  if (!headers.has("Accept")) headers.set("Accept", "application/json");
  if (!headers.has("Accept-Language")) headers.set("Accept-Language", "fa-IR");

  const formData =
    typeof FormData !== "undefined" && init.body instanceof FormData;
  if (init.body && !formData && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (!skipAuth && !isServer()) {
    const token = getAccessToken();
    if (token) headers.set("Authorization", `Bearer ${token}`);
  }

  return headers;
}

function createBoundedSignal(
  parent: AbortSignal | null | undefined,
  timeoutMs: number,
) {
  const controller = new AbortController();
  let timedOut = false;

  const onAbort = () => controller.abort(parent?.reason);
  if (parent?.aborted) onAbort();
  else parent?.addEventListener("abort", onAbort, { once: true });

  const timer =
    timeoutMs > 0
      ? setTimeout(() => {
          timedOut = true;
          controller.abort(
            new DOMException("Request timed out", "TimeoutError"),
          );
        }, timeoutMs)
      : null;

  return {
    signal: controller.signal,
    timedOut: () => timedOut,
    cleanup: () => {
      if (timer) clearTimeout(timer);
      parent?.removeEventListener("abort", onAbort);
    },
  };
}

async function requestOnce(
  url: string,
  init: RequestInit,
  headers: HeadersInit | undefined,
  skipAuth: boolean,
  next: object | undefined,
  timeoutMs: number,
): Promise<{ response: Response; payload: unknown }> {
  const bounded = createBoundedSignal(init.signal, timeoutMs);
  try {
    const response = await fetch(url, {
      ...init,
      headers: buildHeaders(init, headers, skipAuth),
      signal: bounded.signal,
      ...(next ? ({ next } as unknown as RequestInit) : {}),
    });

    const contentType = response.headers.get("content-type") || "";
    const payload = contentType.includes("json")
      ? await response.json().catch(() => null)
      : null;

    return { response, payload };
  } catch (error) {
    if (isAbortError(error) && !bounded.timedOut()) throw error;
    throw new ApiError(
      bounded.timedOut()
        ? "زمان پاسخ‌گویی سرور بیش از حد طول کشید. لطفاً دوباره تلاش کنید."
        : error instanceof Error
          ? error.message
          : "خطای شبکه",
      0,
    );
  } finally {
    bounded.cleanup();
  }
}

async function performRequest<T>(
  path: string,
  options: FetchOptions,
): Promise<ApiResult<T>> {
  const {
    absolute = false,
    skipAuth = false,
    skipRefresh = false,
    revalidate,
    tags,
    timeoutMs = DEFAULT_TIMEOUT_MS,
    headers,
    ...init
  } = options;

  const url = resolveApiUrl(path, absolute);
  const nextOptions: { revalidate?: number | false; tags?: string[] } = {};
  if (revalidate !== undefined) nextOptions.revalidate = revalidate;
  if (tags?.length) nextOptions.tags = tags;
  const nextArg = Object.keys(nextOptions).length ? nextOptions : undefined;

  const execute = () =>
    requestOnce(url, init, headers, skipAuth, nextArg, timeoutMs);
  let { response, payload } = await execute();

  if (
    response.status === 401 &&
    !isServer() &&
    !skipAuth &&
    !skipRefresh &&
    !path.startsWith("/auth/token/refresh/")
  ) {
    const refreshed = await refreshAccessToken().catch(() => null);
    if (refreshed) ({ response, payload } = await execute());
    else clearTokens();
  }

  const envelope = isEnvelope<T>(payload) ? payload : null;
  if (!response.ok || envelope?.success === false) {
    throw new ApiError(
      envelope?.message || `درخواست با خطا مواجه شد (${response.status})`,
      response.status,
      envelope?.errors,
      envelope as ApiEnvelope<unknown> | null,
    );
  }

  // Health/metrics endpoints intentionally return raw JSON instead of the
  // product envelope. Product endpoints return envelope.data, including null.
  const data = (envelope ? envelope.data : payload) as T;
  return {
    data,
    message: envelope?.message || "",
    statusCode: response.status,
    headers: response.headers,
  };
}

export function apiFetch<T = unknown>(
  path: string,
  options: FetchOptions = {},
): Promise<T> {
  return performRequest<T>(path, options).then((result) => result.data);
}

/** Use when the UI needs the envelope message/status in addition to data. */
export function apiFetchResult<T = unknown>(
  path: string,
  options: FetchOptions = {},
): Promise<ApiResult<T>> {
  return performRequest<T>(path, options);
}

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

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

function findMessage(value: unknown): string | null {
  if (typeof value === "string" && value.trim()) return value;
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findMessage(item);
      if (found) return found;
    }
    return null;
  }
  if (value && typeof value === "object") {
    for (const item of Object.values(value)) {
      const found = findMessage(item);
      if (found) return found;
    }
  }
  return null;
}

export function firstErrorMessage(error: unknown): string | null {
  if (!isApiError(error)) return null;
  return findMessage(error.errors) || error.message || null;
}
