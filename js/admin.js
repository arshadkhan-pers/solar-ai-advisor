// ====================================
// GLOBALS
// ====================================
const LEAD_STATUSES = ["NEW", "REVIEWING", "CONTACTED", "QUALIFIED", "SHARED", "CLOSED", "REJECTED"];
const LEAD_STAGES = ["INITIAL", "AI_GENERATED", "SURVEY_REQUESTED", "SURVEY_COMPLETED", "OFFER_GIVEN", "OFFER_UNDER_REVIEW", "OFFER_REJECTED", "OFFER_ACCEPTED", "AGREEMENT_SIGNED", "NET_METERING_APPLIED", "INSTALLATION_COMPLETED", "SUBSIDY_CREDITED", "CLOSED_SUCCESS", "CLOSED_REJECTED"];

let allLeads = [];
let currentOpenLeadId = null;
let currentLeadRequestId = 0;

let lastVisibleDoc = null;
let firstVisibleDoc = null;

let currentPageLeads = [];
let selectedLeadIds = [];

const PAGE_SIZE = 20;
const db = window.db;

// Pagination state variables
let currentPage = 1;
let totalPages = 1;

// Sync state changes smoothly to UI controls
function updatePaginationUI() {
  const prevBtn = document.getElementById("prevPageBtn");
  const nextBtn = document.getElementById("nextPageBtn");
  const infoSpan = document.getElementById("paginationInfo");

  if (infoSpan) {
    infoSpan.innerText = `Page ${currentPage} of ${totalPages}`;
  }
  if (prevBtn) {
    prevBtn.disabled = (currentPage === 1);
  }
  if (nextBtn) {
    nextBtn.disabled = (currentPage >= totalPages);
  }
}

// =====================================
// TOAST NOTIFICATIONS
// =====================================
function showToast(message, isError = false) {
  let toastContainer = document.getElementById("toast-container");
  if (!toastContainer) {
    toastContainer = document.createElement("div");
    toastContainer.id = "toast-container";
    toastContainer.className = "fixed bottom-5 right-5 z-50 flex flex-col gap-2";
    document.body.appendChild(toastContainer);
  }

  const toast = document.createElement("div");
  toast.className = `px-4 py-3 rounded-xl text-xs font-semibold shadow-lg text-white transition-all duration-300 transform translate-y-2 opacity-0 ${
    isError ? "bg-red-600" : "bg-slate-900"
  }`;
  toast.innerText = message;

  toastContainer.appendChild(toast);

  // Trigger animation
  setTimeout(() => {
    toast.classList.remove("translate-y-2", "opacity-0");
  }, 10);

  // Remove toast after 3 seconds
  setTimeout(() => {
    toast.classList.add("opacity-0", "translate-y-2");
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}


// =====================================
// FORMAT LEAD TIME
// =====================================
function formatLeadTime(timestamp) {
  const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit"
  });
}

// =====================================
// IMAGE ASSET ERROR FALLBACK HANDLING
// =====================================
window.handleImageLoadError = function(imgEl, type) {
  if (!imgEl || !imgEl.parentElement) return;
  
  const isBill = type === 'bill';
  const icon = isBill ? '📄' : '📋';
  const title = isBill ? 'PDF Document Format' : 'PDF Proposal Format';
  const instruction = isBill ? 'Click Open Full above to read' : 'Click View Document above to read';

  imgEl.parentElement.innerHTML = `
    <div class="text-center py-6 text-slate-500 font-medium text-xs flex flex-col items-center gap-2 w-full">
      <span class="text-3xl">${icon}</span>
      ${title}
      <span class="text-[10px] text-slate-400 px-2 py-0.5 border rounded-md bg-white shadow-xs">
        ${instruction}
      </span>
    </div>
  `;
};

// =====================================
// STORAGE ASSET RESOLVER (SECURED AGAINST RACE CONDITIONS & CRASHES)
// =====================================
function resolveStorageAsset(storageUrl, leadId, imgElementId, linkElementIds) {
  if (!storageUrl) return;

  const applyUrls = (resolvedUrl) => {
    // 🛡️ Fix Issue 1: Guard against race conditions if user switches panels mid-flight
    if (currentOpenLeadId !== leadId) {
      //console.log(`⚠️ Aborted asset paint: Stale asset returned for Lead ${leadId}, but current view is ${currentOpenLeadId}`);
      return;
    }

    const imgEl = document.getElementById(imgElementId);
    if (imgEl) imgEl.src = resolvedUrl;

    linkElementIds.forEach(id => {
      const linkEl = document.getElementById(id);
      if (linkEl) {
        linkEl.href = resolvedUrl;
        linkEl.classList.remove("opacity-50", "pointer-events-none");
        if (id.includes("open-btn")) {
          linkEl.innerText = id.includes("bill") ? "Open Full ↗" : "View Document ↗";
        }
      }
    });
  };

  // If it's already an active web link, apply instantly
  if (!storageUrl.startsWith("gs://")) {
    applyUrls(storageUrl);
    return;
  }

  // 🛡️ Fix Issue 2: Defensive check to prevent runtime crashes if Storage SDK fails to load
  if (!window.firebase?.storage) {
    console.error("❌ Firebase Storage SDK is completely unavailable or uninitialized.");
    linkElementIds.forEach(id => {
      const linkEl = document.getElementById(id);
      if (linkEl) {
        linkEl.innerText = "SDK Error";
        linkEl.classList.remove("opacity-50");
      }
    });
    return;
  }

  // Request tokenized secure path via Firebase Storage SDK using active session
  window.firebase.storage().refFromURL(storageUrl).getDownloadURL()
    .then((downloadUrl) => {
      applyUrls(downloadUrl);
    })
    .catch((error) => {
      console.error("Stitage asset load failed");
      if (currentOpenLeadId !== leadId) return; // Strict isolation on error paths too
      linkElementIds.forEach(id => {
        const linkEl = document.getElementById(id);
        if (linkEl) {
          linkEl.innerText = "Error Loading";
        }
      });
    });
}

