"use client";

import { useEffect, useState } from "react";

import { formatLocalDateTime, formatUtcDateTime } from "@/lib/time";

export function LocalKickoffTime({ kickoffAtUtc }: { kickoffAtUtc: string }) {
  const utcFallback = formatUtcDateTime(kickoffAtUtc);
  const [localTime, setLocalTime] = useState(utcFallback);

  useEffect(() => {
    const update = window.setTimeout(() => {
      try {
        setLocalTime(formatLocalDateTime(kickoffAtUtc));
      } catch {
        setLocalTime(utcFallback);
      }
    }, 0);
    return () => window.clearTimeout(update);
  }, [kickoffAtUtc, utcFallback]);

  return <time dateTime={kickoffAtUtc}>{localTime}</time>;
}
