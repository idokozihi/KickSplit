import { useEffect, useState } from "react";
import { resolveBackendUser } from "../state/groupsApi";
import { loadGameResult, saveGameResult } from "../state/gameResultsApi";
import { loadTeamProposals, matchProposalPlayers } from "../state/teamProposalsApi";
import { goingPlayers } from "../state/mock";
import ProposalTeams from "./ProposalTeams";
import { useApp } from "../state/context";
import { groupTeamColors, TEAM_COLOR_OPTIONS } from "../state/teamColors";

const emptyWins = ["0", "0", "0"];

export default function GameResult({ game, user, availabilityKnown = false }) {
  const { groups } = useApp();
  const teamNames = groupTeamColors(groups.find((group) => group.id === String(game.groupId))).map((color) => TEAM_COLOR_OPTIONS[color].label);
  const [expanded, setExpanded] = useState(false);
  const [state, setState] = useState(null);
  const [retry, setRetry] = useState(0);
  const [proposalId, setProposalId] = useState("");
  const [wins, setWins] = useState(emptyWins);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const key = `${game.id}:${user.id}:${retry}`;
  useEffect(() => {
    if (!game.backendBacked) return;
    const controller = new AbortController();
    Promise.all([loadGameResult(game.id, controller.signal), loadTeamProposals(game.id, controller.signal)])
      .then(([result, proposals]) => {
        if (controller.signal.aborted) return;
        setState({ key, result, proposals });
        setProposalId(result ? String(result.proposalId) : "");
        setWins(result ? [result.team1Wins, result.team2Wins, result.team3Wins].map(String) : emptyWins);
      })
      .catch((error) => {
        if (!controller.signal.aborted) setState({ key, error: error.message || "Could not load result." });
      });
    return () => controller.abort();
  }, [game.id, game.backendBacked, user.id, key]);

  if (!game.backendBacked) return <p className="muted">Results are available for saved games.</p>;
  if (state?.key !== key) return <p role="status">Loading result and proposals...</p>;
  if (state.error) return <><p className="error" role="alert">{state.error}</p>
    <button className="button secondary" onClick={() => setRetry((value) => value + 1)}>Retry</button></>;

  const proposals = matchProposalPlayers(state.proposals, goingPlayers(game, user));
  const selected = proposals.find((proposal) => String(proposal.id) === proposalId);
  const unavailableForFirstResult = !state.result && availabilityKnown && game.rsvp === "NOT_GOING";
  async function submit(event) {
    event.preventDefault();
    if (saving || unavailableForFirstResult) return;
    const values = wins.map(Number);
    if (!selected || values.some((value) => !Number.isInteger(value) || value < 0)) {
      setSaveError("Choose a proposal and enter non-negative whole numbers for each team.");
      return;
    }
    setSaving(true);
    setSaveError("");
    try {
      const backendUser = await resolveBackendUser(user);
      const result = await saveGameResult(game.id, {
        userId: backendUser.id, proposalId: Number(selected.id),
        team1Wins: values[0], team2Wins: values[1], team3Wins: values[2],
      });
      setState((previous) => ({ ...previous, result }));
      setProposalId(String(result.proposalId));
      setWins([result.team1Wins, result.team2Wins, result.team3Wins].map(String));
    } catch (error) {
      setSaveError(error.message || "Could not save result. Please try again.");
    } finally {
      setSaving(false);
    }
  }
  const savedProposal = state.result && proposals.find((proposal) => String(proposal.id) === String(state.result.proposalId));
  const summary = state.result
    ? `${savedProposal ? `Proposal ${savedProposal.proposalNumber} · ` : ""}${state.result.team1Wins}–${state.result.team2Wins}–${state.result.team3Wins}`
    : "Not entered";
  return <div className={`result-card ${expanded ? "is-expanded" : ""}`}>
    <button type="button" className="result-toggle" aria-expanded={expanded} onClick={() => setExpanded((value) => !value)}>
      <span className="result-toggle-icon">⚽</span>
      <span className="result-toggle-copy"><strong>Game result</strong><small>{summary}</small></span>
      <span className="result-toggle-action">{expanded ? "Close" : state.result ? "View / edit" : "Enter result"}</span>
      <span className="result-chevron" aria-hidden="true">{expanded ? "−" : "+"}</span>
    </button>
    {expanded && <div className="result-body">
    {state.result ? <p role="status"><strong>Saved result:</strong> Proposal {proposals.find((proposal) => String(proposal.id) === String(state.result.proposalId))?.proposalNumber ?? ""} · {teamNames[0]} {state.result.team1Wins} · {teamNames[1]} {state.result.team2Wins} · {teamNames[2]} {state.result.team3Wins} wins</p>
      : <p className="muted">Result not entered</p>}
    <form className="form" onSubmit={submit}>
      <p>Choose the lineup that was played:</p>
      <div className="proposal-selector" role="group" aria-label="Played proposal">
        {proposals.map((proposal, index) => <button type="button" key={proposal.id} className={proposalId === String(proposal.id) ? "active" : ""} aria-pressed={proposalId === String(proposal.id)} onClick={() => setProposalId(String(proposal.id))}>Proposal {proposal.proposalNumber ?? index + 1}</button>)}
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
          <input type="number" min="0" step="1" required value={value}
            onChange={(event) => setWins((current) => current.map((item, i) => i === index ? event.target.value : item))} />
        </label>)}
      </div>
      {saveError && <p className="error" role="alert">{saveError}</p>}
      {unavailableForFirstResult && <p className="form-hint">Only available participants can enter the first result.</p>}
      <button className="button primary" disabled={saving || !selected || unavailableForFirstResult}>{saving ? "Saving result..." : state.result ? "Update result" : "Save result"}</button>
    </form></div>}
  </div>;
}
