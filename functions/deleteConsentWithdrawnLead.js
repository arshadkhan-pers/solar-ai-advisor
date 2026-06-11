const functions = require("firebase-functions");
const admin = require("firebase-admin");

const db = admin.firestore();

exports.deleteConsentWithdrawnLead =
functions.pubsub
.schedule("every 60 minutes")
.timeZone("Asia/Kolkata")
.onRun(async () => {

  const now = new Date();

  const snapshot =
    await db.collection("consent_withdrawals")
    .where("deletionStatus", "==", "PENDING")
    .get();

  if (snapshot.empty) {
    console.log("No pending deletions.");
    return null;
  }

  for (const doc of snapshot.docs) {

    const withdrawal = doc.data();

    const deletionAfter =
      withdrawal.deletionAfter?.toDate?.();

    if (!deletionAfter) continue;

    if (deletionAfter > now) continue;

    const leadId = withdrawal.leadId;

    try {

      console.log(
        `Deleting lead ${leadId}`
      );

      // ----------------------------------
      // Delete Firestore Documents
      // ----------------------------------

      await db.collection("leads")
        .doc(leadId)
        .delete()
        .catch(() => {});

      await db.collection("ai_reports")
        .doc(leadId)
        .delete()
        .catch(() => {});

      await db.collection("survey_requests")
        .doc(leadId)
        .delete()
        .catch(() => {});

      // ----------------------------------
      // Delete Uploaded Files
      // ----------------------------------

      const bucket =
        admin.storage().bucket();

      await bucket.file(
        `bills/${leadId}`
      ).delete().catch(() => {});

      await bucket.file(
        `quotes/${leadId}`
      ).delete().catch(() => {});

      // ----------------------------------
      // Mark Completed
      // ----------------------------------

      await doc.ref.update({

        deletionStatus: "COMPLETED",

        deletedAt:
          admin.firestore.FieldValue.serverTimestamp()

      });

      console.log(
        `Successfully deleted ${leadId}`
      );

    } catch (err) {

      console.error(
        `Deletion failed for ${leadId}`,
        err
      );

      await doc.ref.update({

        deletionStatus: "FAILED",

        failureReason: err.message,

        lastAttemptAt:
          admin.firestore.FieldValue.serverTimestamp()

      });
    }
  }

  return null;
});
