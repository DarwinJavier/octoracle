import { describe, expect, it } from "vitest";

import { createSupabaseServerHeaders } from "@/lib/db/supabase-auth";

describe("createSupabaseServerHeaders", () => {
  it("uses modern secret keys only as an apikey", () => {
    expect(createSupabaseServerHeaders("sb_secret_example")).toEqual({
      apikey: "sb_secret_example",
      "Content-Type": "application/json",
    });
  });

  it("keeps legacy service-role JWT bearer authentication", () => {
    expect(createSupabaseServerHeaders("legacy-jwt")).toEqual({
      apikey: "legacy-jwt",
      Authorization: "Bearer legacy-jwt",
      "Content-Type": "application/json",
    });
  });
});
