import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useApp } from "../state/context";
import { goingPlayers } from "../state/mock";
import {
  Avatar,
  BackLink,
  EmptyState,
  Icon,
  Modal,
  PageHeading,
  Section,
} from "../components/UI";

const statuses = [
  { value: "GOING", label: "Going", icon: "check" },
  { value: "MAYBE", label: "Maybe", icon: "clock" },
  { value: "NOT_GOING", label: "Not going", icon: "close" },
];
export default function Game() {
  const { gameId } = useParams();
  const { games, groups, user, updateGame } = useApp();
  const [addingGuest, setAddingGuest] = useState(false);
  const [error, setError] = useState("");
  const game = games.find((item) => item.id === gameId);
  if (!game)
    return (
      <EmptyState
        title="Game not found"
        description="This game isn’t in your current demo session."
        to="/games"
        action="Your games"
      />
    );
  const group = groups.find((item) => item.id === game.groupId);
  const going = goingPlayers(game, user);
  const date = new Date(game.date);
  function addGuest(event) {
    event.preventDefault();
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
    updateGame(gameId, {
      guests: [...game.guests, { id: crypto.randomUUID(), name, rating }],
    });
    setAddingGuest(false);
  }
  return (
    <>
      <BackLink to="/games">Your games</BackLink>
      <PageHeading
        eyebrow="SEE YOU ON THE PITCH"
        title={game.title}
        subtitle={
          <Link className="text-link" to={`/groups/${group.id}`}>
            {group.name}
            <Icon name="arrow" size={16} />
          </Link>
        }
      />
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
        <div>
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
        </div>
        <div>
          <Icon name="groups" />
          <span>
            Player target
            <strong>
              {going.length} / {game.target} going
            </strong>
          </span>
        </div>
      </div>
      <div className="home-grid">
        <div>
          <Section title="Are you in?">
            <div className="panel">
              <div className="rsvp-options">
                {statuses.map((status) => (
                  <button
                    key={status.value}
                    aria-pressed={game.rsvp === status.value}
                    className={`rsvp-button ${game.rsvp === status.value ? "selected " + status.value : ""}`}
                    onClick={() => updateGame(gameId, { rsvp: status.value })}
                  >
                    <Icon name={status.icon} size={19} />
                    {status.label}
                  </button>
                ))}
              </div>
              <p className="form-hint" aria-live="polite">
                {game.rsvp
                  ? "Your response is saved for this session. You can change it anytime."
                  : "Let your group know if you can make it."}
              </p>
            </div>
          </Section>
          <Section title="The lineup">
            <div className="panel participant-panel">
              {statuses.map((status) => {
                const players = [
                  ...(game.rsvp === status.value
                    ? [{ id: "me", name: user.name }]
                    : []),
                  ...game.participants.filter(
                    (player) => player.status === status.value,
                  ),
                ];
                return (
                  <div className="participant-section" key={status.value}>
                    <h3>
                      <span className={`status-dot ${status.value}`} />
                      {status.label}
                      <span className="count">{players.length}</span>
                    </h3>
                    {players.length ? (
                      <div className="member-grid">
                        {players.map((player) => (
                          <div className="person" key={player.id}>
                            <Avatar
                              name={player.name}
                              photo={
                                player.id === "me" ? user.photo : undefined
                              }
                            />
                            <span>
                              {player.name}
                              {player.id === "me" && <small>You</small>}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="muted">No players here yet.</p>
                    )}
                  </div>
                );
              })}
            </div>
          </Section>
        </div>
        <aside>
          <Section title={`Guests · ${game.guests.length}`}>
            <div className="panel">
              <p className="muted">Bringing a friend? Guests count as going.</p>
              <div className="guest-list">
                {game.guests.map((guest) => (
                  <div className="person" key={guest.id}>
                    <Avatar name={guest.name} />
                    <span>
                      {guest.name}
                      <small>Guest · Going · Rating {guest.rating}/5</small>
                    </span>
                  </div>
                ))}
              </div>
              <button
                className="button secondary full-width"
                onClick={() => {
                  setAddingGuest(true);
                  setError("");
                }}
              >
                <Icon name="plus" size={18} />
                Add guest
              </button>
            </div>
          </Section>
          <div className="teams-callout">
            <Icon name="ball" size={30} />
            <h2>Time to split the teams.</h2>
            <p>
              Explore three ways to line up your confirmed players and guests.
            </p>
            {going.length >= 3 ? (
              <Link
                className="button primary full-width"
                to={`/games/${gameId}/proposals`}
              >
                Generate teams
                <Icon name="arrow" size={18} />
              </Link>
            ) : (
              <>
                <button className="button primary full-width" disabled>
                  Generate teams
                </button>
                <small>
                  At least 3 confirmed players, including guests, are needed for
                  one player on each team.
                </small>
              </>
            )}
          </div>
        </aside>
      </div>
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
              Choose a fixed rating from 1 (beginner) to 5 (advanced). Your guest
              will be marked as going and included in team proposals.
            </p>
            {error && (
              <p className="error" role="alert">
                {error}
              </p>
            )}
            <button className="button primary">
              Add guest
              <Icon name="plus" size={18} />
            </button>
          </form>
        </Modal>
      )}
    </>
  );
}
