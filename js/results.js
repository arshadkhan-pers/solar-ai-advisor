
/* eslint-disable max-len */

// ===============================
// ✅ CONFIGURATION
// ===============================

// Special category states (10% higher central subsidy)
const specialStates = ["AS", "UK", "HP", "JK", "LA", "SK"];

// Zero top-up states
const zeroTopUpStates = ["KL", "KA", "TN", "TS", "PB", "WB", "HR", "CG"];

// State top-up configuration (UPDATED ACCURATE) [3]
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
// 🔹 ROADMAP & UPLOAD HELPERS
// ===============================
// ===============================
// 🔹 ROADMAP & UPLOAD HELPERS
// ===============================
function updateRoadmap(stage) {
    const roadmapProgress = document.getElementById('roadmapProgress');
    if (!roadmapProgress) return;

    // Mapping each stage
    const stageMap = { 
        "INITIAL": 1, "AI_GENERATED": 2, "SURVEY_REQUESTED": 3, 
        "SURVEY_COMPLETED": 4, "OFFER_GIVEN": 5, "OFFER_ACCEPTED": 6, 
        "INSTALLATION_COMPLETED": 7, "SUBSIDY_CREDITED": 8
    };
    
    const step = stageMap[stage] || 1;
    roadmapProgress.style.width = (step * 12.5) + "%";
    
    // 1. Show/Hide Upload Section
    const uploadSection = document.getElementById('quoteUploadSection');
    if (uploadSection) {
        uploadSection.classList.toggle('hidden', !(stage === "OFFER_GIVEN" || stage === "OFFER_ACCEPTED"));
    }

    // 2. NEW: Disable "Unlock My AI Solar Analysis" button if survey requested
    const submitBtn = document.querySelector("#leadForm button");
    if (submitBtn) {
        const lockedStages = ["SURVEY_REQUESTED", "SURVEY_COMPLETED", "OFFER_GIVEN", "OFFER_ACCEPTED", "INSTALLATION_COMPLETED", "SUBSIDY_CREDITED"];
        const isLocked = lockedStages.includes(stage);
        
        submitBtn.disabled = isLocked;
        if (isLocked) {
            submitBtn.innerText = "Analysis Locked";
            submitBtn.classList.add("opacity-50", "cursor-not-allowed");
        }
    }
}


// Logic to handle Quote Upload
async function uploadQuote() {
    const fileInput = document.getElementById('quoteFileInput');
    const file = fileInput?.files[0];
    const leadId = localStorage.getItem("leadId");
    
    if (!file) return alert("Please select a file first");
    if (!leadId) return alert("Lead ID not found");

    try {
        const storageRef = firebase.storage().ref('quotes/' + leadId);
        await storageRef.put(file);
        const url = await storageRef.getDownloadURL();
        
        await db.collection("leads").doc(leadId).update({ 
            quoteUrl: url,
            stage: "OFFER_ACCEPTED" 
        });
        
        alert("Quote uploaded successfully!");
        location.reload(); // Refresh to update UI
    } catch (error) {
        console.error("Upload failed:", error);
        alert("Upload failed. Please try again.");
    }
}

// ===============================
// 🔵 CENTRAL SUBSIDY (2026) [3]
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
  if (specialStates.includes(state)) {
    subsidy = subsidy * 1.1;
  }
  return Math.round(subsidy);
}

