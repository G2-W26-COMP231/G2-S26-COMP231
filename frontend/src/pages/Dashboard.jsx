import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import client from "../api/client";
import NotificationBell from "../components/NotificationBell";
import MessageBell from "../components/MessageBell";

/** 
 * Gets the first letters of the group name. 
 * The initials are displayed inside the group avatar. 
*/
function getInitials(name) {
  if (!name) return "?";
  const words = name.trim().split(/\s+/).slice(0, 2);
  return words.map((w) => w[0]).join("").toUpperCase();
}

/** 
 * Displays all groups that the current user belongs to. 
 * Organizers can manage their groups while members can open their group workspace.
*/
export default function Dashboard() {
  const [groups, setGroups] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    client
      .get("/groups/mine")
      .then((res) => setGroups(res.data.groups))
      .catch((err) => setError(err.response?.data?.error || "Could not load your groups."));
  }, []);

  return (
    <div className="content-area">
      <div className="page-topbar">
        <div>
          <h1>Your Groups</h1>
          <p className="subtitle">Groups where you are the organizer, and regular member</p>
        </div>
        <div className="icons">
          <MessageBell />
          <NotificationBell />
        </div>
      </div>

      {error && <p className="error-text">{error}</p>}

      {groups === null && !error && <p className="muted">Loading...</p>}

      {groups && groups.length === 0 && (
        <div className="empty-state">You're not in any groups yet. Create one to get started.</div>
      )}

      {groups && groups.map((g) => {
        const isOrganizer = g.myRole === "organizer";
        const inner = (
          <div className="group-card-main">
            <div className="group-card-avatar">{getInitials(g.name)}</div>
            <div className="group-card-info">
              <div className="group-card-name">{g.name}</div>
              <div className="muted">
                {new Date(g.createdAt).toLocaleDateString()} · {g.myRole}
              </div>
            </div>
          </div>
        );
        return isOrganizer ? (
          <div className="group-card" key={g._id}>
            {inner}
            <Link to={`/groups/${g._id}`}><button>Manage</button></Link>
          </div>
        ) : (
          <Link to={`/groups/${g._id}`} key={g._id} style={{ textDecoration: "none", color: "inherit" }}>
            <div className="group-card clickable">
              {inner}
              <span className="muted">Open →</span>
            </div>
          </Link>
        );
      })}

      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 20 }}>
        <Link to="/groups/new"><button>+ Create Group</button></Link>
      </div>
    </div>
  );
}