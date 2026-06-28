#!/usr/bin/env node
// Injects canonical/OG/Twitter/robots/JSON-LD tags into root HTML pages from data/seo-metadata.json.
// Re-running is safe: each page's managed block is fully replaced, not appended.
import { readFileSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const rootDir = join(dirname(fileURLToPath(import.meta.url)), "..");
const meta = JSON.parse(readFileSync(join(rootDir, "data/seo-metadata.json"), "utf8"));
const { baseUrl, defaultOgImage, organization } = meta.site;

// Generated from data/seo-metadata.json by this script — do not hand-edit, re-run the script instead.
const BLOCK_START = "<!-- BEGIN SEO-METADATA -->";
const BLOCK_END = "<!-- END SEO-METADATA -->";

function esc(str) {
  return String(str).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function absoluteUrl(path) {
  return path ? `${baseUrl}/${path}` : `${baseUrl}/`;
}

const GENERATED_NOTICE = "<!-- Generated from data/seo-metadata.json by scripts/inject-seo-metadata.mjs — do not hand-edit, re-run the script instead -->";

function buildBlock(filename, page) {
  if (page.skipFullSeo) {
    return [BLOCK_START, GENERATED_NOTICE, `<meta name="robots" content="${esc(page.robots)}">`, BLOCK_END].join("\n");
  }

  const url = absoluteUrl(page.path);
  const ogImage = absoluteUrl(page.ogImage || defaultOgImage);
  const lines = [
    BLOCK_START,
    GENERATED_NOTICE,
    `<meta name="description" content="${esc(page.description)}">`,
    `<link rel="canonical" href="${url}">`,
    `<meta name="robots" content="${esc(page.robots)}">`,
    `<meta property="og:type" content="${esc(page.ogType)}">`,
    `<meta property="og:site_name" content="${esc(meta.site.name)}">`,
    `<meta property="og:title" content="${esc(page.title)}">`,
    `<meta property="og:description" content="${esc(page.description)}">`,
    `<meta property="og:url" content="${url}">`,
    `<meta property="og:image" content="${ogImage}">`,
    `<meta name="twitter:card" content="summary_large_image">`,
    `<meta name="twitter:title" content="${esc(page.title)}">`,
    `<meta name="twitter:description" content="${esc(page.description)}">`,
    `<meta name="twitter:image" content="${ogImage}">`,
  ];

  const jsonLdBlocks = [];

  if (page.isHome) {
    jsonLdBlocks.push({
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "Organization",
          "@id": `${baseUrl}/#organization`,
          name: organization.name,
          url: organization.url,
          logo: organization.logo,
          email: organization.email,
          description: organization.description,
        },
        {
          "@type": "WebSite",
          "@id": `${baseUrl}/#website`,
          name: meta.site.name,
          url: baseUrl,
          publisher: { "@id": `${baseUrl}/#organization` },
        },
      ],
    });
  } else if (page.breadcrumbLabel) {
    jsonLdBlocks.push({
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: `${baseUrl}/` },
        { "@type": "ListItem", position: 2, name: page.breadcrumbLabel, item: url },
      ],
    });
  }

  if (page.faq && page.faq.length) {
    jsonLdBlocks.push({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: page.faq.map((qa) => ({
        "@type": "Question",
        name: qa.question,
        acceptedAnswer: { "@type": "Answer", text: qa.answer },
      })),
    });
  }

  for (const block of jsonLdBlocks) {
    lines.push(`<script type="application/ld+json">${JSON.stringify(block)}</script>`);
  }

  lines.push(BLOCK_END);
  return lines.join("\n");
}

function stripManagedTags(html) {
  // Remove any pre-existing managed block from a previous run.
  html = html.replace(new RegExp(`${escapeRegExp(BLOCK_START)}[\\s\\S]*?${escapeRegExp(BLOCK_END)}\\n?`, "g"), "");
  // Remove hand-authored description/robots tags so the JSON file becomes the single source of truth.
  // Use a backreference for the closing quote so content text containing the *other*
  // quote character (e.g. an apostrophe inside a double-quoted attribute) doesn't end the match early.
  html = html.replace(/<meta\s+name=["']description["']\s+content=(["'])(?:(?!\1)[\s\S])*?\1\s*\/?>\s*/gi, "");
  html = html.replace(/<meta\s+name=["']robots["']\s+content=(["'])(?:(?!\1)[\s\S])*?\1\s*\/?>\s*/gi, "");
  return html;
}

let updated = 0;
for (const [filename, page] of Object.entries(meta.pages)) {
  const filePath = join(rootDir, filename);
  let html = readFileSync(filePath, "utf8");
  html = stripManagedTags(html);

  const block = buildBlock(filename, page);
  const titleMatch = html.match(/<\/title>/i);
  if (!titleMatch) {
    throw new Error(`No <title> tag found in ${filename}, cannot anchor SEO block`);
  }
  const insertAt = titleMatch.index + titleMatch[0].length;
  html = html.slice(0, insertAt) + "\n" + block + html.slice(insertAt);

  writeFileSync(filePath, html, "utf8");
  updated++;
}

console.log(`Updated ${updated} page(s) from data/seo-metadata.json`);
