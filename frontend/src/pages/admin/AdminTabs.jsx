import { NavLink } from "react-router-dom";

/** The shared tab bar/header for every admin page. */
export default function AdminTabs() {
  return (
    <>
      <div className="page-topbar">
        <div>
          <h1>Admin</h1>
          <p className="subtitle">Moderation, users, and groups across CrewUp</p>
        </div>
      </div>
      <div className="tabs">
        <NavLink to="/admin" end className={({ isActive }) => (isActive ? "active" : "")}>Overview</NavLink>
        <NavLink to="/admin/reports" className={({ isActive }) => (isActive ? "active" : "")}>Reports</NavLink>
        <NavLink to="/admin/users" className={({ isActive }) => (isActive ? "active" : "")}>Users</NavLink>
        <NavLink to="/admin/groups" className={({ isActive }) => (isActive ? "active" : "")}>Groups</NavLink>
        <NavLink to="/admin/logs" className={({ isActive }) => (isActive ? "active" : "")}>Activity Log</NavLink>
      </div>
    </>
  );
}