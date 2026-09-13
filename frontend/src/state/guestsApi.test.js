import { test } from "node:test";
import assert from "node:assert/strict";
import { loadGuests, saveGuest, mergeGuests } from "./guestsApi.js";
import { dayGame, goingPlayers } from "./mock.js";

test("guest creation and reload use the API contract and restore the lineup", async (t) => {
  const dto = { id: 8, gameId: 42, name: "Sam", rating: 4, addedByUserId: 7, addedByUserName: "Alex" };
  const signal = new AbortController().signal;
  t.mock.method(globalThis, "fetch", async (url, options) => {
    assert.equal(url, "/api/guests/game/42");
    if (options.method === "POST") {
      assert.equal(options.headers["Content-Type"], "application/json");
      assert.deepEqual(JSON.parse(options.body), { name: "Sam", rating: 4, addedByUserId: 7 });
      return { ok: true, json: async () => dto };
    }
    assert.equal(options.signal, signal);
    return { ok: true, json: async () => [dto] };
  });
  const saved = await saveGuest("42", { name: "Sam", rating: 4 }, "7");
  const loaded = await loadGuests("42", signal);
  assert.deepEqual(loaded, [saved]);
  assert.equal(saved.id, "8");
  assert.equal(saved.gameId, "42");
  assert.equal(saved.addedByUserId, "7");
  const guests = mergeGuests([saved], [...loaded, ...loaded]);
  assert.equal(guests.length, 1);
  const game = { id: "42", backendBacked: true, date: "2026-09-18", rsvp: "GOING", participants: [], guests };
  const lineup = goingPlayers(dayGame(game), { name: "Alex" });
  assert.deepEqual(lineup.map((player) => player.name), ["Alex", "Sam"]);
  assert.equal(lineup[1].rating, 4);
  assert.equal(lineup[1].guest, true);
  assert.equal(game.proposedDays, undefined);
});

test("guest failures reject and empty lists remain empty", async (t) => {
  const mock = t.mock.method(globalThis, "fetch", async () => ({ ok: true, json: async () => [] }));
  assert.deepEqual(await loadGuests("42"), []);
  mock.mock.mockImplementation(async () => ({ ok: false, status: 500 }));
  await assert.rejects(loadGuests("42"), /Could not load guests/);
  await assert.rejects(saveGuest("42", { name: "Sam", rating: 4 }, 7), /Could not add guest/);
  mock.mock.mockImplementation(async () => { throw new TypeError("Failed to fetch"); });
  await assert.rejects(loadGuests("42"), /Failed to fetch/);
});
