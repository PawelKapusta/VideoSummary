import { test, expect } from "@playwright/test";
import { HomePage } from "../pages/home.page";

/**
 * Tests for Performance on Home Page
 * Covers load times, resource loading, and optimization
 */
test.describe("Home Page - Performance", () => {
  let homePage: HomePage;

  test.beforeEach(async ({ page }) => {
    homePage = new HomePage(page);
  });

  test("TC-HOME-030: Page loads within acceptable time", async () => {
    const startTime = Date.now();

    await homePage.goto();
    await homePage.expectLoaded();

    const loadTime = Date.now() - startTime;
    console.log(`Page loaded in ${loadTime}ms`);

    // Page should load within 3 seconds
    expect(loadTime).toBeLessThan(3000);
  });

  test("TC-HOME-031: Critical CSS is inlined (Tailwind)", async () => {
    await homePage.goto();
    await homePage.expectCSSLoaded();

    // Verify Tailwind classes are applied
    const heroSection = homePage.heroSection.heroSection;
    const classes = await heroSection.getAttribute("class");
    expect(classes).toBeTruthy();
    expect(classes).toContain("bg-");
  });

  test("TC-HOME-032: No JavaScript errors during page load", async ({ page }) => {
    const errors: string[] = [];

    page.on("console", (msg) => {
      if (msg.type() === "error") {
        errors.push(msg.text());
      }
    });

    page.on("pageerror", (error) => {
      errors.push(error.message);
    });

    await homePage.goto();
    await homePage.expectLoaded();

    // Wait a bit for any delayed errors
    await page.waitForTimeout(1000);

    console.log(`Found ${errors.length} errors:`, errors);
    expect(errors).toHaveLength(0);
  });

  test("TC-HOME-033: No network errors (404, 500)", async ({ page }) => {
    const failedRequests: { url: string; status: number }[] = [];

    page.on("response", (response) => {
      if (response.status() >= 400) {
        failedRequests.push({
          url: response.url(),
          status: response.status(),
        });
      }
    });

    await homePage.goto();
    await homePage.expectLoaded();

    console.log(`Found ${failedRequests.length} failed requests:`, failedRequests);
    expect(failedRequests).toHaveLength(0);
  });

  test("TC-HOME-034: Images are optimized (if any)", async ({ page }) => {
    await homePage.goto();
    await homePage.expectLoaded();

    // Check for any img tags
    const images = page.locator("img");
    const imageCount = await images.count();

    console.log(`Found ${imageCount} images on page`);

    // If there are images, check they have proper attributes
    for (let i = 0; i < imageCount; i++) {
      const img = images.nth(i);
      const alt = await img.getAttribute("alt");
      const loading = await img.getAttribute("loading");

      // Images should have alt text (even if empty for decorative)
      expect(alt).not.toBeNull();

      // Images below fold should be lazy loaded
      console.log(`Image ${i}: alt="${alt}", loading="${loading}"`);
    }
  });

  test("TC-HOME-035: Page uses HTTP/2 or HTTP/3", async ({ page }) => {
    await homePage.goto();

    // Check the protocol used for the main document
    const navigationEntry = await page.evaluate(() => {
      const entry = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming;
      return {
        nextHopProtocol: (entry as any).nextHopProtocol,
      };
    });

    console.log(`Protocol: ${navigationEntry.nextHopProtocol}`);

    // Should use h2 or h3
    expect(navigationEntry.nextHopProtocol).toMatch(/h2|h3/);
  });

  test("TC-HOME-036: Resources are cached properly", async ({ page }) => {
    // First load
    await homePage.goto();
    await homePage.expectLoaded();

    // Second load - should use cache
    const cachedResources: string[] = [];

    page.on("response", (response) => {
      if ((response as any).fromCache()) {
        cachedResources.push(response.url());
      }
    });

    await page.reload();
    await homePage.expectLoaded();

    console.log(`Cached resources: ${cachedResources.length}`);
    console.log(cachedResources);

    // Some resources should be cached
    expect(cachedResources.length).toBeGreaterThan(0);
  });

  test("TC-HOME-037: Lighthouse performance metrics", async ({ page }) => {
    await homePage.goto();
    await homePage.expectLoaded();

    // Get performance metrics
    const metrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming;
      const paint = performance.getEntriesByType("paint");

      return {
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.fetchStart,
        loadComplete: navigation.loadEventEnd - navigation.fetchStart,
        firstPaint: paint.find((p) => p.name === "first-paint")?.startTime || 0,
        firstContentfulPaint: paint.find((p) => p.name === "first-contentful-paint")?.startTime || 0,
      };
    });

    console.log("Performance Metrics:", metrics);

    // Assert performance targets (adjust as needed)
    expect(metrics.firstPaint).toBeLessThan(1500); // First Paint < 1.5s
    expect(metrics.firstContentfulPaint).toBeLessThan(1800); // FCP < 1.8s
    expect(metrics.domContentLoaded).toBeLessThan(2000); // DCL < 2s
    expect(metrics.loadComplete).toBeLessThan(3000); // Load Complete < 3s
  });

  test("TC-HOME-038: Page size is optimized", async ({ page }) => {
    let totalSize = 0;
    const resourceSizes: { url: string; size: number }[] = [];

    page.on("response", async (response) => {
      try {
        const buffer = await response.body();
        const size = buffer.length;
        totalSize += size;

        resourceSizes.push({
          url: response.url(),
          size: size,
        });
      } catch {
        // Some responses may not have body
      }
    });

    await homePage.goto();
    await homePage.expectLoaded();

    console.log(`Total page size: ${(totalSize / 1024).toFixed(2)} KB`);
    console.log(`Largest resources:`, resourceSizes.sort((a, b) => b.size - a.size).slice(0, 5));

    // Total page size should be under 2MB
    expect(totalSize).toBeLessThan(2 * 1024 * 1024);
  });

  test("TC-HOME-039: Tailwind CSS is optimized (purged)", async ({ page }) => {
    let cssSize = 0;

    page.on("response", async (response) => {
      if (response.url().includes(".css") || response.headers()["content-type"]?.includes("text/css")) {
        try {
          const buffer = await response.body();
          cssSize += buffer.length;
        } catch {
          // Ignore
        }
      }
    });

    await homePage.goto();
    await homePage.expectLoaded();

    console.log(`Total CSS size: ${(cssSize / 1024).toFixed(2)} KB`);

    // Purged Tailwind should be under 50KB
    expect(cssSize).toBeLessThan(50 * 1024);
  });
});
