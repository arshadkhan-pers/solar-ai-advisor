/* eslint-disable max-len */
const functions = require("firebase-functions");
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

// Helper function to calculate central subsidy (PMSGY 2026 Slabs)
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

// Helper function to calculate state subsidy
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

exports.generateAIReport = functions.firestore
 .document("leads/{leadId}")
 .onUpdate(async (change, context) => {

    const before = change.before.data();
    const after = change.after.data();

    const leadId = context.params.leadId;

    // ✅ Trigger ONLY when qualified
    if (before.stage === after.stage) return null;
    if (after.stage!== "qualified") return null;

    console.log("🚀 Generating AI Report & Sizing Math:", leadId);

    // ==========================================
    // 🧮 PAN-INDIA CALCULATION ENGINE
    // ==========================================
    const bill = parseFloat(after.bill || 0);
    const state = after.state || "UP";
    
    const units = bill / 7;
    const systemSize = Math.max(1, Math.round(units / 120));
    const costPerKW = 55000;
    const totalCost = systemSize * costPerKW;

    const centralSubsidy = calculateCentralSubsidy(systemSize, state);
    const stateSubsidy = calculateStateSubsidy(systemSize, state, bill, totalCost, centralSubsidy);

    const totalSubsidy = centralSubsidy + stateSubsidy;
    const netCost = totalCost - totalSubsidy;

    // 💾 UPDATE LEADS DOC WITH CALCULATED DETAILS
    // (This saves the values to the lead document so index.js can consume them)
    await change.after.ref.update({
      systemSizeKw: systemSize.toFixed(1),
      totalSubsidy: totalSubsidy,
      netCost: netCost,
      centralSubsidy: centralSubsidy,
      stateSubsidy: stateSubsidy,
      calculatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // =========================
    // TRUST SCORE ENGINE
    // =========================

    let trustScore = 50;

    if (after.bill >= 3000) trustScore += 10;

    if (after.rooftopOwnership?.includes("Yes")) {
      trustScore += 15;
    }

    if (after.propertyType === "Independent House") {
      trustScore += 10;
    }

    if (after.billUploaded === "Yes") {
      trustScore += 10;
    }

    if (after.connectionType === "Residential") {
      trustScore += 5;
    }

    trustScore = Math.min(trustScore, 98);

    // =========================
    // PERSONA ENGINE
    // =========================

    let persona = "Balanced Buyer";

    if (after.bill >= 5000) {
      persona = "ROI Focused";
    }

    if (after.billUploaded === "Yes") {
      persona = "Research Driven";
    }

    if (after.propertyType === "Independent House"
      && after.rooftopOwnership?.includes("Yes")) {
      persona = "Solar Ready";
    }

    // =========================
    // AI INSIGHTS
    // =========================

const aiInsights =.filter(Boolean); //

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

    // =========================
    // BUYER PROTECTION
    // =========================

    const buyerProtectionChecklist = [
      "Verify panel brand and warranty documentation before installation.",
      "Ensure installer provides net-metering assistance.",
      "Request written system performance commitments.",
      "Confirm post-installation support and maintenance coverage."
    ];

    // =========================
    // PRICING CONFIDENCE
    // =========================

    let pricingLevel = "Moderate";

    if (after.bill >= 3000) {
      pricingLevel = "High";
    }

    // =========================
    // SUMMARY
    // =========================

    const recommendationSummary =
      `Based on your electricity usage, rooftop profile, and subsidy eligibility, our AI engine estimates that your property has strong potential for long-term solar savings and investment returns.`;

    // =========================
    // SAVE AI REPORT
    // =========================

    await db.collection("ai_reports")
     .doc(leadId)
     .set({
        leadId: leadId,
        leadCode: after.leadCode || null,
        customerId: after.customerId || null,
        trustScore: trustScore,
        persona: {
          type: persona,
          confidence: Math.min(trustScore + 5, 99)
        },
        pricingConfidence: {
          level: pricingLevel,
          message:
            "Estimated pricing appears aligned with expected market ranges."
        },
        installerReadiness: {
          level: trustScore >= 80? "Strong" : "Moderate",
          message:
            "Property profile appears suitable for subsidy-supported rooftop solar."
        },
        aiInsights: aiInsights,
        buyerProtectionChecklist: buyerProtectionChecklist,
        recommendationSummary: recommendationSummary,
        generatedAt: admin.firestore.FieldValue.serverTimestamp(),
        engineVersion: "trust-v1-with-math"
      });

    console.log("✅ AI Report & Math generated:", leadId);

    return null;
  });
