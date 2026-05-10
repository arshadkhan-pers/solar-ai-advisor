<!-- New script.js -->
// ==========================================
// 1. HELPERS & UTILITIES (Preserved)
// ==========================================

function getLeadType(bill) {
  if (bill >= 3000) return "Hot";
  if (bill >= 1500) return "Warm";
  return "Basic";
}

function generateLeadCode(phone) {
  const d = new Date();
  const date = d.toISOString().slice(0, 10).replace(/-/g, "");
  const last4 = phone.slice(-4);
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `SOL-${date}-${last4}-${rand}`;
}

function normalizePhone(phone) {
  phone = phone.replace(/\D/g, "");
  if (phone.startsWith("91") && phone.length === 12) phone = phone.slice(2);
  if (phone.startsWith("0") && phone.length === 11) phone = phone.slice(1);
  return phone;
}

function showError(inputId, errorId, message) {
  const errorEl = document.getElementById(errorId);
  const inputEl = document.getElementById(inputId);
  if (errorEl) errorEl.innerText = message;
  if (inputEl) {
    inputEl.style.borderColor = "#ef4444"; 
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

// ==========================================
// 2. UNIFIED VALIDATION (Updated for Email)
// ==========================================

function validateForm(prefix, name, email, phone, city) {
  let isValid = true;
  
  // 🔥 FIXED REGEX: 
  // Name: Only letters and spaces allowed (no numbers like 'Khan2')
  const nameRegex = /^[A-Za-z\s]+$/; 
  // Email: Must have @ and a domain (fixes the 'asmamoinlko' issue)
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  // Phone: Standard 10-digit check
  const phoneRegex = /^[6-9]\d{9}$/;

  const fields = {
    name: { input: prefix + 'Name', error: prefix === 'cons' ? 'consNameError' : 'nameError' },
    email: { input: prefix + 'Email', error: prefix === 'cons' ? 'consEmailError' : 'emailError' },
    phone: { input: prefix + 'Phone', error: prefix === 'cons' ? 'consPhoneError' : 'phoneError' },
    city: { input: prefix + 'City', error: prefix === 'cons' ? 'consCityError' : 'cityError' }
  };

  // Clear previous errors
  Object.values(fields).forEach(f => clearError(f.input, f.error));

  // 1. Strict Name Check
  if (!name || name.length < 2 || !nameRegex.test(name)) {
    showError(fields.name.input, fields.name.error, "Enter valid name (letters only)");
    isValid = false;
  }

  // 2. Strict Email Check
  if (!email || !emailRegex.test(email)) {
    showError(fields.email.input, fields.email.error, "Enter valid email (e.g. name@gmail.com)");
    isValid = false;
  }

  // 3. Phone Check
  const normalizedPhone = normalizePhone(phone);
  if (!phoneRegex.test(normalizedPhone) || /^(\d)\1{9}$/.test(normalizedPhone)) {
    showError(fields.phone.input, fields.phone.error, "Enter valid 10-digit mobile");
    isValid = false;
  }

  // 4. City Check
  if (!city || city.length < 2) {
    showError(fields.city.input, fields.city.error, "Enter your city");
    isValid = false;
  }

  return { isValid, normalizedPhone };
}

// ==========================================
// 3. CORE FUNCTIONALITY
// ==========================================

function calculate() {
  const billInput = document.getElementById("billInput").value;
  const bill = parseFloat(billInput);
  const state = document.getElementById("state")?.value;

  if (!bill || bill < 500) {
    showError("billInput", "billError", "Min. bill ₹500 required");
    return;
  }

  if (!state) {
    showError("state", "stateHeroError", "Please select your state");
    return;
  }

  localStorage.setItem("state", state);
  window.currentBill = bill;
  localStorage.setItem("bill", bill);

  document.getElementById("leadPopup").classList.remove("hidden");
  loadCities(state);
}

// 🔥 CONSULTATION SUBMIT (With Inline Success)
async function handleConsultationSubmit() {
  const name = document.getElementById('consName').value.trim();
  const email = document.getElementById('consEmail').value.trim();
  const phoneInput = document.getElementById('consPhone').value.trim();
  const city = document.getElementById('consCity').value.trim();
  const submitBtn = document.getElementById("consSubmitBtn");

  const validation = validateForm("cons", name, email, phoneInput, city);
  if (!validation.isValid) return;

  submitBtn.disabled = true;
  submitBtn.innerText = "Processing...";

  try {
    await db.collection("consultations").add({
      name,
      email,
      phone: validation.normalizedPhone,
      city,
      source: "Free Consultation Popup",
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });

    // Inline Success UI
    document.getElementById("consFormContainer").classList.add("hidden");
    document.getElementById("consSuccessMsg").classList.remove("hidden");

    // Close and reset after 3 seconds
    setTimeout(closeConsultation, 3000);

  } catch (e) {
    alert("Error saving. Try again.");
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerText = "Request Call Back";
  }
}

// 🔥 LEAD SUBMIT (With original Deduplication)
async function submitLeadAndContinue() {
  const name = document.getElementById("leadName").value.trim();
  const email = document.getElementById("leadEmail").value.trim();
  const phoneRaw = document.getElementById("leadPhone").value.trim();
  const city = document.getElementById("leadCity").value.trim();
  const bill = localStorage.getItem("bill") || window.currentBill;

  const validation = validateForm("lead", name, email, phoneRaw, city);
  if (!validation.isValid) return;

  const phone = validation.normalizedPhone;

  try {
    // Original Deduplication Logic
    let duplicateLeadId = null;
    const snapshot = await db.collection("leads")
      .where("phone", "==", phone)
      .orderBy("createdAt", "desc")
      .limit(1)
      .get();

    if (!snapshot.empty) {
      const lastDoc = snapshot.docs[0];
      const lastTime = lastDoc.data().createdAt?.toDate?.() || new Date(0);
      const minutesDiff = (Date.now() - lastTime.getTime()) / 60000;
      if (minutesDiff < 30) duplicateLeadId = lastDoc.id;
    }

    const leadType = getLeadType(parseFloat(bill));
    const leadCode = generateLeadCode(phone);

    const docRef = await db.collection("leads").add({
      name,
      email,
      phone,
      city,
      state: localStorage.getItem("state"),
      bill: parseFloat(bill),
      leadCode,
      customerId: phone,
      leadType,
      status: "New",
      stage: "initial",
      leadSource: "Website",
      duplicateOf: duplicateLeadId || null,
      isDuplicate: !!duplicateLeadId,
      createdAt: new Date()
    });

    localStorage.setItem("leadId", docRef.id);
    const state = localStorage.getItem("state");

    window.location.href = `results.html?bill=${bill}&state=${state}&name=${encodeURIComponent(name)}&email=${encodeURIComponent(email)}&phone=${encodeURIComponent(phone)}&city=${encodeURIComponent(city)}`;

  } catch (error) {
    console.error("Firestore Error:", error);
    alert("Error saving data.");
  }
}

// ==========================================
// 4. UI HANDLERS (Preserved)
// ==========================================

function openConsultation() {
  document.getElementById('consultationPopup').classList.remove('hidden');
}

function closeConsultation() {
  document.getElementById('consultationPopup').classList.add('hidden');
  // Reset UI for next open
  setTimeout(() => {
    document.getElementById("consFormContainer").classList.remove("hidden");
    document.getElementById("consSuccessMsg").classList.add("hidden");
    ['consName', 'consEmail', 'consPhone', 'consCity'].forEach(id => {
      document.getElementById(id).value = "";
    });
  }, 500);
}

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function loadCities(state) {
  const datalist = document.getElementById("cityList");
  if (!datalist) return;
  datalist.innerHTML = "";
  const cities = (typeof citiesByState !== "undefined" && citiesByState[state]) ? citiesByState[state] : [];
  cities.forEach(city => {
    const option = document.createElement("option");
    option.value = city;
    datalist.appendChild(option);
  });
}

function sortStates() {
  const select = document.getElementById("state");
  if (!select) return;
  const options = Array.from(select.options);
  const first = options.shift();
  options.sort((a, b) => a.text.localeCompare(b.text));
  select.innerHTML = "";
  select.appendChild(first);
  options.forEach(opt => select.appendChild(opt));
}

// ==========================================
// 5. LIFECYCLE (Preserved & Fixed)
// ==========================================

document.addEventListener("DOMContentLoaded", function () {
  // Ensure popups are hidden on fresh reload
  document.getElementById("leadPopup")?.classList.add("hidden");
  document.getElementById("consultationPopup")?.classList.add("hidden");

  sortStates();
  
  const calculateBtn = document.getElementById("calculateBtn");
  if (calculateBtn) calculateBtn.addEventListener("click", calculate);
  
  const selectedState = localStorage.getItem("state");
  if (selectedState) loadCities(selectedState);
});
