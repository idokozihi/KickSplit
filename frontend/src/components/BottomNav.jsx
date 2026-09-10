import { NavLink } from "react-router-dom";
import { Icon } from "./UI";

export default function BottomNav() {
  return (
    <nav className="bottom-nav" aria-label="Main navigation">
      {["Home", "Games", "Groups", "Profile"].map((item) => (
        <NavLink
          key={item}
          to={`/${item.toLowerCase()}`}
          className={({ isActive }) =>
            isActive ? "nav-item active" : "nav-item"
          }
        >
          <Icon name={item.toLowerCase()} />
          <span>{item}</span>
        </NavLink>
      ))}
    </nav>
  );
}
