import { NavLink } from "react-router-dom";
import NotificationBell from "./NotificationBell";
import MessageBell from "./MessageBell";

/**
 * The header + tab bar that sits at the top of every group page (Overview,
 * Chat, Events, Expenses, Members). Just needs the group's id/name so it
 * can build the right links.
 *
 * @param {Object} props
 * @param {string} props.groupId
 * @param {string} props.groupName
 * @param {number} [props.memberCount] - shown under the title if given
 * @param {string} [props.myRole]
 */
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