import { useState } from 'react';
import { createListing } from '../api/client.js';
import { useRoleContext } from '../context/RoleContext.jsx';
import useTimer from '../hooks/useTimer.js';
import Timer from '../components/Timer.jsx';

// Donor locations copied from server/db/seed.js (DONORS). Keep in sync with the seed.
const DONOR_LOCATIONS = {
  D1: { area: 'Koramangala', lat: 12.9352, lng: 77.6245 },
  D2: { area: 'Indiranagar', lat: 12.9784, lng: 77.6408 },
  D3: { area: 'Banashankari', lat: 12.9165, lng: 77.5478 },
  D4: { area: 'Whitefield', lat: 12.9698, lng: 77.7499 },
  D5: { area: 'HSR Layout', lat: 12.9116, lng: 77.6389 },
  D6: { area: 'Jayanagar', lat: 12.9308, lng: 77.5831 },
};

const FOOD_OPTIONS = [
  { value: 'veg', label: 'Veg' },
  { value: 'non_veg', label: 'Non-Veg' },
  { value: 'egg', label: 'Egg' },
];
const UNIT_OPTIONS = [
  { value: 'meals', label: 'Meals' },
  { value: 'kg', label: 'kg' },
];
const STORAGE_OPTIONS = [
  { value: 'hot', label: 'Hot' },
  { value: 'cold', label: 'Cold' },
  { value: 'ambient', label: 'Ambient' },
];
const ALLERGEN_OPTIONS = ['Dairy', 'Nuts', 'Gluten', 'Shellfish', 'None'];

// Local time as 'YYYY-MM-DDTHH:MM' for <input type="datetime-local">.
function toLocalInputValue(date) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}`;
}

const defaultPickup = () => toLocalInputValue(new Date(Date.now() + 2 * 60 * 60 * 1000));

function Field({ legend, invalid, children }) {
  return (
    <fieldset className={`space-y-2 rounded-xl p-2 ${invalid ? 'ring-2 ring-red-600' : ''}`}>
      <legend className="text-base font-semibold text-gray-800">{legend}</legend>
      {children}
    </fieldset>
  );
}

function ToggleButtons({ options, value, onChange }) {
  return (
    <div className="flex gap-2">
      {options.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(opt.value)}
            className={`min-h-[48px] flex-1 rounded-xl border-2 px-2 text-base font-semibold ${
              active ? 'border-green-600 bg-green-600 text-white' : 'border-gray-300 bg-white text-gray-800'
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

export default function PostSurplus() {
  const { donorId } = useRoleContext();
  const { formatted, frozen, freeze } = useTimer();

  const [form, setForm] = useState({
    food_type: 'veg',
    quantity_value: '',
    quantity_unit: 'meals',
    pickup_by: defaultPickup(),
    storage: 'hot',
    allergens: [],
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null); // { message, field }
  const [posted, setPosted] = useState(null); // createListing response

  const update = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  // 'None' is represented by an empty allergens array.
  const toggleAllergen = (name) => {
    const key = name.toLowerCase();
    setForm((f) => {
      if (key === 'none') return { ...f, allergens: [] };
      const has = f.allergens.includes(key);
      return { ...f, allergens: has ? f.allergens.filter((a) => a !== key) : [...f.allergens, key] };
    });
  };

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    const qty = Number(form.quantity_value);
    if (!(qty > 0)) {
      setError({ message: 'Enter a quantity greater than 0', field: 'quantity_value' });
      return;
    }
    const pickup = new Date(form.pickup_by);
    if (Number.isNaN(pickup.getTime())) {
      setError({ message: 'Pick a valid pickup time', field: 'pickup_by' });
      return;
    }
    const loc = DONOR_LOCATIONS[donorId];
    if (!loc) {
      setError({ message: `Unknown donor ${donorId}`, field: 'donor_id' });
      return;
    }

    setSubmitting(true);
    try {
      const res = await createListing({
        food_type: form.food_type,
        quantity_value: qty,
        quantity_unit: form.quantity_unit,
        pickup_by: pickup.toISOString(),
        storage: form.storage,
        allergens: form.allergens,
        donor_id: donorId,
        area: loc.area,
        lat: loc.lat,
        lng: loc.lng,
      });
      freeze();
      setPosted(res);
    } catch (err) {
      setError({ message: err.message, field: err.field });
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass = (field) =>
    `min-h-[48px] w-full rounded-lg border-2 px-3 text-lg ${
      error?.field === field ? 'border-red-600' : 'border-gray-300'
    }`;

  return (
    <section className="space-y-5">
      <h1 className="text-2xl font-bold">Post surplus food</h1>
      <Timer display={formatted} frozen={frozen} />

      {posted && (
        <div role="status" className="rounded-xl bg-green-600 p-4 font-semibold text-white">
          Posted in {formatted} • {posted.matched_count} receivers matched • Listing #{posted.id}
        </div>
      )}

      {error && (
        <div role="alert" className="rounded-xl border-2 border-red-600 bg-red-50 p-3 text-red-700">
          {error.message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Field legend="Food type" invalid={error?.field === 'food_type'}>
          <ToggleButtons options={FOOD_OPTIONS} value={form.food_type} onChange={(v) => update('food_type', v)} />
        </Field>

        <Field legend="Quantity" invalid={error?.field === 'quantity_value' || error?.field === 'quantity_unit'}>
          <input
            type="number"
            min="0"
            step="any"
            inputMode="decimal"
            aria-label="Quantity value"
            value={form.quantity_value}
            onChange={(e) => update('quantity_value', e.target.value)}
            className={inputClass('quantity_value')}
          />
          <ToggleButtons
            options={UNIT_OPTIONS}
            value={form.quantity_unit}
            onChange={(v) => update('quantity_unit', v)}
          />
        </Field>

        <Field legend="Pickup by" invalid={error?.field === 'pickup_by'}>
          <input
            type="datetime-local"
            value={form.pickup_by}
            onChange={(e) => update('pickup_by', e.target.value)}
            className={inputClass('pickup_by')}
          />
        </Field>

        <Field legend="Storage" invalid={error?.field === 'storage'}>
          <ToggleButtons options={STORAGE_OPTIONS} value={form.storage} onChange={(v) => update('storage', v)} />
        </Field>

        <Field legend="Allergens">
          <div className="flex flex-wrap gap-2">
            {ALLERGEN_OPTIONS.map((name) => {
              const key = name.toLowerCase();
              const active = key === 'none' ? form.allergens.length === 0 : form.allergens.includes(key);
              return (
                <button
                  key={name}
                  type="button"
                  aria-pressed={active}
                  onClick={() => toggleAllergen(name)}
                  className={`min-h-[48px] rounded-full border-2 px-4 text-base font-semibold ${
                    active ? 'border-green-600 bg-green-600 text-white' : 'border-gray-300 bg-white text-gray-800'
                  }`}
                >
                  {name}
                </button>
              );
            })}
          </div>
        </Field>

        <button
          type="submit"
          disabled={submitting || !!posted}
          className="min-h-[48px] w-full rounded-xl bg-green-600 px-4 text-lg font-bold text-white disabled:opacity-60"
        >
          {posted ? 'Posted' : submitting ? 'Posting…' : 'Post surplus'}
        </button>
      </form>
    </section>
  );
}
