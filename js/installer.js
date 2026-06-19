// ==========================================
// ✅ 1. CONFIGURATION & DATA INIT
// ==========================================
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

// ==========================================
// ✅ 2. VALIDATION & UTILITY HELPERS
// ==========================================

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
    if (inputEl) inputEl.style.borderColor = "#ef4444";
}

function clearError(inputId, errorId) {
    const errorEl = document.getElementById(errorId);
    const inputEl = document.getElementById(inputId);
    if (errorEl) errorEl.innerText = "";
    if (inputEl) inputEl.style.borderColor = "";
}

// ==========================================
// ✅ 3. CORE REGISTRATION LOGIC
// ==========================================

async function submitInstaller() {
    const form = document.getElementById("installerForm");
    const formSection = document.getElementById("formSection");
    const successMsg = document.getElementById("successMsg");
    const submitBtn = document.getElementById("submitBtn");

    const business = document.getElementById("business").value.trim();
    const contactName = document.getElementById("name").value.trim();
    const phoneInput = document.getElementById("phone").value.trim();
    const state = document.getElementById("state").value;
    const city = document.getElementById("city").value; 
    const areasRaw = document.getElementById("areas").value.trim();
    const experience = document.getElementById("experience").value;

    const fields = ["business", "name", "phone", "state", "city"];
    fields.forEach(f => clearError(f, f + "Error"));

    let isValid = true;

    if (business.length < 3) { showError("business", "businessError", "Enter a valid business name"); isValid = false; }
    if (!/^[A-Za-z\s]{2,}$/.test(contactName)) { showError("name", "nameError", "Enter valid name"); isValid = false; }
    
    const normalizedPhone = normalizePhone(phoneInput);
    if (!/^[6-9]\d{9}$/.test(normalizedPhone)) { showError("phone", "phoneError", "Enter valid mobile"); isValid = false; }

    if (!state) { showError("state", "stateError", "Please select a state"); isValid = false; }
    if (!city) { showError("city", "cityError", "Please select a city"); isValid = false; }

    if (!isValid) return;

    submitBtn.disabled = true;
    submitBtn.innerText = "Registering...";

    try {
        await db.collection("installers").add({
            businessName: business,
            contactPerson: contactName,
            phone: normalizedPhone,
            state: state,
            baseCity: city,
            serviceAreas: areasRaw.split(',').map(a => a.trim()),
            experience: experience,
            status: "pending_review",
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        form.reset();
        formSection.classList.add("hidden");
        successMsg.classList.remove("hidden");
    } catch (error) {
        console.error("Submission Error");
        alert("Submission failed.");
        submitBtn.disabled = false;
        submitBtn.innerText = "Register as Installer";
    }
}

// ==========================================
// ✅ 4. INITIALIZATION
// ==========================================

document.addEventListener("DOMContentLoaded", async () => {
    // 1. Initialize location dropdowns using your new Global Handler
    await LocationHandler.init("state", "city"); 

    // 2. Setup Form Listener
    const installerForm = document.getElementById('installerForm');
    if (installerForm) {
        installerForm.addEventListener('submit', (e) => {
            e.preventDefault();
            submitInstaller();
        });
    }
});
