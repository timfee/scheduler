import { expect, test } from "@playwright/test";

test.describe("Smoke Tests", () => {
  test("application loads without critical errors", async ({ page }) => {
    // Track console errors
    const errors: string[] = [];
    page.on("pageerror", (error) => {
      errors.push(error.message);
    });

    // Navigate to the home page
    await page.goto("/");

    // Wait for the page to load
    await page.waitForLoadState("networkidle");

    // Check that we don't have any critical import errors
    const criticalErrors = errors.filter(
      (error) =>
        error.includes("not found") ||
        error.includes("Cannot resolve") ||
        (error.includes("Export") && error.includes("does not exist")),
    );

    expect(
      criticalErrors,
      `Critical errors found: ${criticalErrors.join(", ")}`,
    ).toHaveLength(0);
  });

  test("connections page loads and functions", async ({ page }) => {
    await page.goto("/connections");

    // Check that page title is correct
    await expect(page).toHaveTitle(/Scheduler/);

    // Check that main content loads
    await expect(page.locator("body")).toBeVisible();

    // Wait for any async operations to complete
    await page.waitForSelector("body");

    // Check that no export errors occurred
    const jsErrors: string[] = [];
    page.on("pageerror", (error) => {
      jsErrors.push(error.message);
    });

    // Trigger client-side code by clicking
    await page.click("body");

    // Wait for potential errors
    await page.waitForEvent("pageerror", { timeout: 500 });

    const exportErrors = jsErrors.filter(
      (error) =>
        error.includes("updateConnectionAction") && error.includes("not found"),
    );

    expect(exportErrors).toHaveLength(0);
  });
});
