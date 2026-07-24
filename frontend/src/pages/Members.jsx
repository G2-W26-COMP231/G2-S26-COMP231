import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import client from "../api/client";
import GroupTabs from "../components/GroupTabs";

export default function Members() {
  const { groupId } = useParams();
  const [group, setGroup] = useState(null);
  const [myRole, setMyRole] = useState(null);
  const [members, setMembers] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    client.get(`/groups/${groupId}`).then((res) => {
      setGroup(res.data.group);
      setMyRole(res.data.myRole);
    }).catch(() => {});
    client
      .get(`/groups/${groupId}/members`)
      .then((res) => setMembers(res.data.members))
      .catch((err) => setError(err.response?.data?.error || "Could not load members."));
  }, [groupId]);

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
            <span className="role-badge">{m.role === "organizer" ? "Organizer" : "Member"}</span>
          </div>
        ))}
      </div>
      <p className="muted" style={{ fontSize: "0.8rem" }}>
        Removing members is coming in a future update.
      </p>
    </div>
  );
}