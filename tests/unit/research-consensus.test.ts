import { describe, expect, it } from "vitest";

import {
  calculateConsensus,
  deduplicateObservations,
} from "@/lib/research/consensus";
import { applyConsensusToPredictionInput } from "@/lib/research/prediction-input";
import { predictionInput } from "../fixtures/prediction-input";
import { sourceObservation } from "../fixtures/source-observation";

describe("validated research consensus", () => {
  it("deduplicates copied content and caps influence per domain", () => {
    const observations = [
      sourceObservation(),
      sourceObservation({ canonicalUrl: "https://copy.test/item" }),
      sourceObservation({
        canonicalUrl: "https://example.com/two",
        contentHash: "b".repeat(64),
      }),
      sourceObservation({
        canonicalUrl: "https://example.com/three",
        contentHash: "c".repeat(64),
      }),
    ];
    expect(deduplicateObservations(observations)).toHaveLength(2);
  });

  it("requires three independent meaningful sources before influencing prediction inputs", () => {
    const observations = ["one.test", "two.test", "three.test"].map(
      (domain, index) =>
        sourceObservation({
          sourceDomain: domain,
          canonicalUrl: `https://${domain}/report`,
          contentHash: String(index + 1).repeat(64),
        }),
    );
    const consensus = calculateConsensus(
      observations,
      new Date("2026-06-10T00:00:00.000Z"),
    );
    const applied = applyConsensusToPredictionInput(
      predictionInput(),
      consensus,
    );
    expect(consensus.sufficient).toBe(true);
    expect(applied.teamA.publicConsensus).toBeGreaterThan(0.5);
    expect(applied.sourceCount).toBe(3);
  });

  it("uses a neutral signal when sources are insufficient", () => {
    const consensus = calculateConsensus([sourceObservation()]);
    const applied = applyConsensusToPredictionInput(
      predictionInput(),
      consensus,
    );
    expect(consensus.sufficient).toBe(false);
    expect(applied.teamA.publicConsensus).toBe(0.5);
    expect(applied.teamB.publicConsensus).toBe(0.5);
  });
});
