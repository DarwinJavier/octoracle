import { afterEach, describe, expect, it } from "vitest";

import { researchConfigFromEnvironment } from "@/lib/research/config";

const previousDomains = process.env.ALLOWED_RESEARCH_DOMAINS;

afterEach(() => {
  process.env.ALLOWED_RESEARCH_DOMAINS = previousDomains;
});

describe("research configuration", () => {
  it("allows deployment configuration only within the reviewed domain allowlist", () => {
    process.env.ALLOWED_RESEARCH_DOMAINS = "fifa.com,evil.test,uefa.com";
    expect(researchConfigFromEnvironment().allowedDomains).toEqual([
      "fifa.com",
      "uefa.com",
    ]);
  });
});
