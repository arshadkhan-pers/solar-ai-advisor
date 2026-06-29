#!/usr/bin/env node
// Generates sitemap.xml from data/seo-metadata.json — same file, same URL,
// same <url><loc>...</loc></url> shape as before, just data-driven instead of
// hand-maintained, so it can never drift from the actual page set. Re-running
// is safe and idempotent.
import { readFileSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const rootDir = join(dirname(fileURLToPath(import.meta.url)), "..");
const meta = JSON.parse(readFileSync(join(rootDir, "data/seo-metadata.json"), "utf8"));
const { baseUrl } = meta.site;

function absoluteUrl(path) {
  return path ? `${baseUrl}/${path}` : `${baseUrl}/`;
}

const urls = Object.values(meta.pages)
  .filter((page) => !page.skipFullSeo)
  .map((page) => absoluteUrl(page.path));

const body = urls.map((url) => `\n<url>\n<loc>${url}</loc>\n</url>\n`).join("");

const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`;

writeFileSync(join(rootDir, "sitemap.xml"), xml, "utf8");
console.log(`Generated sitemap.xml with ${urls.length} URLs`);
