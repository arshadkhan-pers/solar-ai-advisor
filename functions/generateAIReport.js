/* eslint-disable max-len */
// 🛠️ Reverted to 1st Gen listener to bypass the Cloud block
//const functions = require("firebase-functions");
const { onDocumentUpdated } = require("firebase-functions/v2/firestore");
const admin = require("firebase-admin");
const {calculateCentralSubsidy,calculateStateSubsidy} = require("./engines/subsidyEngine");
const {
  calculateInstallerIntelligence
} = require("./engines/installerScoringEngine");

const {
  calculateTrustScore,
  calculateInstallerFit,
  calculateLeadTemperature,
  calculateLeadValueScore,
  calculateConversionProbability,
  calculateConversionLabel,
  calculateLeadQualityBand,
  calculateSalesComplexity,
  calculateInstallerPriority
} = require("./engines/trustEngine");

const {
  calculatePrimaryPersona,
  calculateSecondaryPersona,
  calculateCharacteristics,
  calculateFinancingLikelihood,
  calculateUrgency,
  calculateSavingsPersonality,
  calculateDecisionStage,
  calculateRecommendedInstallerType,
  calculatePersonaSummary
} = require("./engines/personaEngine");

const db = admin.firestore();

// 🌐 Modern Gen 2 trigger architecture targeting Mumbai (asia-south1)
exports.generateAIReport = onDocumentUpdated(
  { 
    document: "leads/{leadId}", 
    region: "asia-south2" 
  }, 
  async (event) => {
    
    // In Gen 2, before and after snapshots live inside event.data
    const change = event.data;
    if (!change) return null;

    const before = change.before.data();
    const after = change.after.data();
    
    if (!after.aiRegenerationRequired) {
  return null;
}
    
    // In Gen 2, wildcard parameters live inside event.params
    const leadId = event.params.leadId;

    if (!before || !after) return null;

// ✅ Only process qualified leads
if (after.stage !== "qualified") {
  return null;
}


    console.log("🚀 Generating AI Report & Sizing Math for:", leadId);

  
    // ==========================================
    // 🧮 PAN-INDIA CALCULATION ENGINE
    // ==========================================
    const bill = parseFloat(after.bill || 0);
    const state = after.state || "UP";
    const city = after.city || "N/A";
    
    const units = bill / 7;
    const systemSize = Math.max(1, Math.round(units / 120));
    const costPerKW = 55000;
    const totalCost = systemSize * costPerKW;

    const centralSubsidy = calculateCentralSubsidy(systemSize, state);
    const stateSubsidy = calculateStateSubsidy(systemSize, state, bill, totalCost, centralSubsidy);

    const totalSubsidy = centralSubsidy + stateSubsidy;
    const netCost = totalCost - totalSubsidy;
    
    const monthlySavings = units * 7;
    const resultPaybackYears = netCost / (monthlySavings * 12);
    const trustScore =
    
    calculateTrustScore(after);

    // 💾 UPDATE LEADS DOC WITH CALCULATED DETAILS
    await change.after.ref.update({
      systemSizeKw: systemSize.toFixed(1),
      totalSubsidy: totalSubsidy,
      netCost: netCost,
      centralSubsidy: centralSubsidy,
      stateSubsidy: stateSubsidy,
      calculatedAt: admin.firestore.FieldValue.serverTimestamp()
     // aiRegenerationRequired: false
    });
    
    // =========================
    // PERSONA ENGINE V2
    // =========================

// Legacy persona (DO NOT REMOVE)
let persona = "Smart Saver";

if (after.bill >= 5000) {
  persona = "ROI Focused";
}

if (after.billUploaded === "Yes") {
  persona = "Research Driven";
}

if (
  after.propertyType === "Independent House" &&
  after.rooftopOwnership?.includes("Yes")
) {
  persona = "Solar Ready";
}

const installerFit =
  calculateInstallerFit(
    trustScore
  );
  
  const primaryPersona =
  calculatePrimaryPersona(after);

const secondaryPersona =
  calculateSecondaryPersona(after);

const characteristics =
  calculateCharacteristics(after);

const financingLikelihood =
  calculateFinancingLikelihood(after);

const urgency =
  calculateUrgency(after);

const savingsPersonality =
  calculateSavingsPersonality(after);

const decisionStage =
  calculateDecisionStage(
    after,
    trustScore
  );

const recommendedInstallerType =
  calculateRecommendedInstallerType(
    financingLikelihood,
    savingsPersonality,
    after
  );

const personaSummary =
  calculatePersonaSummary(
    primaryPersona,
    installerFit,
    financingLikelihood
  );

const leadTemperature =
  calculateLeadTemperature(
    after,
    trustScore
  );

const leadValueScore =
  calculateLeadValueScore(
    after,
    trustScore
  );


// =========================
// INSTALLER MATCHING ENGINE
// =========================

let matchedInstallerTier =
  "Standard";

const installerPriority =
  calculateInstallerPriority(
    decisionStage,
    financingLikelihood,
    after,
    trustScore
  );
if (
  financingLikelihood === "High"
) {
  matchedInstallerTier =
    "Financing";
}

if (
  savingsPersonality ===
  "Subsidy Optimized"
) {
  matchedInstallerTier =
    "Subsidy Specialist";
}

if (
  leadValueScore >= 85
) {
  matchedInstallerTier =
    "Premium";
}

const conversionProbability =
  calculateConversionProbability(
    after,
    trustScore
  );
  
// =========================
// LEAD QUALITY DASHBOARD
// =========================

const leadQualityBand =
  calculateLeadQualityBand(
    conversionProbability,
    trustScore
  );
  

// ROI CATEGORY
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

// SUBSIDY DEPENDENCY
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

const salesComplexity =
  calculateSalesComplexity(
    after,
    decisionStage
  );

const conversionLabel =
  calculateConversionLabel(
    conversionProbability
  );
  
const personaV2 = {

  primary: primaryPersona,

  secondary: secondaryPersona,

  confidence:
    Math.min(trustScore + 8, 99),

  urgency: urgency,

  financingLikelihood:
    financingLikelihood,

  installerFit:
    installerFit,

  characteristics:
    characteristics,

  summary:
    personaSummary,

  // =========================
  // PERSONA ENGINE V2.5
  // =========================

  savingsPersonality:
    savingsPersonality,

  decisionStage:
    decisionStage,

  leadTemperature:
    leadTemperature,

  leadValueScore:
    leadValueScore,

  recommendedInstallerType:
    recommendedInstallerType,

  conversionProbability:
    conversionProbability,

  conversionLabel:
    conversionLabel,
    
  matchedInstallerTier:
    matchedInstallerTier,

  installerPriority:
    installerPriority,

  leadQualityBand:
    leadQualityBand,

  roiCategory:
    roiCategory,

  subsidyDependency:
    subsidyDependency,

  salesComplexity:
    salesComplexity
};

// =========================
// REAL INSTALLER MATCHING ENGINE
// =========================

let matchedInstallers = [];

try {

  const installersSnapshot =
    await db.collection("installers")
      .where("status", "==", "approved")
      .get();

  installersSnapshot.forEach((doc) => {

    const installer = doc.data();
    const installerAI = calculateInstallerIntelligence(installer);

    let installerScore = 20;

    // =========================
    // STATE MATCH
    // =========================
    if (
      installer.state === state
    ) {
      installerScore += 15;
    }

    // =========================
    // CITY / SERVICE AREA MATCH
    // =========================
    const serviceAreas =
      installer.serviceAreas || [];

    if (
      serviceAreas.includes(city)
    ) {
      installerScore += 20;
    }

    // =========================
    // FINANCING MATCH
    // =========================
    if (
      financingLikelihood === "High" &&
      installer.financingSupported === true
    ) {
      installerScore += 15;
    }

    // =========================
    // PREMIUM LEAD MATCH
    // =========================
    if (
      leadValueScore >= 85 &&
      installer.premiumInstaller === true
    ) {
      installerScore += 15;
    }

// =========================
// PREMIUM MISMATCH PENALTY
// =========================

if (
  leadValueScore < 80 &&
  installer.premiumInstaller === true
) {
  installerScore -= 15;
}

    // =========================
    // SUBSIDY MATCH
    // =========================
    if (
      savingsPersonality === "Subsidy Optimized" &&
      installer.subsidySupport === true
    ) {
      installerScore += 10;
    }

    // =========================
    // SYSTEM SIZE MATCH
    // =========================
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

    // =========================
    // EXPERIENCE BONUS
    // =========================
    /*
    const ratingScore =
      installer.ratingScore || 4;
      installerScore +=
      Math.round(ratingScore * 2);
      */

      installerScore +=
  Math.round(
    installerAI.overallScore / 10
  );

    

    // =========================
    // RESPONSE PRIORITY
    // =========================
  
  installerScore += Math.min(
  installer.responsePriority || 0,10);
    // =========================
    // FINAL CAP
    // =========================
    installerScore =
      Math.min(installerScore, 99);

    matchedInstallers.push({

      installerId:
        doc.id,

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

  // =========================
  // SORT BEST FIRST
  // =========================
  matchedInstallers.sort(
    (a, b) => b.score - a.score
  );

  // Keep top 3
  matchedInstallers =
    matchedInstallers.slice(0, 3);

}
catch (error) {

  console.error(
    "Installer matching failed:",
    error
  );

}


    // =========================
    // AI INSIGHTS
    // =========================
    const aiInsights = [];
    if (trustScore >= 80) aiInsights.push("Your property profile appears highly suitable for rooftop solar installation.");
    if (after.bill >= 3000) aiInsights.push("Your current electricity consumption indicates strong long-term savings potential.");
    if (after.billUploaded === "Yes") aiInsights.push("Bill verification improves pricing accuracy and installer transparency.");
    aiInsights.push("Government subsidy benefits may significantly reduce your upfront investment.");

    // =========================
    // BUYER PROTECTION
    // =========================
    const buyerProtectionChecklist = [
      "Verify panel brand and warranty documentation before installation.",
      "Ensure installer provides net-metering assistance.",
      "Request written system performance commitments.",
      "Confirm post-installation support and maintenance coverage."
    ];

    let pricingLevel = "Moderate";
    if (after.bill >= 3000) pricingLevel = "High";

    const recommendationSummary = `Based on your electricity usage, rooftop profile, and subsidy eligibility, our AI engine estimates that your property has strong potential for long-term solar savings and investment returns.`;

    // =========================================
    // SAVE AI REPORT
    // =========================================

await db.collection("ai_reports")
  .doc(leadId)
  .set({
    leadId: leadId,
    leadCode: after.leadCode || null,
    customerId: after.customerId || null,

    customerName: after.name || "N/A",
    customerEmail: after.email || null,
    city: city,
    state: state,

    systemSizeKw: systemSize.toFixed(1),
    totalSubsidy: totalSubsidy,
    netCost: netCost,
    centralSubsidy: centralSubsidy,
    stateSubsidy: stateSubsidy,

    trustScore: trustScore,

    persona: {
      type: persona,
      confidence: Math.min(trustScore + 5, 99)
    },

    personaV2: personaV2,
    matchedInstallers:
     matchedInstallers,
  
    pricingConfidence: {
      level: pricingLevel,
      message:
        "Estimated pricing appears aligned with expected market ranges."
    },

    installerReadiness: {
      level: trustScore >= 80 ? "Strong" : "Moderate",
      message:
        "Property profile appears suitable for subsidy-supported rooftop solar."
    },

    aiInsights: aiInsights,

    buyerProtectionChecklist:
      buyerProtectionChecklist,

    recommendationSummary:
      recommendationSummary,

    generatedAt:
      admin.firestore.FieldValue.serverTimestamp(),

    engineVersion:
      "trust-v1-with-math-v2-payload"
  });

console.log(
  "✅ AI Report & Math generated successfully:",
  leadId
);

await db.collection("leads")
  .doc(leadId)
  .update({
    aiRegenerationRequired: false
  });

return null;
});
