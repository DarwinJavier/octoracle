import { z } from "zod";

import { createSupabaseServerHeaders } from "@/lib/db/supabase-auth";

const completedRows = z.array(
  z.object({ id: z.string().uuid() }).passthrough(),
);

type Options = {
  supabaseUrl: string;
  serviceRoleKey: string;
  fetchImplementation?: typeof fetch;
};

export class SupabaseJobRepository {
  private readonly fetchImplementation: typeof fetch;
  private readonly restUrl: string;

  constructor(private readonly options: Options) {
    this.fetchImplementation = options.fetchImplementation ?? fetch;
    this.restUrl = `${options.supabaseUrl.replace(/\/$/, "")}/rest/v1`;
  }

  private async request(path: string, init: RequestInit = {}) {
    const response = await this.fetchImplementation(`${this.restUrl}/${path}`, {
      ...init,
      headers: {
        ...createSupabaseServerHeaders(this.options.serviceRoleKey),
        ...init.headers,
      },
      cache: "no-store",
    });
    if (!response.ok)
      throw new Error(`job_repository_failed_${response.status}`);
    return response;
  }

  async hasCompleted(jobName: string, runKey: string) {
    const response = await this.request(
      `job_runs?select=id&job_name=eq.${encodeURIComponent(jobName)}&run_key=eq.${encodeURIComponent(runKey)}&status=eq.succeeded&limit=1`,
    );
    return completedRows.parse(await response.json()).length > 0;
  }

  async withLock<T>(jobName: string, work: () => Promise<T>) {
    const now = new Date();
    await this.request(
      `job_locks?job_name=eq.${encodeURIComponent(jobName)}&expires_at=lt.${encodeURIComponent(now.toISOString())}`,
      { method: "DELETE" },
    );
    await this.request("job_locks", {
      method: "POST",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify({
        job_name: jobName,
        acquired_at: now,
        expires_at: new Date(now.getTime() + 5 * 60_000),
      }),
    });
    try {
      return await work();
    } finally {
      await this.request(
        `job_locks?job_name=eq.${encodeURIComponent(jobName)}`,
        {
          method: "DELETE",
        },
      );
    }
  }

  async record(
    jobName: string,
    runKey: string,
    status: "succeeded" | "failed",
    recordsWritten: number,
  ) {
    const now = new Date().toISOString();
    await this.request("job_runs?on_conflict=job_name,run_key", {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
      body: JSON.stringify({
        job_name: jobName,
        status,
        started_at: now,
        finished_at: now,
        records_read: 0,
        records_written: recordsWritten,
        error_code: status === "failed" ? `${jobName}_failed` : null,
        error_summary:
          status === "failed"
            ? "Protected job failed; inspect structured telemetry."
            : null,
        run_key: runKey,
      }),
    });
  }
}
