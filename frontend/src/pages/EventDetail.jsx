import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import client from "../api/client";
import { getSocket } from "../socket";
import GroupTabs from "../components/GroupTabs";

const RESPONSE_LABELS = { no_response: "No response", going: "Going", maybe: "Maybe", cant_make_it: "Can't make it" }; // Task 8.4 (Aadil) - M13

export default function EventDetail() {
  const { groupId, eventId } = useParams();
  const [group, setGroup] = useState(null);
  const [event, setEvent] = useState(null);
  const [myRole, setMyRole] = useState(null);
  const [myResponse, setMyResponse] = useState("no_response");
  const [rsvpData, setRsvpData] = useState(null);
  const [statusFilter, setStatusFilter] = useState("going");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    client.get(`/groups/${groupId}`).then((res) => {
      setGroup(res.data.group);
      const role = res.data.myRole;
      setMyRole(role);
      if (role === "organizer") {
        client
          .get(`/groups/${groupId}/events/${eventId}/rsvps`)
          .then((r) => { setRsvpData(r.data); setEvent(r.data.event); })
          .catch(() => {});
      }
    });
    client.get(`/groups/${groupId}/events`).then((res) => {
      const found = res.data.events.find((e) => e._id === eventId);
      if (found) setEvent(found);
    });
    client.get(`/groups/${groupId}/events/${eventId}/rsvp`).then((res) => {
      setMyResponse(res.data.rsvp.response);
    }).catch(() => {});
  }, [groupId, eventId]);

  useEffect(() => {
    const socket = getSocket();
    socket.connect();
    socket.emit("group:join", groupId);
    function handleUpdate(payload) {
      if (payload.eventId !== eventId) return;
      setRsvpData((prev) => {
        if (!prev) return prev;
        const rsvps = prev.rsvps.map((r) =>
          r.userId?._id === payload.userId ? { ...r, response: payload.response } : r
        );
        return { ...prev, rsvps };
      });
    }
    socket.on("rsvp:update", handleUpdate);
    return () => {
      socket.off("rsvp:update", handleUpdate);
      socket.emit("group:leave", groupId);
    };
  }, [groupId, eventId]);

  async function submitRsvp(response) {
    setBusy(true);
    setError("");
    try {
      const res = await client.post(`/groups/${groupId}/events/${eventId}/rsvp`, { response });
      setMyResponse(res.data.rsvp.response);
    } catch (err) {
      setError(err.response?.data?.error || "Could not save your RSVP.");
    } finally {
      setBusy(false);
    }
  }

  const filteredRsvps = rsvpData?.rsvps.filter((r) => r.response === statusFilter) || [];
  const countFor = (status) => rsvpData?.rsvps.filter((r) => r.response === status).length || 0;

  return (
    <div className="content-area">
      <GroupTabs groupId={groupId} groupName={group?.name || "..."} myRole={myRole} />

      {event && (
        <>
          <h3 style={{ marginBottom: 4 }}>{event.title}</h3>
          <p className="muted">
            {new Date(event.startTime).toLocaleDateString()} & {new Date(event.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} - {event.location}
          </p>
        </>
      )}

      {myRole === "member" && (
        <>
          <p style={{ fontWeight: 700, color: "var(--brand)", marginTop: 20 }}>Your RSVP</p>
          <div className="rsvp-choice-row">
            <button
              className={myResponse === "going" ? "selected going" : "secondary"}
              disabled={busy}
              onClick={() => { setMyResponse("going"); submitRsvp("going"); }}
            >
              Going
            </button>
            <button
              className={myResponse === "maybe" ? "selected maybe" : "secondary"}
              disabled={busy}
              onClick={() => { setMyResponse("maybe"); submitRsvp("maybe"); }}
            >
              Maybe
            </button>
            <button
              className={myResponse === "cant_make_it" ? "selected cant_make_it" : "secondary"}
              disabled={busy}
              onClick={() => { setMyResponse("cant_make_it"); submitRsvp("cant_make_it"); }}
            >
              Can't make it
            </button>
          </div>
          {error && <p className="error-text">{error}</p>}
        </>
      )}

      {myRole === "organizer" && rsvpData && (
        <>
          <div className="rsvp-status-tabs">
            {["going", "maybe", "cant_make_it"].map((s) => (
              <span
                key={s}
                onClick={() => setStatusFilter(s)}
                style={{ cursor: "pointer", opacity: statusFilter === s ? 1 : 0.45 }}
                className={s}
              >
                {RESPONSE_LABELS[s]} ({countFor(s)})
              </span>
            ))}
          </div>
          <div className="card">
            {filteredRsvps.length === 0 && <div className="empty-state">No one yet.</div>}
            {filteredRsvps.map((r) => (
              <div className="list-row" key={r._id}>
                <span>{r.userId?.name || "Unknown"}</span>
                <span className={statusFilter}>{RESPONSE_LABELS[r.response]}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}