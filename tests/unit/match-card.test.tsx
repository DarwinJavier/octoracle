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
});
