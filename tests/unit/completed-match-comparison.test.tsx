import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { CompletedMatchComparison } from "@/components/prediction/CompletedMatchComparison";
import { staticMatch, staticPrediction } from "@/lib/static-match";

describe("CompletedMatchComparison", () => {
  it("compares a recorded prediction with the real result", () => {
    render(
      <CompletedMatchComparison
        match={staticMatch}
        prediction={staticPrediction}
        result={{
          scoreA90: 2,
          scoreB90: 1,
          scoreAFinal: 2,
          scoreBFinal: 1,
          winnerTeamId: staticMatch.teamA.id,
        }}
      />,
    );

    expect(screen.getByText("Real result")).toBeInTheDocument();
    expect(screen.getByText("Recorded prediction")).toBeInTheDocument();
    expect(screen.getByText("Exact score correct")).toBeInTheDocument();
  });

  it("uses the final resolved score for penalty shootout comparisons", () => {
    render(
      <CompletedMatchComparison
        match={staticMatch}
        prediction={{
          ...staticPrediction,
          predictedScoreA90: 3,
          predictedScoreB90: 4,
          selectedOutcome: "team_b",
          predictedAdvancingTeamId: staticMatch.teamB.id,
        }}
        result={{
          scoreA90: 1,
          scoreB90: 1,
          scoreAFinal: 3,
          scoreBFinal: 4,
          winnerTeamId: staticMatch.teamB.id,
        }}
      />,
    );

    expect(screen.getByText(/Final result; 90-minute score was 1/)).toBeInTheDocument();
    expect(screen.getByText("Exact score correct")).toBeInTheDocument();
  });
});
