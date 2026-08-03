import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import client from "../../api/client";
import AdminTabs from "./AdminTabs";
import Modal from "../../components/Modal";

export default function AdminGroupDetail() {
  const { groupId } = useParams();
  const [error, setError] = useState("");
  const [confirmRemove, setConfirmRemove] = useState(null);
  const [busy, setBusy] = useState(false);

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
      <div className="empty-state">
        Group member management will appear here.
      </div>
      
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
       </div>
  );
}
