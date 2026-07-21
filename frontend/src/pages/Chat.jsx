// pages/Chat.jsx


import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import client from "../api/client";
import { getSocket } from "../socket";
import { useAuth } from "../context/AuthContext";
import GroupTabs from "../components/GroupTabs";

export default function Chat() {
  const { groupId } = useParams();
  const { user } = useAuth();
  const [group, setGroup] = useState(null);
  const [myRole, setMyRole] = useState(null);
  const [organizerIds, setOrganizerIds] = useState(new Set());
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");
  const logRef = useRef(null);

  useEffect(() => {
    client.get(`/groups/${groupId}`).then((res) => { setGroup(res.data.group); setMyRole(res.data.myRole); }).catch(() => {});
    client.get(`/groups/${groupId}/members`).then((res) => {
      setOrganizerIds(new Set(res.data.members.filter((m) => m.role === "organizer").map((m) => m.id)));
    }).catch(() => {});
  }, [groupId]);

  useEffect(() => {
    const socket = getSocket();
    socket.emit("group:join", groupId);
    socket.connect();

    function handleNew(message) {
      setMessages((prev) => {
        if (prev.some((m) => m._id === message._id)) return prev;
        return [...prev, message];
      });
    }

    socket.on("message:new", handleNew);

    return () => {
      socket.off("message:new", handleNew);
      socket.emit("group:leave", groupId);
    };
  }, [groupId]);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [messages]);

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

  return (
    <div className="content-area">
      <GroupTabs groupId={groupId} groupName={group?.name || "..."} myRole={myRole} />

      <div className="chat-log" ref={logRef}>
        {messages.length === 0 && <div className="empty-state">No messages yet - say hi!</div>}
        {messages.map((m) => {
          const mine = m.senderId?._id === user?.id || m.senderId?._id === user?._id;
          const senderIsOrganizer = m.senderId && organizerIds.has(m.senderId._id);
          return (
            <div className={`chat-row ${mine ? "mine" : ""}`} key={m._id}>
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
