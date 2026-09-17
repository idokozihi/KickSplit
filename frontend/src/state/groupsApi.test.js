import { test } from "node:test";
import assert from "node:assert/strict";
import { loadGroup, loadGroupMembers, loadGroups, loadInviteToken, saveGroup, saveRatingSource } from "./groupsApi.js";

test("group detail and members load from their endpoints", async (t) => {
  const calls = [];
  const signal = new AbortController().signal;
  t.mock.method(globalThis, "fetch", async (url, options) => {
    calls.push({ url, signal: options.signal });
    return { ok: true, json: async () => url.endsWith("/members")
      ? [{ userId: 7, name: "Alex", appRating: 3.5333333333, ratedGames: 1, totalWins: 5, winRate: 1 }]
      : { id: 42, name: "Friday FC", ratingSource: "SELF_RATING" } };
  });
  const group = await loadGroup(42, signal);
  const members = await loadGroupMembers(42, signal);
  assert.equal(group.ratingSource, "SELF_RATING");
  assert.equal(members[0].appRating, 3.5333333333);
  assert.deepEqual(calls, [
    { url: "/api/groups/42", signal },
    { url: "/api/groups/42/members", signal },
  ]);
});

test("admin rating source change uses the logged-in user id and saved response", async (t) => {
  t.mock.method(globalThis, "fetch", async (url, options) => {
    assert.equal(url, "/api/groups/42/rating-source");
    assert.equal(options.method, "PATCH");
    assert.deepEqual(JSON.parse(options.body), { userId: 7, ratingSource: "APP_RATING" });
    return { ok: true, json: async () => ({ id: 42, name: "Friday FC", ratingSource: "APP_RATING" }) };
  });
  assert.equal((await saveRatingSource(42, 7, "APP_RATING")).ratingSource, "APP_RATING");
});

test("rating source authorization failures explain the admin requirement", async (t) => {
  t.mock.method(globalThis, "fetch", async () => ({ ok: false, status: 403 }));
  await assert.rejects(saveRatingSource(42, 7, "SELF_RATING"), /Only group admins/);
});

test("admins request an invite token for their group and backend user id", async (t) => {
  t.mock.method(globalThis, "fetch", async (url) => {
    assert.equal(url, "/api/groups/42/invite-token/7");
    return { ok: true, json: async () => ({ inviteToken: "token/with space" }) };
  });
  assert.equal(await loadInviteToken(42, 7), "token/with space");
});

test("invite token access failures return useful errors", async (t) => {
  const mocked = t.mock.method(globalThis, "fetch", async () => ({ ok: false, status: 403 }));
  await assert.rejects(loadInviteToken(42, 7), /Only group admins/);
  mocked.mock.mockImplementation(async () => { throw new TypeError("Failed to fetch"); });
  await assert.rejects(loadInviteToken(42, 7), /Could not connect/);
  mocked.mock.mockImplementation(async () => ({ ok: false, status: 500, json: async () => ({ message: "Only group admins can access the invite code" }) }));
  await assert.rejects(loadInviteToken(42, 7), /Only group admins/);
});

test("create uses a real creator ID and server ID survives a fresh load", async (t) => {
  const calls = [];
  const dto = { id: 42, name: "Friday FC", imageUrl: null };
  t.mock.method(globalThis, "fetch", async (url, options) => {
    calls.push({ url, options });
    const result = options.method === "POST" ? dto : [dto];
    return { ok: true, json: async () => result };
  });
  const created = await saveGroup({ name: dto.name, image: "", ratings: { overall: 3, attack: 4, defense: 2 } }, { id: 7, email: "player@example.com" });
  assert.equal(created.id, "42");
  assert.equal(calls[0].url, "/api/groups");
  assert.deepEqual(JSON.parse(calls[0].options.body), {
    name: "Friday FC", imageUrl: null, creatorUserId: 7,
    selfOverallRating: 3, selfAttackRating: 4, selfDefenseRating: 2,
  });
  assert.deepEqual(await loadGroups(7), [created]);
  assert.equal(calls[1].url, "/api/groups/user/7");
});

test("joining uses the authenticated user id and real token", async (t) => {
  const calls = [];
  t.mock.method(globalThis, "fetch", async (url, options) => {
    calls.push({ url, options });
    return { ok: true, json: async () => ({ id: 42, name: "Friday FC" }) };
  });
  await saveGroup({ inviteToken: "a/b", ratings: { overall: 4, attack: 2, defense: 5 } }, { id: 9, name: "Player", email: "new@example.com" });
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, "/api/groups/join/a%2Fb");
  assert.deepEqual(JSON.parse(calls[0].options.body), {
    userId: 9, selfOverallRating: 4, selfAttackRating: 2, selfDefenseRating: 5,
  });
});

test("join errors identify invalid links and existing membership", async (t) => {
  const mocked = t.mock.method(globalThis, "fetch", async () => ({ ok: false, status: 404 }));
  const input = { inviteToken: "expired", ratings: { overall: 3, attack: 3, defense: 3 } };
  await assert.rejects(saveGroup(input, { id: 9 }), /invalid or has expired/);
  mocked.mock.mockImplementation(async () => ({ ok: false, status: 409 }));
  await assert.rejects(saveGroup(input, { id: 9 }), /already a member/);
  mocked.mock.mockImplementation(async () => { throw new TypeError("Failed to fetch"); });
  await assert.rejects(saveGroup(input, { id: 9 }), /Could not connect/);
  mocked.mock.mockImplementation(async () => ({ ok: false, status: 500, json: async () => ({ message: "User is already a member of this group" }) }));
  await assert.rejects(saveGroup(input, { id: 9 }), /already a member/);
});

test("failed requests reject instead of returning a demo group", async (t) => {
  t.mock.method(globalThis, "fetch", async () => ({ ok: false, status: 500 }));
  await assert.rejects(loadGroups(7), /Could not load group data \(500\)/);
  await assert.rejects(saveGroup({ ratings: {} }, { id: 7 }), /Could not save/);
});
