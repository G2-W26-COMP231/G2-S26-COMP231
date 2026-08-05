import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import client from "../../api/client";
import AdminTabs from "./AdminTabs";

export default function AdminGroups() {
  const [groups, setGroups] = useState(null);
  const [error, setError] = useState("");

  function load() {
    client
      .get("/admin/groups")
      .then((res) => setGroups(res.data.groups))
      .catch((err) => setError(err.response?.data?.error || "Could not load groups."));
  }

  useEffect(load, []);

   return (
    <div className="content-area">
      <AdminTabs />
      {error && <p className="error-text">{error}</p>}
      {groups === null && !error && <p className="muted">Loading...</p>}
      {groups && groups.length === 0 && <div className="empty-state">No groups yet.</div>}
     <div className="card">
        {groups && groups.map((g) => (
          <div className="list-row" key={g._id}>
            <span>
              {g.name} <span className="muted">— {g.memberCount} members · organized by {g.organizerId?.name || "Unknown"}</span>
            </span>
              <Link to={`/admin/groups/${g._id}`}><button className="secondary">View</button></Link>
             </div>
          ))}
      </div>
    </div>
  );
} 