/* eslint-disable max-len */
const { onDocumentUpdated } = require("firebase-functions/v2/firestore");
const admin = require("firebase-admin");
const { calculateCentralSubsidy, calculateStateSubsidy } = require("./engines/subsidyEngine");
const { calculateInstallerIntelligence } = require("./engines/installerScoringEngine");

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

const { calculateROICategory, calculateSubsidyDependency } = require("./engines/roiEngine");
const { calculatePricingConfidence } = require("./engines/pricingEngine");
const { calculateInstallerMatches } = require("./engines/installerMatchingEngine");
const { generateAIInsights, generateBuyerProtectionChecklist } = require("./templates/insightsTemplates");
const { calculateInstallerReadiness, generateRecommendationSummary } = require("./engines/recommendationEngine");

const db = admin.firestore();

exports.generateAIReport = onDocumentUpdated(
  { 
    document: "leads/{leadId}", 
    region: "asia-south2" 
  }, 
  async (event) => {
    const change = event.data;
    if (!change) return null;

    const before = change.before.data();
    const after = change.after.data();
    
    if (!after || !before) return null;
    if (!after.aiRegenerationRequired) return null;
    if (before.aiRegenerationRequired === true && after.aiRegenerationRequired === true) {
      return null;
    }

    const leadId = event.params.leadId;
    console.log("🚀 Generating AI Report & Sizing Math for:", leadId);

    try {
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
      
      // ✅ FIX 3: Defend against Division by Zero when bill/savings are missing or 0
      const resultPaybackYears = monthlySavings > 0 ? netCost / (monthlySavings * 12) : 999;
      
      const trustScore = calculateTrustScore(after);

      // 💾 UPDATE LEADS DOC WITH CALCULATED DETAILS
      await change.after.ref.update({
        systemSizeKw: systemSize.toFixed(1),
        totalSubsidy: totalSubsidy,
        netCost: netCost,
        centralSubsidy: centralSubsidy,
        stateSubsidy: stateSubsidy,
        calculatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      // =========================
      // PERSONA ENGINE V2
      // =========================
      const installerFit = calculateInstallerFit(trustScore);
      const primaryPersona = calculatePrimaryPersona(after);
      const secondaryPersona = calculateSecondaryPersona(after);
      const characteristics = calculateCharacteristics(after);
      const financingLikelihood = calculateFinancingLikelihood(after);
      const urgency = calculateUrgency(after);
      const savingsPersonality = calculateSavingsPersonality(after);
      const decisionStage = calculateDecisionStage(after, trustScore);
      const recommendedInstallerType = calculateRecommendedInstallerType(financingLikelihood, savingsPersonality, after);
      const personaSummary = calculatePersonaSummary(primaryPersona, installerFit, financingLikelihood);
      const leadTemperature = calculateLeadTemperature(after, trustScore);
      const leadValueScore = calculateLeadValueScore(after, trustScore);

      // =========================
      // INSTALLER MATCHING ENGINE
      // =========================
      let matchedInstallerTier = "Standard";
      const installerPriority = calculateInstallerPriority(decisionStage, financingLikelihood, after, trustScore);
      
      if (financingLikelihood === "High") matchedInstallerTier = "Financing";
      if (savingsPersonality === "Subsidy Optimized") matchedInstallerTier = "Subsidy Specialist";
      if (leadValueScore >= 85) matchedInstallerTier = "Premium";

      const conversionProbability = calculateConversionProbability(after, trustScore);
        
      // =========================
      // LEAD QUALITY DASHBOARD
      // =========================
      const leadQualityBand = calculateLeadQualityBand(conversionProbability, trustScore);
      const roiCategory = calculateROICategory(resultPaybackYears);
      const subsidyDependency = calculateSubsidyDependency(savingsPersonality, after);
      const salesComplexity = calculateSalesComplexity(after, decisionStage);
      const conversionLabel = calculateConversionLabel(conversionProbability);
        
      const personaV2 = {
        primary: primaryPersona,
        secondary: secondaryPersona,
        confidence: Math.min(trustScore + 8, 99),
        urgency: urgency,
        financingLikelihood: financingLikelihood,
        installerFit: installerFit,
        characteristics: characteristics,
        summary: personaSummary,
        savingsPersonality: savingsPersonality,
        decisionStage: decisionStage,
        leadTemperature: leadTemperature,
        leadValueScore: leadValueScore,
        recommendedInstallerType: recommendedInstallerType,
        conversionProbability: conversionProbability,
        conversionLabel: conversionLabel,
        matchedInstallerTier: matchedInstallerTier,
        installerPriority: installerPriority,
        leadQualityBand: leadQualityBand,
        roiCategory: roiCategory,
        subsidyDependency: subsidyDependency,
        salesComplexity: salesComplexity
      };

      // ✅ FIX 4: Isolated execution context for Installer Matching Engine
      let matchedInstallers = [];
      try {
        matchedInstallers = await calculateInstallerMatches({
          db,
          state,
          city,
          systemSize,
          financingLikelihood,
          leadValueScore,
          savingsPersonality
        });
      } catch (matchError) {
        console.error("❌ Isolated Engine Failure - calculateInstallerMatches:", matchError);
      }

      const aiInsights = generateAIInsights(after, trustScore);
      const buyerProtectionChecklist = generateBuyerProtectionChecklist();
      const pricingConfidence = calculatePricingConfidence(after);
      const recommendationSummary = generateRecommendationSummary();
      const installerReadiness = calculateInstallerReadiness(trustScore);

      // =========================================
      // SAVE AI REPORT
      // =========================================
      await db.collection("ai_reports").doc(leadId).set({
        leadId: leadId,
        status: "SUCCESS",
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
        matchedInstallers: matchedInstallers,
        pricingConfidence: pricingConfidence,
        installerReadiness: installerReadiness,
        aiInsights: aiInsights,
        buyerProtectionChecklist: buyerProtectionChecklist,
        recommendationSummary: recommendationSummary,
        generatedAt: admin.firestore.FieldValue.serverTimestamp(),
        engineVersion: "trust-v1-with-math-v2-payload"
      }, { merge: true }); // ✅ FIX 5: Future-proof fields against overwrite risks

      console.log("✅ AI Report & Math generated successfully:", leadId);

    } catch (error) {
      console.error("❌ Fatal Error in AI Generation Pipeline:", error);
      
      // ✅ FIX 2: Write failure signature directly into Firestore to unblock UI fallback gracefully
      try {
        await db.collection("ai_reports").doc(leadId).set({
          leadId: leadId,
          status: "ERROR",
          error: error.message || "Unknown execution exception",
          generatedAt: admin.firestore.FieldValue.serverTimestamp(), // Necessary to cross frontend time boundary checks
          engineVersion: "trust-v1-failed-fallback"
        }, { merge: true });
      } catch (persistenceError) {
        console.error("❌ Failed to write error details to Firestore:", persistenceError);
      }
    } finally {
      // ✅ FIX 1: Wrap final execution in a targeted try/catch to protect against network or permission faults
      try {
        await db.collection("leads").doc(leadId).update({
          aiRegenerationRequired: false
        });
        console.log("🔒 Released frontend listener flag for lead:", leadId);
      } catch (releaseError) {
        console.error("❌ Critical: Failed to release aiRegenerationRequired flag inside finally block:", releaseError);
      }
    }

    return null;
  }
);
