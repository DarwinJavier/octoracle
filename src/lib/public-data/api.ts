export function publicJson(body: unknown, status = 200) {
  return Response.json(body, {
    status,
    headers: {
      "Cache-Control": "public, max-age=30, stale-while-revalidate=120",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
