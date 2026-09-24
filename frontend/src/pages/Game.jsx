import ProposedDays from "../components/ProposedDays";
import GameResult from "../components/GameResult";
import TeamProposals from "./TeamProposals";
import { useEffect, useState } from "react";
import { loadGame } from "../state/gamesApi";
import { findGroupMember, loadGroupMembers } from "../state/groupsApi";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useApp } from "../state/context";
import { goingPlayers, dayGame, gameDays, createMockId } from "../state/mock";
import {
  Avatar,
  BackLink,
  EmptyState,
  Icon,
  Modal,
  Section,
} from "../components/UI";

export default function Game() {
  const { gameId } = useParams();
  const [search] = useSearchParams();
  const navigate = useNavigate();
  const { games, groups, user, updateGame, deleteGame, cacheGame, refreshRegistrations, refreshGuests, addBackendGuest } = useApp();
  const [addingGuest, setAddingGuest] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deletingGame, setDeletingGame] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [deleteAccess, setDeleteAccess] = useState(null);
  const [deleteAccessRetry, setDeleteAccessRetry] = useState(0);
  const [tab, setTab] = useState("lineup");
  const [resultEpoch, setResultEpoch] = useState(0);
  const [error, setError] = useState("");
  const source = games.find((item) => item.id === gameId);
  const [loadError, setLoadError] = useState(null);
  useEffect(() => {
    if (source) return;
    const controller = new AbortController();
    loadGame(gameId, controller.signal)
      .then((game) => {
        if (!controller.signal.aborted) cacheGame(game);
      })
      .catch((error) => {
        if (!controller.signal.aborted) {
          setLoadError({ id: gameId, message: error.message || "Could not load game. Please try again." });
        }
      });
    return () => controller.abort();
  }, [gameId, source, cacheGame]);
  const backendGameId = source?.backendBacked ? source.id : null;
  const [registrationResult, setRegistrationResult] = useState(null);
  const [registrationRetry, setRegistrationRetry] = useState(0);
  const registrationKey = `${backendGameId}:${user.email}:${registrationRetry}`;
  useEffect(() => {
    if (!backendGameId) return;
    const controller = new AbortController();
    refreshRegistrations(backendGameId, controller.signal)
      .then(() => {
        if (!controller.signal.aborted) setRegistrationResult({ key: registrationKey });
      })
      .catch((error) => {
        if (!controller.signal.aborted) setRegistrationResult({ key: registrationKey, error: error.message || "Could not load availability." });
      });
    return () => controller.abort();
  }, [backendGameId, registrationKey, refreshRegistrations]);
  const registrationStatus = backendGameId ? {
    loading: registrationResult?.key !== registrationKey || Boolean(registrationResult?.error),
    error: registrationResult?.key === registrationKey ? registrationResult.error : "",
    retry: () => setRegistrationRetry((value) => value + 1),
  } : undefined;
  const [guestResult, setGuestResult] = useState(null);
  const [guestRetry, setGuestRetry] = useState(0);
  const [savingGuest, setSavingGuest] = useState(false);
  const guestKey = `${backendGameId}:${guestRetry}`;
  useEffect(() => {
    if (!backendGameId) return;
    const controller = new AbortController();
    refreshGuests(backendGameId, controller.signal)
      .then(() => {
        if (!controller.signal.aborted) setGuestResult({ key: guestKey });
      })
      .catch((error) => {
        if (!controller.signal.aborted) setGuestResult({ key: guestKey, error: error.message || "Could not load guests." });
      });
    return () => controller.abort();
  }, [backendGameId, guestKey, refreshGuests]);
  const guestError = guestResult?.key === guestKey ? guestResult.error : "";
  const guestsLoading = Boolean(backendGameId) && guestResult?.key !== guestKey;
  const deleteAccessKey = source ? `${source.groupId}:${user.id}:${deleteAccessRetry}` : "";
  useEffect(() => {
    if (!source?.backendBacked) return;
    const controller = new AbortController();
    loadGroupMembers(source.groupId, controller.signal)
      .then((members) => {
        if (!controller.signal.aborted) {
          const membership = findGroupMember(members, user.id);
          setDeleteAccess({ key: deleteAccessKey, admin: Boolean(membership?.admin) });
        }
      })
      .catch((error) => {
        if (!controller.signal.aborted) setDeleteAccess({
          key: deleteAccessKey,
          error: error.message || "Could not verify game management access.",
        });
      });
    return () => controller.abort();
  }, [source?.backendBacked, source?.groupId, user.id, deleteAccessKey]);
  if (!source && loadError?.id !== gameId)
    return <EmptyState title="Loading game..." />;
  if (!source)
    return (
      <EmptyState
        title="Game not found"
        description={loadError.message}
        to="/games"
        action="Your games"
      />
    );
  const game = dayGame(source, search.get("day"));
  const group = groups.find((item) => item.id === game.groupId)
    || { id: game.groupId, name: game.groupName || "Your group" };
  const going = goingPlayers(game, user);
  const date = new Date(game.date.includes("T") ? game.date : `${game.date}T00:00:00`);
  const createdByCurrentUser = game.createdByUserId !== null && game.createdByUserId !== undefined
    && String(game.createdByUserId) === String(user.id);
  const canDeleteGame = Boolean(game.backendBacked
    && (createdByCurrentUser || (deleteAccess?.key === deleteAccessKey && deleteAccess.admin)));
  async function deleteCurrentGame() {
    if (deletingGame || !canDeleteGame) return;
    setDeletingGame(true);
    setDeleteError("");
    try {
      await deleteGame(gameId);
      navigate("/games", { replace: true });
    } catch (failure) {
      setDeleteError(failure.message || "Could not delete this game. Please try again.");
    } finally {
      setDeletingGame(false);
    }
  }
  async function addGuest(event) {
    event.preventDefault();
    if (savingGuest || guestsLoading) return;
    const fields = new FormData(event.currentTarget);
    const name = fields.get("name").trim();
    const rating = Number(fields.get("rating"));
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      setError("Choose a guest rating from 1 to 5.");
      return;
    }
    if (!name) {
      setError("Enter your guest’s name.");
      return;
    }
    if (
      game.guests.some(
        (guest) => guest.name.toLowerCase() === name.toLowerCase(),
      )
    ) {
      setError("A guest with that name has already been added.");
      return;
    }
    if (source.backendBacked) {
      setError("");
      setSavingGuest(true);
      try {
        await addBackendGuest(gameId, { name, rating });
        setAddingGuest(false);
      } catch (error) {
        setError(error.message || "Could not add guest. Please try again.");
      } finally {
        setSavingGuest(false);
      }
      return;
    }
    updateGame(gameId, {
      proposedDays: gameDays(source).map((day) => day.id === game.day.id
        ? { ...day, guests: [...game.guests, { id: createMockId(), name, rating }] } : day),
    });
    setAddingGuest(false);
  }
  return (
    <div className="game-screen">
      <BackLink to="/games">Your games</BackLink>
      <header className="game-page-header">
        <span className="game-page-kicker"><Link to={`/groups/${group.id}`}><bdi>{group.name}</bdi></Link></span>
        <h1><bdi>{game.title}</bdi></h1>
        <div className="game-page-context">
          <span><Icon name="games" size={15} />{date.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })}</span>
          {game.date.includes("T") && <span><Icon name="clock" size={15} />{date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}</span>}
          <span><Icon name="groups" size={15} />{going.length}/{game.target} available</span>
        </div>
      </header>
      <div className="app-tabs" role="group" aria-label="Game sections">
        {[["lineup", "Lineup"], ["teams", "Teams"], ["info", "Info"]].map(([value, label]) => <button key={value} aria-pressed={tab === value} className={tab === value ? "active" : ""} onClick={() => setTab(value)}>{label}</button>)}
      </div>
      {canDeleteGame && <div className="game-page-management">
        <button type="button" className="button destructive" onClick={() => {
          setDeleteError("");
          setConfirmingDelete(true);
        }}>Delete game</button>
      </div>}
      {tab === "info" && <>
      <div className="game-details">
        <div>
          <Icon name="games" />
          <span>
            Date
            <strong>
              {date.toLocaleDateString("en-GB", {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}
            </strong>
          </span>
        </div>
        {game.date.includes("T") && <div>
          <Icon name="clock" />
          <span>
            Kickoff
            <strong>
              {date.toLocaleTimeString("en-GB", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </strong>
          </span>
        </div>}
        <div>
          <Icon name="groups" />
          <span>
            Player target
            <strong>
              {game.target} players
            </strong>
          </span>
        </div>
      </div>
      <p className="game-info-group">Group: <Link className="text-link" to={`/groups/${group.id}`}>{group.name}</Link></p>
      {deleteAccess?.key === deleteAccessKey && deleteAccess.error && !createdByCurrentUser && <div className="panel game-access-error">
        <p className="error" role="alert">{deleteAccess.error}</p>
        <button type="button" className="button secondary" onClick={() => setDeleteAccessRetry((value) => value + 1)}>Retry access check</button>
      </div>}
      </>}
      {tab === "lineup" && <>
      <div className="game-lineup-layout">
        <div>
          <Section title="Your availability">
            <ProposedDays game={source} allowProposing selectedDayId={game.day.id} registrationStatus={registrationStatus} />
          </Section>
          <Section title={`The lineup · ${going.length} ${going.length === 1 ? "participant" : "participants"}`}>
            <div className="panel participant-panel">
              {going.length ? (
                <div className="member-grid">
                  {going.map((player) => (
                    <div className="person" key={`${player.guest ? "guest" : "player"}-${player.id}`}>
                      <Avatar name={player.name} photo={player.id === "me" ? user.photo : undefined} />
                      <span>
                        <bdi>{player.name}</bdi>
                        {player.id === "me" && <small>You</small>}
                        {player.guest && <small>Guest · Rating {player.rating}/5</small>}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="muted">No participants for this day yet.</p>
              )}
            </div>
          </Section>
        </div>
        <aside>
          <Section title={`Guests · ${game.guests.length}`}>
            <div className="panel">
              <p className="muted">Bringing a friend? Guests join the lineup for this day.</p>
              <button
                className="button secondary full-width"
                disabled={guestsLoading || Boolean(guestError) || savingGuest}
                onClick={() => {
                  setAddingGuest(true);
                  setError("");
                }}
              >
                <Icon name="plus" size={18} />
                Add guest
              </button>
              {guestsLoading && <p className="form-hint" role="status">Loading guests...</p>}
              {guestError && <p className="error" role="alert">{guestError}</p>}
              {guestError && <button className="button secondary" onClick={() => setGuestRetry((value) => value + 1)}>Retry</button>}
            </div>
          </Section>
          <div className="teams-callout">
            <Icon name="ball" size={30} />
            <h2>Time to split the teams.</h2>
            <p>
              Explore three ways to line up your available players and guests.
            </p>
            {going.length >= 3 ? (
              <button className="button primary full-width" onClick={() => setTab("teams")}>
                Generate teams
                <Icon name="arrow" size={18} />
              </button>
            ) : (
              <>
                <button className="button primary full-width" disabled>
                  Generate teams
                </button>
                <small>
                  At least 3 available players, including guests, are needed for
                  one player on each team.
                </small>
              </>
            )}
          </div>
        </aside>
      </div>
      </>}
      {tab === "teams" && <><TeamProposals embedded onRegenerated={() => setResultEpoch((value) => value + 1)} /><GameResult key={`${gameId}:${resultEpoch}`} game={game} user={user} availabilityKnown={Boolean(backendGameId && !registrationStatus.loading)} /></>}
      {addingGuest && (
        <Modal title="Bring a friend" onClose={() => setAddingGuest(false)}>
          <form className="form" onSubmit={addGuest}>
            <label>
              Guest’s full name
              <input
                name="name"
                placeholder="e.g. Chris Taylor"
                maxLength={60}
                required
                autoFocus
              />
            </label>
            <label>
              Guest rating (1–5)
              <input
                name="rating"
                type="number"
                min="1"
                max="5"
                step="1"
                defaultValue="3"
                required
              />
            </label>
            <p className="form-hint">
              Rate your guest relative to the players in this group.
              1 — Weakest · 2 — Below average · 3 — Average · 4 — Above average · 5 — Strongest.
              Your guest
              will be included in this day's team proposals.
            </p>
            {error && (
              <p className="error" role="alert">
                {error}
              </p>
            )}
            <button className="button primary" disabled={savingGuest}>
              {savingGuest ? "Saving..." : "Add guest"}
              <Icon name="plus" size={18} />
            </button>
          </form>
        </Modal>
      )}
      {confirmingDelete && <Modal title="Delete this game?" onClose={() => {
        if (!deletingGame) setConfirmingDelete(false);
      }}>
        <div className="confirmation-copy">
          <p>This will permanently remove <strong><bdi>{game.title}</bdi></strong> from the group.</p>
          <p className="form-hint">Games with a recorded result cannot be deleted.</p>
        </div>
        {deleteError && <p className="error" role="alert">{deleteError}</p>}
        <div className="modal-actions">
          <button type="button" className="button secondary" disabled={deletingGame} onClick={() => setConfirmingDelete(false)}>Cancel</button>
          <button type="button" className="button destructive" disabled={deletingGame} onClick={deleteCurrentGame}>{deletingGame ? "Deleting..." : "Delete game"}</button>
        </div>
      </Modal>}
    </div>
  );
}
