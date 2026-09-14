import { test } from "node:test";
import assert from "node:assert/strict";
import { apiUrl } from "./apiBase.js";

test("missing or empty API base keeps local proxy URLs", () => {
  for (const base of [undefined, "", "   "]) {
    assert.equal(apiUrl("/groups", base), "/api/groups");
  }
});

test("configured backend origin prefixes every backend resource", () => {
  for (const path of ["/groups", "/users", "/games", "/registrations/game/42", "/guests/game/42", "/team-proposals/game/42"]) {
    assert.equal(apiUrl(path, "https://kicksplit.onrender.com"), `https://kicksplit.onrender.com/api${path}`);
  }
});

test("normalizes trailing slashes and whitespace without changing encoded paths", () => {
  assert.equal(apiUrl("/groups/join/a%2Fb", " https://example.com/// "), "https://example.com/api/groups/join/a%2Fb");
});
