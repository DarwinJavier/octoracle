import { describe, expect, it } from "vitest";

import {
  formatEasternPacificKickoff,
  formatLocalDateTime,
  formatUtcDateTime,
  getCountdownParts,
} from "@/lib/time";

describe("time formatting", () => {
  it("formats the official kickoff in UTC", () => {
    expect(formatUtcDateTime("2026-06-11T19:00:00.000Z")).toContain("19:00");
    expect(formatUtcDateTime("2026-06-11T19:00:00.000Z")).toContain("UTC");
  });

  it("applies daylight-saving rules for the viewer timezone", () => {
    const winter = formatLocalDateTime(
      "2026-01-15T19:00:00.000Z",
      "America/Toronto",
    );
    const summer = formatLocalDateTime(
      "2026-06-11T19:00:00.000Z",
      "America/Toronto",
    );

    expect(winter).toContain("14:00");
    expect(summer).toContain("15:00");
  });

  it("shows one Eastern and Pacific kickoff line", () => {
    expect(formatEasternPacificKickoff("2026-06-12T19:00:00.000Z")).toBe(
      "Jun 12, 2026 · 3:00 PM ET / 12:00 PM PT",
    );
  });

  it("calculates a stable countdown and clamps at zero", () => {
    expect(
      getCountdownParts(
        "2026-06-11T19:00:00.000Z",
        new Date("2026-06-09T18:59:59.000Z"),
      ),
    ).toMatchObject({
      days: 2,
      hours: 0,
      minutes: 0,
      seconds: 1,
      complete: false,
    });

    expect(
      getCountdownParts(
        "2026-06-11T19:00:00.000Z",
        new Date("2026-06-11T19:00:01.000Z"),
      ),
    ).toMatchObject({
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      complete: true,
    });
  });
});
