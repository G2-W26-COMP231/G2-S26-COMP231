import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import client from "../api/client";
import GroupTabs from "../components/GroupTabs";
import Modal from "../components/Modal";
import { useAuth } from "../context/AuthContext";

export default function Members() {
  const { groupId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [group, setGroup] = useState(null);
  const [myRole, setMyRole] = useState(null);
  const [members, setMembers] = useState([]);
  const [error, setError] = useState("");
  const [confirmRemove, setConfirmRemove] = useState(null);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [busy, setBusy] = useState(false);

  function loadMembers() {
    client
      .get(`/groups/${groupId}/members`)
      .then((res) => setMembers(res.data.members))
      .catch((err) => setError(err.response?.data?.error || "Could not load members."));
  }

  useEffect(() => {
    client.get(`/groups/${groupId}`).then((res) => {
      setGroup(res.data.group);
      setMyRole(res.data.myRole);
    }).catch(() => {});
    loadMembers();
  }, [groupId]);

  async function handleRemove() {
    setBusy(true);
    try {
      await client.delete(`/groups/${groupId}/members/${confirmRemove.id}`);
      setConfirmRemove(null);
      loadMembers();
    } catch (err) {
      setError(err.response?.data?.error || "Could not remove this member.");
      setConfirmRemove(null);
    } finally {
      setBusy(false);
    }
  }

  async function handleLeave() {
    setBusy(true);
    try {
      await client.post(`/groups/${groupId}/leave`);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.error || "Could not leave this group.");
      setConfirmLeave(false);
      setBusy(false);
    }
  }

  return (
    <div className="content-area">
      <GroupTabs groupId={groupId} groupName={group?.name || "..."} memberCount={members.length || undefined} myRole={myRole} />
      <h2>Members</h2>
      {error && <p className="error-text">{error}</p>}
      
      <div className="card">
        {members.length === 0 && !error && <p className="muted">Loading...</p>}
        {members.map((m) => (
          <div className="list-row" key={m.id}>
            <span>{m.name}</span>
            <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span className="role-badge">{m.role === "organizer" ? "Organizer" : "Member"}</span>
              {myRole === "organizer" && m.role !== "organizer" && (
                <button className="danger" onClick={() => setConfirmRemove(m)}>Remove</button>
              )}
            </span>
          </div>
        ))}
      </div>

      {myRole === "member" && (
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 20 }}>
          <button className="danger" onClick={() => setConfirmLeave(true)}>Leave group</button>
        </div>
      )}

      {confirmRemove && (
        <Modal
          title={`Remove ${confirmRemove.name} from ${group?.name || "this group"}?`}
          description="They will lose access to this group's events, chat, and expenses."
          confirmLabel="Remove"
          busy={busy}
          onCancel={() => setConfirmRemove(null)}
          onConfirm={handleRemove}
        />
      )}

      {confirmLeave && (
        <Modal
          title={`Leave ${group?.name || "this group"}?`}
          description="You will lose access to this group's events, chat, and expenses unless you're invited back."
          confirmLabel="Leave group"
          busy={busy}
          onCancel={() => setConfirmLeave(false)}
          onConfirm={handleLeave}
        />
      )}
    </div>
  );
}