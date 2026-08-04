import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import client from "../../api/client";
import AdminTabs from "./AdminTabs";

export default function AdminUsers() {
  const [users, setUsers] = useState(null);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");

  function load() {
    client
      .get("/admin/users", { params: search ? { search } : {} })
      .then((res) => setUsers(res.data.users))
      .catch((err) => setError(err.response?.data?.error || "Could not load users."));
  }
  useEffect(load, []);
  return (
    <div className="content-area">
      <AdminTabs />
      <form onSubmit={(e) => { e.preventDefault(); load(); }} style={{ marginBottom: 16 }}>
        <input placeholder="Search by name or email..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ maxWidth: 320 }} />
      </form>
      {error && <p className="error-text">{error}</p>}
      {users === null && !error && <p className="muted">Loading...</p>}
      {users && users.length === 0 && <div className="empty-state">No users found.</div>}
      <div className="card">
        {users && users.map((u) => (
          <div className="list-row" key={u._id}>
            <span>
              {u.name} <span className="muted">({u.email})</span>{" "}
              {u.role === "admin" && <span className="role-badge">Admin</span>}
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span className="status-pill">{u.status}</span>
              <Link to={`/admin/users/${u._id}`}><button className="secondary">View</button></Link>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}