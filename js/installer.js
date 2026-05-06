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

// Initialize Firebase if not already initialized[span_3](start_span)[span_3](end_span)
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.firestore();

// ==========================================
// ✅ 2. CORE INSTALLER REGISTRATION
// ==========================================

async function submitInstaller() {
    // UI Elements[span_4](start_span)[span_4](end_span)
    const form = document.getElementById("installerForm");
    const formBtn = form.querySelector("button");
    const successMsg = document.getElementById("successMsg");

    // Capture Field Values[span_5](start_span)[span_5](end_span)
    const business = document.getElementById("business").value.trim();
    const contactName = document.getElementById("name").value.trim();
    const phone = document.getElementById("phone").value.trim();
    const city = document.getElementById("city").value.trim();
    const areasRaw = document.getElementById("areas").value.trim();
    const experience = document.getElementById("experience").value;

    // Basic Validation
    if (!business || !phone || !city) {
        alert("Please fill in all required fields (Business, Phone, and Base City).");
        return;
    }

    // ⚡ Performance Step: Normalize service areas into an array for high-speed city matching[span_6](start_span)[span_6](end_span)
    const serviceAreasArray = areasRaw
        .split(',')
        .map(area => area.trim().toLowerCase())
        .filter(area => area.length > 0);

    // Prepare UI for processing
    formBtn.disabled = true;
    formBtn.innerText = "Registering...";

    try {
        // ✅ A. Save to Firestore 'installers' collection[span_7](start_span)[span_7](end_span)
        const docRef = await db.collection("installers").add({
            businessName: business,
            contactPerson: contactName,
            phone: phone,
            baseCity: city,
            serviceAreas: serviceAreasArray, // Array format enables 'array-contains' queries
            experience: experience,
            
            // 🚀 PRIORITY SYSTEM
            installerType: "Standard", // Default tier; manually upgrade to 'Premium' or 'Gold' for first-priority leads
            
            // STATUS MANAGEMENT
            status: "pending_review", // Manual review required for activation[span_8](start_span)[span_8](end_span)
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        console.log("✅ Installer saved with ID:", docRef.id);

        // ✅ B. Backup to Google Forms (Legacy workflow)[span_9](start_span)[span_9](end_span)
        await backupToGoogleForms(business, contactName, phone, city, areasRaw, experience);

        // ✅ C. Update UI[span_10](start_span)[span_10](end_span)
        form.classList.add("hidden");
        successMsg.classList.remove("hidden");
        window.scrollTo({ top: 100, behavior: 'smooth' });

    } catch (error) {
        console.error("❌ Registration Error:", error);
        alert("There was an error saving your profile. Please try again.");
        formBtn.disabled = false;
        formBtn.innerText = "Register as Installer";
    }
}

// ==========================================
// ✅ 3. LEGACY GOOGLE FORMS BACKUP
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
        await fetch(formURL, {
            method: "POST",
            mode: "no-cors",
            body: params
        });
    } catch (e) {
        console.warn("Google Form backup failed, but Firestore was successful.");
    }
}

// ==========================================
// ✅ 4. INITIALIZATION
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
    const installerForm = document.getElementById('installerForm');
    if (installerForm) {
        installerForm.addEventListener('submit', (e) => {
            e.preventDefault();
            submitInstaller();
        });
    }
});
