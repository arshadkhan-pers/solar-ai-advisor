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

exports.generateAIReport = functions.firestore
  .document("leads/{leadId}")
  .onUpdate(async (change, context) => {

    const before = change.before.data();
    const after = change.after.data();

    const leadId = context.params.leadId;

    // ✅ Trigger ONLY when qualified
    if (before.stage === after.stage) return null;
    if (after.stage !== "qualified") return null;

    console.log("🚀 Generating AI Report & Calculations:", leadId);

    // =========================
    // 🧮 PAN-INDIA MATH ENGINE
    // =========================
    const bill = parseFloat(after.bill || 0);
    const state = after.state || "UP";
    
    const units = bill / 7;
    const systemSize = Math.max(1, Math.round(units / 120));
    const costPerKW = 55000;
    const totalCost = systemSize * costPerKW;

    // 1. Central Subsidy
    let centralSubsidy = 0;
    if (systemSize <= 2) {
      centralSubsidy = systemSize * 30000;
    } else if (systemSize <= 3) {
      centralSubsidy = (2 * 30000) + ((systemSize - 2) * 18000);
    } else {
      centralSubsidy = 78000;
    }
    
    if (specialStates.includes(state)) {
      centralSubsidy = centralSubsidy * 1.1;
    }
    centralSubsidy = Math.round(centralSubsidy);

    // 2. State Subsidy
    let stateSubsidy = 0;
    const config = stateSubsidyConfig[state];
    
    if (!zeroTopUpStates.includes(state) && config) {
      if (config.type === "goa_model") {
        if (units <= 400 && systemSize <= 5) {
          stateSubsidy = Math.min(totalCost - centralSubsidy, 250000);
        } else {
          stateSubsidy = Math.min(systemSize * 23000, 250000);
        }
      } else if (config.type === "flat") {
        stateSubsidy = config.value;
      } else if (config.type === "perKW") {
        stateSubsidy = Math.min(systemSize * config.value, config.cap);
      }
    }
    stateSubsidy = Math.round(stateSubsidy);

    const totalSubsidy = centralSubsidy + stateSubsidy;
    const netCost = totalCost - totalSubsidy;

    // 💾 UPDATE LEADS DOC WITH MATH (For index.js emails)
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

    const aiInsights = [];

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
          level: trustScore >= 80 ? "Strong" : "Moderate",
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
