import { test, expect } from "@playwright/test";
import { environment } from "../src/environments/environment";
test.describe("Login", () => {
  test.beforeEach("Login Page Occurs", async ({ page }) => {
    await page.goto(environment.frontendBaseUrl + 'login');
    await page.waitForLoadState("networkidle");
  });

  test("A user login fail due to incomplete password", async ({ page }) => {
    await page.locator('#email').fill('you@example.com');
    await page.locator('#password').fill('short');
    // Assert the error is visible
    await expect(page.locator('.error-msg')).toBeVisible();
  });
});