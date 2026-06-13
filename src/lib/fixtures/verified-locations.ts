type VerifiedLocation = {
  city: string;
  venue: string;
};

// football-data.org currently omits World Cup venue fields. Keep this small,
// human-verified fallback keyed to the provider fixture ID.
const VERIFIED_LOCATIONS: Readonly<Record<string, VerifiedLocation>> = {
  "537333": {
    city: "Toronto",
    venue: "Toronto Stadium",
  },
};

export function verifiedLocationFor(providerId: string) {
  return VERIFIED_LOCATIONS[providerId] ?? null;
}
