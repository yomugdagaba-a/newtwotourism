/**
 * Converts a stored image URL (which may be a relative /uploads/... path)
 * to a full URL.
 *
 * For /uploads/ paths: routes through the Next.js image-proxy API route so
 * the browser never makes a direct cross-origin request to the backend.
 * This fixes the self-signed cert issue in local dev AND works in production.
 *
 * For external URLs (http/https): passes through unchanged.
 */
export function getImageUrl(imageUrl: string | null | undefined, fallback = ''): string {
  if (!imageUrl) return fallback;

  // blob: URLs are only valid in the current browser session — never store them.
  // If one slips through from the DB, treat it as missing.
  if (imageUrl.startsWith('blob:')) {
    return fallback;
  }

  // data: URLs (base64 previews) — use as-is
  if (imageUrl.startsWith('data:')) {
    return imageUrl;
  }

  // Already a full external URL — pass through unchanged
  if (imageUrl.startsWith('http')) {
    // If it's pointing to the backend /uploads/ path, proxy it
    // e.g. https://localhost:9001/uploads/... → /api/image-proxy?path=/uploads/...
    try {
      const url = new URL(imageUrl);
      if (url.pathname.startsWith('/uploads/')) {
        return `/api/image-proxy?path=${encodeURIComponent(url.pathname)}`;
      }
    } catch {
      // not a valid URL, fall through
    }
    return imageUrl;
  }

  // Relative path stored on backend (e.g. /uploads/tourism-images/abc.jpg)
  const path = imageUrl.startsWith('/') ? imageUrl : `/${imageUrl}`;
  if (path.startsWith('/uploads/')) {
    // Route through proxy — same origin, no cert issues
    return `/api/image-proxy?path=${encodeURIComponent(path)}`;
  }

  // Other relative paths — prepend backend base URL directly
  const backendBase = (process.env.NEXT_PUBLIC_API_URL || 'https://localhost:9001/api').replace('/api', '');
  return `${backendBase}${path}`;
}
