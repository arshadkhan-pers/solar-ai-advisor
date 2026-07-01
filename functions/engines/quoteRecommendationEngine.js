/**
 * Quote Recommendation Engine
 *
 * Combines comparison scores + rule engine risks, then calls the AI
 * Orchestration Layer to produce the final Claude recommendation.
 * Returns a recommendation object ready to be stored in Firestore.
 */

const { generateRecommendation } = require("../aiOrchestrator");

async function buildRecommendation(normalizedQuotes, comparisonResult, risksPerQuote) {
  // Assemble context package for the AI
  const comparisonPayload = {
    quotes: normalizedQuotes.map((q, i) => ({
      index: i,
      installerName: q.installer.name,
      city: q.installer.city,
      capacityKw: q.system.capacityKw,
      systemType: q.system.type,
      panels: `${q.panels.brand || "Unknown"} ${q.panels.watt || "?"}W × ${q.panels.quantity || "?"}`,
      inverter: `${q.inverter.brand || "Unknown"} (${q.inverter.warrantyYears || "?"}yr warranty)`,
      totalPrice: q.pricing.total,
      pricePerWatt: q.pricing.pricePerWatt,
      gstIncluded: q.pricing.gstIncluded,
      subsidyIncluded: q.pricing.subsidyIncluded,
      panelWarranty: `${q.warranty.panelProduct || "?"}yr product / ${q.warranty.panelPerformance || "?"}yr performance`,
      installationWarranty: q.warranty.installation,
      safetyScore: comparisonResult.scores[i]?.safety,
      riskCount: risksPerQuote[i]?.length || 0,
      criticalRisks: (risksPerQuote[i] || []).filter(r => r.severity === "critical").map(r => r.message)
    })),
    scores: comparisonResult.scores,
    deterministicWinner: comparisonResult.deterministicWinner
  };

  const aiResult = await generateRecommendation(comparisonPayload);

  return {
    winnerIndex: aiResult.winnerIndex ?? comparisonResult.deterministicWinner,
    confidence: aiResult.confidence ?? 80,
    reasons: aiResult.reasons || [],
    recommendation: aiResult.recommendation || "Please review the detailed comparison below.",
    negotiationTips: aiResult.negotiationTips || [],
    warnings: aiResult.warnings || []
  };
}

module.exports = { buildRecommendation };
