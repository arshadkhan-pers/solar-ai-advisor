// =========================
// PRICING CONFIDENCE ENGINE
// =========================

function calculatePricingConfidence(
  after
) {

  let pricingLevel =
    "Moderate";

  if (
    after.bill >= 3000
  ) {

    pricingLevel =
      "High";
  }

  return {

    level:
      pricingLevel,

    message:
      "Estimated pricing appears aligned with expected market ranges."
  };
}

module.exports = {
  calculatePricingConfidence
};
