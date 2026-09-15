import { apiUrl } from "./apiBase.js";

export async function loadVotes(gameId, signal) {
  const response = await fetch(apiUrl(`/votes/game/${encodeURIComponent(gameId)}`), { signal });
  if (!response.ok) throw new Error(`Could not load votes (${response.status}). Please try again.`);
  return response.json();
}

export async function saveVote(gameId, userId, proposalId, signal) {
  const response = await fetch(apiUrl(`/votes/game/${encodeURIComponent(gameId)}`), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId: Number(userId), proposalId: Number(proposalId) }),
    signal,
  });
  if (!response.ok) throw new Error(`Could not save vote (${response.status}). Please try again.`);
  return response.json();
}

export function mergeVote(votes, saved) {
  return [...votes.filter((vote) => !(String(vote.userId) === String(saved.userId)
    && String(vote.gameId) === String(saved.gameId))), saved];
}

export function proposalVoteState(votes, proposalId, userId) {
  const matching = votes.filter((vote) => String(vote.proposalId) === String(proposalId));
  return { count: matching.length, selected: matching.some((vote) => String(vote.userId) === String(userId)) };
}
