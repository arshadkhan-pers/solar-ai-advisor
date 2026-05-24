// ===============================
// ✅ CONFIGURATION
// ===============================

// Special category states (10% higher central subsidy)
const specialStates = ["AS", "UK", "HP", "JK", "LA", "SK"];

// Zero top-up states
const zeroTopUpStates = ["KL", "KA", "TN", "TS", "PB", "WB", "HR", "CG"];

// State top-up configuration (UPDATED ACCURATE)
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

  // 🔥 GOA SPECIAL MODEL
  "GA": { type: "goa_model" }
};

// State names
const stateNames = {
  "UP": "Uttar Pradesh",
  "MH": "Maharashtra",
  "GJ": "Gujarat",
  "DL": "Delhi",
  "RJ": "Rajasthan",
  "UK": "Uttarakhand",
  "AS": "Assam",
  "GA": "Goa",
  "AP": "Andhra Pradesh",
  "TS": "Telangana",
  "TN": "Tamil Nadu",
  "KA": "Karnataka",
  "WB": "West Bengal",
  "KL": "Kerala",
  "PB": "Punjab",
  "HR": "Haryana",
  "CG": "Chhattisgarh",
  "OR": "Odisha",
  "BR": "Bihar",
  "MP": "Madhya Pradesh"
};

// ===============================
// 🔹 HELPERS
// ===============================
// ✅ Indian compact currency formatter
function formatIndianCurrency(num) {

  if (num >= 10000000) {
    return "₹" + (num / 10000000).toFixed(1) + "Cr";
  }

  if (num >= 100000) {
    return "₹" + (num / 100000).toFixed(1) + "L";
  }

  if (num >= 1000) {
    return "₹" + (num / 1000).toFixed(1) + "K";
  }

  return "₹" + num;
}

function getStateFromURL() {
  const params = new URLSearchParams(window.location.search);
  return params.get("state") || "UP";
}

function getBillFromURL() {
  const params = new URLSearchParams(window.location.search);
  return parseFloat(params.get("bill")) || 0;
}

// ===============================
// 🔵 CENTRAL SUBSIDY (2026)
// ===============================
function calculateCentralSubsidy(systemSize, state) {
  let subsidy = 0;

  if (systemSize <= 2) {
    subsidy = systemSize * 30000;
  } else if (systemSize <= 3) {
    subsidy = (2 * 30000) + ((systemSize - 2) * 18000);
  } else {
    subsidy = 78000;
  }

  // Special state boost (+10%)
  if (specialStates.includes(state)) {
    subsidy = subsidy * 1.1;
  }

  return Math.round(subsidy);
}

