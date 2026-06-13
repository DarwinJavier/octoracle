import { readFile } from "node:fs/promises";
import path from "node:path";

import { describe, expect, it } from "vitest";

describe("prediction signal snapshot migration", () => {
  it("stores auditable signal inputs without browser access", async () => {
    const migration = await readFile(
      path.join(
        process.cwd(),
        "supabase/migrations/20260611130000_prediction_signal_snapshots.sql",
      ),
      "utf8",
    );
    expect(migration).toContain("prediction_signal_snapshots");
    expect(migration).toContain("input_snapshot_hash text not null unique");
    expect(migration).toContain("team_a_history_provider_ids");
    expect(migration).toContain("enable row level security");
    expect(migration).toContain(
      "revoke all on table public.prediction_signal_snapshots from anon, authenticated",
    );
  });
});
