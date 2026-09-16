import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { RatingFields } from "../components/Forms";
import { BackLink, Icon, PageHeading } from "../components/UI";
import { useApp } from "../state/context";
import { joinInvitedGroup } from "../state/invite";

export default function JoinInvite() {
  const { inviteToken } = useParams();
  const { addGroup } = useApp();
  const navigate = useNavigate();
  const [ratings, setRatings] = useState({ overall: 3, attack: 3, defense: 3 });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function submit(event) {
    event.preventDefault();
    if (saving) return;
    setError("");
    setSaving(true);
    try {
      await joinInvitedGroup(addGroup, navigate, inviteToken, ratings);
    } catch (failure) {
      setError(failure.message || "Could not join this group. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <BackLink to="/groups">Your groups</BackLink>
      <PageHeading eyebrow="JOIN YOUR CREW" title="Join a group" subtitle="Set your ratings relative to this group before joining." />
      <form className="form panel" onSubmit={submit}>
        <RatingFields value={ratings} onChange={setRatings} />
        {error && <p className="error" role="alert">{error}</p>}
        <button className="button primary" disabled={saving}>
          {saving ? "Joining..." : "Join group"}
          <Icon name="arrow" size={18} />
        </button>
      </form>
    </>
  );
}
