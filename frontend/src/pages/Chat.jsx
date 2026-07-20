// pages/Chat.jsx

import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import client from "../api/client"; 
import { getSocket } from "../socket";
import GroupTabs from "../components/GroupTabs";

export default function Chat() {
  const { groupId } = useParams();
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");

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
  const [group, setGroup] = useState(null);
  const [myRole, setMyRole] = useState(null);
  const [messages, setMessages] = useState([]);
  const logRef = useRef(null);

useEffect(() => {
    client.get(`/groups/${groupId}`).then((res) => { setGroup(res.data.group); setMyRole(res.data.myRole); }).catch(() => {});
   }, [groupId]); 

useEffect(() => {
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

  return (
    <div className="content-area">
      <GroupTabs groupId={groupId} groupName="..." myRole={null} />

      <div className="chat-log">
        {messages.length === 0 && <div className="empty-state">No messages yet - say hi!</div>} 
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