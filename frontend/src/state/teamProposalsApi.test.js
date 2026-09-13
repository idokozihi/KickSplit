import { test } from "node:test";
import assert from "node:assert/strict";
import { loadTeamProposals, matchProposalPlayers } from "./teamProposalsApi.js";

test("loads one to three real proposals with balance scores", async (t) => {
  const signal = new AbortController().signal;
  let count = 1;
  t.mock.method(globalThis, "fetch", async (url, options) => {
    assert.equal(url, "/api/team-proposals/game/42");
    assert.equal(options.signal, signal);
    return { ok: true, json: async () => Array.from({ length: count }, () => ({ teams: [[{ name: "Alex", rating: 3 }], [], []], balanceScore: 1.5 })) };
  });
  for (count = 1; count <= 3; count++) {
    const proposals = await loadTeamProposals("42", signal);
    assert.equal(proposals.length, count);
    assert.equal(proposals[0].balanceScore, 1.5);
  }
});

test("labels unique lineup matches without replacing backend ratings or order", () => {
  const proposals = [{ teams: [[{ name: "Alex", rating: 5 }], [{ name: "Sam", rating: 4 }], [{ name: "Jo", rating: 2 }]], balanceScore: 0.3 }];
  const result = matchProposalPlayers(proposals, [{ id: "me", name: "Alex" }, { id: "7", name: "Sam", guest: true }, { id: "8", name: "Jo" }, { id: "9", name: "Jo", guest: true }]);
  assert.equal(result[0].teams[0][0].isCurrentUser, true);
  assert.equal(result[0].teams[1][0].guest, true);
  assert.equal(result[0].teams[2][0].guest, false);
  assert.equal(result[0].teams[0][0].rating, 5);
  assert.equal(proposals[0].teams[0][0].id, undefined);
});

test("failed or empty generation rejects with a useful message", async (t) => {
  const mock = t.mock.method(globalThis, "fetch", async () => ({ ok: false, status: 500 }));
  await assert.rejects(loadTeamProposals("42"), /Could not generate teams/);
  mock.mock.mockImplementation(async () => ({ ok: true, json: async () => [] }));
  await assert.rejects(loadTeamProposals("42"), /No valid team proposals/);
});
