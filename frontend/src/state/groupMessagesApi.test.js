import { test } from "node:test";
import assert from "node:assert/strict";
import { loadGroupMessages, mergeMessages, messageContent, sendGroupMessage, startMessagePolling } from "./groupMessagesApi.js";

test("loading and sending messages follow the group chat API contract", async (t) => {
  const message = { id: 3, groupId: 4, senderId: 7, content: "Hello", createdAt: "2026-09-18T12:00:00" };
  const signal = new AbortController().signal;
  const fetchMock = t.mock.method(globalThis, "fetch", async (url, options) => {
    if (options.method === "POST") {
      assert.equal(url, "/api/groups/4/messages");
      assert.equal(options.headers["Content-Type"], "application/json");
      assert.deepEqual(JSON.parse(options.body), { userId: 7, content: "Hello" });
      return { ok: true, json: async () => message };
    }
    assert.equal(url, "/api/groups/4/messages?userId=7");
    assert.equal(options.signal, signal);
    return { ok: true, json: async () => [message] };
  });
  assert.deepEqual(await loadGroupMessages("4", 7, signal), [message]);
  assert.deepEqual(await sendGroupMessage("4", 7, "Hello"), message);
  assert.equal(fetchMock.mock.callCount(), 2);
});

test("message refresh merges by id and sorts by creation time", () => {
  const first = { id: 1, createdAt: "2026-09-18T12:00:00" };
  const second = { id: 2, createdAt: "2026-09-18T12:01:00" };
  assert.deepEqual(mergeMessages([second], [first, second, second]), [first, second]);
});

test("member errors are explained", async (t) => {
  t.mock.method(globalThis, "fetch", async () => ({ ok: false, status: 403 }));
  await assert.rejects(loadGroupMessages(4, 7), /Only group members/);
});

test("whitespace messages have no sendable content", () => {
  assert.equal(messageContent(" \n  "), "");
  assert.equal(messageContent("  Hello  "), "Hello");
});

test("polling starts immediately, refreshes, and stops on cleanup", async (t) => {
  t.mock.timers.enable({ apis: ["setInterval"] });
  const signals = [];
  const stop = startMessagePolling((signal) => signals.push(signal));
  await Promise.resolve();
  assert.equal(signals.length, 1);
  t.mock.timers.tick(5000);
  assert.equal(signals.length, 2);
  stop();
  assert.equal(signals[0].aborted, true);
  t.mock.timers.tick(5000);
  assert.equal(signals.length, 2);
});
