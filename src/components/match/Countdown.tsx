"use client";

import { useEffect, useState } from "react";

import { getCountdownParts } from "@/lib/time";

export function Countdown({ kickoffAtUtc }: { kickoffAtUtc: string }) {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    const initialUpdate = window.setTimeout(() => setNow(new Date()), 0);
    const interval = window.setInterval(() => setNow(new Date()), 1000);
    return () => {
      window.clearTimeout(initialUpdate);
      window.clearInterval(interval);
    };
  }, []);

  if (!now) {
    return (
      <p className="countdown-loading" aria-live="polite">
        Calculating countdown…
      </p>
    );
  }

  const countdown = getCountdownParts(kickoffAtUtc, now);
  if (countdown.complete) {
    return <p className="countdown-loading">Kickoff time reached</p>;
  }

  return (
    <dl className="countdown" aria-label="Countdown to kickoff">
      {[
        ["Days", countdown.days],
        ["Hours", countdown.hours],
        ["Minutes", countdown.minutes],
        ["Seconds", countdown.seconds],
      ].map(([label, value]) => (
        <div key={label}>
          <dd>{String(value).padStart(2, "0")}</dd>
          <dt>{label}</dt>
        </div>
      ))}
    </dl>
  );
}
