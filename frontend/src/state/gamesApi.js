export async function createGame({ groupId, title, date, target }) {
  const response = await fetch("/api/games", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      groupId: Number(groupId),
      name: title,
      date,
      time: null,
      targetPlayers: target,
    }),
  });
  if (!response.ok) {
    throw new Error(`Could not create game (${response.status}). Please try again.`);
  }
  return mapGame(await response.json());
}

export async function loadGame(id, signal) {
  const response = await fetch(`/api/games/${encodeURIComponent(id)}`, { signal });
  if (!response.ok) {
    throw new Error(`Could not load game (${response.status}). Please try again.`);
  }
  return mapGame(await response.json());
}

export async function loadGroupGames(groupId, signal) {
  const response = await fetch(`/api/games/group/${encodeURIComponent(groupId)}`, { signal });
  if (!response.ok) {
    throw new Error(`Could not load games for group ${groupId} (${response.status}). Please try again.`);
  }
  return (await response.json()).map(mapGame);
}

export function mergeGames(current, loaded) {
  // Preserve games already created or loaded, including their local UI state.
  return [...new Map([...loaded, ...current].map((game) => [game.id, game])).values()];
}

function mapGame(dto) {
  return {
    backendBacked: true,
    id: String(dto.id),
    groupId: String(dto.groupId),
    groupName: dto.groupName,
    title: dto.name,
    date: dto.date,
    time: dto.time,
    target: dto.targetPlayers,
    rsvp: null,
    participants: [],
    guests: [],
  };
}
