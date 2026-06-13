import { readFile } from "node:fs/promises";
import path from "node:path";

import { describe, expect, it } from "vitest";

describe("prediction database lifecycle migration", () => {
  it("contains transactional publication, immutability, freeze, and void guards", async () => {
    const migration = await readFile(
      path.join(
        process.cwd(),
        "supabase/migrations/20260609150000_prediction_immutability.sql",
      ),
      "utf8",
    );
    expect(migration).toContain("protect_prediction_history");
    expect(migration).toContain("pg_advisory_xact_lock");
    expect(migration).toContain(
      "current_timestamp >= target_match.kickoff_at_utc",
    );
    expect(migration).toContain("freeze_due_predictions");
    expect(migration).toContain("void_frozen_predictions_for_match");
  });
});
