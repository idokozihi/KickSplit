import { apiUrl } from "./apiBase.js";

export async function createGame({ groupId, userId, title, date, target }) {
  const body = createGameRequest({ groupId, userId, title, date, target });
  let response;
  try {
    response = await fetch(apiUrl("/games"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    throw new Error("Could not connect to KickSplit. Please try again.");
  }
  if (!response.ok) {
    const message = await responseMessage(response);
    throw new Error(message || `Could not create game (${response.status}). Please try again.`);
  }
  try {
    return mapGame(await response.json());
  } catch {
    throw new Error("The server returned an invalid game. Please try again.");
  }
}

export function createGameRequest({ groupId, userId, title, date, target }) {
  const numericGroupId = Number(groupId);
  const numericUserId = Number(userId);
  const numericTarget = Number(target);
  if (!Number.isInteger(numericGroupId) || numericGroupId < 1) throw new Error("Choose a valid group.");
  if (!Number.isInteger(numericUserId) || numericUserId < 1) throw new Error("Please log in to create a game.");
  if (typeof title !== "string" || !title.trim()) throw new Error("Enter a game name.");
  if (typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error("Choose a valid game date.");
  if (!Number.isInteger(numericTarget) || numericTarget < 1) throw new Error("Enter a positive whole number for the player target.");
  return {
    groupId: numericGroupId,
    userId: numericUserId,
    name: title.trim(),
    date,
    time: null,
    targetPlayers: numericTarget,
  };
}

export async function deleteGame(gameId, userId) {
  const response = await fetch(apiUrl(`/games/${encodeURIComponent(gameId)}?userId=${encodeURIComponent(userId)}`), {
    method: "DELETE",
  });
  if (!response.ok) {
    const message = await responseMessage(response);
    if (response.status === 409) {
      throw new Error("This game cannot be deleted because it already has a recorded result.");
    }
    if (response.status === 403) {
      throw new Error(message || "Only a group admin or the game creator can delete this game.");
    }
    throw new Error(message || `Could not delete game (${response.status}). Please try again.`);
  }
}

export async function loadGame(id, signal) {
  const response = await fetch(apiUrl(`/games/${encodeURIComponent(id)}`), { signal });
  if (!response.ok) {
    throw new Error(`Could not load game (${response.status}). Please try again.`);
  }
  return mapGame(await response.json());
}

export async function loadGroupGames(groupId, signal) {
  const response = await fetch(apiUrl(`/games/group/${encodeURIComponent(groupId)}`), { signal });
  if (!response.ok) {
    throw new Error(`Could not load games for group ${groupId} (${response.status}). Please try again.`);
  }
  return (await response.json()).map(mapGame);
}

export function mergeGames(current, loaded) {
  // Preserve games already created or loaded, including their local UI state.
  return [...new Map([...loaded, ...current].map((game) => [game.id, game])).values()];
}

export function mapGame(dto) {
  if (!dto || dto.id === null || dto.id === undefined || dto.groupId === null || dto.groupId === undefined) {
    throw new Error("Invalid GameResponseDto");
  }
  return {
    backendBacked: true,
    id: String(dto.id),
    groupId: String(dto.groupId),
    groupName: dto.groupName,
    title: dto.name,
    date: dto.date,
    time: dto.time,
    target: dto.targetPlayers,
    createdByUserId: dto.createdByUserId ?? null,
    rsvp: null,
    participants: [],
    guests: [],
  };
}

async function responseMessage(response) {
  try {
    const body = await response.json();
    return body?.message || body?.detail || "";
  } catch {
    return "";
  }
}
