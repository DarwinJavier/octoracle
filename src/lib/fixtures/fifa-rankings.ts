const FIFA_RANKING_SNAPSHOT = {
  ALG: 28,
  ARG: 1,
  AUS: 27,
  AUT: 24,
  BEL: 9,
  BIH: 64,
  BRA: 6,
  CAN: 30,
  CIV: 33,
  COD: 46,
  COL: 13,
  CPV: 67,
  CRO: 11,
  CUW: 82,
  CZE: 40,
  ECU: 23,
  EGY: 29,
  ENG: 4,
  ESP: 2,
  FRA: 3,
  GER: 10,
  GHA: 73,
  HAI: 83,
  IRN: 20,
  IRQ: 57,
  JOR: 63,
  JPN: 18,
  KOR: 25,
  KSA: 61,
  MAR: 7,
  MEX: 14,
  NED: 8,
  NOR: 31,
  NZL: 85,
  PAN: 34,
  PAR: 41,
  POR: 5,
  QAT: 56,
  RSA: 60,
  SCO: 42,
  SEN: 15,
  SUI: 19,
  SWE: 38,
  TUN: 45,
  TUR: 22,
  URU: 16,
  USA: 17,
  UZB: 50,
} as const;

const FIFA_CODE_ALIASES: Record<string, string> = {
  URY: "URU",
};

export const FIFA_RANKING_SNAPSHOT_DATE = "2026-06-11";

export function canonicalFifaCode(providerCode: string | null) {
  if (!providerCode) return null;
  const code = providerCode.toUpperCase();
  return FIFA_CODE_ALIASES[code] ?? code;
}

export function fifaRankForCode(providerCode: string | null) {
  const code = canonicalFifaCode(providerCode);
  if (!code) return null;
  return (
    FIFA_RANKING_SNAPSHOT[code as keyof typeof FIFA_RANKING_SNAPSHOT] ?? null
  );
}
