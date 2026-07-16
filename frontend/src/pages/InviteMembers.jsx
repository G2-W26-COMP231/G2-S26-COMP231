// pages/InviteMembers.jsx
// M2 - As a Group Organizer, I can invite members by email.
// Note: this is the send side only; accepting is a separate story (M10).
// Matches the mockup: multiple email chips can be queued up and sent
// together, with an optional message. The backend invite endpoint takes one
// email at a time, so the frontend sends one request per chip and reports
// which ones failed (e.g. already a member, already pending).
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import client from "../api/client";

export default function InviteMembers() {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const [emails, setEmails] = useState([""]);
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState([]);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");
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
    setError("");
    setNote("");
    const toSend = emails.map((e) => e.trim()).filter(Boolean);
    if (toSend.length === 0) {
      setError("Add at least one email address.");
      return;
    }
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
    if (failures.length > 0) {
      setError(failures.join(" · "));
    }
    if (anyEmailSent && !anyEmailNotSent) {
      setNote("Invite email sent.");
    } else if (anyEmailNotSent) {
      setNote(
        "Invitation created, but the email wasn't sent (SendGrid isn't configured on the server yet - check the server console for the invite link)."
      );
    }
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
        {/* Not sent anywhere yet - SendGrid (the external service in the
            architecture diagram) isn't wired up, so there's no email to
            attach this message to. Collected here for UI parity with the
            mockup; hook it up once M2's email-sending is implemented. */}

        {error && <p className="error-text">{error}</p>}
        {note && <p className="muted" style={{ marginTop: 8 }}>{note}</p>}

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
