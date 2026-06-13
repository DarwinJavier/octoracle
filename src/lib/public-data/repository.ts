import type { NormalizedFixture } from "@/lib/fixtures/types";
import type { PublicPrediction } from "@/types/public";

export type PublicDataRepository = {
  listFixtures(): Promise<NormalizedFixture[]>;
  getPublishedPrediction(matchId: string): Promise<PublicPrediction | null>;
};
