//Module
const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const admin = require("firebase-admin");

exports.triggerHotLeadEmail = onDocumentCreated(
  {
    document: "leads/{leadId}",
    region: "asia-south2"
  },
  async (event) => {

    const snapshot = event.data;
    if (!snapshot) return null;

    const leadData = snapshot.data();
    const billAmount = parseFloat(leadData.bill);

    if (billAmount >= 3000) {
      try {
        await admin.firestore().collection("mail").add({
          to: "arshad.khan8912@gmail.com",
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
  }
);
