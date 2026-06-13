import type { SourceObservation } from "./types";

export type SourceObservationRepository = {
  saveObservations(observations: SourceObservation[]): Promise<number>;
};
