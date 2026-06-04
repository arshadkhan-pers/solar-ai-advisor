/* eslint-disable max-len */

// ===============================
// ✅ CONFIGURATION
// ===============================

// Master Journey Configuration
const journeyMilestones = [
    { id: "ai", dbKey: "aiGenerated", title: "AI Feasibility Analysis", desc: "Initial system sizing and ROI calculated." },
    { id: "survey", dbKey: "surveyRequested", title: "Site Survey Requested", desc: "Awaiting physical assessment by the installer team." },
    { id: "surveyDone", dbKey: "surveyCompleted", title: "Site Survey Completed", desc: "Rooftop structural integrity and shadow analysis done." },
    { id: "offer", dbKey: "offerUploaded", title: "Quotation Uploaded", desc: "Awaiting Solar-AI technical audit." },
    { id: "audit", dbKey: "offerAccepted", title: "Quotation Approved", desc: "Quote meets Tier-1 ALMM guidelines." },
    
    // --- USER / OPS INTERACTIVE STEPS BELOW ---
    { id: "agreement", dbKey: "agreementSigned", title: "Commercial Agreement", desc: "Finalize terms and pay advance to your installer.", actionBtn: "Confirm Agreement Signed", triggersStage: "AGREEMENT_SIGNED" },
    { id: "discom", dbKey: "netMetering", title: "Discom Net-Metering", desc: "Vendor has initiated the application on the PM Surya Ghar portal.", actionBtn: "Mark Application Submitted", triggersStage: "NET_METERING_APPLIED" },
    { id: "install", dbKey: "installation", title: "Physical Installation", desc: "Rooftop deployment completed successfully.", actionBtn: "Log Installation Complete", triggersStage: "INSTALLATION_COMPLETED" },
    { id: "subsidy", dbKey: "subsidy", title: "Subsidy Credited", desc: "Central subsidy disbursed to bank account.", actionBtn: "Confirm Subsidy Received", triggersStage: "SUBSIDY_CREDITED" }
];

