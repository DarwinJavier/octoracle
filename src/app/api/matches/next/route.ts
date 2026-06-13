import { publicJson } from "@/lib/public-data/api";
import { loadFeaturedMatch } from "@/lib/public-data/load";

export async function GET() {
  const response = await loadFeaturedMatch();
  return publicJson(response, response.state === "provider_error" ? 503 : 200);
}
