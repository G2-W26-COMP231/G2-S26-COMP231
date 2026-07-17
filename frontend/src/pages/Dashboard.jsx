// pages/Dashboard.jsx

import { useEffect, useState } from "react";                    
import { Link } from "react-router-dom";                          
import client from "../api/client";                                
import NotificationBell from "../components/NotificationBell";      

export default function Dashboard() {
  const [groups, setGroups] = useState(null);                       
  const [error, setError] = useState("");                            

  useEffect(() => {                                                  
    client
      .get("/groups/mine")                                            
      .then((res) => setGroups(res.data.groups))                       
      .catch((err) => setError(err.response?.data?.error || "Could not load your groups.")); 
  }, []);

  return (
    <div className="content-area">
      <div className="page-topbar">                                    
        <div>
          <h1>Your Groups</h1>                                          
          <p className="subtitle">Groups where you are the organizer, and regular member</p>
        </div>
        <div className="icons">
          <span className="icon-btn" title="Chat">💬</span>             
          <NotificationBell />                                           
        </div>
      </div>

      {error && <p className="error-text">{error}</p>}                  
      {groups === null && !error && <p className="muted">Loading...</p>} 
      {groups && groups.length === 0 && (                                
        <div className="empty-state">You're not in any groups yet. Create one to get started.</div>
      )}

      {groups && groups.map((g) => {                                     
        const isOrganizer = g.myRole === "organizer";                     
        return isOrganizer ? (                                            
          <div className="group-card" key={g._id}>
            <div>
              <div style={{ fontWeight: 700, fontSize: "1.05rem" }}>{g.name}</div>
              <div className="muted">
                {new Date(g.createdAt).toLocaleDateString()} · {g.myRole}
              </div>
            </div>
            <Link to={`/groups/${g._id}`}><button>Manage</button></Link> {/* Task 6.4 (Aadil) - M9 */}
          </div>
        ) : (                                                              
          <Link to={`/groups/${g._id}`} key={g._id} style={{ textDecoration: "none", color: "inherit" }}>
            <div className="group-card clickable">
              <div>
                <div style={{ fontWeight: 700, fontSize: "1.05rem" }}>{g.name}</div>
                <div className="muted">
                  {new Date(g.createdAt).toLocaleDateString()} · {g.myRole}
                </div>
              </div>
              <span className="muted">Open →</span>                       
            </div>
          </Link>
        );
      })}

      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 20 }}> 
        <Link to="/groups/new"><button>+ Create Group</button></Link>              
      </div>
    </div>
  );
}