import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useApp } from "../state/context";
import { participantCount, proposedDate, rankedDays } from "../state/mock";
import { findGroupMember, loadGroup, loadGroupMembers, loadInviteToken, removeGroupMember, saveGroupPermissions, saveRatingSource, saveTeamColors, updateSelfRating } from "../state/groupsApi";
import { inviteUrl } from "../state/invite";
import { Avatar, BackLink, EmptyState, GroupImage, Icon, Modal, Section } from "../components/UI";
import { RatingFields } from "../components/Forms";
import GroupDateSelector from "../components/GroupDateSelector";
import { changedTeamColor, groupTeamColors, TEAM_COLOR_OPTIONS } from "../state/teamColors";
import { permissionsFromGroup } from "../state/groupPermissions";
import { processGroupImage } from "../utils/profileImage";

const ratingText = (value) => Number.isFinite(value) ? Number(value).toFixed(2) : "—";
const percentageText = (value) => `${Math.round((Number.isFinite(value) ? value : 0) * 100)}%`;
const statText = (value) => Number.isFinite(value) ? value : 0;
const selfRatingText = (value) => Number.isFinite(value) ? value : "—";

const editableRating = (value) => Number.isInteger(Number(value)) && Number(value) >= 1 && Number(value) <= 5 ? Number(value) : 3;

const permissionSettings = [
  { key: "teamGenerationPermission", label: "Generate teams", options: [["ADMINS_ONLY", "Admins only"], ["PLAYERS", "Players"]] },
  { key: "teamRegenerationMode", label: "Regenerate teams", options: [["ADMINS_ONLY", "Admins only"], ["PLAYER_VOTE", "Player vote"]] },
  { key: "resultEntryPermission", label: "Enter game result", options: [["ADMINS_ONLY", "Admins only"], ["PLAYERS", "Players"]] },
];