// ===============================
// 🟢 STATE SUBSIDY ENGINE
// ===============================
function calculateStateSubsidy(systemSize, state, bill, totalCost, centralSubsidy) {
  if (zeroTopUpStates.includes(state)) return 0;
  const config = stateSubsidyConfig[state];
  if (!config) return 0;

  if (config.type === "goa_model") {
    const units = bill / 7;
    if (units <= 400) {
      if (systemSize <= 5) {
        const required = totalCost - centralSubsidy;
        return Math.min(required, 250000);
      }
    }
    let subsidy = systemSize * 23000;
    subsidy = Math.min(subsidy, 250000);
    return Math.round(subsidy);
  }

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

function calculateSolar(bill, stateOverride = null) {
  // If a stateOverride (from the dropdown) exists, use it. Otherwise, use URL.
  const state = stateOverride || getStateFromURL() || "UP";
  const units = bill / 7;
  const systemSize = Math.max(1, Math.round(units / 120));
  const costPerKW = 55000;
  const totalCost = systemSize * costPerKW;

  const centralSubsidy = calculateCentralSubsidy(systemSize, state);
  const stateSubsidy = calculateStateSubsidy(systemSize, state, bill, totalCost, centralSubsidy);

  const totalSubsidy = centralSubsidy + stateSubsidy;
  const finalCost = totalCost - totalSubsidy;

  const monthlySavings = units * 7;
  const payback = finalCost / (monthlySavings * 12);

  const panels = Math.ceil((systemSize * 1000) / 550);
  const area = Math.round(systemSize * 80);
  const lifetimeSavings = Math.round(monthlySavings * 12 * 25);

  // --- ADDED EMI & LOAN MATHS (Canara Bank 6.5% for 60 Months) [1] ---
  const principalLoan = Math.round(finalCost * 0.90);
  const annualRate = 6.5; 
  const monthlyRate = (annualRate / 12) / 100;
  const months = 60; 

  const solarEmi = Math.round(
    (principalLoan * monthlyRate * Math.pow(1 + monthlyRate, months)) / 
    (Math.pow(1 + monthlyRate, months) - 1)
  );

  const netMonthlyBenefit = Math.round(monthlySavings - solarEmi);

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
    state,
    solarEmi,
    netMonthlyBenefit
  };
}

// ===============================
// 🔹 RENDER
// ===============================
function renderResults(data, bill) {
  // If you store the stage in localStorage, retrieve it; otherwise default to AI_GENERATED
  const currentStage = localStorage.getItem("leadStage") || "AI_GENERATED";
  updateRoadmap(currentStage);
  
  const stateFullName = stateNames[data.state] || data.state;
  const el = document.getElementById("stateInfo");

  if (el) {
    if (data.stateSubsidy > 0) {
      if (data.state === "GA") {
        el.innerText = `Includes Goa special subsidy (may be credited after installation)`;
      } else {
        el.innerText = `Includes central + ${stateFullName} state subsidy`;
      }
    } else {
      el.innerText = `Only central subsidy applicable in ${stateFullName}`;
    }
  }

  document.getElementById("systemSize").innerText = `${data.systemSize} kW Solar System Recommended`;
  document.getElementById("billInfo").innerText = `Based on your ₹${bill}/month bill`;

  document.getElementById("totalCost").innerText = data.totalCost.toLocaleString('en-IN');
  document.getElementById("subsidy").innerText = data.subsidy.toLocaleString('en-IN');
  document.getElementById("finalCost").innerText = data.finalCost.toLocaleString('en-IN');
  document.getElementById("monthlySavings").innerText = data.monthlySavings.toLocaleString('en-IN');
  document.getElementById("payback").innerText = data.payback;
  document.getElementById("panels").innerText = data.panels;
  document.getElementById("area").innerText = data.area;
  document.getElementById("lifetimeSavings").innerText = data.lifetimeSavings.toLocaleString('en-IN');
  document.getElementById("centralSubsidy").innerText = data.centralSubsidy.toLocaleString('en-IN');
  document.getElementById("stateSubsidy").innerText = data.stateSubsidy.toLocaleString('en-IN');

  // --- POPULATE AND REVEAL THE COMPLIANT EMI PLAN CARD ---
  const emiCard = document.getElementById("dynamicEmiCard");
  if (emiCard) {
    document.getElementById("solarEmi").innerText = data.solarEmi.toLocaleString('en-IN');
    document.getElementById("emiMonthlySavings").innerText = data.monthlySavings.toLocaleString('en-IN');
    document.getElementById("netMonthlyBenefit").innerText = data.netMonthlyBenefit.toLocaleString('en-IN');
    emiCard.classList.remove("hidden"); 
  }
}

