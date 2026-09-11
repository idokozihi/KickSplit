import ProposedDays from "../components/ProposedDays";
import { useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { useApp } from "../state/context";
import { goingPlayers, dayGame, gameDays, createMockId } from "../state/mock";
import {
  Avatar,
  BackLink,
  EmptyState,
  Icon,
  Modal,
  PageHeading,
  Section,
} from "../components/UI";

export default function Game() {
  const { gameId } = useParams();
  const [search] = useSearchParams();
  const { games, groups, user, updateGame } = useApp();
  const [addingGuest, setAddingGuest] = useState(false);
  const [error, setError] = useState("");
  const source = games.find((item) => item.id === gameId);
  if (!source)
    return (
      <EmptyState
        title="Game not found"
        description="This game isn’t in your current demo session."
        to="/games"
        action="Your games"
      />
    );
  const game = dayGame(source, search.get("day"));
  const group = groups.find((item) => item.id === game.groupId);
  const going = goingPlayers(game, user);
  const date = new Date(game.date.includes("T") ? game.date : `${game.date}T00:00:00`);
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
      proposedDays: gameDays(source).map((day) => day.id === game.day.id
        ? { ...day, guests: [...game.guests, { id: createMockId(), name, rating }] } : day),
    });
    setAddingGuest(false);
  }
  return (
    <>
      <BackLink to="/games">Your games</BackLink>
      <PageHeading
        eyebrow="PLAN YOUR NEXT GAME"
        title={game.title}
        subtitle={
          <Link className="text-link" to={`/groups/${group.id}`}>
            <bdi>{group.name}</bdi>
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
      <div className="home-grid">
        <div>
          <Section title="Proposed days">
            <ProposedDays game={source} allowProposing />
          </Section>
          <Section title={`The lineup · ${going.length} ${going.length === 1 ? "participant" : "participants"}`}>
            <div className="panel participant-panel">
              {going.length ? (
                <div className="member-grid">
                  {going.map((player) => (
                    <div className="person" key={player.id}>
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
              Explore three ways to line up your available players and guests.
            </p>
            {going.length >= 3 ? (
              <Link
                className="button primary full-width"
                to={`/games/${gameId}/proposals?day=${game.day.id}`}
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
                  At least 3 available players, including guests, are needed for
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
