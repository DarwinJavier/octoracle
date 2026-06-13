import { z } from "zod";
import sharp from "sharp";

const teamIdSchema = z.string().regex(/^\d+$/);
const teamResponseSchema = z.object({ crest: z.string().url() }).passthrough();
const ALLOWED_CONTENT_TYPES = new Set(["image/png", "image/svg+xml"]);
const MAX_FLAG_BYTES = 250_000;

export async function GET(
  _request: Request,
  context: { params: Promise<{ teamId: string }> },
) {
  const apiKey = process.env.FOOTBALL_DATA_API_KEY;
  const parsedTeamId = teamIdSchema.safeParse((await context.params).teamId);
  if (!apiKey || !parsedTeamId.success) {
    return new Response(null, { status: 404 });
  }

  try {
    const teamResponse = await fetch(
      `https://api.football-data.org/v4/teams/${parsedTeamId.data}`,
      {
        cache: "force-cache",
        headers: { "X-Auth-Token": apiKey },
        signal: AbortSignal.timeout(5_000),
      },
    );
    if (!teamResponse.ok) return new Response(null, { status: 404 });
    const { crest } = teamResponseSchema.parse(await teamResponse.json());
    const crestUrl = new URL(crest);
    if (
      crestUrl.protocol !== "https:" ||
      crestUrl.hostname !== "crests.football-data.org"
    ) {
      return new Response(null, { status: 404 });
    }

    const crestResponse = await fetch(crestUrl, {
      cache: "force-cache",
      redirect: "error",
      signal: AbortSignal.timeout(5_000),
    });
    const contentType = crestResponse.headers
      .get("content-type")
      ?.split(";")[0];
    if (
      !crestResponse.ok ||
      !contentType ||
      !ALLOWED_CONTENT_TYPES.has(contentType)
    ) {
      return new Response(null, { status: 404 });
    }
    const bytes = await crestResponse.arrayBuffer();
    if (bytes.byteLength > MAX_FLAG_BYTES) {
      return new Response(null, { status: 404 });
    }
    const png = await sharp(Buffer.from(bytes))
      .resize({ fit: "inside", height: 96, width: 144 })
      .png()
      .toBuffer();
    const body = Uint8Array.from(png);

    return new Response(body, {
      headers: {
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
        "Content-Security-Policy": "sandbox",
        "Content-Type": "image/png",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new Response(null, { status: 404 });
  }
}
