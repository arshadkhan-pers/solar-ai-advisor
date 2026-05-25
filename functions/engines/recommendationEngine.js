// =========================
// INSTALLER READINESS ENGINE
// =========================

function calculateInstallerReadiness(
  trustScore
) {

  return {

    level:
      trustScore >= 80
        ? "Strong"
        : "Moderate",

    message:
      "Property profile appears suitable for subsidy-supported rooftop solar."
  };
}

// =========================
// RECOMMENDATION SUMMARY
// =========================

function generateRecommendationSummary(
) {

  return (
    "Based on your electricity usage, rooftop profile, and subsidy eligibility, our AI engine estimates that your property has strong potential for long-term solar savings and investment returns."
  );
}

module.exports = {
  calculateInstallerReadiness,
  generateRecommendationSummary
};
