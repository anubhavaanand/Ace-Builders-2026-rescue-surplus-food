import { useCallback, useEffect, useState } from 'react';
import ScoreCard from '../components/ScoreCard.jsx';
import { claimListing, getAvailable } from '../api/client.js';
import { useRoleContext } from '../context/RoleContext.jsx';

const EXPIRED_MSG = 'This listing expired — it has been removed.';

export default function MatchClaim() {
  const { receiverId, volunteerId } = useRoleContext();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [cardErrors, setCardErrors] = useState({}); // listingId -> message
  const [notice, setNotice] = useState(null);
  const [claimingId, setClaimingId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const data = await getAvailable();
      setItems([...data].sort((a, b) => b.score - a.score));
    } catch (err) {
      setLoadError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleClaim(listing) {
    setClaimingId(listing.id);
    setNotice(null);
    setCardErrors((e) => {
      const next = { ...e };
      delete next[listing.id];
      return next;
    });
    try {
      await claimListing(listing.id, { receiver_id: receiverId, volunteer_id: volunteerId });
      setItems((prev) => prev.filter((i) => i.listing.id !== listing.id));
      setNotice(`Claimed listing #${listing.id}`);
    } catch (err) {
      if (err.status === 409 || /expired|removed/i.test(err.message)) {
        setItems((prev) => prev.filter((i) => i.listing.id !== listing.id));
        setNotice(EXPIRED_MSG);
      } else {
        setCardErrors((e) => ({ ...e, [listing.id]: err.message }));
      }
    } finally {
      setClaimingId(null);
    }
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Matches near you</h1>
        <button
          type="button"
          onClick={load}
          disabled={loading}
          className="min-h-[48px] rounded-lg border-2 border-green-600 px-4 font-semibold text-green-700 disabled:opacity-60"
        >
          Refresh
        </button>
      </div>

      {notice && (
        <div role="status" className="rounded-xl bg-green-50 p-3 font-semibold text-green-800">
          {notice}
        </div>
      )}
      {loadError && (
        <div role="alert" className="rounded-xl border-2 border-red-600 bg-red-50 p-3 text-red-700">
          {loadError}
        </div>
      )}
      {loading && <p className="text-gray-600">Loading listings…</p>}
      {!loading && !loadError && items.length === 0 && <p className="text-gray-600">No posted listings right now.</p>}

      {items.map(({ listing, score, components }) => (
        <ScoreCard
          key={listing.id}
          listing={listing}
          score={score}
          components={components}
          actions={
            <>
              <button
                type="button"
                onClick={() => handleClaim(listing)}
                disabled={claimingId === listing.id}
                className="min-h-[48px] w-full rounded-lg bg-green-600 px-4 text-lg font-bold text-white disabled:opacity-60"
              >
                {claimingId === listing.id ? 'Claiming…' : 'Claim'}
              </button>
              {cardErrors[listing.id] && (
                <p role="alert" className="mt-2 text-red-700">
                  {cardErrors[listing.id]}
                </p>
              )}
            </>
          }
        />
      ))}
    </section>
  );
}
