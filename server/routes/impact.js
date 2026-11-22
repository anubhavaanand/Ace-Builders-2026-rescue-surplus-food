const express = require('express');
const { getDb } = require('../db/connection');
const { getImpact } = require('../services/impact');

const router = express.Router();

// GET /api/impact
router.get('/', (req, res) => {
  const { metrics, formula_meta, funding_split } = getImpact(getDb());
  res.status(200).json({ metrics, formula_meta, funding_split });
});

module.exports = router;
