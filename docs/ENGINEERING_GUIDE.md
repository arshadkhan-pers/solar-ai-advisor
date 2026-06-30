# Solar AI Advisor Engineering Guide

**Version:** 0.1.0

**Status:** Living Document

**Owner**
Mohammad Arshad Khan

**Product Owner**
Mohammad Arshad Khan

**Architecture & Technical Strategy**
ChatGPT, GEMINI, Claude Code

**Implementation & Refactoring**
Claude Code

---

# Current Project Priority

Until further notice, all engineering work should prioritize improving Google's ability to crawl, index, and rank Solar AI Advisor.

Preferred order of work:

1. Technical SEO
2. Indexability
3. Performance
4. Content Quality
5. User Experience
6. Architecture Improvements
7. Feature Expansion

**Do not perform large-scale refactoring unless explicitly requested.**

---

# Vision

Solar AI Advisor is being built as India's most trusted AI-powered solar advisory platform.

The platform must prioritize:

* Trust
* Performance
* SEO
* Security
* Scalability
* Maintainability

Every engineering decision should support these principles.

---

# Long-Term Product Vision

The platform will evolve into:

* AI Solar Advisor
* Knowledge Center
* City Landing Pages
* Installer Marketplace
* Customer Dashboard
* Installer Dashboard
* AI Recommendation Engine
* Financing Marketplace
* Solar Monitoring
* Mobile Application
* Progressive Web App (PWA)

The architecture must support these future capabilities without major rewrites.

---

# Technology Stack

## Current

* HTML
* JavaScript
* Firebase Authentication
* Firestore
* Firebase Functions
* GitHub
* GitHub Pages
* GoDaddy DNS

## Target

* Astro
* TypeScript (where beneficial)
* Modular Components
* Static Site Generation
* Partial Hydration
* WebP / AVIF
* JSON-LD Structured Data
* GitHub Actions
* Firebase Hosting (Optional Future)

---

# Architecture Principles

1. Simplicity first.
2. Do not over-engineer.
3. Prefer static generation wherever possible.
4. Use JavaScript only when necessary.
5. SEO always takes priority.
6. Performance before animations.
7. Accessibility is mandatory.
8. Reuse components.
9. Avoid duplication.
10. Every page should have one clear purpose.

---

# Git Workflow

**Never commit directly to `main`.**

Workflow:

main

↓

develop

↓

feature/<feature-name>

↓

Pull Request / Review

↓

develop

↓

main

Every change must be implemented in a feature branch and reviewed before merging into **develop**.

---

# Branch Naming

* feature/
* bugfix/
* hotfix/
* release/
* docs/

---

# Commit Message Format

Examples:

* feat: add reusable metadata component
* fix: resolve canonical URL issue
* seo: implement organization schema
* perf: replace Tailwind CDN
* docs: update engineering guide
* refactor: migrate footer to Astro component

---

# Coding Standards

## Prefer

* Small functions
* Readable code
* Meaningful names
* Configuration over hardcoding
* Reusable components over duplicated markup

## Avoid

* Magic numbers
* Duplicate logic
* Inline styles
* Large HTML blocks
* Repeated metadata

---

# Astro Principles

Use Astro for:

* Layouts
* Pages
* Components
* Metadata
* Navigation
* Footer

Do **not** use Astro Islands unless interactivity is required.

Hydrate only:

* OTP
* Solar Calculator
* Authentication
* Consultation Popup
* Installer Portal
* Customer Dashboard

---

# SEO Standards

Every page must contain:

* Unique Title
* Unique Meta Description
* Canonical URL
* Open Graph Metadata
* Twitter Card Metadata
* JSON-LD Structured Data
* Breadcrumb Schema (where applicable)
* Robots Indexing Allowed
* XML Sitemap
* No Duplicate Metadata
* Unique H1
* Internal Links to Related Pages

---

# URL Standards

Always:

* Lowercase
* Hyphen-separated
* Human-readable

Example:

Good

solar-panel-sizes.html

Bad

SolarPanelSizes.html

---

# Image Standards

Preferred:

