/** Canonical fleet values — keep in sync with the public site / seed. */

export const LOCATIONS = [
  { value: 'dubai-marina', label: 'Dubai Marina' },
  { value: 'downtown', label: 'Downtown Dubai' },
  { value: 'palm-jumeirah', label: 'Palm Jumeirah' },
  { value: 'dxb-airport', label: 'DXB Airport' },
];

export const CAR_TYPES = [
  { value: 'essential', label: 'Essential' },
  { value: 'premium', label: 'Premium' },
  { value: 'prestige', label: 'Prestige' },
  { value: 'supercar', label: 'Supercar' },
];

export const BADGE_BY_TYPE = {
  essential: { label: 'ESSENTIEL', className: 'bg-primary/80 text-on-primary' },
  premium: { label: 'PREMIUM', className: 'bg-primary/80 text-on-primary' },
  prestige: { label: 'PRESTIGE', className: 'bg-primary/80 text-on-primary' },
  supercar: { label: 'SUPERCAR', className: 'bg-primary/80 text-on-primary' },
};

/** Allowed booking status transitions (mirrors server bookingStatus.js). */
export const STATUS_TRANSITIONS = {
  pending: ['confirmed', 'rejected', 'cancelled'],
  confirmed: ['active', 'cancelled'],
  active: ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
  rejected: [],
};

export const BOOKING_STATUSES = Object.keys(STATUS_TRANSITIONS);

export function getLocationLabel(value) {
  return LOCATIONS.find((item) => item.value === value)?.label || value || '—';
}

export function getTypeLabel(value) {
  return CAR_TYPES.find((item) => item.value === value)?.label || value || '—';
}

export function defaultBadgesForType(type) {
  const badge = BADGE_BY_TYPE[type];
  return badge ? [badge] : [];
}

/** Convert absolute API media URLs back to portable DB paths (`/uploads/...`). */
export function toStoragePath(src) {
  if (!src || typeof src !== 'string') return '';
  if (src.startsWith('/uploads/')) return src;
  try {
    const path = src.startsWith('http') ? new URL(src).pathname : src;
    if (path.startsWith('/api/uploads/')) return path.slice(4);
    if (path.startsWith('/uploads/')) return path;
  } catch {
    /* ignore */
  }
  const match = src.match(/\/uploads\/.+$/);
  return match ? match[0] : src;
}

export function formatApiError(err) {
  if (!err) return 'Request failed';
  if (typeof err === 'string') return err;
  const details = err.details;
  if (details?.fieldErrors) {
    const fields = Object.entries(details.fieldErrors)
      .flatMap(([key, msgs]) => (Array.isArray(msgs) ? msgs.map((m) => `${key}: ${m}`) : []))
      .filter(Boolean);
    if (fields.length) return `${err.message || 'Validation failed'}: ${fields.join('; ')}`;
  }
  if (details?.formErrors?.length) {
    return `${err.message || 'Validation failed'}: ${details.formErrors.join('; ')}`;
  }
  return err.message || 'Request failed';
}
