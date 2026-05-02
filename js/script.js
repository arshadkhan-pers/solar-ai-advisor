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

// 🔥 Generate human-readable lead code (safe)
function generateLeadCode(phone) {
  const d = new Date();
  const date = d.toISOString().slice(0,10).replace(/-/g,""); // YYYYMMDD
  const last4 = phone.slice(-4);
  const rand = Math.random().toString(36).slice(2,6).toUpperCase();
  return `SOL-${date}-${last4}-${rand}`;
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
    console.log("🔥 Checking for recent duplicate...");

    // 🔥 DEDUPE CHECK (last 30 mins)
    let duplicateLeadId = null;

    const snapshot = await db.collection("leads")
      .where("phone", "==", phone)
      .orderBy("createdAt", "desc")
      .limit(1)
      .get();

    if (!snapshot.empty) {
      const lastDoc = snapshot.docs[0];
      const lastData = lastDoc.data();
      const lastTime = lastData.createdAt?.toDate?.() || new Date(0);

      const minutesDiff = (Date.now() - lastTime.getTime()) / 60000;

      if (minutesDiff < 30) {
        console.log("⚠️ Duplicate detected within 30 mins");
        duplicateLeadId = lastDoc.id;
      }
    }

    const leadType = getLeadType(parseFloat(bill));
    const leadCode = generateLeadCode(phone);

    console.log("🔥 Saving lead to Firestore...");

    const docRef = await db.collection("leads").add({
      name: name,
      phone: phone,
      city: city,
      bill: parseFloat(bill),

      // 🔥 Business fields
      leadCode: leadCode,
      customerId: phone,              // 🔥 grouping key
      leadType: leadType,
      status: "New",
      stage: "initial",
      leadSource: "Website",

      // 🔥 Dedupe tracking
      duplicateOf: duplicateLeadId || null,

      createdAt: new Date()
    });

    console.log("✅ Lead saved:", docRef.id);

    // Save leadId for step 2
    localStorage.setItem("leadId", docRef.id);

  } catch (error) {
    console.error("❌ Firestore ERROR:", error);
    alert("Error saving data. Check console.");
    return;
  }

  // ✅ Redirect (unchanged)
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