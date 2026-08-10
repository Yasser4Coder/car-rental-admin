import { useEffect, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import api from '../api/client';
import { formatApiError, getLocationLabel } from '../data/fleet';
import { resolveMediaUrl } from '../utils/media';

function StatCard({ label, value, hint }) {
  return (
    <div className="rounded-2xl border border-black/8 bg-white p-5">
      <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">{label}</p>
      <p className="mt-2 text-3xl font-bold text-primary">{value}</p>
      {hint && <p className="mt-1 text-sm text-on-surface-variant">{hint}</p>}
    </div>
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

  if (error) return <p className="text-red-700">{error}</p>;
  if (!overview) return <p className="text-on-surface-variant">Loading dashboard…</p>;

  const statusEntries = Object.entries(overview.bookings.byStatus || {});

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Dashboard</h2>
        <p className="text-on-surface-variant">Fleet and booking performance across Dubai.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Active cars" value={overview.cars.active} hint={`${overview.cars.total} total`} />
        <StatCard label="Bookings (30d)" value={overview.bookings.month} hint={`${overview.bookings.today} today`} />
        <StatCard label="Clients" value={overview.clients} />
        <StatCard
          label="Revenue (confirmed+)"
          value={`AED ${Number(overview.revenue).toLocaleString('en-AE')}`}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-black/8 bg-white p-5 lg:col-span-2">
          <h3 className="font-bold">Bookings · last 30 days</h3>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={series}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="day" hide />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="bookings" fill="#003417" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-black/8 bg-white p-5">
          <h3 className="font-bold">By status</h3>
          <ul className="mt-4 space-y-2">
            {statusEntries.length === 0 && (
              <li className="text-sm text-on-surface-variant">No bookings yet</li>
            )}
            {statusEntries.map(([status, count]) => (
              <li key={status} className="flex justify-between text-sm">
                <span className="capitalize text-on-surface-variant">{status}</span>
                <span className="font-bold">{count}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-black/8 bg-white p-5">
          <h3 className="font-bold">Top cars</h3>
          <ul className="mt-4 space-y-3">
            {topCars.map((row) => (
              <li key={row.car?.id} className="flex items-center gap-3">
                <img src={resolveMediaUrl(row.car?.image)} alt="" className="h-12 w-16 rounded-lg object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{row.car?.name}</p>
                  <p className="text-sm text-on-surface-variant">{row.bookings} bookings</p>
                </div>
                <p className="font-bold text-secondary">AED {Number(row.revenue).toLocaleString('en-AE')}</p>
              </li>
            ))}
            {!topCars.length && <li className="text-sm text-on-surface-variant">No data yet</li>}
          </ul>
        </div>

        <div className="rounded-2xl border border-black/8 bg-white p-5">
          <h3 className="font-bold">Pickup areas</h3>
          <ul className="mt-4 space-y-2">
            {locations.map((row) => (
              <li key={row.location} className="flex justify-between text-sm">
                <span>{getLocationLabel(row.location)}</span>
                <span className="font-bold">{row.bookings}</span>
              </li>
            ))}
            {!locations.length && <li className="text-sm text-on-surface-variant">No data yet</li>}
          </ul>
        </div>
      </div>
    </div>
  );
}
