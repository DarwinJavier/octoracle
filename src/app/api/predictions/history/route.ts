import { z } from "zod";

import { loadPredictionHistory } from "@/lib/history/load";
import { publicJson } from "@/lib/public-data/api";

const limitSchema = z.coerce.number().int().min(1).max(100).default(20);

export async function GET(request: Request) {
  const limit = limitSchema.safeParse(
    new URL(request.url).searchParams.get("limit") ?? undefined,
  );
  if (!limit.success) return publicJson({ error: "invalid_limit" }, 400);
  return publicJson(await loadPredictionHistory(limit.data));
}
