import { expect, test } from "@playwright/test";

test("owner captures, approves, and asks with a citation", async ({ page }) => {
  const unique = `commercial rooftop lockout fee ${Date.now()}`;
  const note = `Peakline charges a $125 after-hours ${unique} plus time-and-a-half. Do not quote regular rate.`;

  await page.goto("/");
  await page.getByTestId("enter-demo").click();
  await expect(page.getByRole("heading", { name: "Peakline HVAC" })).toBeVisible();

  await page.goto("/capture");
  await page.getByRole("tab", { name: "Note" }).click();
  await page.getByTestId("quick-note").fill(note);
  await page.getByTestId("save-note").click();

  await expect(page).toHaveURL(/\/review/);
  await page.getByTestId(/review-card-/).first().click();
  await page.getByTestId("approve-knowledge").click();

  await expect(page).toHaveURL(/\/memory\//);
  await expect(page.getByText("Approved company knowledge")).toBeVisible();

  await page.goto("/ask");
  await page.getByTestId("ask-input").fill(`What is our ${unique}?`);
  await page.getByTestId("ask-submit").click();

  await expect(page.getByTestId("assistant-message")).toBeVisible({ timeout: 10_000 });
  await expect(page.getByTestId("citation-link").first()).toBeVisible();
  await expect(page.getByTestId("assistant-message")).toContainText("$125");

  await page.goto("/ask");
  await page.getByTestId("ask-input").fill(
    "What is our official policy for painting trucks neon orange?",
  );
  await page.getByTestId("ask-submit").click();
  await expect(page.getByTestId("assistant-message")).toContainText("not documented");
});

test("landing and overview are usable on a mobile viewport", async ({ page }) => {
  await page.goto("/");
  await page.getByTestId("hero-demo").click();
  await expect(page.getByRole("heading", { name: "Peakline HVAC" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Capture", exact: true }).first()).toBeVisible();
});
