import { readFile } from "node:fs/promises";
import path from "node:path";

import { describe, expect, it } from "vitest";

describe("result history migrations", () => {
  it("audits result revisions and reads only frozen completed prediction history", async () => {
    const resultMigration = await readFile(
      path.join(
        process.cwd(),
        "supabase/migrations/20260609170000_result_history.sql",
      ),
      "utf8",
    );
    const historyMigration = await readFile(
      path.join(
        process.cwd(),
        "supabase/migrations/20260609173000_prediction_history_rpc.sql",
      ),
      "utf8",
    );
    expect(resultMigration).toContain("match_result_revisions");
    expect(resultMigration).toContain("where not exists");
    expect(resultMigration).toContain("is not distinct from");
    expect(historyMigration).toContain("p.status = 'frozen'");
  });
});
