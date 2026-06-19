const { onCall, HttpsError } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const crypto = require("crypto");

const db = admin.firestore();

exports.createLeadSession = onCall(
  {
    region: "asia-south2"
  },
  async (request) => {
    const { leadId, phone, pin } = request.data;

    // 1. Core Validation
    if (!leadId) {
      throw new HttpsError("invalid-argument", "Missing leadId");
    }

    const sessionToken = crypto.randomUUID();
    const leadRef = db.collection("leads").doc(leadId);
    const batch = db.batch();

    // 2. Base mutation payload applied to any session generation
    const leadUpdates = {
      sessionToken,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    // 3. Conditional Pipeline Processing
    // Run this ONLY if a new phone and PIN setup are explicitly requested
    if (phone || pin) {
      if (!phone) {
        throw new HttpsError("invalid-argument", "Missing phone number for initialization.");
      }
      if (!pin || pin.length !== 4) {
        throw new HttpsError("invalid-argument", "Invalid PIN. Code must be 4 digits.");
      }

      const pinHash = crypto.createHash("sha256").update(pin).digest("hex");
      const surveyRef = db.collection("survey_requests").doc(leadId);

      // Append survey setup requirements to our lead document mutation
      leadUpdates.pinHash = pinHash;
      leadUpdates.stage = "SURVEY_REQUESTED";
      leadUpdates.phoneVerified = true;
      leadUpdates.phoneVerifiedAt = admin.firestore.FieldValue.serverTimestamp();
      leadUpdates["timeline.surveyRequested.status"] = true;
      leadUpdates["timeline.surveyRequested.timestamp"] = admin.firestore.FieldValue.serverTimestamp();

      // Enqueue fresh survey request entry creation
      batch.set(surveyRef, {
        leadId,
        phone,
        status: "pending",
        requestedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }

    // 4. Commit atomic update lifecycle execution
    batch.update(leadRef, leadUpdates);
    await batch.commit();

    return {
      success: true,
      sessionToken
    };
  }
);
