import { useState } from "react";
import { useParams } from "react-router-dom";
import { useApp } from "../state/context";
import { rankedDays } from "../state/mock";
import {
  Avatar,
  BackLink,
  EmptyState,
  GameCard,
  GroupImage,
  Icon,
  Modal,
  Section,
} from "../components/UI";
import { CreateGameForm, RatingFields } from "../components/Forms";
import { loadInviteToken } from "../state/groupsApi";
import { inviteUrl } from "../state/invite";

export default function Group() {
  const { groupId } = useParams();
  const { groups, groupsLoading, groupsError, games, user, updateRatings } = useApp();
  const group = groups.find((item) => item.id === groupId);
  const [creating, setCreating] = useState(false);
  const [ratings, setRatings] = useState(null);
  const [inviting, setInviting] = useState(false);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteLink, setInviteLink] = useState("");
  const [inviteError, setInviteError] = useState("");
  const [copied, setCopied] = useState(false);
  async function openInvite() {
    setInviting(true);
    setInviteLoading(true);
    setInviteError("");
    setInviteLink("");
    setCopied(false);
    try {
      const token = await loadInviteToken(groupId, user.id);
      setInviteLink(inviteUrl(token, window.location.origin));
    } catch (failure) {
      setInviteError(failure.message || "Could not get an invite link. Please try again.");
    } finally {
      setInviteLoading(false);
    }
  }
  async function copyInvite() {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setInviteError("");
    } catch {
      setInviteError("Could not copy the link. Select and copy it manually.");
    }
  }
  if (!group && groupsLoading) return <EmptyState title="Loading group..." />;
  if (!group && groupsError) return <EmptyState title="Could not load group" description={groupsError} to="/groups" action="Your groups" />;
  if (!group)
    return (
      <EmptyState
        title="Group not found"
        description="This group could not be found on the server."
        to="/groups"
        action="Your groups"
      />
    );
  const scheduled = rankedDays(games.filter((game) => game.groupId === groupId));
  return (
    <>
      <BackLink to="/groups">Your groups</BackLink>
      <header className="group-hero">
        <GroupImage group={group} large />
        <div>
          <p className="eyebrow">YOUR FOOTBALL CREW</p>
          <h1><bdi>{group.name}</bdi></h1>
          <p>{group.description}</p>
          <span className="group-member-count">
            <Icon name="groups" size={17} />
            {group.detailsUnavailable ? "Members unavailable" : `${group.members.length} ${group.members.length === 1 ? "member" : "members"}`}
          </span>
        </div>
      </header>
      <button className="button secondary" onClick={openInvite}>Invite players</button>
      <div className="home-grid">
        <div>
          <Section title="Proposed days">
            <button
              className="button primary section-action"
              onClick={() => setCreating(true)}
            >
              <Icon name="plus" size={18} />
              Create game
            </button>
            {scheduled.length ? (
              <div className="card-list">
                {scheduled.map(({ game, day }, index) => (
                  <GameCard game={game} day={day} popular={index === 0} loadGuestList={game.backendBacked} key={`${game.id}-${day.id}`} />
                ))}
              </div>
            ) : (
              <EmptyState
                title="Who’s up for a game?"
                description="Propose a day and find out who is available."
              />
            )}
          </Section>
          <Section title={group.detailsUnavailable ? "Members" : `Members · ${group.members.length}`}>
            {group.detailsUnavailable && <p className="form-hint">Member details are currently unavailable.</p>}
            <div className="member-grid">
              {group.members.map((member, index) => (
                <div className="person" key={index}>
                  <Avatar
                    name={index === 0 ? user.name : member}
                    photo={index === 0 ? user.photo : undefined}
                  />
                  <span>
                    {index === 0 ? user.name : member}
                    {index === 0 && <small>You</small>}
                  </span>
                </div>
              ))}
            </div>
          </Section>
        </div>
        <aside>
          <Section title="Your player profile">
            <div className="panel">
              <div className="person">
                <Avatar name={user.name} photo={user.photo} />
                <div>
                  <h3>{user.name}</h3>
                  <small><bdi>{group.name}</bdi></small>
                </div>
              </div>
              <div className="rating-summary">
                {Object.entries(group.ratings).map(([key, value]) => (
                  <div key={key}>
                    <span>{key}</span>
                    <strong>
                      {value}
                      <small>/ 5</small>
                    </strong>
                  </div>
                ))}
              </div>
              <p className="form-hint">
                {group.detailsUnavailable ? "Your ratings are saved when you create or join a group. Viewing and editing saved ratings is currently unavailable." : "Your self-ratings relative to the players in this group."}
              </p>
              <button
                className="button secondary full-width"
                disabled={group.detailsUnavailable}
                onClick={() => setRatings({ ...group.ratings })}
              >
                Edit group ratings
              </button>
            </div>
          </Section>
        </aside>
      </div>
      {creating && (
        <CreateGameForm groupId={groupId} onClose={() => setCreating(false)} />
      )}
      {inviting && (
        <Modal title="Invite players" onClose={() => setInviting(false)}>
          {inviteLoading && <p className="muted">Getting invite link...</p>}
          {inviteLink && (
            <div className="form">
              <label>Invite link<input value={inviteLink} readOnly onFocus={(event) => event.currentTarget.select()} /></label>
              <button className="button primary" onClick={copyInvite}>Copy link</button>
              {copied && <p className="success" role="status">Link copied.</p>}
            </div>
          )}
          {inviteError && <p className="error" role="alert">{inviteError}</p>}
        </Modal>
      )}
      {ratings && (
        <Modal title="Your group ratings" onClose={() => setRatings(null)}>
          <form
            className="form"
            onSubmit={(event) => {
              event.preventDefault();
              updateRatings(groupId, ratings);
              setRatings(null);
            }}
          >
            <RatingFields value={ratings} onChange={setRatings} />
            <button className="button primary">Save ratings</button>
          </form>
        </Modal>
      )}
    </>
  );
}
