const { onCall, HttpsError } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const crypto = require("crypto");

const db = admin.firestore();

exports.createLeadSession = onCall(
  {
    region: "asia-south2"
  },
  async (request) => {
    let { leadId, phone, pin } = request.data;

    // 1. Core Validation
    if (!leadId || leadId === "undefined") {
      throw new HttpsError("invalid-argument", "Missing leadId");
    }

    // 2. Fetch Phone from Database if it's missing  from the request
    if (!phone) {
      const leadDoc = await db.collection("leads").doc(leadId).get();
      if (leadDoc.exists) {
        phone = leadDoc.data().phone;
      }
    }

    // 3. If we still don't have a phone, we MUST stop (Critical for survey_requests)
    if (!phone) {
      throw new HttpsError("invalid-argument", "Missing phone number and could not be retrieved from database.");
    }

    // Proceed with session generation
    const sessionToken = crypto.randomBytes(16).toString("hex"); 
    
    const leadRef = db.collection("leads").doc(leadId);
    const batch = db.batch();

    const sessionRef =
  db.collection("lead_sessions")
    .doc(sessionToken);

batch.set(sessionRef, {
  leadId,
  active: true,
  createdAt:
    admin.firestore.FieldValue.serverTimestamp(),
  expiresAt:
    admin.firestore.Timestamp.fromDate(
      new Date(
        Date.now() +
        (30 * 24 * 60 * 60 * 1000)
      )
    )
});
    

    const leadUpdates = {
      sessionToken,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    // 4. Conditional Pipeline Processing (only if PIN is provided, typically during first-time or re-auth)
    if (pin) {
      if (pin.length !== 4) {
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

    // 5. Commit atomic update
    batch.update(leadRef, leadUpdates);
    await batch.commit();

    return {
      success: true,
      sessionToken
    };
  }
);