// ===============================
// 🔹 WHATSAPP
// ===============================
function openWhatsApp() {
  const bill = getBillFromURL();
  const result = calculateSolar(bill);
  const stateFullName = stateNames[result.state] || result.state;

  const message = `Hi, I’m interested in installing rooftop solar.\n\n` +
    `Location: ${stateFullName}\n` +
    `Monthly Bill: ₹${bill}\n` +
    `Recommended System: ${result.systemSize} kW\n` +
    `Estimated Cost: ₹${result.finalCost.toLocaleString('en-IN')}\n` +
    `Monthly Savings: ₹${result.monthlySavings.toLocaleString('en-IN')}\n` +
    `Payback Period: ${result.payback} years`;

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
    form.scrollIntoView({ behavior: "smooth", block: "start" });
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
  
  const currentStage = (localStorage.getItem("leadStage") || "").toUpperCase();

// This effectively locks the report for any stage that is NOT Initial or AI_GENERATED
if (currentStage && currentStage !== "INITIAL" && currentStage !== "AI_GENERATED") {
    alert("Analysis report is locked. You have already requested a site survey.");
    return; // Stop execution
}
  
  const submitBtn = document.querySelector("#leadForm button");
  submitBtn.disabled = true;
  submitBtn.innerText = "Generating AI Analysis...";
  
  const name = document.getElementById("capturedName")?.value.trim() || "Homeowner";
  
  // Try to get city from the new dropdown, fallback to the old input if needed
  const cityDropdown = document.getElementById("resCity");
  const cityInput = document.getElementById("capturedCity");
  const city = (cityDropdown && cityDropdown.value) ? cityDropdown.value : cityInput?.value?.trim();
  // ---------------------------

  //const city = document.getElementById("capturedCity")?.value.trim();
  const billValue = document.getElementById("capturedBill")?.value;
  const bill = parseFloat(billValue || getBillFromURL());
  
  const propertyType = document.getElementById("propertyType")?.value;
  const roofType = document.getElementById("roofType")?.value;
  const rooftopOwnership = document.getElementById("rooftopOwnership")?.value;
  const connectionType = document.getElementById("connectionType")?.value;
  const billFile = document.getElementById("billUpload")?.files?.[0];

  // Validate City is provided (crucial for local installers and accurate dynamic routing)
  if (!city || city === "" || city === "Select City") { // Check specifically for "Select City" if that's your placeholder
    alert("Please select your City from the dropdown to complete the dynamic feasibility analysis.");
    submitBtn.disabled = false;
    submitBtn.innerText = "Submit Request";
    return;
  }

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

  const leadType = getLeadType(bill, propertyType, rooftopOwnership);
  const requestTime = Date.now();
  
  // Recalculate solar parameters in case bill or state changed
  const result = calculateSolar(bill);
  
  try {
    await db.collection("leads").doc(leadId).update({
      name,
      city,
      bill,
      propertyType,
      roofType,
      rooftopOwnership,
      connectionType,
      billUploaded: billFile? "Yes" : "No",
      leadType,
      stage: "AI_GENERATED",
      aiRegenerationRequired: true,
      // Persist compiled calculations back to Firestore
      systemSizeKw: result.systemSize,
      totalSubsidy: result.subsidy,
      netCost: result.finalCost,
      monthlySavings: result.monthlySavings,
      paybackYears: result.payback,
      panelsCount: result.panels,
      areaRequired: result.area,
      lifetimeSavings: result.lifetimeSavings,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });

    console.log("✅ Lead updated successfully");

  } catch (error) {
    console.error("❌ Update failed:", error);
    alert(error.message);
    submitBtn.disabled = false;
    submitBtn.innerText = "Submit Request";
    return;
  }
  
  document.getElementById("leadForm")?.classList.add("hidden");
  showAILoadingState();

  try {
    const aiReport = await waitForAIReport(leadId, requestTime);
    renderDynamicAIReport(aiReport, result);
    submitBtn.disabled = false;
    submitBtn.innerText = "Submit Request"; 
  } catch (error) {
    console.error(error);
    document.getElementById("aiLoadingState")?.classList.add("hidden");
    
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
}

// ✅ Upload handling
function setupBillUpload() {
  const uploadArea = document.getElementById("billUploadArea");
  const fileInput = document.getElementById("billUpload");
  const fileNameDisplay = document.getElementById("billFileName");

  if (!uploadArea ||!fileInput ||!fileNameDisplay) return;

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

  const rawName = params.get("name") || "";
  if (name) name.value = (rawName === "Homeowner" ||!rawName)? "" : decodeURIComponent(rawName);
  if (phone) phone.value = params.get("phone") || "";
  
  const rawCity = params.get("city") || "";
  if (city) {
    city.value = (rawCity === "N/A" ||!rawCity)? "" : decodeURIComponent(rawCity);
    city.placeholder = "City (e.g., Lucknow)";
  }
  if (bill) bill.value = params.get("bill") || "";
}


//////////////
function setupEditableInputs() {
  const billInput = document.getElementById("capturedBill");
  const cityInput = document.getElementById("capturedCity");
  const nameInput = document.getElementById("capturedName");
  
  if (!billInput) return;

  // This function ONLY updates the UI and the URL
  function updateUIDisplay() {
    const newBill = parseFloat(billInput.value) || 0;
    const cityDropdown = document.getElementById("resCity");
    const newCity = cityDropdown?.value || ""; 
    const newName = nameInput?.value?.trim() || "";
    
    const currentState = document.getElementById("resState")?.value || "UP";

    // 1. Update URL without refreshing page
    const params = new URLSearchParams(window.location.search);
    params.set("bill", newBill);
    params.set("state", currentState); // Update state in URL too
    if (newCity) params.set("city", newCity);
    if (newName) params.set("name", newName);
    history.replaceState({}, "", `${window.location.pathname}?${params.toString()}`);


    // 2. Instant UI Recalculation (Local only, no DB call)
    const result = calculateSolar(newBill, currentState); // Pass currentState here
    renderResults(result, newBill);
  }

  // Attach to inputs (no spinner, no DB write)
  billInput.addEventListener("input", updateUIDisplay);
  cityInput?.addEventListener("input", updateUIDisplay);
  nameInput?.addEventListener("input", updateUIDisplay);
}

// ===============================
// 🤖 AI INSIGHTS ENGINE
// ===============================
function generateAIScore(bill, propertyType, rooftopOwnership, roofType, payback) {
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

  if (data.stateSubsidy > 0) {
    summaries.push(`Additional state-level subsidy support currently improves your estimated solar return on investment.`);
  }

  const randomIndex = Math.floor(Math.random() * summaries.length);
  return summaries[randomIndex];
}

function renderAIInsights({ bill, result, propertyType, rooftopOwnership, roofType }) {
  const aiSection = document.getElementById("aiInsightsSection");
  if (!aiSection) return;

  const score = generateAIScore(bill, propertyType, rooftopOwnership, roofType, parseFloat(result.payback));

  document.getElementById("aiScore").innerText = score;

  let badge = "Moderate Match";
  if (score >= 85) badge = "Excellent Match";
  else if (score >= 70) badge = "Strong Match";
  else if (score >= 55) badge = "Good Match";

  document.getElementById("aiBadge").innerText = badge;
  document.getElementById("aiProgressBar").style.width = score + "%";

  let financialText = `Your estimated monthly savings of ₹${result.monthlySavings} and projected payback period of ${result.payback} years indicate favorable long-term solar economics.`;
  if (parseFloat(result.payback) <= 4) {
    financialText = `Your projected payback period is considered excellent for residential rooftop solar adoption.`;
  }
  document.getElementById("financialInsight").innerText = financialText;

  let roofText = `Your rooftop profile appears compatible with standard residential solar installation requirements.`;
  if (rooftopOwnership === "Yes" && roofType === "Concrete") {
    roofText = `Concrete rooftop ownership significantly improves installation feasibility and installer readiness.`;
  }
  document.getElementById("roofInsight").innerText = roofText;

  let subsidyText = `Your location currently qualifies for central government rooftop solar subsidy support.`;
  if (result.stateSubsidy > 0) {
    subsidyText = `Your state currently offers additional subsidy support beyond the central government scheme, improving overall ROI.`;
  }
  document.getElementById("subsidyInsight").innerText = subsidyText;

  document.getElementById("save5").innerText = formatIndianCurrency(Math.round(result.monthlySavings * 12 * 5));
  document.getElementById("save10").innerText = formatIndianCurrency(Math.round(result.monthlySavings * 12 * 10));
  document.getElementById("save25").innerText = formatIndianCurrency(Math.round(result.monthlySavings * 12 * 25));
  
  document.getElementById("aiSummary").innerText = getDynamicAISummary({
    bill,
    systemSize: result.systemSize,
    payback: result.payback,
    lifetimeSavings: result.lifetimeSavings,
    stateSubsidy: result.stateSubsidy
  });

  aiSection.classList.remove("hidden");
  aiSection.scrollIntoView({ behavior: "smooth", block: "start" });
}

function showAILoadingState() {
  document.getElementById("submitSuccess")?.classList.add("hidden");
  document.getElementById("aiInsightsSection")?.classList.add("hidden");
  document.getElementById("personaSection")?.classList.add("hidden");
  document.getElementById("pricingConfidenceSection")?.classList.add("hidden");
  document.getElementById("buyerProtectionSection")?.classList.add("hidden");
  
  const loadingEl = document.getElementById("aiLoadingState");
  loadingEl?.classList.remove("hidden");
  loadingEl?.scrollIntoView({ behavior: "smooth", block: "center" });
}

async function waitForAIReport(leadId, requestTime) {
  const maxAttempts = 12;
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const doc = await db.collection("ai_reports").doc(leadId).get();
      if (doc.exists) {
        const data = doc.data();
        const generatedAt = data.generatedAt?.toMillis?.() || 0;
        if (generatedAt >= requestTime) {
          return data;
        }
      }
    } catch (error) {
      console.error("AI report fetch error:", error);
    }
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  throw new Error("AI report generation timeout");
}
// ... inside the 'try' block of requestSiteSurvey ...
    
    // Commit both updates
    await batch.commit();

    // TRIGGER THE UI LOCK IMMEDIATELY
    localStorage.setItem("leadStage", "SURVEY_REQUESTED"); // Ensure localStorage is updated
    updateRoadmap("SURVEY_REQUESTED"); // This handles the button disabling

    // Success state
    btn.innerText = "✓ Request Submitted";
