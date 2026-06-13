import { timingSafeEqual } from "node:crypto";

import { z } from "zod";

export const idempotencyKeySchema = z
  .string()
  .min(8)
  .max(128)
  .regex(/^[a-zA-Z0-9._:-]+$/);

const attempts = new Map<string, { count: number; resetAt: number }>();

export function isAuthorizedInternalRequest(
  request: Request,
  expectedSecret: string,
) {
  const provided =
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  const providedBuffer = Buffer.from(provided);
  const expectedBuffer = Buffer.from(expectedSecret);
  return (
    providedBuffer.length === expectedBuffer.length &&
    expectedBuffer.length > 0 &&
    timingSafeEqual(providedBuffer, expectedBuffer)
  );
}

export function isRateLimited(key: string, now = Date.now()) {
  const current = attempts.get(key);
  if (!current || current.resetAt <= now) {
    attempts.set(key, { count: 1, resetAt: now + 60_000 });
    return false;
  }
  current.count += 1;
  return current.count > 5;
}
