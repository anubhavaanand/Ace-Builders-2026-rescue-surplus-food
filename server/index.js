const path = require('path');
const express = require('express');
const { getDb } = require('./db/connection');
const { seed } = require('./db/seed');
const listingsRouter = require('./routes/listings');
const impactRouter = require('./routes/impact');

const app = express();
app.use(express.json());

const db = getDb();
if (db.prepare('SELECT COUNT(*) AS n FROM donors').get().n === 0) {
  seed(db);
}

app.use('/api/listings', listingsRouter);
app.use('/api/impact', impactRouter);
app.use('/api', (req, res) => res.status(404).json({ error: 'Not found' }));

if (process.env.NODE_ENV === 'production') {
  const dist = path.resolve(__dirname, '..', 'client', 'dist');
  app.use(express.static(dist));
  app.get(/^\/(?!api(\/|$)).*/, (req, res) => res.sendFile(path.join(dist, 'index.html')));
}

// JSON error handler. Never exposes stack traces.
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  const status = err.status || err.statusCode || 500;
  if (status >= 500) console.error(err);
  res.status(status).json({ error: status >= 500 ? 'Internal server error' : err.message });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Rescue the Surplus API listening on port ${PORT}`);
});