// ... rest of success logic ...


async function requestSiteSurvey() {
  const leadId = localStorage.getItem("leadId");
  const leadCode = localStorage.getItem("leadCode");
  const btn = event.target;
  
  if (!leadId) {
    alert("Lead ID not found. Please refresh the page.");
    return;
  }

  btn.disabled = true;
  btn.innerText = "Requesting...";
  btn.classList.add("opacity-50", "cursor-not-allowed");

  try {
    // Use Batch write for atomic operation
    const batch = db.batch();
    
    // 1. Reference to the lead document
    const leadRef = db.collection("leads").doc(leadId);
    // 2. Reference to the new survey request
    const surveyRef = db.collection("survey_requests").doc(leadId);

    // Set the Lead Stage
    batch.update(leadRef, { 
      stage: "SURVEY_REQUESTED" 
    });

    // Create the Survey Request
    batch.set(surveyRef, {
      leadId: leadId,
      leadCode: leadCode || "N/A",
      phone: document.getElementById("capturedPhone")?.value || "N/A",
      status: "pending",
      requestedAt: firebase.firestore.FieldValue.serverTimestamp(),
      requestedCity: document.getElementById("resCity")?.value || "Unknown",
      clientName: document.getElementById("capturedName")?.value || "Homeowner"
    });

    // Commit both updates
    await batch.commit();

// TRIGGER THE UI LOCK IMMEDIATELY
    localStorage.setItem("leadStage", "SURVEY_REQUESTED"); // Ensure localStorage is updated
    updateRoadmap("SURVEY_REQUESTED"); // This handles the button disabling

    
    // Success state
    btn.innerText = "✓ Request Submitted";
    btn.classList.replace("bg-indigo-600", "bg-emerald-500");
    
    const successMsg = document.createElement("p");
    successMsg.className = "text-emerald-600 text-sm mt-3 font-medium text-center animate-fade-in";
    successMsg.innerText = "Our team will contact you within 24 hours to schedule your survey.";
    btn.parentNode.appendChild(successMsg);
    
  } catch (error) {
    console.error("Survey request failed:", error);
    alert("Request failed. Please try again.");
    btn.innerText = "Try Again";
    btn.disabled = false;
    btn.classList.remove("opacity-50");
  }
}

