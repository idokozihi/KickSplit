import { useNavigate } from "react-router-dom";
import { Brand } from "../components/UI";
import { ProfileForm } from "../components/Forms";
import { useApp } from "../state/context";

export default function ProfileSetup() {
  const { updateUser } = useApp();
  const navigate = useNavigate();
  return (
    <div className="setup-shell">
      <Brand />
      <div className="setup-card">
        <p className="eyebrow">A QUICK INTRODUCTION</p>
        <h1>Put a name to the player.</h1>
        <p className="muted">Help your teammates recognise you.</p>
        <ProfileForm
          setup
          onSave={(values) => {
            updateUser(values);
            navigate("/home");
          }}
        />
      </div>
    </div>
  );
}
