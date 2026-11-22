const crypto = require('crypto');
const { scoreFor, toSqlDatetime } = require('../services/matching');

// Synthetic demo data only. Names and places are made up. Bengaluru zone, neighbourhood names only.
// Source: Rescue the Surplus seed spec v1.0. The spec's `notes` field is intentionally not stored.

const KG_PER_MEAL = 0.4;
const CO2E_PER_KG = 2.5;
const COST_PER_MEAL_BASE = 12;
const HISTORY_DAYS = 30;

// id, name, type, area, lat, lng, is_verified
const DONORS = [
  ['D1', 'Meera Catering Co', 'caterer', 'Koramangala', 12.9352, 77.6245, 1],
  ['D2', 'Spice Garden Restaurant', 'restaurant', 'Indiranagar', 12.9784, 77.6408, 1],
  ['D3', 'PESIT Hostel Mess', 'hostel_mess', 'Banashankari', 12.9165, 77.5478, 0],
  ['D4', 'Sunrise Events', 'event_organiser', 'Whitefield', 12.9698, 77.7499, 0],
  ['D5', 'The Grand Buffet', 'restaurant', 'HSR Layout', 12.9116, 77.6389, 1],
  ['D6', 'City College Canteen', 'hostel_mess', 'Jayanagar', 12.9308, 77.5831, 0],
];

// id, name, type, area, lat, lng, capacity_meals, need_score
const RECEIVERS = [
  ['R1', 'Asha Community Kitchen', 'community_kitchen', 'Koramangala', 12.934, 77.622, 80, 0.9],
  ['R2', 'Hope NGO', 'ngo', 'Indiranagar', 12.976, 77.639, 50, 0.7],
  ['R3', 'Shelter First', 'shelter', 'HSR Layout', 12.91, 77.637, 40, 0.85],
  ['R4', 'Priya (Volunteer)', 'volunteer', 'Whitefield', 12.97, 77.75, 10, 0.5],
  ['R5', 'New Life Kitchen', 'community_kitchen', 'Banashankari', 12.918, 77.549, 60, 0.75],
  ['R6', 'Care Shelter', 'shelter', 'Jayanagar', 12.929, 77.582, 35, 0.8],
  ['R7', 'FoodBridge NGO', 'ngo', 'Koramangala', 12.936, 77.626, 70, 0.65],
  ['R8', 'Raju (Volunteer)', 'volunteer', 'Indiranagar', 12.978, 77.642, 15, 0.55],
];

// id, name, area, lat, lng, available
const VOLUNTEERS = [
  ['V1', 'Arvind Kumar', 'Koramangala', 12.9345, 77.623, 1],
  ['V2', 'Sunita Devi', 'Indiranagar', 12.9775, 77.64, 1],
  ['V3', 'Mohan Das', 'HSR Layout', 12.911, 77.638, 0],
];

// Timestamps are minutes relative to seed time (negative = past). `base` shifts every
// timestamp of that listing (L7 is relative to yesterday). expires is written to both
// expires_at and pickup_by (both NOT NULL in schema).
const LISTINGS = [
  { id: 'L1', donor: 'D1', food: 'veg', qty: 60, unit: 'meals', storage: 'hot', allergens: [], status: 'posted', posted: -10, expires: 110 },
  { id: 'L2', donor: 'D2', food: 'veg', qty: 25, unit: 'meals', storage: 'ambient', allergens: ['dairy'], status: 'claimed', posted: -45, claimed: -30, expires: 75, receiver: 'R1', volunteer: 'V1' },
  { id: 'L3', donor: 'D3', food: 'egg', qty: 15, unit: 'kg', storage: 'cold', allergens: ['egg'], status: 'collected', posted: -90, claimed: -70, collected: -20, expires: 30, receiver: 'R5', volunteer: 'V2' },
  { id: 'L4', donor: 'D4', food: 'non_veg', qty: 40, unit: 'meals', storage: 'hot', allergens: ['nuts'], status: 'delivered', posted: -180, claimed: -150, collected: -90, delivered: -60, expires: 0, receiver: 'R4', volunteer: 'V2' },
  { id: 'L5', donor: 'D5', food: 'veg', qty: 30, unit: 'meals', storage: 'ambient', allergens: [], status: 'posted', posted: -5, expires: 115 },
  { id: 'L6', donor: 'D6', food: 'veg', qty: 10, unit: 'kg', storage: 'cold', allergens: ['gluten'], status: 'expired', posted: -240, expires: -60 },
  { id: 'L7', donor: 'D1', food: 'veg', qty: 20, unit: 'meals', storage: 'hot', allergens: [], status: 'delivered', base: -1440, posted: -180, claimed: -150, collected: -90, delivered: -60, expires: 0, receiver: 'R1', volunteer: 'V1' },
  { id: 'L8', donor: 'D2', food: 'non_veg', qty: 50, unit: 'meals', storage: 'hot', allergens: ['shellfish'], status: 'posted', posted: -2, expires: 118 },
];

// Donor-side funding per delivered listing (synthetic). receiver_charge is always 0.
const PAYMENTS = {
  L4: { donor_contribution: 80, csr_coverage: 160 },
  L7: { donor_contribution: 40, csr_coverage: 200 },
};

const FOOD_TYPES = ['veg', 'non_veg', 'egg'];
const randInt = (lo, hi) => lo + Math.floor(Math.random() * (hi - lo + 1));
const round1 = (x) => Math.round(x * 10) / 10;

