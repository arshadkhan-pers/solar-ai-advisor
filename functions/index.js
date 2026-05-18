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

exports.triggerLeadConsultationEmail = onDocumentCreated("ai_reports/{reportId}", async (event) => {
  const aiSnapshot = event.data;
  if (!aiSnapshot) return null;

  const aiData = aiSnapshot.data();
  const leadId = aiData.leadId || event.params.reportId;
  const supportNumber = "61404166347"; 

  // 🚫 REMOVED: 5-Second Sleep Hack & Secondary Lead Doc Fetch
  // All fields are now provided natively by the updated ai_reports write payload!
  if (!aiData.customerEmail) {
    console.warn(`[triggerLeadConsultationEmail] Skipped email for report ${event.params.reportId}: No customerEmail found.`);
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
    } = aiData;

    const leadIdentifier = leadCode || leadId;

    // Format Data for WhatsApp and HTML
    const waMessage = encodeURIComponent(
      `Hi Solar AI Advisor, I received my ${persona?.type || "Solar"} Report for ${city || "my city"}, ${state || "India"}. ` +
      `Recommended: ${systemSizeKw || "TBD"} kWp. Let's discuss next steps!`
    );
    const waLink = `https://wa.me/${supportNumber}?text=${waMessage}`;

    const insightsHtml = aiInsights?.map(i => `<li style="margin-bottom: 5px;">${i}</li>`).join('') || "";
    const checklistHtml = buyerProtectionChecklist?.map(c => `<li style="margin-bottom: 5px;">${c}</li>`).join('') || "";

    // Formatting numbers nicely for display
    const formattedSubsidy = totalSubsidy ? Number(totalSubsidy).toLocaleString('en-IN') : "TBD";
    const formattedNetCost = netCost ? Number(netCost).toLocaleString('en-IN') : "TBD";

    // Send the "Full Report" Transactional Email
    await admin.firestore().collection("mail").add({
      to: customerEmail,
      replyTo: "arshad.khan8912@gmail.com",
      message: {
        subject: `☀️ Your AI Solar Report: ${systemSizeKw || ""} kWp for ${customerName}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px; color: #333; background-color: #ffffff;">
            
            <div style="font-size: 11px; color: #777; text-align: right; margin-bottom: 10px;">
              <strong>Lead Reference ID:</strong> ${leadIdentifier}
            </div>

            <div style="text-align: center; margin-bottom: 20px;">
              <h2 style="color: #003366; margin: 0;">Solar AI Advisor</h2>
              <p style="color: #666; margin: 5px 0 0 0;">Expert Report for ${city || "your city"}, ${state || "India"}</p>
            </div>
            
            <div style="background-color: #f0f7ff; border-radius: 6px; padding: 15px; margin-bottom: 20px; text-align: center;">
              <span style="font-size: 12px; color: #003366; font-weight: bold; text-transform: uppercase;">User Profile:</span>
              <h3 style="margin: 5px 0; color: #003366;">${persona?.type || "Valued Buyer"}</h3>
              <p style="margin: 0; font-size: 13px; color: #555;">AI Confidence: ${persona?.confidence || 90}% | Trust Score: ${trustScore || 50}/100</p>
            </div>

            <h4 style="color: #003366; border-bottom: 1px solid #eee; padding-bottom: 5px;">1. System & Financial Summary</h4>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
              <tr style="background-color: #f9f9f9;">
                <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">System Size</td>
                <td style="padding: 10px; border: 1px solid #ddd; color: #003366; font-weight: bold;">${systemSizeKw || "N/A"} kWp</td>
              </tr>
              <tr>
                <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">Estimated Subsidy</td>
                <td style="padding: 10px; border: 1px solid #ddd; color: #4CAF50; font-weight: bold;">₹${formattedSubsidy}</td>
              </tr>
              <tr style="background-color: #f9f9f9;">
                <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">Final Net Cost</td>
                <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">₹${formattedNetCost}</td>
              </tr>
            </table>

            <h4 style="color: #003366; border-bottom: 1px solid #eee; padding-bottom: 5px;">2. AI Advisor Insights</h4>
            <ul style="font-size: 13px; line-height: 1.6; color: #444; padding-left: 20px;">
              ${insightsHtml}
            </ul>

            <div style="background-color: #fff9e6; border-left: 4px solid #ffcc00; padding: 12px; margin: 20px 0; border-radius: 4px;">
              <strong style="color: #856404; font-size: 14px;">🛡️ Buyer Protection Checklist</strong>
              <ul style="margin: 8px 0 0 0; padding-left: 18px; font-size: 12px; color: #665c33;">
                ${checklistHtml}
              </ul>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${waLink}" style="background-color: #25D366; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 16px; box-shadow: 0 4px 10px rgba(37, 211, 102, 0.3);">
                💬 Chat with Advisor on WhatsApp
              </a>
              <p style="margin-top: 15px; font-size: 14px; color: #555; line-height: 1.5;">
                Or Call Support directly: <br/>
                <a href="tel:+919838004479" style="color: #003366; font-weight: bold; text-decoration: underline; font-size: 16px;">+91 98380 04479</a> <br/>
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

  
// =====================================================================
// TRIGGER: LEAD ASSIGNMENT PROFILE DELIVERY (To Matched Installer)
// =====================================================================
exports.triggerLeadAssignmentEmail = onDocumentUpdated("leads/{leadId}", async (event) => {
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
