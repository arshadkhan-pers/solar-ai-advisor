/**
 * AQCS Cloud Functions
 *
 * Three functions handle the quote comparison lifecycle:
 *   1. initiateQuoteSession   — callable: create session + rate-limit check
 *   2. extractQuoteFromFile   — callable: Gemini OCR → normalize → update session
 *   3. generateQuoteComparison — Firestore trigger: run engines → Claude → finalize
 */

const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { onDocumentUpdated } = require("firebase-functions/v2/firestore");
const admin = require("firebase-admin");
const crypto = require("crypto");

const { extractQuoteData } = require("./aiOrchestrator");
const { normalizeQuote } = require("./engines/quoteExtractionEngine");
const { runRules } = require("./engines/quoteRuleEngine");
const { compareQuotes } = require("./engines/quoteComparisonEngine");
const { buildRecommendation } = require("./engines/quoteRecommendationEngine");

const REGION = "asia-south2";
const MAX_FREE_SESSIONS_PER_DAY = 3;

// =====================================================================
// 1. initiateQuoteSession
// =====================================================================

exports.initiateQuoteSession = onCall({ region: REGION }, async (request) => {
  const db = admin.firestore();

  // Derive a stable hash from the caller IP
  const rawIp = request.rawRequest?.ip ||
    request.rawRequest?.headers?.["x-forwarded-for"]?.split(",")[0]?.trim() ||
    "unknown";
  const ipHash = crypto.createHash("sha256").update(rawIp).digest("hex").slice(0, 16);

  const today = new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"

  // --- Rate limiting ---
  const rateLimitRef = db.collection("quote_rate_limits").doc(ipHash);
  const rateLimitDoc = await rateLimitRef.get();

  if (rateLimitDoc.exists) {
    const data = rateLimitDoc.data();
    if (data.date === today && data.count >= MAX_FREE_SESSIONS_PER_DAY) {
      throw new HttpsError(
        "resource-exhausted",
        `You have used all ${MAX_FREE_SESSIONS_PER_DAY} free comparisons for today. Please try again tomorrow.`
      );
    }
  }

  // --- Create session ---
  const sessionRef = db.collection("quote_sessions").doc();
  await sessionRef.set({
    status: "pending",
    files: [],
    extractedQuotes: [],
    comparison: null,
    recommendation: null,
    ipHash,
    userId: null,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    completedAt: null
  });

  // --- Increment rate limit counter ---
  await rateLimitRef.set(
    {
      ipHash,
      date: today,
      count: admin.firestore.FieldValue.increment(1),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    },
    { merge: true }
  );

  return { sessionId: sessionRef.id };
});

// =====================================================================
// 2. extractQuoteFromFile
// =====================================================================

exports.extractQuoteFromFile = onCall(
  { region: REGION, timeoutSeconds: 120, memory: "512MiB" },
  async (request) => {
    const { sessionId, fileBase64, mimeType, filename } = request.data;

    if (!sessionId || !fileBase64 || !mimeType) {
      throw new HttpsError("invalid-argument", "sessionId, fileBase64, and mimeType are required.");
    }

    const ALLOWED_TYPES = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
    if (!ALLOWED_TYPES.includes(mimeType)) {
      throw new HttpsError("invalid-argument", `Unsupported file type: ${mimeType}`);
    }

    const db = admin.firestore();
    const sessionRef = db.collection("quote_sessions").doc(sessionId);
    const sessionDoc = await sessionRef.get();

    if (!sessionDoc.exists) {
      throw new HttpsError("not-found", "Quote session not found.");
    }

    const session = sessionDoc.data();
    const fileIndex = (session.extractedQuotes || []).length;

    if (fileIndex >= 3) {
      throw new HttpsError("resource-exhausted", "Maximum 3 quotes per session.");
    }

    // Mark session as extracting
    await sessionRef.update({ status: "extracting" });

    let rawJson;
    try {
      rawJson = await extractQuoteData(fileBase64, mimeType);
    } catch (err) {
      console.error(`[extractQuoteFromFile] AI extraction failed for session ${sessionId}:`, err);
      // Store error state but don't crash — let frontend show manual entry fallback
      await sessionRef.update({
        status: session.extractedQuotes?.length > 0 ? "extracted" : "error",
        [`_extractErrors.file${fileIndex}`]: err.message
      });
      throw new HttpsError("internal", "Could not read the document. Please try a clearer image or enter details manually.");
    }

    const normalized = normalizeQuote(rawJson, fileIndex);

    // Append to extractedQuotes array
    await sessionRef.update({
      extractedQuotes: admin.firestore.FieldValue.arrayUnion(normalized),
      [`files`]: admin.firestore.FieldValue.arrayUnion({
        filename: filename || `quote_${fileIndex + 1}`,
        mimeType,
        uploadedAt: new Date().toISOString()
      }),
      status: "extracted"
    });

    return { success: true, fileIndex, normalized };
  }
);

// =====================================================================
// 3. generateQuoteComparison  (Firestore trigger)
//
// Fires when quote_sessions/{sessionId} is updated.
// Triggers when status changes to "comparing".
// Frontend sets status → "comparing" after user confirms extracted data.
// =====================================================================

exports.generateQuoteComparison = onDocumentUpdated(
  { document: "quote_sessions/{sessionId}", region: REGION, timeoutSeconds: 180, memory: "512MiB" },
  async (event) => {
    const change = event.data;
    if (!change) return null;

    const before = change.before.data();
    const after = change.after.data();

    if (!before || !after) return null;

    // Only trigger on status transition → "comparing"
    if (after.status !== "comparing" || before.status === "comparing") return null;

    const sessionRef = change.after.ref;
    const sessionId = event.params.sessionId;

    console.log(`[generateQuoteComparison] Processing session ${sessionId}`);

    try {
      const quotes = after.extractedQuotes || [];

      if (quotes.length === 0) {
        await sessionRef.update({ status: "error", errorMessage: "No quotes to compare." });
        return null;
      }

      // Run rule engine on each quote
      const risksPerQuote = quotes.map(q => runRules(q));

      // Run comparison engine
      const comparisonResult = compareQuotes(quotes);

      // Build AI recommendation
      const recommendation = await buildRecommendation(quotes, comparisonResult, risksPerQuote);

      // Write results back to Firestore
      await sessionRef.update({
        status: "complete",
        comparison: {
          scores: comparisonResult.scores,
          deterministicWinner: comparisonResult.deterministicWinner,
          risksPerQuote
        },
        recommendation,
        completedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      console.log(`[generateQuoteComparison] Completed session ${sessionId}, winner: ${recommendation.winnerIndex}`);

    } catch (err) {
      console.error(`[generateQuoteComparison] Error for session ${sessionId}:`, err);
      await sessionRef.update({
        status: "error",
        errorMessage: err.message || "An error occurred during comparison."
      });
    }

    return null;
  }
);
