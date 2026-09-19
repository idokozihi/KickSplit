import { useEffect, useRef, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { BackLink, EmptyState } from "../components/UI";
import ProposalTeams from "../components/ProposalTeams";
import { loadGame } from "../state/gamesApi";
import { loadGroupMembers } from "../state/groupsApi";
import { permissionsFromGroup, teamGenerationAccess } from "../state/groupPermissions";
import { goingPlayers, makeProposals, dayGame } from "../state/mock";
import { loadRegistrations } from "../state/registrationsApi";
import {
  generateTeamProposals,
  loadRegenerationVote,
  loadTeamProposals,
  matchProposalPlayers,
  regenerateTeams,
  requestNewTeams,
} from "../state/teamProposalsApi";
import { useApp } from "../state/context";
import { useVotes } from "../state/useVotes";
import { proposalVoteState } from "../state/votesApi";

export default function TeamProposals({ embedded = false, onRegenerated }) {
  const { gameId } = useParams();
  const [search] = useSearchParams();
  const { games, groups, user, cacheGame } = useApp();
  const source = games.find((item) => item.id === gameId);
  const group = groups.find((item) => item.id === source?.groupId);
  const groupPermissions = permissionsFromGroup(group);
  const [result, setResult] = useState(null);
  const [retry, setRetry] = useState(0);
  const [selectedProposal, setSelectedProposal] = useState(0);
  const [permissionState, setPermissionState] = useState(null);
  const [permissionRetry, setPermissionRetry] = useState(0);
  const [regeneration, setRegeneration] = useState(null);
  const [regenerationRetry, setRegenerationRetry] = useState(0);
  const generationRequest = useRef(null);
  const generationSaving = useRef(false);
  const regenerationRequest = useRef(null);
  const regenerationSaving = useRef(false);
  const backendBacked = Boolean(source?.backendBacked);
  const voting = useVotes(gameId, user, backendBacked);
  const hasGame = Boolean(source);
  const requestKey = `${gameId}:${retry}`;
  const permissionKey = `${gameId}:${source?.groupId || ""}:${user.id}:${permissionRetry}`;
  const currentPermissionState = permissionState?.key === permissionKey ? permissionState : null;
  const isAdmin = Boolean(currentPermissionState?.member?.admin);
  const backendProposals = result?.key === requestKey ? result.proposals || [] : [];
  const hasBackendProposals = backendProposals.length > 0;
  const shouldLoadRegeneration = backendBacked && hasBackendProposals && currentPermissionState
    && (isAdmin || groupPermissions.teamRegenerationMode === "PLAYER_VOTE");
  const regenerationKey = `${gameId}:${user.id}:${groupPermissions.teamRegenerationMode}:${isAdmin}:${regenerationRetry}`;

  useEffect(() => () => {
    generationRequest.current?.abort();
    regenerationRequest.current?.abort();
    generationRequest.current = null;
    regenerationRequest.current = null;
    generationSaving.current = false;
    regenerationSaving.current = false;
  }, [requestKey, regenerationKey]);

  useEffect(() => {
    if (!backendBacked || !source?.groupId) return;
    const controller = new AbortController();
    const cachedRegistrations = source.registrationsFor === user.email && Array.isArray(source.registrations)
      ? source.registrations
      : null;
    Promise.all([
      loadGroupMembers(source.groupId, controller.signal),
      cachedRegistrations || loadRegistrations(gameId, controller.signal),
    ]).then(([members, registrations]) => {
      if (controller.signal.aborted) return;
      setPermissionState({
        key: permissionKey,
        member: members.find((member) => String(member.userId) === String(user.id)) || null,
        registration: registrations.find((item) => String(item.userId) === String(user.id)) || null,
      });
    }).catch((error) => {
      if (!controller.signal.aborted) {
        setPermissionState({ key: permissionKey, error: error.message || "Could not check team permissions." });
      }
    });
    return () => controller.abort();
  }, [backendBacked, gameId, permissionKey, source?.groupId, source?.registrations, source?.registrationsFor, user.email, user.id]);

  useEffect(() => {
    if (!shouldLoadRegeneration) return;
    const controller = new AbortController();
    loadRegenerationVote(gameId, user.id, controller.signal)
      .then((status) => {
        if (!controller.signal.aborted) setRegeneration({ key: regenerationKey, status });
      })
      .catch((error) => {
        if (!controller.signal.aborted) setRegeneration({ key: regenerationKey, error: error.message });
      });
    return () => controller.abort();
  }, [gameId, regenerationKey, shouldLoadRegeneration, user.id]);

  useEffect(() => {
    if (hasGame && !backendBacked) return;
    const controller = new AbortController();
    async function load() {
      if (!hasGame) {
        const game = await loadGame(gameId, controller.signal);
        if (!controller.signal.aborted) cacheGame(game);
        return;
      }
      const proposals = await loadTeamProposals(gameId, controller.signal);
      if (!controller.signal.aborted) setResult({ key: requestKey, proposals });
    }
    load().catch((error) => {
      if (!controller.signal.aborted) setResult({ key: requestKey, error: error.message || "Could not load teams. Please try again." });
    });
    return () => controller.abort();
  }, [gameId, hasGame, backendBacked, cacheGame, requestKey]);

  const generationAccess = currentPermissionState && !currentPermissionState.error
    ? teamGenerationAccess({
      isAdmin,
      isMember: Boolean(currentPermissionState.member),
      registrationStatus: currentPermissionState.registration?.status,
      permission: groupPermissions.teamGenerationPermission,
    })
    : null;
  const currentRegeneration = regeneration?.key === regenerationKey ? regeneration : null;

  async function generateNow() {
    if (!generationAccess?.allowed || generationSaving.current) return;
    generationSaving.current = true;
    const controller = new AbortController();
    generationRequest.current = controller;
    setResult((previous) => ({ ...previous, generating: true, generateError: null }));
    try {
      const proposals = await generateTeamProposals(gameId, user.id, controller.signal);
      if (controller.signal.aborted) return;
      setResult({ key: requestKey, proposals });
      setSelectedProposal(0);
      voting.resetVotes();
      setRegenerationRetry((value) => value + 1);
      onRegenerated?.();
    } catch (error) {
      if (!controller.signal.aborted) {
        setResult((previous) => ({ ...previous, generating: false, generateError: error.message }));
      }
    } finally {
      if (generationRequest.current === controller) {
        generationRequest.current = null;
        generationSaving.current = false;
      }
    }
  }

  async function voteForNewTeams() {
    if (regenerationSaving.current || voting.saving || !currentRegeneration?.status?.eligible
      || currentRegeneration.status.currentUserVoted || currentRegeneration.status.blockedByResult) return;
    regenerationSaving.current = true;
    const controller = new AbortController();
    regenerationRequest.current = controller;
    setRegeneration((previous) => ({ ...previous, saving: true, saveError: null }));
    try {
      const status = await requestNewTeams(gameId, user.id, controller.signal);
      if (controller.signal.aborted) return;
      if (status.regenerated) {
        setResult((previous) => previous?.key === requestKey ? { ...previous, proposals: status.proposals } : previous);
        setSelectedProposal(0);
        voting.resetVotes();
        onRegenerated?.();
      }
      setRegeneration({ key: regenerationKey, status, success: status.regenerated });
    } catch (error) {
      if (!controller.signal.aborted) {
        setRegeneration((previous) => ({ ...previous, saving: false, saveError: error.message }));
      }
    } finally {
      if (regenerationRequest.current === controller) {
        regenerationRequest.current = null;
        regenerationSaving.current = false;
      }
    }
  }

  async function regenerateNow() {
    if (!isAdmin || regenerationSaving.current || currentRegeneration?.status?.blockedByResult) return;
    regenerationSaving.current = true;
    const controller = new AbortController();
    regenerationRequest.current = controller;
    setRegeneration((previous) => ({ ...previous, saving: true, saveError: null, success: false }));
    try {
      const proposals = await regenerateTeams(gameId, user.id, controller.signal);
      if (controller.signal.aborted) return;
      setResult((previous) => previous?.key === requestKey ? { ...previous, proposals } : previous);
      setSelectedProposal(0);
      voting.resetVotes();
      setRegeneration((previous) => ({
        key: regenerationKey,
        status: { ...previous?.status, voteCount: 0, currentUserVoted: false, proposals },
        success: true,
      }));
      onRegenerated?.();
    } catch (error) {
      if (!controller.signal.aborted) {
        setRegeneration((previous) => ({ ...previous, saving: false, saveError: error.message }));
      }
    } finally {
      if (regenerationRequest.current === controller) {
        regenerationRequest.current = null;
        regenerationSaving.current = false;
      }
    }
  }

  if (result?.key === requestKey && result.error) {
    return <><EmptyState title="Could not load teams" description={result.error} to={`/games/${gameId}`} action="Back to game" />
      <button className="button secondary" onClick={() => setRetry((value) => value + 1)}>Try again</button></>;
  }
  if (!source) return <EmptyState title="Loading game..." />;
  if (backendBacked && result?.key !== requestKey) return <EmptyState title="Loading teams..." />;

  const game = dayGame(source, search.get("day"));
  const players = goingPlayers(game, user);
  if (!backendBacked && players.length < 3) {
    return <EmptyState title="A few more players first"
      description="At least 3 available players, including guests, are needed for one player on each team."
      to={`/games/${gameId}?day=${game.day.id}`} action="Back to game" />;
  }
  const proposals = backendBacked
    ? matchProposalPlayers(backendProposals, players)
    : makeProposals(players).map((teams) => ({ teams }));
  const playerCount = proposals.length ? proposals[0].teams.flat().length : players.length;
  const displayGroup = group || { name: game.groupName };

  return <div className="teams-screen">
    {!embedded && <BackLink to={`/games/${gameId}?day=${game.day.id}`}>Back to game</BackLink>}
    {!embedded && <header className="game-page-header"><span className="game-page-kicker"><bdi>{displayGroup?.name || game.groupName}</bdi></span><h1>Team lineups</h1><p className="teams-context"><bdi>{game.title}</bdi> · {playerCount} available players, including guests</p></header>}
    {embedded && <p className="teams-context">{playerCount} available players · {proposals.length} {proposals.length === 1 ? "lineup" : "lineups"}</p>}

    {backendBacked && !proposals.length ? <div className="team-generation-state">
      <EmptyState title="Teams have not been generated yet" description="Generate lineups when the available players are ready." />
      {!currentPermissionState && <p className="form-hint" role="status">Checking who can generate teams...</p>}
      {currentPermissionState?.error && <p className="error" role="alert">{currentPermissionState.error} <button className="button secondary" onClick={() => setPermissionRetry((value) => value + 1)}>Retry</button></p>}
      {generationAccess?.allowed && <button className="button primary" disabled={result.generating} onClick={generateNow}>{result.generating ? "Generating teams..." : "Generate teams"}</button>}
      {generationAccess && !generationAccess.allowed && <p className="form-hint">{generationAccess.message}</p>}
      {result.generateError && <p className="error" role="alert">{result.generateError}</p>}
    </div> : <>
      <div className="proposal-selector" role="group" aria-label="Team proposals">
        {proposals.map((proposal, index) => <button key={proposal.id ?? index} aria-pressed={selectedProposal === index} className={selectedProposal === index ? "active" : ""} onClick={() => setSelectedProposal(index)}>Proposal {proposal.proposalNumber ?? index + 1}</button>)}
      </div>
      {backendBacked && <div aria-live="polite">
        {voting.loading && <p>Loading votes...</p>}
        {voting.error && <p role="alert">{voting.error} <button className="button secondary" onClick={voting.retry}>Retry votes</button></p>}
        {voting.saveError && <p role="alert">{voting.saveError}</p>}
        {voting.saving && <p>Saving vote...</p>}
      </div>}
      <div className="proposals">
        {proposals.map(({ id, proposalNumber, teams, balanceScore }, index) => {
          if (index !== Math.min(selectedProposal, proposals.length - 1)) return null;
          const { count, selected } = proposalVoteState(voting.votes || [], id, voting.userId);
          return <section className="proposal" key={backendBacked ? id : index} aria-label={`Proposal ${proposalNumber ?? index + 1}`}>
            {backendBacked && <div className="proposal-score"><span>Proposal {proposalNumber ?? index + 1}</span><span>Balance score <strong>{Number(balanceScore).toFixed(2)}</strong></span></div>}
            <ProposalTeams teams={teams} groupId={game.groupId} />
            {backendBacked && <div className="section-heading proposal-vote-bar">
              <span aria-live="polite">{voting.votes ? `${count} ${count === 1 ? "player chose" : "players chose"} this lineup` : "Votes unavailable"}</span>
              <button className={`button ${selected ? "secondary" : "primary"}`}
                aria-pressed={selected} aria-label={`${selected ? "Voted for" : "Vote for"} proposal ${proposalNumber ?? index + 1}`}
                disabled={!voting.votes || voting.saving || currentRegeneration?.saving || selected}
                onClick={() => voting.vote(id)}>{selected ? "✓ Your choice" : "Choose this lineup"}</button>
            </div>}
          </section>;
        })}
      </div>
    </>}

    {backendBacked && proposals.length > 0 && <section className="regeneration-panel" aria-label="New teams">
      <div>
        <h2>New teams</h2>
        {!currentPermissionState && <p role="status">Checking regeneration permissions...</p>}
        {currentPermissionState?.error && <p role="alert">{currentPermissionState.error} <button className="button secondary" onClick={() => setPermissionRetry((value) => value + 1)}>Retry</button></p>}
        {currentPermissionState && !currentPermissionState.error && !isAdmin && groupPermissions.teamRegenerationMode === "ADMINS_ONLY" && <p>Only group admins can regenerate teams.</p>}
        {shouldLoadRegeneration && !currentRegeneration && <p role="status">Loading new teams options...</p>}
        {currentRegeneration?.error && <p role="alert">{currentRegeneration.error} <button className="button secondary" onClick={() => setRegenerationRetry((value) => value + 1)}>Retry</button></p>}
        {currentRegeneration?.status && <>
          {isAdmin ? <p>Admins can generate a fresh set of proposals immediately.</p>
            : <p aria-live="polite">{currentRegeneration.status.voteCount} of {currentRegeneration.status.requiredVotes} {currentRegeneration.status.requiredVotes === 1 ? "player wants" : "players want"} new teams</p>}
          {currentRegeneration.status.blockedByResult && <p>Teams cannot be regenerated after a result has been recorded.</p>}
          {!isAdmin && !currentRegeneration.status.blockedByResult && currentRegeneration.status.currentUserVoted && <p className="regeneration-voted">✓ You voted for new teams</p>}
          {!isAdmin && !currentRegeneration.status.blockedByResult && !currentRegeneration.status.eligible && <p>Only registered, available players can request new teams.</p>}
          {currentRegeneration.success && <p role="status" className="regeneration-success">New team proposals generated.</p>}
          {currentRegeneration.saveError && <p role="alert">{currentRegeneration.saveError}</p>}
        </>}
      </div>
      {isAdmin && currentRegeneration?.status && !currentRegeneration.status.blockedByResult
        && <button className="button secondary" disabled={currentRegeneration.saving || voting.saving} onClick={regenerateNow}>{currentRegeneration.saving ? "Regenerating..." : "Regenerate teams"}</button>}
      {!isAdmin && groupPermissions.teamRegenerationMode === "PLAYER_VOTE" && currentRegeneration?.status?.eligible
        && !currentRegeneration.status.currentUserVoted && !currentRegeneration.status.blockedByResult
        && <button className="button secondary" disabled={currentRegeneration.saving || voting.saving} onClick={voteForNewTeams}>{currentRegeneration.saving ? "Requesting..." : "Request new teams"}</button>}
    </section>}
    {!embedded && <p className="form-hint">{backendBacked ? "Teams balanced using player ratings." : "Demo preview · Example lineups only."}</p>}
  </div>;
}
