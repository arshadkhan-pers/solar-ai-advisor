function calculate() {
  const bill = document.getElementById("billInput").value;

  if (!bill || bill <= 0) {
    alert("Please enter a valid electricity bill");
    return;
  }

  window.location.href = `results.html?bill=${bill}`;
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