function renderDynamicAIReport(report, result) {
  document.getElementById("aiLoadingState")?.classList.add("hidden");

// Logic to show/hide Concierge vs Installer

  const conciergeCard = document.getElementById("conciergeCard");
  const installerSection = document.getElementById("installerSection"); // Target the parent container now

  if (report.matchedInstallers && report.matchedInstallers.length > 0) {
    conciergeCard.classList.add("hidden");
    installerSection.classList.remove("hidden"); // Show the whole section
    
    // Call the new renderer
    renderInstallerCards(report.matchedInstallers);
  } else {
    conciergeCard.classList.remove("hidden");
    installerSection.classList.add("hidden"); // Hide the whole section (Heading + List)
  }
  
  const aiSection = document.getElementById("aiInsightsSection");
  if (aiSection) {
    aiSection.classList.remove("hidden");
  }

  const aiScoreEl = document.getElementById("aiScore");
  if (aiScoreEl) {
    aiScoreEl.innerText = report.persona?.confidence || 85;
  }

  document.getElementById("aiBadge").innerText = report.installerReadiness?.level || "Strong Match";
  document.getElementById("aiProgressBar").style.width = `${report.persona?.confidence || 85}%`;
  document.getElementById("financialInsight").innerText = `Estimated monthly savings of ₹${result.monthlySavings} with projected payback of ${result.payback} years indicate favorable long-term solar economics.`;
  document.getElementById("roofInsight").innerText = report.installerReadiness?.message || "Your rooftop profile appears compatible with residential solar installation.";

  document.getElementById("subsidyInsight").innerText =
    report.stateSubsidy > 0
    ? "Your state currently offers additional subsidy support beyond central schemes."
      : "Your location qualifies for central rooftop solar subsidy support.";

  document.getElementById("save5").innerText = formatIndianCurrency(Math.round(result.monthlySavings * 12 * 5));
  document.getElementById("save10").innerText = formatIndianCurrency(Math.round(result.monthlySavings * 12 * 10));
  document.getElementById("save25").innerText = formatIndianCurrency(Math.round(result.monthlySavings * 12 * 25));
  document.getElementById("aiSummary").innerText = report.recommendationSummary || "";

  // 🧠 PERSONA ENGINE V2 RENDER
  const personaPrimary = report.personaV2?.primary || "Balanced Buyer";
  const personaSecondary = report.personaV2?.secondary || "";
  const personaConfidence = report.personaV2?.confidence || 85;
  const personaUrgency = report.personaV2?.urgency || "Normal";
  const financingLikelihood = report.personaV2?.financingLikelihood || "Low";
  const installerFit = report.personaV2?.installerFit || "Moderate";
  const personaCharacteristics = report.personaV2?.characteristics || [];
  const personaSummary = report.personaV2?.summary || "";

  const primaryEl = document.getElementById("personaPrimary");
  if (primaryEl) primaryEl.innerText = personaPrimary;

  const secondaryEl = document.getElementById("personaSecondary");
  if (secondaryEl) secondaryEl.innerText = personaSecondary;

  const confidenceEl = document.getElementById("personaConfidence");
  if (confidenceEl) confidenceEl.innerText = `${personaConfidence}%`;

  const urgencyEl = document.getElementById("personaUrgency");
  if (urgencyEl) urgencyEl.innerText = personaUrgency;

  const financingEl = document.getElementById("personaFinancing");
  if (financingEl) financingEl.innerText = financingLikelihood;

  const installerFitEl = document.getElementById("personaInstallerFit");
  if (installerFitEl) installerFitEl.innerText = installerFit;

  const summaryEl = document.getElementById("personaSummary");
  if (summaryEl) summaryEl.innerText = personaSummary;

  const traitsEl = document.getElementById("personaTraits");
  if (traitsEl) {
    traitsEl.innerHTML = personaCharacteristics.map(trait => `<li>${trait}</li>`).join("");
  }

  document.getElementById("personaSection")?.classList.remove("hidden");
  
  // 💰 PRICING CONFIDENCE
  const pricingSection = document.getElementById("pricingConfidenceSection");
  pricingSection?.classList.remove("hidden");

  const pricingLevel = report.pricingConfidence?.level || "Moderate";
  document.getElementById("pricingConfidenceLevel").innerText = pricingLevel;
  document.getElementById("pricingConfidenceMessage").innerText = report.pricingConfidence?.message || "Estimated pricing appears aligned with expected market ranges.";

  const pricingBar = document.getElementById("pricingConfidenceBar");
  let pricingWidth = 65;
  if (pricingBar) {
    pricingBar.className = "h-full transition-all duration-700";
    if (pricingLevel === "High") {
      pricingWidth = 90;
      pricingBar.classList.add("bg-emerald-500");
    } else if (pricingLevel === "Moderate") {
      pricingWidth = 70;
      pricingBar.classList.add("bg-yellow-500");
    } else {
      pricingWidth = 50;
      pricingBar.classList.add("bg-red-500");
    }
    pricingBar.style.width = `${pricingWidth}%`;
  }

  // 🛡️ BUYER PROTECTION
  const buyerSection = document.getElementById("buyerProtectionSection");
  buyerSection?.classList.remove("hidden");

  const protectionList = document.getElementById("buyerProtectionList");
  const checklist = report.buyerProtectionChecklist || [];
  protectionList.innerHTML = "";

  checklist.forEach((item) => {
    protectionList.innerHTML += `
      <div class="flex items-start gap-3 p-4 rounded-xl border border-slate-100 bg-slate-50">
        <div class="text-emerald-600 text-lg mt-0.5">✔</div>
        <p class="text-sm text-slate-700 leading-relaxed">${item}</p>
      </div>
    `;
  });

  requestAnimationFrame(() => {
    const aiSection = document.getElementById("aiInsightsSection");
    if (!aiSection) return;
    const y = aiSection.getBoundingClientRect().top + window.pageYOffset - 24;
    window.scrollTo({ top: y, behavior: "smooth" });
  });
}

