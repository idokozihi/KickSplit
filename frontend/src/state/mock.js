export const people = [
  "Alex Morgan",
  "Daniel Levy",
  "Noam Cohen",
  "Ben Carter",
  "Omer David",
  "Liam Brooks",
  "Ethan Green",
  "Tom Wilson",
  "Ido Shalev",
  "Sam Miller",
  "Ari Klein",
  "Leo Davis",
  "Max Adler",
  "Dean Ross",
  "Jamie Cole",
  "Roy Tal",
];
export const demoGroups = [
  {
    id: "thursday",
    name: "Thursday Night FC",
    initials: "TN",
    color: "green",
    description: "The weekly game. The usual crew.",
    members: people.slice(0, 16),
    ratings: { overall: 3, attack: 4, defense: 3 },
  },
  {
    id: "weekend",
    name: "Weekend Warriors",
    initials: "WW",
    color: "orange",
    description: "Good football. Better weekends.",
    members: people.slice(0, 12),
    ratings: { overall: 3, attack: 3, defense: 4 },
  },
];
export const joinableGroup = {
  id: "park",
  name: "Parkside Five",
  initials: "PF",
  color: "blue",
  description: "A little football after work.",
  members: people.slice(1, 10),
};
const future = (days, hour) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(hour, 0, 0, 0);
  return date.toISOString();
};
export function seedGames() {
  return [
    {
      id: "night-lights",
      groupId: "thursday",
      title: "Under the lights",
      date: future(1, 20),
      target: 15,
      rsvp: "GOING",
      participants: people
        .slice(1, 14)
        .map((name, i) => ({
          id: `p${i}`,
          name,
          status: i < 11 ? "GOING" : "MAYBE",
        })),
      guests: [{ id: "guest-1", name: "Chris Taylor", rating: 3 }],
    },
    {
      id: "weekend-kickoff",
      groupId: "weekend",
      title: "Weekend kickoff",
      date: future(3, 9),
      target: 15,
      rsvp: null,
      participants: people
        .slice(1, 9)
        .map((name, i) => ({
          id: `w${i}`,
          name,
          status: i < 6 ? "GOING" : "MAYBE",
        })),
      guests: [],
    },
    {
      id: "next-thursday",
      groupId: "thursday",
      title: "Same time, next week",
      date: future(8, 20),
      target: 15,
      rsvp: null,
      participants: people
        .slice(1, 5)
        .map((name, i) => ({ id: `n${i}`, name, status: "GOING" })),
      guests: [],
    },
  ];
}
export const demoUser = {
  name: "Alex Morgan",
  username: "alexm",
  email: "alex@example.com",
  photo: "",
};
export function initialState({ includeDemoGames = true } = {}) {
  return {
    user: demoUser,
    groups: structuredClone(demoGroups),
    games: includeDemoGames ? seedGames() : [],
  };
}
export function stateForUser(current, user, includeDemoGames) {
  return current.user?.id === user.id
    ? { ...current, user }
    : { ...current, user, groups: [], games: initialState({ includeDemoGames }).games };
}
export function upcoming(games) {
  return games
    .filter((game) => game.proposedDays || new Date(game.date) > new Date())
    .sort((a, b) => new Date(a.proposedDays?.[0]?.date || a.date) - new Date(b.proposedDays?.[0]?.date || b.date));
}
export function goingPlayers(game, user) {
  return [
    ...(game.rsvp === "GOING" ? [{ id: "me", name: user.name }] : []),
    ...game.participants.filter((p) => p.status === "GOING"),
    ...game.guests.map((p) => ({ ...p, guest: true })),
  ];
}
// Demo variations only: swap players, then deal into three teams. No skill algorithm.
// Three players can only change numbered team assignments, not teammate pairings.
export function makeProposals(players) {
  return [0, 1, 2].map((variant) => {
    const order = [...players];
    if (variant === 1 && order.length >= 3)
      [order[0], order[1]] = [order[1], order[0]];
    if (variant === 2 && order.length >= 3)
      [order[0], order[2]] = [order[2], order[0]];
    return [0, 1, 2].map((team) => order.filter((_, i) => i % 3 === team));
  });
}

// Date-only strings are rendered in local time, without inventing a kickoff.
export function proposedDate(date) {
  return new Date(date.includes("T") ? date : `${date}T00:00:00`).toLocaleDateString("en-GB", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
}
let mockIdSequence = 0;
export function createMockId() {
  return globalThis.crypto?.randomUUID?.() ?? `mock-${Date.now()}-${++mockIdSequence}`;
}
export function createProposedDay(date, user) {
  return {
    id: createMockId(), date,
    proposedBy: { id: "me", name: user.name },
    availability: {},
  };
}
export function availableCount(day) {
  return Object.values(day.availability).filter((value) => value === "AVAILABLE").length;
}
export function participantCount(day) {
  return availableCount(day) + (day.guests || []).length;
}
export function compareDays(a, b) {
  return availableCount(b) - availableCount(a)
    || a.date.localeCompare(b.date) || a.id.localeCompare(b.id);
}
export function mostPopularDays(days) {
  return [...days].sort(compareDays).slice(0, 1).map((day) => day.id);
}
// Adapt existing demo dates and responses; no additional dates are generated.
export function gameDays(game) {
  if (game.proposedDays && !game.backendBacked) return game.proposedDays;
  const response = (status) => status === "GOING" ? "AVAILABLE"
    : status === "NOT_GOING" ? "UNAVAILABLE" : null;
  return [{
    id: game.id, date: game.date,
    proposedBy: { id: "me", name: demoUser.name },
    availability: Object.fromEntries([
      ["me", response(game.rsvp)],
      ...game.participants.map((player) => [player.id, response(player.status)]),
    ].filter(([, value]) => value)),
    guests: game.guests,
  }];
}
export function rankedDays(games) {
  return games.flatMap((game) => gameDays(game).map((day) => ({ game, day })))
    .sort((a, b) => compareDays(a.day, b.day) || a.game.id.localeCompare(b.game.id));
}
export function rankedDaysByGroup(games) {
  const groupIds = [...new Set(games.map((game) => game.groupId))].sort();
  return groupIds.flatMap((groupId) =>
    rankedDays(games.filter((game) => game.groupId === groupId))
      .map((entry, index) => ({ ...entry, popular: index === 0 })),
  );
}
export function dayGame(game, dayId) {
  const day = gameDays(game).find((item) => item.id === dayId) || gameDays(game)[0];
  const status = (id) => day.availability[id] === "AVAILABLE" ? "GOING"
    : day.availability[id] === "UNAVAILABLE" ? "NOT_GOING" : "MAYBE";
  return {
    ...game, day, date: day.date, rsvp: status("me"),
    participants: game.participants.map((player) => ({ ...player, status: status(player.id) })),
    guests: day.guests || [],
  };
}
export function respondToDay(game, dayId, memberId, response) {
  return {
    ...game,
    proposedDays: gameDays(game).map((day) => day.id === dayId
      ? { ...day, availability: { ...day.availability, [memberId]: response } }
      : day),
  };
}
