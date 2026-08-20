import { useEffect, useState } from 'react';
import PageHeader from '../components/PageHeader';
import api from '../api/client';
import { useToast } from '../context/ToastContext';
import { CAR_TYPES, CATEGORY_ICONS, formatApiError, formatMoneyAed, getTypeLabel } from '../data/fleet';

const emptyForm = {
  title: '',
  description: '',
  image: '',
  icon: 'directions_car',
  sortOrder: 0,
  isActive: true,
};

export default function VehicleCategoriesPage() {
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
      .get('/admin/content/vehicle-categories')
      .then((res) => setItems(res.data || []))
      .catch((err) => setError(formatApiError(err)))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const startEdit = (item) => {
    if (!item.id) {
      toast.error('Category row missing — restart the API so seed can create it');
      return;
    }
    setEditing(item.id);
    setForm({
      title: item.title || '',
      description: item.description || '',
      image: item.image || '',
      icon: item.icon || 'directions_car',
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
      await api.patch(`/admin/content/vehicle-categories/${editing}`, {
        title: form.title.trim(),
        description: form.description.trim(),
        image: form.image.trim() || null,
        icon: form.icon,
        sortOrder: Number(form.sortOrder) || 0,
        isActive: Boolean(form.isActive),
      });
      toast.success('Category updated');
      cancel();
      load();
    } catch (err) {
      toast.error(formatApiError(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Vehicle categories"
        description="Homepage category tiles are built from fleet types in the database. Edit titles, copy, cover image, and visibility."
      />

      {error && <p className="mb-4 text-red-700">{error}</p>}

      <div className="grid gap-5 lg:grid-cols-5">
        <div className="admin-card admin-table-wrap lg:col-span-3">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Order</th>
                <th>Category</th>
                <th>Cars</th>
                <th>From</th>
                <th>Status</th>
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
                    key={item.type}
                    className={`is-clickable ${editing === item.id ? 'is-selected' : ''}`}
                    onClick={() => startEdit(item)}
                  >
                    <td>{item.sortOrder}</td>
                    <td>
                      <p className="admin-table__primary">{item.title}</p>
                      <p className="admin-table__secondary">
                        {getTypeLabel(item.type) || item.type}
                        {item.icon ? ` · ${item.icon}` : ''}
                      </p>
                    </td>
                    <td className="admin-table__mono">{item.carCount}</td>
                    <td>{item.startingFrom != null ? formatMoneyAed(item.startingFrom) : '—'}</td>
                    <td>
                      <span
                        className={`admin-status admin-status--${item.isActive ? 'active' : 'cancelled'}`}
                      >
                        {item.isActive ? 'Active' : 'Hidden'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
              {!loading && !items.length && (
                <tr>
                  <td colSpan={5} className="admin-table__empty">
                    No categories yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          <p className="px-4 py-3 text-xs text-on-surface-variant">
            Types match fleet values: {CAR_TYPES.map((t) => t.label).join(', ')}. Categories with
            zero active cars stay hidden on the public homepage.
          </p>
        </div>

        <div className="admin-card p-5 lg:col-span-2">
          {!editing ? (
            <p className="text-on-surface-variant">Select a category to edit its homepage card.</p>
          ) : (
            <div className="space-y-3">
              <h3 className="text-lg font-bold">Edit category</h3>
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
                <span className="font-semibold">Cover image URL</span>
                <input
                  className="mt-1 w-full rounded-xl border border-black/10 bg-surface px-3 py-2.5"
                  placeholder="Leave empty to use a fleet photo"
                  value={form.image}
                  onChange={(e) => setForm((f) => ({ ...f, image: e.target.value }))}
                />
              </label>
              <label className="block text-sm">
                <span className="font-semibold">Icon</span>
                <select
                  className="mt-1 w-full rounded-xl border border-black/10 bg-surface px-3 py-2.5"
                  value={form.icon}
                  onChange={(e) => setForm((f) => ({ ...f, icon: e.target.value }))}
                >
                  {CATEGORY_ICONS.map((icon) => (
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
