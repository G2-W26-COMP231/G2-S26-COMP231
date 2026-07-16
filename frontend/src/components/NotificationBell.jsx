// components/NotificationBell.jsx

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import client from "../api/client";

export default function NotificationBell() {
    
  const [open, setOpen] = useState(false);
  const [invites, setInvites] = useState([]);
  const [busyToken, setBusyToken] = useState(null);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  // Load the logged-in user's pending invitations.
  async function loadInvitations() {
    try {
      const response = await client.get("/invitations/mine");

      setInvites(response.data.invites || []);
      setError("");
    } catch (err) {
      setError(
        err.response?.data?.error ||
          "Unable to load your pending invitations."
      );
    }
  }

  useEffect(() => {
    loadInvitations();
  }, []);

  // Accept one invitation.
  async function acceptInvite(token) {
    setBusyToken(token);
    setError("");

    try {
      const response = await client.post(
        `/invitations/${token}/accept`
      );

      // Remove the accepted invitation from the dropdown.
      setInvites((previousInvites) =>
        previousInvites.filter(
          (invitation) => invitation.token !== token
        )
      );

      // Open the accepted group's workspace.
      navigate(`/groups/${response.data.groupId}`);
    } catch (err) {
      setError(
        err.response?.data?.error ||
          "Unable to accept the invitation."
      );
    } finally {
      setBusyToken(null);
    }
  }

  return (
    <div style={{ position: "relative" }}>
      {/* Notification bell/button */}
      <button
        type="button"
        className="icon-btn"
        onClick={() => setOpen((previousOpen) => !previousOpen)}
        title="Notifications"
        aria-label="Open notifications"
      >
        ✉️

        {invites.length > 0 && (
          <span
            style={{
              color: "var(--danger)",
              fontWeight: 700,
            }}
          >
            {" "}
            {invites.length}
          </span>
        )}
      </button>

      {/* Notification dropdown */}
      {open && (
        <div className="notif-dropdown">
          <div className="notif-header">Notifications</div>

          {error && (
            <div className="notif-item error">
              {error}
            </div>
          )}

          {invites.length === 0 && !error && (
            <div className="notif-item muted">
              No pending invitations.
            </div>
          )}

          {invites.map((invitation) => (
            <div
              className="notif-item"
              key={invitation._id}
            >
              <div>
                <strong>
                  {invitation.invitedBy?.name || "Someone"}
                </strong>{" "}
                invited you to{" "}
                <strong>
                  {invitation.groupId?.name || "a group"}
                </strong>
              </div>

              <div className="notif-actions">
                <button
                  type="button"
                  disabled={busyToken === invitation.token}
                  onClick={() =>
                    acceptInvite(invitation.token)
                  }
                >
                  {busyToken === invitation.token
                    ? "Accepting..."
                    : "Accept"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}