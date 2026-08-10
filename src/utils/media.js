/**
 * Resolve car/upload image paths for production.
 * DB stores "/uploads/...", but the admin app is on a different host than the API.
 */
const API_URL = import.meta.env.VITE_API_URL || '/api';

function apiOrigin() {
  if (!API_URL.startsWith('http')) return '';
  return API_URL.replace(/\/api\/?$/, '');
}

export function resolveMediaUrl(src) {
  if (!src || typeof src !== 'string') return '';
  if (/^https?:\/\//i.test(src) || src.startsWith('data:') || src.startsWith('blob:')) {
    return src;
  }
  const origin = apiOrigin();
  let path = src.startsWith('/') ? src : `/${src}`;
  if (origin && path.startsWith('/uploads/')) {
    path = `/api${path}`;
  }
  return origin ? `${origin}${path}` : path;
}
