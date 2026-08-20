import { useEffect, useMemo, useState } from 'react';
import PageHeader from '../components/PageHeader';
import api from '../api/client';
import { useToast } from '../context/ToastContext';
import { formatApiError } from '../data/fleet';

function wordCount(text) {
  return String(text || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

export default function SeoContentPage() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    title: '',
    body: '',
    isActive: true,
  });

  const words = useMemo(() => wordCount(form.body), [form.body]);

  const load = () => {
    setLoading(true);
    setError('');
    api
      .get('/admin/content/seo/homepage')
      .then((res) => {
        const data = res.data || {};
        setForm({
          title: data.title || '',
          body: data.body || '',
          isActive: data.isActive !== false,
        });
      })
      .catch((err) => setError(formatApiError(err)))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const save = async () => {
    if (form.title.trim().length < 5) {
      toast.error('Title must be at least 5 characters');
      return;
    }
    if (wordCount(form.body) < 50) {
      toast.error('Body should be substantial SEO copy (aim for 300–500 words)');
      return;
    }
    setSaving(true);
    try {
      await api.patch('/admin/content/seo/homepage', {
        title: form.title.trim(),
        body: form.body.trim(),
        isActive: Boolean(form.isActive),
      });
      toast.success('SEO section saved');
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
        title="Homepage SEO"
        description="Long-form copy near the footer for Google (luxury / SUV / sports / airport delivery). Aim for 300–500 words."
      />

      {error && <p className="mb-4 text-red-700">{error}</p>}

      <div className="admin-card p-5 max-w-4xl space-y-4">
        {loading ? (
          <p className="text-on-surface-variant">Loading…</p>
        ) : (
          <>
            <label className="block text-sm">
              <span className="font-semibold">Title (H2)</span>
              <input
                className="mt-1 w-full rounded-xl border border-black/10 bg-surface px-3 py-2.5"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              />
            </label>
            <label className="block text-sm">
              <span className="font-semibold">Body</span>
              <span className="ml-2 text-xs font-normal text-on-surface-variant">
                Separate paragraphs with a blank line · {words} words
                {words >= 300 && words <= 500 ? ' ✓' : words < 300 ? ' (add more)' : ' (a bit long)'}
              </span>
              <textarea
                className="mt-1 min-h-[320px] w-full rounded-xl border border-black/10 bg-surface px-3 py-2.5 font-mono text-sm leading-relaxed"
                value={form.body}
                onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
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
                className="admin-btn admin-btn--primary"
                disabled={saving}
                onClick={save}
              >
                {saving ? 'Saving…' : 'Save SEO section'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
