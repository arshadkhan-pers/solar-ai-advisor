/**
 * Quote Extraction Engine
 *
 * Receives raw JSON from Gemini (via aiOrchestrator), validates it, and
 * normalizes it into the canonical quote schema. Handles partial/null fields
 * gracefully so downstream engines always receive a consistent structure.
 */

const KNOWN_PANEL_BRANDS = [
  "waaree", "adani", "vikram", "tata power solar", "luminous", "havells",
  "goldi solar", "rayzon solar", "saatvik", "jakson", "premier energies",
  "solex", "renewsys", "emmvee", "anu solar", "websol", "patanjali solar"
];

const KNOWN_INVERTER_BRANDS = [
  "sungrow", "growatt", "sofar solar", "goodwe", "solis", "delta",
  "huawei", "enphase", "fronius", "luminous", "su-kam", "microtek",
  "havells", "abb", "sma", "schneider"
];

function normalizeQuote(rawJson, fileIndex) {
  const q = rawJson || {};
  const installer = q.installer || {};
  const system = q.system || {};
  const panels = q.panels || {};
  const inverter = q.inverter || {};
  const pricing = q.pricing || {};
  const installation = q.installation || {};
  const warranty = q.warranty || {};

  const capacityKw = toNumber(system.capacityKw);
  const panelWatt = toNumber(panels.watt);
  const panelQty = toNumber(panels.quantity);
  const totalPrice = toNumber(pricing.total);

  return {
    _fileIndex: fileIndex,
    installer: {
      name: toString(installer.name) || `Installer ${fileIndex + 1}`,
      city: toString(installer.city),
      contact: toString(installer.contact)
    },
    system: {
      capacityKw: capacityKw,
      type: toString(system.type) || "On Grid"
    },
    panels: {
      brand: toString(panels.brand),
      model: toString(panels.model),
      quantity: panelQty,
      watt: panelWatt,
      brandKnown: isPanelBrandKnown(panels.brand)
    },
    inverter: {
      brand: toString(inverter.brand),
      model: toString(inverter.model),
      warrantyYears: toNumber(inverter.warrantyYears),
      brandKnown: isInverterBrandKnown(inverter.brand)
    },
    pricing: {
      total: totalPrice,
      gstIncluded: toBool(pricing.gstIncluded),
      subsidyIncluded: toBool(pricing.subsidyIncluded),
      pricePerWatt: capacityKw && totalPrice
        ? Math.round((totalPrice / (capacityKw * 1000)) * 100) / 100
        : null
    },
    installation: {
      spd: toBool(installation.spd),
      earthing: toBool(installation.earthing),
      lightningArrestor: toBool(installation.lightningArrestor),
      netMetering: toBool(installation.netMetering)
    },
    warranty: {
      panelProduct: toNumber(warranty.panelProduct),
      panelPerformance: toNumber(warranty.panelPerformance),
      installation: toNumber(warranty.installation)
    }
  };
}

function isPanelBrandKnown(brand) {
  if (!brand) return false;
  return KNOWN_PANEL_BRANDS.some(b => brand.toLowerCase().includes(b));
}

function isInverterBrandKnown(brand) {
  if (!brand) return false;
  return KNOWN_INVERTER_BRANDS.some(b => brand.toLowerCase().includes(b));
}

function toNumber(val) {
  if (val === null || val === undefined) return null;
  const n = parseFloat(val);
  return isNaN(n) ? null : n;
}

function toString(val) {
  if (val === null || val === undefined || val === "") return null;
  return String(val).trim();
}

function toBool(val) {
  if (val === null || val === undefined) return null;
  if (typeof val === "boolean") return val;
  if (typeof val === "string") {
    const l = val.toLowerCase();
    if (l === "true" || l === "yes" || l === "included") return true;
    if (l === "false" || l === "no" || l === "not included") return false;
  }
  return null;
}

module.exports = { normalizeQuote };
