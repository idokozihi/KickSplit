import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { initialState, goingPlayers, makeProposals, upcoming } from "./mock.js";
import { rankedDaysByGroup } from "./mock.js";
import { createProposedDay, availableCount, mostPopularDays, respondToDay, proposedDate, rankedDays, gameDays, dayGame } from "./mock.js";

test("creation waits for saving and navigates using the backend ID", async () => {
  const source = readFileSync(new URL("../components/Forms.jsx", import.meta.url), "utf8");
  const form = source.slice(source.indexOf("export function CreateGameForm"));
  const handler = form.slice(form.indexOf("  async function submit(event)"), form.indexOf("\n  return ("));
  const calls = [];
  const fields = new Map([["title", " Friday football "], ["date", "2026-09-18"], ["target", "15"]]);
  let complete;
  const pending = new Promise((resolve) => { complete = resolve; });
  const submit = runInNewContext(`${handler}\nsubmit`, {
    FormData: class { get(key) { return fields.get(key); } },
    groupId: "7", saving: false,
    setSaving: (value) => calls.push(["saving", value]),
    setError: (message) => { if (message) assert.fail(message); },
    addGame: (game) => { calls.push(["save", game]); return pending; },
    onClose: () => calls.push(["close"]),
    navigate: (path) => calls.push(["navigate", path]),
  });
  const submitted = submit({ preventDefault() {}, currentTarget: {} });
  assert.deepEqual(calls.map(([action]) => action), ["saving", "save"]);
  assert.equal(calls[1][1].title, "Friday football");
  assert.equal(calls[1][1].target, 15);
  complete({ id: "42" });
  await submitted;
  assert.deepEqual(calls.slice(2), [["close"], ["navigate", "/games/42"], ["saving", false]]);
});

test("failed creation stays on the form and clears saving", async () => {
  const source = readFileSync(new URL("../components/Forms.jsx", import.meta.url), "utf8");
  const form = source.slice(source.indexOf("export function CreateGameForm"));
  const handler = form.slice(form.indexOf("  async function submit(event)"), form.indexOf("\n  return ("));
  const errors = [], savingStates = [];
  const fields = new Map([["title", "Football"], ["date", "2026-09-18"], ["target", "15"]]);
  const submit = runInNewContext(`${handler}\nsubmit`, {
    FormData: class { get(key) { return fields.get(key); } },
    groupId: "7", saving: false,
    setSaving: (value) => savingStates.push(value),
    setError: (message) => errors.push(message),
    addGame: async () => { throw new Error("Server unavailable"); },
    onClose: () => assert.fail("Must stay open"),
    navigate: () => assert.fail("Must not navigate"),
  });
  await submit({ preventDefault() {}, currentTarget: {} });
  assert.deepEqual(errors, ["", "Server unavailable"]);
  assert.deepEqual(savingStates, [true, false]);
});

test("a member explicitly proposes one day without a time or inferred response", () => {
  const day = createProposedDay("2026-09-12", { name: "Alex Morgan" });
  assert.equal(day.date, "2026-09-12");
  assert.deepEqual(day.proposedBy, { id: "me", name: "Alex Morgan" });
  assert.deepEqual(day.availability, {});
  assert.equal(availableCount(day), 0);
  assert.match(proposedDate(day.date), /12 September 2026/);
});

test("availability is independent per member and day, and popularity follows responses", () => {
  const first = createProposedDay("2026-09-12", { name: "Alex" });
  const second = createProposedDay("2026-09-13", { name: "Alex" });
  const original = { proposedDays: [first, second], guests: [{ id: "guest" }] };
  let game = respondToDay(original, first.id, "me", "AVAILABLE");
  game = respondToDay(game, first.id, "member-2", "AVAILABLE");
  game = respondToDay(game, second.id, "me", "AVAILABLE");
  assert.equal(availableCount(game.proposedDays[0]), 2);
  assert.equal(availableCount(game.proposedDays[1]), 1);
  assert.deepEqual(mostPopularDays(game.proposedDays), [first.id]);
  game = respondToDay(game, first.id, "me", "AVAILABLE");
  assert.equal(availableCount(game.proposedDays[0]), 2);
  game = respondToDay(game, first.id, "me", "UNAVAILABLE");
  assert.deepEqual(mostPopularDays(game.proposedDays), [first.id]);
  game = respondToDay(game, first.id, "member-2", "UNAVAILABLE");
  assert.deepEqual(mostPopularDays(game.proposedDays), [second.id]);
  assert.deepEqual(original.proposedDays[0].availability, {});
  assert.deepEqual(mostPopularDays([]), []);
  assert.deepEqual(mostPopularDays(original.proposedDays), [first.id]);
});

