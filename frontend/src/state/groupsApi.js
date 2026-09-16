import { apiUrl } from "./apiBase.js";

async function request(path, options = {}) {
  const response = await fetch(apiUrl(path), options);
  if (!response.ok) {
    throw new Error(`Could not ${options.method === "POST" ? "save" : "load"} group data (${response.status}). Please try again.`);
  }
  return response.json();
}

function post(path, body) {
  return request(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export function mapGroup(dto) {
  return {
    id: String(dto.id),
    name: dto.name,
    image: dto.imageUrl || "",
    initials: dto.name.trim().split(/\s+/).slice(0, 2).map((word) => word[0]).join("").toUpperCase(),
    color: "green",
    description: "Your crew. Your game.",
    // The Groups DTO does not expose membership or player ratings.
    members: [],
    ratings: {},
    detailsUnavailable: true,
  };
}

export async function loadGroups(userId, signal) {
  return (await request(`/groups/user/${encodeURIComponent(userId)}`, { signal })).map(mapGroup);
}

export function resolveBackendUser(user) {
  if (!Number.isInteger(user?.id)) {
    throw new Error("Please log in to continue.");
  }
  return Promise.resolve(user);
}

export async function saveGroup({ name, image, ratings, inviteToken }, user) {
  const creator = await resolveBackendUser(user);
  const selfRatings = {
    selfOverallRating: ratings.overall,
    selfAttackRating: ratings.attack,
    selfDefenseRating: ratings.defense,
  };
  const dto = inviteToken
    ? await post(`/groups/join/${encodeURIComponent(inviteToken)}`, { userId: creator.id, ...selfRatings })
    : await post("/groups", { name, imageUrl: image || null, creatorUserId: creator.id, ...selfRatings });
  return mapGroup(dto);
}
