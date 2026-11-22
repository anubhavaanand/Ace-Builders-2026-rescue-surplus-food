// Expiry sweep: marks posted listings whose expires_at has passed.
function applyExpiry(db) {
  return db
    .prepare("UPDATE listings SET status='expired' WHERE status='posted' AND expires_at < datetime('now')")
    .run();
}

module.exports = { applyExpiry };
