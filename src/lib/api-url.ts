import { siteConfig } from "./site";

/**
 * Pure URL selector used by both the API client and the token refresher.
 * Keeping it in a dependency-free module prevents the auth ↔ API circular
 * import that previously forced refresh requests to bypass the same-origin
 * proxy.
 */
export function selectApiBase(
  configuredApiUrl: string,
  currentOrigin: string | null,
  serverSide: boolean,
  absolute = false,
): string {
  const configured = configuredApiUrl.trim().replace(/\/+$/, "");

  if (serverSide || absolute) {
    return `${configured || "http://127.0.0.1:8000"}/api/v1`;
  }

  if (!configured) return "/api/v1";
  if (!/^https?:\/\//i.test(configured)) return "/api/proxy";

  try {
    const pageOrigin = currentOrigin || "http://localhost";
    const api = new URL(configured, pageOrigin);
    const page = new URL(pageOrigin);
    return api.origin === page.origin ? "/api/v1" : "/api/proxy";
  } catch {
    return "/api/proxy";
  }
}

export function resolveApiBase(absolute = false): string {
  const serverSide = typeof window === "undefined";
  const currentOrigin = serverSide ? null : window.location.origin;
  return selectApiBase(siteConfig.apiUrl, currentOrigin, serverSide, absolute);
}

export function resolveApiUrl(path: string, absolute = false): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${resolveApiBase(absolute)}${normalizedPath}`;
}
