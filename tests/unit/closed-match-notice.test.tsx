import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ClosedMatchNotice } from "@/components/prediction/ClosedMatchNotice";

describe("ClosedMatchNotice", () => {
  it("explains why the match is closed and invites another reveal", () => {
    render(<ClosedMatchNotice />);

    expect(
      screen.getByRole("heading", {
        name: "OctoOracle is closed for this match",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/will not invent one after kickoff/i),
    ).toBeVisible();
    expect(
      screen.getByRole("link", {
        name: "Reveal a prediction for the next match",
      }),
    ).toHaveAttribute("href", "#games-today");
  });
});
