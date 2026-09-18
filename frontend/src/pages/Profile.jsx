import { useState } from "react";
import { useApp } from "../state/context";
import { Avatar, Icon, Modal, PageHeading } from "../components/UI";
import { ProfileForm } from "../components/Forms";

export default function Profile() {
  const { user, updateUser } = useApp();
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(false);
  return (
    <div className="profile-screen">
      <PageHeading
        title="Your profile"
      />
      <div className="profile-layout">
        <header className="profile-hero">
          <Avatar name={user.name} photo={user.photo} large />
          <div><span className="profile-hero-label">PLAYER PROFILE</span><h2>{user.name}</h2><p>@{user.username || "player"}</p></div>
        </header>
        <section className="profile-information" aria-label="Your information">
          <div className="section-heading"><h2>Your information</h2><Icon name="profile" size={18} /></div>
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
            className="button primary profile-edit"
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
        </section>
      </div>
      {editing && (
        <Modal title="Edit your profile" onClose={() => setEditing(false)}>
          <ProfileForm
            onSave={async (values) => {
              await updateUser(values);
              setEditing(false);
              setSaved(true);
            }}
          />
        </Modal>
      )}
    </div>
  );
}
