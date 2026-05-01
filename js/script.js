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

  // ✅ Google Form URL
  const formURL = "https://docs.google.com/forms/d/e/1FAIpQLSdlaTI5QgDN_im4LKLmN7gfyMXq1FacODSAkFIUqk1xHQa9Wg/formResponse";

  const params = new URLSearchParams();

  params.append("entry.1246657926", name);
  params.append("entry.89782871", phone);
  params.append("entry.23617969", city);
  params.append("entry.1483966016", bill);

  // ✅ Save to Google Sheet
  fetch(formURL, {
    method: "POST",
    mode: "no-cors",
    body: params
  });

  // ✅ WhatsApp Notification (to you)
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

  // ✅ Redirect to results with captured data
  const redirectURL = `/results.html?bill=${encodeURIComponent(bill)}&name=${encodeURIComponent(name)}&phone=${encodeURIComponent(phone)}&city=${encodeURIComponent(city)}`;
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
