export function sanitizeNextPath(
  value: string | null | undefined,
  fallback = "/",
): string {
  const path = (value || "").trim();
  if (!path.startsWith("/") || path.startsWith("//")) return fallback;
  if (/[\r\n\\]/.test(path)) return fallback;
  return path;
}
