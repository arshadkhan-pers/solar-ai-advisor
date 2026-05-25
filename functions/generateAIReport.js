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

const {
  calculateROICategory,
  calculateSubsidyDependency
} = require("./engines/roiEngine");

const {
  calculateInstallerMatches
} = require("./engines/installerMatchingEngine");

const {
  generateAIInsights,
  generateBuyerProtectionChecklist,
  generatePricingConfidence,
  generateRecommendationSummary
} = require("./templates/insightsTemplates");


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

    const roiCategory =
  calculateROICategory(
    resultPaybackYears
  );

const subsidyDependency =
  calculateSubsidyDependency(
    savingsPersonality,
    after
  );
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

const matchedInstallers =
  await calculateInstallerMatches({
    db,
    state,
    city,
    systemSize,
    financingLikelihood,
    leadValueScore,
    savingsPersonality
  });

const aiInsights =
  generateAIInsights(
    after,
    trustScore
  );

const buyerProtectionChecklist =
  generateBuyerProtectionChecklist();

const pricingConfidence =
  generatePricingConfidence(
    after
  );

const recommendationSummary =
  generateRecommendationSummary();
  

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
  type: primaryPersona,
  confidence: Math.min(trustScore + 8, 99)
},

    personaV2: personaV2,
    matchedInstallers:
     matchedInstallers,
  
    pricingConfidence:
     pricingConfidence,

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
