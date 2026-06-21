//Module
const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const admin = require("firebase-admin");

exports.triggerConsultationEmail = onDocumentCreated(
  {
    document: "consultations/{docId}",
    region: "asia-south2"
  },
  async (event) => {

    const snapshot = event.data;
    if (!snapshot) return null;

    const data = snapshot.data();

    try {

      await admin.firestore().collection("mail").add({
        to: "hello@solaraiadvisor.com",
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

    } catch (err) {
      console.error("Consultation Mail queue error:", err);
    }

    return null;
  }
);
