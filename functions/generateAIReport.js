/* eslint-disable max-len */
// 🛠️ Reverted to 1st Gen listener to bypass the Cloud block
//const functions = require("firebase-functions");
const { onDocumentUpdated } = require("firebase-functions/v2/firestore");
const admin = require("firebase-admin");

const db = admin.firestore();

// ==========================================
// 🇮🇳 PAN-INDIA SUBSIDY CONFIGURATION
// ==========================================
const specialStates = ["AS", "UK", "HP", "JK", "LA", "SK"];
const zeroTopUpStates = ["KL", "KA", "TN", "TS", "PB", "WB", "HR", "CG"];

const stateSubsidyConfig = {
  "UP": { type: "perKW", value: 15000, cap: 30000 },
  "GJ": { type: "perKW", value: 10000, cap: 30000 },
  "DL": { type: "perKW", value: 10000, cap: 30000 },
  "RJ": { type: "perKW", value: 8000, cap: 24000 },
  "MH": { type: "perKW", value: 22000, cap: 60000 },
  "AS": { type: "perKW", value: 15000, cap: 45000 },
  "OR": { type: "perKW", value: 10000, cap: 30000 },
  "BR": { type: "perKW", value: 10000, cap: 30000 },
  "MP": { type: "perKW", value: 5000, cap: 15000 },
  "UK": { type: "flat", value: 15000 },
  "GA": { type: "goa_model" }
};

function calculateCentralSubsidy(systemSize, state) {
  let subsidy = 0;
  if (systemSize <= 2) {
    subsidy = systemSize * 30000;
  } else if (systemSize <= 3) {
    subsidy = (2 * 30000) + ((systemSize - 2) * 18000);
  } else {
    subsidy = 78000;
  }
  if (specialStates.includes(state)) {
    subsidy = subsidy * 1.1;
  }
  return Math.round(subsidy);
}

function calculateStateSubsidy(systemSize, state, bill, totalCost, centralSubsidy) {
  if (zeroTopUpStates.includes(state)) return 0;
  const config = stateSubsidyConfig[state];
  if (!config) return 0;

  if (config.type === "goa_model") {
    const units = bill / 7;
    if (units <= 400) {
      if (systemSize <= 5) {
        const required = totalCost - centralSubsidy;
        return Math.min(required, 250000);
      }
    }
    let subsidy = systemSize * 23000;
    subsidy = Math.min(subsidy, 250000);
    return Math.round(subsidy);
  }

  let subsidy = 0;
  if (config.type === "flat") {
    subsidy = config.value;
  }
  if (config.type === "perKW") {
    subsidy = systemSize * config.value;
    subsidy = Math.min(subsidy, config.cap);
  }
  return Math.round(subsidy);
}


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
    // TRUST SCORE ENGINE
    // =========================
    let trustScore = 50;
    if (after.bill >= 3000) trustScore += 10;
    if (after.rooftopOwnership?.includes("Yes")) trustScore += 15;
    if (after.propertyType === "Independent House") trustScore += 10;
    if (after.billUploaded === "Yes") trustScore += 10;
    if (after.connectionType === "Residential") trustScore += 5;
    trustScore = Math.min(trustScore, 98);

    
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

// ====================================
// NEW ADVANCED PERSONA ENGINE
// ====================================

let primaryPersona = "Smart Saver";
let secondaryPersona = "Long-Term Savings Focused";

const characteristics = [];

// HIGH BILL USERS
if (after.bill >= 6000) {
  primaryPersona = "Investment Optimizer";
  secondaryPersona = "Premium Energy Consumer";

  characteristics.push(
    "High electricity consumption"
  );

  characteristics.push(
    "Strong long-term savings potential"
  );
}

// ROOFTOP READY
if (
  after.propertyType === "Independent House" &&
  after.rooftopOwnership?.includes("Yes")
) {

  secondaryPersona = "Installation Ready";

  characteristics.push(
    "Independent rooftop ownership"
  );
}

// RESEARCH-ORIENTED USERS
if (after.billUploaded === "Yes") {

  characteristics.push(
    "Research-oriented decision maker"
  );
}

// LOW RISK USER
if (
  after.connectionType === "Residential"
) {

  characteristics.push(
    "Stable residential usage profile"
  );
}

// TRUST-BASED INSTALLER FIT
let installerFit = "Moderate";

if (trustScore >= 80) {
  installerFit = "Excellent";
}
else if (trustScore >= 65) {
  installerFit = "Strong";
}

// FINANCING LIKELIHOOD
// =========================
// FINANCING LIKELIHOOD
// =========================

let financingLikelihood = "Medium";

// Higher bills → stronger EMI suitability
if (after.bill >= 6000) {
  financingLikelihood = "High";
}

// Lower bills but subsidy-sensitive
if (
  after.bill < 3000 &&
  after.propertyType === "Independent House"
) {
  financingLikelihood = "Subsidy Optimized";
}

// =========================
// URGENCY ENGINE
// =========================

let urgency = "Moderate";

// High electricity burden
if (after.bill >= 5000) {
  urgency = "High";
}

// Strong rooftop ownership increases conversion intent
if (
  after.rooftopOwnership?.includes("Yes") &&
  after.bill >= 2500
) {
  urgency = "High";
}

