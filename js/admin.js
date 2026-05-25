
// =====================================
// GLOBALS
// =====================================

let allLeads = [];

// =====================================
// LOAD LEADS
// =====================================

async function loadLeads() {

  const q = query(
    collection(db, "leads"),
    orderBy("createdAt", "desc")
  );

  const snapshot = await getDocs(q);

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

    await updateDoc(
      doc(db, "leads", id),
      {
        status: status,
        updatedAt: new Date()
      }
    );

    alert("Lead status updated");

    loadLeads();

  }
  catch (error) {

    console.error(error);

    alert("Failed to update status");
  }
};

// =====================================
// VIEW LEAD
// =====================================

window.viewLead = function(id) {

  const lead =
    allLeads.find(
      l => l.id === id
    );

  if (!lead) return;

  alert(`
Name: ${lead.name}

Phone: ${lead.phone}

City: ${lead.city}

Bill: ₹${lead.bill || 0}

Lead Type: ${lead.leadType}

Status: ${lead.status}

Stage: ${lead.stage}
  `);
};

// =====================================
// START
// =====================================

loadLeads();
