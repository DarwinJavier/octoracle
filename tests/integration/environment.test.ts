import { describe, expect, it } from "vitest";
import { z } from "zod";

describe("validated configuration", () => {
  it("rejects populated public secret variables", () => {
    const publicVariableName = z
      .string()
      .refine((name) => !name.startsWith("NEXT_PUBLIC_"));

    expect(publicVariableName.safeParse("FOOTBALL_DATA_API_KEY").success).toBe(
      true,
    );
    expect(
      publicVariableName.safeParse("NEXT_PUBLIC_OPENAI_API_KEY").success,
    ).toBe(false);
  });
});
