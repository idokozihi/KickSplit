import { test } from "node:test";
import assert from "node:assert/strict";
import { chooseTeamColor, groupTeamColors } from "./teamColors.js";

test("team colors default per group and stay separate in frontend state", () => {
  const initial = {};
  assert.deepEqual(groupTeamColors(initial, "one"), ["red", "black", "white"]);
  const changed = chooseTeamColor(initial, "one", 0, "blue");
  assert.deepEqual(groupTeamColors(changed, "one"), ["blue", "black", "white"]);
  assert.deepEqual(groupTeamColors(changed, "two"), ["red", "black", "white"]);
  assert.deepEqual(initial, {});
});

test("a team cannot reuse another team's color or select an unknown color", () => {
  const state = chooseTeamColor({}, "one", 0, "blue");
  assert.equal(chooseTeamColor(state, "one", 1, "blue"), state);
  assert.equal(chooseTeamColor(state, "one", 1, "purple"), state);
  assert.equal(chooseTeamColor(state, "one", 3, "green"), state);
});
