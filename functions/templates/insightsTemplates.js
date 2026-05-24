function generateAIInsights(
  after,
  trustScore
) {

  const aiInsights = [];

  if (trustScore >= 80) {

    aiInsights.push(
      "Your property profile appears highly suitable for rooftop solar installation."
    );
  }

  if (after.bill >= 3000) {

    aiInsights.push(
      "Your current electricity consumption indicates strong long-term savings potential."
    );
  }

  if (after.billUploaded === "Yes") {

    aiInsights.push(
      "Bill verification improves pricing accuracy and installer transparency."
    );
  }

  aiInsights.push(
    "Government subsidy benefits may significantly reduce your upfront investment."
  );

  return aiInsights;
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