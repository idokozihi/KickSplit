import { apiUrl } from "./apiBase.js";

export async function loadRegistrations(gameId, signal) {
  const response = await fetch(apiUrl(`/registrations/game/${encodeURIComponent(gameId)}`), { signal });
  if (!response.ok) throw new Error(`Could not load availability (${response.status}). Please try again.`);
  return response.json();
}

export async function saveRegistration(gameId, userId, status) {
  const response = await fetch(apiUrl(`/registrations/game/${encodeURIComponent(gameId)}`), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId: Number(userId), status }),
  });
  if (!response.ok) throw new Error(`Could not save availability (${response.status}). Please try again.`);
  return response.json();
}

export function registrationState(registrations, userId) {
  const mine = registrations.find((item) => String(item.userId) === String(userId));
  const status = (value) => value === "AVAILABLE" ? "GOING" : "NOT_GOING";
  return {
    registrations,
    rsvp: mine ? status(mine.status) : null,
    participants: registrations
      .filter((item) => String(item.userId) !== String(userId))
      .map((item) => ({ id: String(item.userId), name: item.userName, status: status(item.status) })),
  };
}
