import test from "node:test";
import assert from "node:assert/strict";
import { initialState, goingPlayers, makeProposals, upcoming } from "./mock.js";

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
