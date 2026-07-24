import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import client from "../api/client";

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [invites, setInvites] = useState([]);
  const [busyToken, setBusyToken] = useState(null);
  const navigate = useNavigate();

  function load() {
    client.get("/invitations/mine").then((res) => setInvites(res.data.invites)).catch(() => {});
  }

  useEffect(() => { load(); }, []);

  async function acceptInvite(token) {
    setBusyToken(token);
    try {
      const res = await client.post(`/invitations/${token}/accept`);
      setInvites((prev) => prev.filter((i) => i.token !== token));
      navigate(`/groups/${res.data.groupId}`);
    } finally {
      setBusyToken(null);
    }
  }

  return (
    <div style={{ position: "relative" }}>
      <button className="icon-btn" onClick={() => setOpen((o) => !o)} title="Notifications">
        ✉️{invites.length > 0 && <span style={{ color: "var(--danger)", fontWeight: 700 }}> {invites.length}</span>}
      </button>
      {open && (
        <div className="notif-dropdown">
          <div className="notif-header">Notifications</div>
          {invites.length === 0 && <div className="notif-item muted">No pending invitations.</div>}
          {invites.map((inv) => (
            <div className="notif-item" key={inv._id}>
              <div>
                <strong>{inv.invitedBy?.name || "Someone"}</strong> invited you to{" "}
                <strong>{inv.groupId?.name || "a group"}</strong>
              </div>
              <div className="notif-actions">
                <button disabled={busyToken === inv.token} onClick={() => acceptInvite(inv.token)}>
                  Accept
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
