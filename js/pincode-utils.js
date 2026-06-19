// =====================================================================
// 📍 GLOBAL PINCODE UTILITIES & STATE MAPPING ENGINE
// =====================================================================

// Global cache to prevent multiple asset downloads across files
let cachedPincodeMap = null;

/**
 * Lazily loads the optimized pincode registry file into memory
 * @param {string} pincode - 6-digit postal code string
 * @returns {Promise<[string, string]|null>} [District, FullStateName] or null
 */
async function lookupPincodeData(pincode) {
  if (!cachedPincodeMap) {
    try {
      // Fetches the compressed 674KB payload
      // Safe, bulletproof path for multi-page apps
      const response = await fetch("../data/pincode-map.json");
      cachedPincodeMap = await response.json();
    } catch (err) {
      console.error("❌ Pincode Registry Fail");
      return null;
    }
  }
  return cachedPincodeMap[pincode] || null;
}

/**
 * Normalizes full-text government state descriptions down to 2-letter config tokens
 * @param {string} fullStateName 
 * @returns {string|null} 2-letter state code (e.g., "UP")
 */
function normalizeStateToCode(fullStateName) {
  const cleanName = String(fullStateName || '').trim().toUpperCase();
  const stateLookupTable = {
    "UTTAR PRADESH": "UP", "MAHARASHTRA": "MH", "GUJARAT": "GJ", 
    "DELHI": "DL", "RAJASTHAN": "RJ", "UTTARAKHAND": "UK", 
    "ASSAM": "AS", "GOA": "GA", "ANDHRA PRADESH": "AP", 
    "TELANGANA": "TS", "TAMIL NADU": "TN", "KARNATAKA": "KA", 
    "WEST BENGAL": "WB", "KERALA": "KL", "PUNJAB": "PB", 
    "HARYANA": "HR", "CHHATTISGARH": "CG", "ODISHA": "OR", 
    "BIHAR": "BR", "MADHYA PRADESH": "MP"
  };
  return stateLookupTable[cleanName] || null;
}

// Quietly trigger background caching during browser downtime
if (window.addEventListener) {
  window.addEventListener('load', () => lookupPincodeData(''));
}
