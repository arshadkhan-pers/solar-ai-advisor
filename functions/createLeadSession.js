const { onCall } =
require("firebase-functions/v2/https");

const admin =
require("firebase-admin");

const crypto =
require("crypto");

const db =
admin.firestore();

exports.createLeadSession =
onCall(
{
  region: "asia-south2"
},
async (request) => {

  const {
    leadId,
    phone,
    pin
  } = request.data;

  if (!leadId) {
    throw new Error("Missing leadId");
  }

  if (!phone) {
    throw new Error("Missing phone");
  }

  if (!pin || pin.length !== 4) {
    throw new Error("Invalid PIN");
  }

  const pinHash =
    crypto
      .createHash("sha256")
      .update(pin)
      .digest("hex");

  const sessionToken =
    crypto.randomUUID();

  const leadRef =
    db.collection("leads")
      .doc(leadId);

  const surveyRef =
    db.collection("survey_requests")
      .doc(leadId);

  const batch =
    db.batch();

  batch.update(
    leadRef,
    {
      pinHash,
      sessionToken,

      stage:
        "SURVEY_REQUESTED",

      phoneVerified: true,

      phoneVerifiedAt:
        admin.firestore
          .FieldValue
          .serverTimestamp(),

      "timeline.surveyRequested.status":
        true,

      "timeline.surveyRequested.timestamp":
        admin.firestore
          .FieldValue
          .serverTimestamp()
    }
  );

  batch.set(
    surveyRef,
    {
      leadId,
      phone,

      status:
        "pending",

      requestedAt:
        admin.firestore
          .FieldValue
          .serverTimestamp()
    }
  );

  await batch.commit();

  return {
    success: true,
    sessionToken
  };
});