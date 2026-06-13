import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PredictionPanel } from "@/components/prediction/PredictionPanel";
import { staticMatch, staticPrediction } from "@/lib/static-match";

describe("PredictionPanel", () => {
  it("labels an ephemeral provider prediction as a preview", () => {
    render(
      <PredictionPanel
        isPreview
        match={staticMatch}
        prediction={staticPrediction}
        revealed
      />,
    );

    expect(screen.getByText("Live provider preview")).toBeInTheDocument();
    expect(screen.getByText("Kickoff")).toBeInTheDocument();
    expect(screen.queryByText(/Stored prediction/)).not.toBeInTheDocument();
  });

  it("states team-win and draw outcomes explicitly", () => {
    const { rerender } = render(
      <PredictionPanel
        match={staticMatch}
        prediction={staticPrediction}
        revealed
      />,
    );
    expect(
      screen.getByRole("heading", { name: "Mexico wins!" }),
    ).toBeInTheDocument();

    rerender(
      <PredictionPanel
        match={staticMatch}
        prediction={{ ...staticPrediction, selectedOutcome: "draw" }}
        revealed
      />,
    );
    expect(screen.getByRole("heading", { name: "Draw" })).toBeInTheDocument();
  });
});