export default function Group() {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const { groups, groupsLoading, groupsError, games, user, leaveGroup, updateGroupDetails, updateGroupImage } = useApp();
  const group = groups.find((item) => item.id === groupId);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [ratings, setRatings] = useState(null);
  const [ratingSaving, setRatingSaving] = useState(false);
  const [ratingError, setRatingError] = useState("");
  const [confirmingLeave, setConfirmingLeave] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [leaveError, setLeaveError] = useState("");
  const [memberToRemove, setMemberToRemove] = useState(null);
  const [memberRemoving, setMemberRemoving] = useState(false);
  const [memberError, setMemberError] = useState("");
  const [inviting, setInviting] = useState(false);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteLink, setInviteLink] = useState("");
  const [inviteError, setInviteError] = useState("");
  const [copied, setCopied] = useState(false);
  const [details, setDetails] = useState(null);
  const [detailsRetry, setDetailsRetry] = useState(0);
  const [sourceSaving, setSourceSaving] = useState(false);
  const [sourceError, setSourceError] = useState(null);
  const [colorSaving, setColorSaving] = useState(false);
  const [colorError, setColorError] = useState(null);
  const [colorSaved, setColorSaved] = useState(null);
  const [permissionDraft, setPermissionDraft] = useState(null);
  const [permissionSaving, setPermissionSaving] = useState(false);
  const [permissionError, setPermissionError] = useState(null);
  const [permissionSaved, setPermissionSaved] = useState(null);
  const [photoProcessing, setPhotoProcessing] = useState(false);
  const [photoSaving, setPhotoSaving] = useState(false);
  const [photoError, setPhotoError] = useState("");
  const [photoSaved, setPhotoSaved] = useState("");
  const colorRequest = useRef(false);
  const sourceRequest = useRef(false);
  const permissionRequest = useRef(false);
  const photoRequest = useRef(false);
  const detailsKey = `${groupId}:${user.id}:${detailsRetry}`;
  const hasGroup = Boolean(group);

  useEffect(() => {
    if (!hasGroup) return;
    const controller = new AbortController();
    loadGroup(groupId, controller.signal)
      .then((loadedGroup) => {
        if (controller.signal.aborted) return;
        setDetails((previous) => previous?.key === detailsKey
          ? { ...previous, group: loadedGroup, groupLoaded: true }
          : { key: detailsKey, group: loadedGroup, groupLoaded: true });
        updateGroupDetails(loadedGroup);
      })
      .catch((error) => {
        if (!controller.signal.aborted) setDetails((previous) => previous?.key === detailsKey
          ? { ...previous, groupLoaded: true, groupError: error.message || "Could not load group details." }
          : { key: detailsKey, groupLoaded: true, groupError: error.message || "Could not load group details." });
      });
    loadGroupMembers(groupId, controller.signal)
      .then((members) => {
        if (!controller.signal.aborted) setDetails((previous) => previous?.key === detailsKey
          ? { ...previous, members, membersLoaded: true }
          : { key: detailsKey, members, membersLoaded: true });
      })
      .catch((error) => {
        if (!controller.signal.aborted) setDetails((previous) => previous?.key === detailsKey
          ? { ...previous, membersLoaded: true, membersError: error.message || "Could not load group members." }
          : { key: detailsKey, membersLoaded: true, membersError: error.message || "Could not load group members." });
      });
    return () => controller.abort();
  }, [groupId, user.id, hasGroup, detailsKey, updateGroupDetails]);

  const currentDetails = details?.key === detailsKey ? details : null;
  const members = currentDetails?.members;
  const currentMember = findGroupMember(members, user.id);
  const ratingSource = currentDetails?.group?.ratingSource || group?.ratingSource;
  const teamColors = groupTeamColors(currentDetails?.group || group);
  const savedPermissions = permissionsFromGroup(currentDetails?.group || group);
  const displayedPermissions = permissionDraft || savedPermissions;

  function openSettings() {
    setPermissionDraft(savedPermissions);
    setPermissionError(null);
    setPermissionSaved(null);
    setPhotoError("");
    setPhotoSaved("");
    setSettingsOpen(true);
  }

  async function uploadGroupPhoto(event) {
    const input = event.currentTarget;
    const file = input.files?.[0];
    if (!file) return;
    if (photoRequest.current) {
      input.value = "";
      return;
    }
    photoRequest.current = true;
    setPhotoProcessing(true);
    setPhotoError("");
    setPhotoSaved("");
    try {
      const imageUrl = await processGroupImage(file);
      setPhotoProcessing(false);
      setPhotoSaving(true);
      const saved = await updateGroupImage(groupId, imageUrl);
      setDetails((previous) => previous?.key === detailsKey ? { ...previous, group: saved } : previous);
      setPhotoSaved("Group photo updated.");
    } catch (error) {
      setPhotoError(error.message || "Could not update the group photo. Please try again.");
    } finally {
      photoRequest.current = false;
      setPhotoProcessing(false);
      setPhotoSaving(false);
      input.value = "";
    }
  }

  async function removeGroupPhoto() {
    if (photoRequest.current || !group.image) return;
    photoRequest.current = true;
    setPhotoSaving(true);
    setPhotoError("");
    setPhotoSaved("");
    try {
      const saved = await updateGroupImage(groupId, null);
      setDetails((previous) => previous?.key === detailsKey ? { ...previous, group: saved } : previous);
      setPhotoSaved("Group photo removed.");
    } catch (error) {
      setPhotoError(error.message || "Could not remove the group photo. Please try again.");
    } finally {
      photoRequest.current = false;
      setPhotoSaving(false);
    }
  }

  async function changeTeamColor(index, color) {
    if (!currentMember?.admin || colorRequest.current) return;
    const next = changedTeamColor(teamColors, index, color);
    if (!next || next[index] === teamColors[index]) return;
    colorRequest.current = true;
    setColorSaving(true);
    setColorError(null);
    setColorSaved(null);
    try {
      const saved = await saveTeamColors(groupId, user.id, next);
      setDetails((previous) => previous?.key === detailsKey ? { ...previous, group: saved } : previous);
      updateGroupDetails(saved);
      setColorSaved({ key: detailsKey, message: "Team colors saved." });
    } catch (error) {
      setColorError({ key: detailsKey, message: error.message || "Could not save team colors. Please try again." });
    } finally {
      colorRequest.current = false;
      setColorSaving(false);
    }
  }

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

  async function savePermissions() {
    if (!currentMember?.admin || permissionRequest.current || !permissionDraft) return;
    permissionRequest.current = true;
    setPermissionSaving(true);
    setPermissionError(null);
    setPermissionSaved(null);
    try {
      const saved = await saveGroupPermissions(groupId, user.id, permissionDraft);
      setDetails((previous) => previous?.key === detailsKey ? { ...previous, group: saved } : previous);
      updateGroupDetails(saved);
      setPermissionDraft(permissionsFromGroup(saved));
      setPermissionSaved({ key: detailsKey, message: "Group permissions saved." });
    } catch (error) {
      setPermissionError({ key: detailsKey, message: error.message || "Could not save group permissions. Please try again." });
    } finally {
      permissionRequest.current = false;
      setPermissionSaving(false);
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

  function openRatingEditor() {
    if (!currentMember) return;
    setRatingError("");
    setRatings({
      overall: editableRating(currentMember.selfOverallRating),
      attack: editableRating(currentMember.selfAttackRating),
      defense: editableRating(currentMember.selfDefenseRating),
    });
  }

  async function saveRatings(event) {
    event.preventDefault();
    if (ratingSaving || !ratings) return;
    setRatingSaving(true);
    setRatingError("");
    try {
      const saved = await updateSelfRating(groupId, user.id, ratings);
      setDetails((previous) => previous?.key === detailsKey ? {
        ...previous,
        members: previous.members?.map((member) => String(member.userId) === String(user.id) ? saved : member),
      } : previous);
      setRatings(null);
    } catch (failure) {
      setRatingError(failure.message || "Could not save your ratings. Please try again.");
    } finally {
      setRatingSaving(false);
    }
  }

  function confirmMemberRemoval(member) {
    setMemberError("");
    setMemberToRemove(member);
  }

  async function removeMember() {
    if (!memberToRemove || memberRemoving || !currentMember?.admin) return;
    setMemberRemoving(true);
    setMemberError("");
    try {
      await removeGroupMember(groupId, memberToRemove.userId, user.id);
      setDetails((previous) => previous?.key === detailsKey ? {
        ...previous,
        members: previous.members?.filter((member) => String(member.userId) !== String(memberToRemove.userId)),
      } : previous);
      setMemberToRemove(null);
    } catch (failure) {
      setMemberError(failure.message || "Could not remove this member. Please try again.");
    } finally {
      setMemberRemoving(false);
    }
  }

  function confirmLeave() {
    setSettingsOpen(false);
    setLeaveError("");
    setConfirmingLeave(true);
  }

  async function leaveCurrentGroup() {
    if (leaving) return;
    setLeaving(true);
    setLeaveError("");
    try {
      await leaveGroup(groupId);
      navigate("/groups", { replace: true });
    } catch (failure) {
      setLeaveError(failure.message || "Could not leave this group. Please try again.");
    } finally {
      setLeaving(false);
    }
  }

  if (!group && groupsLoading) return <EmptyState title="Loading group..." />;
  if (!group && groupsError) return <EmptyState title="Could not load group" description={groupsError} to="/groups" action="Your groups" />;
  if (!group) return <EmptyState title="Group not found" description="This group could not be found on the server." to="/groups" action="Your groups" />;

  const now = new Date();
  const todayKey = [now.getFullYear(), String(now.getMonth() + 1).padStart(2, "0"), String(now.getDate()).padStart(2, "0")].join("-");
  const scheduled = rankedDays(games.filter((game) => game.groupId === groupId)).filter(({ day }) => day.date.slice(0, 10) >= todayKey);
  return <div className="group-screen">
    <header className="group-hero">
      <BackLink to="/groups">Groups</BackLink>
      <div className="group-hero-identity">
        <GroupImage group={group} large />
        <h1><bdi>{group.name}</bdi></h1>
        <span className="group-member-count"><Icon name="groups" size={17} />
          {members ? `${members.length} ${members.length === 1 ? "member" : "members"}`
            : currentDetails?.membersError ? "Members unavailable" : "Members loading"}</span>
        {group.description && <p>{group.description}</p>}
      </div>
      <div className="group-actions">
        <button className="group-hero-action" onClick={openInvite}><Icon name="plus" size={17} /><span>Invite</span></button>
        <Link className="group-hero-action" to={`/groups/${groupId}/chat`}><Icon name="chat" size={17} /><span>Chat</span></Link>
        <button className="group-hero-action" onClick={openSettings}><Icon name="settings" size={17} /><span>Settings</span></button>
      </div>
    </header>
    <div className="group-detail-layout">
      <div>
        <Section title="Next 14 days">
          <GroupDateSelector groupId={groupId} scheduled={scheduled} />
          {scheduled[0] && <Link className="popular-game-row" to={`/games/${scheduled[0].game.id}?day=${scheduled[0].day.id}`}>
            <span className="popular-game-icon"><Icon name="games" size={20} /></span>
            <span><small>Most popular day</small><strong>{proposedDate(scheduled[0].day.date)}</strong><small>{(!scheduled[0].game.backendBacked || scheduled[0].game.registrationsFor) && `${participantCount(scheduled[0].day)} participants · `}{scheduled[0].game.title}</small></span>
            <Icon name="arrow" size={18} />
          </Link>}
        </Section>
        <details className="collapsible-section group-summary"><summary><span className="summary-copy"><Icon name="groups" size={18} /><strong>Members {members ? `(${members.length})` : ""}</strong></span><span className="summary-avatars">{members?.slice(0, 4).map((member) => <Avatar key={member.userId} name={member.name} photo={String(member.userId) === String(user.id) ? user.photo : member.imageUrl} />)}{members?.length > 4 && <small>+{members.length - 4}</small>}</span><span className="summary-chevron">›</span></summary>
          {!currentDetails?.membersLoaded && <p className="muted" role="status">Loading members...</p>}
          {currentDetails?.membersError && <><p className="error" role="alert">{currentDetails.membersError}</p>
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
              {currentMember?.admin && String(member.userId) !== String(user.id)
                && <button type="button" className="member-remove-action" onClick={() => confirmMemberRemoval(member)}>Remove member</button>}
            </article>)}
          </div>}
        </details>
      </div>
      <aside>
        <details className="collapsible-section group-summary"><summary><span className="summary-copy"><Icon name="profile" size={18} /><span><strong>Player Profile</strong><small>View and edit your profile</small></span></span><span className="summary-chevron">›</span></summary>
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
            </> : <p className="form-hint">{currentDetails?.membersLoaded ? "Your stats are unavailable." : "Loading your stats..."}</p>}
            <p className="form-hint">Your self-ratings are separate from the App Rating calculated from recorded results.</p>
            <button className="button secondary full-width" disabled={!currentMember}
              onClick={openRatingEditor}>Edit rating</button>
          </div>
        </details>
      </aside>
    </div>
    {settingsOpen && <Modal title="Group settings" onClose={() => setSettingsOpen(false)}>
        {currentDetails?.groupError && <p className="error" role="alert">Some group settings could not be refreshed. Saved values are shown.</p>}
        <Section title="Group photo">
          <div className="group-photo-settings" aria-busy={photoProcessing || photoSaving}>
            <GroupImage group={group} large />
            <div className="group-photo-actions">
              <label className={`upload-button ${photoProcessing || photoSaving ? "disabled" : ""}`}>
                {photoProcessing ? "Processing photo..." : photoSaving ? "Saving photo..." : "Change photo"}
                <input type="file" accept="image/jpeg,image/png,image/webp" onChange={uploadGroupPhoto}
                  disabled={photoProcessing || photoSaving} />
              </label>
              {group.image && <button type="button" className="button secondary" onClick={removeGroupPhoto}
                disabled={photoProcessing || photoSaving}>Remove photo</button>}
            </div>
            <p className="form-hint">JPG, PNG or WebP, up to 3 MB. Photos are resized before upload.</p>
            {photoError && <p className="error" role="alert">{photoError}</p>}
            {photoSaved && <p className="success" role="status">{photoSaved}</p>}
          </div>
        </Section>
        <Section title="Team colors">
          <p className="form-hint">Choose three different colors for this group.</p>
          <div className="team-color-settings">
            {teamColors.map((color, index) => <label key={index}>
              Team {index + 1}
              <span className="color-select-row"><span className="kit-swatch" style={{ "--kit": TEAM_COLOR_OPTIONS[color].kit }} />
                <select value={color} disabled={!currentMember?.admin || colorSaving} onChange={(event) => changeTeamColor(index, event.target.value)}>
                  {Object.entries(TEAM_COLOR_OPTIONS).map(([value, option]) => <option key={value} value={value} disabled={teamColors.includes(value) && color !== value}>{option.label}</option>)}
                </select>
              </span>
            </label>)}
          </div>
          {!currentDetails?.groupLoaded && <p className="form-hint" role="status">Loading team colors...</p>}
          {members && !currentMember?.admin && <p className="form-hint">Only group admins can change team colors.</p>}
          {colorSaving && <p className="form-hint" role="status">Saving team colors...</p>}
          {colorError?.key === detailsKey && <p className="error" role="alert">{colorError.message}</p>}
          {colorSaved?.key === detailsKey && <p className="success" role="status">{colorSaved.message}</p>}
        </Section>
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
        <Section title="Permissions">
          <div className="panel permission-settings">
            <p className="muted">Choose who can manage teams and results in this group.</p>
            {permissionSettings.map((setting) => <fieldset className="permission-setting" key={setting.key} disabled={!currentMember?.admin || permissionSaving}>
              <legend>{setting.label}</legend>
              <div className="permission-options" role="group" aria-label={setting.label}>
                {setting.options.map(([value, label]) => <button key={value} type="button"
                  className={`button ${displayedPermissions[setting.key] === value ? "primary" : "secondary"}`}
                  aria-pressed={displayedPermissions[setting.key] === value}
                  onClick={() => {
                    setPermissionDraft((current) => ({ ...(current || savedPermissions), [setting.key]: value }));
                    setPermissionSaved(null);
                  }}>{label}</button>)}
              </div>
            </fieldset>)}
            {!currentDetails?.groupLoaded && <p className="form-hint" role="status">Loading group permissions...</p>}
            {members && !currentMember?.admin && <p className="form-hint">Only group admins can change group permissions.</p>}
            {currentMember?.admin && <button type="button" className="button primary permission-save"
              disabled={permissionSaving} onClick={savePermissions}>{permissionSaving ? "Saving permissions..." : "Save permissions"}</button>}
            {permissionError?.key === detailsKey && <p className="error" role="alert">{permissionError.message}</p>}
            {permissionSaved?.key === detailsKey && <p className="success" role="status">{permissionSaved.message}</p>}
          </div>
        </Section>
        <Section title="Membership">
          <div className="danger-zone">
            <div><strong>Leave group</strong><p>You will lose access to this group's games and chat.</p></div>
            <button type="button" className="button destructive" onClick={confirmLeave}>Leave group</button>
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
    {ratings && <Modal title="Edit your rating" onClose={() => {
      if (!ratingSaving) setRatings(null);
    }}>
      <form className="form" onSubmit={saveRatings}>
        <RatingFields value={ratings} onChange={setRatings} disabled={ratingSaving} />
        {ratingError && <p className="error" role="alert">{ratingError}</p>}
        <div className="modal-actions">
          <button type="button" className="button secondary" disabled={ratingSaving} onClick={() => setRatings(null)}>Cancel</button>
          <button className="button primary" disabled={ratingSaving}>{ratingSaving ? "Saving..." : "Save rating"}</button>
        </div>
      </form>
    </Modal>}
    {memberToRemove && <Modal title="Remove member?" onClose={() => {
      if (!memberRemoving) setMemberToRemove(null);
    }}>
      <div className="confirmation-copy">
        <p>Remove <strong><bdi>{memberToRemove.name}</bdi></strong> from <strong><bdi>{group.name}</bdi></strong>?</p>
        <p className="form-hint">They will lose access to this group's games and chat.</p>
      </div>
      {memberError && <p className="error" role="alert">{memberError}</p>}
      <div className="modal-actions">
        <button type="button" className="button secondary" disabled={memberRemoving} onClick={() => setMemberToRemove(null)}>Cancel</button>
        <button type="button" className="button destructive" disabled={memberRemoving} onClick={removeMember}>{memberRemoving ? "Removing..." : "Remove member"}</button>
      </div>
    </Modal>}
    {confirmingLeave && <Modal title="Leave this group?" onClose={() => {
      if (!leaving) setConfirmingLeave(false);
    }}>
      <div className="confirmation-copy">
        <p>You will leave <strong><bdi>{group.name}</bdi></strong> and lose access to its games and chat.</p>
        {currentMember?.admin && <p className="form-hint">If you are the last admin, choose another admin before leaving.</p>}
      </div>
      {leaveError && <p className="error" role="alert">{leaveError}</p>}
      <div className="modal-actions">
        <button type="button" className="button secondary" disabled={leaving} onClick={() => setConfirmingLeave(false)}>Cancel</button>
        <button type="button" className="button destructive" disabled={leaving} onClick={leaveCurrentGroup}>{leaving ? "Leaving..." : "Leave group"}</button>
      </div>
    </Modal>}
  </div>;
}
