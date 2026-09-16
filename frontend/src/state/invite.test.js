import { test } from "node:test";
import assert from "node:assert/strict";
import { destinationAfterAuth, invitePath, inviteUrl, joinInvitedGroup, pendingInvite } from "./invite.js";

test("invite URL uses the current origin and safely encodes the token", () => {
  assert.equal(invitePath("a/b c"), "/join/a%2Fb%20c");
  assert.equal(inviteUrl("a/b c", "https://example.org"), "https://example.org/join/a%2Fb%20c");
});

test("logged-out invite path survives login and signup setup", () => {
  const from = pendingInvite("/join/token123");
  assert.equal(from, "/join/token123");
  assert.equal(destinationAfterAuth(from), from);
  assert.equal(destinationAfterAuth(from, true), "/profile-setup");
  assert.equal(pendingInvite("/home"), null);
  assert.equal(destinationAfterAuth("/home"), "/home");
});

test("successful join sends invite and ratings, then navigates to the joined group", async () => {
  const calls = [];
  const ratings = { overall: 4, attack: 2, defense: 5 };
  const group = await joinInvitedGroup(async (input) => {
    calls.push(["join", input]);
    return { id: "42" };
  }, (path, options) => calls.push(["navigate", path, options]), "token123", ratings);
  assert.deepEqual(group, { id: "42" });
  assert.deepEqual(calls, [
    ["join", { inviteToken: "token123", ratings }],
    ["navigate", "/groups/42", { replace: true }],
  ]);
});

test("failed join leaves navigation untouched", async () => {
  let navigated = false;
  await assert.rejects(joinInvitedGroup(async () => { throw new Error("Already a member"); }, () => { navigated = true; }, "token", {}), /Already a member/);
  assert.equal(navigated, false);
});
