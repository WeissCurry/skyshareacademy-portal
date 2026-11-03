/**
 * Helper to resolve asset URLs (e.g. /files/<token> or /uploads/...)
 * ensuring they point to the correct API base URL when relative.
 */
export function resolveAssetUrl(path?: string | null): string {
  if (!path) return "";
  if (
    path.startsWith("http://") ||
    path.startsWith("https://") ||
    path.startsWith("blob:") ||
    path.startsWith("data:")
  ) {
    return path;
  }

  const apiBase =
    import.meta.env.VITE_API_BASE_URL ||
    (import.meta.env.DEV ? "http://localhost:3002" : "");
  const cleanBase = apiBase.endsWith("/") ? apiBase.slice(0, -1) : apiBase;
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${cleanBase}${cleanPath}`;
}
