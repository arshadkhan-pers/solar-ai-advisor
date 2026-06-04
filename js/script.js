/* eslint-disable max-len */
const db = window.db;

// 💡 MASTER TOGGLE FOR OTP AUTHENTICATION
// Automatically disables OTP on localhost for dev, enables in production.
const ENABLE_OTP_AUTH = window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1";

// ==========================================
// 1. OTP & AUTHENTICATION PIPELINE
// ==========================================
let pendingActionCallback = null; 

function triggerOTPVerification(phone, callback) {
  if (!ENABLE_OTP_AUTH) {
    console.log("OTP Disabled: Bypassing authentication step...");
    callback(); 
    return;
  }

  pendingActionCallback = callback;

  // Mask phone for UI (e.g., +91 98******45)
  const masked = phone.substring(0, 2) + "******" + phone.substring(8);
  document.getElementById("otpPhoneDisplay").innerText = `+91 ${masked}`;

  // Hide other modals to keep UI clean
  document.getElementById('leadPopup')?.classList.add('hidden');
  document.getElementById('signInModal')?.classList.add('hidden');

  // Clear previous OTP inputs
  document.querySelectorAll('.otp-digit').forEach(input => input.value = "");

  // Show OTP Modal
  document.getElementById('otpModal').classList.remove('hidden');

  // ⚠️ TODO: Insert your actual SMS gateway/Firebase Auth trigger here
  console.log(`[Dev Mode] Simulating SMS sent to ${phone}`);
}

function closeOTPModal() {
  document.getElementById('otpModal').classList.add('hidden');
  pendingActionCallback = null;

  // Restore parent form buttons if the user cancels the OTP flow
  const leadSubmitBtn = document.querySelector("#leadPopup button");
  if (leadSubmitBtn) {
    leadSubmitBtn.disabled = false;
    leadSubmitBtn.innerText = "Show My Savings Report";
  }

  const signInBtn = document.getElementById("signInBtn");
  if (signInBtn) {
    signInBtn.disabled = false;
    signInBtn.innerText = "Continue";
  }
}

function resendOTP() {
  alert("New code sent! (Mock)");
  // ⚠️ TODO: Retrigger your SMS API here
}

function verifyOTPCode() {
  const inputs = document.querySelectorAll('.otp-digit');
  const code = Array.from(inputs).map(i => i.value).join('');

  if (code.length < 4) {
    alert("Please enter the complete 4-digit code.");
    return;
  }

  const btn = document.getElementById("verifyOtpBtn");
  btn.innerText = "Verifying...";
  btn.disabled = true;

  // ⚠️ TODO: Replace this timeout with your actual OTP Verification logic
  setTimeout(() => {
    if (code === "1234") { // Using "1234" as a universal bypass for testing
      document.getElementById('otpModal').classList.add('hidden');
      
      // Mandatory Fix 2: Clear callback before executing to prevent ghost executions
      const callback = pendingActionCallback;
      pendingActionCallback = null;
      if (callback) {
        callback(); 
      }
    } else {
      alert("Invalid code. (Hint: use 1234)");
    }
    // Reset OTP button state
    btn.innerText = "Verify & Continue";
    btn.disabled = false;
  }, 1000);
}

// ==========================================
// 2. EXISTING USER SIGN-IN
// ==========================================
function openSignInModal(event) {
  if (event) event.preventDefault();
  document.getElementById('signInModal').classList.remove('hidden');
}

function closeSignInModal() {
  document.getElementById('signInModal').classList.add('hidden');
}

async function handleSignInSubmit() {
  const phoneRaw = document.getElementById('signInPhone').value.trim();
  const phone = normalizePhone(phoneRaw);
  const phoneRegex = /^[6-9]\d{9}$/;

  if (!phoneRegex.test(phone)) {
    alert("Please enter a valid 10-digit mobile number.");
    return;
  }

  const btn = document.getElementById("signInBtn");
  btn.innerText = "Please wait...";
  btn.disabled = true;

  // Pass phone to universal OTP pipeline
  triggerOTPVerification(phone, async () => {
     try {
        const snapshot = await db.collection("leads")
            .where("normalizedPhone", "==", phone)
            .orderBy("createdAt", "desc")
            .limit(1)
            .get();

        if (!snapshot.empty) {
            const existingData = snapshot.docs[0].data();
            
            // Hydrate localStorage
            localStorage.setItem("leadId", snapshot.docs[0].id);
            localStorage.setItem("leadCode", existingData.leadCode || "");
            localStorage.setItem("state", existingData.state || "");
            localStorage.setItem("leadStage", existingData.stage || "INITIAL");
            localStorage.setItem("leadName", existingData.name || "Homeowner");
            localStorage.setItem("leadPhone", existingData.phone || phone);
            localStorage.setItem("leadCity", existingData.city || "");
            localStorage.setItem("bill", existingData.bill || "1500");

            // Route to dashboard
            window.location.href = `results.html?bill=${existingData.bill}&state=${existingData.state}&name=${encodeURIComponent(existingData.name)}&phone=${encodeURIComponent(existingData.phone)}&city=${encodeURIComponent(existingData.city || "")}`;
        } else {
            alert("No account found for this number. Please calculate your savings first to generate a report.");
            // Reset and show sign in again
            document.getElementById('signInModal').classList.remove('hidden');
            btn.innerText = "Continue";
            btn.disabled = false;
        }
     } catch (e) {
         console.error("Sign in error:", e);
         alert("Unable to sign in. Please try again.");
         btn.innerText = "Continue";
         btn.disabled = false;
     }
  });
  
  // Mandatory Fix 1: Removed immediate button reset here.
}

// ==========================================
// 3. HELPERS & UTILITIES
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