// =====================================
// SEARCH LEADS
// =====================================
window.searchLeads = function() {
  const search = document.getElementById("leadSearchInput").value.toLowerCase().trim();

  if (!search) {
    renderLeads(currentPageLeads);
    return;
  }

  const filtered = currentPageLeads.filter((lead) => {
    return (
      (lead.name || "").toLowerCase().includes(search) ||
      (lead.phone || "").toLowerCase().includes(search) ||
      (lead.city || "").toLowerCase().includes(search) ||
      (lead.leadCode || "").toLowerCase().includes(search)
    );
  });

  renderLeads(filtered);
};

// =====================================
// TOGGLE LEAD SELECTION
// =====================================
window.toggleLeadSelection = function(id) {
  if (selectedLeadIds.includes(id)) {
    selectedLeadIds = selectedLeadIds.filter(l => l !== id);
  } else {
    selectedLeadIds.push(id);
  }
};

// =====================================
// SELECT ALL
// =====================================
window.toggleSelectAll = function(isChecked) {
  if (isChecked) {
    selectedLeadIds = currentPageLeads.map(l => l.id);
  } else {
    selectedLeadIds = [];
  }
  renderLeads(currentPageLeads);
};

// =====================================
// CSV EXPORT
// =====================================
window.downloadSelectedLeadsCSV = function() {
  const selectedLeads = currentPageLeads.filter(l => selectedLeadIds.includes(l.id));

  if (selectedLeads.length === 0) {
    showToast("Select leads first", true);
    return;
  }

  const headers = ["Lead Code", "Name", "Phone", "City", "Bill", "Status", "Priority", "Stage"];
  const rows = selectedLeads.map((lead) => [
    lead.leadCode || "",
    lead.name || "",
    lead.phone || "",
    lead.city || "",
    lead.bill || "",
    lead.status || "",
    lead.priority || "",
    lead.stage || ""
  ]);

  const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
  const blob = new Blob([csvContent], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");

  a.href = url;
  a.download = "solar_leads.csv";
  a.click();
};

// =====================================
// WHATSAPP SHARE
// =====================================
window.shareSelectedLeadsWhatsApp = function() {
  const selectedLeads = currentPageLeads.filter(l => selectedLeadIds.includes(l.id));

  if (selectedLeads.length === 0) {
    showToast("Select leads first", true);
    return;
  }

  let message = "";
  selectedLeads.forEach((lead) => {
    message += `Lead: ${lead.leadCode || ""}\n\nName: ${lead.name || ""}\nPhone: ${lead.phone || ""}\nCity: ${lead.city || ""}\nBill: ₹${(lead.bill || 0).toLocaleString('en-IN')}\nStatus: ${lead.status || ""}\nPriority: ${lead.priority || "-"}\n\n-------------------------\n\n`;
  });

  window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank");
};

// =====================================
// LOAD LEADS (Initial Page 1 Load)
// =====================================
window.loadLeads = async function() {
  try {
    currentPage = 1;

    // Get the total size of the collection safely for the web compat SDK
    const totalSnapshot = await db.collection("leads").get();
    const totalLeads = totalSnapshot.size;
    totalPages = Math.ceil(totalLeads / PAGE_SIZE) || 1;

    // Optional: Sync the top right text element "0 Leads" if present in your HTML
    const totalCounterEl = document.getElementById("totalLeadsCount");
    if (totalCounterEl) {
      totalCounterEl.innerText = `${totalLeads} Leads`;
    }

    // Fetch only the first page items
    const snapshot = await db
      .collection("leads")
      .orderBy("createdAt", "desc")
      .limit(PAGE_SIZE)
      .get();

    allLeads = [];
    snapshot.forEach((docItem) => {
      allLeads.push({ id: docItem.id, ...docItem.data() });
    });

    currentPageLeads = allLeads;
    firstVisibleDoc = snapshot.docs[0] || null;
    lastVisibleDoc = snapshot.docs[snapshot.docs.length - 1] || null;

    renderLeads(allLeads);
    updateMetrics(allLeads);
    updatePaginationUI();
  } catch (error) {
    console.error("LOAD LEADS ERROR");
    showToast("Failed to load leads", true);
  }
};

// =====================================
// NEXT PAGE
// =====================================
window.loadNextPage = async function() {
  if (!lastVisibleDoc || currentPage >= totalPages) return;

  try {
    const snapshot = await db
      .collection("leads")
      .orderBy("createdAt", "desc")
      .startAfter(lastVisibleDoc)
      .limit(PAGE_SIZE)
      .get();

    if (snapshot.empty) {
      showToast("No more leads available");
      return;
    }

    currentPage++;

    allLeads = [];
    snapshot.forEach((docItem) => {
      allLeads.push({ id: docItem.id, ...docItem.data() });
    });

    currentPageLeads = allLeads;
    firstVisibleDoc = snapshot.docs[0];
    lastVisibleDoc = snapshot.docs[snapshot.docs.length - 1];

    renderLeads(allLeads);
    updateMetrics(allLeads);
    updatePaginationUI();
  } catch (error) {
    console.error("Failed loading next page");
    showToast("Failed loading next page", true);
  }
};

// =====================================
// PREVIOUS PAGE
// =====================================
window.loadPreviousPage = async function() {
  if (!firstVisibleDoc || currentPage <= 1) return;

  try {
    const snapshot = await db
      .collection("leads")
      .orderBy("createdAt", "desc")
      .endBefore(firstVisibleDoc)
      .limitToLast(PAGE_SIZE)
      .get();

    if (snapshot.empty) {
      showToast("No previous pages");
      return;
    }

    currentPage--;

    allLeads = [];
    snapshot.forEach((docItem) => {
      allLeads.push({ id: docItem.id, ...docItem.data() });
    });

    currentPageLeads = allLeads;
    firstVisibleDoc = snapshot.docs[0];
    lastVisibleDoc = snapshot.docs[snapshot.docs.length - 1];

    renderLeads(allLeads);
    updateMetrics(allLeads);
    updatePaginationUI();
  } catch (error) {
    console.error("Error loading previous page");
    showToast("Failed to load previous page", true);
  }
};

// =====================================
// UPDATE PAGINATION UI STATE
// =====================================
function updatePaginationUI() {
  const prevBtn = document.getElementById("prevPageBtn");
  const nextBtn = document.getElementById("nextPageBtn");
  const infoSpan = document.getElementById("paginationInfo");

  if (infoSpan) {
    infoSpan.innerText = `Page ${currentPage} of ${totalPages}`;
  }
  if (prevBtn) {
    prevBtn.disabled = (currentPage === 1);
  }
  if (nextBtn) {
    nextBtn.disabled = (currentPage >= totalPages);
  }
}

// =====================================
// METRICS
// =====================================
function updateMetrics(leads) {
  document.getElementById("totalLeadsCount").innerText = `${leads.length} Leads`;
  document.getElementById("newCount").innerText = leads.filter(l => l.status === "NEW" || l.status === "New").length;
  document.getElementById("hotCount").innerText = leads.filter(l => l.leadType === "Hot").length;
  document.getElementById("qualifiedCount").innerText = leads.filter(l => l.status === "QUALIFIED").length;
  document.getElementById("contactedCount").innerText = leads.filter(l => l.status === "CONTACTED").length;
  document.getElementById("sharedCount").innerText = leads.filter(l => l.status === "SHARED").length;
}

// =====================================
// RENDER LEADS
// =====================================
function renderLeads(leads) {
  const tableBody = document.getElementById("leadsTableBody");
  tableBody.innerHTML = "";

  leads.forEach((lead) => {
    const row = document.createElement("tr");
    let rowClass = "border-b hover:bg-slate-50";
    const today = new Date().toISOString().split("T")[0];
    const isOverdue = lead.followUpDate && lead.followUpDate < today;

    if (lead.priority === "URGENT" || isOverdue) {
      rowClass += " bg-red-50 border-l-4 border-red-500";
    } else if (lead.priority === "HIGH") {
      rowClass += " bg-orange-50 border-l-4 border-orange-500";
    } else if (lead.priority === "MEDIUM") {
      rowClass += " bg-yellow-50 border-l-4 border-yellow-500";
    }

    const hasQuoteFile = lead.quoteUrl || lead.quote;

    row.className = rowClass;
    row.innerHTML = `
      <td class="px-4 py-4">
        <input type="checkbox" ${selectedLeadIds.includes(lead.id) ? "checked" : ""} onchange="toggleLeadSelection('${lead.id}')">
      </td>
      <td class="px-4 py-4">
        <div>
          <p class="font-semibold">${lead.name || "N/A"}</p>
          <p class="text-xs text-gray-500 mt-1">${lead.phone || ""}</p>
          <p class="text-xs text-gray-400 mt-1">${lead.leadCode || ""}</p>
          <p class="text-xs text-indigo-500 mt-1">${lead.createdAt ? formatLeadTime(lead.createdAt) : ""}</p>
          ${hasQuoteFile ? `
            <div class="mt-1">
              <span class="inline-flex items-center gap-1 text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-md border border-emerald-200 shadow-sm">
                📄 Offer Uploaded
              </span>
            </div>
          ` : ""}
          ${lead.followUpDate ? `
            <p class="text-xs mt-1 font-medium ${lead.followUpDate < today ? "text-red-600" : "text-emerald-600"}">
              Follow-up: ${lead.followUpDate}
            </p>
          ` : ""}
        </div>
      </td>
      <td class="px-4 py-4">${lead.city || "-"}</td>
      <td class="px-4 py-4">₹${(lead.bill || 0).toLocaleString('en-IN')}</td>
      <td class="px-4 py-4">
        <span class="px-2 py-1 rounded-lg text-xs font-semibold ${lead.leadType === 'Hot' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-700'}">
          ${lead.leadType || '-'}
        </span>
      </td>
      <td class="px-4 py-4 align-middle">
        <select id="stage-select-${lead.id}" onchange="updateLeadField('${lead.id}', 'stage', this.value)" class="border rounded-lg px-2 py-1 text-xs w-[150px]">
          ${LEAD_STAGES.map(s => `<option value="${s}" ${lead.stage === s ? 'selected' : ''}>${s}</option>`).join('')}
        </select>
      </td>
      <td class="px-4 py-4 align-middle">
        <div class="flex flex-col gap-2">
          <select id="status-select-${lead.id}" onchange="updateLeadField('${lead.id}', 'status', this.value)" class="border rounded-lg px-2 py-1 text-xs w-[100px]">
            ${LEAD_STATUSES.map(s => `<option value="${s}" ${lead.status === s ? 'selected' : ''}>${s}</option>`).join('')}
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
        <button onclick="viewLead('${lead.id}')" class="bg-slate-900 text-white px-3 py-2 rounded-lg text-xs">View</button>
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
    renderLeads(allLeads.filter(l => l.leadType === "Hot"));
    return;
  }
  renderLeads(allLeads.filter(l => l.status === type));
};

// =====================================
// UPDATE STATUS (WITH SMART SYNC)
// =====================================
window.updateLeadField = async function(id, field, value) {
  try {
    const batch = db.batch();
    const leadRef = db.collection("leads").doc(id);
    const surveyRef = db.collection("survey_requests").doc(id);

    const timelineUpdate = {
        type: "FIELD_UPDATED",
        message: `${field.replace(/([A-Z])/g, ' $1')} changed to ${value}`,
        createdAt: new Date().toISOString()
    };

    const updateData = {
      updatedAt: new Date(),
      timeline: firebase.firestore.FieldValue.arrayUnion(timelineUpdate)
    };
    
    updateData[field] = value;

    if (field === 'quoteVerificationStatus') {
      let newStage = null;
      if (value === 'VERIFIED_TIER1_COMPLIANT') {
        newStage = 'OFFER_ACCEPTED';
      } else if (value.startsWith('REJECTED_')) {
        newStage = 'OFFER_REJECTED';
      } else if (value === 'PENDING_REVIEW') {
        newStage = 'OFFER_UNDER_REVIEW';
      }
      
      if (newStage) {
        updateData.stage = newStage;
        updateData.timeline = firebase.firestore.FieldValue.arrayUnion(
            timelineUpdate,
            {
                type: "STATUS_CHANGED",
                message: `Stage automatically synchronized to ${newStage}`,
                createdAt: new Date().toISOString()
            }
        );
      }
    }

    batch.update(leadRef, updateData);

    if (field === 'stage') {
      if (value === 'CLOSED_REJECTED') {
        batch.set(surveyRef, { status: 'rejected' }, { merge: true });
      } else if (value === 'SURVEY_COMPLETED') {
        batch.set(surveyRef, { status: 'completed' }, { merge: true });
      }
    }

    await batch.commit();

    const localLead = currentPageLeads.find(l => l.id === id);
    if (localLead) {
      localLead[field] = value;
      if (updateData.stage) localLead.stage = updateData.stage;
      renderLeads(currentPageLeads);
      updateMetrics(currentPageLeads);
    }

    showToast("Lead updated successfully");
  } catch (error) {
    console.error("Update failed:", error);
    showToast(`Failed to update ${field}`, true);
  }
};


// =====================================
// REAL-TIME ADMIN STREAM
// =====================================
window.leadUpdatesUnsubscribe = window.leadUpdatesUnsubscribe || null;
let currentOpenLeadAiReport = null;

function setupRealTimeTimeline(explicitLeadId) {
    if (!explicitLeadId) return;

    if (window.leadUpdatesUnsubscribe) {
        window.leadUpdatesUnsubscribe();
    }

    window.leadUpdatesUnsubscribe = db.collection("leads").doc(explicitLeadId)
        .onSnapshot((doc) => {
            if (doc.exists) {
                const data = doc.data();
                const refreshedLead = { id: explicitLeadId, ...data };
                
                const idx = allLeads.findIndex(l => l.id === explicitLeadId);
                if (idx > -1) allLeads[idx] = refreshedLead;

                const pageIdx = currentPageLeads.findIndex(l => l.id === explicitLeadId);
                if (pageIdx > -1) {
                    currentPageLeads[pageIdx] = refreshedLead;
                    renderLeads(currentPageLeads);
                    updateMetrics(currentPageLeads);
                }
                
                if (currentOpenLeadId === explicitLeadId) {
                    renderLeadPanel(refreshedLead, currentOpenLeadAiReport);
                }
            }
        }, (error) => {
            console.error("Admin real-time timeline subscription failed");
        });
}

// =====================================
// OPEN LEAD PANEL
// =====================================
window.viewLead = async function(id) {
  const requestId = ++currentLeadRequestId;
  currentOpenLeadId = id;
  currentOpenLeadAiReport = null;

  document.getElementById("leadPanelOverlay").classList.remove("hidden");
  const panel = document.getElementById("leadDetailsPanel");
  panel.classList.remove("translate-x-full");
  
  document.getElementById("leadPanelContent").innerHTML = `
    <div class="text-center py-10 text-slate-500">Loading lead details...</div>
  `;

  const cachedLead = allLeads.find(l => l.id === id);
  if (cachedLead) {
    document.getElementById("panelLeadCode").innerText = cachedLead.leadCode || "";
  }

  try {
    const aiReportSnapshot = await db
      .collection("ai_reports")
      .where("leadId", "==", id)
      .limit(1)
      .get();

    let aiReport = null;
    if (!aiReportSnapshot.empty) {
      aiReport = aiReportSnapshot.docs[0].data();
    }

    if (requestId !== currentLeadRequestId) return;
    
    currentOpenLeadAiReport = aiReport;
    setupRealTimeTimeline(id);

  } catch (error) {
    console.error("Lead panel load failed");
    if (requestId !== currentLeadRequestId) return;
    document.getElementById("leadPanelContent").innerHTML = `
      <div class="text-red-600">Failed to load AI report</div>
    `;
  }
};


// =====================================
// CLOSE PANEL
// =====================================
window.closeLeadPanel = function() {
  document.getElementById("leadPanelOverlay").classList.add("hidden");
  document.getElementById("leadDetailsPanel").classList.add("translate-x-full");
    
  if (window.leadUpdatesUnsubscribe) {
      window.leadUpdatesUnsubscribe();
      window.leadUpdatesUnsubscribe = null;
      console.log("🛑 Admin detached real-time stream listener.");
  }
  currentOpenLeadId = null;
};

// =====================================
// RENDER PANEL (SECURED WITH ASYNC TOKENS & ID BINDING)
// =====================================
function renderLeadPanel(lead, aiReport) {
  const content = document.getElementById("leadPanelContent");
  if (!content) return;

  const unsavedNoteText = document.getElementById("newLeadNote")?.value || "";

  // Support alternate property naming schemas across database migrations safely
  const rawBillFile = lead.billUrl || lead.billFile;
  const rawQuoteFile = lead.quoteUrl || lead.quote;

  content.innerHTML = `
    <div class="space-y-2">
      <h3 class="text-lg font-bold text-slate-900">Customer Information</h3>
      <div class="bg-slate-50 rounded-2xl p-4 space-y-2">
        <p><span class="font-semibold">Name:</span> ${lead.name || "-"}</p>
        <p><span class="font-semibold">Phone:</span> ${lead.phone || "-"}</p>
        <p><span class="font-semibold">City:</span> ${lead.city || "-"}</p>
        <p><span class="font-semibold">Bill:</span> ₹${(lead.bill || 0).toLocaleString('en-IN')}</p>
      </div>
    </div>

    <div class="space-y-2 mt-4">
      <h3 class="text-lg font-bold text-slate-900">Electricity Bill Verification</h3>
      <div class="bg-slate-50 rounded-2xl p-4 space-y-3">
        ${rawBillFile ? `
          <div class="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-3 transition-all duration-200 hover:border-slate-300">
            <div class="flex items-center justify-between gap-3">
              <div class="flex items-center gap-3">
                <div class="w-11 h-11 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-xl shrink-0 shadow-sm">
                  ⚡
                </div>
                <div>
                  <p class="text-sm font-semibold text-slate-800">Uploaded Bill Statement</p>
                  <p class="text-xs text-slate-400">Cross-reference consumption history</p>
                </div>
              </div>
              <a id="admin-bill-open-btn" href="#" target="_blank" class="bg-slate-900 hover:bg-slate-800 text-white text-xs px-3.5 py-2 rounded-xl font-semibold shadow-sm transition-all duration-150 inline-flex items-center gap-1 opacity-50 pointer-events-none">
                Connecting...
              </a>
            </div>
            
            <div class="relative group rounded-xl overflow-hidden border border-slate-100 bg-slate-50 aspect-[4/3] flex items-center justify-center max-h-[160px] shadow-inner">
              <img id="admin-bill-preview-img" src="" 
                   alt="Customer Bill Preview" 
                   class="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300" 
                   onerror="handleImageLoadError(this, 'bill')"/>
              <div class="absolute inset-0 bg-slate-900/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[1px]">
                <a id="admin-bill-expand-btn" href="#" target="_blank" class="bg-white/95 text-slate-900 text-xs font-semibold px-3 py-1.5 rounded-lg shadow-md transition transform scale-95 group-hover:scale-100 opacity-50 pointer-events-none">
                  Expand Document
                </a>
              </div>
            </div>
          </div>
        ` : `
          <div class="text-center py-6 bg-white border border-dashed border-slate-200 rounded-xl">
            <p class="text-sm text-slate-400 font-medium">No utility bill uploaded yet</p>
            <p class="text-[11px] text-slate-400 mt-0.5">Awaiting raw statement from customer flow</p>
          </div>
        `}
      </div>
    </div>

    <div class="space-y-2 mt-4">
      <h3 class="text-lg font-bold text-slate-900">Solar Recommendation</h3>
      <div class="grid grid-cols-2 gap-3">
        <div class="bg-indigo-50 rounded-2xl p-4">
          <p class="text-sm text-slate-500">System Size</p>
          <p class="text-2xl font-bold text-indigo-700 mt-2">${aiReport ? `${aiReport?.systemSizeKw || "-"} kW` : "Not Generated"}</p>
        </div>
        <div class="bg-emerald-50 rounded-2xl p-4">
          <p class="text-sm text-slate-500">Net Cost</p>
          <p class="text-2xl font-bold text-emerald-700 mt-2">${aiReport ? `₹${aiReport?.netCost || 0}` : "Pending"}</p>
        </div>
      </div>
    </div>

    <div class="space-y-2 mt-4">
      <h3 class="text-lg font-bold text-slate-900">AI Readiness Profile</h3>
      <div class="bg-slate-50 rounded-2xl p-4 space-y-3">
        <p><span class="font-semibold">Persona:</span> ${aiReport ? aiReport?.personaV2?.primary || "-" : "AI analysis pending"}</p>
        <p><span class="font-semibold">AI Score:</span> ${aiReport ? aiReport?.trustScore || 0 : "Not Available"}</p>
        <p><span class="font-semibold">Lead Temperature:</span> ${aiReport ? aiReport?.personaV2?.leadTemperature || "-" : "Unknown"}</p>
        <p><span class="font-semibold">Financing:</span> ${aiReport ? aiReport?.personaV2?.financingLikelihood || "-" : "Unknown"}</p>
      </div>
    </div> 
    
    <div class="space-y-2 mt-4">
      <h3 class="text-lg font-bold text-slate-900">Verification Desk (User Offer)</h3>
      <div class="bg-slate-50 rounded-2xl p-4 space-y-3">
        ${rawQuoteFile ? `
          <div class="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-3 transition-all duration-200 hover:border-slate-300">
            <div class="flex items-center justify-between gap-2">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-xl shrink-0 shadow-sm">📄</div>
                <div>
                  <p class="text-sm font-semibold text-slate-800">Installer Quotation</p>
                  <p class="text-xs text-slate-400">Uploaded for tracking audit</p>
                </div>
              </div>
              <a id="admin-quote-open-btn" href="#" target="_blank" class="bg-indigo-600 hover:bg-indigo-700 text-white text-xs px-3.5 py-2 rounded-xl font-semibold shadow-sm transition inline-block text-center whitespace-nowrap opacity-50 pointer-events-none">
                Connecting...
              </a>
            </div>

            <div class="relative group rounded-xl overflow-hidden border border-slate-100 bg-slate-50 aspect-[4/3] flex items-center justify-center max-h-[160px] shadow-inner">
              <img id="admin-quote-preview-img" src="" 
                   alt="Quotation Document Preview" 
                   class="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300" 
                   onerror="handleImageLoadError(this, 'quote')"/>
              <div class="absolute inset-0 bg-slate-900/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[1px]">
                <a id="admin-quote-expand-btn" href="#" target="_blank" class="bg-white/95 text-slate-900 text-xs font-semibold px-3 py-1.5 rounded-lg shadow-md transition transform scale-95 group-hover:scale-100 opacity-50 pointer-events-none">
                  Expand Document
                </a>
              </div>
            </div>
            
            <div class="border-t border-slate-100 pt-3">
              <label class="text-xs font-semibold text-slate-600 block mb-1.5">Quote Audit Feedback</label>
              <select onchange="updateLeadField('${lead.id}', 'quoteVerificationStatus', this.value)" class="w-full border border-slate-200 rounded-lg px-2.5 py-2 text-xs bg-slate-50 focus:bg-white focus:outline-none">
                <option value="PENDING_REVIEW" ${lead.quoteVerificationStatus === 'PENDING_REVIEW' || !lead.quoteVerificationStatus ? 'selected' : ''}>⏳ Pending Review</option>
                <option value="VERIFIED_TIER1_COMPLIANT" ${lead.quoteVerificationStatus === 'VERIFIED_TIER1_COMPLIANT' ? 'selected' : ''}>✅ Verified (Tier-1 ALMM Compliant)</option>
                <option value="REJECTED_SUBSTANDARD" ${lead.quoteVerificationStatus === 'REJECTED_SUBSTANDARD' ? 'selected' : ''}>❌ Rejected (Substandard Components)</option>
                <option value="REJECTED_INCOMPLETE" ${lead.quoteVerificationStatus === 'REJECTED_INCOMPLETE' ? 'selected' : ''}>⚠️ Rejected (Incomplete / Inaccurate Details)</option>
              </select>
            </div>
          </div>
        ` : `
          <div class="text-center py-4 bg-white border border-dashed border-slate-200 rounded-xl">
            <p class="text-sm text-slate-400 font-medium">No quotation uploaded yet</p>
            <p class="text-[11px] text-slate-400 mt-0.5">Awaiting customer side submission</p>
          </div>
        `}
      </div>
    </div>

    <div class="space-y-3 mt-6">
      <h3 class="text-lg font-bold text-slate-900">Ops Management</h3>
      <div class="bg-slate-50 rounded-2xl p-4 space-y-4">
        <div>
          <label class="text-sm font-semibold text-slate-700 block mb-2">Priority</label>
          <select id="opsPriority" class="w-full border border-slate-200 rounded-xl px-3 py-3 bg-white focus:outline-none">
            <option value="LOW" ${lead.priority === "LOW" ? "selected" : ""}>LOW</option>
            <option value="MEDIUM" ${lead.priority === "MEDIUM" || !lead.priority ? "selected" : ""}>MEDIUM</option>
            <option value="HIGH" ${lead.priority === "HIGH" ? "selected" : ""}>HIGH</option>
            <option value="URGENT" ${lead.priority === "URGENT" ? "selected" : ""}>URGENT</option>
          </select>
        </div>

        <div>
          <label class="text-sm font-semibold text-slate-700 block mb-2">Follow-up Date</label>
          <input id="followUpDate" type="date" value="${lead.followUpDate || ''}" class="w-full border border-slate-200 rounded-xl px-3 py-3 bg-white focus:outline-none">
        </div>
        
        <button onclick="saveOpsDetails('${lead.id}')" class="w-full bg-slate-900 hover:bg-slate-800 text-white py-3 rounded-xl font-semibold shadow-sm transition">
          Save Ops Details
        </button>
      </div>
    </div> 
    
    <div class="space-y-3 mt-6">
      <h3 class="text-lg font-bold text-slate-900">Activity Timeline</h3>
      <div id="leadTimeline" class="space-y-3"></div>
    </div>

    <div class="space-y-3 mt-6">
      <h3 class="text-lg font-bold text-slate-900">Ops Notes</h3>
      <div id="leadNotesList" class="space-y-2"></div>
      <textarea id="newLeadNote" rows="3" placeholder="Add internal ops note..." class="w-full border border-slate-300 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"></textarea>
      <button id="saveLeadNoteBtn" class="bg-slate-900 hover:bg-slate-800 text-white px-5 py-3 rounded-xl text-sm font-semibold transition shadow-sm">Save Note</button>
    </div>
  `;
  
  if (unsavedNoteText) {
    const textarea = document.getElementById("newLeadNote");
    if (textarea) textarea.value = unsavedNoteText;
  }

  renderLeadNotes(lead);
  renderTimeline(lead);

  // 🚀 Pass down lead.id explicitly to prevent asynchronous token overrides
  if (rawBillFile) {
    resolveStorageAsset(rawBillFile, lead.id, "admin-bill-preview-img", ["admin-bill-open-btn", "admin-bill-expand-btn"]);
  }
  if (rawQuoteFile) {
    resolveStorageAsset(rawQuoteFile, lead.id, "admin-quote-preview-img", ["admin-quote-open-btn", "admin-quote-expand-btn"]);
  }
}

// =====================================
// RENDER NOTES
// =====================================
function renderLeadNotes(lead) {
  const notesList = document.getElementById("leadNotesList");
  if (!notesList) return;

  notesList.innerHTML = "";
  const notes = lead.notes || [];

  if (notes.length === 0) {
    notesList.innerHTML = `<div class="text-sm text-slate-400">No notes added yet</div>`;
    return;
  }

  notes.forEach((note) => {
    const item = document.createElement("div");
    item.className = "bg-slate-100 rounded-xl p-3 text-sm text-slate-700";
    item.innerHTML = `
      <div class="flex items-start justify-between gap-3">
        <div class="text-slate-700">${note}</div>
        <div class="text-[10px] text-slate-400 whitespace-nowrap">OPS</div>
      </div>
    `;
    notesList.appendChild(item);
  });
}

// =====================================
// RENDER TIMELINE
// =====================================
function renderTimeline(lead) {
  const timelineContainer = document.getElementById("leadTimeline");
  if (!timelineContainer) return;

  timelineContainer.innerHTML = "";
  const timeline = [];

  if (lead.createdAt) {
    timeline.push({
      type: "CREATED",
      message: `Lead created from ${lead.leadSource || "Website"}`,
      createdAt: lead.createdAt?.toDate ? lead.createdAt.toDate() : lead.createdAt
    });
  }

  if (lead.timeline?.length) {
    lead.timeline.forEach((item) => {
      timeline.push({
        ...item,
        createdAt: item.createdAt?.toDate ? item.createdAt.toDate() : item.createdAt
      });
    });
  }

  if (timeline.length === 0) {
    timelineContainer.innerHTML = `<div class="text-sm text-slate-400">No timeline activity available</div>`;
    return;
  }

  const sortedTimeline = [...timeline].sort((a, b) => {
    const dateA = a.createdAt?.seconds ? a.createdAt.seconds * 1000 : new Date(a.createdAt).getTime();
    const dateB = b.createdAt?.seconds ? b.createdAt.seconds * 1000 : new Date(b.createdAt).getTime();
    return dateB - dateA;
  });

  sortedTimeline.forEach((item) => {
    const timelineItem = document.createElement("div");
    timelineItem.className = "border border-slate-200 rounded-xl p-4 bg-white";
    timelineItem.innerHTML = `
      <div class="flex items-start justify-between gap-3">
        <div>
          <div class="text-sm font-semibold text-slate-800">
            ${
              item.type === "NOTE_ADDED" ? "Note Added"
              : item.type === "OPS_UPDATE" ? "Ops Updated"
              : item.type === "CREATED" ? "Lead Created"
              : item.type === "QUALIFIED" ? "AI Analysis Completed"
              : item.type === "STATUS_CHANGED" ? "Status Updated"
              : item.type === "FIELD_UPDATED" ? "Field Updated"
              : item.type || "Update"
            }
          </div>
          <div class="text-sm text-slate-600 mt-1">${item.message || ""}</div>
        </div>
        <div class="text-xs text-slate-400 whitespace-nowrap">
          ${item.createdAt ? new Date(item.createdAt?.seconds ? item.createdAt.seconds * 1000 : item.createdAt).toLocaleString("en-IN", {
            timeZone: "Asia/Kolkata", day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit"
          }) : ""}
        </div>
      </div>
    `;
    timelineContainer.appendChild(timelineItem);
  });
}

// =====================================
// SAVE OPS DETAILS
// =====================================
window.saveOpsDetails = async function(id) {
  try {
    const priority = document.getElementById("opsPriority").value;
    const followUpDate = document.getElementById("followUpDate").value;

    const timelineUpdate = {
      type: "OPS_UPDATE",
      message: `Priority changed to ${priority}${followUpDate ? ` • Follow-up: ${followUpDate}` : ""}`,
      createdAt: new Date().toISOString()
    };

    await db.collection("leads").doc(id).update({
      priority: priority,
      followUpDate: followUpDate,
      assignedTo: "Ops Team",
      updatedAt: new Date(),
      activityLogs: firebase.firestore.FieldValue.arrayUnion(timelineUpdate)
    });

    showToast("Ops details saved successfully");
  } catch (error) {
    console.error("Failed to save ops details");
    showToast("Failed to save ops details", true);
  }
};

// =====================================
// SAVE NOTE
// =====================================
document.addEventListener("click", async function(event) {
  if (event.target.id !== "saveLeadNoteBtn") return;

  const textarea = document.getElementById("newLeadNote");
  const note = textarea.value.trim();

  if (!note) {
    showToast("Enter note", true);
    return;
  }

  try {
    const timelineUpdate = {
      type: "NOTE_ADDED",
      message: note,
      createdAt: new Date().toISOString()
    };

    await db.collection("leads").doc(currentOpenLeadId).update({
      notes: firebase.firestore.FieldValue.arrayUnion(note),
      updatedAt: new Date(),
      activityLogs: firebase.firestore.FieldValue.arrayUnion(timelineUpdate)
    });

    textarea.value = "";
    showToast("Note added successfully");
  } catch (error) {
    console.error("Failed to save notes");
    showToast("Failed to save note", true);
  }
});
