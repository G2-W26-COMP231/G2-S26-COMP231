import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import client from "../api/client";
import GroupTabs from "../components/GroupTabs";

export default function GroupWorkspace() {
  const { groupId } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    client
      .get(`/groups/${groupId}`)
      .then((res) => setData(res.data))
      .catch((err) => setError(err.response?.data?.error || "Could not load this group."));
  }, [groupId]);

  if (error) return <div className="content-area"><p className="error-text">{error}</p></div>;
  if (!data) return <div className="content-area muted">Loading...</div>;

  const { group, myRole, summary } = data;

  return (
    <div className="content-area">
      <GroupTabs groupId={groupId} groupName={group.name} memberCount={summary.memberCount} myRole={myRole} />

      <div style={{ display: "flex", gap: 10, marginBottom: 24 }}>
        <Link to={`/groups/${groupId}/invite`}><button>Invite Member</button></Link>
        <Link to={`/groups/${groupId}/members`}><button className="secondary">Manage Members</button></Link>
      </div>

      <h2>Upcoming Events</h2>
      {summary.upcomingEventCount === 0 && <p className="muted" style={{ marginBottom: 20 }}>No upcoming events yet.</p>}
      {summary.upcomingEventCount > 0 && (
        <div className="event-card" style={{ marginBottom: 24 }}>
          <p className="muted" style={{ margin: 0 }}>
            {summary.upcomingEventCount} upcoming event{summary.upcomingEventCount === 1 ? "" : "s"} -{" "}
            <Link to={`/groups/${groupId}/events`}>View all</Link>
          </p>
        </div>
      )}

      <h2>Recent Expenses</h2>
      {summary.expenseCount === 0 && <p className="muted">No expenses logged yet.</p>}
      {summary.expenseCount > 0 && (
        <div className="expense-row-card filled">
          <span>{summary.expenseCount} logged expense{summary.expenseCount === 1 ? "" : "s"}</span>
          <Link to={`/groups/${groupId}/expenses`} style={{ color: "#fff", textDecoration: "underline" }}>
            View More
          </Link>
        </div>
      )}
    </div>
  );
}