test("planning stays visible without automatically closing or locking a date", () => {
  const game = { id: "planning", proposedDays: [createProposedDay("2000-01-01", { name: "Alex" })] };
  assert.deepEqual(upcoming([game]), [game]);
  assert.equal(game.date, undefined);
});

test("demo games have future dates, valid groups, and independent state", () => {
  const first = initialState();
  const second = initialState();
  assert.equal(upcoming(first.games).length, 3);
  for (const game of first.games)
    assert.ok(first.groups.some((group) => group.id === game.groupId));
  first.groups[0].ratings.attack = 1;
  assert.equal(second.groups[0].ratings.attack, 4);
});

test("only going members and guests enter proposals, with current user counted once", () => {
  const { games, user } = initialState();
  const game = games[0];
  const going = goingPlayers(game, user);
  assert.equal(going.length, 13);
  assert.equal(going.filter((player) => player.id === "me").length, 1);
  assert.equal(going.filter((player) => player.guest).length, 1);
  assert.equal(goingPlayers({ ...game, rsvp: "MAYBE" }, user).length, 12);
  assert.equal(goingPlayers({ ...game, rsvp: "NOT_GOING" }, user).length, 12);
});

test("rosters from 3 through 100 players produce three complete team proposals", () => {
  for (let count = 3; count <= 100; count++) {
    const players = Array.from({ length: count }, (_, index) => ({
      id: String(index),
      name: "Player " + index,
    }));
    const proposals = makeProposals(players);
    assert.equal(proposals.length, 3);
    const signatures = new Set();
    for (const teams of proposals) {
      assert.equal(teams.length, 3);
      assert.ok(teams.every((team) => team.length > 0));
      assert.deepEqual(
        teams
          .flat()
          .map((player) => player.id)
          .sort(),
        players.map((player) => player.id).sort(),
      );
      assert.ok(
        Math.max(...teams.map((team) => team.length)) -
          Math.min(...teams.map((team) => team.length)) <=
          1,
      );
      const assignments = teams.map((team) =>
        team.map((player) => player.id).sort().join(","),
      );
      // With three players, only numbered team assignments can differ.
      signatures.add((count === 3 ? assignments : assignments.sort()).join("|"));
    }
    assert.equal(signatures.size, 3);
  }
});

test("guest ratings survive roster selection and every team proposal", () => {
  const { games, user } = initialState();
  assert.equal(games[0].guests[0].rating, 3);
  for (const rating of [1, 2, 3, 4, 5]) {
    const guest = { id: "rated-guest", name: "Guest Player", rating };
    const players = goingPlayers({ ...games[0], guests: [guest] }, user);
    assert.deepEqual(players.find((player) => player.id === guest.id), {
      ...guest,
      guest: true,
    });
    for (const teams of makeProposals(players)) {
      assert.equal(teams.flat().find((player) => player.id === guest.id).rating, rating);
    }
  }
});


test("all cards rank across games by availability, then date and ID without mutating state", () => {
  const day = (id, date, availability = {}) => ({ id, date, availability });
  const first = { id: "game-a", proposedDays: [day("later", "2026-09-20"), day("early", "2026-09-18")] };
  const second = { id: "game-b", proposedDays: [day("popular", "2026-09-25", { me: "AVAILABLE" })] };
  const games = [first, second];
  assert.deepEqual(rankedDays(games).map(({ day }) => day.id), ["popular", "early", "later"]);
  const changed = respondToDay(first, "later", "me", "AVAILABLE");
  assert.deepEqual(rankedDays([changed, second]).map(({ day }) => day.id), ["later", "popular", "early"]);
  assert.deepEqual(first.proposedDays.map((day) => day.id), ["later", "early"]);
  const tied = [day("b", "2026-09-18"), day("a", "2026-09-18")];
  assert.deepEqual(mostPopularDays(tied), ["a"]);
  assert.deepEqual(mostPopularDays(tied.reverse()), ["a"]);
  assert.deepEqual(rankedDays([]), []);
});

