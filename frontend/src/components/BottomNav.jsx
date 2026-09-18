import { NavLink, useLocation } from "react-router-dom";
import { Icon } from "./UI";

export default function BottomNav() {
  const { pathname } = useLocation();
  return (
    <nav className="bottom-nav" aria-label="Main navigation">
      {["Home", "Games", "Groups", "Chat", "Profile"].map((item) => (
        <NavLink
          key={item}
          to={`/${item.toLowerCase()}`}
          className={({ isActive }) =>
            isActive || (item === "Chat" && /^\/groups\/[^/]+\/chat$/.test(pathname)) ? "nav-item active" : "nav-item"
          }
        >
          <Icon name={item.toLowerCase()} />
          <span>{item}</span>
        </NavLink>
      ))}
    </nav>
  );
}
