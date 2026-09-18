import { test } from "node:test";
import assert from "node:assert/strict";
import { changedTeamColor, colorsFromGroupDto, groupTeamColors } from "./teamColors.js";

test("group DTO colors map to frontend values with defaults for older data", () => {
  assert.deepEqual(colorsFromGroupDto({ team1Color: "BLUE", team2Color: "BLACK", team3Color: "WHITE" }), ["blue", "black", "white"]);
  assert.deepEqual(groupTeamColors({ teamColors: ["blue", "black", "white"] }), ["blue", "black", "white"]);
  assert.deepEqual(groupTeamColors(undefined), ["red", "black", "white"]);
  assert.deepEqual(colorsFromGroupDto({}), ["red", "black", "white"]);
});

test("a team cannot reuse another team's color or select an unknown color", () => {
  const colors = ["red", "black", "white"];
  assert.deepEqual(changedTeamColor(colors, 0, "blue"), ["blue", "black", "white"]);
  assert.equal(changedTeamColor(colors, 1, "red"), null);
  assert.equal(changedTeamColor(colors, 1, "purple"), null);
  assert.equal(changedTeamColor(colors, 3, "green"), null);
});
