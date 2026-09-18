import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useApp } from "../state/context";
import { gameDays, participantCount, proposedDate, rankedDays } from "../state/mock";

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
    chat: <path d="M4 5h16v12H8l-4 3V5Z" />,
    settings: <><circle cx="12" cy="12" r="3" /><path d="M10 3h4l.5 2.1 1.6.7 1.9-1.1 2.8 2.8-1.1 1.9.7 1.6 2.1.5v4l-2.1.5-.7 1.6 1.1 1.9-2.8 2.8-1.9-1.1-1.6.7L14 21h-4l-.5-2.1-1.6-.7-1.9 1.1-2.8-2.8 1.1-1.9-.7-1.6L1.5 14v-4l2.1-.5.7-1.6-1.1-1.9L6 3.2l1.9 1.1 1.6-.7L10 3Z" /></>,
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
export function GameCard({ game, day = gameDays(game)[0], popular = false, featured = false, registrationStatus, loadGuestList = false }) {
  const { groups, user, setAvailability, refreshRegistrations, refreshGuests } = useApp();
  const [guestError, setGuestError] = useState(null);
  const [guestRetry, setGuestRetry] = useState(0);
  const guestKey = `${game.id}:${guestRetry}`;
  useEffect(() => {
    if (!loadGuestList || !game.backendBacked || game.guestsLoaded) return;
    const controller = new AbortController();
    refreshGuests(game.id, controller.signal).catch((error) => {
      if (!controller.signal.aborted) setGuestError({ key: guestKey, message: error.message || "Could not load guests." });
    });
    return () => controller.abort();
  }, [loadGuestList, game.backendBacked, game.id, game.guestsLoaded, refreshGuests, guestKey]);
  const guestsLoading = loadGuestList && game.backendBacked && !game.guestsLoaded;
  const guestFailure = guestsLoading && guestError?.key === guestKey ? guestError.message : "";
  const [availabilityError, setAvailabilityError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [retry, setRetry] = useState(0);
  const requestKey = `${game.id}:${user.email}:${retry}`;
  const [loadedKey, setLoadedKey] = useState(null);
  const registrationsManaged = Boolean(registrationStatus);
  useEffect(() => {
    if (!game.backendBacked || registrationsManaged) return;
    const controller = new AbortController();
    refreshRegistrations(game.id, controller.signal)
      .then(() => {
        if (!controller.signal.aborted) setLoadedKey(requestKey);
      })
      .catch((error) => {
        if (!controller.signal.aborted) setAvailabilityError({ key: requestKey, message: error.message || "Could not load availability." });
      });
    return () => controller.abort();
  }, [game.id, game.backendBacked, refreshRegistrations, requestKey, registrationsManaged]);
  const loading = registrationStatus ? registrationStatus.loading : game.backendBacked && loadedKey !== requestKey;
  const failure = registrationStatus?.error || (availabilityError?.key === requestKey ? availabilityError.message : "");
  async function respond(value) {
    if (saving || loading) return;
    setSaving(true);
    setAvailabilityError(null);
    try {
      await setAvailability(game.id, day.id, value);
    } catch (error) {
      setAvailabilityError({ key: requestKey, message: error.message || "Could not save availability. Please try again." });
    } finally {
      setSaving(false);
    }
  }
  const group = groups.find((item) => item.id === game.groupId);
  const count = participantCount(day);
  const calendarDate = new Date(day.date.includes("T") ? day.date : `${day.date}T00:00:00`);
  return (
    <article className={`game-card ${featured ? "featured" : ""}`}>
      <div className="game-date-block" aria-hidden="true">
        <small>{calendarDate.toLocaleDateString("en-GB", { weekday: "short" })}</small>
        <strong>{calendarDate.getDate()}</strong>
        <small>{calendarDate.toLocaleDateString("en-GB", { month: "short" })}</small>
      </div>
      <div className="game-card-content">
        <div className="game-card-top">
          <span className="group-label"><bdi>{group?.name || game.groupName}</bdi></span>
          {featured ? <span className="badge GOING">Next game</span> : popular && <span className="badge GOING">Most popular</span>}
        </div>
        <h3><Link to={`/games/${game.id}?day=${day.id}`}><bdi>{game.title}</bdi></Link></h3>
        <div className="game-meta">
          <span>{proposedDate(day.date)}</span>
          {day.date.includes("T") && <span>{new Date(day.date).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}</span>}
          <span aria-live="polite">{guestsLoading ? (guestFailure ? "Participants unavailable" : "Loading participants...") : `${count} ${count === 1 ? "participant" : "participants"}`}</span>
        </div>
        {!game.backendBacked && <p className="form-hint">Proposed by <bdi>{day.proposedBy.id === "me" ? user.name : day.proposedBy.name}</bdi></p>}
      </div>
      <Link className="circle-arrow" to={`/games/${game.id}?day=${day.id}`} aria-label={`View ${game.title}, ${proposedDate(day.date)}`}><Icon name="arrow" size={18} /></Link>
      <div className="rsvp-options availability-options" role="group" aria-label={`Your availability for ${proposedDate(day.date)}`}>
        {[
          { value: "AVAILABLE", label: "Available", style: "GOING", icon: "check" },
          { value: "UNAVAILABLE", label: "Unavailable", style: "NOT_GOING", icon: "close" },
        ].map((option) => (
          <button key={option.value}
            className={`rsvp-button ${day.availability.me === option.value ? `selected ${option.style}` : ""}`}
            aria-pressed={day.availability.me === option.value}
            disabled={loading || saving}
            onClick={() => respond(option.value)}>
            <Icon name={option.icon} size={18} />{option.label}
          </button>
        ))}
      </div>
      {loading && !failure && <p className="form-hint" role="status">Loading availability...</p>}
      {saving && <p className="form-hint" role="status">Saving availability...</p>}
      {guestFailure && <p className="error" role="alert">{guestFailure}</p>}
      {guestFailure && <button className="button secondary" onClick={() => setGuestRetry((value) => value + 1)}>Retry guests</button>}
      {failure && <p className="error" role="alert">{failure}</p>}
      {failure && loading && <button className="button secondary" onClick={registrationStatus?.retry || (() => setRetry((value) => value + 1))}>Retry</button>}
    </article>
  );
}
export function GroupCard({ group, showMemberCount = false, memberCount }) {
  const { games } = useApp();
  const proposals = rankedDays(games.filter((g) => g.groupId === group.id));
  return (
    <Link to={`/groups/${group.id}`} className="group-card">
      <GroupImage group={group} />
      <div className="group-card-copy">
        <h3><bdi>{group.name}</bdi></h3>
        <p>{showMemberCount ? memberCount === undefined ? "Loading members..." : memberCount === null ? "Members unavailable" : `${memberCount} ${memberCount === 1 ? "member" : "members"}`
          : proposals.length ? `${proposals.length} proposed ${proposals.length === 1 ? "day" : "days"}` : "No days proposed yet"}</p>
        {showMemberCount && <small>{proposals.length ? `${proposals.length} proposed ${proposals.length === 1 ? "day" : "days"}` : "No days proposed yet"}</small>}
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
