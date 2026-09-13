import { test } from "node:test";
import assert from "node:assert/strict";
import { loadRegistrations, saveRegistration, registrationState } from "./registrationsApi.js";
import { resolveBackendUser } from "./groupsApi.js";
import { gameDays, dayGame, goingPlayers } from "./mock.js";

const rows = [
  { id: 1, gameId: 42, userId: 7, userName: "Alex", status: "AVAILABLE" },
  { id: 2, gameId: 42, userId: 8, userName: "Sam", status: "AVAILABLE" },
  { id: 3, gameId: 42, userId: 9, userName: "Jo", status: "UNAVAILABLE" },
];

test("GET and POST use registrations contract and reload the saved status", async (t) => {
  let saved = rows.map((row) => ({ ...row }));
  const signal = new AbortController().signal;
  t.mock.method(globalThis, "fetch", async (url, options) => {
    assert.equal(url, "/api/registrations/game/42");
    if (options.method === "POST") {
      assert.equal(options.headers["Content-Type"], "application/json");
      assert.deepEqual(JSON.parse(options.body), { userId: 7, status: "UNAVAILABLE" });
      saved[0] = { ...saved[0], status: "UNAVAILABLE" };
      return { ok: true, json: async () => saved[0] };
    }
    assert.equal(options.signal, signal);
    return { ok: true, json: async () => saved };
  });
  assert.equal(registrationState(await loadRegistrations("42", signal), "7").rsvp, "GOING");
  assert.equal((await saveRegistration("42", "7", "UNAVAILABLE")).status, "UNAVAILABLE");
  assert.equal(registrationState(await loadRegistrations("42", signal), "7").rsvp, "NOT_GOING");
});

test("registrations populate the single game day and named lineup without duplicating current user", () => {
  const game = {
    id: "42", backendBacked: true, date: "2026-09-18", guests: [],
    ...registrationState(rows, "7"),
  };
  assert.equal(game.proposedDays, undefined);
  assert.deepEqual(gameDays(game)[0].availability, { me: "AVAILABLE", 8: "AVAILABLE", 9: "UNAVAILABLE" });
  assert.deepEqual(goingPlayers(dayGame(game), { name: "Alex" }).map((player) => player.name), ["Alex", "Sam"]);
  assert.equal(game.participants.find((player) => player.id === "9").status, "NOT_GOING");
  assert.equal(registrationState([], "7").rsvp, null);
  assert.equal(gameDays({ ...game, proposedDays: [{ id: "wrong" }] })[0].id, "42");
});

test("registration errors reject without producing successful state", async (t) => {
  const mock = t.mock.method(globalThis, "fetch", async () => ({ ok: false, status: 500 }));
  await assert.rejects(loadRegistrations("42"), /Could not load availability/);
  await assert.rejects(saveRegistration("42", 7, "AVAILABLE"), /Could not save availability/);
  mock.mock.mockImplementation(async () => { throw new TypeError("Failed to fetch"); });
  await assert.rejects(loadRegistrations("42"), /Failed to fetch/);
  await assert.rejects(saveRegistration("42", 7, "AVAILABLE"), /Failed to fetch/);
});

test("concurrent profile lookups reuse the Groups mechanism and create only one backend user", async (t) => {
  const calls = [];
  t.mock.method(globalThis, "fetch", async (url, options) => {
    calls.push([url, options.method]);
    return { ok: true, json: async () => options.method === "POST" ? { id: 7 } : [] };
  });
  const profile = { name: "Alex", email: "alex@example.com" };
  const result = await Promise.all([resolveBackendUser(profile), resolveBackendUser(profile)]);
  assert.deepEqual(result, [{ id: 7 }, { id: 7 }]);
  assert.deepEqual(calls, [["/api/users", undefined], ["/api/users", "POST"]]);
});
