
// =====================================
// GLOBALS
// =====================================

let allLeads = [];
let currentOpenLeadId = null;
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

    let rowClass =
  "border-b hover:bg-slate-50";

const isOverdue =
  lead.followUpDate &&
  new Date(lead.followUpDate) < new Date();

if (lead.priority === "URGENT" || isOverdue) {
  rowClass +=
    " bg-red-50 border-l-4 border-red-500";
}
else if (lead.priority === "HIGH") {

  rowClass +=
    " bg-orange-50 border-l-4 border-orange-500";
}
else if (lead.priority === "MEDIUM") {

  rowClass +=
    " bg-yellow-50 border-l-4 border-yellow-500";
}

row.className = rowClass;

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

${
  lead.followUpDate
  ? `
    <p class="
      text-xs
      mt-1
      font-medium
      ${
        new Date(lead.followUpDate) < new Date()
        ? "text-red-600"
        : "text-emerald-600"
      }
    ">
      Follow-up:
      ${lead.followUpDate}
    </p>
  `
  : ""
}

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

  <div class="space-y-2">

    <div>
      ${lead.stage || '-'}
    </div>

    ${
      lead.priority
      ? `
        <span class="
          text-xs
          px-2
          py-1
          rounded-full
          font-semibold

          ${
            lead.priority === "URGENT"
            ? "bg-red-600 text-white"

            : lead.priority === "HIGH"
            ? "bg-orange-500 text-white"

            : lead.priority === "MEDIUM"
            ? "bg-yellow-400 text-slate-900"

            : "bg-slate-200 text-slate-700"
          }
        ">
          ${lead.priority}
        </span>
      `
      : ""
    }

  </div>

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
  currentOpenLeadId = id;

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
    const aiReportSnapshot =
  await db
    .collection("ai_reports")
    .where("leadId", "==", id)
    .limit(1)
    .get();

let aiReport = null;

