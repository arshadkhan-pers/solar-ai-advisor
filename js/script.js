function calculate() {
  const billInput = document.getElementById("billInput").value;
  const bill = parseFloat(billInput);

  if (!bill || bill < 500) {
    alert("Enter valid bill");
    return;
  }

  window.currentBill = bill;
  document.getElementById("leadPopup").classList.remove("hidden");
}

function submitLeadAndContinue() {
  const name = document.getElementById("leadName").value;
  const phone = document.getElementById("leadPhone").value;
  const city = document.getElementById("leadCity").value;
  const bill = window.currentBill;

  if (!name || !phone) {
    alert("Please enter name and phone");
    return;
  }

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
  window.location.href = `/results.html?bill=${bill}`;
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
