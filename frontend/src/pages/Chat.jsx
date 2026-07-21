// pages/Chat.jsx

import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import client from "../api/client"; 
import { getSocket } from "../socket";
import GroupTabs from "../components/GroupTabs";

function dayLabel(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" });
}

export default function Chat() {
  const { groupId } = useParams();
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");
  const [group, setGroup] = useState(null);
  const [myRole, setMyRole] = useState(null);
  const [messages, setMessages] = useState([]);
  const logRef = useRef(null);

  function handleSend(e) {
    e.preventDefault();
    const body = draft.trim();
    if (!body) return;
    setError("");
    const socket = getSocket();
    socket.emit("message:send", { groupId, body, clientSentAt: Date.now() }, (ack) => {
      if (ack?.error) setError(ack.error);
    });
    setDraft("");
  }

useEffect(() => {
    client.get(`/groups/${groupId}`).then((res) => { setGroup(res.data.group); setMyRole(res.data.myRole); }).catch(() => {});
   }, [groupId]); 

useEffect(() => {
  const socket = getSocket();
  socket.connect();
function handleNew(message) {
  if (message.clientSentAt) {
    const deliveryMs = Date.now() - message.clientSentAt;
    console.log(`Message delivery time: ${deliveryMs}ms`);
    if (deliveryMs > 2000) {
      console.warn("NFR5 warning: message delivery took longer than 2 seconds");
    }
  }

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
      <GroupTabs groupId={groupId} groupName="..." myRole={null} />

      <div className="chat-log">
        {messages.length === 0 && <div className="empty-state">No messages yet - say hi!</div>} 
        {messages.length > 0 && (
          <div className="chat-date-divider">Conversation started: {dayLabel(messages[0].sentAt)}</div>
        )}
        {groups.map((item) => {
          if (item.type === "divider") {
            return ( <div className="chat-date-divider" key={item.key}>{item.label}</div>
            );
        }
          const m = item.data;
      return (
        <div className={`chat-row ${mine ? "mine" : ""}`} key={item.key}>
          {!mine && <div className="chat-avatar">👤</div>}
          <div className="chat-bubble-wrap">
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
