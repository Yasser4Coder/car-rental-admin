import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import { IconPlus } from '../components/icons';
import api from '../api/client';
import { CAR_TYPES, formatApiError, getTypeLabel } from '../data/fleet';
import { resolveMediaUrl } from '../utils/media';

const PAGE_SIZE = 50;

export default function CarsPage() {
  const [cars, setCars] = useState([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, totalPages: 1 });
  const [q, setQ] = useState('');
  const [type, setType] = useState('any');
  const [page, setPage] = useState(1);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = (nextPage = page) => {
    setLoading(true);
    setError('');
    const params = new URLSearchParams({
      limit: String(PAGE_SIZE),
      page: String(nextPage),
    });
    if (q.trim()) params.set('q', q.trim());
    if (type !== 'any') params.set('type', type);
    api
      .get(`/admin/cars?${params}`)
      .then((res) => {
        setCars(res.data || []);
        setMeta({
          total: res.meta?.total ?? res.data?.length ?? 0,
          page: res.meta?.page ?? nextPage,
          totalPages: res.meta?.totalPages || 1,
        });
      })
      .catch((err) => setError(formatApiError(err)))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load(1);
    setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- initial load only
  }, []);

  const runFilter = () => {
    setPage(1);
    load(1);
  };

  const goPage = (next) => {
    setPage(next);
    load(next);
  };

  const toggleActive = async (car) => {
    try {
      await api.patch(`/admin/cars/${car.id}`, { isActive: !car.isActive });
      load(page);
    } catch (err) {
      setError(formatApiError(err));
    }
  };

  const toggleFeatured = async (car) => {
    try {
      await api.patch(`/admin/cars/${car.id}`, { featured: !car.featured });
      load(page);
    } catch (err) {
      setError(formatApiError(err));
    }
  };

  const remove = async (car) => {
    if (!window.confirm(`Delete or deactivate ${car.name}?`)) return;
    try {
      await api.delete(`/admin/cars/${car.id}`);
      load(page);
    } catch (err) {
      setError(formatApiError(err));
    }
  };

  return (
    <div>
      <PageHeader
        title="Fleet"
        description="Inventory shown on Featured Fleet, /cars, and detail pages."
        actions={
          <Link to="/cars/new" className="admin-btn admin-btn--primary">
            <IconPlus className="h-4 w-4" />
            Add car
          </Link>
        }
      />

      <div className="admin-card mb-4 flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && runFilter()}
          placeholder="Search brand or model"
          className="min-h-11 flex-1 rounded-xl border border-black/10 bg-surface px-3 outline-none focus:border-secondary"
        />
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="min-h-11 rounded-xl border border-black/10 bg-surface px-3"
        >
          <option value="any">All types</option>
          {CAR_TYPES.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
        <button type="button" onClick={runFilter} className="admin-btn admin-btn--ghost">
          Filter
        </button>
      </div>

      {error && <p className="mb-4 text-red-700">{error}</p>}
      {loading ? (
        <p className="text-on-surface-variant">Loading cars…</p>
      ) : (
        <>
          <p className="mb-3 text-sm text-on-surface-variant">
            <span className="font-bold text-on-surface">{meta.total}</span> vehicles in catalog
          </p>
          <div className="admin-card overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-black/8 bg-surface-container/70 text-xs uppercase tracking-widest text-on-surface-variant">
                <tr>
                  <th className="px-4 py-3">Car</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Price</th>
                  <th className="px-4 py-3">Flags</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {cars.map((car) => (
                  <tr key={car.id} className="border-b border-black/5 align-middle last:border-0">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={resolveMediaUrl(car.image)}
                          alt=""
                          className="h-12 w-16 rounded-lg object-cover bg-surface-container"
                        />
                        <div>
                          <p className="font-semibold text-primary">{car.name}</p>
                          <p className="text-on-surface-variant">
                            {car.brand} · {car.year}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">{getTypeLabel(car.type)}</td>
                    <td className="px-4 py-3 font-semibold">AED {car.price}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {car.featured && (
                          <span className="rounded-full bg-secondary-container/60 px-2 py-0.5 text-xs font-bold text-primary">
                            Featured
                          </span>
                        )}
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                            car.isActive ? 'bg-primary/10 text-primary' : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {car.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <Link to={`/cars/${car.id}`} className="font-semibold text-secondary hover:underline">
                          Edit
                        </Link>
                        <button
                          type="button"
                          onClick={() => toggleFeatured(car)}
                          className="font-semibold text-primary"
                        >
                          {car.featured ? 'Unfeature' : 'Feature'}
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleActive(car)}
                          className="font-semibold text-primary"
                        >
                          {car.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                        <button type="button" onClick={() => remove(car)} className="font-semibold text-red-700">
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!cars.length && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-on-surface-variant">
                      No cars match this filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {meta.totalPages > 1 && (
            <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => goPage(page - 1)}
                className="admin-btn admin-btn--ghost disabled:opacity-40"
              >
                Previous
              </button>
              <p className="text-sm text-on-surface-variant">
                Page {meta.page} of {meta.totalPages}
              </p>
              <button
                type="button"
                disabled={page >= meta.totalPages}
                onClick={() => goPage(page + 1)}
                className="admin-btn admin-btn--ghost disabled:opacity-40"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
