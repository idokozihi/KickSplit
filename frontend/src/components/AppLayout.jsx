import { useEffect } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import BottomNav from "./BottomNav";
import { Avatar, Brand } from "./UI";
import { useApp } from "../state/context";

function AppLayout() {
  const { user } = useApp();
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <header className="app-header">
        <Brand />
        <Link
          to="/profile"
          className="header-profile"
          aria-label="Your profile"
        >
          <Avatar name={user.name} photo={user.photo} />
        </Link>
      </header>
      <BottomNav />
      <main id="main" className="main-content" key={pathname}>
        <Outlet />
      </main>
    </div>
  );
}

export default AppLayout;
