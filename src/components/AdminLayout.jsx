import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  IconBookings,
  IconCars,
  IconClose,
  IconDashboard,
  IconLogout,
  IconMenu,
  IconPayments,
  IconUsers,
  IconVerified,
  IconCategories,
  IconSeo,
} from './icons';

const links = [
  { to: '/', label: 'Dashboard', end: true, icon: IconDashboard, hint: 'Overview & stats' },
  { to: '/cars', label: 'Fleet', end: false, icon: IconCars, hint: 'Inventory & photos' },
  { to: '/bookings', label: 'Bookings', end: false, icon: IconBookings, hint: 'Requests & status' },
  { to: '/payments', label: 'Payments', end: false, icon: IconPayments, hint: 'Cash & Stripe' },
  { to: '/content/vehicle-categories', label: 'Categories', end: false, icon: IconCategories, hint: 'Homepage categories' },
  { to: '/content/why-choose-us', label: 'Why us', end: false, icon: IconVerified, hint: 'Homepage benefits' },
  { to: '/content/seo', label: 'SEO', end: false, icon: IconSeo, hint: 'Homepage SEO copy' },
  { to: '/users', label: 'Users', end: false, icon: IconUsers, hint: 'Clients & admins' },
];

function pageTitle(pathname) {
  if (pathname.startsWith('/cars/new')) return 'Add car';
  if (pathname.startsWith('/cars/') && pathname !== '/cars') return 'Edit car';
  if (pathname.startsWith('/cars')) return 'Fleet';
  if (pathname.startsWith('/bookings')) return 'Bookings';
  if (pathname.startsWith('/payments')) return 'Payments';
  if (pathname.startsWith('/content/vehicle-categories')) return 'Vehicle categories';
  if (pathname.startsWith('/content/why-choose-us')) return 'Why choose us';
  if (pathname.startsWith('/content/seo')) return 'Homepage SEO';
  if (pathname.startsWith('/users')) return 'Users';
  return 'Dashboard';
}

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  const sidebar = (
    <aside className="admin-sidebar">
      <div className="admin-sidebar__brand">
        <div className="admin-sidebar__mark" aria-hidden>
          GR
        </div>
        <div className="min-w-0">
          <p className="admin-sidebar__brand-kicker">Green Rental</p>
          <p className="admin-sidebar__brand-title">Admin</p>
        </div>
        <button
          type="button"
          className="admin-sidebar__close lg:hidden"
          aria-label="Close menu"
          onClick={() => setMobileOpen(false)}
        >
          <IconClose />
        </button>
      </div>

      <nav className="admin-sidebar__nav" aria-label="Main">
        <p className="admin-sidebar__section">Workspace</p>
        {links.map((link) => {
          const Icon = link.icon;
          return (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                `admin-nav-link ${isActive ? 'admin-nav-link--active' : ''}`
              }
            >
              <Icon className="admin-nav-link__icon" />
              <span className="admin-nav-link__text">
                <span className="admin-nav-link__label">{link.label}</span>
                <span className="admin-nav-link__hint">{link.hint}</span>
              </span>
            </NavLink>
          );
        })}
      </nav>

      <div className="admin-sidebar__footer">
        <div className="admin-user">
          <div className="admin-user__avatar" aria-hidden>
            {(user?.fullName || user?.email || 'A').slice(0, 1).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="admin-user__name truncate">{user?.fullName || 'Admin'}</p>
            <p className="admin-user__email truncate">{user?.email}</p>
          </div>
        </div>
        <button type="button" className="admin-logout" onClick={logout}>
          <IconLogout />
          Sign out
        </button>
      </div>
    </aside>
  );

  return (
    <div className="admin-shell">
      <div
        className={`admin-overlay ${mobileOpen ? 'admin-overlay--open' : ''}`}
        onClick={() => setMobileOpen(false)}
        aria-hidden={!mobileOpen}
      />

      <div className={`admin-sidebar-wrap ${mobileOpen ? 'admin-sidebar-wrap--open' : ''}`}>
        {sidebar}
      </div>

      <div className="admin-main">
        <header className="admin-topbar">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              className="admin-icon-btn lg:hidden"
              aria-label="Open menu"
              onClick={() => setMobileOpen(true)}
            >
              <IconMenu />
            </button>
            <div className="min-w-0">
              <p className="admin-topbar__eyebrow">Green Rental Experience · Dubai</p>
              <p className="admin-topbar__title truncate">{pageTitle(location.pathname)}</p>
            </div>
          </div>
          <div className="hidden items-center gap-2 sm:flex">
            <span className="admin-pill">Live fleet</span>
          </div>
        </header>

        <main className="admin-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
