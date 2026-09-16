import { test } from "node:test";
import assert from "node:assert/strict";
import { saveUserProfile } from "./usersApi.js";

const user = { id: 7, name: "Alex", username: "alex", email: "alex@example.com", photo: "old.png" };

test("profile save uses the authenticated id and maps photo to and from imageUrl", async (t) => {
  t.mock.method(globalThis, "fetch", async (url, options) => {
    assert.equal(url, "/api/users/7");
    assert.equal(options.method, "PUT");
    assert.equal(options.headers["Content-Type"], "application/json");
    assert.deepEqual(JSON.parse(options.body), {
      name: "Alex Morgan", username: "alexm", email: "alex@example.com", imageUrl: "new.png",
    });
    return { ok: true, json: async () => ({ id: 7, name: "Alex Morgan", username: "alexm", email: "alex@example.com", imageUrl: "stored.png" }) };
  });
  assert.deepEqual(await saveUserProfile(user, { name: "Alex Morgan", username: "alexm", photo: "new.png" }), {
    id: 7, name: "Alex Morgan", username: "alexm", email: "alex@example.com", photo: "stored.png",
  });
});

test("empty photo clears imageUrl and failed saves do not return a profile", async (t) => {
  const mocked = t.mock.method(globalThis, "fetch", async (url, options) => {
    assert.equal(JSON.parse(options.body).imageUrl, null);
    return { ok: false, json: async () => ({ message: "Username already exists" }) };
  });
  await assert.rejects(saveUserProfile(user, { photo: "" }), /Username already exists/);
  mocked.mock.mockImplementation(async () => { throw new TypeError("Failed to fetch"); });
  await assert.rejects(saveUserProfile(user, {}), /Could not connect/);
  assert.equal(mocked.mock.callCount(), 2);
  await assert.rejects(saveUserProfile(null, {}), /Please log in/);
});
