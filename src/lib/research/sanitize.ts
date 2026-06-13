const BLOCKS =
  /<(script|style|form|nav|footer|header|aside|noscript|svg|iframe|template)\b[^>]*>[\s\S]*?<\/\1>/gi;
const HIDDEN_BLOCKS =
  /<([a-z0-9]+)\b[^>]*(?:\shidden(?=[\s=>])|\saria-hidden\s*=\s*["']?true|\sstyle\s*=\s*["'][^"']*(?:display\s*:\s*none|visibility\s*:\s*hidden))[^>]*>[\s\S]*?<\/\1>/gi;
const COMMENTS = /<!--[\s\S]*?-->/g;
const TAGS = /<[^>]+>/g;

const ENTITIES: Record<string, string> = {
  amp: "&",
  apos: "'",
  gt: ">",
  lt: "<",
  nbsp: " ",
  quot: '"',
};

function decodeEntities(value: string) {
  return value.replace(
    /&(#x?[0-9a-f]+|[a-z]+);/gi,
    (_match, entity: string) => {
      if (entity.startsWith("#x"))
        return String.fromCodePoint(Number.parseInt(entity.slice(2), 16));
      if (entity.startsWith("#"))
        return String.fromCodePoint(Number.parseInt(entity.slice(1), 10));
      return ENTITIES[entity.toLowerCase()] ?? " ";
    },
  );
}

export function sanitizeHtmlToText(html: string, maxCharacters = 50_000) {
  return decodeEntities(
    html
      .replace(COMMENTS, " ")
      .replace(BLOCKS, " ")
      .replace(HIDDEN_BLOCKS, " ")
      .replace(TAGS, " "),
  )
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxCharacters);
}

export function extractHtmlTitle(html: string) {
  const title =
    html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? "Untitled source";
  return sanitizeHtmlToText(title, 300) || "Untitled source";
}
