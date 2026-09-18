import { useState } from "react";
import { Link } from "react-router-dom";
import { useApp } from "../state/context";
import { gameDays } from "../state/mock";
import { Avatar, Icon, Modal } from "../components/UI";
import { ProfileForm } from "../components/Forms";

export default function Profile() {
  const { user, groups, games, updateUser } = useApp();
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(false);
  const now = new Date();
  const todayKey = [now.getFullYear(), String(now.getMonth() + 1).padStart(2, "0"), String(now.getDate()).padStart(2, "0")].join("-");
  const upcoming = games.filter((game) => gameDays(game).some((day) => day.date.slice(0, 10) >= todayKey)).length;
  return (
    <div className="profile-screen">
      <header className="profile-topbar"><h1>Profile</h1></header>
      <div className="profile-layout">
        <header className="profile-identity">
          <Avatar name={user.name} photo={user.photo} large />
          <h2>{user.name}</h2>
          <p>@{user.username || "player"}</p>
        </header>
        <div className="profile-stat-tiles" aria-label="Your activity">
          <div><strong>{groups.length}</strong><span>Groups</span></div>
          <div><strong>{games.length}</strong><span>Games</span></div>
          <div><strong>{upcoming}</strong><span>Upcoming</span></div>
          <div><strong>{games.length - upcoming}</strong><span>Past</span></div>
        </div>
        <nav className="profile-menu" aria-label="Profile options">
          <button onClick={() => { setEditing(true); setSaved(false); }}><Icon name="profile" size={17} /><span>Edit profile</span><span aria-hidden="true">›</span></button>
          <Link to="/groups"><Icon name="groups" size={17} /><span>My groups</span><small>{groups.length}</small><span aria-hidden="true">›</span></Link>
          <Link to="/games"><Icon name="games" size={17} /><span>Games &amp; history</span><span aria-hidden="true">›</span></Link>
          <Link to="/chat"><Icon name="chat" size={17} /><span>Group chats</span><span aria-hidden="true">›</span></Link>
        </nav>
        <p className="profile-email">{user.email}</p>
        {saved && <p className="success" role="status">Profile updated.</p>}
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
