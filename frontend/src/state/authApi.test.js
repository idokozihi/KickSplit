import { test } from "node:test";
import assert from "node:assert/strict";
import { loginUser, registerUser } from "./authApi.js";

const backendUser = { id: 7, name: "Alex", username: "alex", imageUrl: null, email: "alex@example.com" };

test("login and registration send credentials and preserve the backend id", async (t) => {
  const calls = [];
  t.mock.method(globalThis, "fetch", async (url, options) => {
    calls.push([url, options]);
    return { ok: true, json: async () => backendUser };
  });
  const user = await loginUser("alex@example.com", "secret123");
  await registerUser("Alex", "alex@example.com", "secret123");
  assert.deepEqual(user, { id: 7, name: "Alex", username: "alex", email: "alex@example.com", photo: "" });
  assert.deepEqual(calls.map(([url, options]) => [url, options.method, JSON.parse(options.body)]), [
    ["/api/auth/login", "POST", { email: "alex@example.com", password: "secret123" }],
    ["/api/auth/register", "POST", { name: "Alex", email: "alex@example.com", password: "secret123" }],
  ]);
  assert.equal(calls[0][1].headers["Content-Type"], "application/json");
});

test("auth failures provide useful messages", async (t) => {
  const mocked = t.mock.method(globalThis, "fetch", async () => ({ ok: false, json: async () => ({ message: "Invalid credentials" }) }));
  await assert.rejects(loginUser("a@example.com", "wrong"), /Invalid credentials/);
  mocked.mock.mockImplementation(async () => ({ ok: false, json: async () => { throw new Error(); } }));
  await assert.rejects(registerUser("A", "a@example.com", "password"), /Sign up failed/);
});
