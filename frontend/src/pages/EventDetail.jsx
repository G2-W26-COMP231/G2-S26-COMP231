import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import client from "../api/client";
import { getSocket } from "../socket";
import GroupTabs from "../components/GroupTabs";
import Modal from "../components/Modal";

const RESPONSE_LABELS = { no_response: "No response", going: "Going", maybe: "Maybe", cant_make_it: "Can't make it" };

export default function EventDetail() {
  const { groupId, eventId } = useParams();
  const navigate = useNavigate();
  const [group, setGroup] = useState(null);
  const [event, setEvent] = useState(null);
  const [myRole, setMyRole] = useState(null);
  const [myResponse, setMyResponse] = useState("no_response");
  const [rsvpData, setRsvpData] = useState(null);
  const [statusFilter, setStatusFilter] = useState("going");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ title: "", location: "", startTime: "", endTime: "", description: "" });
  const [editError, setEditError] = useState("");

  const [confirmCancel, setConfirmCancel] = useState(null);

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

  function toLocalInputValue(date) {
    const d = new Date(date);
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  function openEditForm() {
    setEditForm({
      title: event.title,
      location: event.location,
      startTime: toLocalInputValue(event.startTime),
      endTime: event.endTime ? toLocalInputValue(event.endTime) : "",
      description: event.description || "",
    });
    setEditError("");
    setEditing(true);
  }

  async function handleEditSubmit(e) {
    e.preventDefault();
    setEditError("");

    if (!editForm.title.trim()) {
      setEditError("Title is required.");
      return;
    }
    if (!editForm.location.trim()) {
      setEditError("Location is required.");
      return;
    }
    if (!editForm.startTime) {
      setEditError("Start time is required.");
      return;
    }
    const startDate = new Date(editForm.startTime);
    if (Number.isNaN(startDate.getTime())) {
      setEditError("Start time must be a valid date/time.");
      return;
    }
    if (startDate.getTime() < Date.now()) {
      setEditError("Event date cannot be in the past.");
      return;
    }
    if (editForm.endTime) {
      const endDate = new Date(editForm.endTime);
      if (Number.isNaN(endDate.getTime()) || endDate.getTime() < startDate.getTime()) {
        setEditError("End time must be on or after the start time.");
        return;
      }
    }

    setBusy(true);
    try {
      const payload = {
        title: editForm.title,
        location: editForm.location,
        startTime: new Date(editForm.startTime).toISOString(),
        endTime: editForm.endTime ? new Date(editForm.endTime).toISOString() : null,
        description: editForm.description,
      };
      const res = await client.patch(`/groups/${groupId}/events/${eventId}`, payload);
      setEvent(res.data.event);
      setEditing(false);
    } catch (err) {
      setEditError(err.response?.data?.error || "Could not save these changes.");
    } finally {
      setBusy(false);
    }
  }

  async function handleCancelOrDelete() {
    setBusy(true);
    try {
      const mode = confirmCancel === "delete" ? "?mode=delete" : "";
      await client.delete(`/groups/${groupId}/events/${eventId}${mode}`);
      if (confirmCancel === "delete") {
        navigate(`/groups/${groupId}/events`);
      } else {
        setEvent((prev) => ({ ...prev, isCancelled: true }));
        setConfirmCancel(null);
      }
    } catch (err) {
      setError(err.response?.data?.error || "Could not update this event.");
      setConfirmCancel(null);
    } finally {
      setBusy(false);
    }
  }

  const filteredRsvps = rsvpData?.rsvps.filter((r) => r.response === statusFilter) || [];
  const countFor = (status) => rsvpData?.rsvps.filter((r) => r.response === status).length || 0;

  return (
    <div className="content-area">
      <GroupTabs groupId={groupId} groupName={group?.name || "..."} myRole={myRole} />

      {event && !editing && (
        <>
          <h3 style={{ marginBottom: 4 }}>
            {event.title} {event.isCancelled && <span className="status-pill">Cancelled</span>}
          </h3>
          <p className="muted">
            {new Date(event.startTime).toLocaleDateString()} & {new Date(event.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} - {event.location}
          </p>
          {event.description && <p>{event.description}</p>}

          {myRole === "organizer" && !event.isCancelled && (
            <div className="modal-actions" style={{ justifyContent: "flex-start", marginBottom: 16 }}>
              <button className="secondary" onClick={openEditForm}>Edit event</button>
              <button className="danger" onClick={() => setConfirmCancel("cancel")}>Cancel event</button>
              <button className="danger" onClick={() => setConfirmCancel("delete")}>Delete event</button>
            </div>
          )}
        </>
      )}

      {event && editing && (
        <div className="card" style={{ marginBottom: 20 }}>
          <h3>Edit event</h3>
          <form onSubmit={handleEditSubmit}>
            <label htmlFor="edit-title">Title</label>
            <input id="edit-title" value={editForm.title} onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))} maxLength={150} required />

            <label htmlFor="edit-location">Location</label>
            <input id="edit-location" value={editForm.location} onChange={(e) => setEditForm((f) => ({ ...f, location: e.target.value }))} maxLength={200} required />

            <label htmlFor="edit-start">Start time</label>
            <input id="edit-start" type="datetime-local" min={toLocalInputValue(new Date())} value={editForm.startTime} onChange={(e) => setEditForm((f) => ({ ...f, startTime: e.target.value }))} required />

            <label htmlFor="edit-end">End time (optional)</label>
            <input id="edit-end" type="datetime-local" min={editForm.startTime || undefined} value={editForm.endTime} onChange={(e) => setEditForm((f) => ({ ...f, endTime: e.target.value }))} />

            <label htmlFor="edit-description">Description</label>
            <textarea id="edit-description" value={editForm.description} onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))} maxLength={1000} />

            {editError && <p className="error-text">{editError}</p>}

            <div className="form-actions">
              <button type="button" className="secondary" onClick={() => setEditing(false)} disabled={busy}>Cancel</button>
              <button type="submit" disabled={busy}>{busy ? "Saving..." : "Save changes"}</button>
            </div>
          </form>
        </div>
      )}

      {confirmCancel && (
        <Modal
          title={confirmCancel === "delete" ? "Delete this event?" : "Cancel this event?"}
          description={
            confirmCancel === "delete"
              ? "This permanently deletes the event and all RSVPs. This cannot be undone."
              : "Members will see this event marked as cancelled."
          }
          confirmLabel={confirmCancel === "delete" ? "Delete event" : "Cancel event"}
          busy={busy}
          onCancel={() => setConfirmCancel(null)}
          onConfirm={handleCancelOrDelete}
        />
      )}

      {myRole === "member" && event && !event.isCancelled && (
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