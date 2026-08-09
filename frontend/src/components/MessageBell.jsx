import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import client from "../api/client";
import { getSocket } from "../socket";
import { useAuth } from "../context/AuthContext";

const SEEN_IDS_KEY = "crewup_messagebell_seen_ids";

/** Turns a date into something like "5m ago" for the notification dropdown. */
function timeAgo(dateStr) {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

/** Loads the set of message ids the user has already opened, from localStorage. */
function getSeenIds() {
  try {
    return new Set(JSON.parse(localStorage.getItem(SEEN_IDS_KEY) || "[]"));
  } catch {
    return new Set();
  }
}

/** Saves the seen-ids set back to localStorage, capped at the last 200 so it doesn't grow forever. */
function saveSeenIds(idsSet) {
  const arr = Array.from(idsSet).slice(-200);
  localStorage.setItem(SEEN_IDS_KEY, JSON.stringify(arr));
}

/**
 * Shows recent chat notifications from the user's groups. 
 * New messages update live and disappear after they are viewed
 */
export default function MessageBell() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [seenIds, setSeenIds] = useState(getSeenIds);
  const navigate = useNavigate();

  function load() {
    client.get("/notifications/messages").then((res) => setMessages(res.data.messages)).catch(() => {});
  }

  useEffect(() => { load(); }, []);

  /**
   * Connects the user to all of their group chats. 
   * This allows new message notifications to update live
   */
  useEffect(() => {
    const socket = getSocket();
    let joinedGroupIds = [];

    function joinAllGroups() {
      client.get("/groups/mine").then((res) => {
        joinedGroupIds = res.data.groups.map((g) => g._id);
        joinedGroupIds.forEach((gid) => socket.emit("group:join", gid));
      }).catch(() => {});
    }

    socket.on("connect", joinAllGroups);
    socket.connect();
    if (socket.connected) joinAllGroups();

    /**
     * Handles new chat messages from other group members. 
     * It updates the notification list and shows the newest message first.
     *
     * @param {Object} message - the new message, populated with senderId/groupId
     */
    function handleNew(message) {
      if (message.senderId?._id === user?._id) return;
      setMessages((prev) => {
        const withoutSameGroup = prev.filter((m) => m.groupId?._id !== message.groupId?._id);
        const updated = [message, ...withoutSameGroup];
        updated.sort((a, b) => new Date(b.sentAt) - new Date(a.sentAt));
        return updated.slice(0, 10);
      });
    }
    socket.on("message:new", handleNew);

    return () => {
      socket.off("connect", joinAllGroups);
      socket.off("message:new", handleNew);
      joinedGroupIds.forEach((gid) => socket.emit("group:leave", gid));
    };
  }, [user?._id]);

  /**
   * Marks one message as seen so it drops out of the visible list/count.
   * @param {string} messageId
   */
  function markOneSeen(messageId) {
    setSeenIds((prev) => {
      const next = new Set(prev);
      next.add(messageId);
      saveSeenIds(next);
      return next;
    });
  }

  /**
   * Marks a message seen and navigates straight into that group's chat.
   * @param {Object} message
   */
  function goToMessage(message) {
    markOneSeen(message._id);
    setOpen(false);
    navigate(`/groups/${message.groupId?._id}/chat`);
  }

  const visibleMessages = messages.filter((m) => !seenIds.has(m._id));

  function toggleOpen() {
    const willOpen = !open;
    setOpen(willOpen);
    if (willOpen) {
      load();
    }
  }

  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <button className="icon-btn" onClick={toggleOpen} title="Recent messages">
        💬
      </button>
      {visibleMessages.length > 0 && (
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
          {visibleMessages.length > 9 ? "9+" : visibleMessages.length}
        </span>
      )}
      {open && (
        <div className="notif-dropdown">
          <div className="notif-header">Recent messages</div>
          {visibleMessages.length === 0 && <div className="notif-item muted">No recent messages.</div>}
          {visibleMessages.map((m) => (
            <div
              className="notif-item"
              key={m._id}
              style={{ cursor: "pointer" }}
              onClick={() => goToMessage(m)}
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