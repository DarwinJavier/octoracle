export function formatUtcDateTime(isoDate: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    hour: "2-digit",
    hourCycle: "h23",
    minute: "2-digit",
    month: "short",
    timeZone: "UTC",
    timeZoneName: "short",
    year: "numeric",
  }).format(new Date(isoDate));
}

export function formatLocalDateTime(
  isoDate: string,
  timeZone?: string,
): string {
  return new Intl.DateTimeFormat(undefined, {
    day: "numeric",
    hour: "2-digit",
    hourCycle: "h23",
    minute: "2-digit",
    month: "short",
    timeZone,
    timeZoneName: "short",
    year: "numeric",
  }).format(new Date(isoDate));
}

function formatTimeInZone(isoDate: string, timeZone: string): string {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone,
  }).format(new Date(isoDate));
}

export function formatEasternPacificKickoff(isoDate: string): string {
  const date = new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
    timeZone: "America/New_York",
    year: "numeric",
  }).format(new Date(isoDate));
  const eastern = formatTimeInZone(isoDate, "America/New_York");
  const pacific = formatTimeInZone(isoDate, "America/Los_Angeles");
  return `${date} · ${eastern} ET / ${pacific} PT`;
}

export function getCountdownParts(targetIsoDate: string, now: Date) {
  const difference = Math.max(
    0,
    new Date(targetIsoDate).getTime() - now.getTime(),
  );
  const totalSeconds = Math.floor(difference / 1000);

  return {
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
    complete: difference === 0,
  };
}
