import { useCallback, useEffect, useMemo, useState } from 'react';
import StatusBadge from '../components/StatusBadge.jsx';
import { getAvailable, parseServerDate, transitionListing } from '../api/client.js';
import { useRoleContext } from '../context/RoleContext.jsx';

const SECTIONS = [
  { status: 'posted', label: 'Posted', timeField: 'posted_at' },
  { status: 'claimed', label: 'Claimed', timeField: 'claimed_at' },
  { status: 'collected', label: 'Collected', timeField: 'collected_at' },
  { status: 'delivered', label: 'Delivered', timeField: 'delivered_at' },
];

export default function StatusBoard() {
  const { currentRole, volunteerId, donorId } = useRoleContext();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const results = await Promise.all(SECTIONS.map((s) => getAvailable(s.status)));
      setListings(results.flat().map((item) => item.listing));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const grouped = useMemo(() => {
    const g = Object.fromEntries(SECTIONS.map((s) => [s.status, []]));
    for (const l of listings) if (g[l.status]) g[l.status].push(l);
    return g;
  }, [listings]);

  // Volunteer marks collected; volunteer or donor marks delivered.
  function actionFor(listing) {
    if (currentRole === 'volunteer' && listing.status === 'claimed') {
      return { label: 'Mark Collected', to: 'collected', actor: volunteerId };
    }
    if (listing.status === 'collected' && (currentRole === 'donor' || currentRole === 'volunteer')) {
      return { label: 'Mark Delivered', to: 'delivered', actor: currentRole === 'donor' ? donorId : volunteerId };
    }
    return null;
  }

  async function handleAction(listing, action) {
    setBusyId(listing.id);
    setError(null);
    try {
      await transitionListing(listing.id, { to: action.to, actor_id: action.actor });
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Status board</h1>
        <button
          type="button"
          onClick={load}
          disabled={loading}
          className="min-h-[48px] rounded-lg border-2 border-green-600 px-4 font-semibold text-green-700 disabled:opacity-60"
        >
          Refresh
        </button>
      </div>

      {error && (
        <div role="alert" className="rounded-xl border-2 border-red-600 bg-red-50 p-3 text-red-700">
          {error}
        </div>
      )}
      {loading && <p className="text-gray-600">Loading…</p>}

      {SECTIONS.map((section) => {
        const items = grouped[section.status];
        return (
          <div key={section.status} className="space-y-3">
            <h2 className="flex items-center gap-2 text-xl font-bold">
              {section.label}
              <span className="rounded-full bg-gray-200 px-2 text-base">{items.length}</span>
            </h2>
            {items.length === 0 && <p className="text-gray-500">None</p>}
            {items.map((listing) => {
              const ts = parseServerDate(listing[section.timeField]);
              const actor = listing.claimed_by_volunteer_id || listing.claimed_by_receiver_id || '—';
              const action = actionFor(listing);
              return (
                <article key={listing.id} className="space-y-2 rounded-2xl border border-gray-200 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <StatusBadge status={listing.status} />
                    <span className="text-sm text-gray-600">#{listing.id.slice(0, 8)}</span>
                  </div>
                  <p className="text-base capitalize">
                    {listing.food_type.replace(/_/g, ' ')} · {listing.quantity_value} {listing.quantity_unit}
                  </p>
                  <p className="text-sm text-gray-700">Last update: {ts ? ts.toLocaleString() : '—'}</p>
                  <p className="text-sm text-gray-700">Actor: {actor}</p>
                  {action && (
                    <button
                      type="button"
                      onClick={() => handleAction(listing, action)}
                      disabled={busyId === listing.id}
                      className="min-h-[48px] w-full rounded-lg bg-green-600 px-4 font-bold text-white disabled:opacity-60"
                    >
                      {busyId === listing.id ? 'Saving…' : action.label}
                    </button>
                  )}
                </article>
              );
            })}
          </div>
        );
      })}
    </section>
  );
}
