/* eslint-disable max-len */
// Final Deployment Test - 17th May 2026, Integrated Version

const { onDocumentCreated, onDocumentUpdated } = require("firebase-functions/v2/firestore");
const admin = require("firebase-admin");

admin.initializeApp();

// =====================================================================
// NEW TRIGGER: LEAD CONSULTATION FEASIBILITY REPORT (To Homeowner)
// =====================================================================
/* eslint-disable max-len */
// =====================================================================
// TRIGGER: INITIAL AI REPORT EMAIL
// =====================================================================

exports.triggerInitialLeadConsultationEmail =
onDocumentCreated(
{
  document: "ai_reports/{reportId}",
  region: "asia-south2"
},
async (event) => {

  const aiSnapshot = event.data;

  if (!aiSnapshot) return null;

  const aiData = aiSnapshot.data();

  if (!aiData.customerEmail) {
    return null;
  }

  console.log(
    "📧 Initial AI report email:",
    event.params.reportId
  );

  try {
    const {
  customerEmail,
  customerName,
  systemSizeKw,
  totalSubsidy,
  netCost,
  city,
  state,
  leadCode,
  trustScore,
  persona,
  aiInsights,
  buyerProtectionChecklist
} = aiData;

const supportNumber = "61404166347";
const leadIdentifier = leadCode || event.params.reportId;
const waMessage =
  encodeURIComponent(
    `Hi Solar AI Advisor, I received my ${persona?.type || "Solar"} Report for ${city || "my city"}, ${state || "India"}.`
  );

const waLink =
  `https://wa.me/${supportNumber}?text=${waMessage}`;
  
  const insightsHtml =
  aiInsights?.map(
    i => `<li style="margin-bottom: 5px;">${i}</li>`
  ).join('') || "";

const checklistHtml =
  buyerProtectionChecklist?.map(
    c => `<li style="margin-bottom: 5px;">${c}</li>`
  ).join('') || "";

    await admin.firestore()
      .collection("mail")
      .add({

        to: customerEmail,

        replyTo:
          "arshad.khan8912@gmail.com",

        message: {
          subject:
            `☀️ Your AI Solar Report: ${systemSizeKw || ""} kWp`,

          html: `
          <div style="font-family: Arial, sans-serif; padding:20px;">

            <h2 style="color:#003366;">
              Your AI Solar Report
            </h2>
          <div style="font-size:12px;color:#777;margin-bottom:15px;">
                Reference ID: ${leadIdentifier}
          </div>
            <p>
              Your personalized solar feasibility report is now ready.
            </p>
<div style="
background:#f0f7ff;
padding:15px;
border-radius:8px;
margin-top:20px;
margin-bottom:20px;
text-align:center;
">

  <div style="
  font-size:12px;
  color:#003366;
  font-weight:bold;
  text-transform:uppercase;
  ">
    User Profile
  </div>

  <h3 style="
  margin:6px 0;
  color:#003366;
  ">
    ${persona?.type || "Balanced Buyer"}
  </h3>

  <p style="
  margin:0;
  color:#555;
  font-size:13px;
  ">
    AI Confidence:
    ${persona?.confidence || 90}%
    |
    Trust Score:
    ${trustScore || 50}/100
  </p>

</div>
            <table style="width:100%; border-collapse:collapse; margin-top:20px;">

              <tr>
                <td style="padding:10px; border:1px solid #ddd;">
                  Recommended System
                </td>

                <td style="padding:10px; border:1px solid #ddd;">
                  <strong>${systemSizeKw} kWp</strong>
                </td>
              </tr>

              <tr>
                <td style="padding:10px; border:1px solid #ddd;">
                  Estimated Subsidy
                </td>

                <td style="padding:10px; border:1px solid #ddd;">
                  ₹${Number(totalSubsidy || 0).toLocaleString("en-IN")}
                </td>
              </tr>

              <tr>
                <td style="padding:10px; border:1px solid #ddd;">
                  Estimated Net Cost
                </td>

                <td style="padding:10px; border:1px solid #ddd;">
                  ₹${Number(netCost || 0).toLocaleString("en-IN")}
                </td>
              </tr>

            </table>

            <h3 style="margin-top:30px;">
              AI Insights
            </h3>

            <ul>
              ${insightsHtml}
            </ul>

            <div style="background:#fff9e6; padding:15px; margin-top:25px; border-left:4px solid #ffcc00;">

              <strong>
                Buyer Protection Checklist
              </strong>

              <ul style="margin-top:10px;">
                ${checklistHtml}
              </ul>

            </div>

            <div style="margin-top:30px; text-align:center;">

              <a href="${waLink}"
                 style="background:#25D366; color:white; padding:14px 24px; border-radius:8px; text-decoration:none; font-weight:bold;">

                Chat on WhatsApp

              </a>

            </div>

          </div>
          `
        }
      });

  } catch (error) {

    console.error(
      "Initial AI report email failed:",
      error
    );
  }

  return null;
});

