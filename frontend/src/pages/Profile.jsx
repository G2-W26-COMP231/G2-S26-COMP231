import { useAuth } from "../context/AuthContext";

export default function Profile() {
  const { user, logout } = useAuth();

  if (!user) return null;

  return (
    <div className="content-area" style={{ maxWidth: 480 }}>
      <h1>Profile</h1>
      <div className="card">
        <div style={{ fontWeight: 700, fontSize: "1.1rem" }}>{user.name}</div>
        <div className="muted" style={{ marginBottom: 20 }}>{user.email}</div>
        <button className="danger" onClick={logout}>Log out</button>
      </div>
    </div>
  );
}