// ===============================
// 🟢 STATE SUBSIDY ENGINE
// ===============================
function calculateStateSubsidy(systemSize, state, bill, totalCost, centralSubsidy) {

  // ZERO states
  if (zeroTopUpStates.includes(state)) return 0;

  const config = stateSubsidyConfig[state];
  if (!config) return 0;

  // 🔥 GOA SPECIAL LOGIC
  if (config.type === "goa_model") {

  const units = bill / 7;

  // Low consumption (<400 units)
  if (units <= 400) {

    // near zero cost up to 5kW
    if (systemSize <= 5) {
      const required = totalCost - centralSubsidy;
      return Math.min(required, 250000);
    }
  }

  // High consumption
  let subsidy = systemSize * 23000;
  subsidy = Math.min(subsidy, 250000);

  return Math.round(subsidy);
}

  // STANDARD STATES
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

// ===============================
// 🔹 CORE CALCULATION
// ===============================
function calculateSolar(bill) {

  const state = getStateFromURL();

  const units = bill / 7;
  const systemSize = Math.max(1, Math.round(units / 120));

  const costPerKW = 55000;
  const totalCost = systemSize * costPerKW;

  const centralSubsidy = calculateCentralSubsidy(systemSize, state);

  const stateSubsidy = calculateStateSubsidy(
    systemSize,
    state,
    bill,
    totalCost,
    centralSubsidy
  );

  const totalSubsidy = centralSubsidy + stateSubsidy;
  const finalCost = totalCost - totalSubsidy;

  const monthlySavings = units * 7;
  const payback = finalCost / (monthlySavings * 12);

  const panels = Math.ceil((systemSize * 1000) / 550);
  const area = Math.round(systemSize * 80);
  const lifetimeSavings = Math.round(monthlySavings * 12 * 25);

  return {
    systemSize: systemSize.toFixed(1),
    totalCost: Math.round(totalCost),
    subsidy: Math.round(totalSubsidy),
    centralSubsidy: Math.round(centralSubsidy),
    stateSubsidy: Math.round(stateSubsidy),
    finalCost: Math.round(finalCost),
    monthlySavings: Math.round(monthlySavings),
    payback: payback.toFixed(1),
    panels,
    area,
    lifetimeSavings,
    state
  };
}

// ===============================
// 🔹 RENDER
// ===============================
function renderResults(data, bill) {

  const stateFullName = stateNames[data.state] || data.state;

  const el = document.getElementById("stateInfo");

  if (el) {
    if (data.stateSubsidy > 0) {

      if (data.state === "GA") {
        el.innerText =
          `Includes Goa special subsidy (may be credited after installation)`;
      } else {
        el.innerText =
          `Includes central + ${stateFullName} state subsidy`;
      }

    } else {
      el.innerText =
        `Only central subsidy applicable in ${stateFullName}`;
    }
  }

  document.getElementById("systemSize").innerText =
    `${data.systemSize} kW Solar System Recommended`;

  document.getElementById("billInfo").innerText =
    `Based on your ₹${bill}/month bill`;

  document.getElementById("totalCost").innerText = data.totalCost;
  document.getElementById("subsidy").innerText = data.subsidy;
  document.getElementById("finalCost").innerText = data.finalCost;
  document.getElementById("monthlySavings").innerText = data.monthlySavings;
  document.getElementById("payback").innerText = data.payback;
  document.getElementById("panels").innerText = data.panels;
  document.getElementById("area").innerText = data.area;
  document.getElementById("lifetimeSavings").innerText = data.lifetimeSavings;
  document.getElementById("centralSubsidy").innerText = data.centralSubsidy;
  document.getElementById("stateSubsidy").innerText = data.stateSubsidy;
}

// ===============================
// 🔹 WHATSAPP
// ===============================
function openWhatsApp() {
  const bill = getBillFromURL();
  const result = calculateSolar(bill);
  const stateFullName = stateNames[result.state] || result.state;

  const message = `Hi, I’m interested in installing rooftop solar.

Location: ${stateFullName}
Monthly Bill: ₹${bill}
Recommended System: ${result.systemSize} kW
Estimated Cost: ₹${result.finalCost}
Monthly Savings: ₹${result.monthlySavings}
Payback Period: ${result.payback} years`;

  const encodedMessage = encodeURIComponent(message);
  const number = "61404166347";

  window.open(`https://wa.me/${number}?text=${encodedMessage}`, "_blank");
}

// ===============================
// 🔹 RESTORED FUNCTIONS (DO NOT REMOVE)
// ===============================

// ✅ Show lead form
function showForm() {
  const form = document.getElementById("leadForm");
  if (form) {
    form.classList.remove("hidden");

form.scrollIntoView({
  behavior: "smooth",
  block: "start"
});
  } else {
    console.warn("leadForm not found");
  }
}

// 🔥 Lead scoring
function getLeadType(bill, propertyType, rooftopOwnership) {
  let score = 0;

  if (bill >= 3000) score += 2;
  else if (bill >= 1500) score += 1;

  if (propertyType === "Independent House") score += 2;
  else score += 1;

  if (rooftopOwnership === "Yes") score += 2;

  if (score >= 5) return "Premium";
  if (score >= 3) return "Hot";
  return "Basic";
}

// ✅ Submit lead (Firestore update)

async function submitLead() {
  const submitBtn =
  document.querySelector("#leadForm button");
  submitBtn.disabled = true;
  submitBtn.innerText = "Generating AI Analysis...";
  const propertyType = document.getElementById("propertyType")?.value;
  const roofType = document.getElementById("roofType")?.value;
  const rooftopOwnership = document.getElementById("rooftopOwnership")?.value;
  const connectionType = document.getElementById("connectionType")?.value;
  const billFile = document.getElementById("billUpload")?.files?.[0];

if (!rooftopOwnership) {
  alert("Please select rooftop ownership");
  submitBtn.disabled = false;
  submitBtn.innerText = "Submit Request";
  return;
}

  const leadId = localStorage.getItem("leadId");

  if (!leadId) {
  alert("Lead ID not found");

  submitBtn.disabled = false;
  submitBtn.innerText = "Submit Request";

  return;
}

  if (typeof firebase === "undefined" || typeof db === "undefined") {
    alert("Database not initialized");
    return;
  }

  const bill = parseFloat(getBillFromURL());
  const leadType = getLeadType(bill, propertyType, rooftopOwnership);
  const requestTime = Date.now();
  
  try {
    await db.collection("leads").doc(leadId).update({
      
      propertyType,
      roofType,
      rooftopOwnership,
      connectionType,
      billUploaded: billFile ? "Yes" : "No",
      leadType,
      stage: "qualified",
      aiRegenerationRequired: true,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });

    console.log("✅ Lead updated successfully");

  } catch (error) {
    console.error("❌ Update failed:", error);
    alert("Error updating lead");
    submitBtn.disabled = false;
    submitBtn.innerText = "Submit Request";
    return;
  }
  document.getElementById("leadForm")
  ?.classList.add("hidden");
  
// 🤖 AI INSIGHTS
const result = calculateSolar(bill);

/*
renderAIInsights({
  bill,
  result,
  propertyType,
  rooftopOwnership,
  roofType
});
*/
// new call///
showAILoadingState();

try {

  const aiReport =
    await waitForAIReport(leadId, requestTime);

  renderDynamicAIReport(
    aiReport,
    result
  );
   submitBtn.disabled = false;
   submitBtn.innerText = "Submit Request"; 
} catch (error) {

  console.error(error);
  document.getElementById("aiLoadingState")
  ?.classList.add("hidden");
  
  // fallback
  renderAIInsights({
    bill,
    result,
    propertyType,
    rooftopOwnership,
    roofType
  });
    submitBtn.disabled = false;
    submitBtn.innerText = "Submit Request";
}
// new call end////

}

// ✅ Upload handling
function setupBillUpload() {
  const uploadArea = document.getElementById("billUploadArea");
  const fileInput = document.getElementById("billUpload");
  const fileNameDisplay = document.getElementById("billFileName");

  if (!uploadArea || !fileInput || !fileNameDisplay) return;

  uploadArea.addEventListener("click", () => fileInput.click());

  uploadArea.addEventListener("dragover", (e) => {
    e.preventDefault();
    uploadArea.style.backgroundColor = "#f0f9ff";
  });

  uploadArea.addEventListener("dragleave", () => {
    uploadArea.style.backgroundColor = "";
  });

  uploadArea.addEventListener("drop", (e) => {
    e.preventDefault();
    uploadArea.style.backgroundColor = "";
    if (e.dataTransfer.files.length > 0) {
      fileInput.files = e.dataTransfer.files;
      fileNameDisplay.innerText = `✓ ${e.dataTransfer.files[0].name}`;
    }
  });

  fileInput.addEventListener("change", (e) => {
    if (e.target.files.length > 0) {
      fileNameDisplay.innerText = `✓ ${e.target.files[0].name}`;
    }
  });
}

// ✅ Populate captured data

function populateCapturedData() {
  const params = new URLSearchParams(window.location.search);

  const name = document.getElementById("capturedName");
  const phone = document.getElementById("capturedPhone");
  const city = document.getElementById("capturedCity");
  const bill = document.getElementById("capturedBill");

  if (name) name.value = params.get("name") || "";
  if (phone) phone.value = params.get("phone") || "";
  if (city) city.value = params.get("city") || "";
  if (bill) bill.value = params.get("bill") || "";
}

function setupEditableInputs() {

  const billInput =
    document.getElementById("capturedBill");

  const cityInput =
    document.getElementById("capturedCity");

  const nameInput =
    document.getElementById("capturedName");

  const leadId =
    localStorage.getItem("leadId");

  if (!billInput || !leadId) return;

  async function syncLeadChanges() {

    const newBill =
      parseFloat(billInput.value);

    if (!newBill || newBill < 500) {
      return;
    }

    const newCity =
      cityInput?.value?.trim() || "";

    const newName =
      nameInput?.value?.trim() || "";

    // =========================
    // UPDATE URL
    // =========================
    const params =
      new URLSearchParams(window.location.search);

    params.set("bill", newBill);

    if (newCity) {
      params.set("city", newCity);
    }

    if (newName) {
      params.set("name", newName);
    }

    history.replaceState(
      {},
      "",
      `${window.location.pathname}?${params.toString()}`
    );

    // =========================
    // INSTANT UI RECALCULATION
    // =========================
    const result =
      calculateSolar(newBill);

    renderResults(result, newBill);

    // =========================
    // FIRESTORE UPDATE
    // =========================
    try {

      showAILoadingState();

      const requestTime = Date.now();

      await db.collection("leads")
        .doc(leadId)
        .update({

          bill: newBill,
          city: newCity,
          name: newName,

          aiRegenerationRequired: true,

          updatedAt:
            firebase.firestore.FieldValue.serverTimestamp()

        });

      // Wait for regenerated AI report
      const aiReport =
        await waitForAIReport(
          leadId,
          requestTime
        );

      renderDynamicAIReport(
        aiReport,
        result
      );

    } catch (error) {

      console.error(
        "Editable sync failed:",
        error
      );

    }

  }

  // Trigger only after user finishes editing
  billInput.addEventListener(
    "change",
    syncLeadChanges
  );

  cityInput?.addEventListener(
    "change",
    syncLeadChanges
  );

  nameInput?.addEventListener(
    "change",
    syncLeadChanges
  );

}

// ===============================
// 🤖 AI INSIGHTS ENGINE
// ===============================

function generateAIScore(
  bill,
  propertyType,
  rooftopOwnership,
  roofType,
  payback
) {

  let score = 50;

  if (bill >= 3000) score += 20;
  else if (bill >= 1500) score += 10;

  if (propertyType === "Independent House") score += 15;

  if (rooftopOwnership === "Yes") score += 10;

  if (roofType === "Concrete") score += 10;

  if (payback <= 4) score += 10;
  else if (payback <= 6) score += 5;

  return Math.min(score, 99);
}

function getDynamicAISummary(data) {

  const summaries = [

    `Your electricity usage pattern indicates strong suitability for rooftop solar adoption. A ${data.systemSize} kW system could significantly reduce long-term grid dependency.`,

    `Based on your projected payback period of ${data.payback} years, this solar investment appears financially attractive for residential installation.`,

    `Your profile aligns well with subsidy-supported solar adoption, potentially improving long-term savings and installation ROI.`,

    `With estimated lifetime savings exceeding ${formatIndianCurrency(data.lifetimeSavings)}, rooftop solar may provide substantial financial benefits over time.`,

    `Our AI analysis indicates that your rooftop and electricity usage profile are compatible with high-efficiency residential solar deployment.`

  ];

  // Bonus line for state subsidy
  if (data.stateSubsidy > 0) {
    summaries.push(
      `Additional state-level subsidy support currently improves your estimated solar return on investment.`
    );
  }

  // Random selection
  const randomIndex =
    Math.floor(Math.random() * summaries.length);

  return summaries[randomIndex];
}

function renderAIInsights({
  bill,
  result,
  propertyType,
  rooftopOwnership,
  roofType
}) {

  const aiSection =
    document.getElementById("aiInsightsSection");

  if (!aiSection) return;

  const score = generateAIScore(
    bill,
    propertyType,
    rooftopOwnership,
    roofType,
    parseFloat(result.payback)
  );

  // SCORE
  document.getElementById("aiScore").innerText = score;

  // BADGE
  let badge = "Moderate Match";

  if (score >= 85) badge = "Excellent Match";
  else if (score >= 70) badge = "Strong Match";
  else if (score >= 55) badge = "Good Match";

  document.getElementById("aiBadge").innerText = badge;

  // PROGRESS
  document.getElementById("aiProgressBar").style.width =
    score + "%";

  // FINANCIAL INSIGHT
  let financialText =
    `Your estimated monthly savings of ₹${result.monthlySavings} and projected payback period of ${result.payback} years indicate favorable long-term solar economics.`;

  if (parseFloat(result.payback) <= 4) {
    financialText =
      `Your projected payback period is considered excellent for residential rooftop solar adoption.`;
  }

  document.getElementById("financialInsight").innerText =
    financialText;

  // ROOF INSIGHT
  let roofText =
    `Your rooftop profile appears compatible with standard residential solar installation requirements.`;

  if (
    rooftopOwnership === "Yes" &&
    roofType === "Concrete"
  ) {
    roofText =
      `Concrete rooftop ownership significantly improves installation feasibility and installer readiness.`;
  }

  document.getElementById("roofInsight").innerText =
    roofText;

  // SUBSIDY INSIGHT
  let subsidyText =
    `Your location currently qualifies for central government rooftop solar subsidy support.`;

  if (result.stateSubsidy > 0) {
    subsidyText =
      `Your state currently offers additional subsidy support beyond the central government scheme, improving overall ROI.`;
  }

  document.getElementById("subsidyInsight").innerText =
    subsidyText;

  // SAVINGS PROJECTION
  document.getElementById("save5").innerText =
  formatIndianCurrency(
    Math.round(result.monthlySavings * 12 * 5)
  );

document.getElementById("save10").innerText =
  formatIndianCurrency(
    Math.round(result.monthlySavings * 12 * 10)
  );

document.getElementById("save25").innerText =
  formatIndianCurrency(
    Math.round(result.monthlySavings * 12 * 25)
  );
  
  // SUMMARY
  
  document.getElementById("aiSummary").innerText =
  getDynamicAISummary({
    bill,
    systemSize: result.systemSize,
    payback: result.payback,
    lifetimeSavings: result.lifetimeSavings,
    stateSubsidy: result.stateSubsidy
  });

  // SHOW
  aiSection.classList.remove("hidden");

  aiSection.scrollIntoView({
    behavior: "smooth",
    block: "start"
  });
}

function showAILoadingState() {

  document.getElementById("submitSuccess")
    ?.classList.add("hidden");

  document.getElementById("aiInsightsSection")
    ?.classList.add("hidden");
    
    document.getElementById("personaSection")
  ?.classList.add("hidden");

  document.getElementById("pricingConfidenceSection")
    ?.classList.add("hidden");

  document.getElementById("buyerProtectionSection")
    ?.classList.add("hidden");
  
  const loadingEl =
    document.getElementById("aiLoadingState");

  loadingEl?.classList.remove("hidden");

  loadingEl?.scrollIntoView({
    behavior: "smooth",
    block: "center"
  });
}

async function waitForAIReport(leadId, requestTime) {

  const maxAttempts = 12;

  for (let i = 0; i < maxAttempts; i++) {

    try {

      const doc = await db
        .collection("ai_reports")
        .doc(leadId)
        .get();

      if (doc.exists) {

        const data = doc.data();

        const generatedAt =
          data.generatedAt?.toMillis?.() || 0;

        if (generatedAt >= requestTime) {
          return data;
        }
      }

    } catch (error) {
      console.error("AI report fetch error:", error);
    }

    await new Promise(resolve =>
      setTimeout(resolve, 2000)
    );
  }

  throw new Error("AI report generation timeout");
}

function renderDynamicAIReport(report, result) {

  // Hide loading
  document.getElementById("aiLoadingState")
    ?.classList.add("hidden");

  // SHOW SECTION
  const aiSection =
  document.getElementById("aiInsightsSection");

if (aiSection) {
  aiSection.classList.remove("hidden");
}

  // SCORE
  const aiScoreEl =
  document.getElementById("aiScore");

if (aiScoreEl) {
  aiScoreEl.innerText =
    report.persona?.confidence || 85;
}

  // BADGE
  document.getElementById("aiBadge").innerText =
    report.installerReadiness?.level || "Strong Match";

  // PROGRESS
  document.getElementById("aiProgressBar").style.width =
    `${report.persona?.confidence || 85}%`;

  // FINANCIAL
  document.getElementById("financialInsight").innerText =
    `Estimated monthly savings of ₹${result.monthlySavings} with projected payback of ${result.payback} years indicate favorable long-term solar economics.`;

  // ROOF
  document.getElementById("roofInsight").innerText =
    report.installerReadiness?.message ||
    "Your rooftop profile appears compatible with residential solar installation.";

  // SUBSIDY
  document.getElementById("subsidyInsight").innerText =
    report.stateSubsidy > 0
      ? "Your state currently offers additional subsidy support beyond central schemes."
      : "Your location qualifies for central rooftop solar subsidy support.";

  // SAVINGS
  document.getElementById("save5").innerText =
    formatIndianCurrency(
      Math.round(result.monthlySavings * 12 * 5)
    );

  document.getElementById("save10").innerText =
    formatIndianCurrency(
      Math.round(result.monthlySavings * 12 * 10)
    );

  document.getElementById("save25").innerText =
    formatIndianCurrency(
      Math.round(result.monthlySavings * 12 * 25)
    );

  // SUMMARY
  document.getElementById("aiSummary").innerText =
    report.recommendationSummary || "";

// ===============================
// 🧠 PERSONA ENGINE V2 RENDER
// ===============================

const personaPrimary =
  report.personaV2?.primary || "Balanced Buyer";

const personaSecondary =
  report.personaV2?.secondary || "";

const personaConfidence =
  report.personaV2?.confidence || 85;

const personaUrgency =
  report.personaV2?.urgency || "Normal";

const financingLikelihood =
  report.personaV2?.financingLikelihood || "Low";

const installerFit =
  report.personaV2?.installerFit || "Moderate";

const personaCharacteristics =
  report.personaV2?.characteristics || [];

const personaSummary =
  report.personaV2?.summary || "";

// Primary persona
const primaryEl =
  document.getElementById("personaPrimary");

if (primaryEl) {
  primaryEl.innerText = personaPrimary;
}

// Secondary persona
const secondaryEl =
  document.getElementById("personaSecondary");

if (secondaryEl) {
  secondaryEl.innerText = personaSecondary;
}

// Confidence
const confidenceEl =
  document.getElementById("personaConfidence");

if (confidenceEl) {
  confidenceEl.innerText =
    `${personaConfidence}%`;
}

// Urgency
const urgencyEl =
  document.getElementById("personaUrgency");

if (urgencyEl) {
  urgencyEl.innerText = personaUrgency;
}

// Financing
const financingEl =
  document.getElementById("personaFinancing");

if (financingEl) {
  financingEl.innerText =
    financingLikelihood;
}

// Installer fit
const installerFitEl =
  document.getElementById("personaInstallerFit");

if (installerFitEl) {
  installerFitEl.innerText =
    installerFit;
}

// Summary
const summaryEl =
  document.getElementById("personaSummary");

if (summaryEl) {
  summaryEl.innerText =
    personaSummary;
}

// Characteristics
const traitsEl =
  document.getElementById("personaTraits");

if (traitsEl) {

  traitsEl.innerHTML =
    personaCharacteristics
      .map(trait =>
        `<li>${trait}</li>`
      )
      .join("");
}

// SHOW SECTION
document.getElementById("personaSection")
  ?.classList.remove("hidden");
  
// =========================
// 💰 PRICING CONFIDENCE
// =========================

const pricingSection =
  document.getElementById(
    "pricingConfidenceSection"
  );

pricingSection?.classList.remove("hidden");

const pricingLevel =
  report.pricingConfidence?.level || "Moderate";

document.getElementById(
  "pricingConfidenceLevel"
).innerText = pricingLevel;

document.getElementById(
  "pricingConfidenceMessage"
).innerText =
  report.pricingConfidence?.message ||
  "Estimated pricing appears aligned with expected market ranges.";
/*
let pricingWidth = 65;

if (pricingLevel === "High") {
  pricingWidth = 90;
}

if (pricingLevel === "Moderate") {
  pricingWidth = 70;
}
*/

const pricingBar = document.getElementById("pricingConfidenceBar");
if (pricingBar) {
  pricingBar.className =
    "h-full transition-all duration-700";
}
if (pricingLevel === "High") {
  pricingWidth = 90;
  pricingBar.classList.add("bg-emerald-500");
}
else if (pricingLevel === "Moderate") {
  pricingWidth = 70;
  pricingBar.classList.add("bg-yellow-500");
}
else {
  pricingWidth = 50;
  pricingBar.classList.add("bg-red-500");
}

  
document.getElementById(
  "pricingConfidenceBar"
).style.width = `${pricingWidth}%`;


// =========================
// 🛡️ BUYER PROTECTION
// =========================

const buyerSection =
  document.getElementById(
    "buyerProtectionSection"
  );

buyerSection?.classList.remove("hidden");

const protectionList =
  document.getElementById(
    "buyerProtectionList"
  );

const checklist =
  report.buyerProtectionChecklist || [];

protectionList.innerHTML = "";

checklist.forEach((item) => {

  protectionList.innerHTML += `

    <div class="flex items-start gap-3 p-4 rounded-xl border border-slate-100 bg-slate-50">

      <div class="text-emerald-600 text-lg mt-0.5">
        ✔
      </div>

      <p class="text-sm text-slate-700 leading-relaxed">
        ${item}
      </p>

    </div>

  `;

});

requestAnimationFrame(() => {

  const aiSection =
    document.getElementById("aiInsightsSection");

  if (!aiSection) return;

  const y =
    aiSection.getBoundingClientRect().top +
    window.pageYOffset - 24;

  window.scrollTo({
    top: y,
    behavior: "smooth"
  });

});
}

// new end////

// ===============================
// 🔹 INIT
// ===============================
const bill = getBillFromURL();

if (bill > 0) {
  const result = calculateSolar(bill);
  renderResults(result, bill);
  setupBillUpload();
  populateCapturedData();
  setupEditableInputs();
} else {
  document.body.innerHTML = "Invalid Input";
}