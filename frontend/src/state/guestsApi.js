function mapGuest(dto) {
  return { ...dto, id: String(dto.id), gameId: String(dto.gameId), addedByUserId: String(dto.addedByUserId) };
}

export async function loadGuests(gameId, signal) {
  const response = await fetch(`/api/guests/game/${encodeURIComponent(gameId)}`, { signal });
  if (!response.ok) throw new Error(`Could not load guests (${response.status}). Please try again.`);
  return (await response.json()).map(mapGuest);
}

export async function saveGuest(gameId, { name, rating }, addedByUserId) {
  const response = await fetch(`/api/guests/game/${encodeURIComponent(gameId)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, rating, addedByUserId: Number(addedByUserId) }),
  });
  if (!response.ok) throw new Error(`Could not add guest (${response.status}). Please try again.`);
  return mapGuest(await response.json());
}

export function mergeGuests(current, loaded) {
  return [...new Map([...current, ...loaded].map((guest) => [guest.id, guest])).values()];
}
