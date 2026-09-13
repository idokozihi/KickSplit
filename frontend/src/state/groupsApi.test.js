import { test } from "node:test";
import assert from "node:assert/strict";
import { loadGroups, saveGroup } from "./groupsApi.js";

test("create uses a real creator ID and server ID survives a fresh load", async (t) => {
  const calls = [];
  const dto = { id: 42, name: "Friday FC", imageUrl: null };
  t.mock.method(globalThis, "fetch", async (url, options) => {
    calls.push({ url, options });
    const result = url === "/api/users" ? [{ id: 7, email: "player@example.com" }]
      : options.method === "POST" ? dto : [dto];
    return { ok: true, json: async () => result };
  });
  const created = await saveGroup({ name: dto.name, image: "", ratings: { overall: 3, attack: 4, defense: 2 } }, { email: "player@example.com" });
  assert.equal(created.id, "42");
  assert.equal(calls[1].url, "/api/groups");
  assert.deepEqual(JSON.parse(calls[1].options.body), {
    name: "Friday FC", imageUrl: null, creatorUserId: 7,
    selfOverallRating: 3, selfAttackRating: 4, selfDefenseRating: 2,
  });
  assert.deepEqual(await loadGroups(), [created]);
});

test("missing demo profile is created before joining with the real token", async (t) => {
  const calls = [];
  t.mock.method(globalThis, "fetch", async (url, options) => {
    calls.push({ url, options });
    return { ok: true, json: async () => calls.length === 1 ? [] : calls.length === 2 ? { id: 9 } : { id: 42, name: "Friday FC" } };
  });
  await saveGroup({ inviteToken: "a/b", ratings: { overall: 3, attack: 3, defense: 3 } }, { name: "Player", email: "new@example.com", username: "player" });
  assert.equal(calls[1].url, "/api/users");
  assert.equal(calls[1].options.method, "POST");
  assert.equal(calls[2].url, "/api/groups/join/a%2Fb");
  assert.equal(JSON.parse(calls[2].options.body).userId, 9);
});

test("failed requests reject instead of returning a demo group", async (t) => {
  t.mock.method(globalThis, "fetch", async () => ({ ok: false, status: 500 }));
  await assert.rejects(loadGroups(), /Could not load group data \(500\)/);
  await assert.rejects(saveGroup({ ratings: {} }, {}), /Could not load/);
});
