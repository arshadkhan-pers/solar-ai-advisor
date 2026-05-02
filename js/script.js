function calculate() {
  const billInput = document.getElementById("billInput").value;
  const bill = parseFloat(billInput);

  if (!bill || bill < 500) {
    alert("Enter valid bill");
    return;
  }

  window.currentBill = bill;
  localStorage.setItem("bill", bill);
  document.getElementById("leadPopup").classList.remove("hidden");
}
/*
function submitLeadAndContinue() {

  const name = document.getElementById("leadName").value;
  const phone = document.getElementById("leadPhone").value;
  const city = document.getElementById("leadCity").value;

  const bill = localStorage.getItem("bill") || window.currentBill;

  if (!name || !phone) {
    alert("Please enter name and phone");
    return;
  }

  // 🔥 GENERATE LEAD ID
  const leadId = Date.now().toString();
  localStorage.setItem("leadId", leadId);

  // 🔥 SAVE TO FIRESTORE
  db.collection("leads").doc(leadId).set({
    name: name,
    phone: phone,
    city: city,
    bill: parseFloat(bill),
    leadType: "New",
    createdAt: new Date()
  });

  // ✅ WhatsApp Notification (UNCHANGED)
  const message = `
New Solar Lead:

Name: ${name}
Phone: ${phone}
City: ${city}
Bill: ₹${bill}
`;

  const encodedMessage = encodeURIComponent(message);
  const number = "61404166347";

  window.open(`https://wa.me/${number}?text=${encodedMessage}`, "_blank");

  // ✅ Redirect (UNCHANGED)
  const redirectURL = `results.html?bill=${encodeURIComponent(bill)}&name=${encodeURIComponent(name)}&phone=${encodeURIComponent(phone)}&city=${encodeURIComponent(city)}`;
  window.location.href = redirectURL;
}
*/
async function submitLeadAndContinue() {
  console.log("🚀 Submit button clicked");

  const name = document.getElementById("leadName").value;
  const phone = document.getElementById("leadPhone").value;
  const city = document.getElementById("leadCity").value;
  const bill = localStorage.getItem("bill") || window.currentBill;

  console.log("📊 Input values:", { name, phone, city, bill });

  if (!name || !phone) {
    alert("Please enter name and phone");
    return;
  }

  // 🔍 Check Firebase loaded
  if (typeof firebase === "undefined") {
    console.error("❌ Firebase NOT loaded");
    alert("Firebase not loaded");
    return;
  }

  // 🔍 Check DB initialized
  if (typeof db === "undefined") {
    console.error("❌ Firestore DB not initialized");
    alert("DB not initialized");
    return;
  }

  try {
    console.log("🔥 Attempting Firestore write...");

    const docRef = await db.collection("leads").add({
      name,
      phone,
      city,
      bill: parseFloat(bill),
      createdAt: new Date()
    });

    console.log("✅ Firestore SUCCESS:", docRef.id);

    localStorage.setItem("leadId", docRef.id);

  } catch (error) {
    console.error("❌ Firestore ERROR:", error);
    alert("Error saving data. Check console.");
    return;
  }

  // ✅ WhatsApp (unchanged)
  const message = `New Solar Lead:
Name: ${name}
Phone: ${phone}
City: ${city}
Bill: ₹${bill}`;

  const encodedMessage = encodeURIComponent(message);
  window.open(`https://wa.me/61404166347?text=${encodedMessage}`, "_blank");

  // ✅ Redirect
  window.location.href =
    `results.html?bill=${bill}&name=${encodeURIComponent(name)}&phone=${encodeURIComponent(phone)}&city=${encodeURIComponent(city)}`;
}

document.addEventListener("DOMContentLoaded", function () {
  const calculateBtn = document.getElementById("calculateBtn");
  if (calculateBtn) {
    calculateBtn.addEventListener("click", calculate);
  }
});

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}