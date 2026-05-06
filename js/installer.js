// ==========================================
// ✅ 1. CONFIGURATION & DATA INIT
// ==========================================
let citiesByState = {}; // Global storage for fetched JSON data

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

// 🔥 Helper to load external JSON
async function fetchCityData() {
    try {
        const response = await fetch('data/cities.json');
        if (!response.ok) throw new Error('Network response was not ok');
        citiesByState = await response.json();
    } catch (error) {
        console.error("Failed to load cities.json:", error);
    }
}

// 🔥 State name mapping dictionary
const stateNames = {
    "UP": "Uttar Pradesh",
    "MH": "Maharashtra",
    "DL": "Delhi",
    "GJ": "Gujarat",
    "RJ": "Rajasthan",
    "MP": "Madhya Pradesh",
    "KA": "Karnataka",
    "TN": "Tamil Nadu",
    "WB": "West Bengal",
    "TS": "Telangana",
    "AP": "Andhra Pradesh",
    "KL": "Kerala",
    "PB": "Punjab",
    "HR": "Haryana",
    "BR": "Bihar",
    "JH": "Jharkhand",
    "UK": "Uttarakhand",
    "HP": "Himachal Pradesh",
    "OR": "Odisha",
    "AS": "Assam",
    "CH": "Chandigarh",
    "GA": "Goa"
};

function populateStateDropdown() {
    const stateSelect = document.getElementById("state");
    if (!stateSelect) return;

    const firstOption = stateSelect.querySelector('option[value=""]');
    stateSelect.innerHTML = ''; // Clear previous elements
    if (firstOption) stateSelect.appendChild(firstOption);

    Object.keys(citiesByState).forEach(code => {
        const opt = document.createElement("option");
        opt.value = code;
        opt.textContent = stateNames[code] || code;
        stateSelect.appendChild(opt);
    });
}

function updateCityDropdown(stateCode) {
    const citySelect = document.getElementById("city");
    if (!citySelect) return;

    citySelect.innerHTML = '<option value="">Select City</option>';
    
    if (stateCode && citiesByState[stateCode]) {
        // Sort cities alphabetically for better UX
        [...citiesByState[stateCode]].sort().forEach(city => {
            const opt = document.createElement("option");
            opt.value = city;
            opt.textContent = city;
            citySelect.appendChild(opt);
        });
    }
}

// ==========================================
// ✅ 3. CORE REGISTRATION LOGIC
// ==========================================

async function submitInstaller() {
    const form = document.getElementById("installerForm");
    const formSection = document.getElementById("formSection");
    const successMsg = document.getElementById("successMsg");
    const submitBtn = document.getElementById("submitBtn");

    // Capture Values
    const business = document.getElementById("business").value.trim();
    const contactName = document.getElementById("name").value.trim();
    const phoneInput = document.getElementById("phone").value.trim();
    const state = document.getElementById("state").value;
    const city = document.getElementById("city").value; // Now a selection
    const areasRaw = document.getElementById("areas").value.trim();
    const experience = document.getElementById("experience").value;

    // Reset Errors
    const fields = ["business", "name", "phone", "state", "city"];
    fields.forEach(f => clearError(f, f + "Error"));

    let isValid = true;

    if (business.length < 3) {
        showError("business", "businessError", "Enter a valid business name");
        isValid = false;
    }

    const nameRegex = /^[A-Za-z\s]{2,}$/;
    if (!nameRegex.test(contactName)) {
        showError("name", "nameError", "Enter valid name (letters only)");
        isValid = false;
    }

    const normalizedPhone = normalizePhone(phoneInput);
    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(normalizedPhone) || /^(\d)\1{9}$/.test(normalizedPhone)) {
        showError("phone", "phoneError", "Enter valid 10-digit mobile");
        isValid = false;
    }

    if (!state) { showError("state", "stateError", "Please select a state"); isValid = false; }
    if (!city) { showError("city", "cityError", "Please select a city"); isValid = false; }

    if (!isValid) {
        const firstError = document.querySelector('[id$="Error"]:not(:empty)');
        if (firstError) firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
    }

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
            installerType: "Standard",
            status: "pending_review",
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        // 2. Google Forms Backup
        await backupToGoogleForms(business, contactName, normalizedPhone, city, areasRaw, experience);

        form.reset();
        formSection.classList.add("hidden");
        successMsg.classList.remove("hidden");
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
    const first = options.shift();
    options.sort((a, b) => a.text.localeCompare(b.text));
    select.innerHTML = "";
    select.appendChild(first);
    options.forEach(opt => select.appendChild(opt));
}

document.addEventListener("DOMContentLoaded", async () => {
    // 1. Fetch data & dynamically build states
    await fetchCityData();
    populateStateDropdown();
    sortStates();

    const stateSelect = document.getElementById("state");
    if (stateSelect) {
        // Initialize city dropdown based on the first selected state
        updateCityDropdown(stateSelect.value);

        // 2. Setup State-to-City listener
        stateSelect.addEventListener("change", (e) => updateCityDropdown(e.target.value));
    }

    const installerForm = document.getElementById('installerForm');
    if (installerForm) {
        installerForm.addEventListener('submit', (e) => {
            e.preventDefault();
            submitInstaller();
        });
    }
});
