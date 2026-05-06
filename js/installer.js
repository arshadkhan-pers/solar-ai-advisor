// ==========================================
// ✅ 1. FIREBASE CONFIGURATION & INIT
// ==========================================
const firebaseConfig = {
    apiKey: "AIzaSyAUBwx-i38T6rfr9lsNYUV6bLOpxvdPfjQ",
    authDomain: "solar-ai-advisor-6e70c.firebaseapp.com",
    projectId: "solar-ai-advisor-6e70c",
    storageBucket: "solar-ai-advisor-6e70c.firebasestorage.app",
    messagingSenderId: "414713467470",
    appId: "1:414713467470:web:437d1cf23454d472c7e91f"
};

// Initialize Firebase if not already initialized[span_1](start_span)[span_1](end_span)
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.firestore();

// ==========================================
// ✅ 2. VALIDATION & UTILITY HELPERS
// ==========================================

// Normalize phone to 10 digits (removes +91 or leading 0)[span_2](start_span)[span_2](end_span)
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

// Inline error UI helpers[span_3](start_span)[span_3](end_span)
function showError(inputId, errorId, message) {
    const errorEl = document.getElementById(errorId);
    const inputEl = document.getElementById(inputId);
    if (errorEl) errorEl.innerText = message;
    if (inputEl) inputEl.style.borderColor = "#ef4444"; // Red border
}

function clearError(inputId, errorId) {
    const errorEl = document.getElementById(errorId);
    const inputEl = document.getElementById(inputId);
    if (errorEl) errorEl.innerText = "";
    if (inputEl) inputEl.style.borderColor = ""; // Reset border
}

// ==========================================
// ✅ 3. CORE REGISTRATION LOGIC
// ==========================================

async function submitInstaller() {
    const form = document.getElementById("installerForm");
    const formSection = document.getElementById("formSection");
    const successMsg = document.getElementById("successMsg");
    const submitBtn = document.getElementById("submitBtn");

    // Capture Values[span_4](start_span)[span_4](end_span)
    const business = document.getElementById("business").value.trim();
    const contactName = document.getElementById("name").value.trim();
    const phoneInput = document.getElementById("phone").value.trim();
    const state = document.getElementById("state").value;
    const city = document.getElementById("city").value.trim();
    const areasRaw = document.getElementById("areas").value.trim();
    const experience = document.getElementById("experience").value;

    // Reset Errors
    const fields = ["business", "name", "phone", "state", "city"];
    fields.forEach(f => clearError(f, f + "Error"));

    let isValid = true;

    // 🛡️ Business Validation
    if (business.length < 3) {
        showError("business", "businessError", "Enter a valid business name");
        isValid = false;
    }

    // 🛡️ Name Validation (Letters only)[span_5](start_span)[span_5](end_span)
    const nameRegex = /^[A-Za-z\s]{2,}$/;
    if (!nameRegex.test(contactName)) {
        showError("name", "nameError", "Enter valid name (letters only)");
        isValid = false;
    }

    // 🛡️ Phone Validation (Normalization + Fake Block)[span_6](start_span)[span_6](end_span)
    const normalizedPhone = normalizePhone(phoneInput);
    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(normalizedPhone) || /^(\d)\1{9}$/.test(normalizedPhone)) {
        showError("phone", "phoneError", "Enter valid 10-digit mobile");
        isValid = false;
    }

    // 🛡️ Dropdown/City Validation
    if (!state) { showError("state", "stateError", "Please select a state"); isValid = false; }
    if (city.length < 2) { showError("city", "cityError", "Enter valid city"); isValid = false; }

    if (!isValid) {
        const firstError = document.querySelector('[id$="Error"]:not(:empty)');
        if (firstError) firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
    }

    // Prepare Data for Firestore
    const serviceAreasArray = areasRaw.split(',').map(a => a.trim().toLowerCase()).filter(a => a.length > 0);

    submitBtn.disabled = true;
    submitBtn.innerText = "Registering...";

    try {
        // 1. Save to Firestore
        await db.collection("installers").add({
            businessName: business,
            contactPerson: contactName,
            phone: normalizedPhone,
            state: state,
            baseCity: city,
            serviceAreas: serviceAreasArray,
            experience: experience,
            installerType: "Standard", // Priority Field
            status: "pending_review",
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        // 2. Google Forms Backup[span_7](start_span)[span_7](end_span)
        await backupToGoogleForms(business, contactName, normalizedPhone, city, areasRaw, experience);

        // ✅ 3. FORM CLEANUP (Prevent multiple submissions)
        form.reset();

        // ✅ 4. SMART UI TRANSITION
        formSection.classList.add("hidden");
        successMsg.classList.remove("hidden");
        
        // Target success message specifically[span_8](start_span)[span_8](end_span)
        successMsg.scrollIntoView({ behavior: 'smooth', block: 'center' });

    } catch (error) {
        console.error("Submission Error:", error);
        alert("Submission failed. Check your internet connection.");
        submitBtn.disabled = false;
        submitBtn.innerText = "Register as Installer";
    }
}

// ==========================================
// ✅ 4. GOOGLE FORMS BACKUP
// ==========================================
async function backupToGoogleForms(business, name, phone, city, areas, exp) {
    const formURL = "https://docs.google.com/forms/d/e/1FAIpQLSfDZPbv-Q4QFGoD2--UMn2TqOz0Ns377o2edzCE3cGD59PUvQ/formResponse";
    const params = new URLSearchParams();
    params.append("entry.2005620554", business);
    params.append("entry.1045781291", name);
    params.append("entry.1166974658", phone);
    params.append("entry.1065046570", city);
    params.append("entry.839337160", areas);
    params.append("entry.2037869120", exp);

    try {
        await fetch(formURL, { method: "POST", mode: "no-cors", body: params });
    } catch (e) {
        console.warn("Google Form backup failed.");
    }
}

// ==========================================
// ✅ 5. INITIALIZATION
// ==========================================
function sortStates() {
    const select = document.getElementById("state");
    if (!select) return;
    const options = Array.from(select.options);
    const first = options.shift(); // Keep "Select State" at top
    options.sort((a, b) => a.text.localeCompare(b.text));
    select.innerHTML = "";
    select.appendChild(first);
    options.forEach(opt => select.appendChild(opt));
}

document.addEventListener("DOMContentLoaded", () => {
    sortStates(); // Sort state dropdown on load[span_9](start_span)[span_9](end_span)
    const installerForm = document.getElementById('installerForm');
    if (installerForm) {
        installerForm.addEventListener('submit', (e) => {
            e.preventDefault();
            submitInstaller();
        });
    }
});
