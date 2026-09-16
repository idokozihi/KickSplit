import { useLocation, useNavigate } from "react-router-dom";
import { Brand } from "../components/UI";
import { ProfileForm } from "../components/Forms";
import { useApp } from "../state/context";
import { pendingInvite } from "../state/invite";

export default function ProfileSetup() {
  const { updateUser } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  return (
    <div className="setup-shell">
      <Brand />
      <div className="setup-card">
        <p className="eyebrow">A QUICK INTRODUCTION</p>
        <h1>Put a name to the player.</h1>
        <p className="muted">Help your teammates recognise you.</p>
        <ProfileForm
          setup
          onSave={async (values) => {
            await updateUser(values);
            navigate(pendingInvite(location.state?.from) || "/home");
          }}
        />
      </div>
    </div>
  );
}
