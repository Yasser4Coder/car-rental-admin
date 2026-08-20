import { useEffect, useState } from 'react';
import PageHeader from '../components/PageHeader';
import { IconPlus } from '../components/icons';
import api from '../api/client';
import { useToast } from '../context/ToastContext';
import { WHY_CHOOSE_ICONS, formatApiError } from '../data/fleet';

const emptyForm = {
  title: '',
  description: '',
  icon: 'local_shipping',
  sortOrder: 0,
  isActive: true,
};

export default function WhyChooseUsPage() {
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    setError('');
    api
      .get('/admin/content/why-choose-us')
      .then((res) => setItems(res.data || []))
      .catch((err) => setError(formatApiError(err)))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const startCreate = () => {
    setEditing('new');
    setForm({
      ...emptyForm,
      sortOrder: (items[items.length - 1]?.sortOrder || 0) + 10,
    });
  };

  const startEdit = (item) => {
    setEditing(item.id);
    setForm({
      title: item.title || '',
      description: item.description || '',
      icon: item.icon || 'verified',
      sortOrder: item.sortOrder ?? 0,
      isActive: item.isActive !== false,
    });
  };

  const cancel = () => {
    setEditing(null);
    setForm(emptyForm);
  };

  const save = async () => {
    if (!form.title.trim() || !form.description.trim()) {
      toast.error('Title and description are required');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        icon: form.icon,
        sortOrder: Number(form.sortOrder) || 0,
        isActive: Boolean(form.isActive),
      };
      if (editing === 'new') {
        await api.post('/admin/content/why-choose-us', payload);
        toast.success('Benefit created');
      } else {
        await api.patch(`/admin/content/why-choose-us/${editing}`, payload);
        toast.success('Benefit updated');
      }
      cancel();
      load();
    } catch (err) {
      toast.error(formatApiError(err));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this benefit?')) return;
    try {
      await api.delete(`/admin/content/why-choose-us/${id}`);
      toast.success('Deleted');
      if (editing === id) cancel();
      load();
    } catch (err) {
      toast.error(formatApiError(err));
    }
  };

  return (
    <div>
      <PageHeader
        title="Why choose us"
        description="Homepage benefits shown under the popular cars strip. Edit copy and icons anytime."
        actions={
          <button type="button" className="admin-btn admin-btn--primary" onClick={startCreate}>
            <IconPlus />
            Add benefit
          </button>
        }
      />

      {error && <p className="mb-4 text-red-700">{error}</p>}

      <div className="grid gap-5 lg:grid-cols-5">
        <div className="admin-card admin-table-wrap lg:col-span-3">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Order</th>
                <th>Title</th>
                <th>Icon</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {loading && !items.length ? (
                <tr>
                  <td colSpan={5} className="admin-table__empty">
                    Loading…
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr
                    key={item.id}
                    className={`is-clickable ${editing === item.id ? 'is-selected' : ''}`}
                    onClick={() => startEdit(item)}
                  >
                    <td>{item.sortOrder}</td>
                    <td>
                      <p className="admin-table__primary">{item.title}</p>
                      <p className="admin-table__secondary line-clamp-1">{item.description}</p>
                    </td>
                    <td className="admin-table__mono text-xs">{item.icon}</td>
                    <td>
                      <span
                        className={`admin-status admin-status--${item.isActive ? 'active' : 'cancelled'}`}
                      >
                        {item.isActive ? 'Active' : 'Hidden'}
                      </span>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="admin-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          remove(item.id);
                        }}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
              {!loading && !items.length && (
                <tr>
                  <td colSpan={5} className="admin-table__empty">
                    No benefits yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="admin-card p-5 lg:col-span-2">
          {!editing ? (
            <p className="text-on-surface-variant">Select a benefit to edit, or add a new one.</p>
          ) : (
            <div className="space-y-3">
              <h3 className="text-lg font-bold">
                {editing === 'new' ? 'New benefit' : 'Edit benefit'}
              </h3>
              <label className="block text-sm">
                <span className="font-semibold">Title</span>
                <input
                  className="mt-1 w-full rounded-xl border border-black/10 bg-surface px-3 py-2.5"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                />
              </label>
              <label className="block text-sm">
                <span className="font-semibold">Description</span>
                <textarea
                  className="mt-1 min-h-24 w-full rounded-xl border border-black/10 bg-surface px-3 py-2.5"
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                />
              </label>
              <label className="block text-sm">
                <span className="font-semibold">Icon</span>
                <select
                  className="mt-1 w-full rounded-xl border border-black/10 bg-surface px-3 py-2.5"
                  value={form.icon}
                  onChange={(e) => setForm((f) => ({ ...f, icon: e.target.value }))}
                >
                  {WHY_CHOOSE_ICONS.map((icon) => (
                    <option key={icon} value={icon}>
                      {icon}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm">
                <span className="font-semibold">Sort order</span>
                <input
                  type="number"
                  className="mt-1 w-full rounded-xl border border-black/10 bg-surface px-3 py-2.5"
                  value={form.sortOrder}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, sortOrder: Number(e.target.value) || 0 }))
                  }
                />
              </label>
              <label className="flex items-center gap-2 text-sm font-semibold">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                />
                Active on website
              </label>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  className="admin-btn admin-btn--primary flex-1"
                  disabled={saving}
                  onClick={save}
                >
                  {saving ? 'Saving…' : 'Save'}
                </button>
                <button type="button" className="admin-btn" onClick={cancel}>
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
