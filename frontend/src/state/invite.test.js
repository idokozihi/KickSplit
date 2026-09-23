import { test } from "node:test";
import assert from "node:assert/strict";
import {
  destinationAfterAuth,
  destinationAfterProfileSetup,
  getPendingInvite,
  invitePath,
  inviteUrl,
  joinInvitedGroup,
  pendingInvite,
  storePendingInvite,
} from "./invite.js";

function memoryStorage() {
  const values = new Map();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: (key) => values.delete(key),
  };
}

test("invite URL uses the current origin and safely encodes the token", () => {
  assert.equal(invitePath("a/b c"), "/join/a%2Fb%20c");
  assert.equal(inviteUrl("a/b c", "https://example.org"), "https://example.org/join/a%2Fb%20c");
});

test("logged-out invite path is stored for the authentication flow", () => {
  const storage = memoryStorage();
  assert.equal(storePendingInvite("/join/token123", storage), "/join/token123");
  assert.equal(getPendingInvite(storage), "/join/token123");
});

test("signup preserves the stored invite through profile setup", () => {
  const storage = memoryStorage();
  storePendingInvite("/join/token123", storage);

  assert.equal(destinationAfterAuth(null, true, storage), "/profile-setup");
  assert.equal(destinationAfterProfileSetup(null, storage), "/join/token123");
});

test("login returns directly to a stored invite", () => {
  const storage = memoryStorage();
  storePendingInvite("/join/token123", storage);
  assert.equal(destinationAfterAuth(null, false, storage), "/join/token123");
});

test("normal login without an invite goes home", () => {
  assert.equal(destinationAfterAuth(null, false, memoryStorage()), "/home");
});

test("malformed and non-invite paths are not stored", () => {
  for (const pathname of [null, "", "/home", "/join", "/join/", "/join/token/extra", "/join/token?next=/home", "https://example.org/join/token"]) {
    const storage = memoryStorage();
    assert.equal(pendingInvite(pathname), null);
    assert.equal(storePendingInvite(pathname, storage), null);
    assert.equal(getPendingInvite(storage), null);
  }
});

test("successful join clears the pending invite and navigates to the joined group", async () => {
  const calls = [];
  const storage = memoryStorage();
  storePendingInvite("/join/token123", storage);
  const ratings = { overall: 4, attack: 2, defense: 5 };
  const group = await joinInvitedGroup(async (input) => {
    calls.push(["join", input]);
    return { id: "42" };
  }, (path, options) => calls.push(["navigate", path, options]), "token123", ratings, storage);
  assert.deepEqual(group, { id: "42" });
  assert.equal(getPendingInvite(storage), null);
  assert.deepEqual(calls, [
    ["join", { inviteToken: "token123", ratings }],
    ["navigate", "/groups/42", { replace: true }],
  ]);
});

test("failed join leaves navigation untouched", async () => {
  const storage = memoryStorage();
  storePendingInvite("/join/token", storage);
  let navigated = false;
  await assert.rejects(joinInvitedGroup(async () => { throw new Error("Already a member"); }, () => { navigated = true; }, "token", {}, storage), /Already a member/);
  assert.equal(navigated, false);
  assert.equal(getPendingInvite(storage), "/join/token");
});
