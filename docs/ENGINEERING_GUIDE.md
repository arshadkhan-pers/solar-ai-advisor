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

Sprint 5

Knowledge Center

Sprint 6

City Landing Pages

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
