import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { setImmediate } from "node:timers";
import { registrationState } from "./registrationsApi.js";
import { gameDays } from "./mock.js";

// Exercise the page's effect without adding a DOM test dependency.
const page = readFileSync(new URL("../pages/Game.jsx", import.meta.url), "utf8");
const effect = page.slice(page.indexOf("  useEffect(() => {"), page.indexOf("  const backendGameId"));
function runEffect(overrides = {}) {
  let cleanup;
  const cached = [], errors = [], requests = [];
  runInNewContext(effect, {
    useEffect: (callback) => { cleanup = callback(); },
    source: undefined, gameId: "42", AbortController,
    cacheGame: (game) => cached.push(game),
    setLoadError: (error) => errors.push(error),
    loadGame: async (id) => { requests.push(id); return { id }; },
    ...overrides,
  });
  return { cleanup, cached, errors, requests };
}

test("missing game is fetched and cached; existing game skips the request", async () => {
  const missing = runEffect();
  assert.deepEqual(missing.cached, []);
  await new Promise(setImmediate);
  assert.deepEqual(missing.requests, ["42"]);
  assert.deepEqual(missing.cached, [{ id: "42" }]);
  assert.deepEqual(missing.errors, []);
  const existing = runEffect({ source: { id: "42" } });
  assert.deepEqual(existing.requests, []);
});

test("failure is reported only after rejection and cancelled loads are ignored", async () => {
  const failed = runEffect({ loadGame: async () => { throw new Error("Not found"); } });
  assert.deepEqual(failed.errors, []);
  await new Promise(setImmediate);
  assert.equal(failed.errors[0].id, "42");
  assert.equal(failed.errors[0].message, "Not found");
  const cancelled = runEffect();
  cancelled.cleanup();
  await new Promise(setImmediate);
  assert.deepEqual(cancelled.cached, []);
  assert.deepEqual(cancelled.errors, []);
});

test("page restores registrations after game loading without refetching on registration updates", async () => {
  const start = page.indexOf("  useEffect(() => {", page.indexOf("  const backendGameId"));
  const registrationEffect = page.slice(start, page.indexOf("  const registrationStatus", start));
  for (const status of ["AVAILABLE", "UNAVAILABLE"]) {
    let dependencies, cleanup, restored, result;
    const requests = [];
    const refreshRegistrations = async (id) => {
      requests.push(id);
      restored = registrationState([
        { userId: 7, userName: "Alex", status },
        { userId: 8, userName: "Sam", status: "AVAILABLE" },
      ], 7);
    };
    function render(backendGameId) {
      runInNewContext(registrationEffect, {
        backendGameId, registrationKey: `${backendGameId}:alex@example.com:0`,
        refreshRegistrations, AbortController,
        setRegistrationResult: (value) => { result = value; },
        useEffect: (callback, next) => {
          if (!dependencies || next.some((value, index) => value !== dependencies[index])) {
            cleanup?.();
            dependencies = next;
            cleanup = callback();
          }
        },
      });
    }
    render(null);
    assert.deepEqual(requests, []);
    render("42");
    await new Promise(setImmediate);
    assert.equal(result.error, undefined);
    const day = gameDays({ id: "42", date: "2026-09-18", guests: [], ...restored })[0];
    assert.equal(day.availability.me, status);
    assert.equal(restored.participants[0].name, "Sam");
    render("42"); // Shared game state changed when registrations were applied.
    assert.deepEqual(requests, ["42"]);
    cleanup();
  }
});
