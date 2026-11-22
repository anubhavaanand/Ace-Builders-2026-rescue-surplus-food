import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Disclaimer from '../components/Disclaimer.jsx';
import { getListing } from '../api/client.js';

export default function ListingDetail() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setData(null);
    setError(null);
    getListing(id)
      .then((res) => {
        if (!cancelled) setData(res);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

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

  return (
    <article className="space-y-4">
      <h1 className="text-2xl font-bold capitalize">{listing.food_type.replace(/_/g, ' ')}</h1>
      <p className="text-base">
        {listing.quantity_value} {listing.quantity_unit} · Status: <span className="capitalize">{listing.status}</span>
      </p>

      <section className="rounded-2xl border border-gray-200 p-4">
        <h2 className="font-semibold">Storage handling</h2>
        <p className="text-base">{handling?.storage_instruction || '—'}</p>
      </section>

      <section className="rounded-2xl border border-gray-200 p-4">
        <h2 className="font-semibold">Allergens</h2>
        <p className="text-base">{allergens && allergens.length > 0 ? allergens.join(', ') : 'None listed'}</p>
      </section>

      <p className="text-lg font-bold text-red-700">Do not consume after {doNotConsumeText}</p>

      <Disclaimer />
    </article>
  );
}
