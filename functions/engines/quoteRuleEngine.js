/**
 * Quote Rule Engine
 *
 * Deterministic risk checks on normalized quotes. Runs before the AI reasoning
 * step — fast, no API cost. Returns an array of risk flags per quote.
 *
 * Severity levels: "critical" | "warning" | "info"
 */

// Indian market benchmarks (2026)
const PRICE_PER_WATT_MIN = 30;   // Below this is suspiciously cheap
const PRICE_PER_WATT_MAX = 80;   // Above this is overpriced
const MIN_PANEL_WARRANTY_PRODUCT = 10;
const MIN_PANEL_WARRANTY_PERFORMANCE = 20;
const MIN_INVERTER_WARRANTY = 5;
const MIN_INSTALL_WARRANTY = 1;

function runRules(normalizedQuote) {
  const risks = [];
  const q = normalizedQuote;

  // --- Safety: critical if missing ---
  if (q.installation.spd === false) {
    risks.push({
      severity: "critical",
      field: "installation.spd",
      message: "Surge Protection Device (SPD) not included — required for inverter safety during lightning."
    });
  }
  if (q.installation.spd === null) {
    risks.push({
      severity: "warning",
      field: "installation.spd",
      message: "SPD (Surge Protection Device) not mentioned — confirm with installer before signing."
    });
  }

  if (q.installation.earthing === false) {
    risks.push({
      severity: "critical",
      field: "installation.earthing",
      message: "Earthing not included — mandatory for electrical safety and DISCOM approval."
    });
  }

  if (q.installation.lightningArrestor === false) {
    risks.push({
      severity: "warning",
      field: "installation.lightningArrestor",
      message: "Lightning arrestor not included — recommended for rooftop systems."
    });
  }

  if (q.installation.netMetering === false) {
    risks.push({
      severity: "warning",
      field: "installation.netMetering",
      message: "Net metering support not mentioned — confirm installer handles DISCOM net metering application."
    });
  }

  // --- Equipment: brand recognition ---
  if (q.panels.brand && !q.panels.brandKnown) {
    risks.push({
      severity: "warning",
      field: "panels.brand",
      message: `Panel brand "${q.panels.brand}" is not on the common Indian market list — verify certifications (IEC 61215, BIS) before accepting.`
    });
  }

  if (q.inverter.brand && !q.inverter.brandKnown) {
    risks.push({
      severity: "warning",
      field: "inverter.brand",
      message: `Inverter brand "${q.inverter.brand}" is not a widely known brand in India — check warranty support and service availability.`
    });
  }

  // --- Pricing: per-watt benchmark ---
  const ppw = q.pricing.pricePerWatt;
  if (ppw !== null) {
    if (ppw < PRICE_PER_WATT_MIN) {
      risks.push({
        severity: "critical",
        field: "pricing.pricePerWatt",
        message: `Price ₹${ppw}/W is unusually low (market: ₹${PRICE_PER_WATT_MIN}–${PRICE_PER_WATT_MAX}/W). May indicate substandard components or hidden costs.`
      });
    } else if (ppw > PRICE_PER_WATT_MAX) {
      risks.push({
        severity: "warning",
        field: "pricing.pricePerWatt",
        message: `Price ₹${ppw}/W is above typical market range (₹${PRICE_PER_WATT_MIN}–${PRICE_PER_WATT_MAX}/W). Negotiate or compare with another installer.`
      });
    }
  } else if (!q.pricing.total && !q.system.capacityKw) {
    risks.push({
      severity: "critical",
      field: "pricing.total",
      message: "Total price could not be extracted from the document. Verify the quote includes a final price."
    });
  }

  // --- GST transparency ---
  if (q.pricing.gstIncluded === false) {
    risks.push({
      severity: "warning",
      field: "pricing.gstIncluded",
      message: "GST not included in quoted price — add 12% GST to the total to get actual cost."
    });
  }
  if (q.pricing.gstIncluded === null) {
    risks.push({
      severity: "info",
      field: "pricing.gstIncluded",
      message: "GST inclusion not clearly stated — confirm whether the quoted price is GST-inclusive."
    });
  }

  // --- Warranty: minimum thresholds ---
  if (q.warranty.panelProduct !== null && q.warranty.panelProduct < MIN_PANEL_WARRANTY_PRODUCT) {
    risks.push({
      severity: "warning",
      field: "warranty.panelProduct",
      message: `Panel product warranty is ${q.warranty.panelProduct} years — industry minimum is ${MIN_PANEL_WARRANTY_PRODUCT} years.`
    });
  }

  if (q.warranty.panelPerformance !== null && q.warranty.panelPerformance < MIN_PANEL_WARRANTY_PERFORMANCE) {
    risks.push({
      severity: "warning",
      field: "warranty.panelPerformance",
      message: `Panel performance warranty is ${q.warranty.panelPerformance} years — top brands offer ${MIN_PANEL_WARRANTY_PERFORMANCE}–25 years.`
    });
  }

  if (q.inverter.warrantyYears !== null && q.inverter.warrantyYears < MIN_INVERTER_WARRANTY) {
    risks.push({
      severity: "warning",
      field: "inverter.warrantyYears",
      message: `Inverter warranty is only ${q.inverter.warrantyYears} year(s) — standard is 5+ years.`
    });
  }

  if (q.warranty.installation !== null && q.warranty.installation < MIN_INSTALL_WARRANTY) {
    risks.push({
      severity: "warning",
      field: "warranty.installation",
      message: "Installation warranty is less than 1 year — ensure at least 1 year workmanship warranty."
    });
  }

  // --- Subsidy clarity ---
  if (q.pricing.subsidyIncluded === true) {
    risks.push({
      severity: "info",
      field: "pricing.subsidyIncluded",
      message: "Quoted price appears to include PM Surya Ghar subsidy — confirm eligibility and that installer handles subsidy application."
    });
  }

  return risks;
}

module.exports = { runRules };
