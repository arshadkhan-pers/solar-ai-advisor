function getBillFromURL() {
  const params = new URLSearchParams(window.location.search);
  return parseFloat(params.get("bill"));
}
function calculateSolar(bill) {
  const units = bill / 7;
  const systemSize = units / 120;
  const costPerKW = 55000;
  const totalCost = systemSize * costPerKW;
  let subsidy = systemSize <= 3 
    ? systemSize * 18000 
    : 54000;
  const finalCost = totalCost - subsidy;
  const monthlySavings = units * 7;
  const payback = finalCost / (monthlySavings * 12);
  return {
    systemSize: systemSize.toFixed(1),
    totalCost: Math.round(totalCost),
    subsidy: Math.round(subsidy),
    finalCost: Math.round(finalCost),
    monthlySavings: Math.round(monthlySavings),
    payback: payback.toFixed(1)
  };
}
function renderResults(data, bill) {
  document.getElementById("systemSize").innerText =
    `${data.systemSize} kW Solar System Recommended`;
  document.getElementById("billInfo").innerText =
    `Based on your ₹${bill}/month bill`;
  document.getElementById("totalCost").innerText = data.totalCost;
  document.getElementById("subsidy").innerText = data.subsidy;
  document.getElementById("finalCost").innerText = data.finalCost;
  document.getElementById("monthlySavings").innerText = data.monthlySavings;
  document.getElementById("payback").innerText = data.payback;
}
function showForm() {
  document.getElementById("leadForm").classList.remove("hidden");
}
function submitLead() {
  const name = document.getElementById("name").value.trim();
  const phone = document.getElementById("phone").value.trim();
  const city = document.getElementById("city").value.trim();
  if (!name || !phone) {
    alert("Please enter name and phone");
    return;
  }

  const bill = getBillFromURL();
  const result = calculateSolar(bill);
  const message = `New Solar Lead:%0AName: ${name}%0APhone: ${phone}%0ACity: ${city}%0ABill: ₹${bill}%0ARecommended System: ${result.systemSize} kW%0ABudget: ₹${result.finalCost}%0A%0APlease contact the customer.`;

  const installerNumbers = ["61404166347", "61468362405"];
  installerNumbers.forEach((installerNumber) => {
    const whatsappURL = `https://wa.me/${installerNumber}?text=${message}`;
    window.open(whatsappURL, "_blank");
  });
}
const bill = getBillFromURL();
if (bill) {
  const result = calculateSolar(bill);
  renderResults(result, bill);
} else {
  document.body.innerHTML = "Invalid Input";
}
