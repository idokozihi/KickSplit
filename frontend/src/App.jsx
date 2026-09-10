import { Routes, Route } from "react-router-dom";

import AppLayout from "./components/AppLayout";

import Login from "./pages/Login";
import ProfileSetup from "./pages/ProfileSetup";
import Home from "./pages/Home";
import Games from "./pages/Games";
import Groups from "./pages/Groups";
import Group from "./pages/Group";
import Game from "./pages/Game";
import TeamProposals from "./pages/TeamProposals";
import Profile from "./pages/Profile";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/profile-setup" element={<ProfileSetup />} />

      <Route element={<AppLayout />}>
        <Route path="/home" element={<Home />} />
        <Route path="/games" element={<Games />} />
        <Route path="/groups" element={<Groups />} />
        <Route path="/groups/:groupId" element={<Group />} />
        <Route path="/games/:gameId" element={<Game />} />
        <Route path="/games/:gameId/proposals" element={<TeamProposals />} />
        <Route path="/profile" element={<Profile />} />
      </Route>
    </Routes>
  );
}

export default App;
