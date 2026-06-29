#!/usr/bin/env node
// Validates every JSON-LD block in the built dist/ output (run `npm run build`
// first) — catches a future regression (invalid JSON, missing required
// schema.org fields) automatically instead of relying on manual spot-checks.
import { readFileSync, globSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const rootDir = join(dirname(fileURLToPath(import.meta.url)), "..");
const distDir = join(rootDir, "dist");
const files = globSync(join(distDir, "*.html"));

if (files.length === 0) {
  throw new Error(`No HTML files found in ${distDir} — run "npm run build" first.`);
}

const requiredFields = {
  Organization: ["name", "url"],
  WebSite: ["name", "url"],
  BreadcrumbList: ["itemListElement"],
  FAQPage: ["mainEntity"],
};

let totalBlocks = 0;
const errors = [];

for (const file of files.sort()) {
  const html = readFileSync(file, "utf8");
  const matches = [...html.matchAll(/<script type="application\/ld\+json"[^>]*>(.*?)<\/script>/gs)];
  for (const m of matches) {
    totalBlocks++;
    let parsed;
    try {
      parsed = JSON.parse(m[1]);
    } catch (e) {
      errors.push(`${file}: INVALID JSON - ${e.message}`);
      continue;
    }
    const nodes = parsed["@graph"] ? parsed["@graph"] : [parsed];
    for (const node of nodes) {
      const type = node["@type"];
      if (!type) {
        errors.push(`${file}: JSON-LD node missing @type`);
        continue;
      }
      const required = requiredFields[type] || [];
      for (const field of required) {
        if (!(field in node)) {
          errors.push(`${file}: ${type} missing required field "${field}"`);
        }
      }
      if (type === "FAQPage") {
        for (const q of node.mainEntity || []) {
          if (q["@type"] !== "Question" || !q.name || !q.acceptedAnswer?.text) {
            errors.push(`${file}: FAQPage has a malformed Question entry`);
          }
        }
      }
      if (type === "BreadcrumbList") {
        for (const item of node.itemListElement || []) {
          if (!item.position || !item.name || !item.item) {
            errors.push(`${file}: BreadcrumbList has a malformed ListItem`);
          }
        }
      }
    }
  }
}

console.log(`Checked ${files.length} pages, ${totalBlocks} JSON-LD blocks total.`);
if (errors.length) {
  console.log(`\n${errors.length} issue(s) found:`);
  errors.forEach((e) => console.log(" -", e));
  process.exit(1);
}
console.log("All JSON-LD blocks valid.");
