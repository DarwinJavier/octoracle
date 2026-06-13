import { expect, test } from "@playwright/test";

test("shows and reveals the static match experience", async ({
  page,
}, testInfo) => {
  await page.goto("/?state=upcoming");

  await expect(page.getByRole("heading", { name: "Next match" })).toBeVisible();
  await expect(
    page.getByText("Mexico City Stadium, Mexico City"),
  ).toBeVisible();
  const matchCard = page.getByRole("region", { name: "Next match" });
  await expect(matchCard.getByText("Kickoff", { exact: true })).toBeVisible();
  await expect(matchCard.getByText(/ET \/.*PT/)).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Previous results" }),
  ).toHaveAttribute("href", "#accuracy-history");
  await expect(page.getByText(/performance cannot change/i)).toHaveCount(0);

  await page.getByRole("button", { name: "Ask the Octopus" }).click();
  await expect(page.getByText("Predicted result")).toBeVisible({
    timeout: 15_000,
  });
  await expect(page.getByText("Mexico 2–1 South Africa")).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Mexico wins!" }),
  ).toBeVisible();
  await expect(
    page.getByRole("meter", { name: "Mexico win probability" }),
  ).toHaveAttribute("aria-valuenow", "52");
  await expect(page.getByText("Animation state:")).toHaveCount(0);

  await page.screenshot({
    fullPage: true,
    path: testInfo.outputPath("static-experience.png"),
  });
});

test("fits at 320 CSS pixels without horizontal scrolling", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto("/?state=upcoming");
  await page.getByRole("button", { name: "Ask the Octopus" }).click();
  await page.getByRole("button", { name: "Skip animation" }).click();

  const dimensions = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));

  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth);
});

test("shows honest fallback states", async ({ page }) => {
  await page.goto("/?state=not-ready");

  await expect(page.getByRole("status")).toContainText(
    "The octopus is still thinking",
  );
  await expect(page.getByRole("status")).toContainText("Check again later");
  await expect(
    page.getByRole("button", { name: "Ask the Octopus" }),
  ).toHaveCount(0);
});

test("supports keyboard reveal and reduced motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/?state=upcoming");

  const revealButton = page.getByRole("button", { name: "Ask the Octopus" });
  await expect(revealButton).toBeEnabled();
  const reducedMotion = await page.evaluate(
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const animationDuration = await revealButton.evaluate(
    (element) => window.getComputedStyle(element).animationDuration,
  );

  expect(reducedMotion).toBe(true);
  expect(["0.01ms", "0.00001s", "1e-05s"]).toContain(animationDuration);
  await revealButton.focus();
  await page.keyboard.press("Enter");

  await expect(page.getByText("Predicted result")).toBeVisible();
});

test("skip and replay preserve the stored outcome", async ({ page }) => {
  await page.goto("/?state=upcoming");
  await page.getByRole("button", { name: "Ask the Octopus" }).click();
  await page.getByRole("button", { name: "Skip animation" }).click();

  await expect(page.getByText("Mexico 2–1 South Africa")).toBeVisible();
  await page.getByRole("button", { name: "Replay animation" }).click();
  await page.getByRole("button", { name: "Skip animation" }).click();

  await expect(page.getByText("Mexico 2–1 South Africa")).toBeVisible();
});

test("falls back to semantic prediction when animation assets fail", async ({
  page,
}) => {
  await page.goto("/?state=upcoming&animation=error");

  await expect(
    page
      .getByRole("status")
      .filter({ hasText: "The animation could not load" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Ask the Octopus" }).click();
  await expect(page.getByText("Mexico 2–1 South Africa")).toBeVisible();
});
