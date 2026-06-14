/* eslint-disable max-len */

const { onDocumentCreated, onDocumentUpdated } = require("firebase-functions/v2/firestore");
const admin = require("firebase-admin");
const crypto = require("crypto");

admin.initializeApp();


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



<div style="text-align: center; margin: 30px 0;">
              <a href="${waLink}" style="background-color: #25D366; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 16px; box-shadow: 0 4px 10px rgba(37, 211, 102, 0.3);">
                💬 Chat with Advisor on WhatsApp
              </a>
              <p style="margin-top: 15px; font-size: 14px; color: #555; line-height: 1.5;">
                Or Call Support directly: <br/>
                <a href="tel:+919235169031" style="color: #003366; font-weight: bold; text-decoration: underline; font-size: 16px;">+91 92351 69031</a> <br/>
                <span style="font-size: 11px; color: #777;">(Tap to call instantly / Long-press to copy)</span>
              </p>
            </div>

            <hr style="border: 0; border-top: 1px solid #eee;" />
            <p style="font-size: 11px; color: #999; text-align: center;">Final feasibility subject to <strong>10/50 Shadow Rule</strong> verification during physical site survey.</p>
          </div>
        `
      }
    });
    console.log(`[triggerLeadConsultationEmail] Full AI report successfully sent for ${leadId}`);
  } catch (error) {
    console.error("Error sending Full AI report email:", error);
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

<div style="text-align: center; margin: 30px 0;">
              <a href="${waLink}" style="background-color: #25D366; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 16px; box-shadow: 0 4px 10px rgba(37, 211, 102, 0.3);">
                💬 Chat with Advisor on WhatsApp
              </a>
              <p style="margin-top: 15px; font-size: 14px; color: #555; line-height: 1.5;">
                Or Call Support directly: <br/>
                <a href="tel:+919235169031" style="color: #003366; font-weight: bold; text-decoration: underline; font-size: 16px;">+91 92351 69031</a> <br/>
                <span style="font-size: 11px; color: #777;">(Tap to call instantly / Long-press to copy)</span>
              </p>
            </div>

            <hr style="border: 0; border-top: 1px solid #eee;" />
            <p style="font-size: 11px; color: #999; text-align: center;">Final feasibility subject to <strong>10/50 Shadow Rule</strong> verification during physical site survey.</p>
          </div>
        `
      }
    });
    console.log(`[triggerLeadConsultationEmail] Full AI report successfully sent for ${leadId}`);
  } catch (error) {
    console.error("Error sending Full AI report email:", error);
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

// Add to your existing exports in index.js
const { triggerSurveyRequestEmail } = require("./triggers/triggerSurveyRequestEmail");
exports.triggerSurveyRequestEmail = triggerSurveyRequestEmail;


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
      console.error(`[triggerLeadAssignmentEmail] CRITICAL ERROR: Lead ${event.params.leadId} switched status to 'assigned', but 'installerEmail' field is missing or empty!`);
      return null;
    }

    const { 
      name, 
      phone, 
      address, 
      city, 
      bill, 
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


// =====================================================================
// 🔒 HTTPS CALLABLE v2: SECURE PIN AUTHENTICATION ENGINE
// =====================================================================
const { onCall, HttpsError } = require("firebase-functions/v2/https");

exports.verifyLeadPin = onCall({ region: "asia-south2" }, async (request) => {
  const { phone, enteredHash } = request.data;
  
  if (!phone || !enteredHash) {
    throw new HttpsError("invalid-argument", "Missing required authentication parameters.");
  }

  const snapshot = await admin.firestore().collection("leads")
    .where("normalizedPhone", "==", phone)
    .orderBy("createdAt", "desc")
    .limit(1)
    .get();

  if (snapshot.empty) {
    throw new HttpsError("not-found", "No registered account found matching this mobile number.");
  }

  const leadDoc = snapshot.docs[0];
  const secureRecord = leadDoc.data();

  // =====================================
// DPDP CONSENT WITHDRAWAL PROTECTION
// =====================================

if (
  secureRecord.loginDisabled === true ||
  secureRecord.consentWithdrawn === true ||
  secureRecord.stage === "CONSENT_WITHDRAWN"
) {
  throw new HttpsError(
    "permission-denied",
    "This account has been deleted following consent withdrawal."
  );
}
  
  // 1. Enforce Server-Side Lockout Checks
  if (secureRecord.lockoutUntil && secureRecord.lockoutUntil.toDate() > new Date()) {
    const minutesRemaining = Math.ceil((secureRecord.lockoutUntil.toDate() - new Date()) / 60000);
    throw new HttpsError(
      "permission-denied", 
      `This account is temporarily locked due to too many failed attempts. Please try again in ${minutesRemaining} minutes.`
    );
  }

  // 2. Perform Isolated Server-Side Validation Hash Comparison
  if (secureRecord.pinHash === enteredHash) {
    // Clear failure logging structures upon a valid signature check
    await leadDoc.ref.update({
      failedPinAttempts: 0,
      lockoutUntil: null
    });
    
    return { 
      success: true, 
      leadId: leadDoc.id, 
      profile: {
        leadCode: secureRecord.leadCode || "",
        state: secureRecord.state || "",
        stage: secureRecord.stage || "INITIAL",
        name: secureRecord.name || "Homeowner",
        phone: secureRecord.phone || phone,
        city: secureRecord.city || "",
        bill: secureRecord.bill || "1500"
      }
    };
  } else {
    // 3. Increment Failure Vectors and Calculate Lockout Durations
    const currentAttempts = (secureRecord.failedPinAttempts || 0) + 1;
    const updates = { failedPinAttempts: currentAttempts };
    
    if (currentAttempts >= 5) {
      // Establish a strict 15-minute backend penalty window
      updates.lockoutUntil =
  admin.firestore.Timestamp.fromDate(
    new Date(Date.now() + 15 * 60 * 1000)
  );
    }
    
    await leadDoc.ref.update(updates);
    
    const attemptsLeft = Math.max(0, 5 - currentAttempts);
    throw new HttpsError(
      "unauthenticated", 
      attemptsLeft === 0 
        ? "Too many incorrect attempts. Account locked out for 15 minutes." 
        : `Incorrect PIN code. You have ${attemptsLeft} attempts remaining.`
    );
  }
});

// =====================================================================
// 🔒 CREATE SECURE LEAD SESSION
// =====================================================================

exports.createLeadSession = onCall(
{
  region: "asia-south2"
},
async (request) => {

  const { leadId } = request.data;

  if (!leadId) {
    throw new HttpsError(
      "invalid-argument",
      "Lead ID missing."
    );
  }

  const leadDoc =
    await admin.firestore()
      .collection("leads")
      .doc(leadId)
      .get();

  if (!leadDoc.exists) {
    throw new HttpsError(
      "not-found",
      "Lead not found."
    );
  }

  const sessionToken =
    crypto.randomBytes(32).toString("hex");

  const expiresAt =
    admin.firestore.Timestamp.fromDate(
      new Date(
        Date.now() +
        (30 * 24 * 60 * 60 * 1000)
      )
    );

  await admin.firestore()
    .collection("lead_sessions")
    .doc(sessionToken)
    .set({
      leadId,
      active: true,
      createdAt:
        admin.firestore.FieldValue.serverTimestamp(),
      expiresAt
    });

  return {
    success: true,
    sessionToken
  };
});

// =====================================================================
// 🔒 VALIDATE SESSION
// =====================================================================

exports.validateLeadSession = onCall(
{
  region: "asia-south2"
},
async (request) => {

  const { sessionToken } =
    request.data;

  if (!sessionToken) {

    return {
      valid: false
    };
  }

  const sessionDoc =
    await admin.firestore()
      .collection("lead_sessions")
      .doc(sessionToken)
      .get();

  if (!sessionDoc.exists) {

    return {
      valid: false
    };
  }

  const session =
    sessionDoc.data();

  if (
    !session.active ||
    !session.expiresAt ||
    session.expiresAt.toDate() < new Date()
  ) {

    return {
      valid: false
    };
  }

  const leadDoc =
    await admin.firestore()
      .collection("leads")
      .doc(session.leadId)
      .get();

  if (!leadDoc.exists) {

    return {
      valid: false
    };
  }

  return {
    valid: true,
    leadId: session.leadId,
    profile: leadDoc.data()
  };
});

// =====================================================================
// Delete consent withdrawn data
// =====================================================================
exports.deleteConsentWithdrawnLead =
require("./deleteConsentWithdrawnLead")
.deleteConsentWithdrawnLead;
