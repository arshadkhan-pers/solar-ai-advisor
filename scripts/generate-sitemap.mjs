#!/usr/bin/env node
// Generates sitemap.xml from data/seo-metadata.json plus any markdown articles
// in src/content/learn/ — keeps the sitemap in sync with both data sources
// without manual maintenance. Re-running is safe and idempotent.
import { readFileSync, writeFileSync, readdirSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const rootDir = join(dirname(fileURLToPath(import.meta.url)), "..");
const meta = JSON.parse(readFileSync(join(rootDir, "data/seo-metadata.json"), "utf8"));
const { baseUrl } = meta.site;

function absoluteUrl(path) {
  return path ? `${baseUrl}/${path}` : `${baseUrl}/`;
}

const pageUrls = Object.values(meta.pages)
  .filter((page) => !page.skipFullSeo)
  .map((page) => absoluteUrl(page.path));

// Add article URLs from src/content/learn/*.md
const learnDir = join(rootDir, "src/content/learn");
let articleUrls = [];
try {
  articleUrls = readdirSync(learnDir)
    .filter((f) => f.endsWith(".md"))
    .map((f) => `${baseUrl}/learn/${f.replace(".md", "")}.html`);
} catch {
  // Directory does not exist yet — skip silently
}

const urls = [...pageUrls, ...articleUrls];
const body = urls.map((url) => `\n<url>\n<loc>${url}</loc>\n</url>\n`).join("");

const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`;

writeFileSync(join(rootDir, "sitemap.xml"), xml, "utf8");
console.log(`Generated sitemap.xml with ${urls.length} URLs (${pageUrls.length} pages + ${articleUrls.length} articles)`);
