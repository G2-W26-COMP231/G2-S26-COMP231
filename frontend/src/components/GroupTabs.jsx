import { NavLink } from "react-router-dom";
import NotificationBell from "./NotificationBell";

export default function GroupTabs({ groupId, groupName, memberCount, myRole }) {
  const base = `/groups/${groupId}`;
  return (
    <>
      <div className="page-topbar">
        <div>
          <h1>{groupName}</h1>
          {memberCount != null && <p className="subtitle" style={{ marginBottom: 0 }}>{memberCount} members</p>}
        </div>
        <div className="icons">
          <span className="icon-btn" title="Chat">💬</span>
          <NotificationBell />
        </div>
      </div>
      <div className="tabs">
        <NavLink to={base} end className={({ isActive }) => (isActive ? "active" : "")}>Overview</NavLink>
        <NavLink to={`${base}/chat`} className={({ isActive }) => (isActive ? "active" : "")}>Chat</NavLink>
        <NavLink to={`${base}/events`} className={({ isActive }) => (isActive ? "active" : "")}>Events</NavLink>
        {myRole === "organizer" && (
          <NavLink to={`${base}/expenses`} className={({ isActive }) => (isActive ? "active" : "")}>Expenses</NavLink>
        )}
        <NavLink to={`${base}/members`} className={({ isActive }) => (isActive ? "active" : "")}>Members</NavLink>
      </div>
    </>
  );
}