// Idempotent: does nothing unless the donors table is empty.
function seedIfEmpty(db) {
  const { n } = db.prepare('SELECT COUNT(*) AS n FROM donors').get();
  if (n > 0) return false;

  const now = Date.now();
  const at = (min) => toSqlDatetime(now + min * 60000);

  const insDonor = db.prepare(
    'INSERT INTO donors (id, name, type, area, lat, lng, is_verified) VALUES (?, ?, ?, ?, ?, ?, ?)'
  );
  const insReceiver = db.prepare(
    'INSERT INTO receivers (id, name, type, area, lat, lng, capacity_meals, need_score) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  );
  const insVolunteer = db.prepare(
    'INSERT INTO volunteers (id, name, area, lat, lng, available) VALUES (?, ?, ?, ?, ?, ?)'
  );
  const insListing = db.prepare(`
    INSERT INTO listings (
      id, donor_id, food_type, quantity_value, quantity_unit, pickup_by, storage, allergens,
      area, lat, lng, status, claimed_by_receiver_id, claimed_by_volunteer_id,
      posted_at, claimed_at, collected_at, delivered_at, expires_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const insMatch = db.prepare(`
    INSERT INTO matches (listing_id, receiver_id, score, distance_score, quantity_fit_score, time_to_spoil_score, need_score)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  const insImpact = db.prepare(`
    INSERT INTO impact_events (id, listing_id, kind, value, formula, inputs_json)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  const insPayment = db.prepare(`
    INSERT INTO payments (id, listing_id, donor_contribution, csr_coverage, receiver_charge)
    VALUES (?, ?, ?, ?, 0)
  `);

  db.transaction(() => {
    for (const d of DONORS) insDonor.run(...d);
    for (const r of RECEIVERS) insReceiver.run(...r);
    for (const v of VOLUNTEERS) insVolunteer.run(...v);

    const donorById = new Map(DONORS.map((d) => [d[0], d]));
    for (const l of LISTINGS) {
      const donor = donorById.get(l.donor);
      const base = l.base ?? 0;
      const when = (m) => (m == null ? null : at(base + m));
      const expires = when(l.expires);
      insListing.run(
        l.id,
        donor[0],
        l.food,
        l.qty,
        l.unit,
        expires,
        l.storage,
        JSON.stringify(l.allergens),
        donor[3],
        donor[4],
        donor[5],
        l.status,
        l.receiver ?? null,
        l.volunteer ?? null,
        when(l.posted),
        when(l.claimed),
        when(l.collected),
        when(l.delivered),
        expires
      );
    }

    // Pre-computed matches for posted listings, using the same scoring as live requests.
    const receivers = db.prepare('SELECT * FROM receivers').all();
    for (const l of LISTINGS.filter((x) => x.status === 'posted')) {
      const donor = donorById.get(l.donor);
      const listing = { quantity_value: l.qty, pickup_by: at(l.expires), lat: donor[4], lng: donor[5] };
      for (const r of receivers) {
        const { score, components: c } = scoreFor(listing, r, now);
        insMatch.run(l.id, r.id, score, c.distance_score, c.quantity_fit_score, c.time_to_spoil_score, c.need_score);
      }
    }

    // Funding for the delivered listings L4 and L7.
    for (const l of LISTINGS.filter((x) => x.status === 'delivered')) {
      const p = PAYMENTS[l.id];
      insPayment.run(crypto.randomUUID(), l.id, p.donor_contribution, p.csr_coverage);
    }

    // 30 days of synthetic delivered history: one listing, four impact events and one payment per day.
    const receiverIds = RECEIVERS.map((r) => r[0]);
    const volunteerIds = VOLUNTEERS.map((v) => v[0]);
    for (let d = 1; d <= HISTORY_DAYS; d++) {
      const listingId = `hist-${String(d).padStart(2, '0')}`;
      const dayBase = -1440 * d;
      const donor = DONORS[randInt(0, DONORS.length - 1)];
      const meals = randInt(10, 80);
      const kg = round1(meals * KG_PER_MEAL);
      const co2e = round1(kg * CO2E_PER_KG);
      const cost = meals * COST_PER_MEAL_BASE;

      insListing.run(
        listingId,
        donor[0],
        FOOD_TYPES[randInt(0, FOOD_TYPES.length - 1)],
        meals,
        'meals',
        at(dayBase),
        'hot',
        '[]',
        donor[3],
        donor[4],
        donor[5],
        'delivered',
        receiverIds[randInt(0, receiverIds.length - 1)],
        volunteerIds[randInt(0, volunteerIds.length - 1)],
        at(dayBase - 180),
        at(dayBase - 150),
        at(dayBase - 90),
        at(dayBase - 60),
        at(dayBase)
      );

      insImpact.run(crypto.randomUUID(), listingId, 'meals_saved', meals, 'quantity_value (meals)', JSON.stringify({ meals }));
      insImpact.run(
        crypto.randomUUID(),
        listingId,
        'kg_diverted',
        kg,
        'meals × 0.4 kg per meal',
        JSON.stringify({ meals, kg_per_meal: KG_PER_MEAL })
      );
      insImpact.run(
        crypto.randomUUID(),
        listingId,
        'co2e_avoided',
        co2e,
        'kg_diverted × 2.5 kg CO₂e per kg food',
        JSON.stringify({ kg, co2e_per_kg: CO2E_PER_KG })
      );
      insImpact.run(
        crypto.randomUUID(),
        listingId,
        'cost_per_meal',
        cost,
        'meals * 12',
        JSON.stringify({ meals, cost_per_meal_base: COST_PER_MEAL_BASE })
      );

      const donorContribution = randInt(0, 120);
      insPayment.run(crypto.randomUUID(), listingId, donorContribution, 240 - donorContribution);
    }
  })();

  return true;
}

module.exports = { seedIfEmpty };
