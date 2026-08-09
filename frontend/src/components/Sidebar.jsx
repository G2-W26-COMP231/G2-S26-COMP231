import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { HomeIcon, GroupsIcon, ProfileIcon, SettingsIcon, ShieldIcon } from "./icons";

/**
 * The main nav sidebar. Only shows once someone's logged in. If they're an
 * admin, "CrewUp Admin" shows in the header and a System Reports link
 * appears at the bottom.
 */
export default function Sidebar() {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) return null;

  const isAdmin = user.role === "admin";
  const isActive = (path) => (path === "/" ? location.pathname === "/" : location.pathname.startsWith(path));

  return (
    <aside className="sidebar">
      <Link to="/" className="brand">
        <span className="logo-circle">C</span>
        CrewUp{isAdmin && " Admin"}
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
        {isAdmin && (
          <Link to="/admin" className={isActive("/admin") ? "active" : ""}>
            <ShieldIcon /> System Reports
          </Link>
        )}
      </nav>
    </aside>
  );
}