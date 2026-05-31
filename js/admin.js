// ====================================
// GLOBALS
// ====================================
const LEAD_STATUSES = ["NEW", "REVIEWING", "CONTACTED", "QUALIFIED", "SHARED", "CLOSED", "REJECTED"];
const LEAD_STAGES = [
  "INITIAL", "AI_GENERATED", "SURVEY_REQUESTED", "SURVEY_COMPLETED", 
  "OFFER_GIVEN", "OFFER_ACCEPTED", "INSTALLATION_COMPLETED", 
  "SUBSIDY_CREDITED", "CLOSED_SUCCESS", "CLOSED_REJECTED"];

let allLeads = [];
let currentOpenLeadId = null;
let currentLeadRequestId = 0;

let lastVisibleDoc = null;
let firstVisibleDoc = null;

let currentPageLeads = [];

let selectedLeadIds = [];

const PAGE_SIZE = 20;

const db = window.db;


// =====================================
// FORMAT LEAD TIME
// =====================================

function formatLeadTime(timestamp) {

  const date =
    timestamp?.toDate
      ? timestamp.toDate()
      : new Date(timestamp);

  return date.toLocaleString(
    "en-IN",
    {
      day: "numeric",
      month: "short",
      hour: "numeric",
      minute: "2-digit"
    }
  );
}

// =====================================
// SEARCH LEADS
// =====================================

window.searchLeads = function() {

  const search =
    document.getElementById(
      "leadSearchInput"
    )
    .value
    .toLowerCase()
    .trim();

  if (!search) {

    renderLeads(currentPageLeads);

    return;
  }

  const filtered =
    currentPageLeads.filter((lead) => {

      return (
        (lead.name || "")
          .toLowerCase()
          .includes(search)

        ||

        (lead.phone || "")
          .toLowerCase()
          .includes(search)

        ||

        (lead.city || "")
          .toLowerCase()
          .includes(search)

        ||

        (lead.leadCode || "")
          .toLowerCase()
          .includes(search)
      );

    });

  renderLeads(filtered);

};

// =====================================
// TOGGLE LEAD SELECTION
// =====================================

window.toggleLeadSelection =
function(id) {

  if (
    selectedLeadIds.includes(id)
  ) {

    selectedLeadIds =
      selectedLeadIds.filter(
        l => l !== id
      );

  }
  else {

    selectedLeadIds.push(id);

  }
};

// =====================================
// SELECT ALL
// =====================================

window.toggleSelectAll =
function(isChecked) {

  if (isChecked) {

    selectedLeadIds =
      currentPageLeads.map(
        l => l.id
      );

  }
  else {

    selectedLeadIds = [];

  }

  renderLeads(currentPageLeads);

};

// =====================================
// CSV EXPORT
// =====================================

window.downloadSelectedLeadsCSV =
function() {

  const selectedLeads =
    currentPageLeads.filter(
      l => selectedLeadIds.includes(l.id)
    );

  if (selectedLeads.length === 0) {

    alert("Select leads first");

    return;
  }

  const headers = [
    "Lead Code",
    "Name",
    "Phone",
    "City",
    "Bill",
    "Status",
    "Priority",
    "Stage"
  ];

  const rows =
    selectedLeads.map((lead) => [

      lead.leadCode || "",
      lead.name || "",
      lead.phone || "",
      lead.city || "",
      lead.bill || "",
      lead.status || "",
      lead.priority || "",
      lead.stage || ""

    ]);

  const csvContent = [

    headers.join(","),

    ...rows.map(
      r => r.join(",")
    )

  ].join("\n");

  const blob =
    new Blob(
      [csvContent],
      {
        type: "text/csv"
      }
    );

  const url =
    URL.createObjectURL(blob);

  const a =
    document.createElement("a");

  a.href = url;

  a.download =
    "solar_leads.csv";

  a.click();

};

// =====================================
// WHATSAPP SHARE
// =====================================

