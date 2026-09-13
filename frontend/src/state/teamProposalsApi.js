export async function loadTeamProposals(gameId, signal) {
  const response = await fetch(`/api/team-proposals/game/${encodeURIComponent(gameId)}`, { signal });
  if (!response.ok) throw new Error(`Could not generate teams (${response.status}). Please try again.`);
  const proposals = await response.json();
  if (!Array.isArray(proposals) || proposals.length < 1 || proposals.length > 3
    || proposals.some((proposal) => !Array.isArray(proposal.teams) || proposal.teams.length !== 3
      || proposal.teams.some((team) => !Array.isArray(team)) || !Number.isFinite(proposal.balanceScore))) {
    throw new Error("No valid team proposals were returned. Check the available players and try again.");
  }
  return proposals;
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
