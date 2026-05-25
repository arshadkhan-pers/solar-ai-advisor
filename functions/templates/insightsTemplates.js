function generateAIInsights(
  after,
  trustScore
) {

  const insights = [];

  // =========================
  // TRUST PROFILE
  // =========================

  if (
    trustScore >= 80
  ) {

    insights.push(
      "Your property profile appears highly suitable for rooftop solar installation."
    );
  }

  // =========================
  // SAVINGS POTENTIAL
  // =========================

  if (
    after.bill >= 6000
  ) {

    insights.push(
      "Your electricity usage indicates exceptionally strong long-term solar savings potential."
    );
  }
  else if (
    after.bill >= 3000
  ) {

    insights.push(
      "Your current electricity consumption indicates strong long-term savings potential."
    );
  }

  // =========================
  // BILL VERIFIED
  // =========================

  if (
    after.billUploaded === "Yes"
  ) {

    insights.push(
      "Bill verification improves pricing accuracy and installer transparency."
    );
  }

  // =========================
  // ROOFTOP READINESS
  // =========================

  if (
    after.rooftopOwnership?.includes("Yes")
  ) {

    insights.push(
      "Your rooftop ownership profile may simplify installation and subsidy processing."
    );
  }

  // =========================
  // INDEPENDENT HOUSE
  // =========================

  if (
    after.propertyType ===
    "Independent House"
  ) {

    insights.push(
      "Independent house properties generally achieve faster rooftop solar deployment."
    );
  }

  // =========================
  // SUBSIDY
  // =========================

  insights.push(
    "Government subsidy benefits may significantly reduce your upfront investment."
  );

  return insights;
}

function generateBuyerProtectionChecklist() {

  return [

    "Verify panel brand and warranty documentation before installation.",

    "Ensure installer provides net-metering assistance.",

    "Request written system performance commitments.",

    "Confirm post-installation support and maintenance coverage."

  ];
}

function generatePricingConfidence(
  after
) {

  let pricingLevel = "Moderate";

  if (after.bill >= 3000) {
    pricingLevel = "High";
  }

  return {

    level: pricingLevel,

    message:
      "Estimated pricing appears aligned with expected market ranges."

  };
}

function generateRecommendationSummary() {

  return (
    "Based on your electricity usage, rooftop profile, and subsidy eligibility, our AI engine estimates that your property has strong potential for long-term solar savings and investment returns."
  );
}

module.exports = {

  generateAIInsights,

  generateBuyerProtectionChecklist,

  generatePricingConfidence,

  generateRecommendationSummary

};
