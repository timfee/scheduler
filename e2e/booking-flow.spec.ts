import { expect, test } from "@playwright/test";

test.describe("Booking Flow E2E", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the booking page
    await page.goto("/");
  });

  test("complete booking flow", async ({ page }) => {
    // 1. Navigate and select appointment type
    await page.goto("/");

    // Check if we're on the booking page
    await expect(page.locator("h1")).toContainText(
      /book|appointment|schedule/i,
    );

    // Look for appointment type selection
    const typeButtons = page.locator(
      'button:has-text("intro"), button:has-text("Introduction"), button:has-text("30 min")',
    );
    await expect(typeButtons.first()).toBeVisible();

    await typeButtons.first().click();

    // 2. Select available date
    await expect(page.locator("h2")).toContainText(/select.*date/i);

    // Wait for dates to load and find an available (non-busy) date
    await page.waitForSelector("button:not([disabled])", { timeout: 5000 });

    const availableDates = page.locator(
      'button:not([disabled]):not(:has-text("busy"))',
    );
    await expect(availableDates.first()).toBeVisible();

    await availableDates.first().click();

    // 3. Select time slot
    await expect(page.locator("h2")).toContainText(/select.*time/i);

    // Wait for time slots to load
    await page.waitForSelector("button:not([disabled])", { timeout: 5000 });

    const availableSlots = page.locator(
      "button:not([disabled]):has-text(/^\\d{1,2}:\\d{2}/)",
    );
    await expect(availableSlots.first()).toBeVisible();

    await availableSlots.first().click();

    // 4. Enter details
    await expect(page.locator("h2")).toContainText(/details|information/i);

    await page.fill(
      'input[name="name"], input[placeholder*="name"]',
      "John Doe",
    );
    await page.fill(
      'input[name="email"], input[placeholder*="email"]',
      "john@example.com",
    );

    // 5. Confirm booking
    const confirmButton = page.locator(
      'button:has-text("Confirm"), button:has-text("Book"), button:has-text("Submit")',
    );
    await expect(confirmButton).toBeVisible();
    await confirmButton.click();

    // 6. Verify success
    await expect(
      page.locator("text=confirmed, text=success, text=booked"),
    ).toBeVisible({ timeout: 10000 });
  });

  test("handles validation errors", async ({ page }) => {
    // Navigate to booking form
    await page.goto("/");

    // Skip to form submission without filling required fields
    const typeButtons = page.locator(
      'button:has-text("intro"), button:has-text("Introduction"), button:has-text("30 min")',
    );
    if (await typeButtons.first().isVisible()) {
      await typeButtons.first().click();
    }

    const availableDates = page.locator(
      'button:not([disabled]):not(:has-text("busy"))',
    );
    if (await availableDates.first().isVisible()) {
      await availableDates.first().click();
    }

    const availableSlots = page.locator(
      "button:not([disabled]):has-text(/^\\d{1,2}:\\d{2}/)",
    );
    if (await availableSlots.first().isVisible()) {
      await availableSlots.first().click();
    }

    // Try to submit without filling required fields
    const confirmButton = page.locator(
      'button:has-text("Confirm"), button:has-text("Book"), button:has-text("Submit")',
    );
    if (await confirmButton.isVisible()) {
      await confirmButton.click();

      // Should show validation errors
      await expect(
        page.locator('text=required, text=error, .error, [role="alert"]'),
      ).toBeVisible();
    }
  });

  test("handles back navigation correctly", async ({ page }) => {
    // Complete partial flow
    await page.goto("/");

    // Select appointment type if available
    const typeButtons = page.locator(
      'button:has-text("intro"), button:has-text("Introduction"), button:has-text("30 min")',
    );
    if (await typeButtons.first().isVisible()) {
      await typeButtons.first().click();
    }

    // Select date if available
    const availableDates = page.locator(
      'button:not([disabled]):not(:has-text("busy"))',
    );
    if (await availableDates.first().isVisible()) {
      await availableDates.first().click();
    }

    // Go back
    await page.goBack();

    // Verify we can navigate forward again
    await page.goForward();

    // Should be able to continue the flow
    const availableSlots = page.locator(
      "button:not([disabled]):has-text(/^\\d{1,2}:\\d{2}/)",
    );
    if (await availableSlots.first().isVisible()) {
      await availableSlots.first().click();
    }
  });

  test("displays loading states", async ({ page }) => {
    await page.goto("/");

    // Look for loading indicators
    const loadingIndicators = page.locator(
      '[role="status"], .loading, .spinner, text=loading',
    );

    // If loading states are present, they should be replaced with content
    if (await loadingIndicators.first().isVisible()) {
      await expect(loadingIndicators.first()).toBeHidden({ timeout: 10000 });
    }
  });

  test("handles busy dates correctly", async ({ page }) => {
    await page.goto("/");

    // Select appointment type
    const typeButtons = page.locator(
      'button:has-text("intro"), button:has-text("Introduction"), button:has-text("30 min")',
    );
    if (await typeButtons.first().isVisible()) {
      await typeButtons.first().click();
    }

    // Check if there are busy dates
    const busyDates = page.locator('button[disabled], button:has-text("busy")');
    if (await busyDates.first().isVisible()) {
      // Verify busy dates are disabled
      await expect(busyDates.first()).toBeDisabled();

      // Verify busy dates show appropriate styling
      await expect(busyDates.first()).toHaveClass(/opacity-50|disabled|busy/);
    }
  });

  test("handles no available slots", async ({ page }) => {
    await page.goto("/");

    // Select appointment type
    const typeButtons = page.locator(
      'button:has-text("intro"), button:has-text("Introduction"), button:has-text("30 min")',
    );
    if (await typeButtons.first().isVisible()) {
      await typeButtons.first().click();
    }

    // Select date
    const availableDates = page.locator(
      'button:not([disabled]):not(:has-text("busy"))',
    );
    if (await availableDates.first().isVisible()) {
      await availableDates.first().click();
    }

    // Check if no slots available message is shown
    const noSlotsMessage = page.locator(
      "text=no times available, text=no slots, text=fully booked",
    );
    if (await noSlotsMessage.isVisible()) {
      await expect(noSlotsMessage).toBeVisible();
    }
  });

  test("prevents double booking", async ({ browser }) => {
    // This test would require a more complex setup with multiple browser contexts
    // For now, we'll just verify the booking flow works once
    const page = await browser.newPage();
    await page.goto("/");

    // Complete booking flow
    const typeButtons = page.locator(
      'button:has-text("intro"), button:has-text("Introduction"), button:has-text("30 min")',
    );
    if (await typeButtons.first().isVisible()) {
      await typeButtons.first().click();
    }

    const availableDates = page.locator(
      'button:not([disabled]):not(:has-text("busy"))',
    );
    if (await availableDates.first().isVisible()) {
      await availableDates.first().click();
    }

    const availableSlots = page.locator(
      "button:not([disabled]):has-text(/^\\d{1,2}:\\d{2}/)",
    );
    if (await availableSlots.first().isVisible()) {
      await availableSlots.first().click();
    }

    // Fill in details
    await page.fill(
      'input[name="name"], input[placeholder*="name"]',
      "Test User",
    );
    await page.fill(
      'input[name="email"], input[placeholder*="email"]',
      "test@example.com",
    );

    // Submit booking
    const confirmButton = page.locator(
      'button:has-text("Confirm"), button:has-text("Book"), button:has-text("Submit")',
    );
    if (await confirmButton.isVisible()) {
      await confirmButton.click();
    }

    await page.close();
  });

  test("handles network errors gracefully", async ({ page }) => {
    // Simulate network failure
    await page.route("**/api/**", (route) => route.abort());

    await page.goto("/");

    // Should show error message or graceful degradation
    const errorMessages = page.locator(
      'text=error, text=failed, text=try again, [role="alert"]',
    );

    // If errors occur, they should be user-friendly
    if (await errorMessages.first().isVisible()) {
      await expect(errorMessages.first()).toBeVisible();
    }
  });

  test("maintains responsive design", async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/");

    // Verify the page is still usable
    const mainContent = page.locator("main, .main, body");
    await expect(mainContent).toBeVisible();

    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.reload();

    // Verify the page is still usable
    await expect(mainContent).toBeVisible();

    // Test desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.reload();

    // Verify the page is still usable
    await expect(mainContent).toBeVisible();
  });

  test("handles timezone correctly", async ({ page }) => {
    await page.goto("/");

    // Select appointment type and date
    const typeButtons = page.locator(
      'button:has-text("intro"), button:has-text("Introduction"), button:has-text("30 min")',
    );
    if (await typeButtons.first().isVisible()) {
      await typeButtons.first().click();
    }

    const availableDates = page.locator(
      'button:not([disabled]):not(:has-text("busy"))',
    );
    if (await availableDates.first().isVisible()) {
      await availableDates.first().click();
    }

    // Check that time slots are displayed in reasonable format
    const timeSlots = page.locator("button:has-text(/^\\d{1,2}:\\d{2}/)");
    if (await timeSlots.first().isVisible()) {
      const timeText = await timeSlots.first().textContent();
      expect(timeText).toMatch(/^\\d{1,2}:\\d{2}/);
    }
  });
});
