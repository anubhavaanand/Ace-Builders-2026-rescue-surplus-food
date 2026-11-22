import { Link } from 'react-router-dom';
import { parseServerDate } from '../api/client.js';

const ROWS = [
  { key: 'distance_score', label: '📍 Distance (weight 0.35)' },
  { key: 'quantity_fit_score', label: '🍱 Quantity fit (weight 0.25)' },
  { key: 'time_to_spoil_score', label: '⏱ Time remaining (weight 0.25)' },
  { key: 'need_score', label: '❤️ Need (weight 0.15)' },
];

const fmt = (n) => Number(n ?? 0).toFixed(2);
const clamp01 = (n) => Math.max(0, Math.min(1, Number(n) || 0));

export default function ScoreCard({ listing, score, components, actions }) {
  const pickup = parseServerDate(listing.pickup_by);
  const c = components || {};

  return (
    <article className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold capitalize">{listing.food_type.replace(/_/g, ' ')}</h2>
          <p className="text-base text-gray-700">
            {listing.quantity_value} {listing.quantity_unit}
          </p>
          <p className="text-sm text-gray-600">
            Pick up by {pickup ? pickup.toLocaleString() : listing.pickup_by}
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-600">Score</p>
          <p className="text-3xl font-bold text-green-700">{fmt(score)}</p>
        </div>
      </header>

      <ul className="mt-4 space-y-3">
        {ROWS.map((row) => {
          const value = c[row.key];
          return (
            <li key={row.key}>
              <div className="flex items-center justify-between text-base">
                <span>{row.label}</span>
                <span className="font-mono font-semibold">{fmt(value)}</span>
              </div>
              <div className="mt-1 h-3 w-full rounded bg-gray-200">
                <div className="h-3 rounded bg-green-600" style={{ width: `${clamp01(value) * 100}%` }} />
              </div>
            </li>
          );
        })}
      </ul>

      <Link
        to={`/listing/${listing.id}`}
        className="mt-4 flex min-h-[48px] items-center justify-center rounded-lg border-2 border-green-600 font-semibold text-green-700"
      >
        View details
      </Link>

      {actions && <div className="mt-3">{actions}</div>}
    </article>
  );
}
