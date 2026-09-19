import { apiUrl } from "./apiBase.js";

async function readResponse(response, messages) {
  if (!response.ok) {
    let message = "";
    try {
      const body = await response.json();
      message = body.message || body.detail || "";
    } catch { /* Use a status-based fallback when the backend sends no JSON body. */ }
    if (!message) message = messages[response.status] || messages.default;
    throw new Error(message);
  }
  return response.json();
}

async function request(path, options, messages) {
  let response;
  try {
    response = await fetch(apiUrl(path), options);
  } catch {
    throw new Error("Could not connect to KickSplit. Please try again.");
  }
  return readResponse(response, messages);
}

function validateProposals(proposals, allowEmpty = false) {
  if (!Array.isArray(proposals) || (!allowEmpty && proposals.length < 1) || proposals.length > 3
    || proposals.some((proposal) => !Array.isArray(proposal.teams) || proposal.teams.length !== 3
      || proposal.teams.some((team) => !Array.isArray(team)) || !Number.isFinite(proposal.balanceScore))) {
    throw new Error("No valid team proposals were returned. Check the available players and try again.");
  }
  return proposals;
}

export async function loadTeamProposals(gameId, signal) {
  const proposals = await request(`/team-proposals/game/${encodeURIComponent(gameId)}`, { signal }, {
    default: "Could not load team proposals. Please try again.",
  });
  return validateProposals(proposals, true);
}

export async function generateTeamProposals(gameId, userId, signal) {
  const proposals = await request(`/team-proposals/game/${encodeURIComponent(gameId)}/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId: Number(userId) }),
    signal,
  }, {
    403: "You do not have permission to generate teams for this game.",
    409: "Teams cannot be generated after a game result has been recorded.",
    default: "Could not generate teams. Please try again.",
  });
  return validateProposals(proposals);
}

export async function regenerateTeams(gameId, userId, signal) {
  const proposals = await request(`/team-proposals/game/${encodeURIComponent(gameId)}/regenerate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId: Number(userId) }),
    signal,
  }, {
    403: "Only group admins can regenerate teams directly.",
    409: "Teams cannot be regenerated after a game result has been recorded.",
    default: "Could not regenerate teams. Please try again.",
  });
  return validateProposals(proposals);
}

export async function loadRegenerationVote(gameId, userId, signal) {
  return request(`/team-proposals/game/${encodeURIComponent(gameId)}/regeneration-vote?userId=${encodeURIComponent(userId)}`, { signal }, {
    default: "Could not load new teams votes. Please try again.",
  });
}

export async function requestNewTeams(gameId, userId, signal) {
  return request(`/team-proposals/game/${encodeURIComponent(gameId)}/regeneration-vote`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId: Number(userId) }),
    signal,
  }, {
    403: "Only registered, available players can vote for new teams.",
    409: "Teams cannot be regenerated after a game result has been recorded.",
    default: "Could not request new teams. Please try again.",
  });
}

export function matchProposalPlayers(proposals, lineup) {
  return proposals.map((proposal) => ({
    ...proposal,
    teams: proposal.teams.map((team, teamIndex) => team.map((player, index) => {
      const matches = lineup.filter((member) => member.name === player.name);
      // Names are the only identity field returned; avoid labels for ambiguous matches.
      const match = matches.length === 1 ? matches[0] : undefined;
      return { ...player, id: `${teamIndex}-${index}`, guest: Boolean(match?.guest), isCurrentUser: match?.id === "me" };
    })),
  }));
}
