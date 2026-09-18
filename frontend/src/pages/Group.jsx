import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { useApp } from "../state/context";
import { rankedDays } from "../state/mock";
import { loadGroup, loadGroupMembers, loadInviteToken, saveRatingSource } from "../state/groupsApi";
import { inviteUrl } from "../state/invite";
import { Avatar, BackLink, EmptyState, GroupImage, Icon, Modal, Section } from "../components/UI";
import { RatingFields } from "../components/Forms";
import GroupDateSelector from "../components/GroupDateSelector";

const ratingText = (value) => Number.isFinite(value) ? Number(value).toFixed(2) : "—";
const percentageText = (value) => `${Math.round((Number.isFinite(value) ? value : 0) * 100)}%`;
const statText = (value) => Number.isFinite(value) ? value : 0;
const selfRatingText = (value) => Number.isFinite(value) ? value : "—";

export default function Group() {
  const { groupId } = useParams();
  const { groups, groupsLoading, groupsError, games, user, updateRatings } = useApp();
  const group = groups.find((item) => item.id === groupId);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [ratings, setRatings] = useState(null);
  const [inviting, setInviting] = useState(false);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteLink, setInviteLink] = useState("");
  const [inviteError, setInviteError] = useState("");
  const [copied, setCopied] = useState(false);
  const [details, setDetails] = useState(null);
  const [detailsRetry, setDetailsRetry] = useState(0);
  const [sourceSaving, setSourceSaving] = useState(false);
  const [sourceError, setSourceError] = useState(null);
  const sourceRequest = useRef(false);
  const detailsKey = `${groupId}:${user.id}:${detailsRetry}`;
  const hasGroup = Boolean(group);

  useEffect(() => {
    if (!hasGroup) return;
    const controller = new AbortController();
    Promise.all([loadGroup(groupId, controller.signal), loadGroupMembers(groupId, controller.signal)])
      .then(([loadedGroup, members]) => {
        if (!controller.signal.aborted) setDetails({ key: detailsKey, group: loadedGroup, members });
      })
      .catch((error) => {
        if (!controller.signal.aborted) setDetails({ key: detailsKey, error: error.message || "Could not load group details." });
      });
    return () => controller.abort();
  }, [groupId, user.id, hasGroup, detailsKey]);

  const currentDetails = details?.key === detailsKey ? details : null;
  const members = currentDetails?.members;
  const currentMember = members?.find((member) => String(member.userId) === String(user.id));
  const ratingSource = currentDetails?.group?.ratingSource || group?.ratingSource;

  async function changeRatingSource(value) {
    if (!currentMember?.admin || sourceRequest.current || value === ratingSource) return;
    sourceRequest.current = true;
    setSourceSaving(true);
    setSourceError(null);
    try {
      const saved = await saveRatingSource(groupId, user.id, value);
      setDetails((previous) => previous?.key === detailsKey ? { ...previous, group: saved } : previous);
    } catch (error) {
      setSourceError({ key: detailsKey, message: error.message || "Could not update rating source." });
    } finally {
      sourceRequest.current = false;
      setSourceSaving(false);
    }
  }

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
  if (!group) return <EmptyState title="Group not found" description="This group could not be found on the server." to="/groups" action="Your groups" />;

  const scheduled = rankedDays(games.filter((game) => game.groupId === groupId));
  return <>
    <BackLink to="/groups">Your groups</BackLink>
    <header className="group-hero">
      <GroupImage group={group} large />
      <div>
        <h1><bdi>{group.name}</bdi></h1>
        <p>{group.description}</p>
        <span className="group-member-count"><Icon name="groups" size={17} />
          {members ? `${members.length} ${members.length === 1 ? "member" : "members"}`
            : currentDetails?.error ? "Members unavailable" : "Members loading"}</span>
      </div>
    </header>
    <div className="group-actions"><button className="button secondary" onClick={openInvite}>Invite players</button><button className="button secondary" onClick={() => setSettingsOpen(true)}>⚙ Group settings</button></div>
    <div className="home-grid">
      <div>
        <Section title="Proposed days">
          <GroupDateSelector groupId={groupId} scheduled={scheduled} />
        </Section>
        <details className="collapsible-section"><summary>Members {members ? `· ${members.length}` : ""}<span>⌄</span></summary>
          {!currentDetails && <p className="muted" role="status">Loading members...</p>}
          {currentDetails?.error && <><p className="error" role="alert">{currentDetails.error}</p>
            <button className="button secondary" onClick={() => setDetailsRetry((value) => value + 1)}>Retry</button></>}
          {members && <div className="player-grid">
            {members.map((member) => <article className="player-card" key={member.userId}>
              <div className="person">
                <Avatar name={member.name} photo={String(member.userId) === String(user.id) ? user.photo : undefined} />
                <span><bdi>{member.name}</bdi><small>{[String(member.userId) === String(user.id) && "You", member.admin && "Admin"].filter(Boolean).join(" · ")}</small></span>
              </div>
              <div className="player-ratings"><strong>{ratingText(member.appRating)}<small>App Rating</small></strong>
                <span>Self Rating <b>{selfRatingText(member.selfOverallRating)}</b></span></div>
              <div className="player-stats"><span>Games <b>{statText(member.ratedGames)}</b></span><span>Wins <b>{statText(member.totalWins)}</b></span><span>Win rate <b>{percentageText(member.winRate)}</b></span></div>
            </article>)}
          </div>}
        </details>
      </div>
      <aside>
        <details className="collapsible-section"><summary>Your player profile<span>⌄</span></summary>
          <div className="panel">
            <div className="person"><Avatar name={user.name} photo={user.photo} /><div><h3>{user.name}</h3><small><bdi>{group.name}</bdi></small></div></div>
            {currentMember ? <>
              <div className="profile-app-rating"><span>App Rating</span><strong>{ratingText(currentMember.appRating)}</strong></div>
              <div className="profile-stat-list">
                <span>Self overall <b>{selfRatingText(currentMember.selfOverallRating)}</b></span>
                <span>Attack <b>{selfRatingText(currentMember.selfAttackRating)}</b></span>
                <span>Defense <b>{selfRatingText(currentMember.selfDefenseRating)}</b></span>
                <span>Games <b>{statText(currentMember.ratedGames)}</b></span>
                <span>Wins <b>{statText(currentMember.totalWins)}</b></span>
                <span>Win rate <b>{percentageText(currentMember.winRate)}</b></span>
              </div>
            </> : <p className="form-hint">{currentDetails ? "Your stats are unavailable." : "Loading your stats..."}</p>}
            <p className="form-hint">{group.detailsUnavailable
              ? "Self-ratings are saved when you create or join a group. Editing saved ratings is currently unavailable."
              : "Your self-ratings relative to the players in this group."}</p>
            <button className="button secondary full-width" disabled={group.detailsUnavailable}
              onClick={() => setRatings({ ...group.ratings })}>Edit group ratings</button>
          </div>
        </details>
      </aside>
    </div>
    {settingsOpen && <Modal title="Group settings" onClose={() => setSettingsOpen(false)}>
        <Section title="Team balancing rating">
          <div className="panel rating-source-panel">
            <p className="muted">Choose which rating balances team proposals.</p>
            <div className="rating-source-options" role="group" aria-label="Team balancing rating">
              {[["APP_RATING", "App Rating"], ["SELF_RATING", "Self Rating"]].map(([value, label]) =>
                <button key={value} type="button" className={`button ${ratingSource === value ? "primary" : "secondary"}`}
                  aria-pressed={ratingSource === value} disabled={!currentMember?.admin || sourceSaving}
                  onClick={() => changeRatingSource(value)}>{label}</button>)}
            </div>
            <p className="form-hint">App Rating adapts from recorded game results. Self Rating uses players' own overall ratings.</p>
            {members && !currentMember?.admin && <p className="form-hint">Only group admins can change this setting.</p>}
            {sourceSaving && <p role="status" className="form-hint">Saving rating source...</p>}
            {sourceError?.key === detailsKey && <p className="error" role="alert">{sourceError.message}</p>}
          </div>
        </Section>
    </Modal>}
    {inviting && <Modal title="Invite players" onClose={() => setInviting(false)}>
      {inviteLoading && <p className="muted">Getting invite link...</p>}
      {inviteLink && <div className="form">
        <label>Invite link<input value={inviteLink} readOnly onFocus={(event) => event.currentTarget.select()} /></label>
        <button className="button primary" onClick={copyInvite}>Copy link</button>
        {copied && <p className="success" role="status">Link copied.</p>}
      </div>}
      {inviteError && <p className="error" role="alert">{inviteError}</p>}
    </Modal>}
    {ratings && <Modal title="Your group ratings" onClose={() => setRatings(null)}>
      <form className="form" onSubmit={(event) => { event.preventDefault(); updateRatings(groupId, ratings); setRatings(null); }}>
        <RatingFields value={ratings} onChange={setRatings} />
        <button className="button primary">Save ratings</button>
      </form>
    </Modal>}
  </>;
}
