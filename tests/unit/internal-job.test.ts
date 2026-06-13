import { describe, expect, it } from "vitest";

import { isAuthorizedInternalRequest } from "@/lib/security/internal-job";

describe("internal job authentication", () => {
  it("accepts only an exact bearer secret", () => {
    const valid = new Request("https://example.test", {
      headers: { Authorization: "Bearer correct-secret" },
    });
    const invalid = new Request("https://example.test", {
      headers: { Authorization: "Bearer wrong-secret" },
    });
    expect(isAuthorizedInternalRequest(valid, "correct-secret")).toBe(true);
    expect(isAuthorizedInternalRequest(invalid, "correct-secret")).toBe(false);
  });
});
