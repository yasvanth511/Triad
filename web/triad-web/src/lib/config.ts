const fallbackOrigin = "http://localhost:5127";

export const apiOrigin =
  process.env.NEXT_PUBLIC_API_ORIGIN?.replace(/\/+$/, "") || fallbackOrigin;

export const apiBaseUrl = `${apiOrigin}/api`;

export function resolveMediaUrl(path?: string | null) {
  if (!path) {
    return null;
  }

  if (/^https?:\/\//i.test(path) || path.startsWith("data:")) {
    return path;
  }

  return `${apiOrigin}${path.startsWith("/") ? path : `/${path}`}`;
}
