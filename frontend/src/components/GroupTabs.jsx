// components/GroupTabs.jsx
// Group workspace header + tab nav, matching the mockups: group name,
// member count, notification bell top-right.
//
// The Expenses tab only shows for organizers. Members viewing the expense
// list is a separate story - M16 "As a Group Member, I can view shared
// expenses" - which is Iteration 2 scope (Table 12), not Iteration 1, so
// there's no Iteration 1 entry point to it for members yet.
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
