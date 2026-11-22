CREATE TABLE IF NOT EXISTS donors (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  area TEXT NOT NULL,
  lat REAL NOT NULL,
  lng REAL NOT NULL,
  is_verified INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS receivers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  area TEXT NOT NULL,
  lat REAL NOT NULL,
  lng REAL NOT NULL,
  capacity_meals INTEGER NOT NULL,
  need_score REAL NOT NULL DEFAULT 0.5
);

CREATE TABLE IF NOT EXISTS volunteers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  area TEXT NOT NULL,
  lat REAL NOT NULL,
  lng REAL NOT NULL,
  available INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS listings (
  id TEXT PRIMARY KEY,
  donor_id TEXT NOT NULL REFERENCES donors(id),
  food_type TEXT NOT NULL CHECK (food_type IN ('veg','non_veg','egg')),
  quantity_value REAL NOT NULL CHECK (quantity_value > 0),
  quantity_unit TEXT NOT NULL CHECK (quantity_unit IN ('meals','kg')),
  pickup_by DATETIME NOT NULL,
  storage TEXT NOT NULL CHECK (storage IN ('hot','cold','ambient')),
  allergens TEXT NOT NULL DEFAULT '[]',
  area TEXT NOT NULL,
  lat REAL NOT NULL,
  lng REAL NOT NULL,
  status TEXT NOT NULL DEFAULT 'posted' CHECK (status IN ('posted','claimed','collected','delivered','expired')),
  claimed_by_receiver_id TEXT REFERENCES receivers(id),
  claimed_by_volunteer_id TEXT REFERENCES volunteers(id),
  posted_at DATETIME NOT NULL DEFAULT (datetime('now')),
  claimed_at DATETIME,
  collected_at DATETIME,
  delivered_at DATETIME,
  expires_at DATETIME NOT NULL
);

CREATE TABLE IF NOT EXISTS matches (
  listing_id TEXT NOT NULL REFERENCES listings(id),
  receiver_id TEXT NOT NULL REFERENCES receivers(id),
  score REAL NOT NULL,
  distance_score REAL NOT NULL,
  quantity_fit_score REAL NOT NULL,
  time_to_spoil_score REAL NOT NULL,
  need_score REAL NOT NULL,
  ranked_at DATETIME NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (listing_id, receiver_id)
);

CREATE TABLE IF NOT EXISTS impact_events (
  id TEXT PRIMARY KEY,
  listing_id TEXT NOT NULL REFERENCES listings(id),
  kind TEXT NOT NULL,
  value REAL NOT NULL,
  formula TEXT NOT NULL,
  inputs_json TEXT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS payments (
  id TEXT PRIMARY KEY,
  listing_id TEXT NOT NULL REFERENCES listings(id),
  donor_contribution REAL NOT NULL DEFAULT 0,
  csr_coverage REAL NOT NULL DEFAULT 0,
  receiver_charge REAL NOT NULL DEFAULT 0 CHECK (receiver_charge = 0)
);