exports.triggerLeadConsultationEmail = onDocumentUpdated(
{
  document: "ai_reports/{reportId}",
  region: "asia-south2"
},
async (event) => {

  const change = event.data;

  if (!change) return null;

  const before = change.before.data();
  const after = change.after.data();

  if (!before || !after) return null;
  
  // Ignore first creation event shadow updates

if (!before.generatedAt) {
  return null;
}

  // Only trigger when generatedAt changes

   const beforeGeneratedAt = before.generatedAt?.seconds || 0;
   const afterGeneratedAt = after.generatedAt?.seconds || 0;
   if (
       beforeGeneratedAt === afterGeneratedAt
      ) {
         return null;
}

  console.log(
    "📧 Regenerated AI report detected:",
    event.params.reportId
  );

  // Prevent duplicate logic:
  // reuse existing mail payload generator

  const supportNumber = "61404166347";

  if (!after.customerEmail) {
    console.warn(
      "No customer email found"
    );

    return null;
  }

  try {

    const {
      customerEmail,
      customerName,
      systemSizeKw,
      totalSubsidy,
      netCost,
      city,
      state,
      leadCode,
      trustScore,
      persona,
      aiInsights,
      buyerProtectionChecklist
    } = after;

    const leadIdentifier =
      leadCode || event.params.reportId;

    const waMessage =
      encodeURIComponent(
        `Hi Solar AI Advisor, I received my updated ${persona?.type || "Solar"} Report for ${city || "my city"}, ${state || "India"}.`
      );

    const waLink =
      `https://wa.me/${supportNumber}?text=${waMessage}`;

    const insightsHtml =
      aiInsights?.map(
        i => `<li style="margin-bottom: 5px;">${i}</li>`
      ).join('') || "";

    const checklistHtml =
      buyerProtectionChecklist?.map(
        c => `<li style="margin-bottom: 5px;">${c}</li>`
      ).join('') || "";

    await admin.firestore()
      .collection("mail")
      .add({

        to: customerEmail,

        replyTo:
          "arshad.khan8912@gmail.com",

        message: {

          subject:
            `🔄 Updated AI Solar Report for ${customerName}`,

          html: `
          <div style="font-family: Arial, sans-serif; padding:20px;">

            <h2 style="color:#003366;">
              Your Updated AI Solar Report
            </h2>
           <div style="font-size:12px;color:#777;margin-bottom:15px;">
                Reference ID: ${leadIdentifier}
          </div>
            <p>
              We detected updated information in your profile and regenerated your personalized solar analysis.
            </p>
<div style="
background:#f0f7ff;
padding:15px;
border-radius:8px;
margin-top:20px;
margin-bottom:20px;
text-align:center;
">

  <div style="
  font-size:12px;
  color:#003366;
  font-weight:bold;
  text-transform:uppercase;
  ">
    User Profile
  </div>

  <h3 style="
  margin:6px 0;
  color:#003366;
  ">
    ${persona?.type || "Balanced Buyer"}
  </h3>

  <p style="
  margin:0;
  color:#555;
  font-size:13px;
  ">
    AI Confidence:
    ${persona?.confidence || 90}%
    |
    Trust Score:
    ${trustScore || 50}/100
  </p>

</div>

            <table style="width:100%; border-collapse:collapse; margin-top:20px;">

              <tr>
                <td style="padding:10px; border:1px solid #ddd;">
                  Recommended System
                </td>

                <td style="padding:10px; border:1px solid #ddd;">
                  <strong>${systemSizeKw} kWp</strong>
                </td>
              </tr>

              <tr>
                <td style="padding:10px; border:1px solid #ddd;">
                  Estimated Subsidy
                </td>

                <td style="padding:10px; border:1px solid #ddd;">
                  ₹${Number(totalSubsidy || 0).toLocaleString("en-IN")}
                </td>
              </tr>

              <tr>
                <td style="padding:10px; border:1px solid #ddd;">
                  Estimated Net Cost
                </td>

                <td style="padding:10px; border:1px solid #ddd;">
                  ₹${Number(netCost || 0).toLocaleString("en-IN")}
                </td>
              </tr>

            </table>

            <h3 style="margin-top:30px;">
              AI Insights
            </h3>

            <ul>
              ${insightsHtml}
            </ul>

            <div style="background:#fff9e6; padding:15px; margin-top:25px; border-left:4px solid #ffcc00;">

              <strong>
                Buyer Protection Checklist
              </strong>

              <ul style="margin-top:10px;">
                ${checklistHtml}
              </ul>

            </div>

            <div style="margin-top:30px; text-align:center;">

              <a href="${waLink}"
                 style="background:#25D366; color:white; padding:14px 24px; border-radius:8px; text-decoration:none; font-weight:bold;">

                Chat on WhatsApp

              </a>

            </div>

          </div>
          `
        }
      });

    console.log(
      "✅ Updated AI report email queued"
    );

  } catch (error) {

    console.error(
      "Updated AI report email failed:",
      error
    );
  }

  return null;
});

  //PHASE 2 — LINK GENERATE AI REPORT TRIGGER
