import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import api from '../api/client';
import {
  BOOKING_PAYMENT_STATUSES,
  BOOKING_STATUSES,
  STATUS_TRANSITIONS,
  formatApiError,
  getLocationLabel,
  paymentStatusLabel,
} from '../data/fleet';

function asStatusHistory(value) {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

export default function BookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [selected, setSelected] = useState(null);
  const [status, setStatus] = useState('');
  const [q, setQ] = useState('');
  const [note, setNote] = useState('');
  const [paymentNote, setPaymentNote] = useState('');
  const [error, setError] = useState('');
  const [nextStatus, setNextStatus] = useState('');
  const [nextPaymentStatus, setNextPaymentStatus] = useState('paid');

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
      setPaymentNote('');
      setNextPaymentStatus(
        res.data.paymentStatus === 'unpaid' ? 'paid' : res.data.paymentStatus || 'paid',
      );
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

  const changePaymentStatus = async () => {
    if (!selected || !nextPaymentStatus) return;
    try {
      const res = await api.patch(`/admin/bookings/${selected.id}/payment-status`, {
        paymentStatus: nextPaymentStatus,
        note: paymentNote || null,
      });
      setSelected(res.data);
      setPaymentNote('');
      load();
    } catch (err) {
      setError(formatApiError(err));
    }
  };

  return (
    <div>
      <PageHeader
        title="Bookings"
        description="Track client requests from the website and update status with a full history."
      />

      <div className="admin-card mb-5 flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
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
        <button type="button" onClick={load} className="admin-btn admin-btn--primary">
          Filter
        </button>
      </div>

      {error && <p className="mb-4 text-red-700">{error}</p>}

      <div className="grid gap-5 lg:grid-cols-5">
        <div className="admin-card admin-table-wrap lg:col-span-3">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Client</th>
                <th>Car</th>
                <th>Dates</th>
                <th>Area</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b) => (
                <tr
                  key={b.id}
                  className={`is-clickable ${selected?.id === b.id ? 'is-selected' : ''}`}
                  onClick={() => openDetail(b.id)}
                >
                  <td className="admin-table__mono">{b.code}</td>
                  <td>
                    <p className="admin-table__primary">{b.fullName}</p>
                    <p className="admin-table__secondary truncate max-w-[11rem]">{b.email}</p>
                  </td>
                  <td>
                    <p className="admin-table__primary truncate max-w-[10rem]">{b.car?.name || b.carId}</p>
                  </td>
                  <td>
                    <p className="admin-table__primary whitespace-nowrap">{b.pickupDate}</p>
                    <p className="admin-table__secondary whitespace-nowrap">to {b.returnDate}</p>
                  </td>
                  <td>{getLocationLabel(b.location)}</td>
                  <td>
                    <div className="admin-chip-row">
                      <span className={`admin-status admin-status--${b.status}`}>{b.status}</span>
                      <span className={`admin-status admin-status--${b.paymentStatus || 'unpaid'}`}>
                        {paymentStatusLabel(b.paymentStatus)}
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
              {!bookings.length && (
                <tr>
                  <td colSpan={6} className="admin-table__empty">
                    No bookings found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="admin-card p-5 lg:col-span-2">
          {!selected ? (
            <p className="text-on-surface-variant">Select a booking to view details.</p>
          ) : (
            <div className="space-y-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                  {selected.code}
                </p>
                <h3 className="text-xl font-bold text-primary">{selected.car?.name}</h3>
                <p className="mt-2 flex flex-wrap items-center gap-2">
                  <span className={`admin-status admin-status--${selected.status}`}>{selected.status}</span>
                  <span
                    className={`admin-status admin-status--${selected.paymentStatus || 'unpaid'}`}
                  >
                    {paymentStatusLabel(selected.paymentStatus)}
                  </span>
                </p>
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
                <div>
                  <dt className="text-on-surface-variant">Payment</dt>
                  <dd className="font-semibold capitalize">
                    {paymentStatusLabel(selected.paymentStatus)}
                  </dd>
                </div>
                {selected.stripePaymentIntentId && (
                  <div className="col-span-2">
                    <dt className="text-on-surface-variant">Stripe PI</dt>
                    <dd className="font-mono text-xs break-all">{selected.stripePaymentIntentId}</dd>
                  </div>
                )}
              </dl>

              {Array.isArray(selected.payments) && selected.payments.length > 0 && (
                <div>
                  <h4 className="font-bold">Stripe attempts</h4>
                  <ul className="mt-2 space-y-2 text-sm">
                    {selected.payments.map((p) => (
                      <li key={p.id} className="rounded-lg border border-black/8 p-2">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className={`admin-status admin-status--stripe-${p.status}`}>
                            {String(p.status).replace(/_/g, ' ')}
                          </span>
                          <span className="font-semibold">AED {p.amount}</span>
                        </div>
                        {p.stripePaymentIntentId && (
                          <p className="mt-1 font-mono text-[11px] break-all text-on-surface-variant">
                            {p.stripePaymentIntentId}
                          </p>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {selected.notes && (
                <p className="rounded-xl bg-surface-container p-3 text-sm">
                  <strong>Notes:</strong> {selected.notes}
                </p>
              )}

              <div>
                <h4 className="font-bold">Status history</h4>
                <ul className="mt-2 space-y-2 text-sm">
                  {asStatusHistory(selected.statusHistory).map((item, idx) => (
                    <li key={`${item?.at || 'h'}-${idx}`} className="rounded-lg border border-black/8 p-2">
                      <p className="font-semibold capitalize">
                        {item.from || '—'} → {item.to}
                      </p>
                      <p className="text-on-surface-variant">
                        {item.by} · {item.at ? new Date(item.at).toLocaleString() : '—'}
                      </p>
                      {item.note && <p>{item.note}</p>}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="space-y-2 border-t border-black/8 pt-4">
                <h4 className="font-bold">Update payment</h4>
                <select
                  value={nextPaymentStatus}
                  onChange={(e) => setNextPaymentStatus(e.target.value)}
                  className="w-full rounded-xl border border-black/10 bg-surface px-3 py-2.5 capitalize"
                >
                  {BOOKING_PAYMENT_STATUSES.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
                <textarea
                  value={paymentNote}
                  onChange={(e) => setPaymentNote(e.target.value)}
                  placeholder="Optional payment note (cash, bank transfer…)"
                  className="min-h-16 w-full rounded-xl border border-black/10 bg-surface px-3 py-2.5"
                />
                <button
                  type="button"
                  onClick={changePaymentStatus}
                  disabled={nextPaymentStatus === (selected.paymentStatus || 'unpaid')}
                  className="admin-btn admin-btn--primary w-full"
                >
                  Apply payment status
                </button>
                <Link to="/payments" className="block text-center text-sm font-semibold text-secondary">
                  Open payments workspace
                </Link>
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
                    <button type="button" onClick={changeStatus} className="admin-btn admin-btn--primary w-full">
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