function getStateFromPin(pin) {
  if (!pin || pin.length < 2) return "DL";
  const prefix = parseInt(pin.substring(0, 2));
  if (prefix === 11) return "DL";
  if (prefix >= 12 && prefix <= 13) return "HR";
  if (prefix >= 14 && prefix <= 16) return "PB";
  if (prefix === 17) return "HP";
  if (prefix >= 18 && prefix <= 19) return "JK";
  if (prefix >= 20 && prefix <= 23) return "UP";
  if (prefix >= 24 && prefix <= 28) return "UK"; 
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
// 4. UNIFIED VALIDATION
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

  if (prefix === 'cons') {
    if (!city || city.length < 2) {
      showError(fields.city.input, fields.city.error, "Enter your city");
      isValid = false;
    }
  }

  return { isValid, normalizedPhone };
}


// ==========================================
// 5. CORE FUNCTIONALITY & SUBMISSIONS
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

  const pincodeRegex = /^[1-9][0-9]{5}$/; 
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

  if (!validation.isValid) return;

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
  
  const name = document.getElementById("leadName").value.trim();
  const email = document.getElementById("leadEmail").value.trim();
  const phoneRaw = document.getElementById("leadPhone").value.trim();
  const bill = localStorage.getItem("bill") || window.currentBill;
  const pincode = localStorage.getItem("pincode") || "";
  const city = ""; 

  const validation = validateForm("lead", name, email, phoneRaw, city);
  if (!validation.isValid) return;

  const phone = validation.normalizedPhone;
  
  const consentCheckbox = document.getElementById("leadConsentCheckbox");
  if (!consentCheckbox || !consentCheckbox.checked) {
    alert("Please accept the privacy policy consent to view your savings report.");
    return;
  }

  submitBtn.disabled = true;
  submitBtn.innerText = "Processing...";

  // Route through the new OTP verification pipeline
  triggerOTPVerification(phone, async () => {
    try {
      const snapshot = await db.collection("leads")
          .where("normalizedPhone", "==", phone)
          .orderBy("createdAt", "desc")
          .limit(1)
          .get();
    
      if (!snapshot.empty) {
          console.log("🔄 Existing user detected. Hydrating state and redirecting...");
          const existingLeadDoc = snapshot.docs[0];
          const existingData = existingLeadDoc.data();

          localStorage.setItem("leadId", existingLeadDoc.id);
          localStorage.setItem("leadCode", existingData.leadCode || "");
          localStorage.setItem("state", existingData.state || "");
          localStorage.setItem("leadStage", existingData.stage || "INITIAL");
          localStorage.setItem("leadName", existingData.name || "Homeowner");
          localStorage.setItem("leadPhone", existingData.phone || phone);
          localStorage.setItem("leadCity", existingData.city || "");
          localStorage.setItem("bill", existingData.bill || bill);

          window.location.href = `results.html?bill=${existingData.bill}&state=${existingData.state}&name=${encodeURIComponent(existingData.name)}&phone=${encodeURIComponent(existingData.phone)}&city=${encodeURIComponent(existingData.city || "")}`;
          return;
      }

      const leadType = getLeadType(parseFloat(bill));
      const leadCode = generateLeadCode(phone);
      const resolvedState = getStateFromPin(pincode);
      const resolvedCity = "Not Provided"; 

      const docRef = await db.collection("leads").add({
        name: name || "Homeowner", 
        email: email || "",
        phone,
        normalizedPhone: phone,
        city: resolvedCity,
        pincode: pincode,
        state: resolvedState,
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
        consentGiven: true,
        consentTimestamp: firebase.firestore.FieldValue.serverTimestamp(),
        consentVersion: "1.0-rules-2025",
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      
      localStorage.setItem("leadId", docRef.id);
      localStorage.setItem("leadCode", leadCode); 
      localStorage.setItem("state", resolvedState);
      localStorage.setItem("leadName", name || "Homeowner");
      localStorage.setItem("leadPhone", phone);
      localStorage.setItem("leadCity", resolvedCity);
      localStorage.setItem("leadBill", bill);
      
      window.location.href = `results.html?bill=${bill}&state=${resolvedState}&name=${encodeURIComponent(name || "Homeowner")}&email=${encodeURIComponent(email)}&phone=${encodeURIComponent(phone)}&city=`;

    } catch (error) {
      console.error("Firestore Error:", error);
      submitBtn.disabled = false;
      submitBtn.innerText = "Show My Savings Report";
      alert("Submission failed. Please try again.");
    }
  });

  // Mandatory Fix 1: Removed immediate button reset here.
}

// ==========================================
// 6. WHATSAPP & UI HELPERS
// ==========================================
function openWhatsAppChat(customMessage = "") {
  const defaultMessage = "Hi, I’m interested in rooftop solar. Can your solar advisor help me?";
  const message = customMessage || defaultMessage;
  window.open(`https://wa.me/61404166347?text=${encodeURIComponent(message)}`, "_blank");
}

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

// ==========================================
// 7. LIFECYCLE & EVENT LISTENERS
// ==========================================
document.addEventListener("DOMContentLoaded", function () {
  // Mandatory Fix 3: Restore popup hiding logic on load
  document.getElementById("leadPopup")?.classList.add("hidden");
  document.getElementById("consultationPopup")?.classList.add("hidden");

  // Setup OTP Input Auto-Advance behavior
  const otpInputs = document.querySelectorAll('.otp-digit');
  otpInputs.forEach((input, index) => {
    input.addEventListener('input', (e) => {
      if (e.target.value.length === 1 && index < otpInputs.length - 1) {
        otpInputs[index + 1].focus();
      }
    });
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace' && !e.target.value && index > 0) {
        otpInputs[index - 1].focus();
      }
      if (e.key === 'Enter') {
        verifyOTPCode();
      }
    });
  });
});
