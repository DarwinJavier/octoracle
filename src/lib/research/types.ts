import { z } from "zod";

export const evidenceCategorySchema = z.enum([
  "form",
  "squad_availability",
  "tactics",
  "historical_strength",
  "tournament_performance",
  "other",
]);

export const extractedObservationSchema = z
  .object({
    lean: z.enum(["team_a", "draw", "team_b", "unclear"]),
    confidence: z.number().min(0).max(1),
    evidenceCategories: z.array(evidenceCategorySchema).max(6),
    summary: z.string().min(1).max(240),
    publishedAt: z.string().datetime().nullable(),
  })
  .strict();

export const sourceObservationSchema = extractedObservationSchema
  .extend({
    matchId: z.string().uuid(),
    sourceDomain: z.string().min(1),
    canonicalUrl: z.string().url(),
    title: z.string().min(1).max(300),
    retrievedAt: z.string().datetime(),
    contentHash: z.string().regex(/^[a-f0-9]{64}$/),
    parserVersion: z.string().min(1),
    modelVersion: z.string().min(1),
  })
  .strict();

export type ExtractedObservation = z.infer<typeof extractedObservationSchema>;
export type SourceObservation = z.infer<typeof sourceObservationSchema>;

export type ResearchDocument = {
  canonicalUrl: string;
  sourceDomain: string;
  title: string;
  text: string;
  contentHash: string;
  retrievedAt: string;
};
