import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import Home from "@/app/page";

describe("Home", () => {
  it("renders the complete static match experience", async () => {
    render(await Home({ searchParams: Promise.resolve({}) }));

    expect(
      screen.getByRole("heading", { name: /next match/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Mexico City Stadium, Mexico City"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("img", { name: "Mexico flag" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("img", { name: "South Africa flag" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/entertainment and sports analysis only/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Previous results" }),
    ).toHaveAttribute("href", "#accuracy-history");
    expect(
      screen.queryByText(/performance cannot change/i),
    ).not.toBeInTheDocument();
  });

  it("reveals the stored prediction without changing its outcome", async () => {
    render(
      await Home({
        searchParams: Promise.resolve({ animation: "error" }),
      }),
    );

    const revealButton = await screen.findByRole("button", {
      name: "Ask the Octopus",
    });
    fireEvent.click(revealButton);

    const predictionPanel = screen
      .getByRole("heading", { name: "The Octopus has spoken" })
      .closest("section");
    expect(predictionPanel).not.toBeNull();
    const prediction = within(predictionPanel!);

    expect(prediction.getByText("Predicted result")).toBeInTheDocument();
    expect(
      prediction.getByText("Mexico wins!", { selector: "h3" }),
    ).toBeInTheDocument();
    expect(prediction.getByText(/Mexico 2–1 South Africa/)).toBeInTheDocument();
    expect(prediction.getByText("52%")).toBeInTheDocument();
  });

  it("renders honest fallback notices from validated states", async () => {
    render(
      await Home({
        searchParams: Promise.resolve({ state: "provider-unavailable" }),
      }),
    );

    expect(screen.getByRole("status")).toHaveTextContent(
      "Fixture provider unavailable",
    );
    expect(screen.getByRole("status")).toHaveTextContent(
      "No match or prediction has been fabricated",
    );
  });

  it("does not expose a prediction when it is not ready", async () => {
    render(
      await Home({
        searchParams: Promise.resolve({ state: "not-ready" }),
      }),
    );

    expect(
      screen.queryByRole("button", { name: "Ask the Octopus" }),
    ).not.toBeInTheDocument();
  });
});
