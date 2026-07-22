// pages/Chat.jsx

import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import client from "../api/client";
import { getSocket } from "../socket";
import { useAuth } from "../context/AuthContext";
import GroupTabs from "../components/GroupTabs";

function dayLabel(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" });
}

export default function Chat() {
  const { groupId } = useParams();
  const { user } = useAuth();
  const [group, setGroup] = useState(null);
  const [myRole, setMyRole] = useState(null);
  const [organizerIds, setOrganizerIds] = useState(new Set());
  const [messages, setMessages] = useState([]);
  const [hasMore, setHasMore] = useState(false);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");
  const logRef = useRef(null);

  useEffect(() => {
    client.get(`/groups/${groupId}`).then((res) => { setGroup(res.data.group); setMyRole(res.data.myRole); }).catch(() => {});
    client.get(`/groups/${groupId}/members`).then((res) => {
      setOrganizerIds(new Set(res.data.members.filter((m) => m.role === "organizer").map((m) => m.id)));
    }).catch(() => {});
    client.get(`/groups/${groupId}/messages`).then((res) => {
      setMessages(res.data.messages);
      setHasMore(res.data.hasMore);
    });
  }, [groupId]);

  useEffect(() => {
    const socket = getSocket();
    let hasConnectedBefore = false;
    function joinAndCatchUp() {
      socket.emit("group:join", groupId);
      if (hasConnectedBefore) {
        setMessages((prev) => {
          const newest = prev[prev.length - 1];
          if (!newest) return prev;
          client
            .get(`/groups/${groupId}/messages`, { params: { after: newest.sentAt } })
            .then((res) => {
              if (!res.data.messages.length) return;
              setMessages((current) => {
                const existingIds = new Set(current.map((m) => m._id));
                const fresh = res.data.messages.filter((m) => !existingIds.has(m._id));
                return [...current, ...fresh];
              });
            });
          return prev;
        });
      }
      hasConnectedBefore = true;
    }
    socket.on("connect", joinAndCatchUp);
    socket.connect();
    if (socket.connected) joinAndCatchUp();
    function handleNew(message) {
      setMessages((prev) => {
        if (prev.some((m) => m._id === message._id)) return prev;
        return [...prev, message];
      });
    }
    socket.on("message:new", handleNew);
    return () => {
      socket.off("connect", joinAndCatchUp);
      socket.off("message:new", handleNew);
      socket.emit("group:leave", groupId);
    };
  }, [groupId]);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [messages]);

  function loadOlder() {
    const oldest = messages[0];
    if (!oldest) return;
    client
      .get(`/groups/${groupId}/messages`, { params: { before: oldest.sentAt } })
      .then((res) => {
        setMessages((prev) => [...res.data.messages, ...prev]);
        setHasMore(res.data.hasMore);
      });
  }

  function handleSend(e) {
    e.preventDefault();
    const body = draft.trim();
    if (!body) return;
    setError("");
    const socket = getSocket();
    socket.emit("message:send", { groupId, body }, (ack) => {
      if (ack?.error) setError(ack.error);
    });
    setDraft("");
  }

  const groups = [];
  let lastDay = null;
  for (const m of messages) {
    const day = dayLabel(m.sentAt);
    if (day !== lastDay) {
      groups.push({ type: "divider", label: day, key: `div-${m._id}` });
      lastDay = day;
    }
    groups.push({ type: "message", data: m, key: m._id });
  }

  return (
    <div className="content-area">
      <GroupTabs groupId={groupId} groupName={group?.name || "..."} myRole={myRole} />

      {hasMore && (
        <button className="secondary" onClick={loadOlder} style={{ marginBottom: 12 }}>
          Load older messages
        </button>
      )}

      <div className="chat-log" ref={logRef}>
        {messages.length === 0 && <div className="empty-state">No messages yet - say hi!</div>}
        {messages.length > 0 && (
          <div className="chat-date-divider">Conversation started: {dayLabel(messages[0].sentAt)}</div>
        )}
        {groups.map((item) => {
          if (item.type === "divider") {
            return <div className="chat-date-divider" key={item.key}>{item.label}</div>;
          }
          const m = item.data;
          const mine = m.senderId?._id === user?.id || m.senderId?._id === user?._id;
          const senderIsOrganizer = m.senderId && organizerIds.has(m.senderId._id);
          return (
            <div className={`chat-row ${mine ? "mine" : ""}`} key={item.key}>
              {!mine && <div className="chat-avatar">👤</div>}
              <div className="chat-bubble-wrap">
                <div className="chat-sender-line">
                  {mine ? "You" : m.senderId?.name || "Unknown"}
                  {senderIsOrganizer && <span className="organizer-tag"> (Organizer)</span>}
                  <span className="time">{new Date(m.sentAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                </div>
                <div className="chat-bubble">{m.content}</div>
              </div>
            </div>
          );
        })}
      </div>

      <form className="chat-form" onSubmit={handleSend}>
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Type a message......."
          maxLength={2000}
        />
        <button type="submit">▶</button>
      </form>
      {error && <p className="error-text">{error}</p>}
    </div>
  );
}

