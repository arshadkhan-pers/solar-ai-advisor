
// =====================================
// GLOBALS
// =====================================

let allLeads = [];
const db = window.db;

// =====================================
// LOAD LEADS
// =====================================

async function loadLeads() {

  const snapshot = await db
  .collection("leads")
  .orderBy("createdAt", "desc")
  .get();

  allLeads = [];

  snapshot.forEach((docItem) => {

    allLeads.push({
      id: docItem.id,
      ...docItem.data()
    });

  });

  renderLeads(allLeads);

  updateMetrics(allLeads);
}


// =====================================
// METRICS
// =====================================

function updateMetrics(leads) {

  document.getElementById("totalLeadsCount").innerText =
    `${leads.length} Leads`;

  document.getElementById("newCount").innerText =
    leads.filter(
      l => l.status === "NEW" || l.status === "New"
    ).length;

  document.getElementById("hotCount").innerText =
    leads.filter(
      l => l.leadType === "Hot"
    ).length;

  document.getElementById("qualifiedCount").innerText =
    leads.filter(
      l => l.stage === "qualified"
    ).length;

  document.getElementById("contactedCount").innerText =
    leads.filter(
      l => l.status === "CONTACTED"
    ).length;

  document.getElementById("sharedCount").innerText =
    leads.filter(
      l => l.status === "SHARED"
    ).length;
}

// =====================================
// RENDER LEADS
// =====================================

function renderLeads(leads) {

  const tableBody =
    document.getElementById("leadsTableBody");

  tableBody.innerHTML = "";

  leads.forEach((lead) => {

    const row = document.createElement("tr");

    row.className =
      "border-b hover:bg-slate-50";

    row.innerHTML = `

      <td class="px-4 py-4">

        <div>

          <p class="font-semibold">
            ${lead.name || "N/A"}
          </p>

          <p class="text-xs text-gray-500 mt-1">
            ${lead.phone || ""}
          </p>

          <p class="text-xs text-gray-400 mt-1">
            ${lead.leadCode || ""}
          </p>

        </div>

      </td>

      <td class="px-4 py-4">
        ${lead.city || "-"}
      </td>

      <td class="px-4 py-4">
        ₹${lead.bill || 0}
      </td>

      <td class="px-4 py-4">

        <span class="
          px-2 py-1 rounded-lg text-xs font-semibold

          ${lead.leadType === 'Hot'
            ? 'bg-red-100 text-red-700'
            : 'bg-slate-100 text-slate-700'}
        ">

          ${lead.leadType || '-'}

        </span>

      </td>

      <td class="px-4 py-4">
        ${lead.stage || '-'}
      </td>

      <td class="px-4 py-4">

        <select
          onchange="updateLeadStatus('${lead.id}', this.value)"
          class="border rounded-lg px-2 py-1 text-sm">

          <option value="NEW"
            ${lead.status === 'NEW' || lead.status === 'New' ? 'selected' : ''}>
            NEW
          </option>

          <option value="CONTACTED"
            ${lead.status === 'CONTACTED' ? 'selected' : ''}>
            CONTACTED
          </option>

          <option value="SHARED"
            ${lead.status === 'SHARED' ? 'selected' : ''}>
            SHARED
          </option>

          <option value="CLOSED"
            ${lead.status === 'CLOSED' ? 'selected' : ''}>
            CLOSED
          </option>

          <option value="REJECTED"
            ${lead.status === 'REJECTED' ? 'selected' : ''}>
            REJECTED
          </option>

        </select>

      </td>

      <td class="px-4 py-4">

        <button
          onclick="viewLead('${lead.id}')"
          class="bg-slate-900 text-white px-3 py-2 rounded-lg text-xs">

          View

        </button>

      </td>
    `;

    tableBody.appendChild(row);

  });
}

// =====================================
// FILTERS
// =====================================

window.filterLeads = function(type) {

  if (type === "ALL") {

    renderLeads(allLeads);

    return;
  }

  if (type === "Hot") {

    renderLeads(
      allLeads.filter(
        l => l.leadType === "Hot"
      )
    );

    return;
  }

  renderLeads(
    allLeads.filter(
      l => l.status === type
    )
  );
};

// =====================================
// UPDATE STATUS
// =====================================

window.updateLeadStatus =
async function(id, status) {

  try {
    
    await db
  .collection("leads")
  .doc(id)
  .update({
    status: status,
    updatedAt: new Date()
  });

    alert("Lead status updated");

    loadLeads();

  }
  catch (error) {

    console.error(error);

    alert("Failed to update status");
  }
};

