import { test } from "node:test";
import assert from "node:assert/strict";
import { loadTeamProposals, loadRegenerationVote, matchProposalPlayers, requestNewTeams } from "./teamProposalsApi.js";

test("loads one to three real proposals with balance scores", async (t) => {
  const signal = new AbortController().signal;
  let count = 1;
  t.mock.method(globalThis, "fetch", async (url, options) => {
    assert.equal(url, "/api/team-proposals/game/42");
    assert.equal(options.signal, signal);
    return { ok: true, json: async () => Array.from({ length: count }, (_, index) => ({ id: 901 + index, proposalNumber: index + 1, teams: [[{ name: "Alex", rating: 3 }], [], []], balanceScore: 1.5 })) };
  });
  for (count = 1; count <= 3; count++) {
    const proposals = await loadTeamProposals("42", signal);
    assert.equal(proposals.length, count);
    assert.equal(proposals[0].balanceScore, 1.5);
    assert.equal(matchProposalPlayers(proposals, [])[0].id, 901);
    assert.equal(matchProposalPlayers(proposals, [])[0].proposalNumber, 1);
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

test("loads regeneration status for the current user", async (t) => {
  const signal = new AbortController().signal;
  const status = { voteCount: 2, requiredVotes: 6, currentUserVoted: false, eligible: true };
  t.mock.method(globalThis, "fetch", async (url, options) => {
    assert.equal(url, "/api/team-proposals/game/42/regeneration-vote?userId=7");
    assert.equal(options.signal, signal);
    return { ok: true, json: async () => status };
  });
  assert.deepEqual(await loadRegenerationVote("42", 7, signal), status);
});

test("requests new teams with the current user and returns generated proposals", async (t) => {
  const signal = new AbortController().signal;
  const status = { regenerated: true, voteCount: 0, proposals: [{ id: 99 }] };
  t.mock.method(globalThis, "fetch", async (url, options) => {
    assert.equal(url, "/api/team-proposals/game/42/regeneration-vote");
    assert.equal(options.method, "POST");
    assert.deepEqual(JSON.parse(options.body), { userId: 7 });
    assert.equal(options.headers["Content-Type"], "application/json");
    assert.equal(options.signal, signal);
    return { ok: true, json: async () => status };
  });
  assert.deepEqual(await requestNewTeams("42", 7, signal), status);
});

test("regeneration errors are actionable", async (t) => {
  t.mock.method(globalThis, "fetch", async () => ({ ok: false, status: 409 }));
  await assert.rejects(loadRegenerationVote("42", 7), /Could not load new teams votes \(409\)/);
  await assert.rejects(requestNewTeams("42", 7), /Could not request new teams \(409\)/);
});