* AVIF
* WebP

Avoid:

* PNG photographs
* BMP
* TIFF
* Oversized images

Every image should include:

* width
* height
* alt
* loading="lazy"
* decoding="async"

---

# Performance Targets

Lighthouse

* Performance ≥ 95
* SEO = 100
* Accessibility ≥ 95
* Best Practices = 100

Core Web Vitals

* LCP < 2.5s
* CLS < 0.1
* INP < 200ms

---

# Accessibility

Every feature should support:

* Image alt text
* Form labels
* Keyboard navigation
* Visible focus states
* Appropriate ARIA attributes where needed

---

# Security

* Never expose secrets.
* Never expose Firebase Admin credentials.
* Never trust client-side validation.
* Always validate in Cloud Functions.
* Use appropriate security headers.
* Sanitize user input.

---

# Reusable Components

Target reusable components include:

* BaseLayout
* SEOHead
* Header
* Footer
* Navigation
* Consultation Popup
* OTP Modal
* Lead Popup
* WhatsApp Button
* CTA Section
* Testimonials
* FAQ
* Calculator Card

---

# Documentation

Every major feature should include:

* Purpose
* Architecture
* Dependencies
* Future Improvements

---

# AI Collaboration Rules

## ChatGPT, Claude Code, and Gemini

* Owns architecture.
* Defines roadmap.
* Reviews implementations.
* Approves architectural decisions.

## Claude Code

* Implements code.
* Refactors incrementally.
* Never rewrites architecture without approval.
* Asks for clarification when assumptions are required.

## Product Owner

Mohammad Arshad Khan

* Final approver for all changes.

No implementation reaches **main** until reviewed and approved.

---

# Definition of Done

A task is complete only when:

* Code reviewed
* SEO verified
* Performance checked
* No console errors
* No broken links
* Responsive
* Accessible
* Production ready
* Git committed
* Documentation updated
* Google Search Console impact considered
* No regression to existing indexed pages

---

# Current Roadmap

Sprint 1

Technical SEO Foundation

Sprint 2

Reusable Layouts (Astro)

Sprint 3 — Google Indexing & Authority
Technical SEO
Canonical URLs on every page.
Optimized titles and descriptions.
Open Graph and Twitter metadata.
JSON-LD schemas (Organization, Website, Breadcrumb, FAQ where applicable).
XML sitemap validation.
robots.txt review.
Custom 404 page.
Proper redirects where needed.
Crawlability
Strong internal linking.
Breadcrumb navigation.
Clean URL structure.
No orphan pages.
Verify no broken links.
Performance
Replace any remaining CDN dependencies if applicable.
Image optimization (WebP/AVIF).
Lazy loading.
Critical CSS.
JavaScript optimization.
Core Web Vitals improvements.
Search Console
Submit updated sitemap.
Request indexing for priority pages.
Monitor crawl statistics.
Resolve indexing warnings.
Monitor coverage reports.
Authority
Strengthen About, Contact, Privacy, Terms, Disclaimer, Buyer Protection pages.
Add Organization schema.
Ensure consistent branding and business information.
Success Criteria for Sprint 3

I would define measurable goals rather than "SEO completed":

✅ All important pages indexed.
✅ No critical Search Console issues.
✅ Lighthouse SEO: 100.
✅ Performance: ≥95.
✅ Core Web Vitals pass.
✅ No broken internal links.
✅ Structured data validates successfully.
✅ Rich Results Test passes.
✅ First meaningful Google impressions begin increasing.

Sprint 4

Performance Optimization

Sprint 5 — Knowledge Center

Goal: Build a scalable content infrastructure that drives organic search traffic, builds
topical authority for solar advisory, and creates internal linking paths that strengthen
crawlability of existing pages. Lays the content scaffolding that Sprint 6 City Landing
Pages will reuse.

Infrastructure
Astro Content Collections (src/content/learn/) with Zod schema for articles.
ArticleLayout.astro for article-specific SEO, breadcrumbs, and structured data.
@tailwindcss/typography for styled markdown rendering.
Updated generate-sitemap.mjs to include content collection article URLs.
Updated validate-jsonld.mjs to scan dist/**/*.html (not just root).

