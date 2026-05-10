// Final Deployment Test - 9th May 2026, 2nd time
const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const admin = require("firebase-admin");

admin.initializeApp();

exports.triggerHotLeadEmail = onDocumentCreated("leads/{leadId}", async (event) => {
  const snapshot = event.data;
  if (!snapshot) return null;

  const leadData = snapshot.data();
  const billAmount = parseFloat(leadData.bill);

  // Logic: Only alert if the bill is ₹3000 or more
  if (billAmount >= 3000) {
    try {
      await admin.firestore().collection("mail").add({
        to: "arshad.khan8912@gmail.com", // 👈 Replace with your actual email
        template: {
          name: "hot_lead_alert",
          data: {
            name: leadData.name || "N/A",
            bill: billAmount,
            city: leadData.city || "N/A",
            state: leadData.state || "N/A",
            phone: leadData.phone || "N/A"
          },
        },
      });
      console.log(`Success: Hot lead email queued for ${snapshot.id}`);
    } catch (err) {
      console.error("Mail queue error:", err);
    }
  }
  return null;
});

// ==========================================
// TRIGGER: NEW CONSULTATION
// ==========================================
exports.triggerConsultationEmail = functions.firestore
  .document("consultations/{docId}")
  .onCreate(async (snap, context) => {
    const data = snap.data();

    await admin.firestore().collection("mail").add({
      to: "arshad.khan8912@gmail.com",
      template: {
        name: "new_consultation_alert",
        data: {
          name: data.name || "N/A",
          phone: data.phone || "N/A",
          city: data.city || "N/A",
          source: data.source || "N/A"
        }
      }
    });
    console.log("Consultation email queued for:", data.name);
  });

// ==========================================
// TRIGGER: NEW INSTALLER SIGNUP
// ==========================================
exports.triggerInstallerEmail = functions.firestore
  .document("installers/{docId}")
  .onCreate(async (snap, context) => {
    const data = snap.data();

    await admin.firestore().collection("mail").add({
      to: "arshad.khan8912@gmail.com",
      template: {
        name: "new_installer_alert",
        data: {
          businessName: data.businessName || "N/A",
          contactPerson: data.contactPerson || "N/A",
          phone: data.phone || "N/A",
          baseCity: data.baseCity || "N/A",
          experience: data.experience || "N/A"
        }
      }
    });
    console.log("Installer email queued for:", data.businessName);
  });

