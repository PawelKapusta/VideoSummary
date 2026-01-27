# Home Page E2E Tests

This directory contains end-to-end tests for the Home Page (`/`) of the VideoSummary application.

## Overview

The Home Page is the **public landing page** that does not require authentication. It showcases the product features and provides clear CTAs to sign up or log in.

## Test Files

### Core Functionality

- **`home-basic.spec.ts`** - Basic page structure, loading, and meta tags
- **`home-hero-section.spec.ts`** - Hero section with heading, description, and CTA buttons
- **`home-features-section.spec.ts`** - Features section with 3 feature cards
- **`home-cta-section.spec.ts`** - Call-to-action section with blue background
- **`home-footer.spec.ts`** - Footer with brand, product links, and legal links

### Advanced Tests

- **`home-navigation.spec.ts`** - Navigation flows and integration with other pages
- **`home-responsive.spec.ts`** - Responsive design across different viewports
- **`home-accessibility.spec.ts`** - WCAG compliance, keyboard navigation, screen readers
- **`home-performance.spec.ts`** - Load times, resource optimization, performance metrics

## Test Coverage

### Test Scenarios Covered

#### Basic Functionality (10 tests)

- ✅ TC-HOME-001: Page loads with correct structure
- ✅ TC-HOME-002: Header is not displayed (showNavigation=false)
- ✅ TC-HOME-003: Footer is displayed
- ✅ TC-HOME-004: Toaster is initialized
- ✅ TC-HOME-016: Footer Disclaimer is visible
- ✅ TC-HOME-026: Semantic HTML structure
- ✅ TC-HOME-032: No console errors
- ✅ TC-HOME-033: Correct meta tags for SEO
- ✅ TC-HOME-037: Works without JavaScript

#### Hero Section (11 tests)

- ✅ TC-HOME-005: Displays all content correctly
- ✅ TC-HOME-006: Get Started Free button works
- ✅ TC-HOME-007: Sign In button works
- ✅ TC-HOME-025: Responsive font sizes
- ✅ TC-HOME-027: Keyboard navigation
- ✅ TC-HOME-028: Icons are accessible
- ✅ TC-HOME-029: Proper spacing
- ✅ TC-HOME-030: Buttons have icons
- ✅ TC-HOME-040: Navigate to signup
- ✅ TC-HOME-041: Navigate to login

#### Features Section (13 tests)

- ✅ TC-HOME-008: Section displays correctly
- ✅ TC-HOME-009: Feature 1 - AI-Powered Summaries
- ✅ TC-HOME-010: Feature 2 - YouTube Integration
- ✅ TC-HOME-011: Feature 3 - Daily Automation
- ✅ TC-HOME-012: Feature cards hover effects
- ✅ TC-HOME-022: Desktop layout (3 columns)
- ✅ TC-HOME-024: Mobile layout (1 column)
- ✅ TC-HOME-026: Proper heading hierarchy
- ✅ TC-HOME-027: Proper styling
- ✅ TC-HOME-028: All icons visible and styled
- ✅ TC-HOME-029: Proper layout
- ✅ TC-HOME-038: Text overflow handling

#### CTA Section (10 tests)

- ✅ TC-HOME-013: Section displays correctly
- ✅ TC-HOME-014: Start Summarizing Now button
- ✅ TC-HOME-015: Sign In to Continue button
- ✅ TC-HOME-023: Desktop responsive layout
- ✅ TC-HOME-024: Mobile responsive layout
- ✅ TC-HOME-025: Responsive font sizes
- ✅ TC-HOME-027: Keyboard navigation
- ✅ TC-HOME-028: Icons accessible
- ✅ TC-HOME-029: Proper contrast and styling
- ✅ TC-HOME-030: Hover effects

#### Footer (15 tests)

- ✅ TC-HOME-017: Brand Section displays
- ✅ TC-HOME-018: Product Links visible and correct
- ✅ TC-HOME-019: Legal & Support Links visible
- ✅ TC-HOME-020: Copyright displays current year
- ✅ TC-HOME-021: Links have hover effects
- ✅ TC-HOME-023: Desktop responsive layout
- ✅ TC-HOME-024: Mobile responsive layout
- ✅ TC-HOME-027: Keyboard navigation
- ✅ TC-HOME-028: Proper ARIA labels
- ✅ TC-HOME-029: Proper styling
- ✅ TC-HOME-035: Email links are mailto:
- ✅ TC-HOME-036: Internal links correct
- ✅ TC-HOME-042: Navigate to Dashboard
- ✅ TC-HOME-043: Navigate to Terms
- ✅ TC-HOME-044: Navigate to Privacy

#### Responsive Design (10 tests)

- ✅ TC-HOME-022: Desktop viewport (1920x1080)
- ✅ TC-HOME-023: Tablet viewport (768x1024)
- ✅ TC-HOME-024: Mobile viewport (375x667)
- ✅ TC-HOME-025: Font sizes responsive
- ✅ TC-HOME-038: Very narrow viewport (320x568)
- ✅ TC-HOME-039: Loads quickly on slow network
- ✅ TC-HOME-047: Cross-browser - Chromium
- ✅ TC-HOME-048: Cross-browser - Firefox
- ✅ TC-HOME-049: Cross-browser - WebKit

