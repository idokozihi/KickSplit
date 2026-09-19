import { useEffect, useRef, useState } from "react";
import { resolveBackendUser, loadGroupMembers } from "../state/groupsApi";
import { gameResultAccess, permissionsFromGroup } from "../state/groupPermissions";
import { loadGameResult, saveGameResult } from "../state/gameResultsApi";
import { loadTeamProposals, matchProposalPlayers } from "../state/teamProposalsApi";
import { goingPlayers } from "../state/mock";
import ProposalTeams from "./ProposalTeams";
import { useApp } from "../state/context";
import { groupTeamColors, TEAM_COLOR_OPTIONS } from "../state/teamColors";

const emptyWins = ["0", "0", "0"];

export default function GameResult({ game, user, availabilityKnown = false }) {
  const { groups } = useApp();
  const group = groups.find((item) => item.id === String(game.groupId));
  const resultPermission = permissionsFromGroup(group).resultEntryPermission;
  const teamNames = groupTeamColors(group).map((color) => TEAM_COLOR_OPTIONS[color].label);
  const [expanded, setExpanded] = useState(false);
  const [state, setState] = useState(null);
  const [retry, setRetry] = useState(0);
  const [proposalId, setProposalId] = useState("");
  const [wins, setWins] = useState(emptyWins);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const saveRequest = useRef(false);
  const key = `${game.id}:${user.id}:${retry}`;

  useEffect(() => {
    if (!game.backendBacked) return;
    const controller = new AbortController();
    Promise.all([
      loadGameResult(game.id, controller.signal),
      loadTeamProposals(game.id, controller.signal),
      loadGroupMembers(game.groupId, controller.signal),
    ]).then(([result, proposals, members]) => {
      if (controller.signal.aborted) return;
      setState({ key, result, proposals, members });
      setProposalId(result ? String(result.proposalId) : "");
      setWins(result ? [result.team1Wins, result.team2Wins, result.team3Wins].map(String) : emptyWins);
    }).catch((error) => {
      if (!controller.signal.aborted) setState({ key, error: error.message || "Could not load result." });
    });
    return () => controller.abort();
  }, [game.id, game.groupId, game.backendBacked, user.id, key]);

  if (!game.backendBacked) return <p className="muted">Results are available for saved games.</p>;
  if (state?.key !== key) return <p role="status">Loading result and proposals...</p>;
  if (state.error) return <><p className="error" role="alert">{state.error}</p>
    <button className="button secondary" onClick={() => setRetry((value) => value + 1)}>Retry</button></>;
  if (!state.proposals.length) {
    return <section className="result-card result-unavailable" aria-label="Game result">
      <strong>Game result</strong>
      <p className="form-hint">Generate teams before entering a result.</p>
    </section>;
  }

  const proposals = matchProposalPlayers(state.proposals, goingPlayers(game, user));
  const selected = proposals.find((proposal) => String(proposal.id) === proposalId);
  const currentMember = state.members.find((member) => String(member.userId) === String(user.id));
  const registrationStatus = availabilityKnown
    ? game.rsvp === "GOING" ? "AVAILABLE" : "UNAVAILABLE"
    : undefined;
  const access = gameResultAccess({
    isAdmin: Boolean(currentMember?.admin),
    isMember: Boolean(currentMember),
    registrationStatus,
    permission: resultPermission,
    result: state.result,
    userId: user.id,
  });

  async function submit(event) {
    event.preventDefault();
    if (saveRequest.current || !access.allowed) return;
    const values = wins.map(Number);
    if (!selected || values.some((value) => !Number.isInteger(value) || value < 0)) {
      setSaveError("Choose a proposal and enter non-negative whole numbers for each team.");
      return;
    }
    saveRequest.current = true;
    setSaving(true);
    setSaveError("");
    try {
      const backendUser = await resolveBackendUser(user);
      const result = await saveGameResult(game.id, {
        userId: backendUser.id,
        proposalId: Number(selected.id),
        team1Wins: values[0],
        team2Wins: values[1],
        team3Wins: values[2],
      });
      setState((previous) => ({ ...previous, result }));
      setProposalId(String(result.proposalId));
      setWins([result.team1Wins, result.team2Wins, result.team3Wins].map(String));
    } catch (error) {
      setSaveError(error.message || "Could not save result. Please try again.");
    } finally {
      saveRequest.current = false;
      setSaving(false);
    }
  }

  const savedProposal = state.result && proposals.find((proposal) => String(proposal.id) === String(state.result.proposalId));
  const summary = state.result
    ? `${savedProposal ? `Proposal ${savedProposal.proposalNumber} · ` : ""}${state.result.team1Wins}–${state.result.team2Wins}–${state.result.team3Wins}`
    : "Not entered";
  const actionLabel = state.result ? access.allowed ? "View / edit" : "View" : access.allowed ? "Enter result" : "View";

  return <div className={`result-card ${expanded ? "is-expanded" : ""}`}>
    <button type="button" className="result-toggle" aria-expanded={expanded} onClick={() => setExpanded((value) => !value)}>
      <span className="result-toggle-icon">⚽</span>
      <span className="result-toggle-copy"><strong>Game result</strong><small>{summary}</small></span>
      <span className="result-toggle-action">{expanded ? "Close" : actionLabel}</span>
      <span className="result-chevron" aria-hidden="true">{expanded ? "−" : "+"}</span>
    </button>
    {expanded && <div className="result-body">
      {state.result ? <p role="status"><strong>Saved result:</strong> Proposal {savedProposal?.proposalNumber ?? ""} · {teamNames[0]} {state.result.team1Wins} · {teamNames[1]} {state.result.team2Wins} · {teamNames[2]} {state.result.team3Wins} wins</p>
        : <p className="muted">Result not entered</p>}
      <form className="form" onSubmit={submit}>
        <p>Choose the lineup that was played:</p>
        <div className="proposal-selector" role="group" aria-label="Played proposal">
          {proposals.map((proposal, index) => <button type="button" key={proposal.id}
            disabled={!access.allowed || saving}
            className={proposalId === String(proposal.id) ? "active" : ""}
            aria-pressed={proposalId === String(proposal.id)}
            onClick={() => setProposalId(String(proposal.id))}>Proposal {proposal.proposalNumber ?? index + 1}</button>)}
        </div>
        <div className="proposals">
          {selected && <section className="proposal" key={selected.id}>
            <header className="proposal-heading">
              <span className="proposal-number">{String(selected.proposalNumber).padStart(2, "0")}</span>
              <h3>Proposal {selected.proposalNumber}</h3>
            </header>
            <ProposalTeams teams={selected.teams} groupId={game.groupId} />
          </section>}
        </div>
        <div className="result-wins">
          {wins.map((value, index) => <label key={index}>{teamNames[index]} team wins
            <input type="number" min="0" step="1" required value={value} disabled={!access.allowed || saving}
              onChange={(event) => setWins((current) => current.map((item, i) => i === index ? event.target.value : item))} />
          </label>)}
        </div>
        {saveError && <p className="error" role="alert">{saveError}</p>}
        {!access.allowed && <p className="form-hint">{access.message}</p>}
        {access.allowed && <button className="button primary" disabled={saving || !selected}>{saving ? "Saving result..." : state.result ? "Update result" : "Save result"}</button>}
      </form>
    </div>}
  </div>;
}
