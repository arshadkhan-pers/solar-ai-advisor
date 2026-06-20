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
    if (!leadId || leadId === "undefined") {
      throw new HttpsError("invalid-argument", "Missing leadId");
    }
    
    // 🚀 FIX: Swapped to randomBytes to prevent Node.js version incompatibilities
    const sessionToken = crypto.randomBytes(16).toString("hex"); 
    
    const leadRef = db.collection("leads").doc(leadId);
    const batch = db.batch();

    // 2. Base mutation payload applied to any session generation
    const leadUpdates = {
      sessionToken,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    // 3. Conditional Pipeline Processing
    if (phone || pin) {
      if (!phone) {
        throw new HttpsError("invalid-argument", "Missing phone number for initialization.");
      }
      if (!pin || pin.length !== 4) {
        throw new HttpsError("invalid-argument", "Invalid PIN. Code must be 4 digits.");
      }

      const pinHash = crypto.createHash("sha256").update(pin).digest("hex");
      const surveyRef = db.collection("survey_requests").doc(leadId);

      leadUpdates.pinHash = pinHash;
      leadUpdates.stage = "SURVEY_REQUESTED";
      leadUpdates.phoneVerified = true;
      leadUpdates.phoneVerifiedAt = admin.firestore.FieldValue.serverTimestamp();
      leadUpdates["timeline.surveyRequested.status"] = true;
      leadUpdates["timeline.surveyRequested.timestamp"] = admin.firestore.FieldValue.serverTimestamp();

      batch.set(surveyRef, {
        leadId,
        phone,
        status: "pending",
        requestedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }

    // 4. Commit atomic update
    batch.update(leadRef, leadUpdates);
    await batch.commit();

    return {
      success: true,
      sessionToken
    };
  }
);
