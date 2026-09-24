import { test } from "node:test";
import assert from "node:assert/strict";
import { mergeUpdatedGroup } from "./groupState.js";

test("a saved group photo updates shared group state without dropping local details", () => {
  const members = [{ userId: 7 }];
  const ratings = { overall: 4 };
  const groups = [
    { id: "42", name: "Friday FC", image: "", members, ratings },
    { id: "99", name: "Sunday FC", image: "old" },
  ];

  const updated = mergeUpdatedGroup(groups, {
    id: "42",
    name: "Friday FC",
    image: "data:image/jpeg;base64,processed",
    members: [],
    ratings: {},
  });

  assert.equal(updated[0].image, "data:image/jpeg;base64,processed");
  assert.equal(updated[0].members, members);
  assert.equal(updated[0].ratings, ratings);
  assert.equal(updated[1], groups[1]);
});
