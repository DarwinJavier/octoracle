export function createSupabaseServerHeaders(
  serverKey: string,
): Record<string, string> {
  return {
    apikey: serverKey,
    ...(serverKey.startsWith("sb_secret_")
      ? {}
      : { Authorization: `Bearer ${serverKey}` }),
    "Content-Type": "application/json",
  };
}
