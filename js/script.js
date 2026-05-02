function calculate() {
  const billInput = document.getElementById("billInput").value;
  const bill = parseFloat(billInput);

  if (!bill || bill < 500) {
    alert("Enter valid bill");
    return;
  }

  window.currentBill = bill;
  localStorage.setItem("bill", bill);
  document.getElementById("leadPopup").classList.remove("hidden");
}

// 🔥 Lead Scoring Logic
function getLeadType(bill) {
  if (bill >= 3000) return "Premium";
  if (bill >= 1500) return "Hot";
  return "Basic";
}

async function submitLeadAndContinue() {
  console.log("🚀 Submit button clicked");

  const name = document.getElementById("leadName").value;
  const phone = document.getElementById("leadPhone").value;
  const city = document.getElementById("leadCity").value;
  const bill = localStorage.getItem("bill") || window.currentBill;

  if (!name || !phone) {
    alert("Please enter name and phone");
    return;
  }

  // 🔒 Prevent duplicate submission
  if (localStorage.getItem("leadSaved")) {
    console.log("⚠️ Lead already saved, skipping...");
    window.location.href =
      `results.html?bill=${bill}&name=${encodeURIComponent(name)}&phone=${encodeURIComponent(phone)}&city=${encodeURIComponent(city)}`;
    return;
  }

  // 🔍 Safety checks
  if (typeof firebase === "undefined") {
    alert("Firebase not loaded");
    return;
  }

  if (typeof db === "undefined") {
    alert("Database not initialized");
    return;
  }

  try {
    console.log("🔥 Saving lead to Firestore...");

    const leadType = getLeadType(parseFloat(bill));

    const docRef = await db.collection("leads").add({
      name: name,
      phone: phone,
      city: city,
      bill: parseFloat(bill),

      // 🔥 Business fields
      leadType: leadType,
      status: "New",
      stage: "initial",
      leadSource: "Website",

      createdAt: new Date()
    });

    console.log("✅ Lead saved:", docRef.id);

    // Save leadId for step 2
    localStorage.setItem("leadId", docRef.id);
    localStorage.setItem("leadSaved", "true");

  } catch (error) {
    console.error("❌ Firestore ERROR:", error);
    alert("Error saving data. Check console.");
    return;
  }

  // ✅ Redirect to results (NO WhatsApp here)
  window.location.href =
    `results.html?bill=${bill}&name=${encodeURIComponent(name)}&phone=${encodeURIComponent(phone)}&city=${encodeURIComponent(city)}`;
}

// 🔁 Bind button
document.addEventListener("DOMContentLoaded", function () {
  const calculateBtn = document.getElementById("calculateBtn");
  if (calculateBtn) {
    calculateBtn.addEventListener("click", calculate);
  }
});

// 🔝 Scroll helper
function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}