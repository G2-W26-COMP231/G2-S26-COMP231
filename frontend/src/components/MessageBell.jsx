import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import client from "../api/client";

function timeAgo(dateStr) {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function MessageBell() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const navigate = useNavigate();

  function load() {
    client.get("/notifications/messages").then((res) => setMessages(res.data.messages)).catch(() => {});
  }

  useEffect(() => { load(); }, []);

  function goToMessage(groupId) {
    setOpen(false);
    navigate(`/groups/${groupId}/chat`);
  }

  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <button className="icon-btn" onClick={() => setOpen((o) => !o)} title="Recent messages">
        💬
      </button>
      {messages.length > 0 && (
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
          {messages.length > 9 ? "9+" : messages.length}
        </span>
      )}
      {open && (
        <div className="notif-dropdown">
          <div className="notif-header">Recent messages</div>
          {messages.length === 0 && <div className="notif-item muted">No recent messages.</div>}
          {messages.map((m) => (
            <div
              className="notif-item"
              key={m._id}
              style={{ cursor: "pointer" }}
              onClick={() => goToMessage(m.groupId?._id)}
            >
              <div>
                <strong>{m.senderId?.name || "Someone"}</strong> in <strong>{m.groupId?.name || "a group"}</strong>
              </div>
              <div className="muted" style={{ fontSize: "0.85rem" }}>
                {m.content.length > 60 ? `${m.content.slice(0, 60)}…` : m.content}
              </div>
              <div className="muted" style={{ fontSize: "0.75rem" }}>{timeAgo(m.sentAt)}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}