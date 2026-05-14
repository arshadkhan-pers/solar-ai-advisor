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
  "GOA": "Goa",
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


function calculateSolarScore(bill, payback, stateSubsidy) {

  let score = 50;

  if (bill >= 3000) score += 20;
  else if (bill >= 1500) score += 10;

  if (payback <= 4) score += 20;
  else if (payback <= 6) score += 10;

  if (stateSubsidy > 0) score += 10;

  return Math.min(score, 100);
}

function generateAIInsights(data) {

  const insights = [];

  if (data.monthlySavings >= 3000) {
    insights.push("💰 Your electricity bill is high enough to generate strong long-term solar savings.");
  }

  if (data.payback <= 5) {
    insights.push("⚡ Your estimated payback period is considered excellent for residential solar.");
  }

  if (data.stateSubsidy > 0) {
    insights.push(`🏛 Your state currently offers additional subsidy benefits beyond central support.`);
  }

  if (data.systemSize >= 5) {
    insights.push("🔋 Your energy usage suggests a high solar utilization potential.");
  }

  insights.push("📈 Electricity prices generally rise over time, increasing your future savings potential.");

  return insights;
}

function generateAISummary(data, bill) {

  return `
Based on your monthly electricity bill of ₹${bill}, 
our AI engine estimates that a ${data.systemSize} kW rooftop solar system 
would provide strong long-term financial benefits.

With estimated monthly savings of ₹${data.monthlySavings} 
and a projected payback period of ${data.payback} years, 
your property appears highly suitable for subsidy-supported solar installation.

Over the next 25 years, you could potentially save more than ₹${data.lifetimeSavings.toLocaleString()} 
while reducing dependency on rising electricity costs.
`;
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
  
  // 🔥 AI SCORE
const solarScore = calculateSolarScore(
  bill,
  parseFloat(data.payback),
  data.stateSubsidy
);

document.getElementById("solarScore").innerText = solarScore;
document.getElementById("scoreBar").style.width = solarScore + "%";

const badge = document.getElementById("scoreBadge");

if (solarScore >= 85) {
  badge.innerText = "Excellent Match";
} else if (solarScore >= 70) {
  badge.innerText = "Strong Match";
} else {
  badge.innerText = "Moderate Match";
}

// 🔥 SAVINGS TIMELINE
document.getElementById("saving5Year").innerText =
  "₹" + Math.round(data.monthlySavings * 12 * 5).toLocaleString();

document.getElementById("saving10Year").innerText =
  "₹" + Math.round(data.monthlySavings * 12 * 10).toLocaleString();

document.getElementById("saving25Year").innerText =
  "₹" + Math.round(data.monthlySavings * 12 * 25).toLocaleString();

// 🔥 AI INSIGHTS
const insights = generateAIInsights(data);

const insightsContainer = document.getElementById("aiInsights");

insightsContainer.innerHTML = insights.map(insight => `
  <div class="flex items-start gap-3 bg-slate-50 border border-slate-100 rounded-xl p-4">
    <div class="mt-0.5 text-lg">•</div>
    <p class="text-sm text-slate-700 leading-relaxed">${insight}</p>
  </div>
`).join("");

// 🔥 AI SUMMARY
document.getElementById("aiSummary").innerText =
  generateAISummary(data, bill);
  
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
  const propertyType = document.getElementById("propertyType")?.value;
  const roofType = document.getElementById("roofType")?.value;
  const rooftopOwnership = document.getElementById("rooftopOwnership")?.value;
  const connectionType = document.getElementById("connectionType")?.value;
  const billFile = document.getElementById("billUpload")?.files?.[0];

  const leadId = localStorage.getItem("leadId");

  if (!leadId) {
    alert("Lead ID not found");
    return;
  }

  if (typeof firebase === "undefined" || typeof db === "undefined") {
    alert("Database not initialized");
    return;
  }

  const bill = parseFloat(getBillFromURL());
  const leadType = getLeadType(bill, propertyType, rooftopOwnership);

  try {
    await db.collection("leads").doc(leadId).update({
      propertyType,
      roofType,
      rooftopOwnership,
      connectionType,
      billUploaded: billFile ? "Yes" : "No",
      leadType,
      stage: "qualified",
      updatedAt: new Date()
    });

    console.log("✅ Lead updated successfully");

  } catch (error) {
    console.error("❌ Update failed:", error);
    alert("Error updating lead");
    return;
  }

  document.getElementById("leadForm")?.classList.add("hidden");
  document.getElementById("submitSuccess")?.classList.remove("hidden");

  window.scrollTo({ top: 20, behavior: "smooth" });
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
  if (bill) bill.value = "₹" + (params.get("bill") || "");
}

// ===============================
// 🔹 INIT
// ===============================
const bill = getBillFromURL();

if (bill > 0) {
  const result = calculateSolar(bill);
  renderResults(result, bill);
  setupBillUpload();
  populateCapturedData();
} else {
  document.body.innerHTML = "Invalid Input";
}