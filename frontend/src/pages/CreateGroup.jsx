// pages/CreateGroup.jsx
// M1 - As a Group Organizer, I can create a group.
// Note: the creator automatically becomes the first member with organizer
// rights (handled server-side). Note: inviting members happens afterward,
// in a separate step (M2) - creating a group does not start the invite flow.
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import client from "../api/client";

export default function CreateGroup() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!name.trim()) {
      setError("Group name is required.");
      return;
    }
    setBusy(true);
    try {
      const res = await client.post("/groups", { name, description });
      // Land on the new group's workspace, NOT the invite flow - inviting is
      // a separate, deliberate step (M2).
      navigate(`/groups/${res.data.group._id}`);
    } catch (err) {
      setError(err.response?.data?.error || "Could not create the group.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="content-area" style={{ maxWidth: 480 }}>
      <h1>Create New Group</h1>
      <form onSubmit={handleSubmit}>
        <label htmlFor="name">Group Name</label>
        <input id="name" value={name} onChange={(e) => setName(e.target.value)} maxLength={100} required />

        <label htmlFor="description">Description (Optional)</label>
        <textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} maxLength={500} />

        <label htmlFor="privacy">Privacy</label>
        <input id="privacy" value="Private (Invite Only)" disabled title="CrewUp groups are always invite-only - there's no public discovery." />

        {error && <p className="error-text">{error}</p>}

        <div className="form-actions">
          <button type="submit" disabled={busy}>{busy ? "Creating..." : "Create Group"}</button>
        </div>
      </form>
    </div>
  );
}