const ABSOLUTE_URL_REGEX = /^(https?:)?\/\//i;

export function resolveProfileImageUrl(url?: string | null): string {
  if (!url) return "";
  if (ABSOLUTE_URL_REGEX.test(url) || url.startsWith("data:")) {
    return url;
  }
  const base = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "";
  const normalized = url.startsWith("/") ? url : `/${url}`;
  return base ? `${base}${normalized}` : normalized;
}