// PERSONA SUMMARY
const personaSummary =
  `${primaryPersona} profile with ${installerFit.toLowerCase()} installer compatibility and ${financingLikelihood.toLowerCase()} financing suitability.`;

// =========================
// SAVINGS PERSONALITY
// =========================

let savingsPersonality = "Balanced Saver";

if (after.bill >= 6000) {
  savingsPersonality = "Investment Optimizer";
}

if (
  after.bill < 3000 &&
  after.rooftopOwnership?.includes("Yes")
) {
  savingsPersonality = "Subsidy Optimized";
}

if (after.billUploaded === "Yes") {
  savingsPersonality = "Research Driven";
}

// =========================
// DECISION STAGE
// =========================

let decisionStage = "Researching";

// Comparing stage
if (
  after.bill >= 2500 ||
  after.billUploaded === "Yes"
) {
  decisionStage = "Comparing Options";
}

// Installer-ready stage
if (
  after.billUploaded === "Yes" &&
  after.rooftopOwnership?.includes("Yes") &&
  after.propertyType === "Independent House" &&
  trustScore >= 75
) {
  decisionStage = "Installer Ready";
}

// =========================
// LEAD TEMPERATURE
// =========================

let leadTemperature = "Cold";

// Warm lead
if (
  after.bill >= 2000 ||
  trustScore >= 60
) {
  leadTemperature = "Warm";
}

// Hot lead
if (
  after.bill >= 4000 &&
  after.rooftopOwnership?.includes("Yes") &&
  after.propertyType === "Independent House" &&
  trustScore >= 75
) {
  leadTemperature = "Hot";
}

// =========================
// LEAD VALUE SCORE
// =========================

let leadValueScore = trustScore;

if (after.bill >= 5000) {
  leadValueScore += 10;
}

if (after.billUploaded === "Yes") {
  leadValueScore += 5;
}

if (
  after.propertyType === "Independent House"
) {
  leadValueScore += 5;
}

leadValueScore = Math.min(
  leadValueScore,
  99
);

// =========================
// RECOMMENDED INSTALLER TYPE
// =========================

let recommendedInstallerType =
  "Standard Residential Installer";

if (after.bill >= 7000) {
  recommendedInstallerType =
    "Premium EPC Partner";
}

if (
  financingLikelihood === "High"
) {
  recommendedInstallerType =
    "Financing Specialist";
}

if (
  savingsPersonality === "Subsidy Optimized"
) {
  recommendedInstallerType =
    "Subsidy Optimization Partner";
}

// =========================
// INSTALLER MATCHING ENGINE
// =========================

let matchedInstallerTier =
  "Standard";

let installerPriority =
  "Normal";

// Premium high-value leads
if (
  after.bill >= 7000 &&
  trustScore >= 80
) {

  matchedInstallerTier =
    "Premium";

  installerPriority =
    "High";
}

// Financing-focused leads
if (
  financingLikelihood === "High"
) {

  matchedInstallerTier =
    "Financing";

  installerPriority =
    "High";
}

// Subsidy-focused leads
if (
  savingsPersonality ===
  "Subsidy Optimized"
) {

  matchedInstallerTier =
    "Subsidy Specialist";
}

// Installer-ready users
if (
  decisionStage ===
  "Installer Ready"
) {

  installerPriority =
    "Urgent";
}

// =========================
// CONVERSION PROBABILITY ENGINE
// =========================

let conversionProbability = 45;

// Strong bill economics
if (after.bill >= 3000) {
  conversionProbability += 15;
}

// Premium energy users
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
  after.propertyType === "Independent House"
) {
  conversionProbability += 10;
}

// Uploaded bill = serious buyer
if (
  after.billUploaded === "Yes"
) {
  conversionProbability += 10;
}

// Trust score boost
if (trustScore >= 80) {
  conversionProbability += 10;
}

// Cap at 98
conversionProbability =
  Math.min(conversionProbability, 98);
  
// =========================
// LEAD QUALITY DASHBOARD
// =========================

// LEAD QUALITY BAND
let leadQualityBand = "Standard";

if (
  conversionProbability >= 80 &&
  trustScore >= 80
) {

  leadQualityBand = "Premium";
}
else if (
  conversionProbability >= 65
) {

  leadQualityBand = "High Potential";
}

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

// SALES COMPLEXITY
let salesComplexity =
  "Moderate";

if (
  after.propertyType ===
  "Apartment / Independent House"
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

// =========================
// CONVERSION LABEL
// =========================

let conversionLabel =
  "Moderate Interest";

if (conversionProbability >= 80) {
  conversionLabel =
    "Highly Likely";
}
else if (conversionProbability >= 65) {
  conversionLabel =
    "Strong Potential";
}

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

    let installerScore = 50;

    // =========================
    // STATE MATCH
    // =========================
    if (
      installer.state === state
    ) {
      installerScore += 20;
    }

    // =========================
    // CITY / SERVICE AREA MATCH
    // =========================
    const serviceAreas =
      installer.serviceAreas || [];

    if (
      serviceAreas.includes(city)
    ) {
      installerScore += 15;
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
    const ratingScore =
      installer.ratingScore || 4;

    installerScore +=
      Math.round(ratingScore * 2);

    // =========================
    // RESPONSE PRIORITY
    // =========================
    installerScore +=
      installer.responsePriority || 0;

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