window.shareSelectedLeadsWhatsApp =
function() {

  const selectedLeads =
    currentPageLeads.filter(
      l => selectedLeadIds.includes(l.id)
    );

  if (selectedLeads.length === 0) {

    alert("Select leads first");

    return;
  }

  let message = "";

  selectedLeads.forEach((lead) => {

    message +=
`Lead: ${lead.leadCode || ""}

Name: ${lead.name || ""}
Phone: ${lead.phone || ""}
City: ${lead.city || ""}
Bill: ₹${(lead.bill || 0).toLocaleString('en-IN')}
Status: ${lead.status || ""}
Priority: ${lead.priority || "-"}

-------------------------

`;

  });

  window.open(
    `https://wa.me/?text=${encodeURIComponent(message)}`,
    "_blank"
  );

};

// =====================================
// NEXT PAGE
// =====================================

window.loadNextPage =
async function() {

  if (!lastVisibleDoc) return;

  try {

    const snapshot =
      await db
        .collection("leads")
        .orderBy("createdAt", "desc")
        .startAfter(lastVisibleDoc)
        .limit(PAGE_SIZE)
        .get();

    if (snapshot.empty) {

      alert("No more leads");

      return;
    }

    allLeads = [];

    snapshot.forEach((docItem) => {

      allLeads.push({
        id: docItem.id,
        ...docItem.data()
      });

    });

    currentPageLeads = allLeads;

    firstVisibleDoc =
      snapshot.docs[0];

    lastVisibleDoc =
      snapshot.docs[
        snapshot.docs.length - 1
      ];

    renderLeads(allLeads);

    updateMetrics(allLeads);

  }
  catch (error) {

    console.error(error);

    alert("Failed loading next page");

  }

};

// =====================================
// PREVIOUS PAGE
// =====================================

window.loadPreviousPage = async function() {
  if (!firstVisibleDoc) return;

  try {
    // Fetch records ending before the current first visible document
    const snapshot = await db
      .collection("leads")
      .orderBy("createdAt", "desc")
      .endBefore(firstVisibleDoc)
      .limitToLast(PAGE_SIZE)
      .get();

    if (snapshot.empty) {
      alert("No previous pages");
      return;
    }

    // Rebuild the leads array
    allLeads = [];
    snapshot.forEach((docItem) => {
      allLeads.push({ id: docItem.id, ...docItem.data() });
    });

    currentPageLeads = allLeads;

    // Update cursors
    firstVisibleDoc = snapshot.docs[0];
    lastVisibleDoc = snapshot.docs[snapshot.docs.length - 1];

    // Render
    renderLeads(allLeads);
    updateMetrics(allLeads);
    
    document.getElementById("paginationInfo").innerText = 
      `Showing previous page (${allLeads.length} leads)`;

  } catch (error) {
    console.error("Error loading previous page:", error);
    alert("Failed to load previous page");
  }
};

// =====================================
// LOAD LEADS
// =====================================