// ===============================
// 🔹 INITIALIZATION
// ===============================
document.addEventListener("DOMContentLoaded", async () => {
    // 1. Sync Stage from Firestore
    const leadId = localStorage.getItem("leadId");
    if (leadId) {
        try {
            const leadDoc = await db.collection("leads").doc(leadId).get();
            if (leadDoc.exists) {
                const stage = leadDoc.data().stage || "INITIAL";
                localStorage.setItem("leadStage", stage);
                updateRoadmap(stage);
            }
        } catch (err) {
            console.error("Error syncing stage:", err);
        }
    }

    // 2. Setup inputs
    setupBillUpload();
    populateCapturedData();
    setupEditableInputs();

    // 3. Initialize location & Trigger calculation ONLY via callback
    const initialState = localStorage.getItem("state") || "UP";
    
    // This is the only place we call calculation to ensure the dropdowns are ready
    await LocationHandler.init("resState", "resCity", (newState) => {
        console.log("Location ready, State is:", newState);
        localStorage.setItem("state", newState); 
        calculateSavings(); 
    }, initialState);
});



// Logic to pull data from dropdown, recalculate, and re-render
function calculateSavings() {
    // 1. Get Bill: Check storage first, then URL, fallback to 0
    let bill = parseFloat(localStorage.getItem("bill")) || getBillFromURL();
    
    // If bill is still 0 (e.g. fresh load), look in the input field directly
    if (!bill) {
        const billInput = document.getElementById("capturedBill");
        bill = billInput ? parseFloat(billInput.value) : 0;
    }

    // 2. Get State: Check element, then storage, fallback to UP
    const stateEl = document.getElementById("resState");
    const state = (stateEl && stateEl.value) ? stateEl.value : (localStorage.getItem("state") || "UP");
    
    console.log(`Calculating for: ${state} with Bill: ₹${bill}`);

    if (bill > 0) {
        const result = calculateSolar(bill, state);
        renderResults(result, bill);
    } else {
        console.warn("Skipping render: No bill amount found.");
    }
}


