const CO2_KG_PER_MEAL = 2.5;
const KG_PER_MEAL = 0.4;

const r1 = (x) => Math.round(x * 10) / 10;
const r2 = (x) => Math.round(x * 100) / 100;

function getImpact(db) {
  const delivered = db
    .prepare("SELECT COALESCE(SUM(quantity_value), 0) AS total, COUNT(*) AS n FROM listings WHERE status = 'delivered'")
    .get();
  const funding = db
    .prepare(
      "SELECT COALESCE(SUM(p.donor_contribution), 0) AS donor_contribution, COALESCE(SUM(p.csr_coverage), 0) AS csr_coverage, COALESCE(SUM(p.receiver_charge), 0) AS receiver_charge FROM payments p JOIN listings l ON l.id = p.listing_id WHERE l.status = 'delivered'"
    )
    .get();

  const mealsSaved = r2(delivered.total);
  const kgDiverted = r1(mealsSaved * KG_PER_MEAL);
  const co2eAvoidedKg = r1(kgDiverted * CO2_KG_PER_MEAL);
  const totalFunding = r2(funding.donor_contribution + funding.csr_coverage);
  const costPerMealSaved = mealsSaved > 0 ? r2(totalFunding / mealsSaved) : 0;

  const formula_meta = {
    meals_saved: {
      formula: 'SUM(quantity_value) over listings with status = delivered',
      inputs: { delivered_listing_count: delivered.n },
    },
    kg_diverted: {
      formula: 'meals_saved * 0.4',
      inputs: { meals_saved: mealsSaved, kg_per_meal: KG_PER_MEAL },
    },
    co2e_avoided_kg: {
      formula: 'kg_diverted * 2.5',
      inputs: { kg_diverted: kgDiverted, co2e_factor: CO2_KG_PER_MEAL },
    },
    cost_per_meal_saved: {
      formula: 'SUM(donor_contribution + csr_coverage) over delivered listings / SUM(quantity_value) over delivered listings',
      inputs: { total_funding: totalFunding, meals_saved: mealsSaved },
    },
  };

  return {
    metrics: {
      meals_saved: Math.round(mealsSaved),
      kg_diverted: kgDiverted,
      co2e_avoided_kg: co2eAvoidedKg,
      cost_per_meal_saved: costPerMealSaved,
    },
    formula_meta,
    funding_split: {
      donor_contributed: r2(funding.donor_contribution),
      csr_coverage: r2(funding.csr_coverage),
      receiver_paid: r2(funding.receiver_charge),
    },
  };
}

module.exports = { getImpact };
