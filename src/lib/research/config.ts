function commaSeparated(value: string | undefined) {
  return (value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export const APPROVED_RESEARCH_DOMAINS = [
  "fifa.com",
  "concacaf.com",
  "uefa.com",
  "cafonline.com",
  "the-afc.com",
  "conmebol.com",
  "oceaniafootball.com",
] as const;

export function researchConfigFromEnvironment() {
  const requestedDomains = commaSeparated(process.env.ALLOWED_RESEARCH_DOMAINS);
  return {
    allowedDomains: requestedDomains.filter((domain) =>
      APPROVED_RESEARCH_DOMAINS.includes(
        domain as (typeof APPROVED_RESEARCH_DOMAINS)[number],
      ),
    ),
    sourceUrls: commaSeparated(process.env.RESEARCH_SOURCE_URLS),
    openAiApiKey: process.env.OPENAI_API_KEY ?? "",
    openAiModel: process.env.OPENAI_RESEARCH_MODEL ?? "",
  };
}