// =====================================
// OPEN LEAD PANEL
// =====================================

window.viewLead = async function(id) {

  const lead =
    allLeads.find(
      l => l.id === id
    );

  if (!lead) return;

  // OPEN PANEL
  document
    .getElementById("leadPanelOverlay")
    .classList.remove("hidden");

  const panel =
    document.getElementById(
      "leadDetailsPanel"
    );

  panel.classList.remove(
    "translate-x-full"
  );

  // LOADING STATE
  document.getElementById(
    "leadPanelContent"
  ).innerHTML = `
    <div class="text-center py-10 text-slate-500">
      Loading lead details...
    </div>
  `;

  // HEADER
  document.getElementById(
    "panelLeadCode"
  ).innerText =
    lead.leadCode || "";

  try {

    // LOAD AI REPORT
    const aiReportDoc =
      await db
        .collection("ai_reports")
        .doc(id)
        .get();

    let aiReport = null;

    if (aiReportDoc.exists) {
      aiReport = aiReportDoc.data();
    }

    renderLeadPanel(
      lead,
      aiReport
    );

  }
  catch (error) {

    console.error(error);

    document.getElementById(
      "leadPanelContent"
    ).innerHTML = `
      <div class="text-red-600">
        Failed to load AI report
      </div>
    `;
  }
};

// =====================================
// CLOSE PANEL
// =====================================

window.closeLeadPanel = function() {

  document
    .getElementById("leadPanelOverlay")
    .classList.add("hidden");

  document
    .getElementById("leadDetailsPanel")
    .classList.add("translate-x-full");
};

// =====================================
// RENDER PANEL
// =====================================

function renderLeadPanel(
  lead,
  aiReport
) {

  const content =
    document.getElementById(
      "leadPanelContent"
    );

  content.innerHTML = `

    <!-- CUSTOMER -->
    <div class="space-y-2">

      <h3 class="text-lg font-bold text-slate-900">
        Customer Information
      </h3>

      <div class="bg-slate-50 rounded-2xl p-4 space-y-2">

        <p>
          <span class="font-semibold">
            Name:
          </span>
          ${lead.name || "-"}
        </p>

        <p>
          <span class="font-semibold">
            Phone:
          </span>
          ${lead.phone || "-"}
        </p>

        <p>
          <span class="font-semibold">
            City:
          </span>
          ${lead.city || "-"}
        </p>

        <p>
          <span class="font-semibold">
            Bill:
          </span>
          ₹${lead.bill || 0}
        </p>

      </div>

    </div>

    <!-- SOLAR -->
    <div class="space-y-2">

      <h3 class="text-lg font-bold text-slate-900">
        Solar Recommendation
      </h3>

      <div class="grid grid-cols-2 gap-3">

        <div class="bg-indigo-50 rounded-2xl p-4">
          <p class="text-sm text-slate-500">
            System Size
          </p>

          <p class="text-2xl font-bold text-indigo-700 mt-2">
            ${aiReport?.systemSizeKw || "-"} kW
          </p>
        </div>

        <div class="bg-emerald-50 rounded-2xl p-4">
          <p class="text-sm text-slate-500">
            Net Cost
          </p>

          <p class="text-2xl font-bold text-emerald-700 mt-2">
            ₹${aiReport?.netCost || 0}
          </p>
        </div>

      </div>

    </div>

    <!-- AI PROFILE -->
    <div class="space-y-2">

      <h3 class="text-lg font-bold text-slate-900">
        AI Readiness Profile
      </h3>

      <div class="bg-slate-50 rounded-2xl p-4 space-y-3">

        <p>
          <span class="font-semibold">
            Persona:
          </span>
          ${aiReport?.personaV2?.primary || "-"}
        </p>

        <p>
          <span class="font-semibold">
            AI Score:
          </span>
          ${aiReport?.trustScore || 0}
        </p>

        <p>
          <span class="font-semibold">
            Lead Temperature:
          </span>
          ${aiReport?.personaV2?.leadTemperature || "-"}
        </p>

        <p>
          <span class="font-semibold">
            Financing:
          </span>
          ${aiReport?.personaV2?.financingLikelihood || "-"}
        </p>

      </div>

    </div>

  `;
}


// =====================================
// START
// =====================================

loadLeads();
