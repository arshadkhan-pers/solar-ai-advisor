function calculate() {
  const billInput = document.getElementById("billInput").value;
  const bill = parseFloat(billInput);
  const state = document.getElementById("state")?.value;

  if (!bill || bill < 500) {
    alert("Enter valid bill");
    return;
  }

  if (!state) {
    alert("Please select your state");
    return;
  }

  localStorage.setItem("state", state);
  window.currentBill = bill;
  localStorage.setItem("bill", bill);

  document.getElementById("leadPopup").classList.remove("hidden");

  const selectedState = localStorage.getItem("state");
  loadCities(selectedState);
}

// 🔥 Lead Scoring Logic
function getLeadType(bill) {
  if (bill >= 3000) return "Hot";
  if (bill >= 1500) return "Warm";
  return "Basic";
}

// 🔥 Generate human-readable lead code (safe)
function generateLeadCode(phone) {
  const d = new Date();
  const date = d.toISOString().slice(0, 10).replace(/-/g, "");
  const last4 = phone.slice(-4);
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `SOL-${date}-${last4}-${rand}`;
}

// 🔥 Normalize phone (NEW)
function normalizePhone(phone) {
  phone = phone.replace(/\D/g, "");

  if (phone.startsWith("91") && phone.length === 12) {
    phone = phone.slice(2);
  }

  if (phone.startsWith("0") && phone.length === 11) {
    phone = phone.slice(1);
  }

  return phone;
}

// 🔥 Updated Inline error helpers to work with Tailwind
function showError(inputId, errorId, message) {
  const errorEl = document.getElementById(errorId);
  const inputEl = document.getElementById(inputId);

  if (errorEl) errorEl.innerText = message;
  if (inputEl) {
    inputEl.style.borderColor = "#ef4444"; // Tailwind red-500
    inputEl.classList.add("bg-red-50");
  }
}

function clearError(inputId, errorId) {
  const errorEl = document.getElementById(errorId);
  const inputEl = document.getElementById(inputId);

  if (errorEl) errorEl.innerText = "";
  if (inputEl) {
    inputEl.style.borderColor = ""; 
    inputEl.classList.remove("bg-red-50");
  }
}

// 🔥 Updated validation (inline + safe fallback)
function validateLeadForm(name, phone, city) {
  let isValid = true;

  const nameRegex = /^[A-Za-z ]{2,}$/;
  const phoneRegex = /^[6-9]\d{9}$/;
  const cityRegex = /^[A-Za-z ]{3,}$/;

  // Clear previous errors (safe if elements not present)
  clearError("leadName", "nameError");
  clearError("leadPhone", "phoneError");
  clearError("leadState", "leadStateError");
  clearError("leadCity", "cityError");
  // Name validation
  if (!nameRegex.test(name)) {
    showError("leadName", "nameError", "Enter valid name");
    isValid = false;
  }

  // Normalize phone before validation
  const normalizedPhone = normalizePhone(phone);

  if (!phoneRegex.test(normalizedPhone)) {
    showError("leadPhone", "phoneError", "Enter valid 10-digit mobile");
    isValid = false;
  }

  // Block fake numbers like 9999999999
  if (/^(\d)\1{9}$/.test(normalizedPhone)) {
    showError("leadPhone", "phoneError", "Invalid mobile number");
    isValid = false;
  }

const leadState = document.getElementById("leadState")?.value;

if (!leadState) {
  showError("leadState", "leadStateError", "Please select state");
  isValid = false;
}

  // City validation
  if (!city || city.length < 2) {
  showError("leadCity", "cityError", "Please select or enter city");
  isValid = false;
}

  return { isValid, phone: normalizedPhone };
}

async function submitLeadAndContinue() {
  console.log("🚀 Submit button clicked");

  const name = document.getElementById("leadName").value.trim();
  let phone = document.getElementById("leadPhone").value.trim();
  const city = document.getElementById("leadCity").value.trim();
  const bill = localStorage.getItem("bill") || window.currentBill;

  const validation = validateLeadForm(name, phone, city);

  if (!validation.isValid) {
    return;
  }

  // 🔥 Use normalized phone everywhere
  phone = validation.phone;

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
      state: localStorage.getItem("state"), // ✅ NEW
      bill: parseFloat(bill),

      // 🔥 Business fields
      leadCode: leadCode,
      customerId: phone,
      leadType: leadType,
      status: "New",
      stage: "initial",
      leadSource: "Website",

      // 🔥 Dedupe tracking
      duplicateOf: duplicateLeadId || null,
      isDuplicate: duplicateLeadId ? true : false,
      createdAt: new Date()
    });

    console.log("✅ Lead saved:", docRef.id);

    localStorage.setItem("leadId", docRef.id);

  } catch (error) {
    console.error("❌ Firestore ERROR:", error);
    alert("Error saving data. Check console.");
    return;
  }

  // ✅ Redirect (unchanged, but uses normalized phone)
  const state = localStorage.getItem("state");
window.location.href =
  `results.html?bill=${bill}&state=${state}&name=${encodeURIComponent(name)}&phone=${encodeURIComponent(phone)}&city=${encodeURIComponent(city)}`;

}

// 🔝 Scroll helper
function scrollToTop() {
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// load cities based on state selection
function loadCities(state) {
  const datalist = document.getElementById("cityList");
  if (!datalist) return;

  datalist.innerHTML = "";

  const cities = (typeof citiesByState !== "undefined" && citiesByState[state]) 
    ? citiesByState[state] 
    : [];

  cities.forEach(city => {
    const option = document.createElement("option");
    option.value = city;
    datalist.appendChild(option);
  });
}

// 🔁 Bind button
document.addEventListener("DOMContentLoaded", function () {
  sortStates();
  
  
  sortStateDropdown("leadState");
  sortStateDropdown("consState");
  const calculateBtn = document.getElementById("calculateBtn");
  if (calculateBtn) {
    calculateBtn.addEventListener("click", calculate);
  }
});

function sortStates() {
  const select = document.getElementById("state");
  if (!select) return;

  const options = Array.from(select.options);

  const first = options.shift(); // keep "Select State"

  options.sort((a, b) => a.text.localeCompare(b.text));

  select.innerHTML = "";
  select.appendChild(first);

  options.forEach(opt => select.appendChild(opt));
}

function sortStateDropdown(id) {

  const select = document.getElementById(id);

  if (!select) return;

  const options = Array.from(select.options);

  const first = options.shift();

  options.sort((a, b) => a.text.localeCompare(b.text));

  select.innerHTML = "";

  select.appendChild(first);

  options.forEach(opt => select.appendChild(opt));
}
