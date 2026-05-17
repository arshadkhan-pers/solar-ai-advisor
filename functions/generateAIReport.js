const functions = require("firebase-functions");
const admin = require("firebase-admin");

const db = admin.firestore();

exports.generateAIReport = functions.firestore
  .document("leads/{leadId}")
  .onUpdate(async (change, context) => {

    const before = change.before.data();
    const after = change.after.data();

    const leadId = context.params.leadId;

    // ✅ Trigger ONLY when qualified
    if (before.stage === after.stage) return null;

    if (after.stage !== "qualified") return null;

    console.log("🚀 Generating AI Report:", leadId);

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

        buyerProtectionChecklist:
          buyerProtectionChecklist,

        recommendationSummary:
          recommendationSummary,

        generatedAt:
          admin.firestore.FieldValue.serverTimestamp(),

        engineVersion: "trust-v1"

      });

    console.log("✅ AI Report generated:", leadId);

    return null;
  });