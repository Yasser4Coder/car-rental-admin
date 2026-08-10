import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import api from '../api/client';
import { useToast } from '../context/ToastContext';
import {
  BOOKING_PAYMENT_STATUSES,
  formatApiError,
  formatMoneyAed,
  getLocationLabel,
  paymentStatusLabel,
} from '../data/fleet';

const PAGE_SIZE = 25;

function asHistory(value) {
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

function formatDateTime(value) {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleString('en-AE', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '—';
  }
}

function StatCard({ label, value, hint, active, onClick }) {
  return (
    <button
      type="button"
      className={`admin-card admin-stat text-left ${active ? 'ring-2 ring-secondary/40' : ''}`}
      onClick={onClick}
    >
      <p className="admin-stat__label">{label}</p>
      <p className="admin-stat__value">{value}</p>
      {hint && <p className="admin-stat__hint">{hint}</p>}
    </button>
  );
}

export default function PaymentsPage() {
  const toast = useToast();
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, totalPages: 1 });
  const [stats, setStats] = useState(null);
  const [q, setQ] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [selected, setSelected] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [nextPaymentStatus, setNextPaymentStatus] = useState('paid');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  const load = (nextPage = page, statusFilter = paymentStatus) => {
    setLoading(true);
    setError('');
    const params = new URLSearchParams({
      limit: String(PAGE_SIZE),
      page: String(nextPage),
    });
    if (q.trim()) params.set('q', q.trim());
    if (statusFilter) params.set('paymentStatus', statusFilter);

    api
      .get(`/admin/payments?${params}`)
      .then((res) => {
        setRows(res.data || []);
        setMeta({
          total: res.meta?.total ?? res.data?.length ?? 0,
          page: res.meta?.page ?? nextPage,
          totalPages: res.meta?.totalPages || 1,
        });
        setStats(res.stats || null);
      })
      .catch((err) => setError(formatApiError(err)))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load(1);
    setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- initial load
  }, []);

  const openDetail = async (id) => {
    setDetailLoading(true);
    setError('');
    try {
      const res = await api.get(`/admin/payments/${id}`);
      const booking = res.data;
      setSelected(booking);
      setNextPaymentStatus(
        booking.paymentStatus === 'unpaid' ? 'paid' : booking.paymentStatus || 'paid',
      );
      setNote('');
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setDetailLoading(false);
    }
  };

  const applyPaymentStatus = async () => {
    if (!selected || !nextPaymentStatus) return;
    if (nextPaymentStatus === (selected.paymentStatus || 'unpaid')) {
      toast.info('Already on that payment status');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const res = await api.patch(`/admin/bookings/${selected.id}/payment-status`, {
        paymentStatus: nextPaymentStatus,
        note: note.trim() || null,
      });
      setSelected(res.data);
      toast.success(`Payment marked ${paymentStatusLabel(nextPaymentStatus).toLowerCase()}`);
      load(page);
    } catch (err) {
      const msg = formatApiError(err);
      setError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const summary = useMemo(() => {
    const unpaid = stats?.unpaid || { count: 0, amount: 0 };
    const paid = stats?.paid || { count: 0, amount: 0 };
    const deposit = stats?.deposit_held || { count: 0, amount: 0 };
    const refunded = stats?.refunded || { count: 0, amount: 0 };
    return { unpaid, paid, deposit, refunded, stripeAttempts: stats?.stripeAttempts || 0 };
  }, [stats]);

  return (
    <div>
      <PageHeader
        title="Payments"
        description="Track booking payments, Stripe attempts, and mark cash or bank transfers as paid."
      />

      <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Unpaid"
          value={summary.unpaid.count}
          hint={formatMoneyAed(summary.unpaid.amount)}
          active={paymentStatus === 'unpaid'}
          onClick={() => {
            setPaymentStatus('unpaid');
            setPage(1);
            load(1, 'unpaid');
          }}
        />
        <StatCard
          label="Paid"
          value={summary.paid.count}
          hint={formatMoneyAed(summary.paid.amount)}
          active={paymentStatus === 'paid'}
          onClick={() => {
            setPaymentStatus('paid');
            setPage(1);
            load(1, 'paid');
          }}
        />
        <StatCard
          label="Deposit held"
          value={summary.deposit.count}
          hint={formatMoneyAed(summary.deposit.amount)}
          active={paymentStatus === 'deposit_held'}
          onClick={() => {
            setPaymentStatus('deposit_held');
            setPage(1);
            load(1, 'deposit_held');
          }}
        />
        <StatCard
          label="Refunded"
          value={summary.refunded.count}
          hint={`${formatMoneyAed(summary.refunded.amount)} · ${summary.stripeAttempts} Stripe rows`}
          active={paymentStatus === 'refunded'}
          onClick={() => {
            setPaymentStatus('refunded');
            setPage(1);
            load(1, 'refunded');
          }}
        />
      </div>

      <div className="admin-card mb-5 flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              setPage(1);
              load(1);
            }
          }}
          placeholder="Search code, client, email, phone, Stripe PI"
          className="min-h-11 flex-1 rounded-xl border border-black/10 bg-surface px-3"
        />
        <select
          value={paymentStatus}
          onChange={(e) => setPaymentStatus(e.target.value)}
          className="min-h-11 rounded-xl border border-black/10 bg-surface px-3 capitalize"
        >
          <option value="">All payment statuses</option>
          {BOOKING_PAYMENT_STATUSES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => {
            setPage(1);
            load(1);
          }}
          className="admin-btn admin-btn--primary"
        >
          Filter
        </button>
        {paymentStatus && (
          <button
            type="button"
            className="admin-btn"
            onClick={() => {
              setPaymentStatus('');
              setPage(1);
              load(1, '');
            }}
          >
            Clear
          </button>
        )}
      </div>

      {error && <p className="mb-4 text-red-700">{error}</p>}

      <div className="grid gap-5 lg:grid-cols-5">
        <div className="admin-card admin-table-wrap lg:col-span-3">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Booking</th>
                <th>Client</th>
                <th>Amount</th>
                <th>Payment</th>
                <th>Stripe</th>
              </tr>
            </thead>
            <tbody>
              {loading && !rows.length ? (
                <tr>
                  <td colSpan={5} className="admin-table__empty">
                    Loading payments…
                  </td>
                </tr>
              ) : (
                rows.map((b) => {
                  const latest = Array.isArray(b.payments) ? b.payments[0] : null;
                  return (
                    <tr
                      key={b.id}
                      className={`is-clickable ${selected?.id === b.id ? 'is-selected' : ''}`}
                      onClick={() => openDetail(b.id)}
                    >
                      <td>
                        <p className="admin-table__mono">{b.code}</p>
                        <p className="admin-table__secondary truncate max-w-[10rem]">
                          {b.car?.name || `Car #${b.carId}`}
                        </p>
                      </td>
                      <td>
                        <p className="admin-table__primary">{b.fullName}</p>
                        <p className="admin-table__secondary truncate max-w-[11rem]">{b.email}</p>
                      </td>
                      <td>
                        <p className="admin-table__primary whitespace-nowrap">
                          {formatMoneyAed(b.total)}
                        </p>
                        <p className="admin-table__secondary capitalize">{b.status}</p>
                      </td>
                      <td>
                        <span
                          className={`admin-status admin-status--${b.paymentStatus || 'unpaid'}`}
                        >
                          {paymentStatusLabel(b.paymentStatus)}
                        </span>
                      </td>
                      <td>
                        {latest ? (
                          <span className={`admin-status admin-status--stripe-${latest.status}`}>
                            {String(latest.status).replace(/_/g, ' ')}
                          </span>
                        ) : (
                          <span className="admin-table__secondary">Manual / none</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
              {!loading && !rows.length && (
                <tr>
                  <td colSpan={5} className="admin-table__empty">
                    No payment records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {meta.totalPages > 1 && (
            <div className="flex items-center justify-between gap-3 border-t border-black/8 px-4 py-3 text-sm">
              <p className="text-on-surface-variant">
                Page {meta.page} of {meta.totalPages} · {meta.total} bookings
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  className="admin-btn"
                  disabled={meta.page <= 1}
                  onClick={() => {
                    const next = meta.page - 1;
                    setPage(next);
                    load(next);
                  }}
                >
                  Previous
                </button>
                <button
                  type="button"
                  className="admin-btn"
                  disabled={meta.page >= meta.totalPages}
                  onClick={() => {
                    const next = meta.page + 1;
                    setPage(next);
                    load(next);
                  }}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="admin-card p-5 lg:col-span-2">
          {detailLoading && !selected ? (
            <p className="text-on-surface-variant">Loading…</p>
          ) : !selected ? (
            <p className="text-on-surface-variant">Select a booking to manage its payment.</p>
          ) : (
            <div className="space-y-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                  {selected.code}
                </p>
                <h3 className="text-xl font-bold text-primary">{selected.car?.name}</h3>
                <p className="mt-2 flex flex-wrap items-center gap-2">
                  <span className={`admin-status admin-status--${selected.status}`}>
                    {selected.status}
                  </span>
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
                <div className="col-span-2">
                  <dt className="text-on-surface-variant">Email</dt>
                  <dd className="font-semibold break-all">{selected.email}</dd>
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
                  <dt className="text-on-surface-variant">Area</dt>
                  <dd className="font-semibold">{getLocationLabel(selected.location)}</dd>
                </div>
                <div>
                  <dt className="text-on-surface-variant">Total due</dt>
                  <dd className="font-semibold text-secondary">{formatMoneyAed(selected.total)}</dd>
                </div>
                <div>
                  <dt className="text-on-surface-variant">Deposit</dt>
                  <dd className="font-semibold">{formatMoneyAed(selected.deposit)}</dd>
                </div>
                {selected.stripePaymentIntentId && (
                  <div className="col-span-2">
                    <dt className="text-on-surface-variant">Booking Stripe PI</dt>
                    <dd className="font-mono text-xs break-all">{selected.stripePaymentIntentId}</dd>
                  </div>
                )}
              </dl>

              <div>
                <h4 className="font-bold">Stripe attempts</h4>
                {Array.isArray(selected.payments) && selected.payments.length ? (
                  <ul className="mt-2 space-y-2 text-sm">
                    {selected.payments.map((p) => (
                      <li key={p.id} className="rounded-lg border border-black/8 p-2">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className={`admin-status admin-status--stripe-${p.status}`}>
                            {String(p.status).replace(/_/g, ' ')}
                          </span>
                          <span className="font-semibold">
                            {formatMoneyAed(p.amount)} {p.currency || 'AED'}
                          </span>
                        </div>
                        <p className="mt-1 text-on-surface-variant">{formatDateTime(p.createdAt)}</p>
                        {p.stripePaymentIntentId && (
                          <p className="font-mono text-[11px] break-all text-on-surface-variant">
                            PI {p.stripePaymentIntentId}
                          </p>
                        )}
                        {p.stripeCheckoutSessionId && (
                          <p className="font-mono text-[11px] break-all text-on-surface-variant">
                            CS {p.stripeCheckoutSessionId}
                          </p>
                        )}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-sm text-on-surface-variant">
                    No Stripe checkout rows — suitable for cash or bank transfer marking.
                  </p>
                )}
              </div>

              <div className="space-y-2 border-t border-black/8 pt-4">
                <h4 className="font-bold">Update payment status</h4>
                <p className="text-sm text-on-surface-variant">
                  Use this for cash, bank transfer, or manual refunds. Stripe webhook still owns
                  online Checkout success.
                </p>
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
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Optional note (e.g. cash at Marina desk)"
                  className="min-h-20 w-full rounded-xl border border-black/10 bg-surface px-3 py-2.5"
                />
                <button
                  type="button"
                  onClick={applyPaymentStatus}
                  disabled={saving || nextPaymentStatus === (selected.paymentStatus || 'unpaid')}
                  className="admin-btn admin-btn--primary w-full"
                >
                  {saving ? 'Saving…' : 'Apply payment status'}
                </button>
                <Link to="/bookings" className="block text-center text-sm font-semibold text-secondary">
                  Open bookings workspace
                </Link>
              </div>

              <div>
                <h4 className="font-bold">Recent history</h4>
                <ul className="mt-2 max-h-48 space-y-2 overflow-y-auto text-sm">
                  {asHistory(selected.statusHistory)
                    .slice()
                    .reverse()
                    .slice(0, 8)
                    .map((item, idx) => (
                      <li key={`${item?.at || 'h'}-${idx}`} className="rounded-lg border border-black/8 p-2">
                        <p className="font-semibold capitalize">
                          {item.from || '—'} → {item.to}
                        </p>
                        <p className="text-on-surface-variant">
                          {item.by} · {item.at ? formatDateTime(item.at) : '—'}
                        </p>
                        {item.note && <p>{item.note}</p>}
                      </li>
                    ))}
                  {!asHistory(selected.statusHistory).length && (
                    <li className="text-on-surface-variant">No history yet.</li>
                  )}
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
