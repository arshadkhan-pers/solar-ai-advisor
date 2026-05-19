//Module 
const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const admin = require("firebase-admin");

exports.triggerInstallerEmail = onDocumentCreated(
  {
    document: "installers/{docId}",
    region: "asia-south2"
  },
  async (event) => {

    const snapshot = event.data;
    if (!snapshot) return null;

    const data = snapshot.data();

    try {

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

    } catch (err) {
      console.error("Installer Mail queue error:", err);
    }

    return null;
  }
);