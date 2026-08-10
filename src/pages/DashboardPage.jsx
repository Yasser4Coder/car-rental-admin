import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import PageHeader from '../components/PageHeader';
import { IconBookings, IconCars, IconPlus } from '../components/icons';
import api from '../api/client';
import { formatApiError, getLocationLabel } from '../data/fleet';
import { resolveMediaUrl } from '../utils/media';

function StatCard({ label, value, hint }) {
  return (
    <div className="admin-card admin-stat">
      <p className="admin-stat__label">{label}</p>
      <p className="admin-stat__value">{value}</p>
      {hint && <p className="admin-stat__hint">{hint}</p>}
    </div>
  );
}

function Panel({ title, action, children, className = '' }) {
  return (
    <section className={`admin-card p-5 ${className}`}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-base font-bold text-primary">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

export default function DashboardPage() {
  const [overview, setOverview] = useState(null);
  const [series, setSeries] = useState([]);
  const [topCars, setTopCars] = useState([]);
  const [locations, setLocations] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      api.get('/admin/stats/overview'),
      api.get('/admin/stats/timeseries?range=30d'),
      api.get('/admin/stats/top-cars'),
      api.get('/admin/stats/locations'),
    ])
      .then(([o, t, c, l]) => {
        setOverview(o.data);
        setSeries(t.data);
        setTopCars(c.data);
        setLocations(l.data);
      })
      .catch((err) => setError(formatApiError(err)));
  }, []);

  if (error) {
    return (
      <div className="admin-card p-5 text-red-700">
        <p className="font-semibold">Could not load dashboard</p>
        <p className="mt-1 text-sm">{error}</p>
      </div>
    );
  }

  if (!overview) {
    return <p className="text-on-surface-variant">Loading dashboard…</p>;
  }

  const statusEntries = Object.entries(overview.bookings.byStatus || {});
  const maxLocation = Math.max(...locations.map((row) => Number(row.bookings) || 0), 1);

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Fleet performance and booking activity across Dubai."
        actions={
          <>
            <Link to="/cars/new" className="admin-btn admin-btn--primary">
              <IconPlus className="h-4 w-4" />
              Add car
            </Link>
            <Link to="/bookings" className="admin-btn admin-btn--ghost">
              <IconBookings className="h-4 w-4" />
              Bookings
            </Link>
          </>
        }
      />

      <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Active cars" value={overview.cars.active} hint={`${overview.cars.total} in catalog`} />
        <StatCard
          label="Bookings · 30d"
          value={overview.bookings.month}
          hint={`${overview.bookings.today} today`}
        />
        <StatCard label="Clients" value={overview.clients} hint="Registered accounts" />
        <StatCard
          label="Revenue"
          value={`AED ${Number(overview.revenue).toLocaleString('en-AE')}`}
          hint="Confirmed & beyond"
        />
      </div>

      <div className="mb-5 grid gap-3 sm:grid-cols-2">
        <Link
          to="/cars"
          className="admin-card flex items-center gap-3 p-4 no-underline transition hover:border-secondary/30"
        >
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary">
            <IconCars />
          </span>
          <span>
            <span className="block font-bold text-primary">Manage fleet</span>
            <span className="text-sm text-on-surface-variant">Photos, types, featured cars</span>
          </span>
        </Link>
        <Link
          to="/bookings"
          className="admin-card flex items-center gap-3 p-4 no-underline transition hover:border-secondary/30"
        >
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-secondary/10 text-secondary">
            <IconBookings />
          </span>
          <span>
            <span className="block font-bold text-primary">Review bookings</span>
            <span className="text-sm text-on-surface-variant">Confirm, activate, complete</span>
          </span>
        </Link>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Panel title="Bookings · last 30 days" className="lg:col-span-2">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={series}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,52,23,0.08)" />
                <XAxis dataKey="day" hide />
                <YAxis allowDecimals={false} width={28} tick={{ fontSize: 11, fill: '#4a534c' }} />
                <Tooltip
                  contentStyle={{
                    borderRadius: 12,
                    border: '1px solid rgba(0,52,23,0.1)',
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="bookings" fill="#003417" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title="By status">
          <ul className="space-y-2.5">
            {statusEntries.length === 0 && (
              <li className="text-sm text-on-surface-variant">No bookings yet</li>
            )}
            {statusEntries.map(([status, count]) => (
              <li key={status} className="flex items-center justify-between gap-3 text-sm">
                <span className={`admin-status admin-status--${status}`}>{status}</span>
                <span className="font-bold text-primary">{count}</span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Panel
          title="Top cars"
          action={
            <Link to="/cars" className="text-sm font-semibold text-secondary hover:underline">
              View all
            </Link>
          }
        >
          <ul className="space-y-3">
            {topCars.map((row) => (
              <li key={row.car?.id} className="flex items-center gap-3">
                <img
                  src={resolveMediaUrl(row.car?.image)}
                  alt=""
                  className="h-12 w-16 rounded-lg object-cover bg-surface-container"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-primary">{row.car?.name}</p>
                  <p className="text-sm text-on-surface-variant">{row.bookings} bookings</p>
                </div>
                <p className="font-bold text-secondary">
                  AED {Number(row.revenue).toLocaleString('en-AE')}
                </p>
              </li>
            ))}
            {!topCars.length && <li className="text-sm text-on-surface-variant">No data yet</li>}
          </ul>
        </Panel>

        <Panel title="Pickup areas">
          <ul className="space-y-3">
            {locations.map((row) => (
              <li key={row.location}>
                <div className="mb-1 flex justify-between text-sm">
                  <span className="font-medium">{getLocationLabel(row.location)}</span>
                  <span className="font-bold text-primary">{row.bookings}</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-surface-container">
                  <div
                    className="h-full rounded-full bg-secondary"
                    style={{ width: `${(Number(row.bookings) / maxLocation) * 100}%` }}
                  />
                </div>
              </li>
            ))}
            {!locations.length && <li className="text-sm text-on-surface-variant">No data yet</li>}
          </ul>
        </Panel>
      </div>
    </div>
  );
}
