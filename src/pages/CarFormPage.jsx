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
  year: new Date().getFullYear(),
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

function Field({ label, hint, className = '', children }) {
  return (
    <label className={`car-field ${className}`}>
      <span className="car-field__label">{label}</span>
      {children}
      {hint && <span className="car-field__hint">{hint}</span>}
    </label>
  );
}

function Section({ title, description, children }) {
  return (
    <section className="car-form__section">
      <div className="car-form__section-head">
        <h2 className="car-form__section-title">{title}</h2>
        {description && <p className="car-form__section-desc">{description}</p>}
      </div>
      <div className="car-form__section-body">{children}</div>
    </section>
  );
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

  const selectAllLocations = () => setLocations(LOCATIONS.map((l) => l.value));
  const clearLocations = () => setLocations([]);

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
      setError('');
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      e.target.value = '';
    }
  };

  const previewSrc = resolveMediaUrl(form.image || PENDING_IMAGE);
  const gallery = Array.isArray(form.gallery) ? form.gallery : [];
  const inputClass = 'car-input';
  const textareaClass = 'car-input car-input--area';

  return (
    <div className="car-form">
      <PageHeader
        title={isNew ? 'Add car' : 'Edit car'}
        description="Shown on Featured Fleet, /cars, and vehicle detail pages."
        actions={
          <Link to="/cars" className="admin-btn admin-btn--ghost">
            Back to fleet
          </Link>
        }
      />

      <form onSubmit={onSubmit} className="car-form__layout">
        <div className="car-form__main">
          <div className="car-form__grid-top">
            <Section title="Photos" description="Main image appears on cards and the fleet gallery.">
              <div className="car-media">
                <div className="car-media__hero">
                  <img src={previewSrc} alt="" />
                  {!form.image && <span className="car-media__badge">Placeholder</span>}
                </div>
                <div className="car-media__toolbar">
                  <p className="car-media__hint">
                    {isNew
                      ? 'Save once, then upload photos on the edit screen.'
                      : 'Click a thumbnail to set it as the main photo.'}
                  </p>
                  {!isNew && (
                    <label className="admin-btn admin-btn--ghost car-media__upload">
                      Upload images
                      <input type="file" accept="image/*" multiple className="sr-only" onChange={onUpload} />
                    </label>
                  )}
                </div>
                {gallery.length > 0 && (
                  <div className="car-media__thumbs">
                    {gallery.map((src) => {
                      const path = toStoragePath(src);
                      const active = path === toStoragePath(form.image);
                      return (
                        <button
                          key={path}
                          type="button"
                          onClick={() => setMainImage(path)}
                          className={`car-media__thumb ${active ? 'car-media__thumb--active' : ''}`}
                          title="Set as main image"
                        >
                          <img src={resolveMediaUrl(path)} alt="" />
                        </button>
                      );
                    })}
                  </div>
                )}
                <Field label="Image alt text" hint="Used for accessibility on the website.">
                  <input
                    className={inputClass}
                    value={form.alt ?? ''}
                    onChange={update('alt')}
                    placeholder="e.g. White Lamborghini Urus in Dubai"
                  />
                </Field>
              </div>
            </Section>

            <div className="car-form__stack">
              <Section title="Identity" description="Name and category as shown to clients.">
                <div className="car-fields car-fields--2">
                  <Field label="Display name" className="car-fields__span-2">
                    <input
                      className={inputClass}
                      value={form.name}
                      onChange={update('name')}
                      placeholder="Audi A3 S-Line Berline - 2025"
                      required
                    />
                  </Field>
                  <Field label="Brand">
                    <input className={inputClass} value={form.brand} onChange={update('brand')} required />
                  </Field>
                  <Field label="Model">
                    <input className={inputClass} value={form.model} onChange={update('model')} required />
                  </Field>
                  <Field label="Year">
                    <input className={inputClass} type="number" value={form.year} onChange={update('year')} />
                  </Field>
                  <Field label="Fleet type">
                    <select className={inputClass} value={form.type} onChange={update('type')}>
                      {CAR_TYPES.map((item) => (
                        <option key={item.value} value={item.value}>
                          {item.label}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Card badge" hint="Short label on fleet cards (e.g. PREMIUM).">
                    <input
                      className={inputClass}
                      value={badgeLabel}
                      onChange={(e) => setBadgeLabel(e.target.value)}
                      placeholder="ESSENTIEL"
                    />
                  </Field>
                  <Field label="Colour">
                    <input className={inputClass} value={form.color ?? ''} onChange={update('color')} />
                  </Field>
                </div>
              </Section>

              <Section title="Pricing" description="Daily rate and deposit in AED.">
                <div className="car-fields car-fields--3">
                  <Field label="Price / day (AED)">
                    <input className={inputClass} type="number" min="1" value={form.price} onChange={update('price')} />
                  </Field>
                  <Field label="Deposit (AED)">
                    <input
                      className={inputClass}
                      type="number"
                      min="0"
                      value={form.deposit}
                      onChange={update('deposit')}
                    />
                  </Field>
                  <Field label="Daily km included">
                    <input
                      className={inputClass}
                      type="number"
                      min="0"
                      value={form.dailyKm}
                      onChange={update('dailyKm')}
                    />
                  </Field>
                </div>
              </Section>
            </div>
          </div>

          <Section title="Specs" description="Shown on the vehicle detail page.">
            <div className="car-fields car-fields--4">
              <Field label="Transmission">
                <input className={inputClass} value={form.transmission ?? ''} onChange={update('transmission')} />
              </Field>
              <Field label="Powertrain">
                <input className={inputClass} value={form.powertrain ?? ''} onChange={update('powertrain')} />
              </Field>
              <Field label="Drivetrain">
                <input className={inputClass} value={form.drivetrain ?? ''} onChange={update('drivetrain')} />
              </Field>
              <Field label="Fuel">
                <input className={inputClass} value={form.fuel ?? ''} onChange={update('fuel')} />
              </Field>
              <Field label="Seats">
                <input className={inputClass} type="number" min="1" max="12" value={form.seats} onChange={update('seats')} />
              </Field>
              <Field label="Doors">
                <input className={inputClass} type="number" min="2" max="6" value={form.doors} onChange={update('doors')} />
              </Field>
              <Field label="Horsepower">
                <input className={inputClass} type="number" value={form.horsepower ?? ''} onChange={update('horsepower')} />
              </Field>
              <Field label="0–100">
                <input className={inputClass} value={form.acceleration ?? ''} onChange={update('acceleration')} />
              </Field>
              <Field label="Top speed">
                <input className={inputClass} value={form.topSpeed ?? ''} onChange={update('topSpeed')} />
              </Field>
              <Field label="Rating">
                <input
                  className={inputClass}
                  type="number"
                  min="0"
                  max="5"
                  step="0.1"
                  value={form.rating}
                  onChange={update('rating')}
                />
              </Field>
              <Field label="Reviews count">
                <input
                  className={inputClass}
                  type="number"
                  min="0"
                  value={form.reviews}
                  onChange={update('reviews')}
                />
              </Field>
            </div>
          </Section>

          <Section title="Pickup areas" description="Must match the areas clients choose when booking.">
            <div className="car-locations__actions">
              <button type="button" className="admin-table__action admin-table__action--muted" onClick={selectAllLocations}>
                Select all
              </button>
              <button type="button" className="admin-table__action admin-table__action--muted" onClick={clearLocations}>
                Clear
              </button>
            </div>
            <div className="car-locations">
              {LOCATIONS.map((item) => {
                const checked = locations.includes(item.value);
                return (
                  <label key={item.value} className={`car-check ${checked ? 'car-check--on' : ''}`}>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleLocation(item.value)}
                    />
                    <span>{item.label}</span>
                  </label>
                );
              })}
            </div>
          </Section>

          <Section title="Website content" description="One item per line for lists.">
            <div className="car-fields">
              <Field label="Description" className="car-fields__span-full">
                <textarea
                  className={textareaClass}
                  rows={4}
                  value={form.description || ''}
                  onChange={update('description')}
                  placeholder="Short pitch for the detail page…"
                />
              </Field>
            </div>
            <div className="car-fields car-fields--2 car-fields--lists">
              <Field label="Highlights">
                <textarea className={textareaClass} rows={5} value={highlights} onChange={(e) => setHighlights(e.target.value)} />
              </Field>
              <Field label="Features">
                <textarea className={textareaClass} rows={5} value={features} onChange={(e) => setFeatures(e.target.value)} />
              </Field>
              <Field label="Included">
                <textarea className={textareaClass} rows={5} value={included} onChange={(e) => setIncluded(e.target.value)} />
              </Field>
              <Field label="Requirements">
                <textarea
                  className={textareaClass}
                  rows={5}
                  value={requirements}
                  onChange={(e) => setRequirements(e.target.value)}
                />
              </Field>
            </div>
          </Section>

          <Section title="Visibility" description="Control what appears on the public site.">
            <div className="car-toggles">
              <label className={`car-toggle ${form.featured ? 'car-toggle--on' : ''}`}>
                <input type="checkbox" checked={!!form.featured} onChange={update('featured')} />
                <span>
                  <strong>Featured on landing</strong>
                  <small>Shows in the Featured Fleet carousel</small>
                </span>
              </label>
              <label className={`car-toggle ${form.isActive ? 'car-toggle--on' : ''}`}>
                <input type="checkbox" checked={!!form.isActive} onChange={update('isActive')} />
                <span>
                  <strong>Active on website</strong>
                  <small>Hidden from /cars when inactive</small>
                </span>
              </label>
            </div>
          </Section>
        </div>

        <div className="car-form__footer">
          {error && <p className="car-form__error">{error}</p>}
          <div className="car-form__footer-actions">
            <Link to="/cars" className="admin-btn admin-btn--ghost">
              Cancel
            </Link>
            <button type="submit" disabled={saving} className="admin-btn admin-btn--primary disabled:opacity-60">
              {saving ? 'Saving…' : isNew ? 'Create car' : 'Save changes'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
