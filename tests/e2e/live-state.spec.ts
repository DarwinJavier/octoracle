import { expect, test } from "@playwright/test";

test("keeps the frozen prediction visible after kickoff and reload", async ({
  page,
}) => {
  await page.goto("/?state=in_progress&animation=error");
  await expect(
    page.getByRole("status").filter({ hasText: "Match in progress" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Ask the Octopus" }).click();
  await expect(page.getByText("Frozen prediction - Version 1")).toBeVisible();

  await page.reload();
  await expect(
    page
      .getByRole("status")
      .filter({ hasText: "No new prediction can be generated" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Ask the Octopus" }),
  ).toBeVisible();
});
