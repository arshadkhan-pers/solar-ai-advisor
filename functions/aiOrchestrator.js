/**
 * AI Orchestration Layer
 *
 * Single entry point for all AI provider calls. No engine calls Gemini or
 * Claude directly — everything routes through here. Swap providers by changing
 * EXTRACTION_PROVIDER or REASONING_PROVIDER env vars; no business logic changes.
 *
 * Supported providers:
 *   extraction: "gemini" (default)
 *   reasoning:  "claude" (default) | "gemini"
 */

const { GoogleGenerativeAI } = require("@google/generative-ai");
const Anthropic = require("@anthropic-ai/sdk");

const EXTRACTION_PROVIDER = process.env.EXTRACTION_PROVIDER || "gemini";
const REASONING_PROVIDER  = process.env.REASONING_PROVIDER  || "claude";

// ---------------------------------------------------------------------------
// EXTRACTION — Document OCR → structured JSON
// ---------------------------------------------------------------------------

async function extractQuoteData(fileBase64, mimeType) {
  if (EXTRACTION_PROVIDER === "gemini") {
    return _extractWithGemini(fileBase64, mimeType);
  }
  throw new Error(`Unsupported extraction provider: ${EXTRACTION_PROVIDER}`);
}

async function _extractWithGemini(fileBase64, mimeType) {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const prompt = `You are a solar quote data extractor. Extract ALL of the following fields from this solar installation quotation document. Return ONLY a valid JSON object — no markdown, no explanation, no code fences.

Required fields (use null if not found):
{
  "installer": { "name": string, "city": string, "contact": string },
  "system": { "capacityKw": number, "type": string },
  "panels": { "brand": string, "model": string, "quantity": number, "watt": number },
  "inverter": { "brand": string, "model": string, "warrantyYears": number },
  "pricing": { "total": number, "gstIncluded": boolean, "subsidyIncluded": boolean },
  "installation": { "spd": boolean, "earthing": boolean, "lightningArrestor": boolean, "netMetering": boolean },
  "warranty": { "panelProduct": number, "panelPerformance": number, "installation": number }
}

For boolean fields: return true if explicitly mentioned, false if explicitly absent, null if not mentioned.
For number fields: return the numeric value only (no units, no currency symbols).`;

  const result = await model.generateContent([
    prompt,
    {
      inlineData: {
        mimeType: mimeType,
        data: fileBase64
      }
    }
  ]);

  const text = result.response.text().trim();

  // Strip markdown code fences if Gemini wraps the JSON anyway
  const cleaned = text.replace(/^```(?:json)?\n?/i, "").replace(/\n?```$/i, "").trim();

  return JSON.parse(cleaned);
}

// ---------------------------------------------------------------------------
// REASONING — Comparison JSON → recommendation narrative
// ---------------------------------------------------------------------------

async function generateRecommendation(comparisonJson) {
  if (REASONING_PROVIDER === "claude") {
    return _recommendWithClaude(comparisonJson);
  }
  if (REASONING_PROVIDER === "gemini") {
    return _recommendWithGemini(comparisonJson);
  }
  throw new Error(`Unsupported reasoning provider: ${REASONING_PROVIDER}`);
}

async function _recommendWithClaude(comparisonJson) {
  const quoteCount = comparisonJson.quotes?.length || 1;
  const modelId = quoteCount >= 3 ? "claude-sonnet-4-6" : "claude-haiku-4-5-20251001";

  const client = new Anthropic.default({ apiKey: process.env.ANTHROPIC_API_KEY });

  const systemPrompt = `You are an expert solar advisor helping Indian homeowners compare solar installation quotations.
You have deep knowledge of solar equipment brands, pricing norms, and installation quality standards in India.
Always be factual. Do not invent missing information. When data is null or missing, acknowledge it.`;

  const userPrompt = `Compare these solar quotations and provide a recommendation.

Quotation data:
${JSON.stringify(comparisonJson, null, 2)}

Return a JSON object with exactly this structure (no markdown, no explanation):
{
  "winnerIndex": number (0-based index of the best quote, or null if all are poor),
  "confidence": number (0-100, how confident you are in the recommendation),
  "reasons": string[] (3-5 specific reasons why this quote wins),
  "recommendation": string (2-3 sentence plain-English explanation for the homeowner),
  "negotiationTips": string[] (1-3 actionable negotiation tips for the winner quote),
  "warnings": string[] (any important warnings about ALL quotes, or empty array)
}`;

  const message = await client.messages.create({
    model: modelId,
    max_tokens: 1024,
    system: systemPrompt,
    messages: [{ role: "user", content: userPrompt }]
  });

  const text = message.content[0].text.trim();
  const cleaned = text.replace(/^```(?:json)?\n?/i, "").replace(/\n?```$/i, "").trim();
  return JSON.parse(cleaned);
}

async function _recommendWithGemini(comparisonJson) {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const prompt = `You are an expert solar advisor. Compare these solar quotations for an Indian homeowner and return a recommendation.

Quotation data:
${JSON.stringify(comparisonJson, null, 2)}

Return ONLY a valid JSON object with exactly this structure (no markdown):
{
  "winnerIndex": number (0-based index of the best quote, or null if all are poor),
  "confidence": number (0-100),
  "reasons": string[] (3-5 specific reasons),
  "recommendation": string (2-3 sentence plain English),
  "negotiationTips": string[] (1-3 tips),
  "warnings": string[]
}`;

  const result = await model.generateContent(prompt);
  const text = result.response.text().trim();
  const cleaned = text.replace(/^```(?:json)?\n?/i, "").replace(/\n?```$/i, "").trim();
  return JSON.parse(cleaned);
}

module.exports = { extractQuoteData, generateRecommendation };
