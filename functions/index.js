// Final Deployment Test - [Today's Date]
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
        to: "your-business-email@gmail.com", // 👈 Replace with your actual email
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