if (!aiReportSnapshot.empty) {

  aiReport =
    aiReportSnapshot.docs[0].data();
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
  ${
    aiReport
      ? `${aiReport?.systemSizeKw || "-"} kW`
      : "Not Generated"
  }
</p>
        </div>

        <div class="bg-emerald-50 rounded-2xl p-4">
          <p class="text-sm text-slate-500">
            Net Cost
          </p>

          <p class="text-2xl font-bold text-emerald-700 mt-2">
  ${
    aiReport
      ? `₹${aiReport?.netCost || 0}`
      : "Pending"
  }
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
          ${
  aiReport
    ? aiReport?.personaV2?.primary || "-"
    : "AI analysis pending"
}
        </p>

        <p>
          <span class="font-semibold">
            AI Score:
          </span>
          ${
  aiReport
    ? aiReport?.trustScore || 0
    : "Not Available"
}
        </p>

        <p>
          <span class="font-semibold">
            Lead Temperature:
          </span>
          ${
  aiReport
    ? aiReport?.personaV2?.leadTemperature || "-"
    : "Unknown"
}
        </p>

        <p>
          <span class="font-semibold">
            Financing:
          </span>
          ${
  aiReport
    ? aiReport?.personaV2?.financingLikelihood || "-"
    : "Unknown"
}
        </p>

    </div>

    <!-- OPS MANAGEMENT -->
    <div class="space-y-3 mt-6">

      <h3 class="text-lg font-bold text-slate-900">
        Ops Management
      </h3>

      <div class="bg-slate-50 rounded-2xl p-4 space-y-4">

        <!-- PRIORITY -->
        <div>

          <label class="text-sm font-semibold text-slate-700 block mb-2">
            Priority
          </label>

          <select
            id="opsPriority"
            class="w-full border border-slate-200 rounded-xl px-3 py-3">

            <option value="LOW"
              ${lead.priority === "LOW" ? "selected" : ""}>
              LOW
            </option>

            <option value="MEDIUM"
              ${lead.priority === "MEDIUM" || !lead.priority ? "selected" : ""}>
              MEDIUM
            </option>

            <option value="HIGH"
              ${lead.priority === "HIGH" ? "selected" : ""}>
              HIGH
            </option>

            <option value="URGENT"
              ${lead.priority === "URGENT" ? "selected" : ""}>
              URGENT
            </option>

          </select>

        </div>

        <!-- FOLLOW UP -->
        <div>

          <label class="text-sm font-semibold text-slate-700 block mb-2">
            Follow-up Date
          </label>

          <input
            id="followUpDate"
            type="date"
            value="${lead.followUpDate || ''}"
            class="w-full border border-slate-200 rounded-xl px-3 py-3">

        </div>

        <!-- NOTES -->
        <div>

          <label class="text-sm font-semibold text-slate-700 block mb-2">
            Ops Notes
          </label>

          <textarea
            id="opsNote"
            rows="4"
            class="w-full border border-slate-200 rounded-xl px-3 py-3"
            placeholder="Add follow-up notes...">${lead.opsNote || ""}</textarea>

        </div>

        <!-- SAVE -->
        <button
          onclick="saveOpsDetails('${lead.id}')"
          class="w-full bg-slate-900 hover:bg-slate-800 text-white py-3 rounded-xl font-semibold">

          Save Ops Details

        </button>

      </div>
<!-- NOTES SECTION -->
<div class="space-y-3 mt-6">

  <h3 class="text-lg font-bold text-slate-900">
    Ops Notes
  </h3>

  <div
    id="leadNotesList"
    class="space-y-2">
  </div>

  <textarea
    id="newLeadNote"
    rows="3"
    placeholder="Add internal ops note..."
    class="w-full border border-slate-300 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
  </textarea>

  <button
    id="saveLeadNoteBtn"
    class="bg-slate-900 text-white px-4 py-3 rounded-xl text-sm font-medium">
    Save Note
  </button>

</div>
    </div>

  `;
  renderLeadNotes(lead);
}

// =====================================
// RENDER NOTES
// =====================================

function renderLeadNotes(lead) {

  const notesList =
    document.getElementById(
      "leadNotesList"
    );

  if (!notesList) return;

  notesList.innerHTML = "";

  const notes =
    lead.notes || [];

  if (notes.length === 0) {

    notesList.innerHTML = `
      <div class="text-sm text-slate-400">
        No notes added yet
      </div>
    `;

    return;
  }

  notes.forEach((note) => {

    const item =
      document.createElement("div");

    item.className =
      "bg-slate-100 rounded-xl p-3 text-sm text-slate-700";

    item.innerHTML = `
  <div class="flex items-start justify-between gap-3">

    <div class="text-slate-700">
      ${note}
    </div>

    <div class="text-[10px] text-slate-400 whitespace-nowrap">
      OPS
    </div>

  </div>
`;

    notesList.appendChild(item);

  });
}


// =====================================
// SAVE OPS DETAILS
// =====================================

window.saveOpsDetails =
async function(id) {

  try {

    const priority =
      document.getElementById(
        "opsPriority"
      ).value;

    const followUpDate =
      document.getElementById(
        "followUpDate"
      ).value;

    const opsNote =
      document.getElementById(
        "opsNote"
      ).value;

    await db
      .collection("leads")
      .doc(id)
      .update({

        priority:
          priority,

        followUpDate:
          followUpDate,

        opsNote:
          opsNote,

        assignedTo:
          "Ops Team",

        updatedAt:
          new Date()

      });

    alert(
      "Ops details saved successfully"
    );

    // REFRESH LEADS
    loadLeads();

  }
  catch (error) {

    console.error(error);

    alert(
      "Failed to save ops details"
    );
  }
};

// =====================================
// START
// =====================================

// =====================================
// SAVE NOTE
// =====================================

document.addEventListener(
  "click",
  async function(event) {

    if (
      event.target.id !==
      "saveLeadNoteBtn"
    ) {
      return;
    }

    const textarea =
      document.getElementById(
        "newLeadNote"
      );

    const note =
      textarea.value.trim();

    if (!note) {

      alert("Enter note");

      return;
    }

    try {

      await db
        .collection("leads")
        .doc(currentOpenLeadId)
        .update({

          notes:
            firebase.firestore.FieldValue.arrayUnion(
              note
            ),

          updatedAt:
            new Date()

        });

      textarea.value = "";

      await loadLeads();

      await viewLead(
        currentOpenLeadId
      );

    }
    catch (error) {

      console.error(error);

      alert("Failed to save note");
    }

  }
);

loadLeads();
