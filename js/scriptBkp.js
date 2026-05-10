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
  
  // Strict regex: Letters only for name, proper format for email
  const nameRegex = /^[A-Za-z\s]+$/; 
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const phoneRegex = /^[6-9]\d{9}$/;

  const fields = {
    name: { input: prefix + 'Name', error: prefix === 'cons' ? 'consNameError' : 'nameError' },
    email: { input: prefix + 'Email', error: prefix === 'cons' ? 'consEmailError' : 'emailError' },
    phone: { input: prefix + 'Phone', error: prefix === 'cons' ? 'consPhoneError' : 'phoneError' },
    city: { input: prefix + 'City', error: prefix === 'cons' ? 'consCityError' : 'cityError' }
  };

  Object.values(fields).forEach(f => clearError(f.input, f.error));

  if (!nameRegex.test(name) || name.trim().length < 2) {
    showError(fields.name.input, fields.name.error, "Enter valid name (letters only)");
    isValid = false;
  }

  if (!emailRegex.test(email)) {
    showError(fields.email.input, fields.email.error, "Enter valid email (e.g. name@gmail.com)");
    isValid = false;
  }

  const normalizedPhone = normalizePhone(phone);
  if (!phoneRegex.test(normalizedPhone)) {
    showError(fields.phone.input, fields.phone.error, "Enter valid 10-digit mobile");
    isValid = false;
  }

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

  // 🔥 THIS WAS LIKELY MISSING OR BROKEN
  const validation = validateForm("cons", name, email, phoneInput, city);
  if (!validation.isValid) return; 

  const submitBtn = document.getElementById("consSubmitBtn");
  submitBtn.disabled = true;
  submitBtn.innerText = "Processing...";

  try {
    await db.collection("consultations").add({
      name: name,
      email: email, // Now guaranteed to be valid
      phone: validation.normalizedPhone,
      city: city,
      source: "Free Consultation Popup",
      status: "New",
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });

    document.getElementById("consFormContainer").classList.add("hidden");
    document.getElementById("consSuccessMsg").classList.remove("hidden");
    setTimeout(closeConsultation, 3000);

  } catch (e) {
    console.error("Error:", e);
    alert("Submission failed. Please try again.");
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

  // Firebase Init
  const firebaseConfig = {
    apiKey: "AIzaSyAUBwx-i38T6rfr9lsNYUV6bLOpxvdPfjQ",
    authDomain: "solar-ai-advisor-6e70c.firebaseapp.com",
    projectId: "solar-ai-advisor-6e70c",
    storageBucket: "solar-ai-advisor-6e70c.firebasestorage.app",
    messagingSenderId: "414713467470",
    appId: "1:414713467470:web:437d1cf23454d472c7e91f"
  };

  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  }

  const db = firebase.firestore();

  // HERO CALCULATION
  function handleHeroCalculate() {

    const billInput = document.getElementById("billInput");
    const stateInput = document.getElementById("state");

    const billValue = billInput.value;
    const bill = parseFloat(billValue);
    const state = stateInput.value;

    clearError("billInput", "billError");
    clearError("state", "stateHeroError");

    let isValid = true;

    if (!billValue || isNaN(bill) || bill < 500) {
      showError("billInput", "billError", "Min. bill ₹500 required");
      isValid = false;
    }

    if (!state) {
      showError("state", "stateHeroError", "Please select your state");
      isValid = false;
    }

    if (isValid) {

      localStorage.setItem("state", state);
      localStorage.setItem("bill", bill);

      document.getElementById("leadPopup").classList.remove("hidden");
    }
  }
/*
  // UPDATED CONSULTATION SUBMIT (Inside index.html)
  async function handleConsultationSubmit() {
    const name = document.getElementById('consName').value.trim();
    const email = document.getElementById('consEmail').value.trim(); // Added this
    const phoneInput = document.getElementById('consPhone').value.trim();
    const city = document.getElementById('consCity').value.trim();

    const submitBtn = document.getElementById("consSubmitBtn");

    // Clear previous errors
    clearError("consName", "consNameError");
    clearError("consEmail", "consEmailError"); // Added this
    clearError("consPhone", "consPhoneError");
    clearError("consCity", "consCityError");

    let isValid = true;

    // 1. Strict Name Validation (Matches Leads)
    const nameRegex = /^[A-Za-z\s]+$/;
    if (!nameRegex.test(name) || name.length < 2) {
      showError("consName", "consNameError", "Enter valid name (letters only)");
      isValid = false;
    }

    // 2. Strict Email Validation (Matches Leads)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showError("consEmail", "consEmailError", "Enter valid email (e.g. name@gmail.com)");
      isValid = false;
    }

    // 3. Phone Validation
    const normalizedPhone = normalizePhone(phoneInput);
    if (!/^[6-9]\d{9}$/.test(normalizedPhone)) {
      showError("consPhone", "consPhoneError", "Enter valid 10-digit mobile");
      isValid = false;
    }

    // 4. City Validation
    if (city.length < 2) {
      showError("consCity", "consCityError", "Enter your city");
      isValid = false;
    }

    if (!isValid) return;

    submitBtn.disabled = true;
    submitBtn.innerText = "Processing...";

    try {
      await db.collection("consultations").add({
        name: name,
        email: email, // Now saving the email!
        phone: normalizedPhone,
        city: city,
        source: "Free Consultation Popup",
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });

      // Show success state
      document.getElementById("consFormContainer").classList.add("hidden");
      document.getElementById("consSuccessMsg").classList.remove("hidden");
      
      // Auto-close after 3 seconds
      setTimeout(closeConsultation, 3000);

    } catch (e) {
      console.error("Firebase Error:", e);
      alert("Error saving. Try again.");
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerText = "Request Call Back";
    }
  }
  
  function scrollToTop() {
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  }
  */