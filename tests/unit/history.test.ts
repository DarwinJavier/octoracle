import { describe, expect, it } from "vitest";

import { demoHistory } from "@/lib/history/load";
import { buildHistoryResponse } from "@/lib/history/service";

describe("prediction history", () => {
  it("calculates public accuracy summaries from immutable history items", () => {
    const demo = demoHistory();
    const response = buildHistoryResponse([
      demo.items[0],
      {
        ...demo.items[0],
        match: { ...demo.items[0].match, id: "second" },
        accuracy: {
          outcomeCorrect: false,
          exactScoreCorrect: false,
          advancingTeamCorrect: null,
        },
      },
    ]);
    expect(response.outcomeAccuracy).toBe(0.5);
    expect(response.exactScoreAccuracy).toBe(0.5);
  });
});
