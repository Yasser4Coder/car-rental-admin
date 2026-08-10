/** Lightweight inline icons for the admin shell (no extra dependency). */

const base = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: '1.9',
  width: 16,
  height: 16,
  'aria-hidden': true,
};

export function IconDashboard({ className }) {
  return (
    <svg {...base} className={className}>
      <path d="M4 4h7v7H4V4zm9 0h7v5h-7V4zM4 13h7v7H4v-7zm9 3h7v4h-7v-4z" strokeLinejoin="round" />
    </svg>
  );
}

export function IconCars({ className }) {
  return (
    <svg {...base} className={className}>
      <path d="M3 13l2-5a3 3 0 012.8-2h8.4A3 3 0 0119 8l2 5" strokeLinecap="round" />
      <path d="M3 13h18v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4z" strokeLinejoin="round" />
      <circle cx="7.5" cy="17" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="16.5" cy="17" r="1.2" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function IconBookings({ className }) {
  return (
    <svg {...base} className={className}>
      <rect x="4" y="5" width="16" height="15" rx="2" />
      <path d="M8 3v4M16 3v4M4 10h16" strokeLinecap="round" />
    </svg>
  );
}

export function IconMenu({ className }) {
  return (
    <svg {...base} className={className}>
      <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
    </svg>
  );
}

export function IconClose({ className }) {
  return (
    <svg {...base} className={className}>
      <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
    </svg>
  );
}

export function IconLogout({ className }) {
  return (
    <svg {...base} className={className}>
      <path d="M10 7V5a2 2 0 012-2h7v18h-7a2 2 0 01-2-2v-2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M15 12H3m0 0l3-3m-3 3l3 3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconUsers({ className }) {
  return (
    <svg {...base} className={className}>
      <path d="M16 19v-1.2A3.8 3.8 0 0012.2 14H7.8A3.8 3.8 0 004 17.8V19" strokeLinecap="round" />
      <circle cx="10" cy="8" r="3" />
      <path d="M20 19v-1a3 3 0 00-2.1-2.9" strokeLinecap="round" />
      <path d="M16.5 5.2a3 3 0 010 5.6" strokeLinecap="round" />
    </svg>
  );
}

export function IconPlus({ className }) {
  return (
    <svg {...base} className={className}>
      <path d="M12 5v14M5 12h14" strokeLinecap="round" />
    </svg>
  );
}

export function IconTrend({ className }) {
  return (
    <svg {...base} className={className}>
      <path d="M4 16l5-5 4 4 7-7" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M14 8h6v6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
