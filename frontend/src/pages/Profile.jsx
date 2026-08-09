import { useAuth } from "../context/AuthContext";

/**
 * Gets the initials from the user's full name.
 * The initials are displayed inside the profile avatar.
 */
function getInitials(name) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] || "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
}

/**
 * Displays the current user's account and profile information.
 * It shows their name, email, account status, and member date.
 */
export default function Profile() {
  const { user, logout } = useAuth();

  if (!user) return null;

  const memberSince = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString(undefined, { month: "long", year: "numeric" })
    : null;

  return (
    <div className="content-area" style={{ maxWidth: 560 }}>
      <div className="page-topbar">
        <div>
          <h1>Profile</h1>
          <p className="subtitle">Your account details</p>
        </div>
      </div>

      <div className="card" style={{ padding: 28 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 18, marginBottom: 24 }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: "50%",
              background: "var(--brand)",
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.4rem",
              fontWeight: 700,
              flexShrink: 0,
            }}
          >
            {getInitials(user.name)}
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: "1.2rem", display: "flex", alignItems: "center", gap: 8 }}>
              {user.name}
              {user.role === "admin" && (
                <span
                  style={{
                    fontSize: "0.62rem",
                    fontWeight: 700,
                    letterSpacing: "0.03em",
                    padding: "2px 8px",
                    borderRadius: 999,
                    background: "var(--brand)",
                    color: "#fff",
                  }}
                >
                  ADMIN
                </span>
              )}
            </div>
            <div className="muted">{user.email}</div>
          </div>
        </div>

        <div style={{ borderTop: "1px solid var(--border)", paddingTop: 20, display: "grid", gap: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span className="muted">Full name</span>
            <span>{user.name}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span className="muted">Email</span>
            <span>{user.email}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span className="muted">Account status</span>
            <span className="status-pill">{user.status || "active"}</span>
          </div>
          {memberSince && (
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span className="muted">Member since</span>
              <span>{memberSince}</span>
            </div>
          )}
        </div>

        <div style={{ borderTop: "1px solid var(--border)", marginTop: 20, paddingTop: 20 }}>
          <button className="danger" onClick={logout}>Log out</button>
        </div>
      </div>
    </div>
  );
}