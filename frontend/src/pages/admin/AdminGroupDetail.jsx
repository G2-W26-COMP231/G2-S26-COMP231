import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import client from "../../api/client";
import AdminTabs from "./AdminTabs";
import Modal from "../../components/Modal";

export default function AdminGroupDetail() {
  const { groupId } = useParams();
  const [details, setDetails] = useState(null);
  const [members, setMembers] = useState(null);
  const [error, setError] = useState("");
  const [confirmRemove, setConfirmRemove] = useState(null);
  const [confirmDeleteGroup, setConfirmDeleteGroup] = useState(false);
  const [busy, setBusy] = useState(false);

  function load() {
    client.get(`/admin/groups/${groupId}`).then((res) => setDetails(res.data)).catch((err) =>
      setError(err.response?.data?.error || "Could not load this group.")
    );
    client.get(`/admin/groups/${groupId}/members`).then((res) => setMembers(res.data.members)).catch(() => {});
  }

  useEffect(load, [groupId]);

  async function handleRemoveMember() {
    setBusy(true);
    try {
      await client.delete(`/admin/groups/${groupId}/members/${confirmRemove.id}`);
      setConfirmRemove(null);
      load();
    } catch (err) {
      setError(err.response?.data?.error || "Could not remove this member.");
      setConfirmRemove(null);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="content-area">
      <AdminTabs />
      {error && <p className="error-text">{error}</p>}
      {!details && !error && <p className="muted">Loading...</p>}
      {details && (
        <>
          <div className="card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <h2 style={{ margin: 0 }}>{details.group.name}</h2>
                <p className="muted">Organized by {details.group.organizerId?.name || "Unknown"}</p>
              </div>
              <button className="danger" onClick={() => setConfirmDeleteGroup(true)}>Delete group</button>
            </div>
            <p style={{ whiteSpace: "pre-wrap" }}> {details.group.description || <span className="muted">No description.</span>}</p>
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap", fontSize: "0.85rem" }}>
              <span>{details.summary.memberCount} members</span>
              <span>{details.summary.eventCount} events</span>
              <span>{details.summary.messageCount} messages</span>
              <span>{details.summary.expenseCount} expenses</span>
              <span>{details.summary.reportCount} reports</span>
            </div>
          </div>

          <h2 style={{ marginTop: 24 }}>Members</h2>
          <div className="card">
            {members === null && <p className="muted">Loading...</p>}
            {members && members.length === 0 && <div className="empty-state">No members.</div>}
            {members && members.map((m) => (
              <div className="list-row" key={m.id}>
                <span>
                  {m.name} <span className="muted">({m.email})</span> <span className="role-badge">{m.role}</span>{" "}
                  {m.status === "banned" && <span className="status-pill">banned</span>}
                </span>
                {m.role !== "organizer" && (
                  <button className="danger" onClick={() => setConfirmRemove(m)}>Remove</button>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {confirmRemove && (
        <Modal
          title={`Remove ${confirmRemove.name} from this group?`}
          description="They will lose access to this group's events, chat, and expenses."
          confirmLabel="Remove"
          busy={busy}
          onCancel={() => setConfirmRemove(null)}
          onConfirm={handleRemoveMember}
        />
      )}

      {confirmDeleteGroup && (
        <Modal
          title={`Delete "${details.group.name}"?`}
          description="This permanently deletes the group and all of its data. This cannot be undone."
          confirmLabel="Delete group"
          busy={busy}
          onCancel={() => setConfirmDeleteGroup(false)}
          onConfirm={async () => {
            setBusy(true);
            try {
              await client.delete(`/admin/groups/${groupId}`);
              window.location.href = "/admin/groups";
            } catch (err) {
              setError(err.response?.data?.error || "Could not delete this group.");
              setConfirmDeleteGroup(false);
              setBusy(false);
            }
          }}
        />
      )}
    </div>
  );
}