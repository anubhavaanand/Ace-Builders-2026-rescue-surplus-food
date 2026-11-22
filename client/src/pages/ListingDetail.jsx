import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Disclaimer from '../components/Disclaimer.jsx';
import { getListing } from '../api/client.js';
import { useRoleContext } from '../context/RoleContext.jsx';

export default function ListingDetail() {
  const { id } = useParams();
  const { currentRole } = useRoleContext();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setData(null);
    setError(null);
    getListing(id, currentRole)
      .then((res) => {
        if (!cancelled) setData(res);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      });
    return () => {
      cancelled = true;
    };
  }, [id, currentRole]);

  if (error) {
    return (
      <div role="alert" className="rounded-xl border-2 border-red-600 bg-red-50 p-3 text-red-700">
        {error}
      </div>
    );
  }
  if (!data) return <p className="text-gray-600">Loading listing…</p>;

  const { listing, handling, allergens } = data;
  const doNotConsumeAfter = handling?.do_not_consume_after;
  const doNotConsumeText = doNotConsumeAfter ? new Date(doNotConsumeAfter).toLocaleString() : '—';
  const expired = listing.status === 'expired' || handling?.time_window_minutes === 0;

  return (
    <article className="space-y-4">
      {expired && (
        <p role="alert" className="rounded-xl border-2 border-red-600 bg-red-50 p-3 text-lg font-bold text-red-700">EXPIRED</p>
      )}
      <h1 className="text-2xl font-bold capitalize">{listing.food_type.replace(/_/g, ' ')}</h1>
      <p className="text-base">
        {listing.quantity_value} {listing.quantity_unit} · Status: <span className="capitalize">{listing.status}</span>
      </p>
      <p className="text-base">Pick up by {listing.pickup_by ? new Date(listing.pickup_by).toLocaleString() : '—'}</p>

      <section className="rounded-2xl border border-gray-200 p-4">
        <h2 className="font-semibold">Storage handling</h2>
        <p className="text-base">{handling?.storage_instruction || '—'}</p>
      </section>

      <section className="rounded-2xl border border-gray-200 p-4">
        <h2 className="font-semibold">Allergens</h2>
        <p className="text-base">{allergens && allergens.length > 0 ? allergens.join(', ') : 'None declared'}</p>
      </section>

      {typeof data.pickup_instructions === 'string' && data.pickup_instructions.trim() !== '' && (
        <section className="rounded-2xl border border-gray-200 p-4">
          <h2 className="font-semibold">Pickup instructions</h2>
          <p className="text-base">{data.pickup_instructions}</p>
        </section>
      )}

      <p className="text-lg font-bold text-red-700">Do not consume after {doNotConsumeText}</p>

      <Disclaimer />
    </article>
  );
}
