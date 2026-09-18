import { apiUrl } from "./apiBase.js";

async function request(path, options) {
  let response;
  try {
    response = await fetch(apiUrl(path), options);
  } catch (error) {
    if (error?.name === "AbortError") throw error;
    throw new Error("Could not connect to KickSplit. Please try again.", { cause: error });
  }
  if (!response.ok) {
    if (response.status === 403) throw new Error("Only group members can use this chat.");
    throw new Error(`Could not ${options?.method === "POST" ? "send" : "load"} messages (${response.status}). Please try again.`);
  }
  return response.json();
}

export function loadGroupMessages(groupId, userId, signal) {
  return request(`/groups/${encodeURIComponent(groupId)}/messages?userId=${encodeURIComponent(userId)}`, { signal });
}

export function sendGroupMessage(groupId, userId, content) {
  return request(`/groups/${encodeURIComponent(groupId)}/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, content }),
  });
}

export function mergeMessages(previous, incoming) {
  const byId = new Map(previous.map((message) => [String(message.id), message]));
  for (const message of incoming) byId.set(String(message.id), message);
  return [...byId.values()].sort((a, b) =>
    new Date(a.createdAt) - new Date(b.createdAt) || Number(a.id) - Number(b.id));
}

export function messageContent(value) {
  return value.trim();
}

export function startMessagePolling(refresh, intervalMs = 5000) {
  const controller = new AbortController();
  queueMicrotask(() => { if (!controller.signal.aborted) refresh(controller.signal); });
  const timer = setInterval(() => refresh(controller.signal), intervalMs);
  return () => {
    controller.abort();
    clearInterval(timer);
  };
}
