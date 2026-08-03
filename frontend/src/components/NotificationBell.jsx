import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import client from "../api/client";

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [invites, setInvites] = useState([]);
  const [responses, setResponses] = useState([]);
  const [busyToken, setBusyToken] = useState(null);
  const navigate = useNavigate();

  function load() {
    client.get("/invitations/mine").then((res) => setInvites(res.data.invites)).catch(() => {});
    client.get("/invitations/responses").then((res) => setResponses(res.data.responses)).catch(() => {});
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

  async function declineInvite(token) {
    setBusyToken(token);
    try {
      await client.post(`/invitations/${token}/decline`);
      setInvites((prev) => prev.filter((i) => i.token !== token));
    } finally {
      setBusyToken(null);
    }
  }

  function toggleOpen() {
    const willOpen = !open;
    setOpen(willOpen);
    if (willOpen && responses.length > 0) {
      client.post("/invitations/responses/seen").catch(() => {});
    }
    if (!willOpen) {
      setResponses([]);
    }
  }

  const totalCount = invites.length + responses.length;

  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <button className="icon-btn" onClick={toggleOpen} title="Notifications">
        ✉️
      </button>
      {totalCount > 0 && (
        <span
          style={{
            position: "absolute",
            top: -2,
            right: -2,
            minWidth: 16,
            height: 16,
            padding: "0 4px",
            borderRadius: 999,
            background: "var(--danger, #e53935)",
            color: "#fff",
            fontSize: "0.62rem",
            fontWeight: 700,
            lineHeight: "16px",
            textAlign: "center",
            boxShadow: "0 0 0 2px #fff",
          }}
        >
          {totalCount > 9 ? "9+" : totalCount}
        </span>
      )}
      {open && (
        <div className="notif-dropdown">
          <div className="notif-header">Notifications</div>

          {invites.length === 0 && responses.length === 0 && (
            <div className="notif-item muted">Nothing new.</div>
          )}

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
                <button
                  className="secondary"
                  disabled={busyToken === inv.token}
                  onClick={() => declineInvite(inv.token)}
                >
                  Decline
                </button>
              </div>
            </div>
          ))}

          {responses.map((r) => (
            <div className="notif-item" key={r._id}>
              <div>
                <strong>{r.email}</strong>{" "}
                {r.status === "accepted" ? "accepted" : "declined"} your invite to{" "}
                <strong>{r.groupId?.name || "a group"}</strong>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}