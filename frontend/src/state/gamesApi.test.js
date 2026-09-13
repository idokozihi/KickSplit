import { test } from "node:test";
import assert from "node:assert/strict";
import { createGame, loadGame, loadGroupGames, mergeGames } from "./gamesApi.js";
import { gameDays, dayGame } from "./mock.js";

test("group games load through the existing mapping and merge without losing existing state", async (t) => {
  const signal = new AbortController().signal;
  t.mock.method(globalThis, "fetch", async (url, options) => {
    assert.equal(url, "/api/games/group/7");
    assert.equal(options.signal, signal);
    return { ok: true, json: async () => [{
      id: 42, groupId: 7, groupName: "Friday FC", name: "Football",
      date: "2026-09-18", time: null, targetPlayers: 15,
    }] };
  });
  const loaded = await loadGroupGames("7", signal);
  assert.equal(loaded[0].id, "42");
  assert.equal(loaded[0].groupId, "7");
  assert.equal(loaded[0].backendBacked, true);
  assert.equal(loaded[0].title, "Football");
  const existing = { ...loaded[0], rsvp: "GOING" };
  const created = { ...existing, id: "43" };
  const merged = mergeGames([existing, created], [...loaded, ...loaded]);
  assert.equal(merged.length, 2);
  assert.equal(merged.find((game) => game.id === "42"), existing);
  assert.deepEqual(mergeGames(merged, loaded), merged);
  assert.deepEqual(mergeGames([], loaded), loaded);
});

test("group game loading supports empty groups and rejects failed requests", async (t) => {
  const mock = t.mock.method(globalThis, "fetch", async () => ({ ok: true, json: async () => [] }));
  assert.deepEqual(await loadGroupGames("7"), []);
  mock.mock.mockImplementation(async () => ({ ok: false, status: 500 }));
  await assert.rejects(loadGroupGames("7"), /Could not load games for group 7/);
});

test("loading an individual game uses its ID and maps the backend response", async (t) => {
  const controller = new AbortController();
  t.mock.method(globalThis, "fetch", async (url, options) => {
    assert.equal(url, "/api/games/42");
    assert.equal(options.signal, controller.signal);
    return { ok: true, json: async () => ({
      id: 42, groupId: 7, groupName: "Friday FC", name: "Football",
      date: "2026-09-18", time: null, targetPlayers: 15,
    }) };
  });
  const game = await loadGame("42", controller.signal);
  assert.equal(game.id, "42");
  assert.equal(game.groupId, "7");
  assert.equal(game.groupName, "Friday FC");
  assert.equal(game.title, "Football");
  assert.equal(game.target, 15);
  assert.equal(game.time, null);
  assert.equal(dayGame(game).date, "2026-09-18");
});

test("loading rejects not-found, server and network failures", async (t) => {
  const fetchMock = t.mock.method(globalThis, "fetch", async () => ({ ok: false, status: 404 }));
  await assert.rejects(loadGame("42"), /Could not load game \(404\)/);
  fetchMock.mock.mockImplementation(async () => ({ ok: false, status: 500 }));
  await assert.rejects(loadGame("42"), /Could not load game \(500\)/);
  fetchMock.mock.mockImplementation(async () => { throw new TypeError("Failed to fetch"); });
  await assert.rejects(loadGame("42"), /Failed to fetch/);
});

test("creation sends the exact API contract and maps the response for existing views", async (t) => {
  t.mock.method(globalThis, "fetch", async (url, options) => {
    assert.equal(url, "/api/games");
    assert.equal(options.method, "POST");
    assert.equal(options.headers["Content-Type"], "application/json");
    assert.deepEqual(JSON.parse(options.body), {
      groupId: 7, name: "Football", date: "2026-09-18", time: null, targetPlayers: 15,
    });
    return { ok: true, json: async () => ({
      id: 42, groupId: 7, groupName: "Friday FC", name: "Saved football",
      date: "2026-09-19", time: null, targetPlayers: 12,
    }) };
  });
  const game = await createGame({ groupId: "7", title: "Football", date: "2026-09-18", target: 15 });
  assert.equal(game.id, "42");
  assert.equal(game.groupId, "7");
  assert.equal(game.title, "Saved football");
  assert.equal(game.target, 12);
  assert.equal(game.date, "2026-09-19");
  assert.deepEqual(gameDays(game)[0].availability, {});
  assert.equal(dayGame(game).date, "2026-09-19");
});

test("HTTP and network failures reject creation", async (t) => {
  const input = { groupId: "7", title: "Football", date: "2026-09-18", target: 15 };
  const fetchMock = t.mock.method(globalThis, "fetch", async () => ({ ok: false, status: 500 }));
  await assert.rejects(createGame(input), /Could not create game \(500\)/);
  fetchMock.mock.mockImplementation(async () => { throw new TypeError("Failed to fetch"); });
  await assert.rejects(createGame(input), /Failed to fetch/);
});
