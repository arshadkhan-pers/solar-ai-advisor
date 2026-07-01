/**
 * Quote Completion Email Trigger
 *
 * Fires when a quote_sessions document status transitions to "complete".
 * Only sends email if the session has a contactEmail field (set during
 * the consultation CTA form submission).
 */

const { onDocumentUpdated } = require("firebase-functions/v2/firestore");
const admin = require("firebase-admin");

exports.triggerQuoteCompletionEmail = onDocumentUpdated(
  {
    document: "quote_sessions/{sessionId}",
    region: "asia-south2"
  },
  async (event) => {
    const change = event.data;
    if (!change) return null;

    const before = change.before.data();
    const after = change.after.data();

    if (!before || !after) return null;

    // Only when status transitions to "complete"
    if (after.status !== "complete" || before.status === "complete") return null;

    // Only send email if contact details were captured
    if (!after.contactEmail) return null;

    const sessionId = event.params.sessionId;
    const rec = after.recommendation || {};
    const quotes = after.extractedQuotes || [];
    const winnerIndex = rec.winnerIndex;
    const winner = winnerIndex !== null && winnerIndex !== undefined ? quotes[winnerIndex] : null;

    const winnerName = winner?.installer?.name || "the recommended quote";
    const confidence = rec.confidence || 0;
    const reasons = (rec.reasons || []).map(r => `<li style="margin-bottom:6px;">${r}</li>`).join("");
    const recommendation = rec.recommendation || "";

    const waMessage = encodeURIComponent(
      `Hi Solar AI Advisor,\n\nI just compared my solar quotes on your platform (Session: ${sessionId}) and would like to discuss my options.\n\nThank you.`
    );
    const waLink = `https://wa.me/919235169031?text=${waMessage}`;

    try {
      await admin.firestore().collection("mail").add({
        to: after.contactEmail,
        replyTo: "hello@solaraiadvisor.com",
        message: {
          subject: "Your AI Solar Quote Comparison is Ready",
          html: `
            <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px;">
              <h2 style="color: #003366;">Your Solar Quote Comparison Report</h2>
              <p>Your AI-powered quote comparison is complete.</p>

              <div style="background:#f0f7ff; padding:15px; border-radius:8px; margin:20px 0; text-align:center;">
                <div style="font-size:12px; color:#003366; font-weight:bold; text-transform:uppercase;">AI Recommendation</div>
                <h3 style="margin:6px 0; color:#003366;">${winnerName}</h3>
                <p style="margin:0; color:#555; font-size:13px;">Confidence: ${confidence}%</p>
              </div>

              <p style="font-size:14px; color:#333;">${recommendation}</p>

              ${reasons ? `<ul style="margin-top:16px;">${reasons}</ul>` : ""}

              <div style="text-align:center; margin:30px 0;">
                <a href="${waLink}" style="background-color:#25D366; color:white; padding:15px 30px; text-decoration:none; border-radius:8px; font-weight:bold; display:inline-block;">
                  💬 Discuss With Our Advisor
                </a>
              </div>

              <p style="font-size:11px; color:#999; text-align:center;">
                AI recommendation is based on information extracted from your documents. Verify all details before signing any agreement.
              </p>
            </div>
          `
        }
      });
      console.log(`[triggerQuoteCompletionEmail] Email queued for session ${sessionId}`);
    } catch (err) {
      console.error(`[triggerQuoteCompletionEmail] Failed for session ${sessionId}:`, err);
    }

    return null;
  }
);
