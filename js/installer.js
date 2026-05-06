const firebaseConfig = {
    apiKey: "AIzaSyAUBwx-i38T6rfr9lsNYUV6bLOpxvdPfjQ",
    authDomain: "solar-ai-advisor-6e70c.firebaseapp.com",
    projectId: "solar-ai-advisor-6e70c",
    storageBucket: "solar-ai-advisor-6e70c.firebasestorage.app",
    messagingSenderId: "414713467470",
    appId: "1:414713467470:web:437d1cf23454d472c7e91f"
};

// Initialize Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.firestore();

async function submitInstaller() {
    const form = document.getElementById("installerForm");
    const formSection = document.getElementById("formSection");
    const successMsg = document.getElementById("successMsg");
    const submitBtn = document.getElementById("submitBtn");

    // Capture Values
    const business = document.getElementById("business").value.trim();
    const contactName = document.getElementById("name").value.trim();
    const phone = document.getElementById("phone").value.trim();
    const city = document.getElementById("city").value.trim();
    const areasRaw = document.getElementById("areas").value.trim();
    const experience = document.getElementById("experience").value;

    // ✅ UI VALIDATION GATES
    const nameRegex = /^[A-Za-z\s]{2,}$/;
    const phoneRegex = /^[0-9]{10}$/;

    if (!nameRegex.test(contactName)) {
        alert("Contact Person must contain only letters and be at least 2 characters long.");
        return;
    }

    if (!phoneRegex.test(phone)) {
        alert("Please enter a valid 10-digit phone number.");
        return;
    }

    if (!business || !city || !experience) {
        alert("Please complete all required fields.");
        return;
    }

    const serviceAreasArray = areasRaw.split(',').map(a => a.trim().toLowerCase()).filter(a => a.length > 0);

    // Set UI to loading
    submitBtn.disabled = true;
    submitBtn.innerText = "Registering...";

    try {
        // 1. Save to Firestore[span_2](start_span)[span_2](end_span)
        await db.collection("installers").add({
            businessName: business,
            contactPerson: contactName,
            phone: phone,
            baseCity: city,
            serviceAreas: serviceAreasArray,
            experience: experience,
            installerType: "Standard",
            status: "pending_review", // Required for manual activation[span_3](start_span)[span_3](end_span)
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        // 2. Google Forms Backup
        await backupToGoogleForms(business, contactName, phone, city, areasRaw, experience);

        // ✅ 3. FORM CLEANUP (Prevent multiple submissions)
        form.reset();

        // ✅ 4. SMART UI TRANSITION
        formSection.classList.add("hidden");
        successMsg.classList.remove("hidden");
        
        // Target the success message directly instead of the top of the page
        successMsg.scrollIntoView({ behavior: 'smooth', block: 'center' });

    } catch (error) {
        console.error("Submission Error:", error);
        alert("Submission failed. Check your internet connection.");
        submitBtn.disabled = false;
        submitBtn.innerText = "Register as Installer";
    }
}

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

document.addEventListener("DOMContentLoaded", () => {
    const installerForm = document.getElementById('installerForm');
    if (installerForm) {
        installerForm.addEventListener('submit', (e) => {
            e.preventDefault();
            submitInstaller();
        });
    }
});
