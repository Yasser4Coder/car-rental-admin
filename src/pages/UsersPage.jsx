import { useEffect, useMemo, useState } from 'react';
import PageHeader from '../components/PageHeader';
import { IconPlus } from '../components/icons';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { formatApiError } from '../data/fleet';

const PAGE_SIZE = 25;

const emptyForm = {
  fullName: '',
  email: '',
  phone: '',
  password: '',
  role: 'client',
  isActive: true,
};

function initials(name, email) {
  const raw = String(name || email || '?').trim();
  const parts = raw.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return raw.slice(0, 2).toUpperCase();
}

function formatDate(value) {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleDateString('en-AE', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return '—';
  }
}

export default function UsersPage() {
  const { user: me } = useAuth();
  const toast = useToast();

  const [users, setUsers] = useState([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, totalPages: 1 });
  const [q, setQ] = useState('');
  const [role, setRole] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [selected, setSelected] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [mode, setMode] = useState('view'); // view | edit | create
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const counts = useMemo(() => {
    const admins = users.filter((u) => u.role === 'admin').length;
    const clients = users.filter((u) => u.role === 'client').length;
    const active = users.filter((u) => u.isActive).length;
    return { admins, clients, active };
  }, [users]);

  const load = (nextPage = page) => {
    setLoading(true);
    setError('');
    const params = new URLSearchParams({
      limit: String(PAGE_SIZE),
      page: String(nextPage),
    });
    if (q.trim()) params.set('q', q.trim());
    if (role) params.set('role', role);
    if (status === 'active') params.set('isActive', 'true');
    if (status === 'inactive') params.set('isActive', 'false');

    api
      .get(`/admin/users?${params}`)
      .then((res) => {
        setUsers(res.data || []);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps -- initial load
  }, []);

  const runFilter = () => {
    setPage(1);
    load(1);
  };

  const goPage = (next) => {
    setPage(next);
    load(next);
  };

  const openUser = async (id) => {
    setDetailLoading(true);
    setError('');
    setMode('view');
    try {
      const res = await api.get(`/admin/users/${id}`);
      setSelected(res.data);
      setForm({
        fullName: res.data.fullName || '',
        email: res.data.email || '',
        phone: res.data.phone || '',
        password: '',
        role: res.data.role || 'client',
        isActive: Boolean(res.data.isActive),
      });
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setDetailLoading(false);
    }
  };

  const startCreate = () => {
    setSelected(null);
    setForm(emptyForm);
    setMode('create');
  };

  const startEdit = () => {
    if (!selected) return;
    setMode('edit');
  };

  const setField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const saveUser = async (e) => {
    e?.preventDefault?.();
    setSaving(true);
    setError('');
    try {
      if (mode === 'create') {
        const res = await api.post('/admin/users', {
          fullName: form.fullName.trim(),
          email: form.email.trim(),
          phone: form.phone.trim() || null,
          password: form.password,
          role: form.role,
          isActive: form.isActive,
        });
        toast.success('User created');
        setSelected({ ...res.data, bookingCount: 0 });
        setMode('view');
        setForm({ ...form, password: '' });
        load(page);
      } else if (mode === 'edit' && selected) {
        const payload = {
          fullName: form.fullName.trim(),
          email: form.email.trim(),
          phone: form.phone.trim() || null,
          role: form.role,
          isActive: form.isActive,
        };
        if (form.password.trim()) payload.password = form.password.trim();
        const res = await api.patch(`/admin/users/${selected.id}`, payload);
        toast.success('User updated');
        setSelected({ ...selected, ...res.data });
        setMode('view');
        setForm((prev) => ({ ...prev, password: '' }));
        load(page);
      }
    } catch (err) {
      const msg = formatApiError(err);
      setError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (user) => {
    if (Number(user.id) === Number(me?.id)) {
      toast.error('You cannot deactivate your own account');
      return;
    }
    try {
      const res = await api.patch(`/admin/users/${user.id}`, { isActive: !user.isActive });
      toast.success(res.data.isActive ? 'User activated' : 'User deactivated');
      if (selected?.id === user.id) {
        setSelected({ ...selected, ...res.data });
        setForm((prev) => ({ ...prev, isActive: res.data.isActive }));
      }
      load(page);
    } catch (err) {
      const msg = formatApiError(err);
      setError(msg);
      toast.error(msg);
    }
  };

  const removeUser = async (user) => {
    if (Number(user.id) === Number(me?.id)) {
      toast.error('You cannot delete your own account');
      return;
    }
    if (!window.confirm(`Remove ${user.fullName || user.email}?`)) return;
    try {
      const res = await api.delete(`/admin/users/${user.id}`);
      toast.success(res.message || 'User removed');
      if (selected?.id === user.id) {
        setSelected(null);
        setMode('view');
      }
      load(page);
    } catch (err) {
      const msg = formatApiError(err);
      setError(msg);
      toast.error(msg);
    }
  };

  const isSelf = selected && Number(selected.id) === Number(me?.id);
  const panelOpen = mode === 'create' || selected || detailLoading;

  return (
    <div>
      <PageHeader
        title="Users"
        description="Manage client accounts and admin access for the dashboard."
        actions={
          <button type="button" className="admin-btn admin-btn--primary" onClick={startCreate}>
            <IconPlus />
            Add user
          </button>
        }
      />

      <div className="admin-card mb-4 flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && runFilter()}
          placeholder="Search name, email, or phone"
          className="min-h-11 flex-1 rounded-xl border border-black/10 bg-surface px-3 outline-none focus:border-secondary"
        />
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="min-h-11 rounded-xl border border-black/10 bg-surface px-3"
        >
          <option value="">All roles</option>
          <option value="client">Clients</option>
          <option value="admin">Admins</option>
        </select>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="min-h-11 rounded-xl border border-black/10 bg-surface px-3"
        >
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <button type="button" onClick={runFilter} className="admin-btn admin-btn--ghost">
          Filter
        </button>
      </div>

      {error && <p className="mb-4 text-red-700">{error}</p>}

      <div className={`users-layout ${panelOpen ? 'users-layout--split' : ''}`}>
        <div className="min-w-0">
          {loading ? (
            <p className="text-on-surface-variant">Loading users…</p>
          ) : (
            <>
              <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-on-surface-variant">
                <span>
                  <span className="font-bold text-on-surface">{meta.total}</span> total
                </span>
                <span className="users-meta-dot" aria-hidden />
                <span>{counts.clients} clients on this page</span>
                <span className="users-meta-dot" aria-hidden />
                <span>{counts.admins} admins on this page</span>
              </div>

              <div className="admin-card admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>User</th>
                      <th>Role</th>
                      <th>Status</th>
                      <th>Joined</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => {
                      const selectedRow = selected?.id === user.id && mode !== 'create';
                      return (
                        <tr
                          key={user.id}
                          className={`is-clickable ${selectedRow ? 'is-selected' : ''}`}
                          onClick={() => openUser(user.id)}
                        >
                          <td>
                            <div className="admin-table__cell-user">
                              <span
                                className={`users-avatar ${user.role === 'admin' ? 'users-avatar--admin' : ''}`}
                                aria-hidden
                              >
                                {initials(user.fullName, user.email)}
                              </span>
                              <div className="min-w-0">
                                <p className="admin-table__primary truncate">
                                  {user.fullName}
                                  {Number(user.id) === Number(me?.id) && (
                                    <span className="users-you">You</span>
                                  )}
                                </p>
                                <p className="admin-table__secondary truncate">{user.email}</p>
                                {user.phone && (
                                  <p className="admin-table__secondary truncate">{user.phone}</p>
                                )}
                              </div>
                            </div>
                          </td>
                          <td>
                            <span
                              className={`admin-chip ${
                                user.role === 'admin' ? 'admin-chip--role-admin' : 'admin-chip--role-client'
                              }`}
                            >
                              {user.role === 'admin' ? 'Admin' : 'Client'}
                            </span>
                          </td>
                          <td>
                            <span
                              className={`admin-chip ${user.isActive ? 'admin-chip--active' : 'admin-chip--inactive'}`}
                            >
                              {user.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="admin-table__mono whitespace-nowrap">{formatDate(user.createdAt)}</td>
                          <td onClick={(e) => e.stopPropagation()}>
                            <div className="admin-table__actions">
                              <button
                                type="button"
                                className="admin-table__action admin-table__action--edit"
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  await openUser(user.id);
                                  setMode('edit');
                                }}
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                className="admin-table__action admin-table__action--muted"
                                onClick={() => toggleActive(user)}
                                disabled={Number(user.id) === Number(me?.id)}
                              >
                                {user.isActive ? 'Deactivate' : 'Activate'}
                              </button>
                              <button
                                type="button"
                                className="admin-table__action admin-table__action--danger"
                                onClick={() => removeUser(user)}
                                disabled={Number(user.id) === Number(me?.id)}
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {!users.length && (
                      <tr>
                        <td colSpan={5} className="admin-table__empty">
                          No users match this filter.
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

        {panelOpen && (
          <aside className="admin-card users-panel">
            {detailLoading ? (
              <p className="text-on-surface-variant">Loading profile…</p>
            ) : mode === 'create' || mode === 'edit' ? (
              <form onSubmit={saveUser} className="users-panel__form">
                <div className="users-panel__head">
                  <div>
                    <p className="users-panel__eyebrow">{mode === 'create' ? 'New account' : 'Edit account'}</p>
                    <h2 className="users-panel__title">
                      {mode === 'create' ? 'Add user' : selected?.fullName || 'User'}
                    </h2>
                  </div>
                  <button
                    type="button"
                    className="admin-btn admin-btn--ghost"
                    onClick={() => {
                      if (mode === 'create') {
                        setMode('view');
                        setSelected(null);
                      } else {
                        setMode('view');
                      }
                    }}
                  >
                    Cancel
                  </button>
                </div>

                <label className="users-field">
                  <span>Full name</span>
                  <input
                    required
                    value={form.fullName}
                    onChange={(e) => setField('fullName', e.target.value)}
                    className="users-field__input"
                  />
                </label>
                <label className="users-field">
                  <span>Email</span>
                  <input
                    required
                    type="email"
                    value={form.email}
                    onChange={(e) => setField('email', e.target.value)}
                    className="users-field__input"
                  />
                </label>
                <label className="users-field">
                  <span>Phone</span>
                  <input
                    value={form.phone}
                    onChange={(e) => setField('phone', e.target.value)}
                    placeholder="Optional"
                    className="users-field__input"
                  />
                </label>
                <label className="users-field">
                  <span>{mode === 'create' ? 'Password' : 'New password'}</span>
                  <input
                    type="password"
                    required={mode === 'create'}
                    minLength={8}
                    value={form.password}
                    onChange={(e) => setField('password', e.target.value)}
                    placeholder={mode === 'edit' ? 'Leave blank to keep' : 'Min. 8 characters'}
                    className="users-field__input"
                  />
                </label>
                <div className="users-field-row">
                  <label className="users-field">
                    <span>Role</span>
                    <select
                      value={form.role}
                      onChange={(e) => setField('role', e.target.value)}
                      disabled={isSelf}
                      className="users-field__input"
                    >
                      <option value="client">Client</option>
                      <option value="admin">Admin</option>
                    </select>
                  </label>
                  <label className="users-field">
                    <span>Status</span>
                    <select
                      value={form.isActive ? 'active' : 'inactive'}
                      onChange={(e) => setField('isActive', e.target.value === 'active')}
                      disabled={isSelf}
                      className="users-field__input"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </label>
                </div>

                {isSelf && (
                  <p className="users-panel__note">
                    You cannot demote or deactivate your own account from here.
                  </p>
                )}

                <button type="submit" disabled={saving} className="admin-btn admin-btn--primary w-full">
                  {saving ? 'Saving…' : mode === 'create' ? 'Create user' : 'Save changes'}
                </button>
              </form>
            ) : selected ? (
              <div className="users-panel__view">
                <div className="users-panel__head">
                  <div className="users-panel__identity">
                    <span
                      className={`users-avatar users-avatar--lg ${
                        selected.role === 'admin' ? 'users-avatar--admin' : ''
                      }`}
                      aria-hidden
                    >
                      {initials(selected.fullName, selected.email)}
                    </span>
                    <div className="min-w-0">
                      <p className="users-panel__eyebrow">
                        {selected.role === 'admin' ? 'Administrator' : 'Client account'}
                        {isSelf ? ' · You' : ''}
                      </p>
                      <h2 className="users-panel__title truncate">{selected.fullName}</h2>
                      <p className="users-panel__email truncate">{selected.email}</p>
                    </div>
                  </div>
                </div>

                <div className="users-panel__chips">
                  <span
                    className={`admin-chip ${
                      selected.role === 'admin' ? 'admin-chip--role-admin' : 'admin-chip--role-client'
                    }`}
                  >
                    {selected.role === 'admin' ? 'Admin' : 'Client'}
                  </span>
                  <span
                    className={`admin-chip ${selected.isActive ? 'admin-chip--active' : 'admin-chip--inactive'}`}
                  >
                    {selected.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <dl className="users-dl">
                  <div>
                    <dt>Phone</dt>
                    <dd>{selected.phone || '—'}</dd>
                  </div>
                  <div>
                    <dt>Joined</dt>
                    <dd>{formatDate(selected.createdAt)}</dd>
                  </div>
                  <div>
                    <dt>Updated</dt>
                    <dd>{formatDate(selected.updatedAt)}</dd>
                  </div>
                  <div>
                    <dt>Bookings</dt>
                    <dd>{selected.bookingCount ?? 0}</dd>
                  </div>
                  <div>
                    <dt>User ID</dt>
                    <dd className="admin-table__mono">#{selected.id}</dd>
                  </div>
                </dl>

                <div className="users-panel__actions">
                  <button type="button" className="admin-btn admin-btn--primary" onClick={startEdit}>
                    Edit profile
                  </button>
                  <button
                    type="button"
                    className="admin-btn admin-btn--ghost"
                    disabled={isSelf}
                    onClick={() => toggleActive(selected)}
                  >
                    {selected.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                  <button
                    type="button"
                    className="admin-btn admin-btn--ghost text-red-700"
                    disabled={isSelf}
                    onClick={() => removeUser(selected)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ) : null}
          </aside>
        )}
      </div>
    </div>
  );
}
