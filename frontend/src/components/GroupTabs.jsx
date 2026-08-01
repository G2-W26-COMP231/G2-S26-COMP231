import { NavLink } from "react-router-dom";
import NotificationBell from "./NotificationBell";
import MessageBell from "./MessageBell";

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
          <MessageBell />
          <NotificationBell />
        </div>
      </div>
      <div className="tabs">
        <NavLink to={base} end className={({ isActive }) => (isActive ? "active" : "")}>Overview</NavLink>
        <NavLink to={`${base}/chat`} className={({ isActive }) => (isActive ? "active" : "")}>Chat</NavLink>
        <NavLink to={`${base}/events`} className={({ isActive }) => (isActive ? "active" : "")}>Events</NavLink>
        <NavLink to={`${base}/expenses`} className={({ isActive }) => (isActive ? "active" : "")}>Expenses</NavLink>
        <NavLink to={`${base}/members`} className={({ isActive }) => (isActive ? "active" : "")}>Members</NavLink>
      </div>
    </>
  );
}
