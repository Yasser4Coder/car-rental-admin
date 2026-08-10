import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import api from '../api/client';
import {
  CAR_TYPES,
  LOCATIONS,
  defaultBadgesForType,
  formatApiError,
  toStoragePath,
} from '../data/fleet';
import { resolveMediaUrl } from '../utils/media';

const PENDING_IMAGE = '/uploads/fleet/pending.svg';

const empty = {
  name: '',
  brand: '',
  model: '',
  year: 2024,
  type: 'essential',
  price: 1000,
  deposit: 5000,
  dailyKm: 250,
  featured: false,
  isActive: true,
  image: '',
  gallery: [],
  alt: '',
  color: '',
  transmission: 'Auto',
  seats: 2,
  doors: 2,
  powertrain: 'Petrol',
  drivetrain: 'RWD',
  horsepower: 400,
  acceleration: '4.0s',
  topSpeed: '250 km/h',
  fuel: 'Petrol',
  rating: 5,
  reviews: 0,
  description: '',
  highlights: [],
  features: [],
  included: [],
  requirements: [],
  badges: defaultBadgesForType('essential'),
  locations: LOCATIONS.map((l) => l.value),
};

function listToText(value) {
  return Array.isArray(value) ? value.join('\n') : '';
}

function textToList(value) {
  return value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

function normalizeCar(car) {
  const image = toStoragePath(car.image);
  const gallery = (Array.isArray(car.gallery) ? car.gallery : []).map(toStoragePath);
  return {
    ...empty,
    ...car,
    image,
    gallery,
    badges: Array.isArray(car.badges) && car.badges.length ? car.badges : defaultBadgesForType(car.type),
    locations: Array.isArray(car.locations) && car.locations.length ? car.locations : empty.locations,
  };
}

export default function CarFormPage() {
  const { id } = useParams();
  const isNew = !id || id === 'new';
  const navigate = useNavigate();
  const [form, setForm] = useState(empty);
  const [highlights, setHighlights] = useState('');
  const [features, setFeatures] = useState('');
  const [included, setIncluded] = useState('');
  const [requirements, setRequirements] = useState('');
  const [locations, setLocations] = useState(empty.locations);
  const [badgeLabel, setBadgeLabel] = useState(empty.badges[0]?.label || 'ESSENTIEL');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isNew) return;
    api
      .get(`/admin/cars/${id}`)
      .then((res) => {
        const car = normalizeCar(res.data);
        setForm(car);
        setHighlights(listToText(car.highlights));
        setFeatures(listToText(car.features));
        setIncluded(listToText(car.included));
        setRequirements(listToText(car.requirements));
        setLocations(car.locations);
        setBadgeLabel(car.badges?.[0]?.label || defaultBadgesForType(car.type)[0]?.label || '');
      })
      .catch((err) => setError(formatApiError(err)));
  }, [id, isNew]);

  const update = (key) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      if (key === 'type') {
        const badge = defaultBadgesForType(value)[0];
        next.badges = badge ? [badge] : [];
        setBadgeLabel(badge?.label || '');
      }
      return next;
    });
  };

  const toggleLocation = (value) => {
    setLocations((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value],
    );
  };

  const setMainImage = (path) => {
    setForm((prev) => ({ ...prev, image: toStoragePath(path) }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!locations.length) {
      setError('Select at least one pickup area (matches website booking areas).');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const badge = defaultBadgesForType(form.type)[0];
      const badges = badgeLabel.trim()
        ? [{ label: badgeLabel.trim().toUpperCase(), className: badge?.className }]
        : defaultBadgesForType(form.type);

      const payload = {
        ...form,
        year: Number(form.year),
        price: Number(form.price),
        deposit: Number(form.deposit),
        dailyKm: Number(form.dailyKm),
        seats: Number(form.seats),
        doors: Number(form.doors),
        horsepower: Number(form.horsepower) || null,
        rating: Number(form.rating),
        reviews: Number(form.reviews),
        image: toStoragePath(form.image) || PENDING_IMAGE,
        gallery: (Array.isArray(form.gallery) ? form.gallery : []).map(toStoragePath),
        highlights: textToList(highlights),
        features: textToList(features),
        included: textToList(included),
        requirements: textToList(requirements),
        locations,
        badges,
        alt: form.alt || form.name,
      };

      // Strip API-only fields before save
      delete payload.id;
      delete payload.createdAt;
      delete payload.updatedAt;

      if (isNew) {
        const created = await api.post('/admin/cars', payload);
        navigate(`/cars/${created.data.id}`);
      } else {
        await api.patch(`/admin/cars/${id}`, payload);
        navigate('/cars');
      }
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setSaving(false);
    }
  };

  const onUpload = async (e) => {
    if (isNew) {
      setError('Save the car first, then upload images.');
      return;
    }
    const files = e.target.files;
    if (!files?.length) return;
    const body = new FormData();
    [...files].forEach((file) => body.append('images', file));
    try {
      const res = await api.post(`/admin/cars/${id}/images`, body);
      const car = normalizeCar(res.data);
      setForm(car);
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      e.target.value = '';
    }
  };

  const previewSrc = resolveMediaUrl(form.image || PENDING_IMAGE);
  const gallery = Array.isArray(form.gallery) ? form.gallery : [];

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title={isNew ? 'Add car' : 'Edit car'}
        description="This content powers Featured Fleet and the /cars pages."
        actions={
          <Link to="/cars" className="admin-btn admin-btn--ghost">
            Back to fleet
          </Link>
        }
      />

      <form onSubmit={onSubmit} className="admin-card space-y-4 p-5">
        <div className="overflow-hidden rounded-xl border border-black/8 bg-surface-container">
          <img src={previewSrc} alt="" className="h-48 w-full object-cover sm:h-56" />
          <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm">
            <p className="text-on-surface-variant">
              Main photo {form.image ? '' : '(placeholder until you upload)'}
            </p>
            {!isNew && (
              <label className="cursor-pointer font-semibold text-secondary hover:underline">
                Upload images
                <input type="file" accept="image/*" multiple className="sr-only" onChange={onUpload} />
              </label>
            )}
          </div>
          {gallery.length > 0 && (
            <div className="flex gap-2 overflow-x-auto border-t border-black/8 px-4 py-3">
              {gallery.map((src) => {
                const path = toStoragePath(src);
                const active = path === toStoragePath(form.image);
                return (
                  <button
                    key={path}
                    type="button"
                    onClick={() => setMainImage(path)}
                    className={`shrink-0 overflow-hidden rounded-lg border-2 ${
                      active ? 'border-secondary' : 'border-transparent'
                    }`}
                    title="Set as main image"
                  >
                    <img src={resolveMediaUrl(path)} alt="" className="h-14 w-20 object-cover" />
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {[
            ['name', 'Name'],
            ['brand', 'Brand'],
            ['model', 'Model'],
            ['year', 'Year'],
            ['price', 'Price / day (AED)'],
            ['deposit', 'Deposit (AED)'],
            ['dailyKm', 'Daily km'],
            ['alt', 'Image alt'],
            ['color', 'Colour'],
            ['transmission', 'Transmission'],
            ['seats', 'Seats'],
            ['doors', 'Doors'],
            ['powertrain', 'Powertrain'],
            ['drivetrain', 'Drivetrain'],
            ['horsepower', 'Horsepower'],
            ['acceleration', '0–100'],
            ['topSpeed', 'Top speed'],
            ['fuel', 'Fuel'],
            ['rating', 'Rating'],
            ['reviews', 'Reviews count'],
          ].map(([key, label]) => (
            <label key={key} className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant">
              {label}
              <input
                className="mt-1.5 w-full rounded-xl border border-black/10 bg-surface px-3 py-2.5 outline-none focus:border-secondary"
                value={form[key] ?? ''}
                onChange={update(key)}
                required={['name', 'brand', 'model'].includes(key)}
              />
            </label>
          ))}

          <label className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant">
            Type
            <select
              className="mt-1.5 w-full rounded-xl border border-black/10 bg-surface px-3 py-2.5"
              value={form.type}
              onChange={update('type')}
            >
              {CAR_TYPES.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant">
            Card badge
            <input
              className="mt-1.5 w-full rounded-xl border border-black/10 bg-surface px-3 py-2.5 outline-none focus:border-secondary"
              value={badgeLabel}
              onChange={(e) => setBadgeLabel(e.target.value)}
              placeholder="ESSENTIEL"
            />
          </label>

          <fieldset className="sm:col-span-2">
            <legend className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
              Pickup areas
            </legend>
            <p className="mt-1 text-sm text-on-surface-variant">
              Same areas clients select on the website booking form.
            </p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {LOCATIONS.map((item) => (
                <label
                  key={item.value}
                  className="inline-flex items-center gap-2 rounded-xl border border-black/8 bg-surface px-3 py-2.5 text-sm font-semibold"
                >
                  <input
                    type="checkbox"
                    checked={locations.includes(item.value)}
                    onChange={() => toggleLocation(item.value)}
                  />
                  {item.label}
                </label>
              ))}
            </div>
          </fieldset>

          <label className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant sm:col-span-2">
            Description
            <textarea
              className="mt-1.5 min-h-28 w-full rounded-xl border border-black/10 bg-surface px-3 py-2.5"
              value={form.description || ''}
              onChange={update('description')}
            />
          </label>

          {[
            ['Highlights', highlights, setHighlights],
            ['Features', features, setFeatures],
            ['Included', included, setIncluded],
            ['Requirements', requirements, setRequirements],
          ].map(([label, value, setter]) => (
            <label
              key={label}
              className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant sm:col-span-2"
            >
              {label} (one per line)
              <textarea
                className="mt-1.5 min-h-24 w-full rounded-xl border border-black/10 bg-surface px-3 py-2.5"
                value={value}
                onChange={(e) => setter(e.target.value)}
              />
            </label>
          ))}
        </div>

        <div className="flex flex-wrap gap-4">
          <label className="inline-flex items-center gap-2 text-sm font-semibold">
            <input type="checkbox" checked={!!form.featured} onChange={update('featured')} />
            Featured on landing
          </label>
          <label className="inline-flex items-center gap-2 text-sm font-semibold">
            <input type="checkbox" checked={!!form.isActive} onChange={update('isActive')} />
            Active on website
          </label>
        </div>

        {isNew && (
          <p className="rounded-xl bg-surface-container px-4 py-3 text-sm text-on-surface-variant">
            Save the car first, then upload photos. A placeholder image is used until then.
          </p>
        )}

        {error && <p className="text-sm text-red-700">{error}</p>}

        <button type="submit" disabled={saving} className="admin-btn admin-btn--primary disabled:opacity-60">
          {saving ? 'Saving…' : 'Save car'}
        </button>
      </form>
    </div>
  );
}
