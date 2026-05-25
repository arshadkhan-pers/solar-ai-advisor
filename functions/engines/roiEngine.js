// =========================
// ROI CATEGORY ENGINE
// =========================

function calculateROICategory(
  resultPaybackYears
) {

  let roiCategory =
    "Moderate ROI";

  if (
    resultPaybackYears <= 4
  ) {

    roiCategory =
      "Excellent ROI";
  }
  else if (
    resultPaybackYears <= 6
  ) {

    roiCategory =
      "Strong ROI";
  }

  return roiCategory;
}

// =========================
// SUBSIDY DEPENDENCY ENGINE
// =========================

function calculateSubsidyDependency(
  savingsPersonality,
  after
) {

  let subsidyDependency =
    "Balanced";

  if (
    savingsPersonality ===
    "Subsidy Optimized"
  ) {

    subsidyDependency =
      "High";
  }

  if (
    after.bill >= 6000
  ) {

    subsidyDependency =
      "Low";
  }

  return subsidyDependency;
}

module.exports = {
  calculateROICategory,
  calculateSubsidyDependency
};