const { generateAIReport } = require("./generateAIReport");
exports.generateAIReport = generateAIReport;

const { triggerHotLeadEmail} = require("./triggers/triggerHotLeadEmail");
exports.triggerHotLeadEmail = triggerHotLeadEmail;

const { triggerConsultationEmail} = require("./triggers/triggerConsultationEmail");
exports.triggerConsultationEmail = triggerConsultationEmail;

const { triggerInstallerEmail} = require("./triggers/triggerInstallerEmail");
exports.triggerInstallerEmail = triggerInstallerEmail;
  
// =====================================================================
// TRIGGER: LEAD ASSIGNMENT PROFILE DELIVERY (To Matched Installer)
// =====================================================================
exports.triggerLeadAssignmentEmail = onDocumentUpdated({ document: "leads/{leadId}", region: "asia-south2" }, async (event) => {
  
  const change = event.data;
  if (!change) return null;

  const beforeData = change.before.data();
  const afterData = change.after.data();

  if (!beforeData || !afterData) return null;

  const isNewlyAssigned = afterData.status === "assigned" && beforeData.status !== "assigned";
  const hasInstallerEmail = !!afterData.installerEmail;

  if (isNewlyAssigned) {
    if (!hasInstallerEmail) {
      // ⚠️ Missing email warning check added here
      console.error(`[triggerLeadAssignmentEmail] CRITICAL ERROR: Lead ${event.params.leadId} switched status to 'assigned', but 'installerEmail' field is missing or empty!`);
      return null;
    }

    const { 
      name, 
      phone, 
      address, 
      city, 
      bill, // 🤝 Updated from 'monthlyBill' to correctly access the 'bill' field
      systemSizeKw, 
      netCost, 
      billUrl, 
      roofPhotoUrl,
      sanctionedLoad 
    } = afterData;

    try {
      await admin.firestore().collection("mail").add({
        to: afterData.installerEmail,
        message: {
          subject: `New Solar Project Assigned - ${city || "UP"} (${systemSizeKw || 0}kWp)`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px; color: #333;">
              <div style="background-color: #003366; padding: 15px; border-radius: 6px; text-align: center; margin-bottom: 20px;">
                <h2 style="color: #ffffff; margin: 0;">Exclusive Lead Assigned</h2>
                <span style="color: #ffcc00; font-size: 12px; font-weight: bold; letter-spacing: 1px;">SLA TRACKING ACTIVE (48h EXCLUSIVITY)</span>
              </div>
              
              <p>Dear Partner,</p>
              <p>A new tele-verified customer has been matched to your profile. Please review the details and contact the user immediately to schedule your site survey:</p>
              
              <h3 style="color: #003366; border-bottom: 1px solid #eee; padding-bottom: 5px;">Customer Profile</h3>
              <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                <tr>
                  <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold; width: 40%;">Name</td>
                  <td style="padding: 8px; border: 1px solid #ddd;">${name || "N/A"}</td>
                </tr>
                <tr style="background-color: #f9f9f9;">
                  <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Phone Number</td>
                  <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold; color: #003366;"><a href="tel:${phone || ""}">${phone || "N/A"}</a></td>
                </tr>
                <tr>
                  <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Site Address</td>
                  <td style="padding: 8px; border: 1px solid #ddd;">${address || "N/A"}, ${city || "N/A"}</td>
                </tr>
                <tr style="background-color: #f9f9f9;">
                  <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Monthly Bill</td>
                  <td style="padding: 8px; border: 1px solid #ddd;">₹${bill || 0}</td>
                </tr>
                <tr>
                  <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Sanctioned Load</td>
                  <td style="padding: 8px; border: 1px solid #ddd;">${sanctionedLoad || "N/A"} kW</td>
                </tr>
              </table>

              <h3 style="color: #003366; border-bottom: 1px solid #eee; padding-bottom: 5px;">AI Feasibility Recommendation</h3>
              <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                <tr style="background-color: #fcfcfc;">
                  <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold; width: 40%;">Target Capacity</td>
                  <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold; color: #4CAF50;">${systemSizeKw || 0} kWp</td>
                </tr>
                <tr>
                  <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Target Quote Net Cost</td>
                  <td style="padding: 8px; border: 1px solid #ddd;">₹${netCost || 0}</td>
                </tr>
              </table>

              <h3 style="color: #003366; border-bottom: 1px solid #eee; padding-bottom: 5px;">Uploaded Evidence</h3>
              <ul style="padding-left: 20px; line-height: 1.6;">
                ${billUrl ? `<li><a href="${billUrl}" target="_blank" style="color: #003366; font-weight: bold;">View Electricity Bill Image</a></li>` : "<li>No bill uploaded</li>"}
                ${roofPhotoUrl ? `<li><a href="${roofPhotoUrl}" target="_blank" style="color: #003366; font-weight: bold;">View Rooftop Photo</a></li>` : "<li>No rooftop photo uploaded</li>"}
              </ul>

              <div style="background-color: #ffebe6; border-left: 5px solid #ff3300; padding: 15px; margin: 25px 0; border-radius: 4px; font-size: 13px;">
                <strong>SLA Warning:</strong> You must update this lead status to "Survey Scheduled" or "Contact Attempted" in your partner CRM within 24 hours. Failure to contact this exclusive lead will result in automatic rollback and reassignment.
              </div>

              <div style="text-align: center; margin-top: 30px;">
                <a href="https://solaraiadvisor.in/installer/dashboard" style="background-color: #003366; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Open Partner Command Center</a>
              </div>
            </div>
          `,
        },
      });
      console.log(`[triggerLeadAssignmentEmail] Queued installer notification email for lead: ${event.params.leadId}`);
    } catch (error) {
      console.error("[triggerLeadAssignmentEmail] Failed to queue installer email:", error);
    }
  }
  return null;
});
