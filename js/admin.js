import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
// =====================================
// UPDATE STATUS
// =====================================

window.updateLeadStatus = async function(id, status) {

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

  const lead = allLeads.find(
    l => l.id === id
  );

  if (!lead) return;

  alert(
`
Name: ${lead.name}
Phone: ${lead.phone}
City: ${lead.city}
Bill: ₹${lead.bill || 0}
Lead Type: ${lead.leadType}
Status: ${lead.status}
Stage: ${lead.stage}
`
  );
};

// =====================================
// START
// =====================================

loadLeads();
