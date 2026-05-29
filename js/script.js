
/* eslint-disable max-len */
const db = window.db;

// ==========================================
// 2. HELPERS & UTILITIES
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

// Maps first two PIN digits to standard 2-letter State Codes
function getStateFromPin(pin) {
  if (!pin || pin.length < 2) return "DL";
  const prefix = parseInt(pin.substring(0, 2));
  if (prefix === 11) return "DL";
  if (prefix >= 12 && prefix <= 13) return "HR";
  if (prefix >= 14 && prefix <= 16) return "PB";
  if (prefix === 17) return "HP";
  if (prefix >= 18 && prefix <= 19) return "JK";
  if (prefix >= 20 && prefix <= 23) return "UP";
  if (prefix >= 24 && prefix <= 28) return "UK"; // Uttarakhand
  if (prefix >= 30 && prefix <= 34) return "RJ";
  if (prefix >= 36 && prefix <= 39) return "GJ";
  if (prefix >= 40 && prefix <= 44) return "MH";
  if (prefix >= 45 && prefix <= 48) return "MP";
  if (prefix === 49) return "CG";
  if (prefix === 50) return "TS";
  if (prefix >= 51 && prefix <= 53) return "AP";
  if (prefix >= 56 && prefix <= 59) return "KA";
  if (prefix >= 60 && prefix <= 64) return "TN";
  if (prefix >= 67 && prefix <= 69) return "KL";
  if (prefix >= 70 && prefix <= 74) return "WB";
  if (prefix >= 75 && prefix <= 77) return "OR";
  if (prefix === 78) return "AS";
  if (prefix === 79) return "AR"; 
  if (prefix >= 80 && prefix <= 85) return "BR";
  return "DL";
}

// ==========================================
// 3. UNIFIED VALIDATION (Name is optional for leads popup)
// ==========================================
function validateForm(prefix, name, email, phone, city) {
  let isValid = true;
  
  const nameRegex = /^[A-Za-z\s]+$/; 
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const phoneRegex = /^[6-9]\d{9}$/;

  const fields = {
    name: { input: prefix + 'Name', error: prefix === 'cons'? 'consNameError' : 'nameError' },
    email: { input: prefix + 'Email', error: prefix === 'cons'? 'consEmailError' : 'emailError' },
    phone: { input: prefix + 'Phone', error: prefix === 'cons'? 'consPhoneError' : 'phoneError' }
  };
  if (prefix === 'cons') {
    fields.city = { input: 'consCity', error: 'consCityError' };
  }

  Object.values(fields).forEach(f => {
    const el = document.getElementById(f.input);
    if (el) clearError(f.input, f.error);
  });

  // Name is optional on leads popup; mandatory for consultations
  if (prefix === 'lead' && name.trim().length === 0) {
    // Optional - skip error checks
  } else if (!nameRegex.test(name) || name.trim().length < 2) {
    showError(fields.name.input, fields.name.error, "Enter valid name (letters only)");
    isValid = false;
  }

  if (email.length > 0 &&!emailRegex.test(email)) {
    showError(fields.email.input, fields.email.error, "Please enter a valid email format");
    isValid = false;
  }
  
  const normalizedPhone = normalizePhone(phone);
  if (!phoneRegex.test(normalizedPhone)) {
    showError(fields.phone.input, fields.phone.error, "Enter valid 10-digit mobile");
    isValid = false;
  }

  // City is only validated for the direct free-consultation callback form
  if (prefix === 'cons') {
    if (!city || city.length < 2) {
      showError(fields.city.input, fields.city.error, "Enter your city");
      isValid = false;
    }
  }

  return { isValid, normalizedPhone };
}


// ==========================================
// 4. CORE FUNCTIONALITY & SUBMISSIONS
// ==========================================
function handleHeroCalculate() {
  const billInput = document.getElementById("billInput");
  const pincodeInput = document.getElementById("pincodeInput");
  const billValue = billInput?.value;
  const bill = parseFloat(billValue);
  const pincodeValue = pincodeInput?.value?.trim();

  clearError("billInput", "billError");
  clearError("pincodeInput", "pincodeError");

  let isValid = true;

  if (!billValue || isNaN(bill) || bill < 500) {
    showError("billInput", "billError", "Min. bill ₹500 required");
    isValid = false;
  }

  const pincodeRegex = /^[1-9][0-9]{5}$/; // Validates standard Indian PIN structure
  if (!pincodeValue ||!pincodeRegex.test(pincodeValue)) {
    showError("pincodeInput", "pincodeError", "Enter valid 6-digit PIN code");
    isValid = false;
  }

  if (isValid) {
    const resolvedState = getStateFromPin(pincodeValue);
    localStorage.setItem("pincode", pincodeValue);
    localStorage.setItem("state", resolvedState);
    window.currentBill = bill;
    localStorage.setItem("bill", bill);

    document.getElementById("leadPopup").classList.remove("hidden");
  }
}

