import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import client from "../../api/client";
import AdminTabs from "./AdminTabs";
import Modal from "../../components/Modal";

export default function AdminGroups() {
  const [groups, setGroups] = useState(null);
  const [error, setError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [busy, setBusy] = useState(false);
  function load() {
    client
      .get("/admin/groups")
      .then((res) => setGroups(res.data.groups))
      .catch((err) => setError(err.response?.data?.error || "Could not load groups."));
  }
  useEffect(load, []);
  async function handleDelete() {
    setBusy(true);
    try {
      await client.delete(`/admin/groups/${confirmDelete._id}`);
      setConfirmDelete(null);
      load();
    } catch (err) {
      setError(err.response?.data?.error || "Could not delete this group.");
      setConfirmDelete(null);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="content-area">
      <AdminTabs />
      {error && <p className="error-text">{error}</p>}
      {groups === null && !error && <p className="muted">Loading...</p>}
      {groups && groups.length === 0 && <div className="empty-state">No groups yet.</div>}
      <div className="card">
        {groups && groups.map((g) => (
          <div className="list-row" key={g._id}>
            <span>
              {g.name} <span className="muted">— {g.memberCount} members · organized by {g.organizerId?.name || "Unknown"}</span>
            </span>
            <span style={{ display: "flex", gap: 10 }}>
              <Link to={`/admin/groups/${g._id}`}><button className="secondary">View</button></Link>
              <button className="danger" onClick={() => setConfirmDelete(g)}>Delete</button>
            </span>
          </div>
        ))}
      </div>
      {confirmDelete && (
        <Modal
          title={`Delete "${confirmDelete.name}"?`}
          description="This permanently deletes the group, its members, events, messages, and expenses. This cannot be undone."
          confirmLabel="Delete group"
          busy={busy}
          onCancel={() => setConfirmDelete(null)}
          onConfirm={handleDelete}
        />
      )}
    </div>
  );
}