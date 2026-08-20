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

export const BOOKING_PAYMENT_STATUSES = [
  { value: 'unpaid', label: 'Unpaid' },
  { value: 'deposit_held', label: 'Deposit held' },
  { value: 'paid', label: 'Paid' },
  { value: 'refunded', label: 'Refunded' },
];

export const POPULAR_BADGES = [
  { value: 'best_seller', label: 'Best Seller' },
  { value: 'most_booked', label: 'Most Booked' },
  { value: 'new_arrival', label: 'New Arrival' },
  { value: 'limited_availability', label: 'Limited Availability' },
];

export const WHY_CHOOSE_ICONS = [
  'local_shipping',
  'payments',
  'directions_car',
  'support_agent',
  'verified',
  'speed',
  'lock',
  'event_available',
  'check_circle',
  'star',
];

export const CATEGORY_ICONS = [
  'directions_car',
  'airline_seat_recline_normal',
  'verified',
  'speed',
  'star',
  'bolt',
  'local_shipping',
];

export function paymentStatusLabel(value) {
  return (
    BOOKING_PAYMENT_STATUSES.find((item) => item.value === value)?.label ||
    String(value || 'unpaid').replace(/_/g, ' ')
  );
}

export function formatMoneyAed(amount) {
  const n = Number(amount);
  if (!Number.isFinite(n)) return 'AED —';
  return `AED ${n.toLocaleString('en-AE')}`;
}

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
