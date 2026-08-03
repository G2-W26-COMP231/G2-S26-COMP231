import AdminTabs from "./AdminTabs";

export default function AdminUsers() {
  return (
    <div className="content-area">
      <AdminTabs />
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