// Helper: Render individual score bars
function renderMetric(label, value) {
    return `
        <div class="text-xs">
            <div class="flex justify-between mb-1">
                <span class="text-slate-500">${label}</span>
                <span class="font-semibold text-slate-800">${value}%</span>
            </div>
            <div class="w-full bg-slate-100 rounded-full h-1.5">
                <div class="bg-indigo-500 h-1.5 rounded-full" style="width: ${value}%"></div>
            </div>
        </div>
    `;
}

// Helper: Generate and display installer cards
function renderInstallerCards(installers) {
    const container = document.getElementById("installerListContainer");
    container.innerHTML = ""; // Clear existing

    installers.forEach(installer => {
        const { installerAI, matchReasons, score, businessName, installerType } = installer;
        
        const card = document.createElement("div");
        card.className = "bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow";
        
        card.innerHTML = `
            <div class="flex justify-between items-start mb-4">
                <div>
                    <h3 class="font-bold text-lg text-slate-900">${businessName}</h3>
                    <span class="inline-block mt-1 text-[10px] font-bold uppercase px-2 py-1 rounded-full ${
                        installerType === 'Premium' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600'
                    }">
                        ${installerType}
                    </span>
                </div>
                <div class="text-right">
                    <div class="text-2xl font-bold text-emerald-600">${score}%</div>
                    <div class="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Compatibility</div>
                </div>
            </div>

            <div class="flex flex-wrap gap-2 mb-4">
                ${matchReasons.map(reason => `
                    <span class="bg-emerald-50 text-emerald-700 text-[10px] px-2 py-1 rounded-full border border-emerald-100 font-medium">
                        ${reason}
                    </span>
                `).join('')}
            </div>

            <div class="grid grid-cols-2 gap-3 mb-5">
                ${renderMetric("Reliability", installerAI.reliabilityScore)}
                ${renderMetric("Subsidy Exp.", installerAI.subsidyExpertise)}
                ${renderMetric("Experience", installerAI.experienceScore)}
                ${renderMetric("Response", installerAI.responseScore)}
            </div>

            <button onclick="alert('Contacting ${businessName}...')" 
                    class="w-full bg-slate-900 text-white py-2.5 rounded-xl font-semibold text-sm hover:bg-slate-800 transition">
                WhatsApp ${businessName}
            </button>
        `;
        container.appendChild(card);
    });
}



