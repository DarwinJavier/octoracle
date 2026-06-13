export const footballDataScheduledFixture = {
  id: 2001,
  utcDate: "2026-06-11T19:00:00Z",
  status: "TIMED",
  matchday: 1,
  stage: "GROUP_STAGE",
  group: "GROUP_A",
  lastUpdated: "2026-06-10T14:00:00Z",
  venue: "Mexico City Stadium",
  homeTeam: {
    id: 10,
    name: "Mexico",
    shortName: "Mexico",
    tla: "MEX",
    crest: "https://crests.football-data.org/10.svg",
  },
  awayTeam: {
    id: 20,
    name: "South Africa",
    shortName: "South Africa",
    tla: "RSA",
    crest: "https://crests.football-data.org/20.svg",
  },
  score: {
    winner: null,
    duration: null,
    fullTime: { home: null, away: null },
  },
};

export const footballDataLiveFixture = {
  ...footballDataScheduledFixture,
  status: "IN_PLAY",
  score: {
    winner: null,
    duration: "REGULAR",
    fullTime: { home: 1, away: 0 },
  },
};
