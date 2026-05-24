function calculatePrimaryPersona(after) {

  if (after.bill >= 6000) {
    return "Investment Optimizer";
  }

  return "Smart Saver";
}

function calculateSecondaryPersona(after) {

  if (
    after.propertyType === "Independent House" &&
    after.rooftopOwnership?.includes("Yes")
  ) {
    return "Installation Ready";
  }

  if (after.bill >= 6000) {
    return "Premium Energy Consumer";
  }

  return "Long-Term Savings Focused";
}

function calculateCharacteristics(after) {

  const characteristics = [];

  if (after.bill >= 6000) {
    characteristics.push(
      "High electricity consumption"
    );

    characteristics.push(
      "Strong long-term savings potential"
    );
  }

  if (
    after.propertyType === "Independent House" &&
    after.rooftopOwnership?.includes("Yes")
  ) {
    characteristics.push(
      "Independent rooftop ownership"
    );
  }

  if (after.billUploaded === "Yes") {
    characteristics.push(
      "Research-oriented decision maker"
    );
  }

  if (
    after.connectionType === "Residential"
  ) {
    characteristics.push(
      "Stable residential usage profile"
    );
  }

  return characteristics;
}

function calculateFinancingLikelihood(after) {

  if (after.bill >= 6000) {
    return "High";
  }

  if (
    after.bill < 3000 &&
    after.propertyType === "Independent House"
  ) {
    return "Subsidy Optimized";
  }

  return "Medium";
}

function calculateUrgency(after) {

  if (
    after.rooftopOwnership?.includes("Yes") &&
    after.bill >= 2500
  ) {
    return "High";
  }

  if (after.bill >= 5000) {
    return "High";
  }

  return "Moderate";
}

function calculateSavingsPersonality(after) {

  if (after.billUploaded === "Yes") {
    return "Research Driven";
  }

  if (
    after.bill < 3000 &&
    after.rooftopOwnership?.includes("Yes")
  ) {
    return "Subsidy Optimized";
  }

  if (after.bill >= 6000) {
    return "Investment Optimizer";
  }

  return "Balanced Saver";
}

function calculateDecisionStage(after, trustScore) {

  if (
    after.billUploaded === "Yes" &&
    after.rooftopOwnership?.includes("Yes") &&
    after.propertyType === "Independent House" &&
    trustScore >= 75
  ) {
    return "Installer Ready";
  }

  if (
    after.bill >= 2500 ||
    after.billUploaded === "Yes"
  ) {
    return "Comparing Options";
  }

  return "Researching";
}

function calculateRecommendedInstallerType(
  financingLikelihood,
  savingsPersonality,
  after
) {

  if (
    savingsPersonality ===
    "Subsidy Optimized"
  ) {
    return "Subsidy Optimization Partner";
  }

  if (
    financingLikelihood === "High"
  ) {
    return "Financing Specialist";
  }

  if (after.bill >= 7000) {
    return "Premium EPC Partner";
  }

  return "Standard Residential Installer";
}

function calculatePersonaSummary(
  primaryPersona,
  installerFit,
  financingLikelihood
) {

  return `${primaryPersona} profile with ${installerFit.toLowerCase()} installer compatibility and ${financingLikelihood.toLowerCase()} financing suitability.`;
}

module.exports = {
  calculatePrimaryPersona,
  calculateSecondaryPersona,
  calculateCharacteristics,
  calculateFinancingLikelihood,
  calculateUrgency,
  calculateSavingsPersonality,
  calculateDecisionStage,
  calculateRecommendedInstallerType,
  calculatePersonaSummary
};