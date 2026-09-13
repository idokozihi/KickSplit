import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../state/context";
import { Avatar, GroupImage, Icon, Modal } from "./UI";

export function RatingFields({ value, onChange }) {
  return (
    <fieldset className="ratings">
      <legend>Your ratings in this group</legend>
      <p className="muted">
        Rate yourself relative to the players in this group.
        1 — Weakest · 2 — Below average · 3 — Average · 4 — Above average · 5 — Strongest
      </p>
      {["overall", "attack", "defense"].map((key) => (
        <div className="rating-row" key={key}>
          <span id={`rating-${key}`}>{key}</span>
          <div role="group" aria-labelledby={`rating-${key}`}>
            {[1, 2, 3, 4, 5].map((number) => (
              <button
                key={number}
                type="button"
                aria-label={`${key}: ${number} out of 5`}
                aria-pressed={value[key] === number}
                className={value[key] === number ? "selected" : ""}
                onClick={() => onChange({ ...value, [key]: number })}
              >
                {number}
              </button>
            ))}
          </div>
        </div>
      ))}
    </fieldset>
  );
}
export function GroupFlow({ mode, onClose }) {
  const { addGroup } = useApp();
  const navigate = useNavigate();
  const [ratings, setRatings] = useState({ overall: 3, attack: 3, defense: 3 });
  const [image, setImage] = useState("");
  const [readingImage, setReadingImage] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  function uploadImage(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (
      !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
      file.size > 3 * 1024 * 1024
    ) {
      setError("Choose a JPG, PNG or WebP image under 3 MB.");
      return;
    }
    setError("");
    setReadingImage(true);
    const reader = new FileReader();
    reader.onload = () => {
      setImage(reader.result);
      setReadingImage(false);
    };
    reader.onerror = () => {
      setError("Could not read that image. Try another file.");
      setReadingImage(false);
    };
    reader.readAsDataURL(file);
  }
  async function submit(event) {
    event.preventDefault();
    if (saving || readingImage) return;
    const fields = new FormData(event.currentTarget);
    const name = mode === "create" ? fields.get("name").trim() : "";
    const inviteToken = mode === "join" ? fields.get("code").trim() : undefined;
    if (mode === "create" ? !name : !inviteToken) {
      setError(mode === "create" ? "Enter a group name." : "Enter an invite code.");
      return;
    }
    setError("");
    setSaving(true);
    try {
      const group = await addGroup({ name, image, ratings, inviteToken });
      onClose();
      navigate(`/groups/${group.id}`);
    } catch (error) {
      setError(error.message || "Could not save the group. Please try again.");
    } finally {
      setSaving(false);
    }
  }
  return (
    <Modal
      title={mode === "create" ? "Create your group" : "Join your crew"}
      onClose={onClose}
    >
      <form onSubmit={submit} className="form">
        {mode === "create" ? (
          <label>
            Group name
            <input
              name="name"
              placeholder="e.g. Thursday Night FC"
              maxLength={60}
              required
              autoFocus
            />
          </label>
        ) : (
          <>
            <label>
              Invite code
              <input
                name="code"
                placeholder="Enter your group’s code"
                required
                autoFocus
              />
            </label>
            <p className="form-hint">
              Enter the invite token for an existing group.
            </p>
          </>
        )}
        {mode === "create" && (
          <div className="photo-field">
            <GroupImage
              group={{ name: "Your group", initials: "", color: "green", image }}
              large
            />
            <label className="upload-button">
              {image ? "Change group image" : "Add a group image"}
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={uploadImage}
                disabled={readingImage}
              />
            </label>
            <small>Optional · JPG, PNG or WebP · up to 3 MB</small>
          </div>
        )}
        <RatingFields value={ratings} onChange={setRatings} />
        {error && (
          <p role="alert" className="error">
            {error}
          </p>
        )}
        <button className="button primary" type="submit" disabled={readingImage || saving}>
          {saving ? "Saving..." : mode === "create" ? "Create group" : "Join group"}
          <Icon name="arrow" size={18} />
        </button>
      </form>
    </Modal>
  );
}
export function CreateGameForm({ groupId, onClose }) {
  const { addGame } = useApp();
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  async function submit(event) {
    event.preventDefault();
    if (saving) return;
    const fields = new FormData(event.currentTarget);
    const date = fields.get("date");
    const title = fields.get("title").trim();
    if (!title) {
      setError("Enter a game name.");
      return;
    }
    const target = Number(fields.get("target"));
    if (!Number.isInteger(target) || target < 1) {
      setError("Enter a positive whole number for the player target.");
      return;
    }
    setError("");
    setSaving(true);
    try {
      const game = await addGame({ groupId, title, date, target });
      onClose();
      navigate(`/games/${game.id}`);
    } catch (error) {
      setError(error.message || "Could not create game. Please try again.");
    } finally {
      setSaving(false);
    }
  }
  return (
    <Modal title="Get a game together" onClose={onClose}>
      <form className="form" onSubmit={submit}>
        <label>
          Game name
          <input
            name="title"
            placeholder="e.g. Friday football"
            required
            maxLength={70}
            autoFocus
          />
        </label>
        <label>
          Propose a day
          <input name="date" type="date" required />
        </label>
        <label>
          Target player count
          <input
            name="target"
            type="number"
            min="1"
            step="1"
            defaultValue="15"
            required
          />
        </label>
        <p className="form-hint">
          Add one proposed day, then mark your availability. Members can propose more days.
        </p>
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        <button className="button primary" disabled={saving}>
          {saving ? "Saving..." : "Create game"}
          <Icon name="arrow" size={18} />
        </button>
      </form>
    </Modal>
  );
}
export function ProfileForm({ onSave, setup = false }) {
  const { user } = useApp();
  const [photo, setPhoto] = useState(user.photo);
  const [error, setError] = useState("");
  const [reading, setReading] = useState(false);
  function upload(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (
      !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
      file.size > 3 * 1024 * 1024
    ) {
      setError("Choose a JPG, PNG or WebP image under 3 MB.");
      return;
    }
    setError("");
    setReading(true);
    const reader = new FileReader();
    reader.onload = () => {
      setPhoto(reader.result);
      setReading(false);
    };
    reader.onerror = () => {
      setError("Could not read that image. Try another file.");
      setReading(false);
    };
    reader.readAsDataURL(file);
  }
  function submit(event) {
    event.preventDefault();
    const fields = new FormData(event.currentTarget);
    const name = fields.get("name").trim();
    if (!name) {
      setError("Please enter your full name.");
      return;
    }
    onSave({
      name,
      username: fields.get("username").trim(),
      photo,
      ...(!setup ? { email: fields.get("email").trim() } : {}),
    });
  }
  return (
    <form className="form" onSubmit={submit}>
      <div className="photo-field">
        <Avatar name={user.name} photo={photo} large />
        <label className="upload-button">
          {photo ? "Change photo" : "Add a photo"}
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={upload}
          />
        </label>
        <small>Optional · JPG, PNG or WebP · up to 3 MB</small>
      </div>
      <label>
        Full name
        <input
          name="name"
          autoComplete="name"
          defaultValue={user.name}
          maxLength={60}
          required
        />
      </label>
      <label>
        Username
        <div className="input-prefix">
          <span>@</span>
          <input
            name="username"
            autoComplete="username"
            defaultValue={user.username}
            placeholder="yourname"
            pattern="[A-Za-z0-9_]{3,24}"
            title="3–24 letters, numbers or underscores"
            required
          />
        </div>
      </label>
      {!setup && (
        <label>
          Email
          <input
            name="email"
            type="email"
            autoComplete="email"
            defaultValue={user.email}
            required
          />
        </label>
      )}
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      <button className="button primary" disabled={reading}>
        {setup ? "Continue" : "Save changes"}
        <Icon name="arrow" size={18} />
      </button>
    </form>
  );
}
