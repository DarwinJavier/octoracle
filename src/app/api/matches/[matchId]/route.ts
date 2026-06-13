import { publicJson } from "@/lib/public-data/api";
import { loadMatch } from "@/lib/public-data/load";

export async function GET(
  _request: Request,
  context: { params: Promise<{ matchId: string }> },
) {
  const { matchId } = await context.params;
  const response = await loadMatch(matchId);
  if (response?.state === "provider_error")
    return publicJson({ error: "provider_error" }, 503);
  if (!response?.match) return publicJson({ error: "not_found" }, 404);
  return publicJson(response.match);
}
