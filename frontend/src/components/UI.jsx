import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useApp } from "../state/context";
import { goingPlayers, upcoming } from "../state/mock";

export function Icon({ name = "ball", size = 22, ...props }) {
  const paths = {
    home: (
      <>
        <path d="m3 10 9-7 9 7v10H3Z" />
        <path d="M9 20v-7h6v7" />
      </>
    ),
    games: (
      <>
        <rect x="3" y="5" width="18" height="16" rx="3" />
        <path d="M7 3v4m10-4v4M3 11h18m-13 4h2m4 0h2" />
      </>
    ),
    groups: (
      <>
        <circle cx="9" cy="8" r="3" />
        <path d="M2 21v-3a7 7 0 0 1 14 0v3m0-16a3 3 0 0 1 0 6m3 3a6 6 0 0 1 3 5v2" />
      </>
    ),
    profile: (
      <>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21a8 8 0 0 1 16 0" />
      </>
    ),
    arrow: <path d="M4 12h16m-6-6 6 6-6 6" />,
    back: <path d="M20 12H4m6-6-6 6 6 6" />,
    plus: <path d="M12 5v14M5 12h14" />,
    check: <path d="m5 12 4 4L19 6" />,
    close: <path d="m6 6 12 12M6 18 18 6" />,
    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),
    ball: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="m12 7 5 4-2 6H9l-2-6Zm0 0V3m5 8 4-2m-6 8 2 3m-8-3-2 3m0-9L3 9" />
      </>
    ),
  };
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {paths[name] || paths.ball}
    </svg>
  );
}
export function Brand() {
  return (
    <Link className="brand" to="/home" aria-label="KickSplit home">
      <span className="brand-mark">
        <Icon />
      </span>
      Kick<span>Split</span>
      <small>BETA</small>
    </Link>
  );
}
export function Avatar({ name = "", photo, large = false }) {
  return (
    <span className={`avatar ${large ? "large" : ""}`}>
      {photo ? (
        <img src={photo} alt={`${name}'s profile`} />
      ) : (
        name
          .split(" ")
          .filter(Boolean)
          .map((n) => n[0])
          .slice(0, 2)
          .join("")
      )}
    </span>
  );
}
export function GroupImage({ group, large = false }) {
  return (
    <span
      role="img"
      aria-label={`${group.name} ${group.image ? "image" : "crest"}`}
      className={`group-image ${group.color} ${large ? "large" : ""} ${group.image ? "has-image" : ""}`}
    >
      {group.image ? (
        <img src={group.image} alt="" />
      ) : (
        <>
          <Icon name="ball" size={large ? 30 : 22} />
          <b>{group.initials}</b>
        </>
      )}
    </span>
  );
}
export function PageHeading({ eyebrow, title, subtitle, action }) {
  return (
    <header className="page-heading">
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1>{title}</h1>
        {subtitle && <p className="muted">{subtitle}</p>}
      </div>
      {action}
    </header>
  );
}
export function Section({ title, link, children }) {
  return (
    <section className="section">
      <div className="section-heading">
        <h2>{title}</h2>
        {link && (
          <Link className="text-link" to={link.to}>
            {link.label}
            <Icon name="arrow" size={16} />
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}
export function EmptyState({ title, description, to, action }) {
  return (
    <div className="empty-state">
      <span className="empty-icon">
        <Icon name="ball" size={30} />
      </span>
      <h3>{title}</h3>
      <p>{description}</p>
      {to && (
        <Link className="button primary" to={to}>
          {action}
          <Icon name="arrow" size={18} />
        </Link>
      )}
    </div>
  );
}
export function BackLink({ to, children }) {
  return (
    <Link className="back-link" to={to}>
      <Icon name="back" size={17} />
      {children}
    </Link>
  );
}
export function Status({ value }) {
  return (
    <span className={`badge ${value || "pending"}`}>
      {{ GOING: "Going", MAYBE: "Maybe", NOT_GOING: "Not going" }[value] ||
        "RSVP needed"}
    </span>
  );
}
export function GameCard({ game, featured = false }) {
  const { groups, user } = useApp();
  const group = groups.find((g) => g.id === game.groupId);
  const date = new Date(game.date);
  const count = goingPlayers(game, user).length;
  return (
    <Link
      to={`/games/${game.id}`}
      className={`game-card ${featured ? "featured" : ""}`}
    >
      {featured && (
        <>
          <div className="pitch" aria-hidden="true">
            <span />
            <i />
          </div>
          <p className="eyebrow">UP NEXT · LET’S PLAY</p>
        </>
      )}
      <div className="game-card-top">
        <span className="group-label">{group?.name}</span>
        <Status value={game.rsvp} />
      </div>
      <h3>{game.title}</h3>
      <div className="game-meta">
        <span>
          <Icon name="games" size={17} />
          {date.toLocaleDateString("en-GB", {
            weekday: "short",
            day: "numeric",
            month: "short",
          })}
        </span>
        <span>
          <Icon name="clock" size={17} />
          {date.toLocaleTimeString("en-GB", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      </div>
      <div className="game-card-bottom">
        <span>
          <Icon name="groups" size={18} />
          <b>{count}</b> / {game.target} players going
        </span>
        <span className="circle-arrow">
          <Icon name="arrow" size={20} />
        </span>
      </div>
      {featured && (
        <div className="progress">
          <span
            style={{ width: `${Math.min(100, (count / game.target) * 100)}%` }}
          />
        </div>
      )}
    </Link>
  );
}
export function GroupCard({ group }) {
  const { games } = useApp();
  const next = upcoming(games.filter((g) => g.groupId === group.id))[0];
  return (
    <Link to={`/groups/${group.id}`} className="group-card">
      <GroupImage group={group} />
      <div>
        <h3>{group.name}</h3>
        <p>{group.members.length} members</p>
        <small>
          {next
            ? `Next game · ${new Date(next.date).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`
            : "No games scheduled yet"}
        </small>
      </div>
      <Icon name="arrow" size={18} />
    </Link>
  );
}
export function Modal({ title, onClose, children }) {
  const ref = useRef(null);
  useEffect(() => {
    const dialog = ref.current;
    const previous = document.activeElement;
    dialog.showModal();
    return () => {
      dialog.close();
      previous?.focus();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className="modal"
      aria-labelledby="modal-title"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="modal-body">
        <div className="section-heading">
          <h2 id="modal-title">{title}</h2>
          <button
            type="button"
            className="icon-button"
            onClick={onClose}
            aria-label="Close dialog"
          >
            <Icon name="close" />
          </button>
        </div>
        {children}
      </div>
    </dialog>
  );
}
