import { test } from "node:test";
import assert from "node:assert/strict";
import {
  gameResultAccess,
  permissionsFromGroup,
  teamGenerationAccess,
} from "./groupPermissions.js";

test("group permissions use player-friendly compatibility defaults", () => {
  assert.deepEqual(permissionsFromGroup({}), {
    teamGenerationPermission: "PLAYERS",
    teamRegenerationMode: "PLAYER_VOTE",
    resultEntryPermission: "PLAYERS",
  });
  assert.equal(permissionsFromGroup({ teamGenerationPermission: "ADMINS_ONLY" }).teamGenerationPermission, "ADMINS_ONLY");
});

test("team generation allows admins or available registered players", () => {
  assert.equal(teamGenerationAccess({ isAdmin: true, permission: "ADMINS_ONLY" }).allowed, true);
  assert.equal(teamGenerationAccess({ isMember: true, registrationStatus: "AVAILABLE", permission: "PLAYERS" }).allowed, true);
  assert.match(teamGenerationAccess({ isMember: true, registrationStatus: "UNAVAILABLE", permission: "PLAYERS" }).message, /available players/);
  assert.match(teamGenerationAccess({ isMember: true, registrationStatus: "AVAILABLE", permission: "ADMINS_ONLY" }).message, /admins/);
});

test("result editing follows admin, availability, and original-entrant rules", () => {
  const first = { permission: "PLAYERS", isMember: true, registrationStatus: "AVAILABLE", userId: 7 };
  assert.equal(gameResultAccess(first).allowed, true);
  assert.equal(gameResultAccess({ ...first, registrationStatus: "UNAVAILABLE" }).allowed, false);
  assert.equal(gameResultAccess({ ...first, result: { enteredByUserId: 7 }, registrationStatus: "UNAVAILABLE" }).allowed, true);
  assert.equal(gameResultAccess({ ...first, result: { enteredByUserId: 8 } }).allowed, false);
  assert.equal(gameResultAccess({ ...first, isAdmin: true, permission: "ADMINS_ONLY" }).allowed, true);
  assert.equal(gameResultAccess({ ...first, result: { enteredByUserId: 7 }, permission: "ADMINS_ONLY" }).allowed, false);
});