test("existing demo dates use the same cards and member counts, excluding guests", () => {
  const { games, user } = initialState();
  const days = gameDays(games[0]);
  assert.equal(days.length, 1);
  assert.equal(days[0].date, games[0].date);
  assert.equal(availableCount(days[0]), 12);
  assert.deepEqual(goingPlayers(dayGame(games[0], days[0].id), user), goingPlayers(games[0], user));
  const changed = respondToDay(games[0], days[0].id, "me", "UNAVAILABLE");
  assert.equal(availableCount(gameDays(changed)[0]), 11);
  assert.equal(dayGame(changed, days[0].id).guests.length, 1);
  assert.equal(gameDays(changed).length, 1);
});

test("each day has an independent lineup and guests; popularity does not select or lock a day", () => {
  const { games, user } = initialState();
  const original = games[0];
  const added = createProposedDay("2026-09-22", user);
  const game = { ...original, proposedDays: [...gameDays(original), added] };
  const changed = respondToDay(game, added.id, "me", "AVAILABLE");
  assert.equal(goingPlayers(dayGame(changed, added.id), user).length, 1);
  assert.equal(dayGame(changed, added.id).guests.length, 0);
  assert.equal(goingPlayers(dayGame(changed, original.id), user).length, 13);
  assert.equal(dayGame(changed, added.id).day.id, added.id);
  assert.equal(changed.date, original.date);
});

test("12 available members and 3 day guests form the same 15-person roster for every team proposal", () => {
  const { games, user } = initialState();
  const source = games[0];
  const guests = [1, 2, 3].map((rating) => ({ id: `day-guest-${rating}`, name: `Guest ${rating}`, rating }));
  const firstDay = { ...gameDays(source)[0], guests };
  const otherDay = createProposedDay("2026-09-25", user);
  const game = { ...source, proposedDays: [firstDay, otherDay] };
  const participants = goingPlayers(dayGame(game, firstDay.id), user);
  assert.equal(participants.length, 15);
  assert.equal(participants.filter((player) => !player.guest).length, 12);
  assert.equal(participants.filter((player) => player.guest).length, 3);
  assert.equal(new Set(participants.map((player) => player.id)).size, 15);
  for (const teams of makeProposals(participants)) {
    assert.deepEqual(teams.flat().sort((a, b) => a.id.localeCompare(b.id)),
      [...participants].sort((a, b) => a.id.localeCompare(b.id)));
  }
  assert.deepEqual(goingPlayers(dayGame(game, otherDay.id), user), []);
});

test("Games ranks and badges proposals independently within each group", () => {
  const proposal = (id, groupId, date, count) => ({
    id, groupId,
    proposedDays: [{ id, date, availability: Object.fromEntries(
      Array.from({ length: count }, (_, i) => [`member-${i}`, "AVAILABLE"]),
    ) }],
  });
  const games = [
    proposal("sep19", "thursday", "2026-09-19", 4),
    proposal("sep14", "weekend", "2026-09-14", 6),
    proposal("sep12", "thursday", "2026-09-12", 12),
  ];
  const snapshot = structuredClone(games);
  const cards = rankedDaysByGroup(games);
  assert.deepEqual(cards.map(({ day }) => day.id), ["sep12", "sep19", "sep14"]);
  assert.deepEqual(cards.filter(({ popular }) => popular).map(({ day }) => day.id), ["sep12", "sep14"]);
  assert.deepEqual(rankedDaysByGroup([...games].reverse()), cards);
  assert.deepEqual(games, snapshot);

  // A change in one group cannot displace the other group's winner.
  const changed = [proposal("sep19", "thursday", "2026-09-19", 13), ...games.slice(1)];
  assert.deepEqual(rankedDaysByGroup(changed).filter(({ popular }) => popular)
    .map(({ day }) => day.id), ["sep19", "sep14"]);
  const tied = [proposal("sep19", "thursday", "2026-09-19", 12), ...games.slice(1)];
  assert.deepEqual(rankedDaysByGroup(tied).filter(({ popular }) => popular)
    .map(({ day }) => day.id), ["sep12", "sep14"]);
  assert.deepEqual(rankedDaysByGroup([]), []);
});
