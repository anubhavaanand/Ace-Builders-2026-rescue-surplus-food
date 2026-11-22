const MAX_DISTANCE_KM = 10;
const MAX_MINUTES = 120;

const clamp = (x, lo, hi) => Math.min(hi, Math.max(lo, x));
const round2 = (x) => Math.round(x * 100) / 100;

// Great-circle distance in km (haversine, Earth radius 6371 km).
function haversine(lat1, lng1, lat2, lng2) {
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.min(1, Math.sqrt(a)));
}

// Parses a timestamp. SQLite-style 'YYYY-MM-DD HH:MM:SS' is treated as UTC.
function parseUtc(s) {
  if (typeof s !== 'string') return NaN;
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(s)) s = s.replace(' ', 'T') + 'Z';
  return Date.parse(s);
}

// Formats epoch ms as 'YYYY-MM-DD HH:MM:SS' (UTC), matching SQLite datetime().
function toSqlDatetime(ms) {
  return new Date(ms).toISOString().slice(0, 19).replace('T', ' ');
}

function scoreFor(listing, receiver, nowMs) {
  const dist = haversine(listing.lat, listing.lng, receiver.lat, receiver.lng);
  const distance_score = clamp(1 - dist / MAX_DISTANCE_KM, 0, 1);
  const quantity_fit_score =
    receiver.capacity_meals > 0 ? Math.min(listing.quantity_value, receiver.capacity_meals) / receiver.capacity_meals : 0;
  const minutes_remaining = (parseUtc(listing.pickup_by) - nowMs) / 60000;
  const time_to_spoil_score = clamp(minutes_remaining / MAX_MINUTES, 0, 1);
  const need_score = receiver.need_score;
  const score =
    0.35 * distance_score + 0.25 * quantity_fit_score + 0.25 * time_to_spoil_score + 0.15 * need_score;
  return {
    score: round2(score),
    components: {
      distance_score: round2(distance_score),
      quantity_fit_score: round2(quantity_fit_score),
      time_to_spoil_score: round2(time_to_spoil_score),
      need_score: round2(need_score),
    },
  };
}

module.exports = {
  MAX_DISTANCE_KM,
  MAX_MINUTES,
  haversine,
  parseUtc,
  toSqlDatetime,
  scoreFor,
};
