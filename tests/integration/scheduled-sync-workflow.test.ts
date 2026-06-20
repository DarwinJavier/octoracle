import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

describe("scheduled production synchronization", () => {
  it("records predictions and results every fifteen minutes", async () => {
    const workflow = await readFile(
      join(process.cwd(), ".github/workflows/scheduled-sync.yml"),
      "utf8",
    );

    expect(workflow).toContain('cron: "*/15 * * * *"');
    expect(workflow).toContain("secrets.INTERNAL_CRON_SECRET");
    expect(workflow).toContain('header "Idempotency-Key: github-fixtures-');
    expect(workflow).toContain('header "Idempotency-Key: github-results-');
    expect(workflow).toContain("/api/internal/sync-fixtures");
    expect(workflow).toContain("/api/internal/sync-results");
  });
});
