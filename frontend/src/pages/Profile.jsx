import { useState } from "react";
import { useApp } from "../state/context";
import { Avatar, Modal, PageHeading } from "../components/UI";
import { ProfileForm } from "../components/Forms";

export default function Profile() {
  const { user, updateUser } = useApp();
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(false);
  return (
    <>
      <PageHeading
        eyebrow="THE PLAYER BEHIND THE NAME"
        title="Your profile"
        subtitle="A familiar face in every group."
      />
      <div className="profile-card">
        <div className="profile-cover" />
        <div className="profile-card-body">
          <Avatar name={user.name} photo={user.photo} large />
          <h2>{user.name}</h2>
          <p className="muted">@{user.username || "player"}</p>
          <dl className="profile-details">
            <div>
              <dt>Full name</dt>
              <dd>{user.name}</dd>
            </div>
            <div>
              <dt>Username</dt>
              <dd>@{user.username || "player"}</dd>
            </div>
            <div>
              <dt>Email</dt>
              <dd>{user.email}</dd>
            </div>
          </dl>
          <button
            className="button primary"
            onClick={() => {
              setEditing(true);
              setSaved(false);
            }}
          >
            Edit profile
          </button>
          {saved && (
            <p className="success" role="status">
              Profile updated.
            </p>
          )}
        </div>
      </div>
      {editing && (
        <Modal title="Edit your profile" onClose={() => setEditing(false)}>
          <ProfileForm
            onSave={(values) => {
              updateUser(values);
              setEditing(false);
              setSaved(true);
            }}
          />
        </Modal>
      )}
    </>
  );
}
