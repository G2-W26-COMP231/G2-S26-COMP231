// pages/CreateEvent.jsx

import { useState } from "react";  
import { useNavigate, useParams } from "react-router-dom";          
import client from "../api/client"; 

export default function CreateEvent() {
  const { groupId } = useParams();                                    
  const navigate = useNavigate();                                     

const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

 async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!title.trim() || !location.trim() || !date || !time) {
      setError("Title, location, date, and time are required.");
      return;
    }
    const startTime = new Date(`${date}T${time}`);
    if (Number.isNaN(startTime.getTime())) {
      setError("Please enter a valid date and time.");
      return;
    }
    if (startTime.getTime() < Date.now()) {
      setError("Event date cannot be in the past.");
      return;
    }

    setBusy(true);
    try {
      const res = await client.post(`/groups/${groupId}/events`, {
        title,
        location,
        startTime: startTime.toISOString(),
        description,
      });

      navigate(`/groups/${groupId}/events/${res.data.event._id}`);
    } catch (err) {
      setError(
        err.response?.data?.error || "Could not create the event."
      );
    } finally {
      setBusy(false);
    }
  }
  
  return (
    <div className="content-area" style={{ maxWidth: 480 }}>
      <h1>Create Event</h1>
      <form onSubmit={handleSubmit}>
        <label htmlFor="title">Title</label>

        <label htmlFor="location">Location</label>

        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          <div style={{ flex: 1 }}>
            <label htmlFor="date">Date</label>
          </div>
          <div style={{ flex: 1 }}>
            <label htmlFor="time">Time</label>
          </div>
        </div>

        <label htmlFor="description">Description (Optional)</label>
        <input id="description" value={description} onChange={(e) => setDescription(e.target.value)} maxLength={1000} />

        {error && <p className="error-text">{error}</p>}

        <div className="form-actions">
          <button type="submit" disabled={busy}>{busy ? "Creating..." : "Create Event"}</button>
          <button type="button" className="secondary" onClick={() => navigate(`/groups/${groupId}/events`)}>Cancel</button>
        </div>
      </form>
    </div>
  );
}