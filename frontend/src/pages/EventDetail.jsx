// pages/EventDetail.jsx

import { useParams } from "react-router-dom"; 


const RESPONSE_LABELS = { no_response: "No response", going: "Going", maybe: "Maybe", cant_make_it: "Can't make it" }; 

export default function EventDetail() { 
  const { groupId, eventId } = useParams(); 

  return ( 
    <div className="content-area">
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
          </div> 
        </> 
      )} 
    </div> 
  ); 
} 