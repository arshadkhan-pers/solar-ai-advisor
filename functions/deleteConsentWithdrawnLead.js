const functions = require("firebase-functions");
const admin = require("firebase-admin");

exports.deleteConsentWithdrawnLead =
functions.firestore
.document("leads/{leadId}")
.onUpdate(async (change, context) => {

  const before = change.before.data();
  const after = change.after.data();

  if (
    before.deletionRequested === after.deletionRequested
  ) {
    return null;
  }

  if (!after.deletionRequested) {
    return null;
  }

  const leadId = context.params.leadId;

  const db = admin.firestore();

  try {

    await admin.storage().bucket().file(`bills/${leadId}`).delete()
      .catch(() => {});

    await admin.storage().bucket().file(`quotes/${leadId}`).delete()
      .catch(() => {});

    await db.collection("ai_reports")
      .doc(leadId)
      .delete()
      .catch(() => {});

    await db.collection("survey_requests")
      .doc(leadId)
      .delete()
      .catch(() => {});

    await db.collection("leads")
      .doc(leadId)
      .delete()
      .catch(() => {});

    console.log(`Deleted customer ${leadId}`);

  } catch (err) {

    console.error(err);

  }

  return null;
});
