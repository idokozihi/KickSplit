import { test } from "node:test";
import assert from "node:assert/strict";
import { loadVotes, saveVote, mergeVote, proposalVoteState } from "./votesApi.js";
import { resolveBackendUser } from "./groupsApi.js";

test("loads persisted votes, resolves the shared user, and moves a vote using real proposal IDs", async (t) => {
  const signal = new AbortController().signal;
  let stored = [{ id: 1, gameId: 42, userId: 7, proposalId: 901 }, { id: 2, gameId: 42, userId: 8, proposalId: 901 }];
  t.mock.method(globalThis, "fetch", async (url, options) => {
    if (url === "/api/users") return { ok: true, json: async () => [{ id: 7, email: "voter@example.com" }] };
    assert.equal(url, "/api/votes/game/42");
    assert.equal(options.signal, signal);
    if (options.method === "POST") {
      assert.equal(options.headers["Content-Type"], "application/json");
      assert.deepEqual(JSON.parse(options.body), { userId: 7, proposalId: 905 });
      const saved = { id: 1, gameId: 42, userId: 7, proposalId: 905 };
      stored = mergeVote(stored, saved);
      return { ok: true, json: async () => saved };
    }
    return { ok: true, json: async () => stored };
  });
  const user = await resolveBackendUser({ email: "voter@example.com" });
  const initial = await loadVotes("42", signal);
  assert.deepEqual(proposalVoteState(initial, 901, user.id), { count: 2, selected: true });
  const saved = await saveVote("42", String(user.id), "905", signal);
  const updated = mergeVote(initial, saved);
  assert.deepEqual(proposalVoteState(updated, 901, user.id), { count: 1, selected: false });
  assert.deepEqual(proposalVoteState(updated, 905, user.id), { count: 1, selected: true });
  assert.deepEqual(await loadVotes("42", signal), updated);
  assert.deepEqual(mergeVote(updated, saved), updated);
});

test("first vote, empty counts, and mixed ID representations", () => {
  assert.deepEqual(proposalVoteState([], 900, 7), { count: 0, selected: false });
  const votes = mergeVote([], { id: 1, gameId: 42, userId: 7, proposalId: 900 });
  assert.deepEqual(proposalVoteState(votes, "900", "7"), { count: 1, selected: true });
});

test("load and save failures reject without changing votes", async (t) => {
  t.mock.method(globalThis, "fetch", async () => ({ ok: false, status: 503 }));
  await assert.rejects(loadVotes(42), /Could not load votes \(503\)/);
  await assert.rejects(saveVote(42, 7, 901), /Could not save vote \(503\)/);
});

test("encodes game IDs and forwards cancellation", async (t) => {
  const controller = new AbortController();
  controller.abort();
  t.mock.method(globalThis, "fetch", async (url, options) => {
    assert.equal(url, "/api/votes/game/a%2Fb");
    options.signal.throwIfAborted();
  });
  await assert.rejects(loadVotes("a/b", controller.signal), { name: "AbortError" });
});
