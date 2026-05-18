/* eslint-disable max-len */
// Final Deployment Test - 17th May 2026, Integrated Version

const { onDocumentCreated, onDocumentUpdated } = require("firebase-functions/v2/firestore");
const admin = require("firebase-admin");

admin.initializeApp();

// ==========================================
// TRIGGER: HOT LEAD ALERT (Unchanged)
// ==========================================
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
// TRIGGER: NEW CONSULTATION (Unchanged)
// ==========================================
exports.triggerConsultationEmail = onDocumentCreated("consultations/{docId}", async (event) => {
  const snapshot = event.data;
  if (!snapshot) return null;

  const data = snapshot.data();

  try {
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
  } catch (err) {
    console.error("Consultation Mail queue error:", err);
  }
  return null;
});

// ==========================================
// TRIGGER: NEW INSTALLER SIGNUP (Unchanged)
// ==========================================
exports.triggerInstallerEmail = onDocumentCreated("installers/{docId}", async (event) => {
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
});


// =====================================================================
// NEW TRIGGER: LEAD CONSULTATION FEASIBILITY REPORT (To Homeowner)
// =====================================================================
/* eslint-disable max-len */

// FIX: Trigger off the 'ai_reports' creation to ensure ALL data is ready
exports.triggerLeadConsultationEmail = onDocumentCreated("ai_reports/{reportId}", async (event) => {
  const aiSnapshot = event.data;
  if (!aiSnapshot) return null;

  const aiData = aiSnapshot.data();
  const leadId = aiData.leadId || event.params.reportId;

  try {
    // 1. Fetch the original lead data to get the email, name, and sizing math
    const leadDoc = await admin.firestore().collection("leads").doc(leadId).get();
    
    if (!leadDoc.exists) {
      console.log(`[triggerLeadConsultationEmail] Lead ${leadId} not found. Aborting email.`);
      return null;
    }

    const leadData = leadDoc.data();
    
    // Check if email exists
    if (!leadData.email) {
       console.log(`[triggerLeadConsultationEmail] No email found for lead ${leadId}.`);
       return null;
    }

    // 2. Destructure data from BOTH collections
    const { email, name, systemSizeKw, totalSubsidy, netCost, city } = leadData;
    const { trustScore, persona, aiInsights } = aiData;

    // Format AI Insights into an HTML list
    const insightsHtml = (aiInsights && aiInsights.length > 0) 
      ? aiInsights.map(insight => `<li style="margin-bottom: 8px;">${insight}</li>`).join('')
      : `<li>Your property profile appears highly suitable for rooftop solar installation.</li>`;

    // 3. Send the Merged Email
    await admin.firestore().collection("mail").add({
      to: email,
      message: {
        subject: `Your AI Solar Feasibility Report is Ready! - ${city || "Uttar Pradesh"}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px; color: #333;">
            <div style="text-align: center; margin-bottom: 20px;">
              <h2 style="color: #003366; margin: 0;">Solar AI Advisor</h2>
              <p style="color: #666; margin: 5px 0 0 0;">Your Personal Clean Energy Companion</p>
            </div>
            
            <p>Dear ${name || "Homeowner"},</p>
            <p>Thank you for choosing <strong>Solar AI Advisor</strong>. Our AI engine has finished processing your energy profile for your property in <strong>${city || "UP"}</strong>.</p>
            
            <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
              <tr style="background-color: #f9f9f9;">
                <td style="padding: 12px; border: 1px solid #ddd; font-weight: bold; width: 50%;">Recommended System Size</td>
                <td style="padding: 12px; border: 1px solid #ddd; color: #003366; font-weight: bold; font-size: 16px;">${systemSizeKw || "Calculated on Dashboard"} kWp</td>
              </tr>
              <tr>
                <td style="padding: 12px; border: 1px solid #ddd; font-weight: bold;">Combined Central & UP Subsidy</td>
                <td style="padding: 12px; border: 1px solid #ddd; color: #4CAF50; font-weight: bold; font-size: 16px;">₹${totalSubsidy || "TBD"}</td>
              </tr>
              <tr style="background-color: #f9f9f9;">
                <td style="padding: 12px; border: 1px solid #ddd; font-weight: bold;">Approximate Net Cost</td>
                <td style="padding: 12px; border: 1px solid #ddd; font-weight: bold; font-size: 16px;">₹${netCost || "TBD"}</td>
              </tr>
            </table>

            <div style="background-color: #e6f7ff; border-left: 5px solid #0088cc; padding: 15px; margin: 20px 0; border-radius: 4px;">
              <strong style="color: #006699; display: block; margin-bottom: 8px;">🤖 AI Property Insights (Score: ${trustScore}/100)</strong>
              <ul style="margin: 0; padding-left: 20px; font-size: 13px; line-height: 1.5; color: #444;">
                ${insightsHtml}
              </ul>
            </div>

            <div style="background-color: #fff9e6; border-left: 5px solid #ffcc00; padding: 15px; margin: 20px 0; border-radius: 4px;">
              <strong style="color: #b38600; display: block; margin-bottom: 5px;">✨ Solar AI Advisor Trust Insight</strong>
              <p style="margin: 0; font-size: 13px; line-height: 1.5; color: #555;">
                Did you know? Even a small 10% shadow on your solar panel array can result in up to a 50% drop in overall power generation. Our matched installer will perform a detailed layout analysis to ensure zero inter-row shading!
              </p>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="https://solaraiadvisor.in/reports/${leadId}" style="background-color: #003366; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Open Full Dynamic Advisor Report</a>
            </div>
          </div>
        `
      }
    });
    console.log(`[triggerLeadConsultationEmail] Successfully merged AI data and sent report for ${leadId}`);
  } catch (error) {
    console.error("Error sending feasibility email:", error);
  }
  return null;
});


//PHASE 2 — CREATE generateAIReport FUNCTION PURPOSE
exports.generateAIReport =
  require("./generateAIReport").generateAIReport;
  
  
// =====================================================================
// NEW TRIGGER: LEAD ASSIGNMENT PROFILE DELIVERY (To Matched Installer)
// =====================================================================
exports.triggerLeadAssignmentEmail = onDocumentUpdated("leads/{leadId}", async (event) => {
  const change = event.data;
  if (!change) return null;

  const beforeData = change.before.data();
  const afterData = change.after.data();

  if (!beforeData ||!afterData) return null;

  // Trigger only if the status transitioned specifically to 'assigned' and has a target installer email
  const isNewlyAssigned = afterData.status === "assigned" && beforeData.status!== "assigned";
  const hasInstallerEmail =!!afterData.installerEmail;

  if (isNewlyAssigned && hasInstallerEmail) {
    const { 
      name, 
      phone, 
      address, 
      city, 
      monthlyBill, 
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
                  <td style="padding: 8px; border: 1px solid #ddd;">₹${monthlyBill || 0}</td>
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
                ${billUrl? `<li><a href="${billUrl}" target="_blank" style="color: #003366; font-weight: bold;">View Electricity Bill Image</a></li>` : "<li>No bill uploaded</li>"}
                ${roofPhotoUrl? `<li><a href="${roofPhotoUrl}" target="_blank" style="color: #003366; font-weight: bold;">View Rooftop Photo</a></li>` : "<li>No rooftop photo uploaded</li>"}
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
