function getBillFromURL() {
  const params = new URLSearchParams(window.location.search);
  return parseFloat(params.get("bill"));
}

function calculateSolar(bill) {
  const units = bill / 7;
  const systemSize = units / 120;

  const costPerKW = 55000;
  const totalCost = systemSize * costPerKW;

  let subsidy = systemSize <= 3 
    ? systemSize * 18000 
    : 54000;

  const finalCost = totalCost - subsidy;
  const monthlySavings = units * 7;
  const payback = finalCost / (monthlySavings * 12);

  const panels = Math.round(systemSize * 3);
  const area = Math.round(systemSize * 75);
  const lifetimeSavings = Math.round(monthlySavings * 12 * 25);

  return {
    systemSize: systemSize.toFixed(1),
    totalCost: Math.round(totalCost),
    subsidy: Math.round(subsidy),
    finalCost: Math.round(finalCost),
    monthlySavings: Math.round(monthlySavings),
    payback: payback.toFixed(1),
    panels,
    area,
    lifetimeSavings
  };
}

function renderResults(data, bill) {
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
}

function showForm() {
  document.getElementById("leadForm").classList.remove("hidden");
}

// 🔥 FINAL LEAD SCORING
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

// ✅ WhatsApp (unchanged)
function openWhatsApp() {
  const bill = getBillFromURL();
  const result = calculateSolar(bill);

  const message = `Hi, I’m interested in installing rooftop solar.

Monthly Bill: ₹${bill}
Recommended System: ${result.systemSize} kW
Estimated Cost: ₹${result.finalCost}
Monthly Savings: ₹${result.monthlySavings}
Payback Period: ${result.payback} years`;

  const encodedMessage = encodeURIComponent(message);
  const number = "61404166347";

  window.open(`https://wa.me/${number}?text=${encodedMessage}`, "_blank");
}

// 🔥 UPDATE SAME LEAD (FINAL STEP)
async function submitLead() {
  const propertyType = document.getElementById("propertyType").value;
  const roofType = document.getElementById("roofType").value;
  const rooftopOwnership = document.getElementById("rooftopOwnership").value;
  const connectionType = document.getElementById("connectionType").value;
  const billFile = document.getElementById("billUpload").files[0];

  const leadId = localStorage.getItem("leadId");

  if (!leadId) {
    alert("Lead ID not found");
    return;
  }

  // 🔍 Safety checks (NEW - minimal but important)
  if (typeof firebase === "undefined" || typeof db === "undefined") {
    alert("Database not initialized");
    return;
  }

  const bill = parseFloat(getBillFromURL());
  const leadType = getLeadType(bill, propertyType, rooftopOwnership);

  try {
    await db.collection("leads").doc(leadId).update({
      propertyType: propertyType,
      roofType: roofType,
      rooftopOwnership: rooftopOwnership,
      connectionType: connectionType,
      billUploaded: billFile ? "Yes" : "No",

      // 🔥 Business updates
      leadType: leadType,
      stage: "qualified",

      updatedAt: new Date()
    });

    console.log("✅ Lead updated successfully");

  } catch (error) {
    console.error("❌ Update failed:", error);
    alert("Error updating lead");
    return;
  }

  document.getElementById("leadForm").classList.add("hidden");
  document.getElementById("submitSuccess").classList.remove("hidden");

  window.scrollTo({ top: 20, behavior: "smooth" });
}

// 🔧 File upload UI (unchanged)
function setupBillUpload() {
  const uploadArea = document.getElementById("billUploadArea");
  const fileInput = document.getElementById("billUpload");
  const fileNameDisplay = document.getElementById("billFileName");

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

// 🔧 Populate captured data (unchanged)
function populateCapturedData() {
  const params = new URLSearchParams(window.location.search);

  document.getElementById("capturedName").value = params.get("name") || "";
  document.getElementById("capturedPhone").value = params.get("phone") || "";
  document.getElementById("capturedCity").value = params.get("city") || "";
  document.getElementById("capturedBill").value = "₹" + (params.get("bill") || "");
}

// 🔥 INIT (unchanged)
const bill = getBillFromURL();

if (bill) {
  const result = calculateSolar(bill);
  renderResults(result, bill);
  setupBillUpload();
  populateCapturedData();
} else {
  document.body.innerHTML = "Invalid Input";
}