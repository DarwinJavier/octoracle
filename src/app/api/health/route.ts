import { publicJson } from "@/lib/public-data/api";

export async function GET() {
  return publicJson({ status: "ok", time: new Date().toISOString() });
}
