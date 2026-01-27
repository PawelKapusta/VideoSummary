# Landing Page E2E Tests

Tests for the public landing page (`/` - `src/pages/index.astro`)

## Overview

These tests are for the **PUBLIC** landing page - **NO AUTHENTICATION REQUIRED**.

## Test Files

- `landing-basic.spec.ts` - Basic structure, meta tags, loading
- `landing-hero-cta.spec.ts` - Hero section and CTA buttons
- `landing-features.spec.ts` - Features section (3 cards)
- `landing-responsive.spec.ts` - Responsive design (Desktop/Tablet/Mobile)
- `landing-footer.spec.ts` - Footer with links
- `landing-accessibility.spec.ts` - WCAG AA compliance, keyboard navigation

## Running Tests

```bash
# All landing page tests (Desktop)
npm run test:e2e:landing

# Landing page tests (Mobile)
npm run test:e2e:landing:mobile

# UI mode (interactive)
npx playwright test --ui --project="landing page"

# Specific test file
npx playwright test landing-basic.spec.ts --project="landing page"

# Debug mode
npx playwright test landing-basic.spec.ts --project="landing page" --debug
```

## Key Features

- ✅ **No authentication required** - public page
- ✅ Tests 53 scenarios
- ✅ Covers Hero, Features, CTA, Footer sections
- ✅ Responsive design (Desktop, Tablet, Mobile)
- ✅ Accessibility (WCAG AA)
- ✅ SEO meta tags
- ✅ Progressive Enhancement (works without JS)

## Page Structure

```
/ (index.astro)
├── Hero Section
│   ├── Video icon
│   ├── Heading "Video Summary"
│   ├── Description
│   └── 2 CTA buttons (Get Started Free, Sign In)
├── Features Section
│   ├── Section heading
│   └── 3 Feature cards
│       ├── AI-Powered Summaries
│       ├── YouTube Integration
│       └── Daily Automation
├── CTA Section (blue background)
│   ├── Heading "Ready to Save Hours..."
│   ├── Description
│   └── 2 CTA buttons (Start Summarizing Now, Sign In to Continue)
├── Footer Disclaimer
│   └── Personal use notice
└── AppFooter
    ├── Brand section
    ├── Product links
    └── Legal & Support links
```
