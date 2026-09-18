import { apiUrl } from "./apiBase.js";
import { colorsFromGroupDto, validTeamColors } from "./teamColors.js";

async function request(path, options = {}) {
  let response;
  try {
    response = await fetch(apiUrl(path), options);
  } catch {
    throw new Error("Could not connect to KickSplit. Please try again.");
  }
  if (!response.ok) {
    if (path.endsWith("/rating-source") && response.status === 403) {
      throw new Error("Only group admins can change the team balancing rating.");
    }
    if (path.endsWith("/team-colors") && response.status === 403) {
      throw new Error("Only group admins can change team colors.");
    }
    if (path.startsWith("/groups/join/")) {
      let message = "";
      try { message = (await response.json()).message || ""; } catch { /* Error body may be empty. */ }
      if (/already.*member/i.test(message)) throw new Error("You are already a member of this group.");
      if (/invalid.*invite|expired/i.test(message)) throw new Error("This invite link is invalid or has expired.");
      if (response.status === 409) throw new Error("You are already a member of this group.");
      if ([400, 404, 410].includes(response.status)) throw new Error("This invite link is invalid or has expired.");
      throw new Error("Could not join this group. The link may be invalid, or you may already be a member.");
    }
    throw new Error(`Could not ${["POST", "PATCH"].includes(options.method) ? "save" : "load"} group data (${response.status}). Please try again.`);
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
    ratingSource: dto.ratingSource || "APP_RATING",
    teamColors: colorsFromGroupDto(dto),
    // The Groups DTO does not expose membership or player ratings.
    members: [],
    ratings: {},
    detailsUnavailable: true,
  };
}

export async function loadGroups(userId, signal) {
  return (await request(`/groups/user/${encodeURIComponent(userId)}`, { signal })).map(mapGroup);
}

export async function loadGroup(groupId, signal) {
  return mapGroup(await request(`/groups/${encodeURIComponent(groupId)}`, { signal }));
}

export async function loadGroupMembers(groupId, signal) {
  return request(`/groups/${encodeURIComponent(groupId)}/members`, { signal });
}

export async function saveRatingSource(groupId, userId, ratingSource) {
  const response = await request(`/groups/${encodeURIComponent(groupId)}/rating-source`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, ratingSource }),
  });
  return mapGroup(response);
}

export async function saveTeamColors(groupId, userId, colors) {
  if (!validTeamColors(colors)) throw new Error("Choose three different team colors.");
  const response = await request(`/groups/${encodeURIComponent(groupId)}/team-colors`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, team1Color: colors[0].toUpperCase(), team2Color: colors[1].toUpperCase(), team3Color: colors[2].toUpperCase() }),
  });
  const responseColors = [response.team1Color, response.team2Color, response.team3Color].map((value) => value?.toLowerCase());
  if (!validTeamColors(responseColors)) throw new Error("The server did not return saved team colors. Please try again after the API is updated.");
  return mapGroup(response);
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
