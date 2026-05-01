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

function submitToGoogleForm(formURL, params) {
  const form = document.createElement("form");
  form.method = "POST";
  form.action = formURL;
  form.target = "hidden_iframe";
  form.style.display = "none";

  for (const [key, value] of params.entries()) {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = key;
    input.value = value;
    form.appendChild(input);
  }

  document.body.appendChild(form);
  form.submit();
  document.body.removeChild(form);
}

function setupBillUpload() {
  const uploadArea = document.getElementById("billUploadArea");
  const fileInput = document.getElementById("billUpload");
  const fileNameDisplay = document.getElementById("billFileName");

  uploadArea.addEventListener("click", () => fileInput.click());

  uploadArea.addEventListener("dragover", (e) => {
    e.preventDefault();
    uploadArea.style.backgroundColor = "#f0f9ff";
  });

  uploadArea.addEventListener("dragleave", () => {
    uploadArea.style.backgroundColor = "";
  });

  uploadArea.addEventListener("drop", (e) => {
    e.preventDefault();
    uploadArea.style.backgroundColor = "";
    if (e.dataTransfer.files.length > 0) {
      fileInput.files = e.dataTransfer.files;
      fileNameDisplay.innerText = `✓ ${e.dataTransfer.files[0].name}`;
    }
  });

  fileInput.addEventListener("change", (e) => {
    if (e.target.files.length > 0) {
      fileNameDisplay.innerText = `✓ ${e.target.files[0].name}`;
    }
  });
}

function populateCapturedData() {
  const params = new URLSearchParams(window.location.search);
  const name = params.get("name");
  const phone = params.get("phone");
  const city = params.get("city");
  const bill = params.get("bill");

  if (name) document.getElementById("capturedName").value = name;
  if (phone) document.getElementById("capturedPhone").value = phone;
  if (city) document.getElementById("capturedCity").value = city;
  if (bill) document.getElementById("capturedBill").value = `₹${bill}`;
}

function submitLead() {
  const propertyType = document.getElementById("propertyType").value;
  const roofType = document.getElementById("roofType").value;
  const rooftopOwnership = document.getElementById("rooftopOwnership").value;
  const connectionType = document.getElementById("connectionType").value;
  const billFile = document.getElementById("billUpload").files[0];

  const bill = getBillFromURL();
  const result = calculateSolar(bill);

  const formURL = "https://docs.google.com/forms/d/e/1FAIpQLSdlaTI5QgDN_im4LKLmN7gfyMXq1FacODSAkFIUqk1xHQa9Wg/formResponse";
  const params = new URLSearchParams();
  params.append("entry.1246657926", document.getElementById("capturedName").value);
  params.append("entry.89782871", document.getElementById("capturedPhone").value);
  params.append("entry.23617969", document.getElementById("capturedCity").value);
  params.append("entry.1483966016", bill);
  params.append("entry.1063354041", rooftopOwnership);
  params.append("entry.710758326", billFile ? "Yes" : "No");
  params.append("entry.1141577223", connectionType);
  params.append("entry.992838275", propertyType);
  params.append("entry.1735317832", roofType);

  submitToGoogleForm(formURL, params);

  document.getElementById("leadForm").classList.add("hidden");
  document.getElementById("submitSuccess").classList.remove("hidden");

  window.scrollTo({ top: 0, behavior: "smooth" });
}

const bill = getBillFromURL();

if (bill) {
  const result = calculateSolar(bill);
  renderResults(result, bill);
  setupBillUpload();
  populateCapturedData();
} else {
  document.body.innerHTML = "Invalid Input";
}
