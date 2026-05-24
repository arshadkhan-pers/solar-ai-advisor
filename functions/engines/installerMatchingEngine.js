const {
  calculateInstallerIntelligence
} = require("./installerScoringEngine");

async function calculateInstallerMatches({
  db,
  state,
  city,
  systemSize,
  financingLikelihood,
  leadValueScore,
  savingsPersonality
}) {

  let matchedInstallers = [];

  try {

    const installersSnapshot =
      await db.collection("installers")
        .where("status", "==", "approved")
        .get();

    installersSnapshot.forEach((doc) => {

      const installer = doc.data();

      const installerAI =
        calculateInstallerIntelligence(
          installer
        );

      let installerScore = 20;

      // STATE MATCH
      if (installer.state === state) {
        installerScore += 15;
      }

      // CITY MATCH
      const serviceAreas =
        installer.serviceAreas || [];

      if (serviceAreas.includes(city)) {
        installerScore += 20;
      }

      // FINANCING MATCH
      if (
        financingLikelihood === "High" &&
        installer.financingSupported === true
      ) {
        installerScore += 15;
      }

      // PREMIUM MATCH
      if (
        leadValueScore >= 85 &&
        installer.premiumInstaller === true
      ) {
        installerScore += 15;
      }

      // PREMIUM PENALTY
      if (
        leadValueScore < 80 &&
        installer.premiumInstaller === true
      ) {
        installerScore -= 15;
      }

      // SUBSIDY MATCH
      if (
        savingsPersonality === "Subsidy Optimized" &&
        installer.subsidySupport === true
      ) {
        installerScore += 10;
      }

      // SYSTEM SIZE MATCH
      const minSystemSize =
        installer.minSystemSize || 1;

      const maxSystemSize =
        installer.maxSystemSize || 20;

      if (
        systemSize >= minSystemSize &&
        systemSize <= maxSystemSize
      ) {
        installerScore += 10;
      }

      // AI BONUS
      installerScore += Math.round(
        installerAI.overallScore / 10
      );

      // RESPONSE PRIORITY
      installerScore += Math.min(
        installer.responsePriority || 0,
        10
      );

      installerScore =
        Math.min(installerScore, 99);

      matchedInstallers.push({

        installerId: doc.id,

        businessName:
          installer.businessName || "Installer",

        city:
          installer.baseCity || "",

        installerType:
          installer.installerType || "Standard",

        score:
          installerScore,

        installerAI:
          installerAI,

        reason:
          financingLikelihood === "High"
            ? "Financing-compatible installer"
            : leadValueScore >= 85
              ? "Premium lead compatibility"
              : "Strong regional compatibility"

      });

    });

    matchedInstallers.sort(
      (a, b) => b.score - a.score
    );

    matchedInstallers =
      matchedInstallers.slice(0, 3);

  }
  catch (error) {

    console.error(
      "Installer matching failed:",
      error
    );

  }

  return matchedInstallers;
}

module.exports = {
  calculateInstallerMatches
};