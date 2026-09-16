import { apiUrl } from "./apiBase.js";

export async function loadGameResult(gameId, signal) {
  const response = await fetch(apiUrl(`/game-results/game/${encodeURIComponent(gameId)}`), { signal });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`Could not load result (${response.status}). Please try again.`);
  return response.json();
}

export async function saveGameResult(gameId, result) {
  const response = await fetch(apiUrl(`/game-results/game/${encodeURIComponent(gameId)}`), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(result),
  });
  if (!response.ok) {
    let message;
    try {
      const body = await response.json();
      message = body.message || body.error;
    } catch { /* Use a status-based message when the response has no JSON body. */ }
    throw new Error(message || `Could not save result (${response.status}). Please try again.`);
  }
  return response.json();
}
