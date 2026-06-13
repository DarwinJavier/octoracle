import { z } from "zod";

import { createSupabaseServerHeaders } from "@/lib/db/supabase-auth";
import type { ResultRepository } from "@/lib/results/service";
import { finalResultSchema, type FinalResult } from "@/lib/results/types";

type Options = {
  supabaseUrl: string;
  serviceRoleKey: string;
  fetchImplementation?: typeof fetch;
};

export class SupabaseResultRepository implements ResultRepository {
  private readonly fetchImplementation: typeof fetch;
  private readonly restUrl: string;

  constructor(private readonly options: Options) {
    this.fetchImplementation = options.fetchImplementation ?? fetch;
    this.restUrl = `${options.supabaseUrl.replace(/\/$/, "")}/rest/v1`;
  }

  async applyResults(rawResults: FinalResult[]) {
    let recordsWritten = 0;
    for (const result of rawResults.map((item) =>
      finalResultSchema.parse(item),
    )) {
      const response = await this.fetchImplementation(
        `${this.restUrl}/rpc/apply_match_result`,
        {
          method: "POST",
          headers: createSupabaseServerHeaders(this.options.serviceRoleKey),
          body: JSON.stringify({ result_payload: result }),
          cache: "no-store",
        },
      );
      if (!response.ok)
        throw new Error(`result_write_failed_${response.status}`);
      if (z.boolean().parse(await response.json())) recordsWritten += 1;
    }
    return recordsWritten;
  }
}
