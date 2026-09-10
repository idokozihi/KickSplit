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
export function initialState() {
  return {
    user: demoUser,
    groups: structuredClone(demoGroups),
    games: seedGames(),
  };
}
export function upcoming(games) {
  return games
    .filter((game) => new Date(game.date) > new Date())
    .sort((a, b) => new Date(a.date) - new Date(b.date));
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
