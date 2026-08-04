import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import client from "../api/client";
import NotificationBell from "../components/NotificationBell";
import MessageBell from "../components/MessageBell";

export default function Dashboard() {
  const [groups, setGroups] = useState(null);
  const [invites, setInvites] = useState([]);
  const [error, setError] = useState("");
  const [busyToken, setBusyToken] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    client
      .get("/groups/mine")
      .then((res) => setGroups(res.data.groups))
      .catch((err) => setError(err.response?.data?.error || "Could not load your groups."));
    client
      .get("/invitations/mine")
      .then((res) => setInvites(res.data.invites))
      .catch(() => {});
  }, []);

  async function acceptInvite(token) {
    setBusyToken(token);
    try {
      const res = await client.post(`/invitations/${token}/accept`);
      setInvites((prev) => prev.filter((i) => i.token !== token));
      navigate(`/groups/${res.data.groupId}`);
    } catch (err) {
      setError(err.response?.data?.error || "Could not accept this invitation.");
    } finally {
      setBusyToken(null);
    }
  }

  async function declineInvite(token) {
    setBusyToken(token);
    try {
      await client.post(`/invitations/${token}/decline`);
      setInvites((prev) => prev.filter((i) => i.token !== token));
    } catch (err) {
      setError(err.response?.data?.error || "Could not decline this invitation.");
    } finally {
      setBusyToken(null);
    }
  }

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

      {invites.length > 0 && (
        <>
          <h2>Pending invitations</h2>
          <div className="card" style={{ marginBottom: 20 }}>
            {invites.map((inv) => (
              <div className="list-row" key={inv.token}>
                <span>
                  {inv.groupId?.name || "A group"} <span className="muted">— invited by {inv.invitedBy?.name || "someone"}</span>
                </span>
                <span style={{ display: "flex", gap: 8 }}>
                  <button disabled={busyToken === inv.token} onClick={() => acceptInvite(inv.token)}>Accept</button>
                  <button className="secondary" disabled={busyToken === inv.token} onClick={() => declineInvite(inv.token)}>Decline</button>
                </span>
              </div>
            ))}
          </div>
        </>
      )}

      {groups === null && !error && <p className="muted">Loading...</p>}

      {groups && groups.length === 0 && (
        <div className="empty-state">You're not in any groups yet. Create one to get started.</div>
      )}

      {groups && groups.map((g) => {
        const isOrganizer = g.myRole === "organizer";
        return isOrganizer ? (
          <div className="group-card" key={g._id}>
            <div>
              <div style={{ fontWeight: 700, fontSize: "1.05rem" }}>{g.name}</div>
              <div className="muted">
                {new Date(g.createdAt).toLocaleDateString()} · {g.myRole}
              </div>
            </div>
            <Link to={`/groups/${g._id}`}><button>Manage</button></Link>
          </div>
        ) : (
          <Link to={`/groups/${g._id}`} key={g._id} style={{ textDecoration: "none", color: "inherit" }}>
            <div className="group-card clickable">
              <div>
                <div style={{ fontWeight: 700, fontSize: "1.05rem" }}>{g.name}</div>
                <div className="muted">
                  {new Date(g.createdAt).toLocaleDateString()} · {g.myRole}
                </div>
              </div>
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