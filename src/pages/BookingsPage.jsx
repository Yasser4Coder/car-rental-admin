import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import {
  BOOKING_STATUSES,
  STATUS_TRANSITIONS,
  formatApiError,
  getLocationLabel,
} from '../data/fleet';

export default function BookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [selected, setSelected] = useState(null);
  const [status, setStatus] = useState('');
  const [q, setQ] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [nextStatus, setNextStatus] = useState('');

  const allowedNext = useMemo(() => {
    if (!selected) return [];
    return STATUS_TRANSITIONS[selected.status] || [];
  }, [selected]);

  const load = () => {
    setError('');
    const params = new URLSearchParams({ limit: '100' });
    if (status) params.set('status', status);
    if (q.trim()) params.set('q', q.trim());
    api
      .get(`/admin/bookings?${params}`)
      .then((res) => setBookings(res.data || []))
      .catch((err) => setError(formatApiError(err)));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setNextStatus(allowedNext[0] || '');
  }, [allowedNext]);

  const openDetail = async (id) => {
    setError('');
    try {
      const res = await api.get(`/admin/bookings/${id}`);
      setSelected(res.data);
      setNote('');
    } catch (err) {
      setError(formatApiError(err));
    }
  };

  const changeStatus = async () => {
    if (!selected || !nextStatus) return;
    try {
      const res = await api.patch(`/admin/bookings/${selected.id}/status`, {
        status: nextStatus,
        note: note || null,
      });
      setSelected(res.data);
      load();
    } catch (err) {
      setError(formatApiError(err));
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold">Bookings</h2>
        <p className="text-on-surface-variant">
          Track client requests from the website and update status with a full history.
        </p>
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-black/8 bg-white p-4 sm:flex-row">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && load()}
          placeholder="Search code, name, email, phone"
          className="min-h-11 flex-1 rounded-xl border border-black/10 bg-surface px-3"
        />
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="min-h-11 rounded-xl border border-black/10 bg-surface px-3 capitalize"
        >
          <option value="">All statuses</option>
          {BOOKING_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <button type="button" onClick={load} className="min-h-11 rounded-xl bg-primary px-4 font-bold text-white">
          Filter
        </button>
      </div>

      {error && <p className="text-red-700">{error}</p>}

      <div className="grid gap-5 lg:grid-cols-5">
        <div className="overflow-x-auto rounded-2xl border border-black/8 bg-white lg:col-span-3">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-black/8 bg-surface-container text-xs uppercase tracking-widest text-on-surface-variant">
              <tr>
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Client</th>
                <th className="px-4 py-3">Car</th>
                <th className="px-4 py-3">Dates</th>
                <th className="px-4 py-3">Area</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b) => (
                <tr
                  key={b.id}
                  className="cursor-pointer border-b border-black/5 hover:bg-surface-container/60"
                  onClick={() => openDetail(b.id)}
                >
                  <td className="px-4 py-3 font-semibold">{b.code}</td>
                  <td className="px-4 py-3">
                    <p>{b.fullName}</p>
                    <p className="text-on-surface-variant">{b.email}</p>
                  </td>
                  <td className="px-4 py-3">{b.car?.name || b.carId}</td>
                  <td className="px-4 py-3">
                    {b.pickupDate} → {b.returnDate}
                  </td>
                  <td className="px-4 py-3">{getLocationLabel(b.location)}</td>
                  <td className="px-4 py-3 capitalize">{b.status}</td>
                </tr>
              ))}
              {!bookings.length && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-on-surface-variant">
                    No bookings found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="rounded-2xl border border-black/8 bg-white p-5 lg:col-span-2">
          {!selected ? (
            <p className="text-on-surface-variant">Select a booking to view details.</p>
          ) : (
            <div className="space-y-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                  {selected.code}
                </p>
                <h3 className="text-xl font-bold">{selected.car?.name}</h3>
                <p className="text-sm text-on-surface-variant capitalize">Status: {selected.status}</p>
              </div>

              <dl className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <dt className="text-on-surface-variant">Client</dt>
                  <dd className="font-semibold">{selected.fullName}</dd>
                </div>
                <div>
                  <dt className="text-on-surface-variant">Phone</dt>
                  <dd className="font-semibold">{selected.phone}</dd>
                </div>
                <div>
                  <dt className="text-on-surface-variant">Email</dt>
                  <dd className="font-semibold break-all">{selected.email}</dd>
                </div>
                <div>
                  <dt className="text-on-surface-variant">Pickup area</dt>
                  <dd className="font-semibold">{getLocationLabel(selected.location)}</dd>
                </div>
                <div>
                  <dt className="text-on-surface-variant">Pickup</dt>
                  <dd className="font-semibold">{selected.pickupDate}</dd>
                </div>
                <div>
                  <dt className="text-on-surface-variant">Return</dt>
                  <dd className="font-semibold">{selected.returnDate}</dd>
                </div>
                <div>
                  <dt className="text-on-surface-variant">Delivery</dt>
                  <dd className="font-semibold capitalize">{selected.delivery}</dd>
                </div>
                <div>
                  <dt className="text-on-surface-variant">Total</dt>
                  <dd className="font-semibold text-secondary">AED {selected.total}</dd>
                </div>
              </dl>

              {selected.notes && (
                <p className="rounded-xl bg-surface-container p-3 text-sm">
                  <strong>Notes:</strong> {selected.notes}
                </p>
              )}

              <div>
                <h4 className="font-bold">Status history</h4>
                <ul className="mt-2 space-y-2 text-sm">
                  {(selected.statusHistory || []).map((item, idx) => (
                    <li key={`${item.at}-${idx}`} className="rounded-lg border border-black/8 p-2">
                      <p className="font-semibold capitalize">
                        {item.from || '—'} → {item.to}
                      </p>
                      <p className="text-on-surface-variant">
                        {item.by} · {new Date(item.at).toLocaleString()}
                      </p>
                      {item.note && <p>{item.note}</p>}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="space-y-2 border-t border-black/8 pt-4">
                <h4 className="font-bold">Update status</h4>
                {allowedNext.length === 0 ? (
                  <p className="text-sm text-on-surface-variant">
                    This booking is closed — no further status changes.
                  </p>
                ) : (
                  <>
                    <select
                      value={nextStatus}
                      onChange={(e) => setNextStatus(e.target.value)}
                      className="w-full rounded-xl border border-black/10 bg-surface px-3 py-2.5 capitalize"
                    >
                      {allowedNext.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                    <textarea
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="Optional note for history"
                      className="min-h-20 w-full rounded-xl border border-black/10 bg-surface px-3 py-2.5"
                    />
                    <button
                      type="button"
                      onClick={changeStatus}
                      className="w-full rounded-xl bg-primary py-3 text-sm font-bold uppercase tracking-widest text-white"
                    >
                      Apply status
                    </button>
                  </>
                )}
                {selected.carId && (
                  <Link
                    to={`/cars/${selected.carId}`}
                    className="block text-center text-sm font-semibold text-secondary"
                  >
                    View car
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
