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

document.addEventListener("DOMContentLoaded", function () {
  const calculateBtn = document.getElementById("calculateBtn");
  if (calculateBtn) {
    calculateBtn.addEventListener("click", calculate);
  }
});

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}