import { useParams, useSearchParams } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { loadGame } from "../state/gamesApi";
import { loadTeamProposals, loadRegenerationVote, matchProposalPlayers, requestNewTeams } from "../state/teamProposalsApi";
import { useApp } from "../state/context";
import { useVotes } from "../state/useVotes";
import { proposalVoteState } from "../state/votesApi";
import { goingPlayers, makeProposals, dayGame } from "../state/mock";
import { BackLink, EmptyState, PageHeading } from "../components/UI";
import ProposalTeams from "../components/ProposalTeams";

export default function TeamProposals({ embedded = false, onRegenerated }) {
  const { gameId } = useParams();
  const [search] = useSearchParams();
  const { games, groups, user, cacheGame } = useApp();
  const source = games.find((item) => item.id === gameId);
  const [result, setResult] = useState(null);
  const [retry, setRetry] = useState(0);
  const [selectedProposal, setSelectedProposal] = useState(0);
  const [regeneration, setRegeneration] = useState(null);
  const [regenerationRetry, setRegenerationRetry] = useState(0);
  const regenerationSaving = useRef(false);
  const regenerationRequest = useRef(null);
  const backendBacked = source?.backendBacked;
  const voting = useVotes(gameId, user, backendBacked);
  const hasGame = Boolean(source);
  const requestKey = `${gameId}:${retry}`;
  const regenerationKey = `${gameId}:${voting.userId}:${regenerationRetry}`;
  useEffect(() => () => {
    regenerationRequest.current?.abort();
    regenerationRequest.current = null;
    regenerationSaving.current = false;
  }, [regenerationKey]);
  useEffect(() => {
    if (!backendBacked || voting.userId == null) return;
    const controller = new AbortController();
    loadRegenerationVote(gameId, voting.userId, controller.signal)
      .then((status) => { if (!controller.signal.aborted) setRegeneration({ key: regenerationKey, status }); })
      .catch((error) => { if (!controller.signal.aborted) setRegeneration({ key: regenerationKey, error: error.message }); });
    return () => controller.abort();
  }, [backendBacked, gameId, voting.userId, regenerationKey]);
  const currentRegeneration = regeneration?.key === regenerationKey ? regeneration : null;
  async function voteForNewTeams() {
    if (regenerationSaving.current || voting.saving || !currentRegeneration?.status?.eligible
      || currentRegeneration.status.currentUserVoted || currentRegeneration.status.blockedByResult) return;
    regenerationSaving.current = true;
    const controller = new AbortController();
    regenerationRequest.current = controller;
    setRegeneration((previous) => ({ ...previous, saving: true, saveError: null }));
    try {
      const status = await requestNewTeams(gameId, voting.userId, controller.signal);
      if (controller.signal.aborted) return;
      if (status.regenerated) {
        setResult((previous) => previous?.key === requestKey ? { ...previous, proposals: status.proposals } : previous);
        voting.resetVotes();
        onRegenerated?.();
      }
      setRegeneration({ key: regenerationKey, status, success: status.regenerated });
    } catch (error) {
      if (!controller.signal.aborted) setRegeneration((previous) => ({ ...previous, saving: false, saveError: error.message }));
    } finally {
      if (regenerationRequest.current === controller) {
        regenerationRequest.current = null;
        regenerationSaving.current = false;
      }
    }
  }
  useEffect(() => {
    if (hasGame && !backendBacked) return;
    const controller = new AbortController();
    async function generate() {
      if (!hasGame) {
        const game = await loadGame(gameId, controller.signal);
        if (!controller.signal.aborted) cacheGame(game);
        return;
      }
      const proposals = await loadTeamProposals(gameId, controller.signal);
      if (!controller.signal.aborted) setResult({ key: requestKey, proposals });
    }
    generate().catch((error) => {
      if (!controller.signal.aborted) setResult({ key: requestKey, error: error.message || "Could not generate teams. Please try again." });
    });
    return () => controller.abort();
  }, [gameId, hasGame, backendBacked, cacheGame, requestKey]);
  if ((!source || backendBacked) && result?.key === requestKey && result.error)
    return <><EmptyState title="Could not generate teams" description={result.error} to={`/games/${gameId}`} action="Back to game" /><button className="button secondary" onClick={() => setRetry((value) => value + 1)}>Try again</button></>;
  if (!source || (backendBacked && result?.key !== requestKey))
    return <EmptyState title="Generating teams..." />;
  if (!source)
    return (
      <EmptyState
        title="Game not found"
        description="Choose a game from your current session."
        to="/games"
        action="Your games"
      />
    );
  const game = dayGame(source, search.get("day"));
  const players = goingPlayers(game, user);
  if (!backendBacked && players.length < 3)
    return (
      <EmptyState
        title="A few more players first"
        description="At least 3 available players, including guests, are needed for one player on each team."
        to={`/games/${gameId}?day=${game.day.id}`}
        action="Back to game"
      />
    );
  const proposals = backendBacked ? matchProposalPlayers(result.proposals, players)
    : makeProposals(players).map((teams) => ({ teams }));
  const playerCount = backendBacked ? proposals[0].teams.flat().length : players.length;
  const group = groups.find((item) => item.id === game.groupId);
  return (
    <>
      {!embedded && <BackLink to={`/games/${gameId}?day=${game.day.id}`}>Back to game</BackLink>}
      {!embedded && <PageHeading
        eyebrow={<bdi>{group?.name || game.groupName}</bdi>}
        title={backendBacked ? "Your team proposals." : "Three ways to play."}
        subtitle={<><bdi>{game.title}</bdi> · {playerCount} available players, including guests</>}
      />}
      {!embedded && <p className="proposal-intro">
        {backendBacked ? `${proposals.length} ${proposals.length === 1 ? "balanced lineup" : "balanced lineups"} for ${playerCount} participants. Take a look and find your match.` : players.length === 3
          ? "With three players, each team has one player. Proposals vary which numbered team each player joins."
          : "Same players. Three different lineups. Take a look and find your match."}
      </p>}
      <div className="proposal-selector" role="group" aria-label="Team proposals">
        {proposals.map((proposal, index) => <button key={proposal.id ?? index} aria-pressed={selectedProposal === index} className={selectedProposal === index ? "active" : ""} onClick={() => setSelectedProposal(index)}>Proposal {proposal.proposalNumber ?? index + 1}</button>)}
      </div>
      {backendBacked && <section className="regeneration-panel" aria-label="New teams">
        <div>
          <h2>New teams</h2>
          {!currentRegeneration && <p role="status">Loading new teams votes...</p>}
          {currentRegeneration?.error && <p role="alert">{currentRegeneration.error} <button className="button secondary" onClick={() => setRegenerationRetry((value) => value + 1)}>Retry</button></p>}
          {currentRegeneration?.status && <>
            <p aria-live="polite">{currentRegeneration.status.voteCount} of {currentRegeneration.status.requiredVotes} {currentRegeneration.status.requiredVotes === 1 ? "player wants" : "players want"} new teams</p>
            {currentRegeneration.status.blockedByResult && <p>Teams cannot be regenerated after a result has been recorded.</p>}
            {!currentRegeneration.status.blockedByResult && currentRegeneration.status.currentUserVoted && <p className="regeneration-voted">✓ You voted for new teams</p>}
            {!currentRegeneration.status.blockedByResult && !currentRegeneration.status.eligible && <p>Only registered, available players can request new teams.</p>}
            {currentRegeneration.success && <p role="status" className="regeneration-success">New team proposals generated.</p>}
            {currentRegeneration.saveError && <p role="alert">{currentRegeneration.saveError}</p>}
          </>}
        </div>
        {currentRegeneration?.status?.eligible && !currentRegeneration.status.currentUserVoted && !currentRegeneration.status.blockedByResult &&
          <button className="button secondary" disabled={currentRegeneration.saving || voting.saving} onClick={voteForNewTeams}>
            {currentRegeneration.saving ? "Requesting..." : "Request new teams"}
          </button>}
      </section>}
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
          return (
          <section className="proposal" key={backendBacked ? id : index}>
            <header className="proposal-heading">
              <span className="proposal-number">{String(proposalNumber ?? index + 1).padStart(2, "0")}</span>
              <div>
                <h2>Proposal {proposalNumber ?? index + 1}</h2>
                {backendBacked && <small>Balance score: {Number(balanceScore).toFixed(2)}</small>}
                <p>
                  {
                    [
                      "The first lineup",
                      "A fresh combination",
                      "One more possibility",
                    ][index]
                  }
                </p>
              </div>
              <span className="badge neutral">3 teams</span>
            </header>
            <ProposalTeams teams={teams} user={user} />
            {backendBacked && <div className="section-heading proposal-vote-bar">
              <span aria-live="polite">{voting.votes ? `${count} ${count === 1 ? "player chose" : "players chose"} this lineup` : "Votes unavailable"}</span>
              <button className={`button ${selected ? "secondary" : "primary"}`}
                aria-pressed={selected}
                aria-label={`${selected ? "Voted for" : "Vote for"} proposal ${proposalNumber ?? index + 1}`}
                disabled={!voting.votes || voting.saving || currentRegeneration?.saving || selected}
                onClick={() => voting.vote(id)}>
                {selected ? "✓ Your choice" : "Choose this lineup"}
              </button>
            </div>}
          </section>
        ); })}
      </div>
      {!embedded && <p className="form-hint">{backendBacked ? "Teams balanced using player ratings." : "Demo preview · Example lineups only."}</p>}
    </>
  );
}