// Global cache variable for holding AI report data safely across operations
let aiReportCache = null; 

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
function updateRoadmap(stage, leadData = null) {
    const roadmapProgress = document.getElementById('roadmapProgress');
    if (!roadmapProgress) return;

    const widthMap = {
        "INITIAL": "15%",
        "AI_GENERATED": "25%",          
        "SURVEY_REQUESTED": "40%",      
        "SURVEY_COMPLETED": "55%",      
        "OFFER_GIVEN": "70%",           
        "OFFER_REJECTED": "70%",        
        "OFFER_UNDER_REVIEW": "75%",    
        "OFFER_ACCEPTED": "80%",        
        "AGREEMENT_SIGNED": "85%",      
        "NET_METERING_APPLIED": "90%",  
        "INSTALLATION_COMPLETED": "100%",
        "SUBSIDY_CREDITED": "100%"
    };
    
    roadmapProgress.style.width = widthMap[stage] || "15%";
    
    const uploadSection = document.getElementById('quoteUploadSection');
    if (uploadSection) {
        const showUpload = ["SURVEY_COMPLETED", "OFFER_GIVEN", "OFFER_REJECTED", "OFFER_UNDER_REVIEW", "OFFER_ACCEPTED", "AGREEMENT_SIGNED", "NET_METERING_APPLIED", "INSTALLATION_COMPLETED", "SUBSIDY_CREDITED"].includes(stage);
        uploadSection.classList.toggle('hidden', !showUpload);

        if (showUpload) {
            if (stage === "OFFER_UNDER_REVIEW") {
                uploadSection.innerHTML = `
                    <div class="bg-amber-50 border border-amber-200/80 rounded-2xl p-5 shadow-sm">
                        <div class="flex items-center gap-3">
                            <div class="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-xl shrink-0">⏳</div>
                            <div>
                                <h3 class="text-base font-bold text-amber-900">Review in Progress</h3>
                                <p class="text-xs text-amber-700 mt-0.5">Your uploaded quotation is currently under review by our technical team.</p>
                            </div>
                        </div>
                    </div>
                `;
            } else if (["OFFER_ACCEPTED", "AGREEMENT_SIGNED", "NET_METERING_APPLIED", "INSTALLATION_COMPLETED", "SUBSIDY_CREDITED"].includes(stage)) {
                
                // 🚀 FIX: Map out logical timeline statuses from macro stage when leadData is missing on manual refresh
                let timeline = leadData?.timeline || {};
                if (!leadData || !leadData.timeline) {
                    timeline = {
                        agreementSigned: { status: ["AGREEMENT_SIGNED", "NET_METERING_APPLIED", "INSTALLATION_COMPLETED", "SUBSIDY_CREDITED"].includes(stage) },
                        netMetering: { status: ["NET_METERING_APPLIED", "INSTALLATION_COMPLETED", "SUBSIDY_CREDITED"].includes(stage) },
                        installation: { status: ["INSTALLATION_COMPLETED", "SUBSIDY_CREDITED"].includes(stage) },
                        subsidy: { status: ["SUBSIDY_CREDITED"].includes(stage) }
                    };
                }

                let stepperHTML = `<div class="mt-5 space-y-0 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">`;
                const executionSteps = journeyMilestones.slice(5); 

                executionSteps.forEach((step, index) => {
                    const isComplete = timeline[step.dbKey]?.status === true;
                    const isPrevComplete = index === 0 ? true : timeline[executionSteps[index - 1].dbKey]?.status === true;
                    const isActive = !isComplete && isPrevComplete;

                    stepperHTML += `
                        <div class="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group mb-6">
                            <div class="flex items-center justify-center w-10 h-10 rounded-full border-2 ${isComplete ? 'border-emerald-500 bg-emerald-100 text-emerald-600' : isActive ? 'border-indigo-500 bg-indigo-50 text-indigo-600' : 'border-slate-200 bg-slate-50 text-slate-400'} shrink-0 z-10 shadow-sm transition-colors duration-300">
                                ${isComplete ? '✓' : index + 1}
                            </div>
                            
                            <div class="w-[calc(100%-4rem)] p-4 rounded-xl border ${isActive ? 'border-indigo-200 bg-indigo-50/30' : 'border-slate-100 bg-white'} shadow-sm transition-all duration-300">
                                <h4 class="text-sm font-bold ${isActive ? 'text-indigo-900' : 'text-slate-800'}">${step.title}</h4>
                                <p class="text-xs text-slate-500 mt-1">${step.desc}</p>
                                
                                ${isActive ? `
                                    <button onclick="advanceTimelineMilestone('${step.dbKey}', '${step.triggersStage}')" 
                                            class="mt-3 text-xs bg-indigo-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-indigo-700 transition shadow-sm">
                                        ${step.actionBtn}
                                    </button>
                                ` : ''}
                            </div>
                        </div>
                    `;
                });

                stepperHTML += `</div>`;

                uploadSection.innerHTML = `
                    <div class="bg-emerald-50 border border-emerald-200/80 rounded-2xl p-5 shadow-sm mb-5">
                        <div class="flex items-center gap-3">
                            <div class="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-xl shrink-0">✅</div>
                            <div>
                                <h3 class="text-base font-bold text-emerald-900">Quotation Approved</h3>
                                <p class="text-xs text-emerald-700 mt-0.5">Your quotation has passed our technical audit. Track your deployment below.</p>
                            </div>
                        </div>
                    </div>
                    ${stepperHTML}
                `;
            } else {
                // 🔵 UPLOAD / REJECTED STATE (SURVEY_COMPLETED, OFFER_GIVEN, OFFER_REJECTED)
                const rejectionBanner = stage === "OFFER_REJECTED" ? `
                    <div class="bg-red-50 border border-red-200 rounded-xl p-3.5 mb-5 flex gap-2.5">
                        <span class="text-red-600 text-sm mt-0.5">❌</span>
                        <div class="text-xs text-red-900">
                            <strong class="font-bold">Quotation Rejected:</strong> The previously uploaded document did not pass our verification criteria. Please upload a revised or updated quotation from your installer.
                        </div>
                    </div>
                ` : "";

                uploadSection.innerHTML = `
                    <div class="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 shadow-sm">
                        <div class="flex items-start gap-3 mb-4">
                            <div class="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-xl shrink-0">🛡️</div>
                            <div>
                                <h3 class="text-base font-bold text-slate-900">Solar-AI-Advisor Verification Desk</h3>
                                <p class="text-xs text-slate-500 mt-0.5">Track your installation safely through our platform.</p>
                            </div>
                        </div>
                        
                        ${rejectionBanner}

                        <div class="space-y-2.5 mb-5 bg-white border border-slate-100 rounded-xl p-3.5">
                            <div class="flex items-start gap-2.5 text-xs text-slate-600">
                                <span class="text-emerald-500 font-bold mt-0.5">✓</span>
                                <span><strong>Quote & Component Review:</strong> Our team audits your official quotation to verify that the proposed components meet Tier-1 ALMM guidelines on paper, helping you avoid substandard equipment.</span>
                            </div>
                            <div class="flex items-start gap-2.5 text-xs text-slate-600">
                                <span class="text-emerald-500 font-bold mt-0.5">✓</span>
                                <span><strong>Subsidy Compliance Guidance:</strong> We provide paperwork checklists and guidance aligned with PM Surya Ghar portal requirements to help streamline your Discom application process.</span>
                            </div>
                        </div>

                        <div class="bg-amber-50/70 border border-amber-200/60 rounded-xl p-3.5 mb-5">
                            <div class="flex gap-2.5">
                                <span class="text-amber-600 text-sm mt-0.5">⚠️</span>
                                <div class="text-xs text-amber-900 leading-relaxed">
                                    <strong class="font-bold text-amber-950">Important Notice:</strong> 
                                    Upload your final quotation here to activate our platform tracking. If you choose to deal with platform-matched installers offline, <strong>Solar-AI-Advisor</strong> cannot provide vendor dispute resolution, escalation support, or backend subsidy assistance. 
                                </div>
                            </div>
                        </div>

                        <label class="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                            Upload Installer Quotation / Final Bill
                        </label>
                        <div class="flex flex-col sm:flex-row gap-3">
                            <input type="file" id="quoteUpload" accept="application/pdf,image/*" 
                                   class="block w-full text-xs text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-slate-900 file:text-white hover:file:bg-slate-850 cursor-pointer border border-slate-200 rounded-xl bg-white focus:outline-none" />
                            <button id="uploadQuoteBtn" onclick="uploadQuote()" 
                                    class="bg-indigo-600 text-white text-xs px-5 py-2.5 rounded-xl font-semibold hover:bg-indigo-700 transition shadow-sm shrink-0">
                                Submit for Verification
                            </button>
                        </div>
                    </div>
                `;
            }
        }
    }

    // 🛠️ 3. Ensure the Unlock AI button stays locked during the new stages
    const unlockBtn = document.getElementById('unlockAiBtn') || document.querySelector('button[onclick="showForm()"]');
    if (unlockBtn) {
        // Appended new stages to the lock array
        const lockedStages = ["SURVEY_REQUESTED", "SURVEY_COMPLETED", "OFFER_GIVEN", "OFFER_REJECTED", "OFFER_UNDER_REVIEW", "OFFER_ACCEPTED", "AGREEMENT_SIGNED", "NET_METERING_APPLIED", "INSTALLATION_COMPLETED", "SUBSIDY_CREDITED"];
        const isLocked = lockedStages.includes(stage);
        
        unlockBtn.disabled = isLocked;
        if (isLocked) {
            unlockBtn.innerText = "AI Analysis Locked";
            unlockBtn.classList.add("opacity-50", "cursor-not-allowed");
            unlockBtn.classList.remove("hover:bg-indigo-700", "hover:-translate-y-0.5");
        } else {
            unlockBtn.innerText = "Unlock My AI Solar Analysis";
            unlockBtn.classList.remove("opacity-50", "cursor-not-allowed");
            unlockBtn.classList.add("hover:bg-indigo-700", "hover:-translate-y-0.5");
        }
    }

    // Toggle Survey & Concierge UI based on stage
    const conciergeCard = document.getElementById("conciergeCard");
    const surveyFeedbackCard = document.getElementById("surveyFeedbackCard");
    
    if (conciergeCard && surveyFeedbackCard) {
        if (stage === "AI_GENERATED" || stage === "INITIAL") {
            conciergeCard.classList.remove("hidden");
            surveyFeedbackCard.classList.add("hidden");
        } else if (stage === "SURVEY_REQUESTED") {
            conciergeCard.classList.add("hidden");
            surveyFeedbackCard.classList.remove("hidden");
            
            if (localStorage.getItem("surveyIssueReported") === "true") {
                surveyFeedbackCard.innerHTML = `
                    <div class="flex items-center gap-3 mb-3">
                        <div class="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-xl">⏳</div>
                        <h3 class="text-xl font-bold text-slate-900">Survey Delayed</h3>
                    </div>
                    <p class="text-slate-600 text-sm leading-relaxed mb-4">
                        You reported a delay. Our support team is actively following up with the installer to expedite your site assessment.
                    </p>
                    <div class="border-t border-slate-100 pt-3 mt-2 flex items-center justify-between gap-4 flex-wrap">
                        <span class="text-xs text-slate-500 font-medium">Did the installer arrive?</span>
                        <button id="surveyResolveBtn" onclick="reportSurveyStatus('completed')" 
                                class="bg-emerald-600 text-white text-xs px-3.5 py-2 rounded-xl font-semibold hover:bg-emerald-700 transition shadow-sm">
                            Yes, Survey Completed
                        </button>
                    </div>
                `;
            }
        } else {
            conciergeCard.classList.add("hidden");
            surveyFeedbackCard.classList.add("hidden");
        }
    }
}

