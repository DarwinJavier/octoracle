import { expect, test } from "@playwright/test";

test("shows completed prediction accuracy at tournament completion", async ({
  page,
}) => {
  await page.goto("/?state=tournament_complete");
  await expect(page.getByRole("status")).toContainText("Tournament complete");
  await expect(
    page.getByRole("heading", { name: "Accuracy history" }),
  ).toBeVisible();
  await expect(page.getByText("Outcome accuracy").locator("..")).toContainText(
    "100%",
  );
  await expect(
    page.getByText("Predicted 2–1. Outcome correct; exact score correct."),
  ).toBeVisible();
});
