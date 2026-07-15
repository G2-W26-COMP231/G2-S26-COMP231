// pages/InviteMembers.jsx
// M2 - As a Group Organizer, I can invite members by email.
// Send side only; accepting is a separate story (M10). Sends one request
// per email chip since the backend endpoint takes one at a time.

import { useEffect, useState } from "react"; 
import { useNavigate, useParams } from "react-router-dom"; 
import client from "../api/client";

export default function InviteMembers() {
  const { groupId } = useParams();          
  const navigate = useNavigate();  
  const [emails, setEmails] = useState([""]);
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState([]);
  const [busy, setBusy] = useState(false);
           
  function loadPending() {
    client.get(`/groups/${groupId}/invitations`).then((res) => setPending(res.data.invites));
  }
  useEffect(() => { loadPending(); }, [groupId]);

  function updateEmail(i, value) {
    setEmails((prev) => prev.map((e, idx) => (idx === i ? value : e)));
  }
  function removeEmail(i) {
    setEmails((prev) => prev.filter((_, idx) => idx !== i));
  }
  function addEmailField() {
    setEmails((prev) => [...prev, ""]);
  }

  async function handleSubmit(e) {
    e.preventDefault();
  
    setBusy(true);
    const failures = [];
    let anyEmailSent = false;
    let anyEmailNotSent = false;
    for (const email of toSend) {
      try {
        const res = await client.post(`/groups/${groupId}/invitations`, { email });
        if (res.data.emailSent) anyEmailSent = true;
        else anyEmailNotSent = true;
      } catch (err) {
        failures.push(`${email}: ${err.response?.data?.error || "failed"}`);
      }
    }
    setBusy(false);
    loadPending();
    setEmails([""]);
    setMessage("");
  }
  
  return (
    <div className="content-area" style={{ maxWidth: 520 }}>
      <h1>Invite Members</h1>
      <form onSubmit={handleSubmit}>
        {emails.map((email, i) => (
          <div className="email-chip-row" key={i}>
            <input
              type="email"
              value={email}
              placeholder="name@email.com"
              onChange={(e) => updateEmail(i, e.target.value)}
            />
            {emails.length > 1 && (
              <button type="button" className="remove-chip" onClick={() => removeEmail(i)}>×</button>
            )}
          </div>
        ))}
        <button type="button" className="add-email-link" onClick={addEmailField}>+ Add another email</button>

        <label htmlFor="message">Message (Optional)</label>
        <input id="message" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Join the group..." />

        <div className="form-actions">
          <button type="submit" disabled={busy}>{busy ? "Sending..." : "Send Invites"}</button>
          <button type="button" className="secondary" onClick={() => navigate(`/groups/${groupId}`)}>Close</button>
        </div>
      </form>

      <div className="card" style={{ marginTop: 24 }}>
        <h2>Pending invitations</h2>
        {pending.length === 0 && <div className="empty-state">No pending invitations.</div>}
        {pending.map((inv) => (
          <div className="list-row" key={inv._id}>
            <span>{inv.email}</span>
            <span className="status-pill">pending</span>
      </div>
       ))}
    </div>
    </div>
  );
}