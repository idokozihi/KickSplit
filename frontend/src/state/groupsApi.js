import { apiUrl } from "./apiBase.js";

async function request(path, options = {}) {
  let response;
  try {
    response = await fetch(apiUrl(path), options);
  } catch {
    throw new Error("Could not connect to KickSplit. Please try again.");
  }
  if (!response.ok) {
    if (path.startsWith("/groups/join/")) {
      let message = "";
      try { message = (await response.json()).message || ""; } catch { /* Error body may be empty. */ }
      if (/already.*member/i.test(message)) throw new Error("You are already a member of this group.");
      if (/invalid.*invite|expired/i.test(message)) throw new Error("This invite link is invalid or has expired.");
      if (response.status === 409) throw new Error("You are already a member of this group.");
      if ([400, 404, 410].includes(response.status)) throw new Error("This invite link is invalid or has expired.");
      throw new Error("Could not join this group. The link may be invalid, or you may already be a member.");
    }
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

export async function loadInviteToken(groupId, userId) {
  const path = `/groups/${encodeURIComponent(groupId)}/invite-token/${encodeURIComponent(userId)}`;
  let response;
  try {
    response = await fetch(apiUrl(path));
  } catch {
    throw new Error("Could not connect to KickSplit. Please try again.");
  }
  if (!response.ok) {
    let message = "";
    try { message = (await response.json()).message || ""; } catch { /* Error body may be empty. */ }
    if (response.status === 403 || /only group admins/i.test(message)) {
      throw new Error("Only group admins can invite players.");
    }
    throw new Error("Could not get an invite link. Check that you are a group admin and try again.");
  }
  const result = await response.json();
  if (!result?.inviteToken) throw new Error("The server did not return an invite link.");
  return result.inviteToken;
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