async function handleConsultationSubmit() {
  const name = document.getElementById('consName').value.trim();
  const email = document.getElementById('consEmail').value.trim();
  const phoneInput = document.getElementById('consPhone').value.trim();
  const city = document.getElementById('consCity').value.trim();

  const submitBtn = document.getElementById("consSubmitBtn");

  const validation = validateForm("cons", name, email, phoneInput, city);

  if (!validation.isValid) {
    submitBtn.disabled = false;
    submitBtn.innerText = "Request Call Back";
    return;
  }
  submitBtn.disabled = true;
  submitBtn.innerText = "Processing...";

  try {
    await db.collection("consultations").add({
      name: name,
      email: email, 
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

async function submitLeadAndContinue(event) {
  if (event) event.preventDefault();
  const submitBtn = document.querySelector("#leadPopup button");
  submitBtn.disabled = true;
  submitBtn.innerText = "Processing...";
  
  const name = document.getElementById("leadName").value.trim();
  const email = document.getElementById("leadEmail").value.trim();
  const phoneRaw = document.getElementById("leadPhone").value.trim();
  const bill = localStorage.getItem("bill") || window.currentBill;
  const pincode = localStorage.getItem("pincode") || "";
  
  // City is now handled on the Results page, so we default this to an empty state
  const city = ""; 

  const validation = validateForm("lead", name, email, phoneRaw, city);
  if (!validation.isValid) {
    submitBtn.disabled = false;
    submitBtn.innerText = "Show My Savings Report";
    return;
  }

  const phone = validation.normalizedPhone;
  
  // --- DPDP PRIVACY CONSENT VALIDATION BLOCK ---
  const consentCheckbox = document.getElementById("leadConsentCheckbox");
  if (!consentCheckbox || !consentCheckbox.checked) {
    alert("Please accept the privacy policy consent to view your savings report.");
    submitBtn.disabled = false;
    submitBtn.innerText = "Show My Savings Report";
    return;
  }
  // -----------------------------------------------------

  try {
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const snapshot = await db.collection("leads")
    .where("normalizedPhone", "==", phone)
    .where("createdAt", ">=", last24Hours)
    .orderBy("createdAt", "desc")
    .limit(1)
    .get();
  
    if (!snapshot.empty) {
      console.log("⚠️ Duplicate lead prevented");
      submitBtn.disabled = false;
      submitBtn.innerText = "Show My Savings Report";

      document.getElementById("leadPopup")?.classList.add("hidden");

      const openWhatsAppNow = confirm(
        "You have already submitted a solar request in the last 24 hours.\n\nOur solar advisor team will contact you shortly.\n\nWould you like to chat with us on WhatsApp now?"
      );

      if (openWhatsAppNow) {
        const state = localStorage.getItem("state") || "";
        const message =
          `Hi, I already submitted a solar request.\n\n` +
          `Name: ${name || "Homeowner"}\n` +
          `Phone: ${phone}\n` +
          `Pincode: ${pincode}\n` +
          `State: ${state}\n` +
          `Monthly Bill: ₹${bill}\n\n` +
          `I would like to speak with your solar advisor team.`;

        openWhatsAppChat(message);
      }
      return;
    }
    const leadType = getLeadType(parseFloat(bill));
    const leadCode = generateLeadCode(phone);

      // ✅ SECURE LOCAL RESOLUTION
    // No API dependency. Using your existing reliable local logic.
    const resolvedState = getStateFromPin(pincode);
    const resolvedCity = "Not Provided"; // Results page will prompt user to select this via dropdown later

      const docRef = await db.collection("leads").add({
      name: name || "Homeowner", 
      email: email || "",
      phone,
      normalizedPhone: phone,
      city: resolvedCity, // Saved dynamically
      pincode: pincode,
      state: resolvedState, // Saved dynamically
      bill: parseFloat(bill),
      leadCode,
      customerId: phone,
      leadType,
      status: "New",
      stage: "initial",
      leadSource: "Website",
      assignedTo: "",
      assignedInstallerId: "",
      sharedWithInstaller: false,
      paymentStatus: "PENDING",
      lastContactedAt: null,
      nextFollowupAt: null,
      lastUpdatedBy: "",
      notes: [],
      isTestLead: false,
      // --- SAVE COMPLIANT AUDIT TRAIL DATA ---
      consentGiven: true,
      consentTimestamp: firebase.firestore.FieldValue.serverTimestamp(),
      consentVersion: "1.0-rules-2025",
      // -------------------------------------------------------------
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    
    localStorage.setItem("leadId", docRef.id);
    localStorage.setItem("state", resolvedState);
    localStorage.setItem("leadName", name || "Homeowner");
    localStorage.setItem("leadPhone", phone);
    localStorage.setItem("leadCity", resolvedCity);
    localStorage.setItem("leadBill", bill);
    
 // Redirect to results with the locally resolved state
    window.location.href = `results.html?bill=${bill}&state=${resolvedState}&name=${encodeURIComponent(name || "Homeowner")}&email=${encodeURIComponent(email)}&phone=${encodeURIComponent(phone)}&city=`;

  } catch (error) {
    console.error("Firestore Error:", error);
    submitBtn.disabled = false;
    submitBtn.innerText = "Show My Savings Report";
    alert("Submission failed. Please try again.");
  }
}


// ==========================================
// 5. WHATSAPP SUPPORT
// ==========================================
function openWhatsAppChat(customMessage = "") {
  const defaultMessage =
    "Hi, I’m interested in rooftop solar. Can your solar advisor help me?";

  const message = customMessage || defaultMessage;
  const encodedMessage = encodeURIComponent(message);
  const number = "61404166347";

  window.open(
    `https://wa.me/${number}?text=${encodedMessage}`,
    "_blank"
  );
}

// ==========================================
// 6. UI HANDLERS
// ==========================================
function openConsultation() {
  document.getElementById('consultationPopup').classList.remove('hidden');
}

function closeConsultation() {
  document.getElementById('consultationPopup').classList.add('hidden');
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

// ==========================================
// 7. LIFECYCLE
// ==========================================
document.addEventListener("DOMContentLoaded", function () {
  document.getElementById("leadPopup")?.classList.add("hidden");
  document.getElementById("consultationPopup")?.classList.add("hidden");
});

