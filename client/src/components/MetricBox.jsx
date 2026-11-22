import { useState } from 'react';

export default function MetricBox({ label, value, unit, formula, inputs }) {
  const [open, setOpen] = useState(false);
  const entries = Object.entries(inputs || {});
  const missing = value === null || value === undefined;

  return (
    <div className="rounded-2xl border border-gray-200 p-4">
      <p className="text-base text-gray-600">{label}</p>
      <p className="text-3xl font-bold text-green-700">
        {missing ? '—' : value}
        {!missing && unit ? <span className="ml-1 text-lg">{unit}</span> : null}
      </p>

      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="mt-3 min-h-[48px] w-full rounded-lg border-2 border-green-600 px-3 text-base font-semibold text-green-700"
      >
        {open ? 'Hide calculation' : 'How is this calculated?'}
      </button>

      {open && (
        <div className="mt-2 rounded-lg bg-gray-50 p-3 text-base">
          <p className="font-semibold">Formula</p>
          <p className="break-words font-mono text-sm">{formula || '—'}</p>
          {entries.length > 0 && (
            <dl className="mt-2 space-y-1">
              {entries.map(([k, v]) => (
                <div key={k} className="flex justify-between gap-2">
                  <dt className="font-mono text-sm">{k}</dt>
                  <dd className="font-mono text-sm">{String(v)}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>
      )}
    </div>
  );
}
