import { createHash } from "node:crypto";

import { extractHtmlTitle, sanitizeHtmlToText } from "./sanitize";
import type { ResearchDocument } from "./types";

const ALLOWED_CONTENT_TYPES = ["text/html", "text/plain"];

export type ResearchFetcherOptions = {
  allowedDomains: string[];
  fetchImplementation?: typeof fetch;
  maxBytes?: number;
  timeoutMs?: number;
  maxRedirects?: number;
};

function allowedHostname(hostname: string, allowedDomains: string[]) {
  return allowedDomains.some(
    (domain) => hostname === domain || hostname.endsWith(`.${domain}`),
  );
}

function validateUrl(rawUrl: string, allowedDomains: string[]) {
  const url = new URL(rawUrl);
  if (url.protocol !== "https:") throw new Error("research_https_required");
  if (url.username || url.password)
    throw new Error("research_credentials_forbidden");
  if (!allowedHostname(url.hostname, allowedDomains))
    throw new Error("research_domain_not_allowed");
  return url;
}

export class AllowlistedResearchFetcher {
  private readonly fetchImplementation: typeof fetch;
  private readonly maxBytes: number;
  private readonly timeoutMs: number;
  private readonly maxRedirects: number;

  constructor(private readonly options: ResearchFetcherOptions) {
    this.fetchImplementation = options.fetchImplementation ?? fetch;
    this.maxBytes = options.maxBytes ?? 1_000_000;
    this.timeoutMs = options.timeoutMs ?? 8_000;
    this.maxRedirects = options.maxRedirects ?? 3;
  }

  async fetch(rawUrl: string): Promise<ResearchDocument> {
    let url = validateUrl(rawUrl, this.options.allowedDomains);

    for (let redirect = 0; redirect <= this.maxRedirects; redirect += 1) {
      const response = await this.fetchImplementation(url, {
        headers: { Accept: "text/html,text/plain;q=0.9" },
        redirect: "manual",
        signal: AbortSignal.timeout(this.timeoutMs),
        cache: "no-store",
      });
      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get("location");
        if (!location || redirect === this.maxRedirects)
          throw new Error("research_redirect_rejected");
        url = validateUrl(
          new URL(location, url).toString(),
          this.options.allowedDomains,
        );
        continue;
      }
      if (!response.ok)
        throw new Error(`research_fetch_failed_${response.status}`);
      const contentType =
        response.headers.get("content-type")?.split(";")[0].trim() ?? "";
      if (!ALLOWED_CONTENT_TYPES.includes(contentType))
        throw new Error("research_content_type_rejected");
      const declaredLength = Number(
        response.headers.get("content-length") ?? 0,
      );
      if (declaredLength > this.maxBytes)
        throw new Error("research_response_too_large");

      const bytes = new Uint8Array(await response.arrayBuffer());
      if (bytes.byteLength > this.maxBytes)
        throw new Error("research_response_too_large");
      const rawText = new TextDecoder().decode(bytes);
      const text =
        contentType === "text/html"
          ? sanitizeHtmlToText(rawText)
          : rawText.trim().slice(0, 50_000);
      if (!text) throw new Error("research_empty_content");
      return {
        canonicalUrl: url.toString(),
        sourceDomain: url.hostname,
        title:
          contentType === "text/html"
            ? extractHtmlTitle(rawText)
            : "Untitled source",
        text,
        contentHash: createHash("sha256").update(text).digest("hex"),
        retrievedAt: new Date().toISOString(),
      };
    }
    throw new Error("research_redirect_rejected");
  }
}
