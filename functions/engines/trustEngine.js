/* eslint-disable max-len */

// ==========================================
// TRUST SCORE ENGINE
// ==========================================

function calculateTrustScore(after) {

  let trustScore = 50;

  if (after.bill >= 3000) {
    trustScore += 10;
  }

  if (
    after.rooftopOwnership?.includes("Yes")
  ) {
    trustScore += 15;
  }

  if (
    after.propertyType ===
    "Independent House"
  ) {
    trustScore += 10;
  }

  if (
    after.billUploaded === "Yes"
  ) {
    trustScore += 10;
  }

  if (
    after.connectionType ===
    "Residential"
  ) {
    trustScore += 5;
  }

  return Math.min(
    trustScore,
    98
  );
}

// ==========================================
// INSTALLER FIT
// ==========================================

function calculateInstallerFit(
  trustScore
) {

  let installerFit = "Moderate";

  if (trustScore >= 80) {

    installerFit = "Excellent";

  } else if (trustScore >= 65) {

    installerFit = "Strong";
  }

  return installerFit;
}

// ==========================================
// LEAD TEMPERATURE
// ==========================================

function calculateLeadTemperature(
  after,
  trustScore
) {

  let leadTemperature = "Cold";

  if (
    after.bill >= 2000 ||
    trustScore >= 60
  ) {

    leadTemperature = "Warm";
  }

  if (
    after.bill >= 4000 &&
    after.rooftopOwnership?.includes("Yes") &&
    after.propertyType === "Independent House" &&
    trustScore >= 75
  ) {

    leadTemperature = "Hot";
  }

  return leadTemperature;
}

// ==========================================
// LEAD VALUE SCORE
// ==========================================

function calculateLeadValueScore(
  after,
  trustScore
) {

  let leadValueScore =
    trustScore;

  if (after.bill >= 5000) {
    leadValueScore += 10;
  }

  if (
    after.billUploaded === "Yes"
  ) {
    leadValueScore += 5;
  }

  if (
    after.propertyType ===
    "Independent House"
  ) {
    leadValueScore += 5;
  }

  return Math.min(
    leadValueScore,
    99
  );
}

// ==========================================
// CONVERSION PROBABILITY
// ==========================================

function calculateConversionProbability(
  after,
  trustScore
) {

  let conversionProbability = 45;

  // Strong bill economics
  if (after.bill >= 3000) {
    conversionProbability += 15;
  }

  // Premium users
  if (after.bill >= 6000) {
    conversionProbability += 10;
  }

  // Rooftop ownership
  if (
    after.rooftopOwnership?.includes("Yes")
  ) {
    conversionProbability += 15;
  }

  // Independent house
  if (
    after.propertyType ===
    "Independent House"
  ) {
    conversionProbability += 10;
  }

  // Bill uploaded
  if (
    after.billUploaded === "Yes"
  ) {
    conversionProbability += 10;
  }

  // Trust score boost
  if (trustScore >= 80) {
    conversionProbability += 10;
  }

  return Math.min(
    conversionProbability,
    98
  );
}

// ==========================================
// CONVERSION LABEL
// ==========================================

function calculateConversionLabel(
  conversionProbability
) {

  let conversionLabel =
    "Moderate Interest";

  if (
    conversionProbability >= 80
  ) {

    conversionLabel =
      "Highly Likely";

  } else if (
    conversionProbability >= 65
  ) {

    conversionLabel =
      "Strong Potential";
  }

  return conversionLabel;
}

// ==========================================
// LEAD QUALITY BAND
// ==========================================

function calculateLeadQualityBand(
  conversionProbability,
  trustScore
) {

  let leadQualityBand =
    "Standard";

  if (
    conversionProbability >= 80 &&
    trustScore >= 80
  ) {

    leadQualityBand =
      "Premium";

  } else if (
    conversionProbability >= 65
  ) {

    leadQualityBand =
      "High Potential";
  }

  return leadQualityBand;
}

// ==========================================
// SALES COMPLEXITY
// ==========================================

function calculateSalesComplexity(
  after,
  decisionStage
) {

  let salesComplexity =
    "Moderate";

  if (
    after.propertyType ===
    "Apartment"
  ) {

    salesComplexity =
      "High";
  }

  if (
    decisionStage ===
    "Installer Ready"
  ) {

    salesComplexity =
      "Low";
  }

  return salesComplexity;
}

// ==========================================
// INSTALLER PRIORITY
// ==========================================

function calculateInstallerPriority(
  decisionStage,
  financingLikelihood,
  after,
  trustScore
) {

  let installerPriority =
    "Normal";

  if (
    after.bill >= 7000 &&
    trustScore >= 80
  ) {

    installerPriority =
      "High";
  }

  if (
    financingLikelihood === "High"
  ) {

    installerPriority =
      "High";
  }

  if (
    decisionStage ===
    "Installer Ready"
  ) {

    installerPriority =
      "Urgent";
  }

  return installerPriority;
}

// ==========================================
// EXPORTS
// ==========================================

module.exports = {
  calculateTrustScore,
  calculateInstallerFit,
  calculateLeadTemperature,
  calculateLeadValueScore,
  calculateConversionProbability,
  calculateConversionLabel,
  calculateLeadQualityBand,
  calculateSalesComplexity,
  calculateInstallerPriority
};