Hub & Pages
/learn.html — Knowledge Center hub page listing all articles (uses seo-metadata.json).
/faq.html — Consolidated FAQ hub with FAQPage JSON-LD (20+ Q&As across topics).
/solar-glossary.html — 25-term solar glossary with DefinedTermSet JSON-LD.

Articles (src/content/learn/)
pm-surya-ghar-guide — PM Surya Ghar Muft Bijli Yojana: Complete Guide for Indian Homeowners.
how-to-choose-solar-installer — How to Choose a Solar Installer in India.
net-metering-india — Net Metering in India: How It Works and Why It Matters.
on-grid-vs-off-grid-solar — On-Grid vs Off-Grid Solar: Which Is Right for You?
solar-system-sizing-guide — Solar System Sizing: How Many kW Do You Actually Need?

Internal Linking
System-size guide pages → solar-system-sizing-guide article.
buyer-protection.astro → how-to-choose-solar-installer article.
Footer Learn section → /learn.html hub + /faq.html + /solar-glossary.html.
All articles → CTA linking back to main calculator (index.html).

Structured Data Per Article Page
Article schema (headline, datePublished, dateModified, publisher).
BreadcrumbList (Home → Learn → Article title).
FAQPage (where frontmatter faq array is defined).

Success Criteria for Sprint 5

