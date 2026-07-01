/**
 * Quote Comparison Engine
 *
 * Produces a scored comparison matrix across all normalized quotes.
 * All scoring is deterministic — no AI cost. Results feed into the
 * AI recommendation engine as structured context.
 */

// Scoring weights (must sum to 1.0)
const WEIGHTS = {
  price:     0.30,
  warranty:  0.25,
  equipment: 0.25,
  safety:    0.20
};

/**
 * Returns a comparison object including per-quote scores and a preliminary
 * winner based purely on deterministic scoring.
 */
function compareQuotes(normalizedQuotes) {
  if (!normalizedQuotes || normalizedQuotes.length === 0) {
    return { scores: [], deterministicWinner: null };
  }

  const scores = normalizedQuotes.map((q, i) => ({
    index: i,
    installerName: q.installer.name,
    price:     scorePricing(q, normalizedQuotes),
    warranty:  scoreWarranty(q),
    equipment: scoreEquipment(q),
    safety:    scoreSafety(q),
    total:     0,
    pricePerWatt: q.pricing.pricePerWatt,
    capacityKw: q.system.capacityKw
  }));

  // Compute weighted total
  scores.forEach(s => {
    s.total = Math.round(
      s.price     * WEIGHTS.price     * 100 +
      s.warranty  * WEIGHTS.warranty  * 100 +
      s.equipment * WEIGHTS.equipment * 100 +
      s.safety    * WEIGHTS.safety    * 100
    );
  });

  const deterministicWinner = scores.reduce(
    (best, s) => s.total > best.total ? s : best,
    scores[0]
  );

  return {
    scores,
    deterministicWinner: deterministicWinner.index,
    weights: WEIGHTS
  };
}

// --- Scoring helpers (return 0.0–1.0) ---

function scorePricing(quote, allQuotes) {
  const ppw = quote.pricing.pricePerWatt;
  if (ppw === null) return 0.3; // unknown — middle score

  // Relative scoring: lower price/W = higher score (within market range)
  const allPpw = allQuotes
    .map(q => q.pricing.pricePerWatt)
    .filter(v => v !== null);

  if (allPpw.length === 1) {
    // Single quote — absolute scoring vs market benchmark (₹40–60/W ideal)
    if (ppw >= 35 && ppw <= 60) return 0.85;
    if (ppw > 60 && ppw <= 75)   return 0.55;
    if (ppw > 75)                 return 0.25;
    if (ppw < 35)                 return 0.20; // suspiciously cheap
    return 0.5;
  }

  const min = Math.min(...allPpw);
  const max = Math.max(...allPpw);
  if (max === min) return 0.8; // all same price
  // Invert: cheapest = 1.0, most expensive = 0.2
  return 0.2 + 0.8 * (1 - (ppw - min) / (max - min));
}

function scoreWarranty(quote) {
  const w = quote.warranty;
  let score = 0;

  // Panel product warranty (0–0.4)
  const pp = w.panelProduct ?? 0;
  if (pp >= 12)     score += 0.40;
  else if (pp >= 10) score += 0.30;
  else if (pp >= 5)  score += 0.15;

  // Panel performance warranty (0–0.35)
  const perf = w.panelPerformance ?? 0;
  if (perf >= 25)    score += 0.35;
  else if (perf >= 20) score += 0.25;
  else if (perf >= 10) score += 0.10;

  // Inverter warranty (0–0.15)
  const inv = quote.inverter.warrantyYears ?? 0;
  if (inv >= 10)    score += 0.15;
  else if (inv >= 5) score += 0.10;
  else if (inv >= 1) score += 0.05;

  // Installation warranty (0–0.10)
  const inst = w.installation ?? 0;
  if (inst >= 5)    score += 0.10;
  else if (inst >= 1) score += 0.06;

  return Math.min(score, 1.0);
}

function scoreEquipment(quote) {
  let score = 0;

  // Known brands (0–0.5 panels, 0–0.4 inverter)
  score += quote.panels.brandKnown   ? 0.50 : 0.10;
  score += quote.inverter.brandKnown ? 0.40 : 0.10;

  // Capacity clarity (0–0.10)
  score += quote.system.capacityKw ? 0.10 : 0;

  return Math.min(score, 1.0);
}

function scoreSafety(quote) {
  const i = quote.installation;
  let score = 0;

  if (i.spd === true)               score += 0.40;
  else if (i.spd === null)          score += 0.10;
  // spd === false: 0

  if (i.earthing === true)          score += 0.30;
  else if (i.earthing === null)     score += 0.10;

  if (i.lightningArrestor === true) score += 0.20;
  else if (i.lightningArrestor === null) score += 0.05;

  if (i.netMetering === true)       score += 0.10;
  else if (i.netMetering === null)  score += 0.05;

  return Math.min(score, 1.0);
}

module.exports = { compareQuotes };
