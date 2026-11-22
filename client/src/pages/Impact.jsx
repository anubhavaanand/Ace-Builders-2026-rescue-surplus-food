import { useEffect, useState } from 'react';
import MetricBox from '../components/MetricBox.jsx';
import { getImpact } from '../api/client.js';

// Keys below match the metrics object returned by server/services/impact.js.
// Each metric is a bare number.
const TILES = [
  { label: 'Meals Saved', key: 'meals_saved', unit: 'meals' },
  { label: 'kg Diverted', key: 'kg_diverted', unit: 'kg' },
  { label: 'CO2e Avoided', key: 'co2e_avoided_kg', unit: 'kg' },
  { label: 'Cost per Meal Saved', key: 'cost_per_meal_saved', unit: '₹' },
];

export default function Impact() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    getImpact()
      .then((d) => {
        if (!cancelled) setData(d);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) {
    return (
      <div role="alert" className="rounded-xl border-2 border-red-600 bg-red-50 p-3 text-red-700">
        {error}
      </div>
    );
  }
  if (!data) return <p className="text-gray-600">Loading impact…</p>;

  const metrics = data.metrics || {};
  const formulaMeta = data.formula_meta || {};
  const split = data.funding_split || {};

  return (
    <section className="space-y-5">
      <h1 className="text-2xl font-bold">Impact</h1>

      <div className="grid grid-cols-2 gap-3">
        {TILES.map((tile) => {
          return (
            <MetricBox
              key={tile.key}
              label={tile.label}
              value={metrics[tile.key] ?? null}
              unit={tile.unit}
              formula={formulaMeta[tile.key]?.formula}
              inputs={formulaMeta[tile.key]?.inputs || {}}
            />
          );
        })}
      </div>

      <div className="rounded-2xl border border-gray-200 p-4 text-base">
        <p className="mb-2 font-semibold">Funding split</p>
        <p>
          Donor contributed: ₹{split.donor_contributed ?? '—'} | CSR covered: ₹{split.csr_coverage ?? '—'} | Receiver
          paid: <strong className="text-green-600">₹0</strong>
        </p>
      </div>
    </section>
  );
}