async function uploadQuote() {
    const fileInput = document.getElementById('quoteUpload');
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
            stage: "OFFER_UNDER_REVIEW" 
        });
        
        alert("Quote submitted for verification!");
        localStorage.setItem("leadStage", "OFFER_UNDER_REVIEW");
        location.reload(); 
    } catch (error) {
        console.error("Upload failed:", error);
        alert("Upload failed. Please try again.");
    }
}

// ===============================
// 🔹 SURVEY FEEDBACK SYSTEM
// ===============================
async function reportSurveyStatus(status) {
    const leadId = localStorage.getItem("leadId");
    if (!leadId) return;
    
    const btnYes = document.getElementById("surveyYesBtn");
    const btnNo = document.getElementById("surveyNoBtn");
    const btnResolve = document.getElementById("surveyResolveBtn");
    if (btnYes) btnYes.disabled = true;
    if (btnNo) btnNo.disabled = true;
    if (btnResolve) {
        btnResolve.disabled = true;
        btnResolve.innerText = "Updating...";
    }

    try {
        if (status === 'completed') {
            await db.collection("leads").doc(leadId).update({ stage: "SURVEY_COMPLETED" });
            await db.collection("survey_requests").doc(leadId).update({ status: "completed" });
            
            localStorage.removeItem("surveyIssueReported");
            localStorage.setItem("leadStage", "SURVEY_COMPLETED");
            
            alert("Thank you! Your survey is marked as complete. Please upload installer proposal for our review and confirmation.");
        } else {
            await db.collection("survey_requests").doc(leadId).update({ status: "issue_reported" });
            localStorage.setItem("surveyIssueReported", "true");
            alert("Thanks for letting us know. Our support team has been notified and will contact you to resolve the delay.");
        }
        location.reload(); 
    } catch (error) {
        console.error("Error reporting survey status:", error);
        alert("Failed to update status: " + error.message); 
        if (btnYes) btnYes.disabled = false;
        if (btnNo) btnNo.disabled = false;
        if (btnResolve) {
            btnResolve.disabled = false;
            btnResolve.innerText = "Yes, Survey Completed";
        }
    }
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
  const currentStage = localStorage.getItem("leadStage") || "INITIAL";
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
// 🔹 AUXILIARY FUNCTIONS
// ===============================
function showForm() {
  const form = document.getElementById("leadForm");
  if (form) {
    form.classList.remove("hidden");
    form.scrollIntoView({ behavior: "smooth", block: "start" });
  } else {
    console.warn("leadForm not found");
  }
}

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

async function submitLead() {
  const currentStage = (localStorage.getItem("leadStage") || "").toUpperCase();

  if (currentStage && currentStage !== "INITIAL" && currentStage !== "AI_GENERATED") {
      alert("Analysis report is locked. You have already requested a site survey.");
      return;
  }
  
  const submitBtn = document.querySelector("#leadForm button");
  submitBtn.disabled = true;
  submitBtn.innerText = "Generating AI Analysis...";
  
  const name = document.getElementById("capturedName")?.value.trim() || "Homeowner";
  const cityDropdown = document.getElementById("resCity");
  const cityInput = document.getElementById("capturedCity");
  const city = (cityDropdown && cityDropdown.value) ? cityDropdown.value : cityInput?.value?.trim();

  const billValue = document.getElementById("capturedBill")?.value;
  const bill = parseFloat(billValue || getBillFromURL());
  
  const propertyType = document.getElementById("propertyType")?.value;
  const roofType = document.getElementById("roofType")?.value;
  const rooftopOwnership = document.getElementById("rooftopOwnership")?.value;
  const connectionType = document.getElementById("connectionType")?.value;
  const billFile = document.getElementById("billUpload")?.files?.[0];

  if (!city || city === "" || city === "Select City") { 
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
  
  const selectedState = document.getElementById("resState")?.value || 
                        localStorage.getItem("state") || 
                        "UP";
  
  const result = calculateSolar(bill, selectedState);
  renderResults(result, bill);
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
    timeline: {
        aiGenerated: { status: true, timestamp: firebase.firestore.FieldValue.serverTimestamp() },
        surveyRequested: { status: false, timestamp: null },
        surveyCompleted: { status: false, timestamp: null },
        offerUploaded: { status: false, timestamp: null },
        offerAccepted: { status: false, timestamp: null },
        agreementSigned: { status: false, timestamp: null },
        netMetering: { status: false, timestamp: null },
        installation: { status: false, timestamp: null },
        subsidy: { status: false, timestamp: null }
    },
      aiRegenerationRequired: true,
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
    localStorage.setItem("leadStage", "AI_GENERATED");
    updateRoadmap("AI_GENERATED");
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

function setupEditableInputs() {
  const billInput = document.getElementById("capturedBill");
  const cityInput = document.getElementById("capturedCity");
  const nameInput = document.getElementById("capturedName");
  
  if (!billInput) return;

  function updateUIDisplay() {
    const newBill = parseFloat(billInput.value) || 0;
    const cityDropdown = document.getElementById("resCity");
    const newCity = cityDropdown?.value || ""; 
    const newName = nameInput?.value?.trim() || "";
    const currentState = document.getElementById("resState")?.value || "UP";

    const params = new URLSearchParams(window.location.search);
    params.set("bill", newBill);
    params.set("state", currentState); 
    if (newCity) params.set("city", newCity);
    if (newName) params.set("name", newName);
    history.replaceState({}, "", `${window.location.pathname}?${params.toString()}`);

    const result = calculateSolar(newBill, currentState); 
    renderResults(result, newBill);
  }

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


/***
// =========================================================================
// 🛡️ PLATFORM BOUNDARY & LIABILITY MODAL
// =========================================================================
async function requestSiteSurvey(e) {
  // Safe extraction of trigger element from explicit passed parameter or global context fallback
  let btn = null;
  if (e && e.target) {
      btn = e.target.closest('button');
  } else if (typeof event !== 'undefined' && event?.target) {
      btn = event.target.closest('button');
  }
  
  if (!btn) {
      btn = document.getElementById('requestSurveyBtn') || document.querySelector('.survey-trigger-main'); 
  }

  const leadId = localStorage.getItem("leadId");
  const leadCode = localStorage.getItem("leadCode");
  
  if (!leadId) {
    alert("Lead ID not found. Please refresh the page.");
    return;
  }

  if (document.getElementById('surveyLegalModal')) return;

  const modal = document.createElement('div');
  modal.id = 'surveyLegalModal';
  modal.className = 'fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fade-in';
  
  modal.innerHTML = `
    <div class="bg-white border border-slate-200/60 rounded-2xl max-w-md w-full p-5 shadow-2xl transform transition-all scale-100">
        <div class="flex items-center gap-3 mb-3.5">
            <div class="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-xl shrink-0">🛡️</div>
            <div>
                <h3 class="text-base font-bold text-slate-900">Platform Scope Acknowledgement</h3>
                <p class="text-[11px] text-slate-500">Please review before scheduling your physical site survey.</p>
            </div>
        </div>
        <div class="bg-slate-50 border border-slate-100 rounded-xl p-3.5 mb-4 text-xs text-slate-600 leading-relaxed space-y-2">
            <p>By booking this site assessment, you acknowledge that <span class="font-semibold text-slate-900">Solar-AI-Advisor</span> acts exclusively as an independent discovery and technical verification advisory service.</p>
            <p>All physical structural engineering, field execution, material guarantees (Tier-1 ALMM panels), and central/state subsidy processing remain the direct commercial and legal liability of your chosen vendor and respective Discom utilities.</p>
        </div>
        <div class="flex items-center gap-2.5 justify-end">
            <button id="closeSurveyModalBtn" class="text-xs font-semibold text-slate-500 hover:text-slate-700 px-4 py-2.5 rounded-xl border border-slate-200 bg-white transition cursor-pointer">Go Back</button>
            <button id="confirmSurveyModalBtn" class="bg-indigo-600 text-white text-xs px-4 py-2.5 rounded-xl font-semibold hover:bg-indigo-700 transition shadow-sm cursor-pointer">Agree & Schedule Survey</button>
        </div>
    </div>
  `;

  document.body.appendChild(modal);

  document.getElementById('closeSurveyModalBtn').onclick = () => { modal.remove(); };

  document.getElementById('confirmSurveyModalBtn').onclick = async () => {
      modal.remove(); 
      
      if (btn) {
          btn.disabled = true;
          btn.innerText = "Requesting...";
          btn.classList.add("opacity-50", "cursor-not-allowed");
      }

      try {
        const batch = db.batch();
        const leadRef = db.collection("leads").doc(leadId);
        const surveyRef = db.collection("survey_requests").doc(leadId);

        batch.update(leadRef, { 
          stage: "SURVEY_REQUESTED",
          scopeTermsAgreedAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        batch.set(surveyRef, {
          leadId: leadId,
          leadCode: leadCode || "N/A",
          phone: document.getElementById("capturedPhone")?.value || "N/A",
          status: "pending",
          requestedAt: firebase.firestore.FieldValue.serverTimestamp(),
          requestedCity: document.getElementById("resCity")?.value || "Unknown",
          clientName: document.getElementById("capturedName")?.value || "Homeowner"
        });

        await batch.commit();

        localStorage.setItem("leadStage", "SURVEY_REQUESTED"); 
        updateRoadmap("SURVEY_REQUESTED"); 
        
        if (btn) {
            btn.innerText = "✓ Request Submitted";
            btn.classList.replace("bg-indigo-600", "bg-emerald-500");
            
            const successMsg = document.createElement("p");
            successMsg.className = "text-emerald-600 text-sm mt-3 font-medium text-center animate-fade-in";
            successMsg.innerText = "Our team will contact you within 24 hours to schedule your survey.";
            btn.parentNode.appendChild(successMsg);
        }
        
      } catch (error) {
        console.error("Survey request failed:", error);
        alert("Request failed. Please try again.");
        if (btn) {
            btn.innerText = "Try Again";
            btn.disabled = false;
            btn.classList.remove("opacity-50");
        }
      }
  };
}
***/

// =========================================================================
// 🛡️ AUTHENTICATED SURVEY REQUEST FLOW
// =========================================================================
let otpAttempts = 0;
const MAX_OTP_ATTEMPTS = 3;

async function requestSiteSurvey() {
    const leadId = localStorage.getItem("leadId");
    const phone = document.getElementById("capturedPhone")?.value;

    if (!leadId || !phone) {
        alert("Lead information missing. Please complete the form.");
        return;
    }

    // 1. Show OTP Modal
    const modal = document.createElement('div');
    modal.id = 'authModal';
    modal.className = 'fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4';
    
    modal.innerHTML = `
        <div class="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl">
            <h3 class="text-lg font-bold mb-2">Verify to Join Queue</h3>
            <p class="text-sm text-slate-500 mb-4">Enter the OTP sent to ${phone}</p>
            <input type="text" id="otpInput" maxlength="6" class="w-full p-3 border rounded-xl mb-4 text-center text-xl tracking-widest" placeholder="000000">
            
            <div class="flex gap-2 mb-4">
                <button id="verifyOtpBtn" class="flex-1 bg-indigo-600 text-white py-2.5 rounded-xl font-semibold">Verify</button>
                <button id="resendOtpBtn" disabled class="px-4 py-2.5 rounded-xl border font-semibold text-slate-400">Resend (30s)</button>
            </div>
            <p id="attemptCounter" class="text-xs text-center text-slate-400">Attempts: ${otpAttempts}/3</p>
        </div>
    `;
    document.body.appendChild(modal);

    // 2. Start Timer Logic
    startResendTimer();

    // 3. OTP Verification Handler
    document.getElementById('verifyOtpBtn').onclick = async () => {
        const otp = document.getElementById('otpInput').value;
        otpAttempts++;
        
        if (otpAttempts >= MAX_OTP_ATTEMPTS) {
            alert("Maximum attempts reached. Please contact our OPS team via WhatsApp for manual verification.");
            window.open("https://wa.me/61404166347?text=Hi, I am having trouble with OTP authentication.", "_blank");
            modal.remove();
            return;
        }

        try {
            // Firebase Auth Logic (Standard confirmCode integration)
            // await window.confirmationResult.confirm(otp);
            
            // On Success: Transition to PIN Setup
            showPinSetupModal(modal); 
        } catch (e) {
            document.getElementById('attemptCounter').innerText = `Attempts: ${otpAttempts}/3 - Invalid Code`;
        }
    };
}

// 4. Set 4-Digit PIN Setup
function showPinSetupModal(previousModal) {
    previousModal.innerHTML = `
        <div class="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl">
            <h3 class="text-lg font-bold mb-2">Set Security PIN</h3>
            <p class="text-sm text-slate-500 mb-4">Set a 4-digit PIN for future logins.</p>
            <input type="password" id="pinInput" maxlength="4" class="w-full p-3 border rounded-xl mb-4 text-center text-2xl tracking-[1em]" placeholder="****">
            <button id="savePinBtn" class="w-full bg-emerald-600 text-white py-3 rounded-xl font-bold">Set PIN & Submit</button>
        </div>
    `;

    document.getElementById('savePinBtn').onclick = async () => {
        const pin = document.getElementById('pinInput').value;
        if (pin.length !== 4) return alert("PIN must be 4 digits");
        
        // Save PIN to Firebase and finalize Survey Request
        await db.collection("leads").doc(localStorage.getItem("leadId")).update({
            pin: pin,
            stage: "SURVEY_REQUESTED"
        });
        
        previousModal.remove();
        location.reload();
    };
}

function startResendTimer() {
    let timeLeft = 30;
    const btn = document.getElementById('resendOtpBtn');
    const interval = setInterval(() => {
        timeLeft--;
        btn.innerText = `Resend (${timeLeft}s)`;
        if (timeLeft <= 0) {
            clearInterval(interval);
            btn.disabled = false;
            btn.className = "px-4 py-2.5 rounded-xl border font-semibold text-indigo-600 hover:bg-indigo-50";
            btn.innerText = "Resend OTP";
        }
    }, 1000);
}

function renderDynamicAIReport(report, result) {
  document.getElementById("aiLoadingState")?.classList.add("hidden");

  const conciergeCard = document.getElementById("conciergeCard");
  const installerSection = document.getElementById("installerSection");
  const currentStage = localStorage.getItem("leadStage") || "INITIAL";

  if (conciergeCard && installerSection) {
    if (report.matchedInstallers && report.matchedInstallers.length > 0) {
      conciergeCard.classList.add("hidden");
      installerSection.classList.remove("hidden");
      renderInstallerCards(report.matchedInstallers);
    } else {
      if (currentStage === "AI_GENERATED" || currentStage === "INITIAL") {
          conciergeCard.classList.remove("hidden");
      } else {
          conciergeCard.classList.add("hidden");
      }
      installerSection.classList.add("hidden");
    }
  } else {
    console.warn("Skipping layout toggle: 'conciergeCard' or 'installerSection' is missing from DOM.");
    if (report.matchedInstallers && report.matchedInstallers.length > 0) {
      renderInstallerCards(report.matchedInstallers);
    }
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
 
  if (currentStage === "INITIAL" || currentStage === "AI_GENERATED") {
    requestAnimationFrame(() => {
      const aiSection = document.getElementById("aiInsightsSection");
      if (!aiSection) return;
      const y = aiSection.getBoundingClientRect().top + window.pageYOffset - 24;
      window.scrollTo({ top: y, behavior: "smooth" });
    });
  }
}

function renderDetailedTimelineLogs(data) {
    const currentLocalStage = localStorage.getItem("previousObservedStage");
    if (currentLocalStage === "OFFER_UNDER_REVIEW" && data.stage === "OFFER_ACCEPTED") {
        document.getElementById('quoteUploadSection')?.scrollIntoView({ behavior: 'smooth' });
    }
    localStorage.setItem("previousObservedStage", data.stage || "INITIAL");
}

// ===============================
// 🔹 INITIALIZATION
// ===============================
document.addEventListener("DOMContentLoaded", async () => {
    const leadId = localStorage.getItem("leadId");

    if (leadId) {
        // 1. Setup real-time listeners for timeline updates
        if (typeof setupRealTimeTimeline === "function") {
            setupRealTimeTimeline(leadId);
        }

        try {
            // 2. Fetch the master lead doc to verify current state
            const leadDoc = await db.collection("leads").doc(leadId).get();
            if (leadDoc.exists) {
                const leadData = leadDoc.data();
                
                // 3. Lock out the AI Generation Form if already processed
                const currentStage = leadData.stage || "INITIAL";
                if (currentStage !== "INITIAL") {
                    const formContainer = document.getElementById("leadForm");
                    if (formContainer) {
                        formContainer.classList.add("hidden"); // Hide form completely
                    }
                }
                
                // Keep local storage synced with DB truth
                localStorage.setItem("leadStage", currentStage);
                updateRoadmap(currentStage, leadData);
            }

            // 4. Fetch AI Report Cache
            const aiDoc = await db.collection("ai_reports").doc(leadId).get();
            if (aiDoc.exists) {
                aiReportCache = aiDoc.data();
            }
        } catch (err) {
            console.error("Error syncing platform state:", err);
        }
    }

    setupBillUpload();
    populateCapturedData();
    setupEditableInputs();

    const initialState = localStorage.getItem("state") || "UP";
    
    if (typeof LocationHandler !== "undefined" && LocationHandler.init) {
        await LocationHandler.init("resState", "resCity", (newState) => {
            localStorage.setItem("state", newState); 
            calculateSavings(); 
        }, initialState);
    }

    const initialResult = calculateSavings(); 
    if (aiReportCache && initialResult) {
         renderDynamicAIReport(aiReportCache, initialResult);
    }
});


function calculateSavings() {
    const billInput = document.getElementById("capturedBill");
    const stateEl = document.getElementById("resState");
    
    let bill = parseFloat(billInput?.value) || parseFloat(localStorage.getItem("bill")) || getBillFromURL() || 0;
    let state = stateEl?.value || localStorage.getItem("state") || "UP";
    
    if (bill > 0) {
        localStorage.setItem("bill", bill);
        localStorage.setItem("state", state);

        console.log(`Rendering for: Bill ${bill}, State ${state}`);
        const result = calculateSolar(bill, state);
        renderResults(result, bill);
        return result; 
    } else {
        console.log("Waiting for user input...");
        return null;
    }
}

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

async function advanceTimelineMilestone(milestoneKey, macroStageToTrigger = null) {
    const leadId = localStorage.getItem("leadId");
    if (!leadId) return;

    try {
        const updatePayload = {
            [`timeline.${milestoneKey}.status`]: true,
            [`timeline.${milestoneKey}.timestamp`]: firebase.firestore.FieldValue.serverTimestamp()
        };

        // If this step dictates a macro stage change (for your horizontal progress bar)
        if (macroStageToTrigger) {
            updatePayload.stage = macroStageToTrigger;
        }

        await db.collection("leads").doc(leadId).update(updatePayload);
        
        // Let the setupRealTimeTimeline listener handle the UI reload!
        console.log(`Milestone ${milestoneKey} advanced successfully.`);

    } catch (error) {
        console.error("Failed to update milestone:", error);
        alert("Update failed. Please try again.");
    }
}

function renderInstallerCards(installers) {
    const container = document.getElementById("installerListContainer");
    if (!container) {
        console.error("Target container 'installerListContainer' missing from DOM.");
        return;
    }
    container.innerHTML = ""; 

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