window.loadLeads = async function() {

  try {

    const snapshot = await db
      .collection("leads")
      .orderBy("createdAt", "desc")
      .limit(PAGE_SIZE)
      .get();

    allLeads = [];

    snapshot.forEach((docItem) => {

      allLeads.push({
        id: docItem.id,
        ...docItem.data()
      });

    });

    currentPageLeads = allLeads;

    firstVisibleDoc =
      snapshot.docs[0] || null;

    lastVisibleDoc =
      snapshot.docs[
        snapshot.docs.length - 1
      ] || null;

    renderLeads(allLeads);

    updateMetrics(allLeads);

    document.getElementById(
      "paginationInfo"
    ).innerText =
      `Showing ${allLeads.length} latest leads`;

  }
  catch (error) {

    console.error(
      "LOAD LEADS ERROR:",
      error
    );

    alert(
      "Failed to load leads"
    );
  }
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
  
  const today =
  new Date().toISOString().split("T")[0];

const isOverdue =
  lead.followUpDate &&
  lead.followUpDate < today;

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

  <input
    type="checkbox"
    ${
      selectedLeadIds.includes(lead.id)
      ? "checked"
      : ""
    }
    onchange="toggleLeadSelection('${lead.id}')"
  >

</td>

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

<p class="text-xs text-indigo-500 mt-1">
  ${
    lead.createdAt
    ? formatLeadTime(lead.createdAt)
    : ""
  }
</p>

${
  lead.followUpDate
  ? `
    <p class="
      text-xs
      mt-1
      font-medium
      ${
  lead.followUpDate < today
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
       ₹${(lead.bill || 0).toLocaleString('en-IN')}
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

<td class="px-4 py-4 align-middle">
  <select
    onchange="updateLeadField('${lead.id}', 'stage', this.value)"
    class="border rounded-lg px-2 py-1 text-xs w-[150px]">
    ${LEAD_STAGES.map(s => `
      <option value="${s}" ${lead.stage === s ? 'selected' : ''}>${s}</option>
    `).join('')}
  </select>
</td>

<td class="px-4 py-4 align-middle">
  <div class="flex flex-col gap-2">
    <select
      onchange="updateLeadField('${lead.id}', 'status', this.value)"
      class="border rounded-lg px-2 py-1 text-xs w-[120px]">
      ${LEAD_STATUSES.map(s => `
        <option value="${s}" ${lead.status === s ? 'selected' : ''}>${s}</option>
      `).join('')}
    </select>
    
    ${lead.priority ? `
      <span class="text-[10px] px-2 py-0.5 rounded-full font-semibold text-center w-fit ${
        lead.priority === "URGENT" ? "bg-red-600 text-white" :
        lead.priority === "HIGH" ? "bg-orange-500 text-white" :
        lead.priority === "MEDIUM" ? "bg-yellow-400 text-slate-900" :
        "bg-slate-200 text-slate-700"
      }">
        ${lead.priority}
      </span>
    ` : ""}
  </div>
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
window.updateLeadField = async function(id, field, value) {
  try {
    const batch = db.batch();
    const leadRef = db.collection("leads").doc(id);
    const surveyRef = db.collection("survey_requests").doc(id);

    // 1. Update the primary lead document
    const updateData = {
      updatedAt: new Date(),
      timeline: firebase.firestore.FieldValue.arrayUnion({
        type: "FIELD_UPDATED",
        message: `${field} changed to ${value}`,
        createdAt: new Date().toISOString()
      })
    };
    updateData[field] = value;
    batch.update(leadRef, updateData);

    // 2. Conditional Sync: Update Survey Request Status if needed
if (field === 'stage') {
  // Sync logic: If stage is CLOSED_REJECTED, update/create survey_request status
  if (value === 'CLOSED_REJECTED') {
    batch.set(surveyRef, { status: 'rejected' }, { merge: true });
  } 
  // If stage is SURVEY_COMPLETED, update/create survey_request status
  else if (value === 'SURVEY_COMPLETED') {
    batch.set(surveyRef, { status: 'completed' }, { merge: true });
  }
}

    await batch.commit();
    
    alert(`Lead ${field} updated successfully.`);
    await loadLeads(); // Refresh table
  } catch (error) {
    console.error("Update failed:", error);
    alert(`Failed to update ${field}.`);
  }
};

// =====================================
// OPEN LEAD PANEL
// =====================================

window.viewLead = async function(id) {
  
  const requestId = ++currentLeadRequestId;
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

if (requestId !== currentLeadRequestId) {
  return;
}
    renderLeadPanel(
      lead,
      aiReport
    );

  }
  catch (error) {

    console.error(error);

    if (requestId !== currentLeadRequestId) {
  return;
}

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
          ₹${(lead.bill || 0).toLocaleString('en-IN')}
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
      ? `â¹${aiReport?.netCost || 0}`
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
        
        <!-- SAVE -->
        <button
          onclick="saveOpsDetails('${lead.id}')"
          class="w-full bg-slate-900 hover:bg-slate-800 text-white py-3 rounded-xl font-semibold">

          Save Ops Details

        </button>

      </div>
<!-- NOTES SECTION -->
<!-- TIMELINE -->
<div class="space-y-3 mt-6">

  <h3 class="text-lg font-bold text-slate-900">
    Activity Timeline
  </h3>

  <div
    id="leadTimeline"
    class="space-y-3">
  </div>

</div>
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
  renderTimeline(lead);
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
// RENDER TIMELINE
// =====================================

function renderTimeline(lead) {

  const timelineContainer =
    document.getElementById(
      "leadTimeline"
    );

  if (!timelineContainer) return;

  timelineContainer.innerHTML = "";

  const timeline = [];

// LEAD CREATED
if (lead.createdAt) {

  timeline.push({
    type: "CREATED",
    message:
      `Lead created from ${lead.leadSource || "Website"}`,
    createdAt:
      lead.createdAt?.toDate
        ? lead.createdAt.toDate()
        : lead.createdAt
  });

}

// MANUAL TIMELINE EVENTS
if (lead.timeline?.length) {

  lead.timeline.forEach((item) => {
timeline.push({
  ...item,
  createdAt:
    item.createdAt?.toDate
      ? item.createdAt.toDate()
      : item.createdAt
});
  });

}


  if (timeline.length === 0) {

    timelineContainer.innerHTML = `
      <div class="text-sm text-slate-400">
        No timeline activity available
      </div>
    `;

    return;
  }

  const sortedTimeline =
  [...timeline].sort((a, b) => {

    const dateA =
      a.createdAt?.seconds
        ? a.createdAt.seconds * 1000
        : new Date(a.createdAt).getTime();

    const dateB =
      b.createdAt?.seconds
        ? b.createdAt.seconds * 1000
        : new Date(b.createdAt).getTime();

    return dateB - dateA;

  });

  sortedTimeline.forEach((item) => {

    const timelineItem =
      document.createElement("div");

    timelineItem.className =
      "border border-slate-200 rounded-xl p-4 bg-white";

    timelineItem.innerHTML = `

      <div class="flex items-start justify-between gap-3">

        <div>

          <div class="text-sm font-semibold text-slate-800">

  ${
  item.type === "NOTE_ADDED"
    ? "Note Added"

  : item.type === "OPS_UPDATE"
    ? "Ops Updated"

  : item.type === "CREATED"
    ? "Lead Created"

  : item.type === "QUALIFIED"
    ? "AI Analysis Completed"

  : item.type === "STATUS_CHANGED"
    ? "Status Updated"

  : item.type || "Update"
}
          </div>

          <div class="text-sm text-slate-600 mt-1">
            ${item.message || ""}
          </div>

        </div>

        <div class="text-xs text-slate-400 whitespace-nowrap">
          
          ${
  item.createdAt
  ? new Date(
      item.createdAt?.seconds
        ? item.createdAt.seconds * 1000
        : item.createdAt
    ).toLocaleString(
      "en-IN",
      {
        timeZone: "Asia/Kolkata",
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit"
      }
    )
  : ""
}

        </div>

      </div>
    `;

    timelineContainer.appendChild(
      timelineItem
    );

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

const leadDoc =
  await db
    .collection("leads")
    .doc(id)
    .get();

const existingTimeline =
  leadDoc.data()?.timeline || [];

existingTimeline.push({

  type: "OPS_UPDATE",

  message:
    `Priority changed to ${priority}${
      followUpDate
      ? ` â¢ Follow-up: ${followUpDate}`
      : ""
    }`,

  createdAt:
    new Date().toISOString()

});

    await db
      .collection("leads")
      .doc(id)
      .update({

        priority:
          priority,

        followUpDate:
          followUpDate,

        assignedTo:
          "Ops Team",

        updatedAt:
  new Date(),

timeline:
  existingTimeline

      });

    alert(
      "Ops details saved successfully"
    );

    // REFRESH LEADS
    await loadLeads();

const updatedLead =
  allLeads.find(
    l => l.id === id
  );

if (updatedLead) {

  renderTimeline(updatedLead);
}

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
  new Date(),

timeline:
  firebase.firestore.FieldValue.arrayUnion({

    type: "NOTE_ADDED",

    message:
      note,

    createdAt:
      new Date().toISOString()

  })

        });

      textarea.value = "";

      await loadLeads();

      const updatedLead =
  allLeads.find(
    l => l.id === currentOpenLeadId
  );

if (updatedLead) {

  renderLeadNotes(updatedLead);

  renderTimeline(updatedLead);
}

    }
    catch (error) {

      console.error(error);

      alert("Failed to save note");
    }

  }
);

//loadLeads();
