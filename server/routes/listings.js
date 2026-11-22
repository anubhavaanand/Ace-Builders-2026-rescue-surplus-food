const crypto = require('crypto');
const express = require('express');
const { getDb } = require('../db/connection');
const { validateListing, notFound } = require('../middleware/validate');
const { scoreFor, parseUtc, toSqlDatetime } = require('../services/matching');
const { applyExpiry } = require('../services/expiry');

const router = express.Router();

const HANDLING = {
  hot: 'Keep above 60°C until served',
  cold: 'Keep at or below 5°C',
  ambient: 'Store in a dry, cool place',
};
const DISCLAIMER = "Food safety is the donor's responsibility. Check the food before you serve.";

// Target status -> the status it may come from, and the timestamp column to set.
const TRANSITIONS = {
  collected: { from: 'claimed', column: 'collected_at' },
  delivered: { from: 'collected', column: 'delivered_at' },
};

// POST /api/listings
router.post('/', validateListing, (req, res) => {
  const db = getDb();
  const b = req.body;
  const id = crypto.randomUUID();
  const pickupBy = toSqlDatetime(parseUtc(b.pickup_by));
  const allergens = JSON.stringify(Array.isArray(b.allergens) ? b.allergens : []);
  const listing = { quantity_value: b.quantity_value, pickup_by: pickupBy, lat: b.lat, lng: b.lng };
  const nowMs = Date.now();

  const insertListing = db.prepare(`
    INSERT INTO listings (
      id, donor_id, food_type, quantity_value, quantity_unit, pickup_by, storage, allergens,
      area, lat, lng, status, expires_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'posted', ?)
  `);
  const insertMatch = db.prepare(`
    INSERT INTO matches (listing_id, receiver_id, score, distance_score, quantity_fit_score, time_to_spoil_score, need_score)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const receivers = db.prepare('SELECT * FROM receivers').all();
  db.transaction(() => {
    insertListing.run(
      id,
      b.donor_id,
      b.food_type,
      b.quantity_value,
      b.quantity_unit,
      pickupBy,
      b.storage,
      allergens,
      req.donor.area,
      b.lat,
      b.lng,
      pickupBy
    );
    for (const r of receivers) {
      const { score, components: c } = scoreFor(listing, r, nowMs);
      insertMatch.run(id, r.id, score, c.distance_score, c.quantity_fit_score, c.time_to_spoil_score, c.need_score);
    }
  })();

  res.status(201).json({ id, status: 'posted', matched_count: receivers.length, expires_at: pickupBy });

});

// GET /api/listings/available  (must stay above GET /:id)
router.get('/available', (req, res) => {
  const db = getDb();
  applyExpiry(db);
  const status = req.query.status || 'posted';
  const receiverParam = req.query.receiver_id;

  let receivers;
  if (receiverParam !== undefined) {
    const one = db.prepare('SELECT * FROM receivers WHERE id = ?').get(String(receiverParam));
    if (!one) return res.status(400).json({ error: 'receiver_id does not exist', field: 'receiver_id' });
    receivers = [one];
  } else {
    receivers = db.prepare('SELECT * FROM receivers').all();
  }

  const listings = db
    .prepare(
      'SELECT l.*, d.name AS donor_name, d.type AS donor_type, v.name AS volunteer_name, r.name AS receiver_name FROM listings l JOIN donors d ON d.id = l.donor_id LEFT JOIN volunteers v ON v.id = l.claimed_by_volunteer_id LEFT JOIN receivers r ON r.id = l.claimed_by_receiver_id WHERE l.status = ?'
    )
    .all(status);
  const nowMs = Date.now();

  const items = listings.map((listing) => {
    let best = { score: 0, components: null };
    for (const r of receivers) {
      const s = scoreFor(listing, r, nowMs);
      if (!best.components || s.score > best.score) best = s;
    }
    return { listing, score: best.score, components: best.components };
  });
  items.sort((a, b) => b.score - a.score);
  res.status(200).json(items);
});


// POST /api/listings/:id/claim   body: { receiver_id }
router.post('/:id/claim', (req, res) => {
  const db = getDb();
  const { receiver_id } = req.body || {};

  const listing = db.prepare('SELECT status, expires_at, lat, lng FROM listings WHERE id = ?').get(req.params.id);
  if (!listing) return res.status(404).json({ error: 'listing not found' });
  if (receiver_id === undefined || receiver_id === null || receiver_id === '') {
    return res.status(400).json({ error: 'receiver_id is required', field: 'receiver_id' });
  }
  if (typeof receiver_id !== 'string' || !db.prepare('SELECT 1 FROM receivers WHERE id = ?').get(receiver_id)) {
    return res.status(400).json({ error: 'receiver_id does not exist', field: 'receiver_id' });
  }
  if (parseUtc(listing.expires_at) <= Date.now()) {
    return res.status(409).json({ error: 'this listing has expired and is no longer available' });
  }
  if (listing.status !== 'posted') {
    return res.status(409).json({ error: 'this listing has already been claimed' });
  }

  const outcome = db.transaction(() => {
    const volunteers = db.prepare('SELECT id, name, lat, lng FROM volunteers WHERE available = 1').all();
    if (volunteers.length === 0) return { error: 'no volunteer is available right now' };

    let nearest = null;
    let nearestDist = Infinity;
    for (const v of volunteers) {
      const dist = Math.sqrt((v.lat - listing.lat) ** 2 + (v.lng - listing.lng) ** 2);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearest = v;
      }
    }

    const result = db
      .prepare(`
        UPDATE listings
        SET status = 'claimed', claimed_at = datetime('now'),
            claimed_by_receiver_id = ?, claimed_by_volunteer_id = ?
        WHERE id = ? AND status = 'posted'
      `)
      .run(receiver_id, nearest.id, req.params.id);
    if (result.changes !== 1) return { error: 'this listing has already been claimed' };

    db.prepare('UPDATE volunteers SET available = 0 WHERE id = ?').run(nearest.id);
    const { claimed_at } = db.prepare('SELECT claimed_at FROM listings WHERE id = ?').get(req.params.id);
    return { volunteer: nearest, claimed_at };
  })();

  if (outcome.error) return res.status(409).json({ error: outcome.error });
  res.status(200).json({
    listing_id: req.params.id,
    status: 'claimed',
    volunteer_id: outcome.volunteer.id,
    volunteer_name: outcome.volunteer.name,
    claimed_at: outcome.claimed_at,
  });
});


// POST /api/listings/:id/transition   body: { to }
router.post('/:id/transition', (req, res) => {
  const db = getDb();
  const to = req.body ? req.body.to : undefined;

  if (to === 'claimed') {
    return res.status(422).json({ error: 'claimed must be set through POST /api/listings/:id/claim' });
  }
  if (!Object.prototype.hasOwnProperty.call(TRANSITIONS, to)) {
    return res.status(400).json({ error: 'to must be collected or delivered', field: 'to' });
  }

  const listing = db.prepare('SELECT status, quantity_value, quantity_unit FROM listings WHERE id = ?').get(req.params.id);
  if (!listing) return notFound(res, 'Listing not found');

  const rule = TRANSITIONS[to];
  const notAllowed = () => res.status(422).json({ error: `Transition ${listing.status} -> ${to} is not allowed` });
  if (listing.status !== rule.from) return notAllowed();

  const apply = db.transaction(() => {
    // `column` comes from the fixed TRANSITIONS map, never from user input.
    const result = db
      .prepare(`UPDATE listings SET status = ?, ${rule.column} = datetime('now') WHERE id = ? AND status = ?`)
      .run(to, req.params.id, rule.from);
    if (result.changes !== 1) return false;

    if (to === 'delivered') {
      const KG_PER_MEAL = 0.4;
      const CO2E_PER_KG = 2.5;
      const COST_PER_MEAL_BASE = 12;
      const meals = listing.quantity_unit === 'meals' ? listing.quantity_value : listing.quantity_value / KG_PER_MEAL;
      const kg = Math.round(meals * KG_PER_MEAL * 10) / 10;
      const co2e = Math.round(kg * CO2E_PER_KG * 10) / 10;

      const insertImpact = db.prepare(
        'INSERT INTO impact_events (id, listing_id, kind, value, formula, inputs_json) VALUES (?, ?, ?, ?, ?, ?)'
      );
      const rows = [
        [
          'meals_saved',
          meals,
          'quantity meals',
          { quantity_value: listing.quantity_value, quantity_unit: listing.quantity_unit, meals },
        ],
        ['kg_diverted', kg, 'meals × 0.4 kg per meal', { meals, kg_per_meal: KG_PER_MEAL }],
        ['co2e_avoided', co2e, 'kg_diverted × 2.5 kg CO₂e per kg food', { kg_diverted: kg, co2e_per_kg: CO2E_PER_KG }],
        ['cost_per_meal', COST_PER_MEAL_BASE, 'cost_per_meal_base', { cost_per_meal_base: COST_PER_MEAL_BASE }],
      ];
      for (const [kind, value, formula, inputs] of rows) {
        insertImpact.run(crypto.randomUUID(), req.params.id, kind, value, formula, JSON.stringify(inputs));
      }
      db.prepare(
        'INSERT INTO payments (id, listing_id, donor_contribution, csr_coverage, receiver_charge) VALUES (?, ?, 0, 0, 0)'
      ).run(crypto.randomUUID(), req.params.id);
    }
    return true;
  });

  if (!apply()) return notAllowed();
  res.status(200).json({ status: to });
});


// GET /api/listings/:id
router.get('/:id', (req, res) => {
  const db = getDb();
  const listing = db
    .prepare(
      'SELECT l.*, d.name AS donor_name, d.type AS donor_type FROM listings l JOIN donors d ON d.id = l.donor_id WHERE l.id = ?'
    )
    .get(req.params.id);
  if (!listing) return notFound(res, 'listing not found');

  let allergens = [];
  try {
    allergens = JSON.parse(listing.allergens);
  } catch {
    allergens = [];
  }
  const timeWindowMinutes = Math.max(0, Math.floor((parseUtc(listing.expires_at) - Date.now()) / 60000));
  const pickupInstructions =
    req.query.role === 'volunteer'
      ? `Contact ${listing.donor_name} at ${listing.area} zone. Ask for the event coordinator on arrival.`
      : null;

  res.status(200).json({
    listing,
    handling: {
      do_not_consume_after: listing.expires_at,
      storage_instruction: HANDLING[listing.storage],
      time_window_minutes: timeWindowMinutes,
    },
    allergens,
    disclaimer: DISCLAIMER,
    pickup_instructions: pickupInstructions,
  });
});


module.exports = router;
