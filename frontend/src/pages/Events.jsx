import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import client from "../api/client";
import GroupTabs from "../components/GroupTabs";

export default function Events() {
  const { groupId } = useParams();
  const [group, setGroup] = useState(null);
  const [events, setEvents] = useState(null);
  const [error, setError] = useState("");
  const [myRole, setMyRole] = useState(null);

  useEffect(() => {
    client.get(`/groups/${groupId}`).then((res) => {
      setGroup(res.data.group);
      setMyRole(res.data.myRole);
    }).catch(() => {});
    client
      .get(`/groups/${groupId}/events`)
      .then((res) => setEvents(res.data.events))
      .catch((err) => setError(err.response?.data?.error || "Could not load events."));
  }, [groupId]);

  return (
    <div className="content-area">
      <GroupTabs groupId={groupId} groupName={group?.name || "..."} myRole={myRole} />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h2>Upcoming Events</h2>
          <p className="subtitle">Tap an event to view details and RSVP</p>
        </div>
        {myRole === "organizer" && (
          <Link to={`/groups/${groupId}/events/new`}><button>+ New Event</button></Link>
        )}
      </div>

      {error && <p className="error-text">{error}</p>}
      {events === null && !error && <p className="muted">Loading...</p>}
      {events && events.length === 0 && <div className="empty-state">No upcoming events yet.</div>}

      {events && events.map((ev) => (
        <Link to={`/groups/${groupId}/events/${ev._id}`} key={ev._id} style={{ textDecoration: "none", color: "inherit" }}>
          <div className="event-card">
            <div style={{ fontWeight: 700 }}>{ev.title}</div>
            <div className="muted">{new Date(ev.startTime).toLocaleDateString()}</div>
          </div>
        </Link>
      ))}
    </div>
  );
}