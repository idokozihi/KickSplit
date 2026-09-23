import { useEffect } from "react";
import { Navigate, Outlet, Routes, Route, useLocation, useNavigate } from "react-router-dom";
import { useApp } from "./state/context";

import AppLayout from "./components/AppLayout";

import Login from "./pages/Login";
import ProfileSetup from "./pages/ProfileSetup";
import Home from "./pages/Home";
import Games from "./pages/Games";
import Groups from "./pages/Groups";
import Group from "./pages/Group";
import GroupChat from "./pages/GroupChat";
import Chats from "./pages/Chats";
import Game from "./pages/Game";
import TeamProposals from "./pages/TeamProposals";
import Profile from "./pages/Profile";
import JoinInvite from "./pages/JoinInvite";
import { storePendingInvite } from "./state/invite";

function InviteRoute({ user }) {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) return;
    const from = storePendingInvite(location.pathname);
    navigate("/", { replace: true, state: { from } });
  }, [location.pathname, navigate, user]);

  return user ? <AppLayout /> : null;
}

function App() {
  const { user } = useApp();
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/join/:inviteToken" element={<InviteRoute user={user} />}>
        <Route index element={<JoinInvite />} />
      </Route>
      <Route element={user ? <Outlet /> : <Navigate to="/" replace />}>
      <Route path="/profile-setup" element={<ProfileSetup />} />

      <Route element={<AppLayout />}>
        <Route path="/home" element={<Home />} />
        <Route path="/games" element={<Games />} />
        <Route path="/groups" element={<Groups />} />
        <Route path="/groups/:groupId" element={<Group />} />
        <Route path="/groups/:groupId/chat" element={<GroupChat />} />
        <Route path="/chat" element={<Chats />} />
        <Route path="/games/:gameId" element={<Game />} />
        <Route path="/games/:gameId/proposals" element={<TeamProposals />} />
        <Route path="/profile" element={<Profile />} />
      </Route>
      </Route>
    </Routes>
  );
}

export default App;
