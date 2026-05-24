// ==========================================
// 🧠 INSTALLER INTELLIGENCE SCORING ENGINE
// ==========================================

function calculateInstallerIntelligence(
  installer = {}
) {

  // =========================
  // RELIABILITY SCORE
  // =========================

  let reliabilityScore = 50;

  if (installer.active === true) {
    reliabilityScore += 15;
  }

  if (
    installer.status === "approved"
  ) {
    reliabilityScore += 15;
  }

  if (
    installer.ratingScore >= 4.5
  ) {
    reliabilityScore += 10;
  }

  reliabilityScore =
    Math.min(reliabilityScore, 99);

  // =========================
  // EXPERIENCE SCORE
  // =========================

  let experienceScore = 40;

  const totalInstallations =
    installer.totalInstallations || 0;

  if (totalInstallations >= 100) {
    experienceScore += 30;
  }
  else if (totalInstallations >= 50) {
    experienceScore += 20;
  }
  else if (totalInstallations >= 10) {
    experienceScore += 10;
  }

  experienceScore =
    Math.min(experienceScore, 99);

  // =========================
  // PREMIUM CAPABILITY
  // =========================

  let premiumCapability = 40;

  if (
    installer.premiumInstaller === true
  ) {
    premiumCapability += 30;
  }

  if (
    installer.financingSupported === true
  ) {
    premiumCapability += 15;
  }

  if (
    installer.maxSystemSize >= 20
  ) {
    premiumCapability += 15;
  }

  premiumCapability =
    Math.min(premiumCapability, 99);

  // =========================
  // SUBSIDY EXPERTISE
  // =========================

  let subsidyExpertise = 40;

  if (
    installer.subsidySupport === true
  ) {
    subsidyExpertise += 30;
  }

  if (
    installer.financingSupported === true
  ) {
    subsidyExpertise += 10;
  }

  subsidyExpertise =
    Math.min(subsidyExpertise, 99);

  // =========================
  // RESPONSE SCORE
  // =========================

  let responseScore =
    installer.responsePriority || 50;

  responseScore =
    Math.min(responseScore, 99);

  // =========================
  // OVERALL SCORE
  // =========================

  const overallScore =
    Math.round(
      (
        reliabilityScore +
        experienceScore +
        premiumCapability +
        subsidyExpertise +
        responseScore
      ) / 5
    );

  // =========================
  // RETURN
  // =========================

  return {

    reliabilityScore,

    experienceScore,

    premiumCapability,

    subsidyExpertise,

    responseScore,

    overallScore

  };

}

module.exports = {
  calculateInstallerIntelligence
};