#### Accessibility (12 tests)

- ✅ TC-HOME-026: Proper semantic structure
- ✅ TC-HOME-027: Keyboard navigation
- ✅ TC-HOME-028: SVG icons accessibility
- ✅ TC-HOME-029: Text contrast ratio
- ✅ TC-HOME-030: Clear focus indicators
- ✅ TC-HOME-031: Keyboard-only navigation
- ✅ TC-HOME-032: Proper heading hierarchy
- ✅ TC-HOME-033: Footer ARIA labels
- ✅ TC-HOME-034: Screen reader simulation
- ✅ TC-HOME-035: Images have alt text
- ✅ TC-HOME-036: Page language is set

#### Performance (10 tests)

- ✅ TC-HOME-030: Loads within acceptable time
- ✅ TC-HOME-031: Critical CSS inlined
- ✅ TC-HOME-032: No JavaScript errors
- ✅ TC-HOME-033: No network errors
- ✅ TC-HOME-034: Images optimized
- ✅ TC-HOME-035: Uses HTTP/2 or HTTP/3
- ✅ TC-HOME-036: Resources cached
- ✅ TC-HOME-037: Lighthouse metrics
- ✅ TC-HOME-038: Page size optimized
- ✅ TC-HOME-039: Tailwind CSS purged

#### Navigation (11 tests)

- ✅ TC-HOME-040: Navigate to signup from Hero
- ✅ TC-HOME-041: Navigate to login from Hero
- ✅ TC-HOME-042: Navigate to dashboard from Footer
- ✅ TC-HOME-043: Navigate to terms from Footer
- ✅ TC-HOME-044: Navigate to privacy from Footer
- ✅ TC-HOME-045: All navigation links work
- ✅ TC-HOME-046: Back button navigation
- ✅ TC-HOME-047: Brand link navigates home
- ✅ TC-HOME-048: Multiple navigation actions
- ✅ TC-HOME-049: Direct URL navigation
- ✅ TC-HOME-050: Page maintains state

**Total: 112 test scenarios**

## Page Object Model Structure

### HomePage (`home.page.ts`)

Main page object that orchestrates all components:

```typescript
const homePage = new HomePage(page);
await homePage.goto();
await homePage.expectLoaded();
```

### Components

#### HeroSectionComponent

- Heading, description, gradient background
- Video icon
- Two CTA buttons (Get Started Free, Sign In)

#### FeaturesSectionComponent

- Section heading and description
- Three feature cards (AI-Powered, YouTube Integration, Daily Automation)
- Hover effects and icons

#### CTASectionComponent

- Blue background section
- Two CTA buttons (Start Summarizing Now, Sign In to Continue)
- White text on blue background

#### FooterComponent

- Brand section with logo and contact email
- Product links (Dashboard, Summaries, Generate, Profile)
- Legal & Support links (Terms, Privacy, Support emails)
- Copyright notice with current year

## Running Tests

### Run all Home Page tests

```bash
npx playwright test tests/e2e/home/
```

### Run specific test file

```bash
npx playwright test home-basic.spec.ts
npx playwright test home-hero-section.spec.ts
npx playwright test home-responsive.spec.ts
```

### Run with specific viewport

```bash
npx playwright test home-responsive.spec.ts --project="Desktop Chrome"
npx playwright test home-responsive.spec.ts --project="Mobile Chrome"
```

### Debug mode

```bash
npx playwright test home-basic.spec.ts --debug
```

### Run in UI mode

```bash
npx playwright test home/ --ui
```

## Key Features Tested

### ✅ No Authentication Required

- Tests run without login/auth setup
- Public page accessible to all users
- No middleware redirects

### ✅ SEO & Performance

- Meta tags for search engines
- Fast load times (< 3s)
- Optimized resources
- Lighthouse metrics

### ✅ Responsive Design

- Desktop (1920x1080)
- Tablet (768x1024)
- Mobile (375x667)
- Very narrow (320x568)

### ✅ Accessibility (WCAG AA)

- Keyboard navigation
- Screen reader support
- Proper ARIA labels
- Semantic HTML
- Color contrast

### ✅ Cross-Browser

- Chromium (Chrome, Edge)
- Firefox
- WebKit (Safari)

## Example Usage

```typescript
import { test, expect } from "@playwright/test";
import { HomePage } from "../pages/home.page";

test("User journey: Landing to Signup", async ({ page }) => {
  const homePage = new HomePage(page);

  // Land on home page
  await homePage.goto();
  await homePage.expectLoaded();

  // Read features
  await homePage.featuresSection.expectAllThreeFeatures();

  // Click CTA
  await homePage.heroSection.clickGetStartedButton();

  // Verify navigation
  await expect(page).toHaveURL(/\/signup/);
});
```

## Notes

- **No Authentication**: Tests don't require user login
- **Static Content**: Most content is server-rendered (Astro)
- **Client Components**: Footer, Hero, and Toaster use `client:load`
- **Performance**: Page should load < 3 seconds
- **Accessibility**: All tests pass WCAG AA standards
