const { getDb } = require('../db/connection');
const { parseUtc } = require('../services/matching');

const FOOD_TYPES = ['veg', 'non_veg', 'egg'];
const UNITS = ['meals', 'kg'];
const STORAGE = ['hot', 'cold', 'ambient'];

function fail(res, field, message) {
  return res.status(400).json({ error: message, field });
}

function notFound(res, message = 'Not found') {
  return res.status(404).json({ error: message });
}

// Validates a new listing body. On success, attaches the donor row as req.donor.
function validateListing(req, res, next) {
  const b = req.body || {};

  if (!FOOD_TYPES.includes(b.food_type)) {
    return fail(res, 'food_type', 'food_type must be one of: veg, non_veg, egg');
  }
  if (!UNITS.includes(b.quantity_unit)) {
    return fail(res, 'quantity_unit', 'quantity_unit must be one of: meals, kg');
  }
  if (typeof b.quantity_value !== 'number' || !Number.isFinite(b.quantity_value) || b.quantity_value <= 0) {
    return fail(res, 'quantity_value', 'quantity_value must be a number greater than 0');
  }
  if (!STORAGE.includes(b.storage)) {
    return fail(res, 'storage', 'storage must be one of: hot, cold, ambient');
  }
  const pickupMs = parseUtc(b.pickup_by);
  if (!Number.isFinite(pickupMs) || pickupMs < Date.now()) {
    return fail(res, 'pickup_by', 'pickup_by must be a valid date-time that is now or in the future');
  }
  if (typeof b.donor_id !== 'string') {
    return fail(res, 'donor_id', 'donor_id is required');
  }
  const donor = getDb().prepare('SELECT id, area FROM donors WHERE id = ?').get(b.donor_id);
  if (!donor) {
    return res.status(404).json({ error: 'donor not found', field: 'donor_id' });
  }
  if (!Number.isFinite(b.lat)) {
    return fail(res, 'lat', 'lat must be a finite number');
  }
  if (!Number.isFinite(b.lng)) {
    return fail(res, 'lng', 'lng must be a finite number');
  }
  if (b.allergens !== undefined && !Array.isArray(b.allergens)) {
    return fail(res, 'allergens', 'allergens must be an array');
  }


  req.donor = donor;
  next();
}

module.exports = { validateListing, notFound };
