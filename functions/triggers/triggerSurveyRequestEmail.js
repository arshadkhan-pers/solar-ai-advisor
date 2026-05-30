const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const admin = require("firebase-admin");

exports.triggerSurveyRequestEmail = onDocumentCreated(
  {
    document: "survey_requests/{requestId}",
    region: "asia-south2"
  },
  async (event) => {
    const surveyData = event.data.data();
    const leadId = surveyData.leadId;

    // 1. Fetch Lead & AI Report Data
    const [leadDoc, aiDoc] = await Promise.all([
      admin.firestore().collection("leads").doc(leadId).get(),
      admin.firestore().collection("ai_reports").doc(leadId).get()
    ]);

    if (!leadDoc.exists || !aiDoc.exists) return;

    const leadData = leadDoc.data();
    const aiData = aiDoc.data();
    const hasInstaller = aiData.matchedInstallers && aiData.matchedInstallers.length > 0;

    // 2. Determine Template
    const subject = hasInstaller 
      ? "Your Solar Site Survey Request is Confirmed!" 
      : "We’ve received your Solar Request - We are preparing your Concierge";

    const body = hasInstaller 
      ? `Hi ${leadData.name}, your request has been sent to our partner ${aiData.matchedInstallers[0].name}.`
      : `Hi ${leadData.name}, we are vetting partners in your city. We will contact you when a partner is ready.`;

    // 3. Send Email
    // Note: Assuming you are using Nodemailer or a similar transport 
    // configured in your mailer utility.
    await admin.firestore().collection("mail").add({
      to: leadData.email,
      bcc: "ops-team@yourdomain.com", 
      message: {
        subject: subject,
        text: `${body}\n\nDossier Summary: System Size ${aiData.systemSizeKw}kW, Net Cost: ${aiData.netCost}`,
      }
    });
    
    console.log(`Survey request processed for ${leadId}. Installer matched: ${hasInstaller}`);
  }
);
