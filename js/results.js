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

  const panels = Math.round(systemSize * 3);
  const area = Math.round(systemSize * 75);
  const lifetimeSavings = Math.round(monthlySavings * 12 * 25);

  return {
    systemSize: systemSize.toFixed(1),
    totalCost: Math.round(totalCost),
    subsidy: Math.round(subsidy),
    finalCost: Math.round(finalCost),
    monthlySavings: Math.round(monthlySavings),
    payback: payback.toFixed(1),
    panels,
    area,
    lifetimeSavings
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
  document.getElementById("panels").innerText = data.panels;
  document.getElementById("area").innerText = data.area;
  document.getElementById("lifetimeSavings").innerText = data.lifetimeSavings;
}

function showForm() {
  document.getElementById("leadForm").classList.remove("hidden");
}

function openWhatsApp() {
  const bill = getBillFromURL();
  const result = calculateSolar(bill);

  const message = `\nHi, I’m interested in installing rooftop solar.\n\nHere are my details:\n\nMonthly Bill: ₹${bill}\nRecommended System: ${result.systemSize} kW\nEstimated Cost (after subsidy): ₹${result.finalCost}\nMonthly Savings: ₹${result.monthlySavings}\nPayback Period: ${result.payback} years\n\nPlease share installation details and next steps.\n`;

  const encodedMessage = encodeURIComponent(message);
  const number = "61404166347";
  const url = `https://wa.me/${number}?text=${encodedMessage}`;

  window.open(url, "_blank");
}

function submitLead() {
  const name = document.getElementById("name").value;
  const phone = document.getElementById("phone").value;
  const city = document.getElementById("city").value;
  const propertyType = document.getElementById("propertyType").value;
  const roofType = document.getElementById("roofType").value;

  const bill = getBillFromURL();
  const result = calculateSolar(bill);

  if (!name || !phone) {
    alert("Please enter name and phone");
    return;
  }

  const message = `\nNew Solar Lead:\n\nName: ${name}\nPhone: ${phone}\nCity: ${city}\nProperty: ${propertyType}\nRoof: ${roofType}\n\nBill: ₹${bill}\nSystem: ${result.systemSize} kW\nBudget: ₹${result.finalCost}\n`;

  const encodedMessage = encodeURIComponent(message);
  const number = "61404166347";
  const url = `https://wa.me/${number}?text=${encodedMessage}`;

  window.open(url, "_blank");
}

const bill = getBillFromURL();

if (bill) {
  const result = calculateSolar(bill);
  renderResults(result, bill);
} else {
  document.body.innerHTML = "Invalid Input";
}
