import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { MatchCard } from "@/components/match/MatchCard";
import { staticMatch } from "@/lib/static-match";

describe("MatchCard", () => {
  it("hides an unconfirmed location instead of displaying placeholders", () => {
    render(
      <MatchCard
        match={{
          ...staticMatch,
          city: "City to be confirmed",
          venue: "Venue to be confirmed",
        }}
      />,
    );

    expect(screen.queryByText("Location")).not.toBeInTheDocument();
    expect(screen.queryByText(/to be confirmed/)).not.toBeInTheDocument();
  });

  it("labels an active fixture as a match in progress", () => {
    render(<MatchCard match={staticMatch} state="in_progress" />);

    expect(
      screen.getByRole("heading", { name: "Match in progress" }),
    ).toBeInTheDocument();
  });

  it("shows the current FIFA ranking for each team", () => {
    render(<MatchCard match={staticMatch} />);

    expect(screen.getByText("FIFA rank #14")).toBeInTheDocument();
    expect(screen.getByText("FIFA rank #60")).toBeInTheDocument();
  });
});