Build zero errors, all article slugs resolve.
validate-jsonld passes for all pages including dist/learn/*.html.
Lighthouse SEO = 100 on /learn.html, a sample article, /faq.html, /solar-glossary.html.
All new pages in sitemap.xml.
No regression on existing 28 pages.
Rich Results Test passes for at least one article (Article + FAQPage).

Sprint 6 — Local SEO Dominance: Lucknow & Raebareli

Goal: Rank at the top of Google search results for solar-related queries in Lucknow and
Raebareli, Uttar Pradesh. This sprint combines city-specific landing pages, LocalBusiness
structured data, UPPCL-localised content, and site-wide geographic signals to make
Solar AI Advisor the dominant rooftop solar resource for these two cities.

Target queries (illustrative, not exhaustive):
- "rooftop solar Lucknow"
- "solar panel price Lucknow 2026"
- "solar installation Lucknow"
- "PM Surya Ghar Lucknow"
- "UPPCL net metering Lucknow"
- "solar subsidy UP 2026"
- "solar panel Raebareli"
- "solar installer Raebareli"
- "solar subsidy Raebareli"
- "best solar company Lucknow"

Identity & constraint reminders (must be respected across all Sprint 6 work):
- No founder name, photo, or personal identity anywhere
- No GSTIN — not GST-registered, pre-revenue
- Location: Lucknow, Uttar Pradesh, India — city-level only, no street address
- No fabricated customer stats, testimonials, or unverified claims

---

PR A — LocalBusiness Schema + Organisation areaServed

Files: data/seo-metadata.json, src/pages/index.astro

Changes:
1. Organisation schema (seo-metadata.json site.organization):
   - Add "areaServed": ["Lucknow", "Raebareli", "Uttar Pradesh"] to the organization block.
   - This propagates to every page that renders the Organisation JSON-LD.

2. LocalBusiness JSON-LD on homepage (index.astro):
   - Emit a second JSON-LD block of @type LocalBusiness alongside the existing
     Organisation/Website blocks.
   - Include: name, url, logo, email, description, areaServed, address
     (addressLocality: Lucknow, addressRegion: Uttar Pradesh, addressCountry: IN),
     and geo (@type: GeoCoordinates, latitude: 26.8467, longitude: 80.9462).
   - @type should be "LocalBusiness" with additionalType pointing to solar advisory.

3. Meta description updates (seo-metadata.json):
   - Homepage: include "Lucknow & Uttar Pradesh" in description.
   - about.html, contact.html: add "Lucknow, Uttar Pradesh" where natural.
   - Key kW pages: append "in Uttar Pradesh" or similar to descriptions.

Success criteria:
- Rich Results Test shows LocalBusiness block on homepage.
- validate-jsonld passes with new block.
- Organisation areaServed present in all page JSON-LD.

---

PR B — Lucknow City Landing Page

File: src/pages/rooftop-solar-lucknow.astro
seo-metadata.json entry: rooftop-solar-lucknow.html

Target URL: /rooftop-solar-lucknow.html

Target queries:
- rooftop solar Lucknow / solar panels Lucknow
- solar panel price Lucknow 2026
- solar installation Lucknow
- PM Surya Ghar Lucknow / solar subsidy Lucknow
- UPPCL net metering Lucknow
- best solar company Lucknow
- solar for home Lucknow

Page structure (sections):
1. Hero — "Rooftop Solar in Lucknow" with city-specific H1, bill range CTA
2. Why Solar Makes Sense in Lucknow — local solar irradiance context (high sun hours
   in UP), rising UPPCL tariffs, PM Surya Ghar eligibility
3. How It Works for Lucknow Homeowners — UPPCL-specific net metering process
   (application to UPPCL/MVVNL, inspection, bi-directional meter, timeline)
4. Popular System Sizes for Lucknow — cards linking to 2kW/3kW/5kW pages with
   Lucknow-specific bill range context
5. PM Surya Ghar in Lucknow — UP-specific subsidy walkthrough, pmsuryaghar.gov.in
   portal, MVVNL empanelled installers
6. Neighbourhoods We Serve — Gomti Nagar, Hazratganj, Indira Nagar, Aliganj,
   Alambagh, Mahanagar, Vikas Nagar, Chinhat, Sultanpur Road, Faizabad Road
   (signals local relevance to Google; no fabricated claims about past installations)
7. FAQ — 6 Q&As specific to Lucknow (UPPCL process, UP subsidy, Lucknow climate,
   local installer what to check)
8. CTA — calculator with Lucknow framing

Schema on this page:
- BreadcrumbList (Home → Lucknow Solar)
- FAQPage (from the 6 local Q&As)
- LocalBusiness with geo for Lucknow

Internal links TO this page from:
- index.astro (add "Lucknow" city card in a new "Cities We Serve" section)
- All 6 kW system pages (add Lucknow card to Helpful Guides section)
- Footer (add Cities column or link under Learn)
- about.html, contact.html

Internal links FROM this page to:
- learn/pm-surya-ghar-guide.html
- learn/net-metering-india.html
- learn/how-to-choose-solar-installer.html
- 3kw-solar-system.html, 5kw-solar-system.html
- faq.html

---

PR C — Raebareli City Landing Page

File: src/pages/rooftop-solar-raebareli.astro
seo-metadata.json entry: rooftop-solar-raebareli.html

Target URL: /rooftop-solar-raebareli.html

Target queries:
- rooftop solar Raebareli / solar panels Raebareli
- solar installer Raebareli
- solar subsidy Raebareli / PM Surya Ghar Raebareli
- solar panel price Raebareli 2026
- PVVNL net metering Raebareli

Note: Raebareli falls under PVVNL (Paschimanchal Vidyut Vitran Nigam Ltd) or
MVVNL (Madhyanchal Vidyut Vitran Nigam Ltd) — verify the correct DISCOM and
use the accurate name throughout. Do NOT guess — look up or ask before publishing.

Page structure (similar to Lucknow):
1. Hero — "Rooftop Solar in Raebareli"
2. Why Solar in Raebareli — local context, grid reliability, PM Surya Ghar opportunity
3. DISCOM net metering process for Raebareli
4. Popular system sizes for Raebareli households
5. PM Surya Ghar in Raebareli — portal, empanelled installers, process
6. Areas in Raebareli — Civil Lines, Dalmau Road, Lalganj Road, Salon, Unchahar
7. FAQ — 5 Q&As specific to Raebareli
8. CTA

Schema: BreadcrumbList + FAQPage + LocalBusiness (areaServed: Raebareli)

Internal links TO this page from:
- index.astro Cities section
- rooftop-solar-lucknow.html (nearby city link)
- Footer

Internal links FROM this page to:
- learn/pm-surya-ghar-guide.html
- learn/net-metering-india.html
- rooftop-solar-lucknow.html

---

PR D — UPPCL Content Localisation Pass

Files: src/content/learn/net-metering-india.md,
       src/content/learn/pm-surya-ghar-guide.md,
       src/pages/about.astro, src/pages/contact.astro,
       src/pages/index.astro

Changes:
1. net-metering-india.md:
   - Add a "Net Metering in Uttar Pradesh" subsection covering:
     UPPCL / MVVNL / PVVNL as the relevant DISCOMs for UP consumers,
     the UP SERC net metering regulations, typical timelines in UP,
     and the UP-specific portal/application process.
   - Internal link to /rooftop-solar-lucknow.html.

2. pm-surya-ghar-guide.md:
   - Add UP-specific context: state component top-up (if applicable),
     MVVNL empanelment portal, Lucknow/UP application experience note.
   - Internal links to city pages.

3. index.astro:
   - Add a "Cities We Serve" section with Lucknow + Raebareli cards linking
     to the city landing pages. Keep it concise — 2 cards for now, expandable later.

4. about.astro + contact.astro:
   - Add "Serving homeowners in Lucknow, Raebareli and across Uttar Pradesh"
     in the body copy naturally (not forced).

5. seo-metadata.json:
   - Update key page descriptions to include UP/Lucknow signal where natural
     (homepage, about, contact, learn hub).

---

Off-Site Actions (outside codebase — product owner must complete)

These are not code changes but are critical for Sprint 6 goals:

1. Google Business Profile (HIGHEST PRIORITY — must be done before any page
   ships for maximum impact):
   - Create at business.google.com
   - Type: Service Area Business (no storefront)
   - Business name: Solar AI Advisor
   - Primary category: Solar Energy Equipment Supplier
   - Service areas: Lucknow, Raebareli, and surrounding UP districts
   - Website: https://www.solaraiadvisor.com
   - Description: consistent with site copy
   - Add logo image
   - No street address required for SAB model
   - This feeds the Google local pack (3-box above organic results) and Google Maps

2. Google Search Console:
   - Submit updated sitemap after Sprint 6 deploys
   - Request indexing for both city landing pages immediately on launch
   - Set up performance tracking for Lucknow + Raebareli query filters

3. Local backlinks (ongoing — not blocked on code):
   - Get listed on Justdial, Sulekha, IndiaMART as solar advisor/consultant
   - Request mentions from local Lucknow solar-adjacent blogs or news sites
   - These strengthen domain prominence for local queries

---

Git Workflow

Same pattern as all prior sprints:
- feature/sprint6-localbusiness-schema      → develop PR (PR A)
- feature/sprint6-lucknow-landing-page      → develop PR (PR B)
- feature/sprint6-raebareli-landing-page    → develop PR (PR C)
- feature/sprint6-uppcl-localisation        → develop PR (PR D)
Each develop merge → deploy PR → main

---

Success Criteria for Sprint 6

Build: zero errors, all new pages resolve, no broken links.
validate-jsonld: LocalBusiness, FAQPage, BreadcrumbList blocks all valid.
Lighthouse SEO = 100 on both city landing pages.
Both city pages in sitemap.xml.
Organisation JSON-LD areaServed present on all pages.
Rich Results Test: FAQPage and LocalBusiness pass for city pages.
Google Business Profile live with Lucknow + Raebareli service areas.
Both city pages indexed in Google Search Console within 2 weeks of launch.
First impressions for "[solar] + [Lucknow/Raebareli]" queries visible in
Search Console within 4 weeks of launch.

Sprint 7

Installer Portal

Sprint 8

Customer Dashboard

Sprint 9

Marketplace

Sprint 10

AI Personalization

---

# Project Philosophy

Build once.

Reuse everywhere.

Keep pages fast.

Keep code understandable.

Earn Google's trust.

Earn homeowners' trust.

Grow sustainably.

Every engineering change should leave the platform easier to maintain than it was before.
