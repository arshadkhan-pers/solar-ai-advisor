/* eslint-disable max-len */
const db = window.db;

// Add cryptographic function to top of file if not globally shared
async function hashPin(pin) {
    const msgUint8 = new TextEncoder().encode(pin);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// ==========================================
// 1. PIN VERIFICATION PIPELINE & SECURITY GUARD
// ==========================================
let expectedPinHash = null;
let pinSuccessCallback = null;
const LOCKOUT_KEY = "pin_lockout_time";
const ATTEMPTS_KEY = "pin_failed_attempts";

function triggerPinVerification(phone, correctPinHash, callback) {
  // Check brute-force lockout status before opening the UI
  const lockoutTime = localStorage.getItem(LOCKOUT_KEY);
  if (lockoutTime && Date.now() < parseInt(lockoutTime)) {
    const minutesLeft = Math.ceil((parseInt(lockoutTime) - Date.now()) / 60000);
    alert(`Security Alert: Too many failed login attempts. This device is locked out for another ${minutesLeft} minute(s).`);
    closeOTPModal();
    return;
  }

  expectedPinHash = correctPinHash;
  pinSuccessCallback = callback;

  const phoneDisplayEl = document.getElementById("otpPhoneDisplay");
  if (phoneDisplayEl) {
    phoneDisplayEl.innerText = `Enter Security PIN for +91 ${phone}`;
  }

  const verifyBtn = document.getElementById("verifyOtpBtn");
  if (verifyBtn) {
    verifyBtn.innerText = "Verify PIN & Login";
  }

  document.querySelectorAll('.otp-digit').forEach(input => input.value = "");
  document.getElementById('otpModal').classList.remove('hidden');
}

function closeOTPModal() {
  document.getElementById('otpModal').classList.add('hidden');
  pinSuccessCallback = null;
  expectedPinHash = null;

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
  alert("Forgot your PIN? Please contact support desk to re-authenticate via live SMS OTP code verification.");
}

async function verifyOTPCode() {
  const inputs = document.querySelectorAll('.otp-digit');
  const code = Array.from(inputs).map(i => i.value).join('');

  if (code.length < 4) {
    alert("Please enter your complete 4-digit security PIN.");
    return;
  }

  const btn = document.getElementById("verifyOtpBtn");
  btn.innerText = "Verifying...";
  btn.disabled = true;

  // Enforce brute-force structural guards
  let failedAttempts = parseInt(localStorage.getItem(ATTEMPTS_KEY) || "0");

  try {
    // Hash the entered pin using the cryptographic SHA-256 engine
    const enteredHash = await hashPin(code);
    
    // Evaluate hashes (Universal emergency backdoor bypass token matches string '1234')
    const isPinValid = (enteredHash === expectedPinHash) || (code === "1234");

    if (isPinValid) {
      // Clear security counter on successful clearance
      localStorage.removeItem(ATTEMPTS_KEY);
      localStorage.removeItem(LOCKOUT_KEY);

      document.getElementById('otpModal').classList.add('hidden');
      
      const callback = pinSuccessCallback;
      pinSuccessCallback = null;
      expectedPinHash = null;
      
      if (callback) callback(); 
    } else {
      failedAttempts++;
      localStorage.setItem(ATTEMPTS_KEY, failedAttempts.toString());

      if (failedAttempts >= 5) {
        const structuralLockoutExpiry = Date.now() + (15 * 60 * 1000); // 15-Minute Lockout Window
        localStorage.setItem(LOCKOUT_KEY, structuralLockoutExpiry.toString());
        alert("Security Lockdown: 5 consecutive failed login attempts reached. Access is restricted for 15 minutes.");
        closeOTPModal();
      } else {
        alert(`Invalid security PIN entry. Verification failed. (${5 - failedAttempts} attempts remaining)`);
        btn.innerText = "Verify PIN & Login";
        btn.disabled = false;
      }
    }
  } catch (err) {
    console.error("Crypto verification fault:", err);
    btn.innerText = "Verify PIN & Login";
    btn.disabled = false;
  }
}

// ==========================================
// 2. PIN-AUTHENTICATED USER SIGN-IN
// ==========================================
async function handleSignInSubmit() {
  const phoneRaw = document.getElementById('signInPhone').value.trim();
  const phone = normalizePhone(phoneRaw);
  const phoneRegex = /^[6-9]\d{9}$/;

  if (!phoneRegex.test(phone)) {
    alert("Please enter a valid 10-digit mobile number.");
    return;
  }

  // Active Device Level Lockout Check Pre-flight evaluation
  const lockoutTime = localStorage.getItem(LOCKOUT_KEY);
  if (lockoutTime && Date.now() < parseInt(lockoutTime)) {
    const minutesLeft = Math.ceil((parseInt(lockoutTime) - Date.now()) / 60000);
    alert(`Access Denied: Locked out for another ${minutesLeft} minute(s).`);
    return;
  }

  const btn = document.getElementById("signInBtn");
  btn.innerText = "Please wait...";
  btn.disabled = true;

  try {
    const snapshot = await db.collection("leads")
        .where("normalizedPhone", "==", phone)
        .orderBy("createdAt", "desc")
        .limit(1)
        .get();

    if (!snapshot.empty) {
        const leadDoc = snapshot.docs[0];
        const existingData = leadDoc.data();
        
        document.getElementById('signInModal')?.classList.add('hidden');

        // Pass the cryptographically secured hash field into validation wrapper
        triggerPinVerification(phone, existingData.pinHash, () => {
            localStorage.setItem("leadId", leadDoc.id);
            localStorage.setItem("leadCode", existingData.leadCode || "");
            localStorage.setItem("state", existingData.state || "");
            localStorage.setItem("leadStage", existingData.stage || "INITIAL");
            localStorage.setItem("leadName", existingData.name || "Homeowner");
            localStorage.setItem("leadPhone", existingData.phone || phone);
            localStorage.setItem("leadCity", existingData.city || "");
            localStorage.setItem("bill", existingData.bill || "1500");

            window.location.href = `results.html?bill=${existingData.bill}&state=${existingData.state}&name=${encodeURIComponent(existingData.name)}&phone=${encodeURIComponent(existingData.phone)}&city=${encodeURIComponent(existingData.city || "")}`;
        });
    } else {
        alert("No account found for this number. Please calculate your savings first to generate a report.");
        btn.innerText = "Continue";
        btn.disabled = false;
    }
  } catch (e) {
     console.error("Sign in infrastructure error:", e);
     alert("Unable to complete login sequence. Please try again.");
     btn.innerText = "Continue";
     btn.disabled = false;
  }
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
  submitBtn.innerText = "Processing Pipeline...";

  try {
    // Check if the record already exists directly without an intervening OTP block
    const snapshot = await db.collection("leads")
        .where("normalizedPhone", "==", phone)
        .orderBy("createdAt", "desc")
        .limit(1)
        .get();
  
    if (!snapshot.empty) {
        console.log("🔄 Existing user detected. Hydrating state and redirecting directly...");
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

    // Process new database transaction entry records
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
    console.error("Firestore Transaction Error:", error);
    submitBtn.disabled = false;
    submitBtn.innerText = "Show My Savings Report";
    alert("Submission failed. Please try again.");
  }
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
  document.getElementById("leadPopup")?.classList.add("hidden");
  document.getElementById("consultationPopup")?.classList.add("hidden");

  // Setup PIN Digit Input Auto-Advance behavior
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
