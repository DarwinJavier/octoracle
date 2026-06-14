import { expect, test } from "@playwright/test";

test("keeps the frozen prediction visible after kickoff and reload", async ({
  page,
}) => {
  await page.goto("/?state=in_progress&animation=error");
  await expect(
    page
      .getByRole("status")
      .filter({ hasText: "OctoOracle is closed for this match" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Match in progress" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "The octopus has already spoken" }),
  ).toBeVisible();
  await expect(page.getByText("Frozen prediction - Version 1")).toBeVisible();
  await expect(page.getByText("The prediction was")).toBeVisible();
  await expect(page.getByText(/Mexico 2.*1 South Africa/)).toBeVisible();
  await expect(
    page.getByRole("link", {
      name: "Reveal a prediction for the next match",
    }),
  ).toHaveAttribute("href", "#games-today");
  await expect(
    page.getByRole("button", { name: "Ask the Octopus" }),
  ).toHaveCount(0);

  await page.reload();
  await expect(
    page
      .getByRole("status")
      .filter({ hasText: "No new prediction can be generated" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Ask the Octopus" }),
  ).toHaveCount(0);
});
