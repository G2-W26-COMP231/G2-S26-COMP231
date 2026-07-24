import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { HomeIcon, GroupsIcon, ProfileIcon, SettingsIcon } from "./icons";

export default function Sidebar() {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) return null;

  const isActive = (path) => (path === "/" ? location.pathname === "/" : location.pathname.startsWith(path));

  return (
    <aside className="sidebar">
      <Link to="/" className="brand">
        <span className="logo-circle">C</span>
        CrewUp
      </Link>
      <nav>
        <Link to="/" className={isActive("/") && !isActive("/groups") ? "active" : ""}>
          <HomeIcon /> Home
        </Link>
        <Link to="/" className={isActive("/groups") ? "active" : ""}>
          <GroupsIcon /> Groups
        </Link>
        <Link to="/profile" className={isActive("/profile") ? "active" : ""}>
          <ProfileIcon /> Profile
        </Link>
        <Link to="/settings" className={isActive("/settings") ? "active" : ""}>
          <SettingsIcon /> Settings
        </Link>
      </nav>
    </aside>
  );
}