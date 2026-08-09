import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { getInitialTheme, applyTheme } from "../theme";

const PREFS_KEY = "crewup_notification_prefs";

/**
 * Displays the user's account and application settings.
 * Users can change the theme and manage their notification preferences.
 */
function loadPrefs() {
  try {
    return { messageBell: true, inviteBell: true, ...JSON.parse(localStorage.getItem(PREFS_KEY) || "{}") };
  } catch {
    return { messageBell: true, inviteBell: true };
  }
}

export default function Settings() {
  const { user, logout } = useAuth();
  const [prefs, setPrefs] = useState(loadPrefs);
  const [saved, setSaved] = useState(false);
  const [theme, setTheme] = useState(getInitialTheme);

  function handleThemeChange(next) {
    setTheme(next);
    applyTheme(next);
  }

  useEffect(() => {
    if (!saved) return;
    const t = setTimeout(() => setSaved(false), 2000);
    return () => clearTimeout(t);
  }, [saved]);

  function toggle(key) {
    setPrefs((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function handleSave() {
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
    setSaved(true);
  }

  if (!user) return null;

  return (
    <div className="content-area" style={{ maxWidth: 560 }}>
      <div className="page-topbar">
        <div>
          <h1>Settings</h1>
          <p className="subtitle">Manage your account and notification preferences</p>
        </div>
      </div>

      {/* Account */}
      <h2>Account</h2>
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="list-row">
          <span className="muted">Name</span>
          <span>{user.name}</span>
        </div>
        <div className="list-row">
          <span className="muted">Email</span>
          <span>{user.email}</span>
        </div>
        <div className="list-row">
          <span className="muted">Role</span>
          <span className="role-badge">{user.role === "admin" ? "Administrator" : "Member"}</span>
        </div>
        <p className="muted" style={{ fontSize: "0.85rem", margin: "12px 0 0" }}>
          Need to update your name or email? Reach out to your group organizer or an administrator.
        </p>
      </div>

      {/* Appearance */}
      <h2>Appearance</h2>
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="muted" style={{ marginBottom: 12 }}>Theme</div>
        <div style={{ display: "flex", gap: 10 }}>
          <button
            className={theme === "light" ? "" : "secondary"}
            onClick={() => handleThemeChange("light")}
          >
            ☀️ Light
          </button>
          <button
            className={theme === "dark" ? "" : "secondary"}
            onClick={() => handleThemeChange("dark")}
          >
            🌙 Dark
          </button>
        </div>
      </div>

      {/* Notifications */}
      <h2>Notifications</h2>
      <div className="card" style={{ marginBottom: 24 }}>
        <label style={{ display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer" }}>
          <span>
            <div>Message notifications</div>
            <div className="muted" style={{ fontSize: "0.85rem" }}>Show the recent-messages bell in the top bar</div>
          </span>
          <input
            type="checkbox"
            style={{ width: "auto", height: "auto" }}
            checked={prefs.messageBell}
            onChange={() => toggle("messageBell")}
          />
        </label>
        <hr style={{ border: "none", borderTop: "1px solid var(--border)", margin: "14px 0" }} />
        <label style={{ display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer" }}>
          <span>
            <div>Invitation notifications</div>
            <div className="muted" style={{ fontSize: "0.85rem" }}>Show the invitations bell in the top bar</div>
          </span>
          <input
            type="checkbox"
            style={{ width: "auto", height: "auto" }}
            checked={prefs.inviteBell}
            onChange={() => toggle("inviteBell")}
          />
        </label>

        <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 20 }}>
          <button onClick={handleSave}>Save preferences</button>
          {saved && <span className="muted" style={{ fontSize: "0.85rem" }}>Saved.</span>}
        </div>
      </div>

      {/* Danger zone */}
      <h2>Session</h2>
      <div className="card">
        <p className="muted" style={{ marginTop: 0 }}>Sign out of CrewUp on this device.</p>
        <button className="danger" onClick={logout}>Log out</button>
      </div>
    </div>
  );
}